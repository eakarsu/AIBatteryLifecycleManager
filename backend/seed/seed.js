const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { hashPassword } = require('../lib/passwords');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'battery_lifecycle',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function run() {
  if (process.env.RESET_DATABASE !== '1' || process.env.SEED_DEMO_DATA !== '1') {
    throw new Error('Refusing destructive seed: set RESET_DATABASE=1 and SEED_DEMO_DATA=1 explicitly');
  }
  if (!process.env.SEED_DEMO_PASSWORD) throw new Error('SEED_DEMO_PASSWORD is required');
  const client = await pool.connect();
  try {
    console.log('[seed] resetting tables...');
    await client.query(`
      DROP TABLE IF EXISTS battery_packs       CASCADE;
      DROP TABLE IF EXISTS cells               CASCADE;
      DROP TABLE IF EXISTS modules             CASCADE;
      DROP TABLE IF EXISTS chargers            CASCADE;
      DROP TABLE IF EXISTS sites               CASCADE;
      DROP TABLE IF EXISTS customers           CASCADE;
      DROP TABLE IF EXISTS leases              CASCADE;
      DROP TABLE IF EXISTS second_life_units   CASCADE;
      DROP TABLE IF EXISTS warranty_claims     CASCADE;
      DROP TABLE IF EXISTS telemetry           CASCADE;
      DROP TABLE IF EXISTS degradation_curves  CASCADE;
      DROP TABLE IF EXISTS soh_reports         CASCADE;
      DROP TABLE IF EXISTS dispatch_schedules  CASCADE;
      DROP TABLE IF EXISTS recycling_orders    CASCADE;
      DROP TABLE IF EXISTS certifications      CASCADE;
      DROP TABLE IF EXISTS maintenance_logs    CASCADE;
      DROP TABLE IF EXISTS alarms              CASCADE;
      DROP TABLE IF EXISTS audit_log           CASCADE;
      DROP TABLE IF EXISTS ai_results          CASCADE;
      DROP TABLE IF EXISTS users               CASCADE;
      DROP TABLE IF EXISTS notifications       CASCADE;
      DROP TABLE IF EXISTS attachments         CASCADE;
      DROP TABLE IF EXISTS webhooks            CASCADE;
      DROP TABLE IF EXISTS webhook_deliveries  CASCADE;
    `);

    console.log('[seed] applying migrations...');
    const schema1 = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_schema.sql'), 'utf8');
    await client.query(schema1);
    const schema2 = fs.readFileSync(path.join(__dirname, '..', 'migrations', '002_schema.sql'), 'utf8');
    await client.query(schema2);

    console.log('[seed] inserting battery_packs...');
    const packs = [
      ['BP-2026-001', 'CATL',                 'LFP',     400.00, '2024-03-10', 'in_service'],
      ['BP-2026-002', 'BYD',                  'LFP',     300.00, '2024-05-22', 'in_service'],
      ['BP-2026-003', 'Tesla',                'NMC811',  100.00, '2023-09-14', 'in_service'],
      ['BP-2026-004', 'LG Energy Solution',   'NMC811',   60.00, '2022-11-04', 'in_service'],
      ['BP-2026-005', 'Panasonic',            'NCA',      20.00, '2023-02-18', 'in_service'],
      ['BP-2026-006', 'SK On',                'NCM',      75.00, '2023-06-30', 'warning'],
      ['BP-2026-007', 'LG Energy Solution',   'NMC811',   60.00, '2022-07-12', 'warning'],
      ['BP-2026-008', 'EVE Energy',           'LFP',     280.00, '2024-01-09', 'in_service'],
      ['BP-2026-009', 'CATL',                 'LFP',     200.00, '2023-08-25', 'in_service'],
      ['BP-2026-010', 'Samsung SDI',          'NCM',      90.00, '2024-04-02', 'in_service'],
      ['BP-2026-011', 'Fluence/CATL',         'LFP',     600.00, '2024-10-17', 'in_service'],
      ['BP-2026-012', 'BYD',                  'Blade',   350.00, '2025-01-21', 'in_service'],
      ['BP-2026-013', 'Toshiba',              'LTO',    2000.00, '2023-12-05', 'in_service'],
      ['BP-2026-014', 'CATL',                 'LFP',     150.00, '2023-08-11', 'warning'],
      ['BP-2026-015', 'A123 Systems',         'LFP',      50.00, '2022-04-19', 'retired'],
    ];
    for (const p of packs) {
      await client.query(
        `INSERT INTO battery_packs (pack_id,vendor,chemistry,capacity_kwh,installed_at,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        p
      );
    }

    console.log('[seed] inserting cells...');
    const cells = [
      ['CEL-001', 'BP-2026-001', 'M01-S01', 3.312, 28.4, 'nominal'],
      ['CEL-002', 'BP-2026-001', 'M01-S02', 3.318, 29.1, 'nominal'],
      ['CEL-003', 'BP-2026-001', 'M01-S03', 3.302, 31.0, 'warning'],
      ['CEL-004', 'BP-2026-007', 'M03-S11', 3.910, 38.7, 'warning'],
      ['CEL-005', 'BP-2026-007', 'M03-S12', 4.050, 41.2, 'warning'],
      ['CEL-006', 'BP-2026-014', 'M02-S07', 3.298, 61.0, 'fault'],
      ['CEL-007', 'BP-2026-014', 'M02-S08', 3.316, 52.3, 'warning'],
      ['CEL-008', 'BP-2026-005', 'M01-S04', 3.985, 24.0, 'nominal'],
      ['CEL-009', 'BP-2026-013', 'L01-S22', 2.420, 26.5, 'nominal'],
      ['CEL-010', 'BP-2026-013', 'L01-S23', 2.418, 26.7, 'nominal'],
      ['CEL-011', 'BP-2026-011', 'M04-S01', 3.330, 27.8, 'nominal'],
      ['CEL-012', 'BP-2026-009', 'M02-S14', 3.312, 30.1, 'nominal'],
      ['CEL-013', 'BP-2026-006', 'M01-S05', 3.620, 35.9, 'warning'],
      ['CEL-014', 'BP-2026-004', 'M02-S08', 3.870, 33.4, 'nominal'],
      ['CEL-015', 'BP-2026-012', 'M03-S02', 3.325, 28.0, 'nominal'],
    ];
    for (const c of cells) {
      await client.query(
        `INSERT INTO cells (cell_id,pack_id,position,voltage_v,temperature_c,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        c
      );
    }

    console.log('[seed] inserting modules...');
    const modules = [
      ['MOD-001', 'BP-2026-001',  50.00, 'in_service', '2026-04-12', null],
      ['MOD-002', 'BP-2026-001',  50.00, 'in_service', '2026-04-12', null],
      ['MOD-003', 'BP-2026-002',  37.50, 'in_service', '2026-03-22', null],
      ['MOD-004', 'BP-2026-007',  12.00, 'swapped',    '2026-02-10', '2026-04-30'],
      ['MOD-005', 'BP-2026-014',  25.00, 'fault',      '2026-04-30', null],
      ['MOD-006', 'BP-2026-014',  25.00, 'in_service', '2026-04-30', null],
      ['MOD-007', 'BP-2026-011',  75.00, 'in_service', '2026-05-01', null],
      ['MOD-008', 'BP-2026-011',  75.00, 'in_service', '2026-05-01', null],
      ['MOD-009', 'BP-2026-013', 250.00, 'in_service', '2026-03-15', null],
      ['MOD-010', 'BP-2026-013', 250.00, 'in_service', '2026-03-15', null],
      ['MOD-011', 'BP-2026-012',  87.50, 'in_service', '2026-02-28', null],
      ['MOD-012', 'BP-2026-009',  50.00, 'in_service', '2026-04-04', null],
      ['MOD-013', 'BP-2026-008',  70.00, 'in_service', '2026-04-18', null],
      ['MOD-014', 'BP-2026-006',  18.75, 'warning',    '2026-04-22', null],
      ['MOD-015', 'BP-2026-015',  12.50, 'retired',    '2025-12-05', '2026-01-15'],
    ];
    for (const m of modules) {
      await client.query(
        `INSERT INTO modules (module_id,pack_id,capacity_kwh,status,last_test,swapped_at) VALUES ($1,$2,$3,$4,$5,$6)`,
        m
      );
    }

    console.log('[seed] inserting chargers...');
    const chargers = [
      ['CHG-001', 'EVgo Sacramento, CA',    'ABB',          350.0, 'online',     '2026-05-16 18:22+00'],
      ['CHG-002', 'EVgo Sacramento, CA',    'ABB',          350.0, 'online',     '2026-05-16 18:24+00'],
      ['CHG-003', 'EVgo Sacramento, CA',    'ABB',          150.0, 'fault',      '2026-05-16 14:00+00'],
      ['CHG-004', 'Bakersfield BESS, CA',   'Power Electronics', 100.0, 'online', '2026-05-16 17:55+00'],
      ['CHG-005', 'Hornsdale, AU',          'Tesla',       1500.0, 'online',     '2026-05-16 09:32+00'],
      ['CHG-006', 'Ostdeutschland, DE',     'Siemens',      500.0, 'online',     '2026-05-16 16:14+00'],
      ['CHG-007', 'Drax, UK',               'GE Vernova',  1000.0, 'maintenance','2026-05-16 11:00+00'],
      ['CHG-008', 'Acme Microgrid Kenya',   'Schneider',     50.0, 'online',     '2026-05-16 15:30+00'],
      ['CHG-009', 'Munich SWM, DE',         'Siemens',      400.0, 'online',     '2026-05-16 19:00+00'],
      ['CHG-010', 'Long Beach Port, CA',    'Heliox',       350.0, 'online',     '2026-05-16 14:45+00'],
      ['CHG-011', 'Texas Solar Co-op TX',   'Enphase',       10.0, 'online',     '2026-05-16 13:30+00'],
      ['CHG-012', 'Phoenix BESS, AZ',       'SMA',          100.0, 'online',     '2026-05-16 18:00+00'],
      ['CHG-013', 'Houston Hub, TX',        'Power Electronics', 150.0, 'online','2026-05-16 17:30+00'],
      ['CHG-014', 'Brandenburg, DE',        'Siemens',      400.0, 'offline',    '2026-05-15 22:00+00'],
      ['CHG-015', 'Rancho Cucamonga, CA',   'ABB',          150.0, 'online',     '2026-05-16 16:00+00'],
    ];
    for (const c of chargers) {
      await client.query(
        `INSERT INTO chargers (charger_id,site,vendor,power_kw,status,last_event) VALUES ($1,$2,$3,$4,$5,$6)`,
        c
      );
    }

    console.log('[seed] inserting sites...');
    const sites = [
      ['SITE-001', 'Bakersfield BESS',         'Bakersfield, CA, USA',     'CUS-001',  400.00, 'active'],
      ['SITE-002', 'Hornsdale Power Reserve',  'Hornsdale, SA, AU',        'CUS-014', 150000.00,'active'],
      ['SITE-003', 'Ostdeutschland Speicher',  'Brandenburg, DE',          'CUS-005', 50000.00, 'active'],
      ['SITE-004', 'Drax DC Asset',            'Drax, UK',                 'CUS-009', 1000.00, 'active'],
      ['SITE-005', 'EVgo Sacramento Hub',      'Sacramento, CA, USA',      'CUS-002', 2000.00, 'active'],
      ['SITE-006', 'Munich SWM Plant 4',       'Munich, DE',               'CUS-005', 600.00, 'active'],
      ['SITE-007', 'Phoenix Peaker',           'Phoenix, AZ, USA',         'CUS-001',  150.00, 'active'],
      ['SITE-008', 'Houston Volatility Asset', 'Houston, TX, USA',         'CUS-003',  600.00, 'active'],
      ['SITE-009', 'Long Beach Port BESS',     'Long Beach, CA, USA',      'CUS-007',  400.00, 'active'],
      ['SITE-010', 'Acme Microgrid Kenya',     'Lodwar, Kenya',            'CUS-011',  200.00, 'active'],
      ['SITE-011', 'Texas Solar Co-op Cluster','Austin, TX, USA',          'CUS-008', 1760.00, 'active'],
      ['SITE-012', 'Rancho Cucamonga DCFC',    'Rancho Cucamonga, CA, USA','CUS-002',  800.00, 'active'],
      ['SITE-013', 'Brandenburg aFRR',         'Brandenburg, DE',          'CUS-005', 50000.00, 'maintenance'],
      ['SITE-014', 'Drax Standby',             'Drax, UK',                 'CUS-009',  500.00, 'commissioning'],
      ['SITE-015', 'Bakersfield Retired Cell','Bakersfield, CA, USA',     'CUS-001',  200.00, 'retired'],
    ];
    for (const s of sites) {
      await client.query(
        `INSERT INTO sites (site_id,name,location,customer_id,capacity_kwh,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        s
      );
    }

    console.log('[seed] inserting customers...');
    const customers = [
      ['CUS-001', 'PG&E Utility',               'utility',    'California, USA',   'active',  'CT-001'],
      ['CUS-002', 'EVgo',                       'evcharging', 'CONUS',             'active',  'CT-002'],
      ['CUS-003', 'ERCOT IPP North',            'merchant',   'Texas, USA',        'active',  'CT-003'],
      ['CUS-004', 'Iberdrola Renovables',       'utility',    'Spain',             'active',  'CT-004'],
      ['CUS-005', 'Stadtwerke Munich',          'utility',    'Germany',           'active',  'CT-005'],
      ['CUS-006', 'Engie North America',        'merchant',   'USA',               'active',  'CT-006'],
      ['CUS-007', 'Port of Long Beach',         'industrial', 'California, USA',   'active',  'CT-007'],
      ['CUS-008', 'Texas Solar Co-op',          'residential','Texas, USA',        'active',  'CT-008'],
      ['CUS-009', 'AGL Energy',                 'utility',    'UK / Australia',    'active',  'CT-009'],
      ['CUS-010', 'Tesla Megapack Direct',      'industrial', 'Global',            'active',  'CT-010'],
      ['CUS-011', 'Acme Microgrid Kenya',       'microgrid',  'Kenya',             'active',  'CT-011'],
      ['CUS-012', 'Renewable Properties LLC',   'commercial', 'CONUS',             'active',  'CT-012'],
      ['CUS-013', 'Tata Power Renewables',      'utility',    'India',             'prospect','CT-013'],
      ['CUS-014', 'Hornsdale Power Reserve',    'merchant',   'South Australia',   'active',  'CT-014'],
      ['CUS-015', 'Chongqing Bus Authority',    'transit',    'China',             'churned', 'CT-015'],
    ];
    for (const c of customers) {
      await client.query(
        `INSERT INTO customers (customer_id,name,type,region,status,contract_id) VALUES ($1,$2,$3,$4,$5,$6)`,
        c
      );
    }

    console.log('[seed] inserting leases...');
    const leases = [
      ['LSE-001', 'CUS-001', 'BP-2026-001', '2024-03-15', 120, 'active'],
      ['LSE-002', 'CUS-005', 'BP-2026-002', '2024-06-01', 120, 'active'],
      ['LSE-003', 'CUS-002', 'BP-2026-013',  '2024-01-10', 60, 'active'],
      ['LSE-004', 'CUS-014', 'BP-2026-011', '2024-11-01', 84, 'active'],
      ['LSE-005', 'CUS-008', 'BP-2026-005', '2023-03-01', 60, 'active'],
      ['LSE-006', 'CUS-007', 'BP-2026-009', '2023-09-01', 60, 'active'],
      ['LSE-007', 'CUS-005', 'BP-2026-008', '2024-02-15', 96, 'active'],
      ['LSE-008', 'CUS-011', 'BP-2026-004', '2024-04-20', 36, 'active'],
      ['LSE-009', 'CUS-003', 'BP-2026-010', '2024-04-10', 60, 'active'],
      ['LSE-010', 'CUS-009', 'BP-2026-012', '2025-02-01', 84, 'active'],
      ['LSE-011', 'CUS-014', 'BP-2026-003', '2023-10-01', 60, 'active'],
      ['LSE-012', 'CUS-006', 'BP-2026-006', '2023-07-15', 48, 'in_renewal'],
      ['LSE-013', 'CUS-002', 'BP-2026-007', '2022-08-01', 48, 'expired'],
      ['LSE-014', 'CUS-015', 'BP-2026-015', '2022-05-01', 36, 'expired'],
      ['LSE-015', 'CUS-001', 'BP-2026-014', '2023-09-01', 60, 'active'],
    ];
    for (const l of leases) {
      await client.query(
        `INSERT INTO leases (lease_id,customer_id,pack_id,start_date,term_months,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        l
      );
    }

    console.log('[seed] inserting second_life_units...');
    const secondLife = [
      ['SL-2026-001', 'BP-2024-088', 38.00, 'recycle',                 'evaluation', null],
      ['SL-2026-002', 'BP-2024-031', 42.00, 'recycle',                 'routed',     'Li-Cycle Rochester'],
      ['SL-2026-003', 'BP-2024-014', 52.00, 'telecom_backup',          'routed',     'AT&T Tower North'],
      ['SL-2026-004', 'BP-2023-047', 28.00, 'recycle',                 'routed',     'Ascend Elements MA'],
      ['SL-2026-005', 'BP-2023-051', 65.00, 'telecom_backup',          'evaluation', null],
      ['SL-2026-006', 'BP-2023-019', 72.00, 'home_storage',            'routed',     'Pacific Solar Inc'],
      ['SL-2026-007', 'BP-2023-022', 78.00, 'solar_microgrid',         'routed',     'Acme Microgrid Kenya'],
      ['SL-2026-008', 'BP-2024-007', 60.00, 'evaluation',              'evaluation', null],
      ['SL-2026-009', 'BP-2023-009', 72.00, 'home_storage',            'evaluation', null],
      ['SL-2026-010', 'BP-2024-027', 67.00, 'forklift_industrial',     'routed',     'Toyota Forklift Lease'],
      ['SL-2026-011', 'BP-2023-040', 81.00, 'dcfc_buffer',             'routed',     'EVgo Sacramento'],
      ['SL-2026-012', 'BP-2024-013', 70.00, 'agricultural_irrigation', 'evaluation', null],
      ['SL-2026-013', 'BP-2023-066', 55.00, 'recycle',                 'routed',     'Cirba Solutions OH'],
      ['SL-2026-014', 'BP-2023-014', 65.00, 'telecom_backup',          'routed',     'Vodafone EU Tower'],
      ['SL-2026-015', 'BP-2025-002', 85.00, 'evaluation',              'evaluation', null],
    ];
    for (const u of secondLife) {
      await client.query(
        `INSERT INTO second_life_units (unit_id,source_pack,soh_pct,target_application,status,routed_to) VALUES ($1,$2,$3,$4,$5,$6)`,
        u
      );
    }

    console.log('[seed] inserting warranty_claims...');
    const warranty = [
      ['WC-2026-001', 'BP-2026-014', 'single_cell_thermal_event', 'open',       '2026-04-11 14:00+00', 'CATL NA Service'],
      ['WC-2026-002', 'BP-2026-007', 'premature_capacity_fade',    'open',       '2026-04-22 10:15+00', 'LG Energy Solution'],
      ['WC-2026-003', 'BP-2026-006', 'BMS_firmware_bug',           'approved',   '2026-04-04 09:00+00', 'BYD Service'],
      ['WC-2026-004', 'BP-2026-051', 'transit_damage',             'approved',   '2026-05-12 16:30+00', 'Fluence Logistics'],
      ['WC-2026-005', 'BP-2024-088', 'out_of_warranty_failure',    'denied',     '2026-03-22 08:00+00', 'Tesla Megapack'],
      ['WC-2026-006', 'BP-2026-002', 'cell_imbalance_excessive',   'investigating','2026-04-30 11:00+00', 'BYD Service'],
      ['WC-2026-007', 'BP-2026-005', 'BMS_communication_dropout',  'closed',     '2026-02-14 09:00+00', 'Panasonic NA'],
      ['WC-2026-008', 'BP-2026-008', 'connector_corrosion',        'open',       '2026-05-01 13:00+00', 'EVE Energy'],
      ['WC-2026-009', 'BP-2026-009', 'enclosure_seal_failure',     'approved',   '2026-04-08 10:00+00', 'CATL NA Service'],
      ['WC-2026-010', 'BP-2026-010', 'module_underperformance',    'investigating','2026-04-26 11:30+00', 'Samsung SDI'],
      ['WC-2026-011', 'BP-2026-011', 'cooling_loop_leak',          'open',       '2026-05-08 09:00+00', 'Fluence Service'],
      ['WC-2026-012', 'BP-2026-012', 'soh_below_spec',             'open',       '2026-05-13 14:00+00', 'BYD Service'],
      ['WC-2026-013', 'BP-2026-013', 'fast_charge_throttling',     'closed',     '2026-03-01 09:00+00', 'Toshiba'],
      ['WC-2026-014', 'BP-2026-015', 'end_of_life_credit_request', 'approved',   '2026-01-20 09:00+00', 'A123 Systems'],
      ['WC-2026-015', 'BP-2026-001', 'high_self_discharge',        'open',       '2026-05-14 16:00+00', 'CATL NA Service'],
    ];
    for (const w of warranty) {
      await client.query(
        `INSERT INTO warranty_claims (claim_id,pack_id,defect_type,status,opened_at,owner) VALUES ($1,$2,$3,$4,$5,$6)`,
        w
      );
    }

    // ─────────────────────────────────────────────
    // RBAC users
    // ─────────────────────────────────────────────
    console.log('[seed] inserting users...');
    const users = [
      ['admin@batterylife.invalid',  hashPassword(process.env.SEED_DEMO_PASSWORD), 'Admin',    'admin'],
      ['ops@batterylife.invalid',    hashPassword(process.env.SEED_DEMO_PASSWORD), 'Ops Lead', 'ops'],
      ['viewer@batterylife.invalid', hashPassword(process.env.SEED_DEMO_PASSWORD), 'Viewer',   'viewer'],
    ];
    for (const u of users) {
      await client.query(
        `INSERT INTO users (email,password,name,role) VALUES ($1,$2,$3,$4)`,
        u
      );
    }

    // ─────────────────────────────────────────────
    // Notifications (sample seed)
    // ─────────────────────────────────────────────
    console.log('[seed] inserting notifications...');
    const notifications = [
      [1, 'Critical alarm — thermal',     'Pack BP-2026-014 cell #182 at 61°C, evacuation policy triggered', 'critical', 'alarms'],
      [1, 'Warranty claim filed',         'CATL claim WC-2026-001 for thermal event on BP-2026-014',         'high',     'warranty_claims'],
      [1, 'Second-life routing complete', 'SL-2026-007 routed to Acme Microgrid Kenya — 78% SoH',            'info',     'second_life_units'],
      [2, 'Dispatch performance miss',    'Bakersfield BESS underperformed dispatch by 9% on 2026-05-15',    'medium',   'dispatch_schedules'],
      [2, 'Vendor SB issued',             'BYD service bulletin SB-2026-04 — BMS firmware bug',              'high',     'warranty_claims'],
    ];
    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (user_id,title,body,severity,source) VALUES ($1,$2,$3,$4,$5)`,
        n
      );
    }

    // ─────────────────────────────────────────────
    // Webhooks (sample seed)
    // ─────────────────────────────────────────────
    console.log('[seed] inserting webhooks...');
    const webhooks = [
      ['Ops Pager',     'https://httpbin.org/post', 'sec_ops_2026',     'alarm.created,warranty.created',     true],
      ['Vendor Bridge', 'https://httpbin.org/post', 'sec_vendor_2026',  'warranty.created',                   true],
    ];
    for (const w of webhooks) {
      await client.query(
        `INSERT INTO webhooks (name,url,secret,events,active) VALUES ($1,$2,$3,$4,$5)`,
        w
      );
    }

    console.log('[seed] inserting telemetry...');
    const telemetry = [
      ['TP-0001', 'BP-2026-001', 'soc_pct',         62.4, '%',   '2026-05-16 18:00+00'],
      ['TP-0002', 'BP-2026-001', 'voltage_pack_v', 832.1, 'V',   '2026-05-16 18:00+00'],
      ['TP-0003', 'BP-2026-001', 'current_a',       45.0, 'A',   '2026-05-16 18:00+00'],
      ['TP-0004', 'BP-2026-014', 'temp_max_c',      61.0, '°C',  '2026-05-16 17:55+00'],
      ['TP-0005', 'BP-2026-014', 'soh_pct',         78.0, '%',   '2026-05-16 12:00+00'],
      ['TP-0006', 'BP-2026-007', 'soh_pct',         81.0, '%',   '2026-05-16 12:00+00'],
      ['TP-0007', 'BP-2026-011', 'kwh_dispatched',  812.5,'kWh', '2026-05-16 23:00+00'],
      ['TP-0008', 'BP-2026-013', 'cycle_today',      1.4, 'cyc', '2026-05-16 23:00+00'],
      ['TP-0009', 'BP-2026-002', 'temp_avg_c',      27.8, '°C',  '2026-05-16 18:00+00'],
      ['TP-0010', 'BP-2026-006', 'cell_imbalance_mv', 84, 'mV',  '2026-05-16 17:00+00'],
      ['TP-0011', 'BP-2026-008', 'insulation_mohm', 480, 'MΩ',   '2026-05-16 09:00+00'],
      ['TP-0012', 'BP-2026-009', 'self_discharge_pct_day', 0.4, '%',   '2026-05-15 00:00+00'],
      ['TP-0013', 'BP-2026-004', 'soc_pct',         71.2, '%',   '2026-05-16 18:00+00'],
      ['TP-0014', 'BP-2026-005', 'soc_pct',         44.0, '%',   '2026-05-16 18:00+00'],
      ['TP-0015', 'BP-2026-012', 'cycle_total',    1244,  'cyc', '2026-05-16 18:00+00'],
    ];
    for (const t of telemetry) {
      await client.query(
        `INSERT INTO telemetry (point_id,asset_id,metric,value,units,ts) VALUES ($1,$2,$3,$4,$5,$6)`,
        t
      );
    }

    console.log('[seed] inserting degradation_curves...');
    const curves = [
      ['DC-001', 'BP-2026-001',  640, 92.4, '2026-05-01 00:00+00', 'arrhenius_v3'],
      ['DC-002', 'BP-2026-002',  410, 95.1, '2026-05-01 00:00+00', 'arrhenius_v3'],
      ['DC-003', 'BP-2026-003', 1100, 89.0, '2026-05-01 00:00+00', 'eclipse_v2'],
      ['DC-004', 'BP-2026-004', 1620, 83.4, '2026-05-01 00:00+00', 'eclipse_v2'],
      ['DC-005', 'BP-2026-005',  900, 89.3, '2026-05-01 00:00+00', 'arrhenius_v3'],
      ['DC-006', 'BP-2026-006', 1380, 82.1, '2026-05-01 00:00+00', 'eclipse_v2'],
      ['DC-007', 'BP-2026-007', 1850, 81.0, '2026-05-01 00:00+00', 'eclipse_v2'],
      ['DC-008', 'BP-2026-008',  720, 91.0, '2026-05-01 00:00+00', 'arrhenius_v3'],
      ['DC-009', 'BP-2026-009', 1120, 87.6, '2026-05-01 00:00+00', 'arrhenius_v3'],
      ['DC-010', 'BP-2026-010',  610, 92.8, '2026-05-01 00:00+00', 'eclipse_v2'],
      ['DC-011', 'BP-2026-011',  490, 94.2, '2026-05-01 00:00+00', 'arrhenius_v3'],
      ['DC-012', 'BP-2026-012',  370, 95.8, '2026-05-01 00:00+00', 'blade_specific_v1'],
      ['DC-013', 'BP-2026-013', 8000, 92.0, '2026-05-01 00:00+00', 'lto_high_cycle_v2'],
      ['DC-014', 'BP-2026-014', 1200, 78.0, '2026-05-01 00:00+00', 'arrhenius_v3'],
      ['DC-015', 'BP-2026-015', 4200, 62.0, '2026-05-01 00:00+00', 'arrhenius_v3'],
    ];
    for (const c of curves) {
      await client.query(
        `INSERT INTO degradation_curves (curve_id,pack_id,cycle_count,soh_pct,captured_at,model) VALUES ($1,$2,$3,$4,$5,$6)`,
        c
      );
    }

    console.log('[seed] inserting soh_reports...');
    const sohReports = [
      ['SR-2026-001', 'BP-2026-001', 92.4, '2026-Q2', 'Continue current cycling profile. Re-check Q3.', 'final'],
      ['SR-2026-002', 'BP-2026-002', 95.1, '2026-Q2', 'Excellent. Eligible for AS market participation.', 'final'],
      ['SR-2026-003', 'BP-2026-003', 89.0, '2026-Q2', 'Normal aging. No action.', 'final'],
      ['SR-2026-004', 'BP-2026-004', 83.4, '2026-Q2', 'Approaching second-life threshold. Begin downstream planning.', 'final'],
      ['SR-2026-005', 'BP-2026-005', 89.3, '2026-Q2', 'Residential unit healthy.', 'final'],
      ['SR-2026-006', 'BP-2026-006', 82.1, '2026-Q2', 'BMS firmware bug — apply SB-2026-04 patch.', 'final'],
      ['SR-2026-007', 'BP-2026-007', 81.0, '2026-Q2', 'Premature fade — warranty claim WC-2026-002 filed.', 'final'],
      ['SR-2026-008', 'BP-2026-008', 91.0, '2026-Q2', 'Normal.', 'final'],
      ['SR-2026-009', 'BP-2026-009', 87.6, '2026-Q2', 'Reduce DoD to 70% to extend RUL.', 'final'],
      ['SR-2026-010', 'BP-2026-010', 92.8, '2026-Q2', 'Normal.', 'final'],
      ['SR-2026-011', 'BP-2026-011', 94.2, '2026-Q2', 'Premium asset — push into top-paying dispatch windows.', 'final'],
      ['SR-2026-012', 'BP-2026-012', 95.8, '2026-Q2', 'Brand new — establish baseline.', 'draft'],
      ['SR-2026-013', 'BP-2026-013', 92.0, '2026-Q2', 'LTO performing as expected. High-cycle headroom.', 'final'],
      ['SR-2026-014', 'BP-2026-014', 78.0, '2026-Q2', 'Significantly below cohort. Recommend hot-cell isolation + warranty workflow.', 'final'],
      ['SR-2026-015', 'BP-2026-015', 62.0, '2026-Q2', 'End-of-life. Route to second-life evaluation.', 'final'],
    ];
    for (const r of sohReports) {
      await client.query(
        `INSERT INTO soh_reports (report_id,pack_id,soh_pct,period,recommendations,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }

    console.log('[seed] inserting dispatch_schedules...');
    const dispatch = [
      ['DS-001', 'BP-2026-001',  'CAISO_SP15',      100, '2026-05-17 18:00+00', 'scheduled'],
      ['DS-002', 'BP-2026-002',  'CAISO_NP15',       75, '2026-05-17 19:00+00', 'scheduled'],
      ['DS-003', 'BP-2026-008',  'ERCOT_North',     150, '2026-05-17 17:00+00', 'scheduled'],
      ['DS-004', 'BP-2026-009',  'CAISO_SP15',      100, '2026-05-17 18:30+00', 'scheduled'],
      ['DS-005', 'BP-2026-011',  'NEM_SA_FCAS',     500, '2026-05-17 21:00+00', 'scheduled'],
      ['DS-006', 'BP-2026-012',  'NEM_SA_Energy',   500, '2026-05-17 22:00+00', 'scheduled'],
      ['DS-007', 'BP-2026-003',  'EPEX_DE_aFRR',    100, '2026-05-17 19:00+00', 'scheduled'],
      ['DS-008', 'BP-2026-010',  'EPEX_DE_Spot',     90, '2026-05-17 19:00+00', 'scheduled'],
      ['DS-009', 'BP-2026-013',  'BTM_DCFC_Buffer', 350, '2026-05-17 16:00+00', 'executed'],
      ['DS-010', 'BP-2026-006',  'BTM_PeakShave',    50, '2026-05-17 15:00+00', 'executed'],
      ['DS-011', 'BP-2026-014',  'CAISO_SP15',      100, '2026-05-17 18:00+00', 'cancelled'],
      ['DS-012', 'BP-2026-004',  'GB_DC',          1000, '2026-05-17 18:00+00', 'scheduled'],
      ['DS-013', 'BP-2026-005',  'BTM_Residential',  10, '2026-05-17 18:30+00', 'executed'],
      ['DS-014', 'BP-2026-007',  'CAISO_NP15',       80, '2026-05-17 17:00+00', 'executed'],
      ['DS-015', 'BP-2026-002',  'NEM_VIC_FCAS',    250, '2026-05-18 21:00+00', 'scheduled'],
    ];
    for (const d of dispatch) {
      await client.query(
        `INSERT INTO dispatch_schedules (sched_id,pack_id,market,kw,start_at,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        d
      );
    }

    console.log('[seed] inserting recycling_orders...');
    const recycling = [
      ['RO-2026-001', 'BP-2024-088', 'Redwood Materials NV', 'scheduled', '2026-05-25 09:00+00',  3800],
      ['RO-2026-002', 'BP-2024-031', 'Li-Cycle NY',          'in_transit','2026-05-19 11:00+00', 42500],
      ['RO-2026-003', 'BP-2024-014', 'Cirba Solutions OH',   'requested', '2026-06-04 14:00+00', 28000],
      ['RO-2026-004', 'BP-2023-047', 'Ascend Elements MA',   'completed', '2026-04-30 10:00+00', 17800],
      ['RO-2026-005', 'BP-2023-066', 'Cirba Solutions OH',   'completed', '2026-04-22 09:00+00', 19500],
      ['RO-2026-006', 'BP-2022-001', 'Redwood Materials NV', 'completed', '2026-03-12 08:00+00', 12400],
      ['RO-2026-007', 'BP-2022-008', 'Li-Cycle NY',          'completed', '2026-02-28 11:30+00', 32100],
      ['RO-2026-008', 'BP-2026-015', 'American Battery Tech NV','scheduled','2026-06-12 10:00+00',  6200],
      ['RO-2026-009', 'BP-2021-031', 'Redwood Materials NV', 'completed', '2026-01-15 09:00+00',  4900],
      ['RO-2026-010', 'BP-2025-014', 'Li-Cycle NY',          'requested', '2026-06-22 11:00+00', 38400],
      ['RO-2026-011', 'BP-2021-019', 'Cirba Solutions OH',   'completed', '2025-12-05 13:00+00',  8100],
      ['RO-2026-012', 'BP-2024-007', 'Ascend Elements MA',   'requested', '2026-07-01 09:00+00', 21000],
      ['RO-2026-013', 'BP-2020-014', 'Redwood Materials NV', 'completed', '2025-11-04 10:00+00', 11200],
      ['RO-2026-014', 'BP-2023-019', 'Li-Cycle NY',          'cancelled', '2026-05-01 09:00+00',     0],
      ['RO-2026-015', 'BP-2024-022', 'Cirba Solutions OH',   'requested', '2026-08-04 09:00+00', 26500],
    ];
    for (const r of recycling) {
      await client.query(
        `INSERT INTO recycling_orders (order_id,pack_id,vendor,status,scheduled_at,value_usd) VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }

    console.log('[seed] inserting certifications...');
    const certs = [
      ['CRT-001', 'BP-2026-001', 'UL 9540A',        '2024-02-10', '2029-02-10', 'valid'],
      ['CRT-002', 'BP-2026-002', 'UL 9540A',        '2024-04-22', '2029-04-22', 'valid'],
      ['CRT-003', 'BP-2026-005', 'UL 1973',         '2023-02-01', '2028-02-01', 'valid'],
      ['CRT-004', 'BP-2026-008', 'IEC 62619',       '2024-01-15', '2028-01-15', 'valid'],
      ['CRT-005', 'BP-2026-009', 'UL 9540',         '2023-08-01', '2028-08-01', 'valid'],
      ['CRT-006', 'SITE-001',    'CSA C22.2 #340',  '2024-03-10', '2029-03-10', 'valid'],
      ['CRT-007', 'SITE-002',    'AS/NZS 5139',     '2024-11-01', '2029-11-01', 'valid'],
      ['CRT-008', 'SITE-003',    'VDE-AR-N 4110',   '2025-09-01', '2030-09-01', 'valid'],
      ['CRT-009', 'SITE-004',    'G99 Grid Code UK','2024-08-01', '2029-08-01', 'valid'],
      ['CRT-010', 'SITE-005',    'NFPA 855',        '2024-06-01', '2027-06-01', 'valid'],
      ['CRT-011', 'BP-2026-013', 'UN 38.3',         '2024-01-10', '2026-01-10', 'expired'],
      ['CRT-012', 'BP-2026-014', 'UL 9540A',        '2023-08-10', '2028-08-10', 'valid'],
      ['CRT-013', 'BP-2026-015', 'UN 38.3',         '2022-04-19', '2024-04-19', 'expired'],
      ['CRT-014', 'BP-2026-011', 'UL 9540A',        '2024-10-15', '2029-10-15', 'valid'],
      ['CRT-015', 'BP-2026-007', 'ECE R100 Rev3',   '2022-07-12', '2027-07-12', 'valid'],
    ];
    for (const c of certs) {
      await client.query(
        `INSERT INTO certifications (cert_id,asset_id,standard,issued_at,expires_at,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        c
      );
    }

    console.log('[seed] inserting maintenance_logs...');
    const maint = [
      ['ML-2026-001', 'BP-2026-001', 'Quarterly cell balance check',     'T. Nguyen',  1.5, '2026-04-12 10:00+00'],
      ['ML-2026-002', 'BP-2026-002', 'HVAC filter replacement',          'D. Park',    0.8, '2026-04-15 11:00+00'],
      ['ML-2026-003', 'BP-2026-014', 'Hot-cell isolation, MOD-005 swap', 'A. Bauer',   4.5, '2026-04-30 16:00+00'],
      ['ML-2026-004', 'BP-2026-007', 'Capacity test (warranty workflow)','C. Lopez',   3.0, '2026-04-22 14:30+00'],
      ['ML-2026-005', 'BP-2026-008', 'Connector cleaning + dielectric',  'T. Nguyen',  1.2, '2026-05-02 09:00+00'],
      ['ML-2026-006', 'BP-2026-011', 'Cooling loop top-up',              'M. O\'Brien',1.0, '2026-05-08 13:00+00'],
      ['ML-2026-007', 'BP-2026-006', 'BMS firmware update SB-2026-04',   'C. Lopez',   2.0, '2026-04-10 11:30+00'],
      ['ML-2026-008', 'CHG-003',     'PSU module replacement',           'D. Park',    3.5, '2026-05-16 15:00+00'],
      ['ML-2026-009', 'CHG-014',     'Cable terminator reflow',          'M. O\'Brien',2.5, '2026-05-15 18:00+00'],
      ['ML-2026-010', 'SITE-013',    'Aux transformer test',             'A. Bauer',   6.0, '2026-05-10 09:00+00'],
      ['ML-2026-011', 'BP-2026-009', 'Insulation resistance test',       'T. Nguyen',  1.5, '2026-05-13 10:00+00'],
      ['ML-2026-012', 'BP-2026-013', 'LTO buffer capacity verification', 'D. Park',    2.0, '2026-04-25 14:00+00'],
      ['ML-2026-013', 'BP-2026-005', 'Annual residential service',       'C. Lopez',   1.0, '2026-03-30 11:00+00'],
      ['ML-2026-014', 'BP-2026-003', 'Megapack quarterly PM',            'A. Bauer',   3.5, '2026-04-04 09:00+00'],
      ['ML-2026-015', 'SITE-001',    'Fire suppression annual test',     'M. O\'Brien',4.0, '2026-04-18 09:00+00'],
    ];
    for (const m of maint) {
      await client.query(
        `INSERT INTO maintenance_logs (log_id,asset_id,work,technician,hours,completed_at) VALUES ($1,$2,$3,$4,$5,$6)`,
        m
      );
    }

    console.log('[seed] inserting alarms...');
    const alarms = [
      ['AL-2026-001', 'BP-2026-014', 'thermal_hot_cell',           'critical', '2026-05-16 17:55+00', 'open'],
      ['AL-2026-002', 'BP-2026-014', 'soh_below_threshold',        'high',     '2026-05-15 12:00+00', 'open'],
      ['AL-2026-003', 'BP-2026-007', 'cell_imbalance_excessive',   'high',     '2026-05-16 09:00+00', 'open'],
      ['AL-2026-004', 'BP-2026-006', 'bms_communication_dropout',  'medium',   '2026-05-15 14:30+00', 'acknowledged'],
      ['AL-2026-005', 'CHG-003',     'pcu_fault',                  'high',     '2026-05-16 14:00+00', 'open'],
      ['AL-2026-006', 'BP-2026-008', 'insulation_low',             'medium',   '2026-05-16 09:00+00', 'open'],
      ['AL-2026-007', 'BP-2026-011', 'coolant_pressure_low',       'medium',   '2026-05-08 09:30+00', 'closed'],
      ['AL-2026-008', 'BP-2026-001', 'self_discharge_anomaly',     'low',      '2026-05-14 16:00+00', 'open'],
      ['AL-2026-009', 'SITE-013',    'site_offline',               'critical', '2026-05-15 22:00+00', 'acknowledged'],
      ['AL-2026-010', 'BP-2026-009', 'enclosure_seal_breach',      'medium',   '2026-04-08 10:00+00', 'closed'],
      ['AL-2026-011', 'BP-2026-002', 'cell_voltage_drift',         'low',      '2026-05-12 13:00+00', 'open'],
      ['AL-2026-012', 'BP-2026-013', 'fast_charge_throttle_event', 'low',      '2026-05-10 16:00+00', 'closed'],
      ['AL-2026-013', 'CHG-014',     'cable_overtemp',             'high',     '2026-05-15 21:30+00', 'open'],
      ['AL-2026-014', 'BP-2026-012', 'soc_calibration_offset',     'low',      '2026-05-09 12:00+00', 'open'],
      ['AL-2026-015', 'BP-2026-010', 'soh_below_spec',             'medium',   '2026-04-26 11:00+00', 'open'],
    ];
    for (const a of alarms) {
      await client.query(
        `INSERT INTO alarms (alarm_id,asset_id,type,severity,opened_at,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        a
      );
    }

    console.log('[seed] inserting audit_log...');
    const audit = [
      ['AU-0001', 'admin@batterylife.io',  'BP-2026-014',     'thermal_event_ack',  'success', '2026-05-16 18:01+00'],
      ['AU-0002', 'ops@batterylife.io',    'WC-2026-001',     'warranty_open',      'success', '2026-04-11 14:00+00'],
      ['AU-0003', 'admin@batterylife.io',  'SL-2026-007',     'second_life_route',  'success', '2026-04-30 10:00+00'],
      ['AU-0004', 'ops@batterylife.io',    'DS-011',          'dispatch_cancel',    'success', '2026-05-16 09:00+00'],
      ['AU-0005', 'admin@batterylife.io',  'CUS-015',         'customer_churn',     'success', '2026-03-01 09:00+00'],
      ['AU-0006', 'ops@batterylife.io',    'AL-2026-004',     'alarm_ack',          'success', '2026-05-15 14:32+00'],
      ['AU-0007', 'viewer@batterylife.io', 'SR-2026-007',     'report_view',        'success', '2026-05-01 11:00+00'],
      ['AU-0008', 'admin@batterylife.io',  'RO-2026-002',     'recycling_dispatch', 'success', '2026-05-19 11:00+00'],
      ['AU-0009', 'ops@batterylife.io',    'BP-2026-006',     'firmware_apply',     'success', '2026-04-10 11:30+00'],
      ['AU-0010', 'admin@batterylife.io',  'LSE-013',         'lease_expire',       'success', '2026-04-01 09:00+00'],
      ['AU-0011', 'ops@batterylife.io',    'BP-2026-014',     'soh_report_publish', 'success', '2026-05-01 11:00+00'],
      ['AU-0012', 'admin@batterylife.io',  'CHG-014',         'charger_offline',    'success', '2026-05-15 22:00+00'],
      ['AU-0013', 'ops@batterylife.io',    'BP-2026-011',     'cooling_topup_log',  'success', '2026-05-08 13:00+00'],
      ['AU-0014', 'admin@batterylife.io',  'CRT-013',         'cert_expire_notice', 'success', '2024-04-19 00:00+00'],
      ['AU-0015', 'viewer@batterylife.io', 'SITE-002',        'dashboard_view',     'success', '2026-05-16 09:00+00'],
    ];
    for (const a of audit) {
      await client.query(
        `INSERT INTO audit_log (entry_id,actor,target,action,result,ts) VALUES ($1,$2,$3,$4,$5,$6)`,
        a
      );
    }

    console.log('[seed] complete.');
  } catch (e) {
    console.error('[seed] error:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
