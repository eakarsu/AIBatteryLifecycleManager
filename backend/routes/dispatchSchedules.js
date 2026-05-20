const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'dispatch_schedules',
  fields: ['sched_id','pack_id','market','kw','start_at','status'],
});
