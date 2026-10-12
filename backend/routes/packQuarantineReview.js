const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'pack_quarantine_reviews',
  fields: [
    'pack_id',
    'quarantine_reason',
    'risk_level',
    'hold_status',
    'reviewer',
    'recommended_action',
    'opened_at',
  ],
});
