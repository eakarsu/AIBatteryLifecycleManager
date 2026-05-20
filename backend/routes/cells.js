const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'cells',
  fields: ['cell_id','pack_id','position','voltage_v','temperature_c','status'],
});
