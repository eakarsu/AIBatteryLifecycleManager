const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'recycling_orders',
  fields: ['order_id','pack_id','vendor','status','scheduled_at','value_usd'],
});
