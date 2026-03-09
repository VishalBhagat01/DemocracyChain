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

    // 3. Seed admin user
    console.log('\n🌱  Seeding admin user...');
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminHash = await bcrypt.hash(adminPassword, 12);
    // 3. Seed admin and sample voters
    console.log('\n🌱  Seeding users...');
    const sampleVoters = [
        { voter_id: 'admin', password: process.env.ADMIN_PASSWORD || 'Admin@123', role: 'admin', full_name: 'System Admin', email: 'admin@system.local', booth_id: 'ALL', status: 'approved' },
        { voter_id: 'voter001', password: 'Voter@001', role: 'voter', full_name: 'Rahul Sharma', email: 'rahul@example.com', booth_id: 'BOOTH001', status: 'approved' },
        { voter_id: 'voter002', password: 'Voter@002', role: 'voter', full_name: 'Priya Patel', email: 'priya@example.com', booth_id: 'BOOTH001', status: 'approved' },
        { voter_id: 'voter003', password: 'Voter@003', role: 'voter', full_name: 'Amit Singh', email: 'amit@example.com', booth_id: 'BOOTH002', status: 'approved' },
        { voter_id: 'voter004', password: 'Voter@004', role: 'voter', full_name: 'Neha Gupta', email: 'neha@example.com', booth_id: 'BOOTH002', status: 'approved' },
        { voter_id: 'voter005', password: 'Voter@005', role: 'voter', full_name: 'Vikram Reddy', email: 'vikram@example.com', booth_id: 'BOOTH003', status: 'approved' }
    ];

    for (const v of sampleVoters) {
        const hash = await bcrypt.hash(v.password, 10);
        await client.query(`
          INSERT INTO voters(voter_id, hashed_password, role, full_name, email, booth_id, status)
          VALUES($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT(voter_id) DO UPDATE SET hashed_password = EXCLUDED.hashed_password, role = EXCLUDED.role, full_name = EXCLUDED.full_name, email = EXCLUDED.email, booth_id = EXCLUDED.booth_id, status = EXCLUDED.status;
        `, [v.voter_id, hash, v.role, v.full_name, v.email, v.booth_id, v.status]);
        console.log(`    voter created — ${v.voter_id}`);
    }

    await client.end();
    console.log('\n🎉  Database setup complete!\n');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  Login credentials:                          │');
    console.log(`│  admin / ${adminPassword.padEnd(18)} (admin)  │`);
    console.log('│  voter001 / Voter@001         (voter)        │');
    console.log('│  voter002 / Voter@002         (voter)        │');
    console.log('└─────────────────────────────────────────────┘');
}

main().catch(err => { console.error('❌  Setup failed:', err.message); process.exit(1); });
