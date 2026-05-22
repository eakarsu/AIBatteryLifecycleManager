const buildCrud = require('./_crudFactory');

// Internal listing surface (reasonable-default product decision over external broker integration).
module.exports = buildCrud({
  table: 'marketplace_listings',
  fields: ['listing_id','unit_id','title','description','asking_price_usd','soh_pct','status','listed_at'],
});
