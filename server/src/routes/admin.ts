import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// GET /api/admin/dashboard — Aggregated stats
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            ordersRes, revenueRes, pendingRes, lowStockRes,
            processingRes, confirmedRes, shippedRes, deliveredRes,
            todayOrdersRes, todayRevenueRes, recentRes, needsAttentionRes,
            readyForPickupRes,
        ] = await Promise.all([
            query('SELECT COUNT(*) as count FROM orders'),
            query(`SELECT COALESCE(SUM(total_pesewas), 0) as total FROM orders WHERE payment_status = 'paid'`),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending' AND payment_status = 'paid'`),
            query('SELECT COUNT(*) as count FROM product_variants WHERE stock < 5'),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'processing'`),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'confirmed'`),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'`),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'`),
            query(`SELECT COUNT(*) as count FROM orders WHERE created_at >= $1`, [today.toISOString()]),
            query(`SELECT COALESCE(SUM(total_pesewas), 0) as total FROM orders WHERE payment_status = 'paid' AND created_at >= $1`, [today.toISOString()]),
            query(`
                SELECT o.id, o.order_number, o.status, o.payment_status,
                       o.total_pesewas, o.guest_email,
                       o.shipping_first_name, o.shipping_last_name,
                       o.created_at
                FROM orders o
                ORDER BY o.created_at DESC
                LIMIT 10
            `),
            // Orders that need attention: paid but still pending or confirmed
            query(`
                SELECT o.id, o.order_number, o.status, o.payment_status,
                       o.total_pesewas, o.guest_email,
                       o.shipping_first_name, o.shipping_last_name,
                       o.shipping_city, o.created_at
                FROM orders o
                WHERE o.payment_status = 'paid' AND o.status IN ('pending', 'confirmed', 'processing')
                ORDER BY o.created_at ASC
                LIMIT 20
            `),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'ready_for_pickup'`),
        ]);

        res.json({
            stats: {
                totalOrders: parseInt(ordersRes.rows[0].count),
                revenue: parseInt(revenueRes.rows[0].total) / 100,
                pendingOrders: parseInt(pendingRes.rows[0].count),
                lowStockItems: parseInt(lowStockRes.rows[0].count),
                processingOrders: parseInt(processingRes.rows[0].count),
                confirmedOrders: parseInt(confirmedRes.rows[0].count),
                shippedOrders: parseInt(shippedRes.rows[0].count),
                deliveredOrders: parseInt(deliveredRes.rows[0].count),
                todayOrders: parseInt(todayOrdersRes.rows[0].count),
                todayRevenue: parseInt(todayRevenueRes.rows[0].total) / 100,
                readyForPickup: parseInt(readyForPickupRes.rows[0].count),
            },
            recentOrders: recentRes.rows.map((o: any) => ({
                id: o.id,
                orderNumber: o.order_number,
                status: o.status,
                paymentStatus: o.payment_status,
                total: o.total_pesewas / 100,
                customer: o.guest_email || `${o.shipping_first_name} ${o.shipping_last_name}`,
                createdAt: o.created_at,
            })),
            needsAttention: needsAttentionRes.rows.map((o: any) => ({
                id: o.id,
                orderNumber: o.order_number,
                status: o.status,
                total: o.total_pesewas / 100,
                customer: o.guest_email || `${o.shipping_first_name} ${o.shipping_last_name}`,
                city: o.shipping_city,
                createdAt: o.created_at,
            })),
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

// GET /api/admin/orders — Paginated, filterable orders list
router.get('/orders', async (req: AuthRequest, res: Response) => {
    try {
        const { status, search, page = '1', limit = '20' } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        const params: any[] = [];
        const conditions: string[] = [];
        let idx = 1;

        if (status && status !== 'all') {
            conditions.push(`o.status = $${idx++}`);
            params.push(status);
        }
        if (search) {
            conditions.push(`(o.order_number ILIKE $${idx} OR o.guest_email ILIKE $${idx} OR o.shipping_first_name ILIKE $${idx} OR o.shipping_last_name ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const [countRes, ordersRes] = await Promise.all([
            query(`SELECT COUNT(*) FROM orders o ${where}`, params),
            query(`
                SELECT o.id, o.order_number, o.status, o.payment_status,
                       o.subtotal_pesewas, o.shipping_pesewas, o.total_pesewas,
                       o.guest_email, o.shipping_first_name, o.shipping_last_name,
                       o.created_at,
                       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
                FROM orders o
                ${where}
                ORDER BY o.created_at DESC
                LIMIT $${idx} OFFSET $${idx + 1}
            `, [...params, parseInt(limit as string), offset]),
        ]);

        res.json({
            orders: ordersRes.rows.map((o: any) => ({
                id: o.id,
                orderNumber: o.order_number,
                status: o.status,
                paymentStatus: o.payment_status,
                subtotal: o.subtotal_pesewas / 100,
                shipping: o.shipping_pesewas / 100,
                total: o.total_pesewas / 100,
                customer: o.guest_email || `${o.shipping_first_name} ${o.shipping_last_name}`,
                itemCount: parseInt(o.item_count),
                createdAt: o.created_at,
            })),
            total: parseInt(countRes.rows[0].count),
            page: parseInt(page as string),
            totalPages: Math.ceil(parseInt(countRes.rows[0].count) / parseInt(limit as string)),
        });
    } catch (err) {
        console.error('Admin orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/admin/orders/:id — Single order with full details
router.get('/orders/:id', async (req: AuthRequest, res: Response) => {
    try {
        const orderRes = await query(`
            SELECT o.* FROM orders o WHERE o.id = $1
        `, [req.params.id]);

        if (orderRes.rows.length === 0) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        const order = orderRes.rows[0];
        const itemsRes = await query(`
            SELECT oi.*, pv.color_hex
            FROM order_items oi
            LEFT JOIN product_variants pv ON pv.id = oi.variant_id
            WHERE oi.order_id = $1
        `, [order.id]);

        res.json({
            id: order.id,
            orderNumber: order.order_number,
            status: order.status,
            paymentStatus: order.payment_status,
            subtotal: order.subtotal_pesewas / 100,
            shipping: order.shipping_pesewas / 100,
            total: order.total_pesewas / 100,
            customer: {
                email: order.guest_email,
                phone: order.guest_phone,
                firstName: order.shipping_first_name,
                lastName: order.shipping_last_name,
            },
            shippingAddress: {
                firstName: order.shipping_first_name,
                lastName: order.shipping_last_name,
                phone: order.shipping_phone,
                addressLine1: order.shipping_address_line1,
                addressLine2: order.shipping_address_line2,
                city: order.shipping_city,
                region: order.shipping_region,
            },
            items: itemsRes.rows.map((i: any) => ({
                id: i.id,
                productName: i.product_name,
                colorName: i.color_name,
                colorHex: i.color_hex,
                size: i.size,
                quantity: i.quantity,
                unitPrice: i.unit_price_pesewas / 100,
            })),
            paystackReference: order.paystack_reference,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
        });
    } catch (err) {
        console.error('Admin order detail error:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// PATCH /api/admin/orders/:id/status — Update order status
router.patch('/orders/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const valid = ['pending', 'confirmed', 'processing', 'printed', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled'];
        if (!valid.includes(status)) {
            res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
            return;
        }
        await query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
        res.json({ message: 'Status updated', status });
    } catch (err) {
        console.error('Update order status error:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// GET /api/admin/ready-for-pickup — Orders waiting for rider assignment
router.get('/ready-for-pickup', async (_req: AuthRequest, res: Response) => {
    try {
        const result = await query(`
            SELECT o.id, o.order_number, o.created_at,
                   o.shipping_first_name, o.shipping_last_name, o.shipping_phone,
                   o.shipping_city, o.shipping_region,
                   (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
            FROM orders o
            WHERE o.payment_status = 'paid' AND o.status = 'ready_for_pickup'
            ORDER BY o.created_at ASC
        `);
        res.json(result.rows.map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            customer: `${o.shipping_first_name} ${o.shipping_last_name}`,
            phone: o.shipping_phone,
            city: o.shipping_city,
            region: o.shipping_region || '',
            itemCount: parseInt(o.item_count),
            createdAt: o.created_at,
        })));
    } catch (err) {
        console.error('Ready for pickup error:', err);
        res.status(500).json({ error: 'Failed to load ready for pickup orders' });
    }
});

// PATCH /api/admin/orders/:id/assign-rider — Assign rider and move to shipped
router.patch('/orders/:id/assign-rider', async (req: AuthRequest, res: Response) => {
    try {
        const { riderId } = req.body;
        if (!riderId) {
            res.status(400).json({ error: 'riderId is required' });
            return;
        }

        // Verify rider exists with rider role
        const riderRes = await query(
            `SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = 'rider'`,
            [riderId]
        );
        if (riderRes.rows.length === 0) {
            res.status(400).json({ error: 'Rider not found' });
            return;
        }

        // Assign rider and move to shipped
        const updateRes = await query(
            `UPDATE orders SET status = 'shipped', rider_id = $1 WHERE id = $2 AND status = 'ready_for_pickup' RETURNING id`,
            [riderId, req.params.id]
        );
        if (updateRes.rowCount === 0) {
            res.status(400).json({ error: 'Order not in ready_for_pickup status' });
            return;
        }

        const rider = riderRes.rows[0];
        res.json({
            message: 'Rider assigned',
            riderId,
            riderName: `${rider.first_name} ${rider.last_name}`,
        });
    } catch (err) {
        console.error('Assign rider error:', err);
        res.status(500).json({ error: 'Failed to assign rider' });
    }
});

// GET /api/admin/products — All products (including inactive)
router.get('/products', async (_req: AuthRequest, res: Response) => {
    try {
        const result = await query(`
            SELECT p.id, p.name, p.slug, p.category, p.featured, p.active, p.created_at,
                   COUNT(DISTINCT v.id) as variant_count,
                   COALESCE(SUM(v.stock), 0) as total_stock,
                   MIN(v.price_pesewas) as min_price,
                   (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) as thumbnail
            FROM products p
            LEFT JOIN product_variants v ON v.product_id = p.id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            category: p.category,
            featured: p.featured,
            active: p.active,
            variantCount: parseInt(p.variant_count),
            totalStock: parseInt(p.total_stock),
            minPrice: p.min_price ? p.min_price / 100 : 0,
            thumbnail: p.thumbnail,
            createdAt: p.created_at,
        })));
    } catch (err) {
        console.error('Admin products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/admin/products/:id — Single product with full details for editing
router.get('/products/:id', async (req: AuthRequest, res: Response) => {
    try {
        const prodRes = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (prodRes.rows.length === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        const p = prodRes.rows[0];

        const [variantsRes, imagesRes, detailsRes] = await Promise.all([
            query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY COALESCE(sort_order, 0), color_name, size', [p.id]),
            query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order', [p.id]),
            query('SELECT * FROM product_details WHERE product_id = $1 ORDER BY sort_order', [p.id]),
        ]);

        res.json({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            category: p.category,
            featured: p.featured,
            active: p.active,
            variants: variantsRes.rows.map((v: any) => ({
                id: v.id,
                colorName: v.color_name,
                colorHex: v.color_hex,
                size: v.size,
                pricePesewas: v.price_pesewas,
                sku: v.sku,
                stock: v.stock,
                sortOrder: v.sort_order ?? 0,
            })),
            images: imagesRes.rows.map((i: any) => ({
                id: i.id,
                url: i.url,
                altText: i.alt_text,
                colorName: i.color_name,
                sortOrder: i.sort_order,
                hero: i.hero || false,
            })),
            details: detailsRes.rows.map((d: any) => ({
                id: d.id,
                detail: d.detail,
                sortOrder: d.sort_order,
            })),
        });
    } catch (err) {
        console.error('Admin product detail error:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// PATCH /api/admin/variants/:id — Update variant price/stock
router.patch('/variants/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { stock, pricePesewas } = req.body;
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (stock !== undefined) { fields.push(`stock = $${idx++}`); values.push(stock); }
        if (pricePesewas !== undefined) { fields.push(`price_pesewas = $${idx++}`); values.push(pricePesewas); }
        if (req.body.sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(req.body.sortOrder); }

        if (fields.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }

        values.push(req.params.id);
        await query(`UPDATE product_variants SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        res.json({ message: 'Variant updated' });
    } catch (err) {
        console.error('Update variant error:', err);
        res.status(500).json({ error: 'Failed to update variant' });
    }
});

// POST /api/admin/products/:id/variants — Add new variants to an existing product
router.post('/products/:id/variants', async (req: AuthRequest, res: Response) => {
    try {
        const productId = req.params.id;
        const { variants } = req.body;

        if (!variants || !Array.isArray(variants) || variants.length === 0) {
            res.status(400).json({ error: 'Variants array required' });
            return;
        }

        const created = [];
        for (const v of variants) {
            const result = await query(
                `INSERT INTO product_variants (product_id, color_name, color_hex, size, price_pesewas, sku, stock, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [productId, v.colorName, v.colorHex, v.size, v.pricePesewas || 0, v.sku, v.stock || 0, v.sortOrder ?? 0]
            );
            created.push({ id: result.rows[0].id, ...v });
        }

        res.json({ message: `${created.length} variants created`, variants: created });
    } catch (err) {
        console.error('Create variants error:', err);
        res.status(500).json({ error: 'Failed to create variants' });
    }
});

// PATCH /api/admin/products/:id/reorder-colors — Update color sort_order for all variants of a product
router.patch('/products/:id/reorder-colors', async (req: AuthRequest, res: Response) => {
    try {
        const productId = req.params.id;
        const { colorOrder } = req.body; // Array of color names in desired order

        if (!colorOrder || !Array.isArray(colorOrder)) {
            res.status(400).json({ error: 'colorOrder array required' });
            return;
        }

        for (let i = 0; i < colorOrder.length; i++) {
            await query(
                `UPDATE product_variants SET sort_order = $1 WHERE product_id = $2 AND color_name = $3`,
                [i, productId, colorOrder[i]]
            );
        }

        res.json({ message: 'Color order updated' });
    } catch (err) {
        console.error('Reorder colors error:', err);
        res.status(500).json({ error: 'Failed to reorder colors' });
    }
});

// POST /api/admin/products/:id/images — Add new images to an existing product
router.post('/products/:id/images', async (req: AuthRequest, res: Response) => {
    try {
        const productId = req.params.id;
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            res.status(400).json({ error: 'Images array required' });
            return;
        }

        for (const img of images) {
            await query(
                `INSERT INTO product_images (product_id, color_name, url, alt_text, sort_order)
                 VALUES ($1, $2, $3, $4, $5)`,
                [productId, img.colorName || null, img.url, img.altText || null, img.sortOrder || 0]
            );
        }

        res.json({ message: `${images.length} images added` });
    } catch (err) {
        console.error('Create images error:', err);
        res.status(500).json({ error: 'Failed to add images' });
    }
});

// PATCH /api/admin/images/:id/hero — Toggle hero status on an image
router.patch('/images/:id/hero', async (req: AuthRequest, res: Response) => {
    try {
        const { hero } = req.body;
        if (typeof hero !== 'boolean') {
            res.status(400).json({ error: 'hero must be a boolean' });
            return;
        }
        await query('UPDATE product_images SET hero = $1 WHERE id = $2', [hero, req.params.id]);
        res.json({ message: hero ? 'Image added to carousel' : 'Image removed from carousel' });
    } catch (err) {
        console.error('Toggle hero error:', err);
        res.status(500).json({ error: 'Failed to update image' });
    }
});

// PATCH /api/admin/products/:id/images/reorder — Reorder images
router.patch('/products/:id/images/reorder', async (req: AuthRequest, res: Response) => {
    try {
        const { imageIds } = req.body; // array of image IDs in new order
        if (!Array.isArray(imageIds)) {
            res.status(400).json({ error: 'imageIds must be an array' });
            return;
        }
        for (let i = 0; i < imageIds.length; i++) {
            await query('UPDATE product_images SET sort_order = $1 WHERE id = $2 AND product_id = $3', [i, imageIds[i], req.params.id]);
        }
        res.json({ message: 'Image order updated' });
    } catch (err) {
        console.error('Reorder images error:', err);
        res.status(500).json({ error: 'Failed to reorder images' });
    }
});

// DELETE /api/admin/images/:id — Delete a product image
router.delete('/images/:id', async (req: AuthRequest, res: Response) => {
    try {
        const result = await query('DELETE FROM product_images WHERE id = $1 RETURNING url', [req.params.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Image not found' });
            return;
        }
        res.json({ message: 'Image deleted', url: result.rows[0].url });
    } catch (err) {
        console.error('Delete image error:', err);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// DELETE /api/admin/products/:id — Delete a product and all related data
router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check product exists
        const product = await query('SELECT id, name FROM products WHERE id = $1', [id]);
        if (product.rows.length === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // 1. Delete order items referencing this product's variants
        await query(`
            DELETE FROM order_items WHERE variant_id IN (
                SELECT id FROM product_variants WHERE product_id = $1
            )
        `, [id]);

        // 2. The rest cascades via ON DELETE CASCADE, but explicit is safer
        await query('DELETE FROM product_details WHERE product_id = $1', [id]);
        await query('DELETE FROM product_images WHERE product_id = $1', [id]);
        await query('DELETE FROM product_variants WHERE product_id = $1', [id]);
        await query('DELETE FROM products WHERE id = $1', [id]);

        res.json({ message: `Product "${product.rows[0].name}" deleted` });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// GET /api/admin/hero-images — List all hero images for preview
router.get('/hero-images', async (_req: AuthRequest, res: Response) => {
    try {
        const result = await query(`
            SELECT pi.id, pi.url, pi.color_name, pi.hero, p.name as product_name, p.id as product_id
            FROM product_images pi
            JOIN products p ON p.id = pi.product_id
            WHERE pi.hero = true
            ORDER BY p.name, pi.sort_order
        `);
        res.json(result.rows.map((r: any) => ({
            id: r.id,
            url: r.url,
            colorName: r.color_name,
            productName: r.product_name,
            productId: r.product_id,
        })));
    } catch (err) {
        console.error('Hero images error:', err);
        res.status(500).json({ error: 'Failed to fetch hero images' });
    }
});

// GET /api/admin/team — List all staff (admin, printer, rider)
router.get('/team', async (_req: AuthRequest, res: Response) => {
    try {
        const result = await query(`
            SELECT id, email, first_name, last_name, role, created_at
            FROM users WHERE role IN ('admin', 'printer', 'rider')
            ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'printer' THEN 1 WHEN 'rider' THEN 2 END, created_at ASC
        `);
        res.json(result.rows.map((u: any) => ({
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            role: u.role,
            createdAt: u.created_at,
        })));
    } catch (err) {
        console.error('Team list error:', err);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// POST /api/admin/team/invite — Create staff user (admin, printer, or rider)
router.post('/team/invite', async (req: AuthRequest, res: Response) => {
    try {
        const { email, firstName, lastName, password, role = 'admin' } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const validRoles = ['admin', 'printer', 'rider'];
        if (!validRoles.includes(role)) {
            res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
            return;
        }

        const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            // Update existing user's role
            await query(`UPDATE users SET role = $1 WHERE email = $2`, [role, email.toLowerCase()]);
            res.json({ message: `User updated to ${role}` });
            return;
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5)`,
            [email.toLowerCase(), passwordHash, firstName || null, lastName || null, role]
        );

        res.status(201).json({ message: 'Admin user created' });
    } catch (err) {
        console.error('Invite team error:', err);
        res.status(500).json({ error: 'Failed to invite team member' });
    }
});

// PATCH /api/admin/team/:id/role — Change user role
router.patch('/team/:id/role', async (req: AuthRequest, res: Response) => {
    try {
        const { role } = req.body;
        if (!['admin', 'customer'].includes(role)) {
            res.status(400).json({ error: 'Role must be admin or customer' });
            return;
        }

        // Prevent removing self
        if (req.params.id === req.user!.userId && role !== 'admin') {
            res.status(400).json({ error: 'Cannot remove your own admin access' });
            return;
        }

        await query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
        res.json({ message: 'Role updated' });
    } catch (err) {
        console.error('Update role error:', err);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// ── Shipping Zones CRUD ────────────────────────────

// GET /api/admin/shipping-zones — List all zones
router.get('/shipping-zones', async (_req: AuthRequest, res: Response) => {
    try {
        const result = await query('SELECT * FROM shipping_zones ORDER BY sort_order ASC, created_at ASC');
        res.json(result.rows.map((z: any) => ({
            id: z.id,
            name: z.name,
            label: z.label,
            description: z.description,
            costPesewas: z.cost_pesewas,
            active: z.active,
            sortOrder: z.sort_order,
        })));
    } catch (err) {
        console.error('List zones error:', err);
        res.status(500).json({ error: 'Failed to fetch zones' });
    }
});

// POST /api/admin/shipping-zones — Create zone
router.post('/shipping-zones', async (req: AuthRequest, res: Response) => {
    try {
        const { name, label, description, costPesewas, sortOrder } = req.body;
        if (!name || !label) {
            res.status(400).json({ error: 'Name and label are required' });
            return;
        }
        const result = await query(
            `INSERT INTO shipping_zones (name, label, description, cost_pesewas, sort_order)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [name, label, description || null, costPesewas || 0, sortOrder || 0]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Zone created' });
    } catch (err) {
        console.error('Create zone error:', err);
        res.status(500).json({ error: 'Failed to create zone' });
    }
});

// PATCH /api/admin/shipping-zones/:id — Update zone
router.patch('/shipping-zones/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { name, label, description, costPesewas, active, sortOrder } = req.body;
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
        if (label !== undefined) { fields.push(`label = $${idx++}`); values.push(label); }
        if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
        if (costPesewas !== undefined) { fields.push(`cost_pesewas = $${idx++}`); values.push(costPesewas); }
        if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }
        if (sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sortOrder); }

        if (fields.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }

        values.push(req.params.id);
        await query(`UPDATE shipping_zones SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        res.json({ message: 'Zone updated' });
    } catch (err) {
        console.error('Update zone error:', err);
        res.status(500).json({ error: 'Failed to update zone' });
    }
});

// DELETE /api/admin/shipping-zones/:id — Delete zone
router.delete('/shipping-zones/:id', async (req: AuthRequest, res: Response) => {
    try {
        await query('DELETE FROM shipping_zones WHERE id = $1', [req.params.id]);
        res.json({ message: 'Zone deleted' });
    } catch (err) {
        console.error('Delete zone error:', err);
        res.status(500).json({ error: 'Failed to delete zone' });
    }
});

export default router;
