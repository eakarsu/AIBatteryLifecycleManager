const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'warranty_claims',
  fields: ['claim_id','pack_id','defect_type','status','opened_at','owner'],
  webhookPrefix: 'warranty',
});
