-- AIBatteryLifecycleManager v3 schema additions (Apply pass 7 backlog).
-- All tables CREATE TABLE IF NOT EXISTS — safe to re-apply.

-- ─────────────────────────────────────────────
-- Chain-of-custody ledger (NONAI-MISSING-1)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custody_events (
  id              SERIAL PRIMARY KEY,
  event_id        VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  from_party      VARCHAR(200),
  to_party        VARCHAR(200),
  handler         VARCHAR(120),
  site_from       VARCHAR(120),
  site_to         VARCHAR(120),
  occurred_at     TIMESTAMPTZ,
  signature       VARCHAR(255),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custody_pack ON custody_events (pack_id, occurred_at DESC);

-- ─────────────────────────────────────────────
-- Certificate of Analysis (NONAI-MISSING-2)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coa_records (
  id              SERIAL PRIMARY KEY,
  coa_id          VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  cell_lot        VARCHAR(80),
  chemistry       VARCHAR(40),
  nominal_capacity_ah NUMERIC(10,2) DEFAULT 0,
  measured_capacity_ah NUMERIC(10,2) DEFAULT 0,
  ir_mohm         NUMERIC(8,2) DEFAULT 0,
  issued_at       DATE,
  status          VARCHAR(30) DEFAULT 'draft',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PPA / tariff schedules (NONAI-MISSING-4)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ppa_schedules (
  id              SERIAL PRIMARY KEY,
  schedule_id     VARCHAR(50) UNIQUE,
  site_id         VARCHAR(50),
  counterparty    VARCHAR(200),
  ppa_type        VARCHAR(60),
  capacity_price_usd_kw_month NUMERIC(10,2) DEFAULT 0,
  energy_price_usd_mwh NUMERIC(10,2) DEFAULT 0,
  start_date      DATE,
  end_date        DATE,
  status          VARCHAR(30) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Battery Passport / digital twin (CUSTOM-MISSING-1)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS battery_passports (
  id              SERIAL PRIMARY KEY,
  passport_id     VARCHAR(80) UNIQUE,
  pack_id         VARCHAR(50),
  chemistry       VARCHAR(40),
  manufacturer    VARCHAR(120),
  manufacture_date DATE,
  nominal_capacity_kwh NUMERIC(10,2) DEFAULT 0,
  recycled_content_pct NUMERIC(5,2) DEFAULT 0,
  carbon_footprint_kg_co2e NUMERIC(12,2) DEFAULT 0,
  supply_chain    TEXT,
  public_url_slug VARCHAR(100) UNIQUE,
  status          VARCHAR(30) DEFAULT 'draft',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Regulatory compliance tracker (CUSTOM-MISSING-2)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_records (
  id              SERIAL PRIMARY KEY,
  record_id       VARCHAR(50) UNIQUE,
  asset_id        VARCHAR(50),
  regulation      VARCHAR(120),
  jurisdiction    VARCHAR(80),
  due_date        DATE,
  evidence_url    VARCHAR(500),
  status          VARCHAR(30) DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- LCA accounting per lifecycle stage (CUSTOM-MISSING-4)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lca_entries (
  id              SERIAL PRIMARY KEY,
  entry_id        VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  stage           VARCHAR(60),
  co2e_kg         NUMERIC(12,2) DEFAULT 0,
  energy_kwh      NUMERIC(12,2) DEFAULT 0,
  water_l         NUMERIC(12,2) DEFAULT 0,
  recorded_at     DATE,
  source          VARCHAR(200),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Severity-driven escalation rules (NONAI-MISSING-5)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS escalation_rules (
  id              SERIAL PRIMARY KEY,
  rule_id         VARCHAR(50) UNIQUE,
  severity        VARCHAR(20),
  trigger_event   VARCHAR(120),
  notify_channel  VARCHAR(80),
  notify_target   VARCHAR(200),
  delay_minutes   INTEGER DEFAULT 0,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Warranty workflow state machine (CUSTOM-MISSING-3)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warranty_workflow (
  id              SERIAL PRIMARY KEY,
  workflow_id     VARCHAR(50) UNIQUE,
  claim_id        VARCHAR(50),
  state           VARCHAR(40) DEFAULT 'intake',
  assignee        VARCHAR(120),
  sla_due_at      TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Marketplace listings (CUSTOM-MISSING-5)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id              SERIAL PRIMARY KEY,
  listing_id      VARCHAR(50) UNIQUE,
  unit_id         VARCHAR(50),
  title           VARCHAR(200),
  description     TEXT,
  asking_price_usd NUMERIC(12,2) DEFAULT 0,
  soh_pct         NUMERIC(5,2) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'draft',
  listed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
