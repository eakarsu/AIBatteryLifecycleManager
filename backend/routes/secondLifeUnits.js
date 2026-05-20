const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'second_life_units',
  fields: ['unit_id','source_pack','soh_pct','target_application','status','routed_to'],
});
