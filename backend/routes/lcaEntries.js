const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'lca_entries',
  fields: ['entry_id','pack_id','stage','co2e_kg','energy_kwh','water_l','recorded_at','source'],
});
