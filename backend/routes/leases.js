const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'leases',
  fields: ['lease_id','customer_id','pack_id','start_date','term_months','status'],
});
