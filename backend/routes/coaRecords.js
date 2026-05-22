const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'coa_records',
  fields: ['coa_id','pack_id','cell_lot','chemistry','nominal_capacity_ah','measured_capacity_ah','ir_mohm','issued_at','status'],
});
