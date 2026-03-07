import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { initializeTransaction, generateReference } from '../services/paystack';
import { sendShippingUpdate } from '../services/email';

const router = Router();

// POST /api/orders/checkout — Create order + initialize Paystack payment
router.post('/checkout', async (req: Request, res: Response) => {
    try {
        const {
            email,
            phone,
            userId, // optional — null for guest checkout
            shipping,
            items, // [{ variantId, quantity }]
        } = req.body;

        if (!email || !shipping || !items || items.length === 0) {
            res.status(400).json({ error: 'Email, shipping address, and items are required' });
            return;
        }

        // Validate items and calculate totals
        let subtotal = 0;
        const orderItems: Array<{
            variantId: string;
            productName: string;
            colorName: string;
            size: string;
            quantity: number;
            unitPrice: number;
        }> = [];

        for (const item of items) {
            const variantResult = await query(`
                SELECT v.id, v.price_pesewas, v.stock, v.color_name, v.size, p.name as product_name
                FROM product_variants v
                JOIN products p ON p.id = v.product_id
                WHERE v.id = $1
            `, [item.variantId]);

            if (variantResult.rows.length === 0) {
                res.status(400).json({ error: `Variant ${item.variantId} not found` });
                return;
            }

            const variant = variantResult.rows[0];

            // Check stock
            if (variant.stock < item.quantity) {
                res.status(400).json({
                    error: `Insufficient stock for ${variant.product_name} (${variant.color_name}, ${variant.size}). Available: ${variant.stock}`
                });
                return;
            }

            subtotal += variant.price_pesewas * item.quantity;
            orderItems.push({
                variantId: variant.id,
                productName: variant.product_name,
                colorName: variant.color_name,
                size: variant.size,
                quantity: item.quantity,
                unitPrice: variant.price_pesewas,
            });
        }

        // Zone-based shipping — look up cost from DB
        const shippingZone = shipping.zone || '';
        let shippingCost = 0;
        if (shippingZone) {
            const zoneResult = await query(
                'SELECT cost_pesewas FROM shipping_zones WHERE name = $1 AND active = true',
                [shippingZone]
            );
            if (zoneResult.rows.length === 0) {
                res.status(400).json({ error: `Unknown shipping zone: ${shippingZone}` });
                return;
            }
            shippingCost = zoneResult.rows[0].cost_pesewas;
        }
        const total = subtotal + shippingCost;

        // Generate Paystack reference
        const reference = generateReference();

        // Create order
        const orderResult = await query(`
            INSERT INTO orders (
                user_id, guest_email, guest_phone,
                shipping_first_name, shipping_last_name, shipping_phone,
                shipping_address_line1, shipping_address_line2,
                shipping_city, shipping_region,
                subtotal_pesewas, shipping_pesewas, total_pesewas,
                paystack_reference
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id, order_number
        `, [
            userId || null,
            userId ? null : email,
            userId ? null : phone,
            shipping.firstName, shipping.lastName, shipping.phone || null,
            shipping.addressLine1, shipping.addressLine2 || null,
            shipping.city, shipping.region || null,
            subtotal, shippingCost, total,
            reference,
        ]);

        const order = orderResult.rows[0];

        // Insert order items + reserve stock
        for (const item of orderItems) {
            await query(`
                INSERT INTO order_items (order_id, variant_id, product_name, color_name, size, quantity, unit_price_pesewas)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [order.id, item.variantId, item.productName, item.colorName, item.size, item.quantity, item.unitPrice]);

            // Decrement stock
            await query(
                'UPDATE product_variants SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.variantId]
            );
        }

        // Initialize Paystack transaction
        const paystack = await initializeTransaction({
            email,
            amount: total,
            reference,
            metadata: {
                orderId: order.id,
                orderNumber: order.order_number,
            },
            callback_url: `${(process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim()}/order/verify?reference=${reference}`,
        });

        // Store access code
        await query(
            'UPDATE orders SET paystack_access_code = $1 WHERE id = $2',
            [paystack.data.access_code, order.id]
        );

        res.status(201).json({
            orderId: order.id,
            orderNumber: order.order_number,
            reference,
            authorizationUrl: paystack.data.authorization_url,
            accessCode: paystack.data.access_code,
            total: total / 100, // GHS
        });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Checkout failed' });
    }
});

// GET /api/orders/verify/:reference — Verify payment after Paystack redirect
router.get('/verify/:reference', async (req: Request, res: Response) => {
    try {
        const { verifyTransaction } = await import('../services/paystack');
        const result = await verifyTransaction(req.params.reference as string);

        if (result.data.status === 'success') {
            const orderRes = await query(
                `UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE paystack_reference = $1
                 RETURNING order_number, total_pesewas, guest_email`,
                [req.params.reference]
            );
            const order = orderRes.rows[0];
            res.json({
                status: 'success',
                message: 'Payment verified',
                orderNumber: order?.order_number || '',
                total: order ? order.total_pesewas / 100 : 0,
                email: order?.guest_email || '',
            });
        } else {
            // Restore stock on failed payment
            const orderResult = await query(
                'SELECT id FROM orders WHERE paystack_reference = $1',
                [req.params.reference]
            );

            if (orderResult.rows.length > 0) {
                const orderId = orderResult.rows[0].id;
                const itemsResult = await query(
                    'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
                    [orderId]
                );
                for (const item of itemsResult.rows) {
                    await query(
                        'UPDATE product_variants SET stock = stock + $1 WHERE id = $2',
                        [item.quantity, item.variant_id]
                    );
                }
                await query(
                    `UPDATE orders SET payment_status = 'failed', status = 'cancelled' WHERE id = $1`,
                    [orderId]
                );
            }

            res.json({ status: 'failed', message: 'Payment not successful' });
        }
    } catch (err) {
        console.error('Verify error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// GET /api/orders/track — Public order tracking by order number + email
router.get('/track', async (req: Request, res: Response) => {
    try {
        const { orderNumber, email } = req.query;

        if (!orderNumber || !email) {
            res.status(400).json({ error: 'Order number and email are required' });
            return;
        }

        const result = await query(`
            SELECT o.order_number, o.status, o.payment_status,
                   o.subtotal_pesewas, o.shipping_pesewas, o.total_pesewas,
                   o.shipping_city, o.shipping_region,
                   o.created_at,
                   json_agg(jsonb_build_object(
                       'productName', oi.product_name,
                       'colorName', oi.color_name,
                       'size', oi.size,
                       'quantity', oi.quantity
                   )) AS items
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE o.order_number = $1 AND (o.guest_email = $2 OR o.user_id IN (SELECT id FROM users WHERE email = $2))
            GROUP BY o.id
        `, [orderNumber, email]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Order not found. Check your order number and email.' });
            return;
        }

        const order = result.rows[0];
        res.json({
            orderNumber: order.order_number,
            status: order.status,
            paymentStatus: order.payment_status,
            subtotal: order.subtotal_pesewas / 100,
            shipping: order.shipping_pesewas / 100,
            total: order.total_pesewas / 100,
            city: order.shipping_city,
            region: order.shipping_region,
            createdAt: order.created_at,
            items: order.items,
        });
    } catch (err) {
        console.error('Track order error:', err);
        res.status(500).json({ error: 'Failed to track order' });
    }
});

// GET /api/orders/my — Get current user's orders
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(`
            SELECT o.id, o.order_number, o.status, o.payment_status,
                   o.subtotal_pesewas, o.shipping_pesewas, o.total_pesewas,
                   o.created_at,
                   json_agg(jsonb_build_object(
                       'productName', oi.product_name,
                       'colorName', oi.color_name,
                       'size', oi.size,
                       'quantity', oi.quantity,
                       'unitPrice', oi.unit_price_pesewas
                   )) AS items
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [req.user!.userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders — List all orders (admin only)
router.get('/', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
        const result = await query(`
            SELECT o.*,
                   json_agg(jsonb_build_object(
                       'productName', oi.product_name,
                       'colorName', oi.color_name,
                       'size', oi.size,
                       'quantity', oi.quantity,
                       'unitPrice', oi.unit_price_pesewas
                   )) AS items
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT 50
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('List orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// PATCH /api/orders/:id/status — Update order status (admin only)
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const valid = ['pending', 'confirmed', 'processing', 'printed', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled'];

        if (!valid.includes(status)) {
            res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
            return;
        }

        await query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);

        // Send shipping update email (fire-and-forget)
        const orderData = await query(`
            SELECT o.order_number, o.guest_email, o.shipping_first_name, u.email as user_email
            FROM orders o LEFT JOIN users u ON u.id = o.user_id
            WHERE o.id = $1
        `, [req.params.id]);
        const o = orderData.rows[0];
        if (o) {
            sendShippingUpdate({
                email: o.guest_email || o.user_email,
                orderNumber: o.order_number,
                firstName: o.shipping_first_name,
                status,
            }).catch(() => {});
        }

        res.json({ message: 'Order status updated' });
    } catch (err) {
        console.error('Update order status error:', err);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

export default router;
