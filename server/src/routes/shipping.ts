import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/shipping/zones — Public: fetch active shipping zones for checkout
router.get('/zones', async (_req: Request, res: Response) => {
    try {
        const result = await query(
            'SELECT id, name, label, description, cost_pesewas FROM shipping_zones WHERE active = true ORDER BY sort_order ASC'
        );
        res.json(result.rows.map((z: any) => ({
            id: z.name,             // use "name" as the zone ID for frontend (e.g. "accra")
            label: z.label,
            description: z.description,
            cost: z.cost_pesewas / 100, // GHS for frontend display
            costPesewas: z.cost_pesewas,
        })));
    } catch (err) {
        console.error('Fetch shipping zones error:', err);
        res.status(500).json({ error: 'Failed to fetch shipping zones' });
    }
});

export default router;
