import { query } from '../db';

async function addRiderAssignment() {
    try {
        // 1. Add 'ready_for_pickup' to order status constraint
        await query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`);
        await query(`
            ALTER TABLE orders ADD CONSTRAINT orders_status_check
            CHECK (status IN ('pending', 'confirmed', 'processing', 'printed', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled'))
        `);
        console.log('✅ Added "ready_for_pickup" to order status constraint');

        // 2. Add rider_id column
        await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_id UUID REFERENCES users(id) ON DELETE SET NULL`);
        await query(`CREATE INDEX IF NOT EXISTS idx_orders_rider ON orders(rider_id)`);
        console.log('✅ Added rider_id column and index to orders table');

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

addRiderAssignment();
