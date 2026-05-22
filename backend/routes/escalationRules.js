const buildCrud = require('./_crudFactory');

// Fixed-threshold escalation rule rows (reasonable-default product decision:
// row-per-severity-threshold rather than a rule DSL).
module.exports = buildCrud({
  table: 'escalation_rules',
  fields: ['rule_id','severity','trigger_event','notify_channel','notify_target','delay_minutes','active'],
});
