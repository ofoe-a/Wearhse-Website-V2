import dotenv from 'dotenv';
dotenv.config();

import { query } from './index';

async function seed() {
    console.log('Seeding WEARHSE database...\n');

    // ── "Ghana to the Wiase" Tee (single product, two color variants) ──
    const product = await query(`
        INSERT INTO products (name, slug, description, category, featured)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `, [
        '"Ghana to the Wiase" Tee',
        'ghana-to-the-wiase-tee',
        "Rep where you're from. The \"Ghana to the Wiase\" tee — oversized fit, premium cotton, and the culture on your chest.",
        'tops',
        true,
    ]);
    const productId = product.rows[0].id;

    // White variants (all sizes)
    for (const size of ['S', 'M', 'L', 'XL']) {
        await query(`
            INSERT INTO product_variants (product_id, color_name, color_hex, size, price_pesewas, sku, stock)
            VALUES ($1, 'White', '#ffffff', $2, 45000, $3, $4)
        `, [productId, size, `GTTW-WHT-${size}`, 25]);
    }

    // Black variants (all sizes)
    for (const size of ['S', 'M', 'L', 'XL']) {
        await query(`
            INSERT INTO product_variants (product_id, color_name, color_hex, size, price_pesewas, sku, stock)
            VALUES ($1, 'Black', '#1a1a1a', $2, 45000, $3, $4)
        `, [productId, size, `GTTW-BLK-${size}`, 25]);
    }

    // White images
    await query(`INSERT INTO product_images (product_id, color_name, url, alt_text, sort_order) VALUES ($1, 'White', '/uploads/ghana-to-the-wiase-white-front.webp', 'GTTW Tee White Front', 0)`, [productId]);
    await query(`INSERT INTO product_images (product_id, color_name, url, alt_text, sort_order) VALUES ($1, 'White', '/uploads/ghana-to-the-wiase-white-back.webp', 'GTTW Tee White Back', 1)`, [productId]);

    // Black images
    await query(`INSERT INTO product_images (product_id, color_name, url, alt_text, sort_order) VALUES ($1, 'Black', '/uploads/ghana-to-the-wiase-black-front.webp', 'GTTW Tee Black Front', 0)`, [productId]);
    await query(`INSERT INTO product_images (product_id, color_name, url, alt_text, sort_order) VALUES ($1, 'Black', '/uploads/ghana-to-the-wiase-black-couple.webp', 'GTTW Tee Black Couple', 1)`, [productId]);

    // Product details
    const details = ['100% Premium Cotton', 'Oversized Fit', 'Screen Printed', 'Handfinished in Accra'];
    for (let i = 0; i < details.length; i++) {
        await query(`INSERT INTO product_details (product_id, detail, sort_order) VALUES ($1, $2, $3)`, [productId, details[i], i]);
    }

    console.log('✓ "Ghana to the Wiase" Tee (White + Black variants)');

    // ── Create admin user ──
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('admin123', 12); // CHANGE THIS
    await query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ('ofoe@mahogana.com', $1, 'Ofoe', '', 'admin')
        ON CONFLICT (email) DO NOTHING
    `, [hash]);

    console.log('✓ Admin user created (ofoe@mahogana.com)\n');
    console.log('Done! Change the admin password ASAP.');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
