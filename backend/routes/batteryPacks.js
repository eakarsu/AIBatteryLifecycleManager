const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'battery_packs',
  fields: ['pack_id','vendor','chemistry','capacity_kwh','installed_at','status'],
});
