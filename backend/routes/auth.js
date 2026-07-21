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

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error' });
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
