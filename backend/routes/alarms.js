const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'alarms',
  fields: ['alarm_id','asset_id','type','severity','opened_at','status'],
  webhookPrefix: 'alarm',
});
