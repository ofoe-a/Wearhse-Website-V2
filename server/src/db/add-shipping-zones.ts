import { query } from '../db';

async function run() {
    try {
        // Create table
        await query(`
            CREATE TABLE IF NOT EXISTS shipping_zones (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                label VARCHAR(150) NOT NULL,
                description TEXT,
                cost_pesewas INTEGER NOT NULL DEFAULT 0,
                active BOOLEAN DEFAULT TRUE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        console.log('✓ shipping_zones table created');

        // Seed default zones (skip if already populated)
        const existing = await query('SELECT COUNT(*) as count FROM shipping_zones');
        if (parseInt(existing.rows[0].count) === 0) {
            await query(`
                INSERT INTO shipping_zones (name, label, description, cost_pesewas, sort_order) VALUES
                ('accra', 'Within Accra', 'East Legon, Airport, Cantonments, Osu, Labone, Spintex, Tema, Madina, Kasoa and surrounds', 0, 0),
                ('outside-accra', 'Outside Accra', 'Kumasi, Takoradi, Cape Coast, Tamale, Ho, and all other areas', 3000, 1)
            `);
            console.log('✓ Default zones seeded (Accra: free, Outside: GHS 30)');
        } else {
            console.log('✓ Zones already exist — skipping seed');
        }
    } catch (err: any) {
        console.error('✗ Failed:', err.message);
    }
    process.exit(0);
}

run();
