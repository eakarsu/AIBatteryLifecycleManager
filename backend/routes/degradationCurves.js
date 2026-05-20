const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'degradation_curves',
  fields: ['curve_id','pack_id','cycle_count','soh_pct','captured_at','model'],
});
