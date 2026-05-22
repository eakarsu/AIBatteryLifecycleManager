const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'ppa_schedules',
  fields: ['schedule_id','site_id','counterparty','ppa_type','capacity_price_usd_kw_month','energy_price_usd_mwh','start_date','end_date','status'],
});
