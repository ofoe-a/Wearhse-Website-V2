import { Router, Request, Response } from 'express';
import { query } from '../db';
import { validateWebhookSignature } from '../services/paystack';
import { sendOrderConfirmation } from '../services/email';

const router = Router();

// POST /api/webhooks/paystack — Handle Paystack webhook events
router.post('/paystack', async (req: Request, res: Response) => {
    try {
        // Validate signature — use raw body buffer for accurate HMAC
        const signature = req.headers['x-paystack-signature'] as string;
        const rawBody = (req as any).rawBody
            ? (req as any).rawBody.toString()
            : JSON.stringify(req.body);

        if (!signature || !validateWebhookSignature(rawBody, signature)) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }

        const event = req.body;

        switch (event.event) {
            case 'charge.success': {
                const reference = event.data.reference;

                // Idempotent: only update if still pending (prevents duplicate processing)
                const result = await query(
                    `UPDATE orders SET payment_status = 'paid', status = 'confirmed'
                     WHERE paystack_reference = $1 AND payment_status = 'pending'
                     RETURNING id`,
                    [reference]
                );

                if (result.rowCount === 0) {
                    console.log(`⚠ Duplicate/stale charge.success for ${reference} — skipped`);
                } else {
                    console.log(`✓ Payment confirmed for ${reference}`);

                    // Send order confirmation email (fire-and-forget)
                    const orderId = result.rows[0].id;
                    const orderData = await query(`
                        SELECT o.order_number, o.guest_email, o.shipping_first_name, o.shipping_last_name,
                               o.shipping_address_line1, o.shipping_address_line2, o.shipping_city, o.shipping_region,
                               o.subtotal_pesewas, o.shipping_pesewas, o.total_pesewas,
                               u.email as user_email
                        FROM orders o
                        LEFT JOIN users u ON u.id = o.user_id
                        WHERE o.id = $1
                    `, [orderId]);
                    const o = orderData.rows[0];
                    if (o) {
                        const itemsData = await query(
                            'SELECT product_name, color_name, size, quantity, unit_price_pesewas FROM order_items WHERE order_id = $1',
                            [orderId]
                        );
                        sendOrderConfirmation({
                            orderNumber: o.order_number,
                            email: o.guest_email || o.user_email,
                            firstName: o.shipping_first_name,
                            items: itemsData.rows.map((i: any) => ({
                                productName: i.product_name,
                                colorName: i.color_name,
                                size: i.size,
                                quantity: i.quantity,
                                unitPrice: i.unit_price_pesewas,
                            })),
                            subtotal: o.subtotal_pesewas,
                            shipping: o.shipping_pesewas,
                            total: o.total_pesewas,
                            shippingAddress: {
                                firstName: o.shipping_first_name,
                                lastName: o.shipping_last_name,
                                addressLine1: o.shipping_address_line1,
                                addressLine2: o.shipping_address_line2,
                                city: o.shipping_city,
                                region: o.shipping_region,
                            },
                        }).catch(() => {}); // Never let email failure affect webhook
                    }
                }
                break;
            }

            case 'charge.failed': {
                const reference = event.data.reference;

                // Idempotent: only restore stock if order is still pending (not already cancelled/paid)
                const orderResult = await query(
                    `UPDATE orders SET payment_status = 'failed', status = 'cancelled'
                     WHERE paystack_reference = $1 AND payment_status = 'pending'
                     RETURNING id`,
                    [reference]
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
                    console.log(`✗ Payment failed for ${reference} — stock restored`);
                } else {
                    console.log(`⚠ Duplicate/stale charge.failed for ${reference} — skipped`);
                }
                break;
            }

            default:
                console.log(`Unhandled Paystack event: ${event.event}`);
        }

        // Always return 200 to acknowledge webhook
        res.sendStatus(200);
    } catch (err) {
        console.error('Webhook error:', err);
        res.sendStatus(200); // Still acknowledge to prevent retries
    }
});

export default router;
