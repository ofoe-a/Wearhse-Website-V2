import dotenv from 'dotenv';
dotenv.config();

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './index';

async function runSchema() {
    console.log('Running schema against database...\n');

    const schemaPath = join(__dirname, 'schema.sql');
    const sql = readFileSync(schemaPath, 'utf8');

    try {
        await query(sql);
        console.log('✓ Schema applied successfully!');
        console.log('  Tables created: users, products, product_variants, product_images, product_details, addresses, orders, order_items');
        console.log('  Triggers created: order_number generator, updated_at auto-updater\n');
    } catch (err: any) {
        if (err.message?.includes('already exists')) {
            console.log('⚠ Some objects already exist — schema may have already been applied.');
        } else {
            throw err;
        }
    }

    process.exit(0);
}

runSchema().catch((err) => {
    console.error('Schema failed:', err);
    process.exit(1);
});
