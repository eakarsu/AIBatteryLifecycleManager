const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'sites',
  fields: ['site_id','name','location','customer_id','capacity_kwh','status'],
});
