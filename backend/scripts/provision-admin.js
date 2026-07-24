'use strict';

const pool = require('../config/database');
const { hashPassword } = require('../lib/passwords');

async function provisionAdmin() {
  const email = process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  await pool.query(
    `INSERT INTO users (email, password, name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password, role='admin'`,
    [email.trim().toLowerCase(), hashPassword(password), 'Runtime Administrator']
  );
}

provisionAdmin()
  .catch((error) => {
    console.error(`Admin provisioning failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
