import { query } from '../db';

async function addHeroColumn() {
    try {
        await query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS hero BOOLEAN DEFAULT FALSE`);
        console.log('✅ Added hero column to product_images');
        process.exit(0);
    } catch (err) {
        console.error('Failed to add hero column:', err);
        process.exit(1);
    }
}

addHeroColumn();
