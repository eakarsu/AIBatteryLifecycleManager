'use strict';

const pool = require('../config/database');

const TARGET = 15;
const actorEmail = String(process.env.DEMO_LOGIN_EMAIL || 'admin@batterylife.invalid').trim().toLowerCase();

function draftId(prefix, index) {
  return `${prefix}-TRAINING-${String(index + 1).padStart(3, '0')}`;
}

async function insert(client, sql, values) {
  try {
    const result = await client.query(sql, values);
    return result.rowCount;
  } catch (error) {
    const target = sql.trim().split(/\s+/).slice(0, 4).join(' ');
    throw new Error(`${target}: ${error.message}`, { cause: error });
  }
}

async function run() {
  if (process.env.SEED_DEMO_DATA !== '1') {
    throw new Error('Refusing additive demo records: set SEED_DEMO_DATA=1 explicitly');
  }
  if (!actorEmail.endsWith('.invalid')) {
    throw new Error('Refusing demo records for a non-.invalid actor');
  }

  const client = await pool.connect();
  const inserted = {};
  try {
    await client.query('BEGIN');
    const actor = (await client.query(
      'SELECT id, email, role FROM users WHERE lower(email)=$1 LIMIT 1 FOR SHARE',
      [actorEmail]
    )).rows[0];
    if (!actor || !['admin', 'ops'].includes(String(actor.role).toLowerCase())) {
      throw new Error('Configured demo actor is missing or is not a writer');
    }

    const packs = (await client.query('SELECT pack_id, vendor, chemistry, capacity_kwh FROM battery_packs ORDER BY id ASC LIMIT $1', [TARGET])).rows;
    const sites = (await client.query('SELECT site_id FROM sites ORDER BY id ASC LIMIT $1', [TARGET])).rows;
    const units = (await client.query('SELECT unit_id, soh_pct FROM second_life_units ORDER BY id ASC LIMIT $1', [TARGET])).rows;
    const claims = (await client.query('SELECT claim_id FROM warranty_claims ORDER BY id ASC LIMIT $1', [TARGET])).rows;
    if ([packs, sites, units, claims].some(rows => rows.length < TARGET)) {
      throw new Error('Existing persisted source lists must each contain at least 15 rows before adding planning drafts');
    }

    const note = `Fictional training/planning draft for ${actor.email}; no event, measurement, signature, approval, release, service, payment, delivery, or provider action is asserted.`;
    for (let index = 0; index < TARGET; index += 1) {
      const pack = packs[index];
      inserted.custody_events = (inserted.custody_events || 0) + await insert(client,
        `INSERT INTO custody_events(event_id,pack_id,from_party,to_party,handler,site_from,site_to,occurred_at,signature,notes)
         VALUES($1,$2,$3::text,$3::text,$3::text,$3::text,$3::text,NULL,NULL,$4) ON CONFLICT(event_id) DO NOTHING`,
        [draftId('CUSTODY', index), pack.pack_id, 'Unassigned — planning draft', note]);

      inserted.coa_records = (inserted.coa_records || 0) + await insert(client,
        `INSERT INTO coa_records(coa_id,pack_id,cell_lot,chemistry,nominal_capacity_ah,measured_capacity_ah,ir_mohm,issued_at,status)
         VALUES($1,$2,$3,$4,NULL,NULL,NULL,NULL,'draft') ON CONFLICT(coa_id) DO NOTHING`,
        [draftId('COA', index), pack.pack_id, 'Unknown — planning draft', pack.chemistry]);

      inserted.ppa_schedules = (inserted.ppa_schedules || 0) + await insert(client,
        `INSERT INTO ppa_schedules(schedule_id,site_id,counterparty,ppa_type,capacity_price_usd_kw_month,energy_price_usd_mwh,start_date,end_date,status)
         VALUES($1,$2,$3,'merchant',NULL,NULL,NULL,NULL,'draft') ON CONFLICT(schedule_id) DO NOTHING`,
        [draftId('PPA', index), sites[index].site_id, 'Unassigned — fictional planning draft']);

      inserted.battery_passports = (inserted.battery_passports || 0) + await insert(client,
        `INSERT INTO battery_passports(passport_id,pack_id,chemistry,manufacturer,manufacture_date,nominal_capacity_kwh,recycled_content_pct,carbon_footprint_kg_co2e,supply_chain,public_url_slug,status)
         VALUES($1,$2,$3,$4,NULL,$5,NULL,NULL,$6,$7,'draft') ON CONFLICT(passport_id) DO NOTHING`,
        [draftId('PASSPORT', index), pack.pack_id, pack.chemistry, pack.vendor, pack.capacity_kwh, note, `training-draft-${String(index + 1).padStart(3, '0')}`]);

      inserted.compliance_records = (inserted.compliance_records || 0) + await insert(client,
        `INSERT INTO compliance_records(record_id,asset_id,regulation,jurisdiction,due_date,evidence_url,status,notes)
         VALUES($1,$2,'EU_Battery_Regulation_2023_1542',$3,NULL,NULL,'pending',$4) ON CONFLICT(record_id) DO NOTHING`,
        [draftId('COMPLIANCE', index), pack.pack_id, 'Unassigned — planning draft', note]);

      inserted.lca_entries = (inserted.lca_entries || 0) + await insert(client,
        `INSERT INTO lca_entries(entry_id,pack_id,stage,co2e_kg,energy_kwh,water_l,recorded_at,source)
         VALUES($1,$2,'use',NULL,NULL,NULL,NULL,$3) ON CONFLICT(entry_id) DO NOTHING`,
        [draftId('LCA', index), pack.pack_id, `Not measured — ${note}`]);

      inserted.escalation_rules = (inserted.escalation_rules || 0) + await insert(client,
        `INSERT INTO escalation_rules(rule_id,severity,trigger_event,notify_channel,notify_target,delay_minutes,active)
         VALUES($1,'low',$2,'email',$3,0,FALSE) ON CONFLICT(rule_id) DO NOTHING`,
        [draftId('ESCALATION', index), 'Fictional planning trigger — disabled', 'unassigned@example.invalid']);

      inserted.warranty_workflow = (inserted.warranty_workflow || 0) + await insert(client,
        `INSERT INTO warranty_workflow(workflow_id,claim_id,state,assignee,sla_due_at,notes)
         VALUES($1,$2,'intake',$3,NULL,$4) ON CONFLICT(workflow_id) DO NOTHING`,
        [draftId('WORKFLOW', index), claims[index].claim_id, 'Unassigned — planning draft', note]);

      inserted.marketplace_listings = (inserted.marketplace_listings || 0) + await insert(client,
        `INSERT INTO marketplace_listings(listing_id,unit_id,title,description,asking_price_usd,soh_pct,status,listed_at)
         VALUES($1,$2,$3,$4,NULL,$5,'draft',NULL) ON CONFLICT(listing_id) DO NOTHING`,
        [draftId('LISTING', index), units[index].unit_id, `Fictional planning draft · ${units[index].unit_id}`, note, units[index].soh_pct]);

      inserted.pack_quarantine_reviews = (inserted.pack_quarantine_reviews || 0) + await insert(client,
        `INSERT INTO pack_quarantine_reviews(pack_id,quarantine_reason,risk_level,hold_status,reviewer,recommended_action,opened_at)
         SELECT $1::varchar(50),$2::text,'unassessed','planning_draft',NULL,$3::text,NULL
         WHERE NOT EXISTS (
           SELECT 1 FROM pack_quarantine_reviews WHERE pack_id=$1::varchar(50) AND hold_status='planning_draft' AND quarantine_reason=$2::text
         )`,
        [pack.pack_id, note, 'Qualified review and current evidence are required; no quarantine or release decision has been made.']);
    }

    const tables = [
      'battery_packs', 'cells', 'modules', 'chargers', 'sites', 'customers', 'leases',
      'second_life_units', 'warranty_claims', 'telemetry', 'degradation_curves', 'soh_reports',
      'dispatch_schedules', 'recycling_orders', 'certifications', 'maintenance_logs', 'alarms',
      'audit_log', 'custody_events', 'coa_records', 'ppa_schedules', 'battery_passports',
      'compliance_records', 'lca_entries', 'escalation_rules', 'warranty_workflow',
      'marketplace_listings', 'pack_quarantine_reviews',
    ];
    const counts = {};
    for (const table of tables) {
      counts[table] = Number((await client.query(`SELECT count(*) FROM ${table}`)).rows[0].count);
      if (counts[table] < TARGET) throw new Error(`${table} has only ${counts[table]} rows after additive demo setup`);
    }

    await client.query('COMMIT');
    console.log(JSON.stringify({ actor, inserted, counts }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
