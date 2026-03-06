import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, requireRider, AuthRequest } from '../middleware/auth';

const router = Router();

// All rider routes require authentication + rider/admin role
router.use(authenticate, requireRider);

// GET /api/rider/deliveries — Orders assigned to this rider
router.get('/deliveries', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const isAdmin = req.user!.role === 'admin';

        const result = await query(`
            SELECT o.id, o.order_number, o.status, o.created_at,
                   o.shipping_first_name, o.shipping_last_name,
                   o.shipping_phone, o.guest_phone,
                   o.shipping_address_line1, o.shipping_address_line2,
                   o.shipping_city, o.shipping_region,
                   (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
            FROM orders o
            WHERE o.payment_status = 'paid'
              AND o.status = 'shipped'
              AND (o.rider_id = $1 OR $2::boolean)
            ORDER BY o.created_at ASC
        `, [userId, isAdmin]);

        res.json(result.rows.map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            status: o.status,
            createdAt: o.created_at,
            customer: {
                name: `${o.shipping_first_name} ${o.shipping_last_name}`,
                phone: o.shipping_phone || o.guest_phone || '',
            },
            address: {
                line1: o.shipping_address_line1,
                line2: o.shipping_address_line2 || '',
                city: o.shipping_city,
                region: o.shipping_region || '',
            },
            itemCount: parseInt(o.item_count),
        })));
    } catch (err) {
        console.error('Rider deliveries error:', err);
        res.status(500).json({ error: 'Failed to load deliveries' });
    }
});

// GET /api/rider/stats — Quick stats for the rider
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const userId = req.user!.userId;
        const isAdmin = req.user!.role === 'admin';

        const [pendingRes, deliveredTodayRes, deliveredAllRes] = await Promise.all([
            query(`SELECT COUNT(*) as count FROM orders WHERE payment_status = 'paid' AND status = 'shipped' AND (rider_id = $1 OR $2::boolean)`, [userId, isAdmin]),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'delivered' AND updated_at >= $1 AND (rider_id = $2 OR $3::boolean)`, [today.toISOString(), userId, isAdmin]),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'delivered' AND (rider_id = $1 OR $2::boolean)`, [userId, isAdmin]),
        ]);

        res.json({
            pendingDelivery: parseInt(pendingRes.rows[0].count),
            deliveredToday: parseInt(deliveredTodayRes.rows[0].count),
            totalDelivered: parseInt(deliveredAllRes.rows[0].count),
        });
    } catch (err) {
        console.error('Rider stats error:', err);
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

// PATCH /api/rider/deliveries/:id/delivered — Mark as delivered
router.patch('/deliveries/:id/delivered', async (req: AuthRequest, res: Response) => {
    try {
        await query(
            `UPDATE orders SET status = 'delivered' WHERE id = $1 AND status = 'shipped'`,
            [req.params.id]
        );
        res.json({ message: 'Order marked as delivered' });
    } catch (err) {
        console.error('Mark delivered error:', err);
        res.status(500).json({ error: 'Failed to mark as delivered' });
    }
});

export default router;
