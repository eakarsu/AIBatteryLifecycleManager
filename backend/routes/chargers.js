const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'chargers',
  fields: ['charger_id','site','vendor','power_kw','status','last_event'],
});
