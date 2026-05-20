const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'soh_reports',
  fields: ['report_id','pack_id','soh_pct','period','recommendations','status'],
});
