const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'modules',
  fields: ['module_id','pack_id','capacity_kwh','status','last_test','swapped_at'],
});
