const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');
const pool = require('./config/database');

const app = express();
const PORT = process.env.BACKEND_PORT || 3065;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3064,http://localhost:3065,http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth (public)
app.use('/api/auth', require('./routes/auth'));

// Everything below this line requires a Bearer token.
app.use('/api', authenticateToken);

// 18 battery-domain CRUD routes (each uses _crudFactory: RBAC + bulk-import + attachments).
app.use('/api/battery-packs',       require('./routes/batteryPacks'));
app.use('/api/cells',               require('./routes/cells'));
app.use('/api/modules',             require('./routes/modules'));
app.use('/api/chargers',            require('./routes/chargers'));
app.use('/api/sites',               require('./routes/sites'));
app.use('/api/customers',           require('./routes/customers'));
app.use('/api/leases',              require('./routes/leases'));
app.use('/api/second-life-units',   require('./routes/secondLifeUnits'));
app.use('/api/warranty-claims',     require('./routes/warrantyClaims'));
app.use('/api/telemetry',           require('./routes/telemetry'));
app.use('/api/degradation-curves',  require('./routes/degradationCurves'));
app.use('/api/soh-reports',         require('./routes/sohReports'));
app.use('/api/dispatch-schedules',  require('./routes/dispatchSchedules'));
app.use('/api/recycling-orders',    require('./routes/recyclingOrders'));
app.use('/api/certifications',      require('./routes/certifications'));
app.use('/api/maintenance-logs',    require('./routes/maintenanceLogs'));
app.use('/api/alarms',              require('./routes/alarms'));
app.use('/api/audit-log',           require('./routes/auditLog'));

// AI routes (16 sub-endpoints + history under /api/ai)
app.use('/api/ai', require('./routes/ai'));

// Cross-cutting
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments',   require('./routes/attachments'));
app.use('/api/webhooks',      require('./routes/webhooks'));

// Dashboard stats
app.use('/api/dashboard', require('./routes/dashboard'));

// Custom analytics views (degradation curves overlay, cell voltage heatmap)
app.use('/api/custom-views', require('./routes/customViews'));

app.listen(PORT, () => {
  console.log(`\nAI Battery Lifecycle Manager API running on http://localhost:${PORT}\n`);
});
