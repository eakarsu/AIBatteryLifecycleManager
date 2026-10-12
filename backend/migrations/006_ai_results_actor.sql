-- Scope generic AI history to the authenticated actor while preserving all
-- existing rows. Legacy rows remain retained with a NULL owner and are not
-- shown to another account.
ALTER TABLE ai_results
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_ai_results_user_feature_created
  ON ai_results (user_id, feature, created_at DESC);
