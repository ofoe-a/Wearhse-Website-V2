import { query } from '../db';

async function addPrintedStatus() {
    try {
        // Drop existing constraint and re-add with 'printed' included
        await query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`);
        await query(`ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'confirmed', 'processing', 'printed', 'shipped', 'delivered', 'cancelled'))`);
        console.log('✅ Added "printed" to order status constraint');
        process.exit(0);
    } catch (err) {
        console.error('Failed to add printed status:', err);
        process.exit(1);
    }
}

addPrintedStatus();
