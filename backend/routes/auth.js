const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateToken, requireAdmin } = require('../middleware/auth');
const pool = require('../config/database');
const { verifyPassword } = require('../lib/passwords');

async function findDbUser(email, password) {
  const r = await pool.query(
    'SELECT id, email, password, name, role FROM users WHERE email = $1 LIMIT 1',
    [String(email).trim().toLowerCase()]
  );
  if (!r.rows.length) return null;
  const u = r.rows[0];
  if (!verifyPassword(password, u.password)) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

async function findExistingDemoUser() {
  const email = String(process.env.DEMO_LOGIN_EMAIL || 'admin@batterylife.invalid').trim().toLowerCase();
  const password = process.env.SEED_DEMO_PASSWORD || '';
  // Demo access is limited to a configured seeded .invalid identity unless the
  // host explicitly enables another address. No account or secret is exposed.
  if (!password || (!email.endsWith('.invalid') && process.env.DEMO_LOGIN_ENABLED !== '1')) return null;
  return findDbUser(email, password);
}

function sessionFor(user) {
  return { token: jwt.sign(user, JWT_SECRET, { expiresIn: '24h' }), user };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await findDbUser(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json(sessionFor(user));
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/demo
// Uses one existing fictional demo actor and verifies its stored hash against
// the configured seed password. It never creates users or returns a password.
router.post('/demo', async (_req, res) => {
  try {
    const user = await findExistingDemoUser();
    if (!user) return res.status(503).json({ error: 'Demo login is unavailable on this host' });
    res.json(sessionFor(user));
  } catch (e) {
    console.error('Demo login error:', e);
    res.status(503).json({ error: 'Demo login is temporarily unavailable' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
  });
});

// GET /api/auth/users  (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY id ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
