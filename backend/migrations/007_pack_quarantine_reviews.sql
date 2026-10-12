-- Persist the native quarantine-review list. Draft rows carry no safety,
-- release, reuse, recycling, service, or approval decision.
CREATE TABLE IF NOT EXISTS pack_quarantine_reviews (
  id                  SERIAL PRIMARY KEY,
  pack_id             VARCHAR(50) NOT NULL,
  quarantine_reason   TEXT,
  risk_level          VARCHAR(20) NOT NULL DEFAULT 'unassessed'
                      CHECK (risk_level IN ('unassessed','low','medium','high','critical')),
  hold_status         VARCHAR(30) NOT NULL DEFAULT 'planning_draft'
                      CHECK (hold_status IN ('planning_draft','quarantined','under_review','released','scrap')),
  reviewer            VARCHAR(120),
  recommended_action  TEXT,
  opened_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pack_quarantine_reviews_pack
  ON pack_quarantine_reviews (pack_id, id DESC);
