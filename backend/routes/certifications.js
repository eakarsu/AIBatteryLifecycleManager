const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'certifications',
  fields: ['cert_id','asset_id','standard','issued_at','expires_at','status'],
});
