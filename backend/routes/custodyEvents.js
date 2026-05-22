const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'custody_events',
  fields: ['event_id','pack_id','from_party','to_party','handler','site_from','site_to','occurred_at','signature','notes'],
});
