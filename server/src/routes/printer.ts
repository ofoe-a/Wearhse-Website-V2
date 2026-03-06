import { Router, Response } from 'express';
import pool from '../db';
import { query } from '../db';
import { authenticate, requirePrinter, AuthRequest } from '../middleware/auth';

const router = Router();

// All printer routes require authentication + printer/admin role
router.use(authenticate, requirePrinter);

// GET /api/printer/queue — Orders in the print pipeline (confirmed + processing + printed)
router.get('/queue', async (_req: AuthRequest, res: Response) => {
    try {
        const result = await query(`
            SELECT o.id, o.order_number, o.status, o.created_at, o.updated_at,
                   json_agg(jsonb_build_object(
                       'productName', oi.product_name,
                       'colorName', oi.color_name,
                       'size', oi.size,
                       'quantity', oi.quantity
                   ) ORDER BY oi.product_name, oi.color_name) AS items
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            WHERE o.payment_status = 'paid'
              AND o.status IN ('confirmed', 'processing', 'printed', 'ready_for_pickup')
            GROUP BY o.id
            ORDER BY
                CASE o.status WHEN 'confirmed' THEN 0 WHEN 'processing' THEN 1 WHEN 'printed' THEN 2 WHEN 'ready_for_pickup' THEN 3 END,
                o.created_at ASC
        `);

        res.json(result.rows.map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            status: o.status,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            items: o.items,
        })));
    } catch (err) {
        console.error('Printer queue error:', err);
        res.status(500).json({ error: 'Failed to load print queue' });
    }
});

// GET /api/printer/stats — Quick stats for the printer
router.get('/stats', async (_req: AuthRequest, res: Response) => {
    try {
        const [confirmedRes, processingRes, printedRes, todayRes, dispatchedTodayRes] = await Promise.all([
            query(`SELECT COUNT(*) as count FROM orders WHERE payment_status = 'paid' AND status = 'confirmed'`),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'processing'`),
            query(`SELECT COUNT(*) as count FROM orders WHERE status = 'printed'`),
            query(`
                SELECT COUNT(*) as count FROM orders
                WHERE status IN ('confirmed', 'processing', 'printed')
                  AND payment_status = 'paid'
                  AND created_at >= CURRENT_DATE
            `),
            query(`
                SELECT COUNT(*) as count FROM orders
                WHERE status = 'ready_for_pickup'
                  AND updated_at >= CURRENT_DATE
            `),
        ]);

        res.json({
            awaitingPrint: parseInt(confirmedRes.rows[0].count),
            inProgress: parseInt(processingRes.rows[0].count),
            printed: parseInt(printedRes.rows[0].count),
            todayNew: parseInt(todayRes.rows[0].count),
            dispatchedToday: parseInt(dispatchedTodayRes.rows[0].count),
        });
    } catch (err) {
        console.error('Printer stats error:', err);
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

// PATCH /api/printer/orders/:id/start — Mark order as "processing" (printing started)
router.patch('/orders/:id/start', async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `UPDATE orders SET status = 'processing' WHERE id = $1 AND status = 'confirmed' RETURNING id`,
            [req.params.id]
        );
        if (result.rowCount === 0) {
            res.status(400).json({ error: 'Order not in correct status' });
            return;
        }
        res.json({ message: 'Order marked as printing' });
    } catch (err) {
        console.error('Start printing error:', err);
        res.status(500).json({ error: 'Failed to start printing' });
    }
});

// PATCH /api/printer/orders/:id/done — Mark order as "printed" (printing done, in holding zone)
router.patch('/orders/:id/done', async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `UPDATE orders SET status = 'printed' WHERE id = $1 AND status = 'processing' RETURNING id`,
            [req.params.id]
        );
        if (result.rowCount === 0) {
            res.status(400).json({ error: 'Order not in correct status' });
            return;
        }
        res.json({ message: 'Order marked as printed' });
    } catch (err) {
        console.error('Done printing error:', err);
        res.status(500).json({ error: 'Failed to complete printing' });
    }
});

// PATCH /api/printer/orders/:id/undo — Move order back one step
// processing → confirmed, printed → processing
router.patch('/orders/:id/undo', async (req: AuthRequest, res: Response) => {
    try {
        // Try processing → confirmed first
        let result = await query(
            `UPDATE orders SET status = 'confirmed' WHERE id = $1 AND status = 'processing' RETURNING id`,
            [req.params.id]
        );
        if (result.rowCount && result.rowCount > 0) {
            res.json({ message: 'Order moved back to queue', newStatus: 'confirmed' });
            return;
        }

        // Try printed → processing
        result = await query(
            `UPDATE orders SET status = 'processing' WHERE id = $1 AND status = 'printed' RETURNING id`,
            [req.params.id]
        );
        if (result.rowCount && result.rowCount > 0) {
            res.json({ message: 'Order moved back to printing', newStatus: 'processing' });
            return;
        }

        res.status(400).json({ error: 'Order cannot be undone from its current status' });
    } catch (err) {
        console.error('Undo error:', err);
        res.status(500).json({ error: 'Failed to undo' });
    }
});

// POST /api/printer/batch-dispatch — Move selected printed orders to shipped (rider queue)
router.post('/batch-dispatch', async (req: AuthRequest, res: Response) => {
    try {
        const { orderIds } = req.body;
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            res.status(400).json({ error: 'No orders selected' });
            return;
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Verify all orders are in 'printed' status
            const checkResult = await client.query(
                `SELECT id, status FROM orders WHERE id = ANY($1::uuid[])`,
                [orderIds]
            );

            const notPrinted = checkResult.rows.filter((r: any) => r.status !== 'printed');
            if (notPrinted.length > 0) {
                await client.query('ROLLBACK');
                res.status(400).json({
                    error: `${notPrinted.length} order(s) are not in "printed" status`,
                });
                return;
            }

            if (checkResult.rows.length !== orderIds.length) {
                await client.query('ROLLBACK');
                res.status(400).json({ error: 'Some orders were not found' });
                return;
            }

            // Move all to ready_for_pickup (admin will assign rider)
            const updateResult = await client.query(
                `UPDATE orders SET status = 'ready_for_pickup' WHERE id = ANY($1::uuid[]) AND status = 'printed' RETURNING id`,
                [orderIds]
            );

            // Count total items in the batch
            const itemsResult = await client.query(
                `SELECT COALESCE(SUM(oi.quantity), 0) as total_items
                 FROM order_items oi
                 WHERE oi.order_id = ANY($1::uuid[])`,
                [orderIds]
            );

            await client.query('COMMIT');

            res.json({
                message: 'Batch ready for pickup',
                ordersDispatched: updateResult.rowCount,
                totalItems: parseInt(itemsResult.rows[0].total_items),
            });
        } catch (innerErr) {
            await client.query('ROLLBACK');
            throw innerErr;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Batch dispatch error:', err);
        res.status(500).json({ error: 'Failed to dispatch batch' });
    }
});

export default router;
