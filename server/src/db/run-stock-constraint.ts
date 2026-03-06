import { query } from '../db';

async function run() {
    try {
        await query(`
            ALTER TABLE product_variants
            ADD CONSTRAINT stock_non_negative CHECK (stock >= 0)
        `);
        console.log('✓ Added stock >= 0 constraint to product_variants');
    } catch (err: any) {
        if (err.message?.includes('already exists')) {
            console.log('✓ Constraint already exists — nothing to do');
        } else {
            console.error('✗ Failed:', err.message);
        }
    }
    process.exit(0);
}

run();
