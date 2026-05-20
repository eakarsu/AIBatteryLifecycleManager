const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'maintenance_logs',
  fields: ['log_id','asset_id','work','technician','hours','completed_at'],
});
