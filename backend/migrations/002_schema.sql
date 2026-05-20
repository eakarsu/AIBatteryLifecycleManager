-- AIBatteryLifecycleManager v2 schema additions
-- RBAC users + notifications + attachments + webhooks + webhook_deliveries + remaining 8 entities.

-- ─────────────────────────────────────────────
-- RBAC
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password        VARCHAR(120) NOT NULL,
  name            VARCHAR(120),
  role            VARCHAR(20) DEFAULT 'viewer',  -- admin|ops|viewer
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER,
  title           VARCHAR(200),
  body            TEXT,
  severity        VARCHAR(20) DEFAULT 'info',
  source          VARCHAR(80),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, read_at);

-- ─────────────────────────────────────────────
-- Attachments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attachments (
  id              SERIAL PRIMARY KEY,
  resource_type   VARCHAR(60),
  resource_id     INTEGER,
  filename        VARCHAR(255),
  original_name   VARCHAR(255),
  mimetype        VARCHAR(120),
  size_bytes      INTEGER,
  uploaded_by     VARCHAR(150),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attachments_resource
  ON attachments (resource_type, resource_id);

-- ─────────────────────────────────────────────
-- Webhooks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120),
  url             VARCHAR(500),
  secret          VARCHAR(120),
  events          TEXT,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              SERIAL PRIMARY KEY,
  webhook_id      INTEGER,
  event           VARCHAR(120),
  payload         JSONB,
  status_code     INTEGER,
  response_body   TEXT,
  attempted_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook
  ON webhook_deliveries (webhook_id, attempted_at DESC);

-- ─────────────────────────────────────────────
-- Remaining 8 battery-domain CRUD entities
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telemetry (
  id              SERIAL PRIMARY KEY,
  point_id        VARCHAR(50) UNIQUE,
  asset_id        VARCHAR(50),
  metric          VARCHAR(60),
  value           NUMERIC(14,4) DEFAULT 0,
  units           VARCHAR(20),
  ts              TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS degradation_curves (
  id              SERIAL PRIMARY KEY,
  curve_id        VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  cycle_count     INTEGER DEFAULT 0,
  soh_pct         NUMERIC(5,2) DEFAULT 0,
  captured_at     TIMESTAMPTZ,
  model           VARCHAR(80),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soh_reports (
  id              SERIAL PRIMARY KEY,
  report_id       VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  soh_pct         NUMERIC(5,2) DEFAULT 0,
  period          VARCHAR(40),
  recommendations TEXT,
  status          VARCHAR(30) DEFAULT 'draft',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatch_schedules (
  id              SERIAL PRIMARY KEY,
  sched_id        VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  market          VARCHAR(60),
  kw              NUMERIC(10,2) DEFAULT 0,
  start_at        TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'scheduled',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recycling_orders (
  id              SERIAL PRIMARY KEY,
  order_id        VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  vendor          VARCHAR(120),
  status          VARCHAR(30) DEFAULT 'requested',
  scheduled_at    TIMESTAMPTZ,
  value_usd       BIGINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certifications (
  id              SERIAL PRIMARY KEY,
  cert_id         VARCHAR(50) UNIQUE,
  asset_id        VARCHAR(50),
  standard        VARCHAR(80),
  issued_at       DATE,
  expires_at      DATE,
  status          VARCHAR(30) DEFAULT 'valid',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id              SERIAL PRIMARY KEY,
  log_id          VARCHAR(50) UNIQUE,
  asset_id        VARCHAR(50),
  work            VARCHAR(200),
  technician      VARCHAR(120),
  hours           NUMERIC(6,2) DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alarms (
  id              SERIAL PRIMARY KEY,
  alarm_id        VARCHAR(50) UNIQUE,
  asset_id        VARCHAR(50),
  type            VARCHAR(80),
  severity        VARCHAR(20) DEFAULT 'medium',
  opened_at       TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'open',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id              SERIAL PRIMARY KEY,
  entry_id        VARCHAR(50) UNIQUE,
  actor           VARCHAR(120),
  target          VARCHAR(200),
  action          VARCHAR(80),
  result          VARCHAR(40),
  ts              TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
