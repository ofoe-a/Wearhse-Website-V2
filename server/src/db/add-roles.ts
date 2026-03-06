import { query } from '../db';

async function addRoles() {
    try {
        // Expand the role check constraint to include printer and rider
        await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
        await query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'printer', 'rider'))`);
        console.log('✅ Added printer and rider roles');
        process.exit(0);
    } catch (err) {
        console.error('Failed to add roles:', err);
        process.exit(1);
    }
}

addRoles();
