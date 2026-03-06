import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/products — List all active products with variants + images
router.get('/', async (_req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT
                p.id, p.name, p.slug, p.description, p.category, p.featured,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'id', v.id,
                        'colorName', v.color_name,
                        'colorHex', v.color_hex,
                        'size', v.size,
                        'pricePesewas', v.price_pesewas,
                        'sku', v.sku,
                        'stock', v.stock,
                        'sortOrder', COALESCE(v.sort_order, 0)
                    )) FILTER (WHERE v.id IS NOT NULL), '[]'
                ) AS variants,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'id', pi.id,
                        'url', pi.url,
                        'altText', pi.alt_text,
                        'colorName', pi.color_name,
                        'sortOrder', pi.sort_order,
                        'hero', pi.hero
                    )) FILTER (WHERE pi.id IS NOT NULL), '[]'
                ) AS images,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'detail', pd.detail,
                        'sortOrder', pd.sort_order
                    )) FILTER (WHERE pd.id IS NOT NULL), '[]'
                ) AS details
            FROM products p
            LEFT JOIN product_variants v ON v.product_id = p.id
            LEFT JOIN product_images pi ON pi.product_id = p.id
            LEFT JOIN product_details pd ON pd.product_id = p.id
            WHERE p.active = true
            GROUP BY p.id
            ORDER BY p.featured DESC, p.created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('List products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/:slug — Get single product by slug
router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT
                p.id, p.name, p.slug, p.description, p.category, p.featured,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'id', v.id,
                        'colorName', v.color_name,
                        'colorHex', v.color_hex,
                        'size', v.size,
                        'pricePesewas', v.price_pesewas,
                        'sku', v.sku,
                        'stock', v.stock,
                        'sortOrder', COALESCE(v.sort_order, 0)
                    )) FILTER (WHERE v.id IS NOT NULL), '[]'
                ) AS variants,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'id', pi.id,
                        'url', pi.url,
                        'altText', pi.alt_text,
                        'colorName', pi.color_name,
                        'sortOrder', pi.sort_order,
                        'hero', pi.hero
                    )) FILTER (WHERE pi.id IS NOT NULL), '[]'
                ) AS images,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'detail', pd.detail,
                        'sortOrder', pd.sort_order
                    )) FILTER (WHERE pd.id IS NOT NULL), '[]'
                ) AS details
            FROM products p
            LEFT JOIN product_variants v ON v.product_id = p.id
            LEFT JOIN product_images pi ON pi.product_id = p.id
            LEFT JOIN product_details pd ON pd.product_id = p.id
            WHERE p.slug = $1 AND p.active = true
            GROUP BY p.id
        `, [req.params.slug]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get product error:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /api/products — Create product (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, slug, description, category, featured, variants, images, details } = req.body;

        if (!name || !slug) {
            res.status(400).json({ error: 'Name and slug are required' });
            return;
        }

        // Insert product
        const productResult = await query(
            `INSERT INTO products (name, slug, description, category, featured)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [name, slug, description || null, category || null, featured || false]
        );
        const productId = productResult.rows[0].id;

        // Insert variants
        if (variants && variants.length > 0) {
            for (const v of variants) {
                await query(
                    `INSERT INTO product_variants (product_id, color_name, color_hex, size, price_pesewas, sku, stock, sort_order)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [productId, v.colorName, v.colorHex, v.size, v.pricePesewas, v.sku, v.stock || 0, v.sortOrder ?? 0]
                );
            }
        }

        // Insert images
        if (images && images.length > 0) {
            for (const img of images) {
                await query(
                    `INSERT INTO product_images (product_id, color_name, url, alt_text, sort_order)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [productId, img.colorName || null, img.url, img.altText || null, img.sortOrder || 0]
                );
            }
        }

        // Insert details
        if (details && details.length > 0) {
            for (let i = 0; i < details.length; i++) {
                await query(
                    `INSERT INTO product_details (product_id, detail, sort_order)
                     VALUES ($1, $2, $3)`,
                    [productId, details[i], i]
                );
            }
        }

        res.status(201).json({ id: productId, message: 'Product created' });
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PATCH /api/products/:id — Update product (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, category, featured, active, details } = req.body;
        const productId = req.params.id;
        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
        if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
        if (category !== undefined) { fields.push(`category = $${idx++}`); values.push(category); }
        if (featured !== undefined) { fields.push(`featured = $${idx++}`); values.push(featured); }
        if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }

        if (fields.length > 0) {
            values.push(productId);
            await query(
                `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx}`,
                values
            );
        }

        // Update details (bullet points) — delete old + insert new
        if (details !== undefined && Array.isArray(details)) {
            await query('DELETE FROM product_details WHERE product_id = $1', [productId]);
            for (let i = 0; i < details.length; i++) {
                if (details[i].trim()) {
                    await query(
                        'INSERT INTO product_details (product_id, detail, sort_order) VALUES ($1, $2, $3)',
                        [productId, details[i], i]
                    );
                }
            }
        }

        res.json({ message: 'Product updated' });
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// PATCH /api/products/variants/:id/stock — Update variant stock (admin only)
router.patch('/variants/:id/stock', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { stock } = req.body;
        if (stock === undefined || stock < 0) {
            res.status(400).json({ error: 'Valid stock number required' });
            return;
        }

        await query('UPDATE product_variants SET stock = $1 WHERE id = $2', [stock, req.params.id]);
        res.json({ message: 'Stock updated' });
    } catch (err) {
        console.error('Update stock error:', err);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

export default router;
