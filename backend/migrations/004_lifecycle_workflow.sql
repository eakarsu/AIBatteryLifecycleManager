CREATE TABLE IF NOT EXISTS lifecycle_observations (
  id BIGSERIAL PRIMARY KEY,
  pack_id VARCHAR(50) NOT NULL,
  source_event_id VARCHAR(160) NOT NULL UNIQUE,
  observed_at TIMESTAMPTZ NOT NULL,
  provenance JSONB NOT NULL,
  telemetry JSONB NOT NULL,
  chemistry VARCHAR(50),
  duty_cycle VARCHAR(120),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lifecycle_assessments (
  id BIGSERIAL PRIMARY KEY,
  observation_id BIGINT NOT NULL UNIQUE REFERENCES lifecycle_observations(id) ON DELETE CASCADE,
  ruleset_version VARCHAR(120) NOT NULL,
  model_name VARCHAR(160) NOT NULL,
  model_version VARCHAR(120) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  safety_hold BOOLEAN NOT NULL DEFAULT FALSE,
  proposed_disposition VARCHAR(80) NOT NULL,
  decision JSONB NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','completed')),
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_observations_pack_time ON lifecycle_observations(pack_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lifecycle_assessments_status ON lifecycle_assessments(status, severity);
