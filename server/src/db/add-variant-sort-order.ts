import { query } from './index';

async function migrate() {
    console.log('Adding sort_order to product_variants...');

    // Add sort_order column (defaults to 0)
    await query(`
        ALTER TABLE product_variants
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);

    console.log('✅ sort_order column added to product_variants');

    // Set initial sort_order based on existing color order per product
    // Group by product, then assign incrementing sort_order by color_name appearance
    const products = await query('SELECT DISTINCT product_id FROM product_variants');
    for (const row of products.rows) {
        const colors = await query(
            `SELECT DISTINCT color_name FROM product_variants
             WHERE product_id = $1
             ORDER BY color_name`,
            [row.product_id]
        );
        for (let i = 0; i < colors.rows.length; i++) {
            await query(
                `UPDATE product_variants
                 SET sort_order = $1
                 WHERE product_id = $2 AND color_name = $3`,
                [i, row.product_id, colors.rows[i].color_name]
            );
        }
    }

    console.log('✅ Existing variants assigned sort_order values');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
