import bcrypt from 'bcryptjs';
import { query } from '../db';

async function resetPassword() {
    const newPassword = 'admin123';
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'ofoe@mahogana.com']);
    console.log(`Password reset for ofoe@mahogana.com`);
    console.log(`New password: ${newPassword}`);
    process.exit(0);
}

resetPassword();
