const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'telemetry',
  fields: ['point_id','asset_id','metric','value','units','ts'],
});
