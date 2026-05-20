-- AIBatteryLifecycleManager schema (part 1 of 2)
-- Battery lifecycle management — utility BESS, EV second-life, degradation forecasting, warranty workflow.

CREATE TABLE IF NOT EXISTS battery_packs (
  id              SERIAL PRIMARY KEY,
  pack_id         VARCHAR(50) UNIQUE,
  vendor          VARCHAR(120),
  chemistry       VARCHAR(40),
  capacity_kwh    NUMERIC(10,2) DEFAULT 0,
  installed_at    DATE,
  status          VARCHAR(30) DEFAULT 'in_service',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cells (
  id              SERIAL PRIMARY KEY,
  cell_id         VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  position        VARCHAR(40),
  voltage_v       NUMERIC(6,3) DEFAULT 0,
  temperature_c   NUMERIC(6,2) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'nominal',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
  id              SERIAL PRIMARY KEY,
  module_id       VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  capacity_kwh    NUMERIC(10,2) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'in_service',
  last_test       DATE,
  swapped_at      DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chargers (
  id              SERIAL PRIMARY KEY,
  charger_id      VARCHAR(50) UNIQUE,
  site            VARCHAR(120),
  vendor          VARCHAR(120),
  power_kw        NUMERIC(8,2) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'online',
  last_event      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
  id              SERIAL PRIMARY KEY,
  site_id         VARCHAR(50) UNIQUE,
  name            VARCHAR(200),
  location        VARCHAR(200),
  customer_id     VARCHAR(50),
  capacity_kwh    NUMERIC(12,2) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id              SERIAL PRIMARY KEY,
  customer_id     VARCHAR(50) UNIQUE,
  name            VARCHAR(200),
  type            VARCHAR(40),
  region          VARCHAR(120),
  status          VARCHAR(30) DEFAULT 'active',
  contract_id     VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leases (
  id              SERIAL PRIMARY KEY,
  lease_id        VARCHAR(50) UNIQUE,
  customer_id     VARCHAR(50),
  pack_id         VARCHAR(50),
  start_date      DATE,
  term_months     INTEGER DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS second_life_units (
  id              SERIAL PRIMARY KEY,
  unit_id         VARCHAR(50) UNIQUE,
  source_pack     VARCHAR(50),
  soh_pct         NUMERIC(5,2) DEFAULT 0,
  target_application VARCHAR(120),
  status          VARCHAR(30) DEFAULT 'evaluation',
  routed_to       VARCHAR(200),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warranty_claims (
  id              SERIAL PRIMARY KEY,
  claim_id        VARCHAR(50) UNIQUE,
  pack_id         VARCHAR(50),
  defect_type     VARCHAR(120),
  status          VARCHAR(30) DEFAULT 'open',
  opened_at       TIMESTAMPTZ,
  owner           VARCHAR(120),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_results (
  id              SERIAL PRIMARY KEY,
  feature         VARCHAR(80) NOT NULL,
  input           JSONB,
  output          JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created
  ON ai_results (feature, created_at DESC);
