// database_api/setup_db.js
// Usage: node database_api/setup_db.js
// This script: (1) drops all old data, (2) creates the fresh schema, (3) seeds an admin user

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
    console.error('❌  DATABASE_URL not set in .env');
    process.exit(1);
}

async function main() {
    const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('✅  Connected to PostgreSQL');

    // 1. Reset
    console.log('\n🗑️   Running db_reset.sql...');
    const resetSQL = fs.readFileSync(path.join(__dirname, 'db_reset.sql'), 'utf8');
    await client.query(resetSQL);
    console.log('    All old tables/schemas dropped.');

    // 2. Init fresh schema
    console.log('\n📐  Running db_init.sql...');
    const initSQL = fs.readFileSync(path.join(__dirname, 'db_init.sql'), 'utf8');
    await client.query(initSQL);
    console.log('    Fresh schema created.');

    // 3. Seed admin account only (voters are loaded via CSV in the admin panel)
    console.log('\n  Seeding admin account...');
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const BCRYPT_ROUNDS = 12;

    const hash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
    await client.query(`
      INSERT INTO voters(voter_id, hashed_password, role, full_name, email, booth_id, status)
      VALUES($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT(voter_id) DO UPDATE
        SET hashed_password = EXCLUDED.hashed_password,
            role = EXCLUDED.role,
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            booth_id = EXCLUDED.booth_id,
            status = EXCLUDED.status;
    `, ['admin', hash, 'admin', 'System Admin', 'admin@system.local', 'ALL', 'approved']);
    console.log('    admin account ready.');

    await client.end();
    console.log('\n  Database setup complete!\n');
    console.log('  Admin login: admin / ' + adminPassword);
    console.log('  Import voters via the Admin Panel CSV upload.\n');
}

main().catch(err => { console.error('  Setup failed:', err.message); process.exit(1); });
