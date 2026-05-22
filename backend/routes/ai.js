const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

// Persist every AI result so the frontend history viewer can show it later.
async function record(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]
    );
  } catch (e) {
    console.warn(`[ai] failed to record ${feature}:`, e.message);
  }
}

// ──────────────────────────────────────────────────────────────
// Sample fills — realistic battery / BESS / EV-second-life scenarios.
// The `values` keys match the field `key`s used by frontend AI pages.
// ──────────────────────────────────────────────────────────────
const SAMPLES = {
  'degradation-forecast': [
    { label: '150 kWh LFP pack, 1200 cycles, 78% SoH',
      values: { pack_summary: 'Pack BP-2026-014: LFP chemistry, 150 kWh nameplate, 1200 cycles, current SoH 78%, installed 2023-08, utility BESS frequency-regulation duty.', horizon_cycles: 2000 } },
    { label: '60 kWh NMC EV pack, 1850 cycles, 81% SoH',
      values: { pack_summary: 'Pack BP-2026-007: NMC811 chemistry, 60 kWh, 1850 cycles, current SoH 81%, EV traction battery from 2022 sedan fleet, DC fast-charge heavy.', horizon_cycles: 1500 } },
    { label: '400 kWh LFP grid storage, 3200 cycles, 84% SoH',
      values: { pack_summary: 'Pack BP-2026-021: 400 kWh LFP rack, 3200 cycles, SoH 84%, 4-hour duration peaker, summer-only dispatch with 25% DoD avg.', horizon_cycles: 3000 } },
    { label: '20 kWh NCA home battery, 900 cycles, 89% SoH',
      values: { pack_summary: 'Pack BP-2026-005: 20 kWh NCA wall unit, 900 cycles, SoH 89%, residential self-consumption duty, mild climate Texas.', horizon_cycles: 2500 } },
    { label: '2 MWh LTO fast-charging buffer, 8000 cycles, 92% SoH',
      values: { pack_summary: 'Pack BP-2026-031: 2 MWh LTO buffer at 350 kW DC fast-charge station, 8000 cycles, SoH 92%, ultra-high cycle chemistry.', horizon_cycles: 5000 } },
  ],

  'soh-trend': [
    { label: 'Fleet snapshot (default)', values: {} },
    { label: 'Fleet snapshot (default)', values: {} },
    { label: 'Fleet snapshot (default)', values: {} },
    { label: 'Fleet snapshot (default)', values: {} },
    { label: 'Fleet snapshot (default)', values: {} },
  ],

  'warranty-draft': [
    { label: 'LFP thermal event under warranty',
      values: { claim_summary: 'Pack BP-2026-014 (LFP, vendor CATL, installed 2023-08) experienced single-cell thermal event 2026-04-11, vented but contained by pack BMS. Customer Stadtwerke Munich requests full pack replacement under 10-year/80% SoH warranty. Current SoH 78%.' } },
    { label: 'NMC EV pack premature fade',
      values: { claim_summary: 'EV pack BP-2026-007 (NMC811, vendor LG Energy Solution) at 1850 cycles shows SoH 81% — below contractual 85% at 2000 cycles. Customer EVgo requests prorated credit.' } },
    { label: 'BMS firmware bug — fleet-wide',
      values: { claim_summary: 'Vendor BYD issued service bulletin SB-2026-04 for BMS firmware bug causing premature SEI growth. 14 packs in our fleet affected. Drafting blanket warranty claim for SoH recalibration credit.' } },
    { label: 'Out-of-warranty cell failure',
      values: { claim_summary: 'Pack BP-2024-088 (Tesla Megapack, installed 2019, out of 5-year base warranty) shows two failed modules. Customer requests goodwill repair. Extended warranty was declined at sale.' } },
    { label: 'Transit damage on new delivery',
      values: { claim_summary: 'Pack BP-2026-051 arrived 2026-05-12 with crushed corner enclosure and one fault-state module on first power-up. Carrier was Schneider; vendor Fluence; claim against vendor for shipping damage.' } },
  ],

  'second-life-route': [
    { label: 'EV pack 72% SoH → home storage',
      values: { unit_summary: 'Retired EV pack SL-2026-009: ex-2021 sedan, NMC, 60 kWh, SoH 72%, 1900 cycles. Mechanically sound, BMS healthy. Candidate for residential 10 kWh stationary repurposing.' } },
    { label: 'Bus pack 65% SoH → telecom backup',
      values: { unit_summary: 'Retired transit-bus pack SL-2026-014: LFP, 250 kWh originally, SoH 65%, 4200 cycles. Heavy chassis-vibration exposure. Candidate for telecom-tower backup (low-cycle, deep-discharge).' } },
    { label: 'Fleet van pack 78% SoH → microgrid',
      values: { unit_summary: 'Retired delivery-van pack SL-2026-022: NMC622, 75 kWh, SoH 78%, 1100 cycles. Below contractual EV threshold but lots of life left. Candidate for solar-microgrid 4-hour storage in rural Kenya.' } },
    { label: 'Grid pack 60% SoH → recycle?',
      values: { unit_summary: 'Retired utility BESS pack SL-2026-031: LFP, 200 kWh, SoH 60%, 5500 cycles. Multiple cell-level imbalances. Likely below economic threshold for repurposing.' } },
    { label: 'Pilot-car pack 81% SoH → EV charger buffer',
      values: { unit_summary: 'Retired ride-share EV pack SL-2026-040: NCA, 85 kWh, SoH 81%, 1600 cycles, 200k miles. Strong candidate for 250 kW DC fast-charger buffer to reduce grid demand charges.' } },
  ],

  'dispatch-optimize': [
    { label: 'CAISO summer peak — 4hr LFP',
      values: { pack_summary: 'Pack BP-2026-021: 400 kWh / 100 kW 4-hour LFP rack at Bakersfield site. Cycle budget 1.0 cycles/day. Current SoH 84%.', market_summary: 'CAISO SP15 day-ahead, 17 July, peak forecast $310/MWh 18:00-21:00, off-peak $42/MWh 02:00-05:00. AS market: spin $14/MW-h, reg-up $22/MW-h.' } },
    { label: 'ERCOT volatility play',
      values: { pack_summary: 'Pack BP-2026-018: 600 kWh / 150 kW 4-hour LFP at Houston. SoH 88%.', market_summary: 'ERCOT West hub day-ahead, scarcity-pricing event expected 16:00-19:00 with cap $5000/MWh. ECRS service eligible.' } },
    { label: 'UK BM dynamic containment',
      values: { pack_summary: 'Pack BP-2026-027: 1 MWh / 1 MW 1-hour LFP at Drax site. SoH 91%.', market_summary: 'GB BM Dynamic Containment Low at £17/MW-h availability through 23:00, then Dynamic Regulation Down £8/MW-h overnight.' } },
    { label: 'Germany aFRR + spot arbitrage',
      values: { pack_summary: 'Pack BP-2026-033: 2 MWh / 500 kW 4-hour LFP, Ostdeutschland.', market_summary: 'EPEX DE spot peak €165/MWh 19:00, trough €18/MWh 13:00 (solar saturation). aFRR positive €14/MW-h overnight.' } },
    { label: 'Australia FCAS contingency raise',
      values: { pack_summary: 'Pack BP-2026-044: 3 MWh / 1.5 MW 2-hour LFP, Hornsdale.', market_summary: 'NEM SA region, raise-6-sec FCAS A$48/MW-h, raise-60-sec A$22/MW-h, energy peak A$280/MWh 17:00-20:00.' } },
  ],

  'thermal-risk': [
    { label: 'Pack thermal runaway risk, summer peak',
      values: { context_summary: 'Pack BP-2026-014 in Phoenix BESS site: ambient 47°C, cells avg 52°C, hot cell #182 at 61°C (+9°C delta). HVAC at 85% capacity. SoH 78%. Three high-rate dispatches last 4 hours.' } },
    { label: 'EV pack DC fast-charge stress',
      values: { context_summary: 'Pack BP-2026-007 in EVgo Sacramento: NMC, mid-charge at 150 kW, cell temps 38-44°C, ambient 28°C, no hot-cell flag. SoH 81%.' } },
    { label: 'Marine container moisture event',
      values: { context_summary: 'Pack BP-2026-051 inside 20-ft container, just unloaded at Port of Long Beach. Internal humidity 78%, BMS reports insulation resistance drop on Module C. Temp normal 22°C.' } },
    { label: 'Outdoor BESS, no airflow',
      values: { context_summary: 'Pack BP-2026-029 outdoor rack, fan motor failed 6 hours ago. Cell temps 49-58°C and climbing 1°C every 30 min. SoC 65%. Discharge throttled to 30%.' } },
    { label: 'Cold-soak surprise',
      values: { context_summary: 'Pack BP-2026-018 in Houston, sudden cold snap -8°C, ambient drop 35°C in 12 hours. Cell temps 1-4°C. About to be called for ERCOT scarcity dispatch.' } },
  ],

  'cell-balance-suggest': [
    { label: '14S LFP module — 80 mV spread',
      values: { cells_summary: 'Module M-2026-014-A, 14 cells in series, LFP 280Ah. Cell voltages range 3.252-3.332 V (80 mV spread). Two outliers: cell 4 at 3.252 V, cell 11 at 3.332 V. Pack at 60% SoC. Last balance 9 days ago.' } },
    { label: '96S NMC EV — 140 mV spread (significant)',
      values: { cells_summary: 'EV pack BP-2026-007, 96S NMC811. Voltage spread 140 mV (cell 47 low at 3.91 V, cell 12 high at 4.05 V). SoC 75%. No balance for 2 weeks (vehicle plugged in only occasionally).' } },
    { label: '16S LFP home battery — 12 mV (healthy)',
      values: { cells_summary: 'Home pack BP-2026-005, 16S LFP. Voltage spread 12 mV. Routine balance check.' } },
    { label: '14S LFP — single high cell after thermal event',
      values: { cells_summary: 'Module M-2026-021-B after suspected micro-short. Cell 7 voltage 0.18 V above peers, temp +6°C above pack average. SoC 50%.' } },
    { label: '12S LFP — drifting low cell',
      values: { cells_summary: 'Module M-2026-031-C trending lower SoC than siblings — cell 3 capacity ~92% of others over last 30 cycles.' } },
  ],

  'executive-brief': [
    { label: 'Default snapshot — no bias', values: { notes: '' } },
    { label: 'Bias toward warranty exposure',
      values: { notes: 'Bias the brief toward open warranty claims, vendor concentration risk and reserve adequacy.' } },
    { label: 'Bias toward second-life economics',
      values: { notes: 'Focus the brief on second-life pipeline, downstream recipient demand and net resale economics.' } },
    { label: 'Bias toward dispatch revenue',
      values: { notes: 'Focus the brief on dispatch revenue performance vs forecast, market-by-market.' } },
    { label: 'Bias toward thermal / safety',
      values: { notes: 'Focus the brief on thermal incidents, hot-cell trends, and safety governance.' } },
  ],

  'recycling-quote': [
    { label: 'Tesla Powerwall — end of life',
      values: { pack_summary: 'Retired residential pack BP-2024-088, NMC, 14 kWh, 60 kg, SoH 38%. Customer-returned, intact enclosure.', vendor_summary: 'Vendor: Redwood Materials, Carson City NV. Standard pickup. Current Li carbonate $14/kg, Ni sulfate $18/kg, Co sulfate $42/kg.' } },
    { label: 'Utility LFP rack',
      values: { pack_summary: 'Retired BESS pack BP-2024-031, LFP, 200 kWh, 2400 kg, SoH 42%. Decommissioned at Bakersfield.', vendor_summary: 'Vendor: Li-Cycle, Rochester NY. LFP recovery focus. Iron phosphate market weak, Li carbonate strong.' } },
    { label: 'Bus pack — bulk',
      values: { pack_summary: 'Retired transit-bus pack BP-2024-014, LFP, 250 kWh, 1850 kg, SoH 52%. Heavy vibration history.', vendor_summary: 'Vendor: Cirba Solutions, Lancaster OH. Bulk discount possible for 12-pack lot.' } },
    { label: 'NCA premium recovery',
      values: { pack_summary: 'Retired EV pack BP-2023-047, NCA, 85 kWh, 540 kg, SoH 28% (heavy damage from collision).', vendor_summary: 'Vendor: Ascend Elements, Worcester MA. Hydro-to-cathode process — premium recovery on Ni/Co.' } },
    { label: 'Test cells / R&D scrap',
      values: { pack_summary: 'R&D scrap: 320 prismatic LFP cells, 50 Ah each, mixed states. Total ~480 kg.', vendor_summary: 'Vendor: American Battery Technology Co, Reno NV. R&D-friendly intake.' } },
  ],

  'vendor-quality-score': [
    { label: 'CATL — utility LFP', values: { vendor_summary: 'Vendor: CATL. 47 packs in fleet, mostly LFP 280Ah cells, installed 2023-2025. Avg SoH 86% at avg 1400 cycles. 2 warranty claims in 12 months. Zero thermal events. On-time delivery 96%.' } },
    { label: 'LG Energy Solution — EV NMC', values: { vendor_summary: 'Vendor: LG Energy Solution. 32 packs (NMC811, ex-EV). Avg SoH 79% at avg 1850 cycles — slightly below spec. 6 warranty claims (premature fade). 1 thermal venting event. On-time delivery 92%.' } },
    { label: 'BYD — utility blade', values: { vendor_summary: 'Vendor: BYD. 18 packs (Blade LFP). Avg SoH 89% at 1200 cycles. 1 warranty claim (BMS firmware bug — SB-2026-04, vendor-acknowledged). On-time delivery 88% (port congestion).' } },
    { label: 'Tesla — Megapack', values: { vendor_summary: 'Vendor: Tesla. 8 Megapacks deployed 2022-2024. Avg SoH 91% at 1100 cycles. Zero warranty claims. Zero thermal events. On-time delivery 100%. Premium price.' } },
    { label: 'Fluence — utility BESS', values: { vendor_summary: 'Vendor: Fluence. 12 packs (LFP, third-party cells: EVE / CATL mix). Avg SoH 84% at 1500 cycles. 3 warranty claims. 1 transit-damage event. On-time delivery 90%.' } },
  ],

  'customer-soh-report': [
    { label: 'Stadtwerke Munich — utility BESS', values: { customer_summary: 'Customer: Stadtwerke Munich. Utility, 6 packs leased (LFP, 400-600 kWh each). Quarterly review.' } },
    { label: 'EVgo — DC fast-charge fleet', values: { customer_summary: 'Customer: EVgo. Charging-network operator, 14 packs (LTO buffers at fast-charge stations). Monthly review.' } },
    { label: 'Acme Microgrid Kenya', values: { customer_summary: 'Customer: Acme Microgrid Kenya. Off-grid operator, 22 second-life packs (NMC 60-80 kWh ex-EV). Semi-annual review.' } },
    { label: 'Texas Solar Co-op', values: { customer_summary: 'Customer: Texas Solar Co-op. 88 residential customers, 88 home batteries (NCA 20 kWh). Annual report bundle.' } },
    { label: 'Hornsdale Power Reserve', values: { customer_summary: 'Customer: Hornsdale Power Reserve (AGL). FCAS-focused, 4 packs (3 MWh each, LFP). Monthly review.' } },
  ],

  'fleet-health': [
    { label: 'Whole-fleet snapshot (default)', values: {} },
    { label: 'Whole-fleet snapshot (default)', values: {} },
    { label: 'Whole-fleet snapshot (default)', values: {} },
    { label: 'Whole-fleet snapshot (default)', values: {} },
    { label: 'Whole-fleet snapshot (default)', values: {} },
  ],

  'anomaly-cluster': [
    { label: 'Recent open alarms (default)', values: {} },
    { label: 'Recent open alarms (default)', values: {} },
    { label: 'Recent open alarms (default)', values: {} },
    { label: 'Recent open alarms (default)', values: {} },
    { label: 'Recent open alarms (default)', values: {} },
  ],

  'capacity-fade-explain': [
    { label: 'LFP pack faster than expected',
      values: { pack_summary: 'Pack BP-2026-014: LFP 150 kWh, installed 2023-08. Current SoH 78% at 1200 cycles. Vendor cycle-life curve predicts SoH 86% at this point. Site has high ambient (Phoenix), 1.2 cycles/day, DoD 70% avg.', history_summary: 'SEI baseline + 3 cells flagged for elevated impedance in last 90 days. Two thermal-event near-misses in last 6 months.' } },
    { label: 'NCA home unit graceful aging',
      values: { pack_summary: 'Pack BP-2026-005: NCA 20 kWh wall unit. SoH 89% at 900 cycles, vendor curve 88%. Texas residential, mild duty.', history_summary: 'No anomalies. Routine.' } },
    { label: 'NMC EV with knee-point',
      values: { pack_summary: 'Pack BP-2026-007: NMC811 60 kWh, ex-2022 sedan. SoH 81% at 1850 cycles. Vendor curve predicts 84%. DC-fast-charge ratio 38% of cycles (high).', history_summary: 'Sharper-than-expected slope past 1500 cycles. Possible knee-point. Suspect lithium plating from cold-weather DCFC.' } },
    { label: 'LFP grid pack — long calendar life',
      values: { pack_summary: 'Pack BP-2026-021: 400 kWh LFP, 8 years calendar age, only 3200 cycles. SoH 84%.', history_summary: 'Light cycling, primarily calendar aging. Outdoor cabinet in mild climate (Bakersfield).' } },
    { label: 'LTO buffer — almost no fade',
      values: { pack_summary: 'Pack BP-2026-031: LTO 2 MWh, 8000 cycles, SoH 92%.', history_summary: 'LTO chemistry, fast-charge buffer duty. Very low fade per cycle as expected.' } },
  ],

  'replacement-timeline': [
    { label: 'Whole-fleet 36-month horizon (default)', values: { horizon_months: 36 } },
    { label: 'High-risk LFP cohort 24-month',         values: { horizon_months: 24 } },
    { label: 'NMC EV second-life-eligible 18-month', values: { horizon_months: 18 } },
    { label: 'Residential 60-month long view',       values: { horizon_months: 60 } },
    { label: 'Mission-critical packs 12-month',      values: { horizon_months: 12 } },
  ],

  'ppa-revenue-forecast': [
    { label: 'Bakersfield 400 kWh — 10yr tolling',
      values: { site_summary: 'Site BP-S-001 Bakersfield CA: 400 kWh / 100 kW LFP, 4-hr duration, online 2024-03, SoH 84%.', ppa_summary: '10-year tolling agreement with PG&E at $14/kW-month capacity + AS upside split 70/30. Annual degradation guarantee 2.5%.' } },
    { label: 'Hornsdale 150 MWh — merchant + FCAS',
      values: { site_summary: 'Site BP-S-014 Hornsdale: 150 MWh / 100 MW LFP. SoH 91%.', ppa_summary: 'No PPA — merchant + FCAS contingency raise. NEM South Australia. AEMO MMS forecast.' } },
    { label: 'Ostdeutschland 50 MWh — aFRR contract',
      values: { site_summary: 'Site BP-S-027 Brandenburg: 50 MWh / 12.5 MW LFP, online 2025-09, SoH 92%.', ppa_summary: '5-year aFRR availability contract with 50Hertz at €78,000/MW-yr + energy upside.' } },
    { label: 'Drax 1 MWh DC asset',
      values: { site_summary: 'Site BP-S-033 Drax UK: 1 MWh / 1 MW LFP, 1-hr duration.', ppa_summary: 'GB Dynamic Containment & Dynamic Regulation rotation, no PPA, fully merchant.' } },
    { label: 'EVgo Sacramento DCFC buffer',
      values: { site_summary: 'Site BP-S-051 Sacramento CA EVgo hub: 2 MWh LTO buffer at 350 kW fast-charge station.', ppa_summary: 'Behind-the-meter demand-charge avoidance + EV-session arbitrage. No formal PPA.' } },
  ],

  'end-of-life-classify': [
    { label: 'NMC EV pack 68% SoH, knee-point passed',
      values: { pack_summary: 'Pack BP-2024-088: NMC 60 kWh, SoH 68%, 2400 cycles, knee-point past. Customer EV out-of-warranty. Module M3 flagged twice for high impedance.' } },
    { label: 'LFP grid pack 82% SoH, still healthy',
      values: { pack_summary: 'Pack BP-2026-021: LFP 400 kWh, SoH 82%, 3400 cycles, no anomalies, 4-hour duty.' } },
    { label: 'Damaged transit unit, SoH unknown',
      values: { pack_summary: 'Pack BP-2026-051: arrived crushed, BMS unresponsive. Insurance claim filed.' } },
    { label: 'Home NCA 60% SoH, 12-year-old',
      values: { pack_summary: 'Pack BP-2014-005: NCA 20 kWh wall unit, 12 years calendar, SoH 60%. Customer requesting replacement.' } },
    { label: 'Bus LFP 58% SoH, 5400 cycles',
      values: { pack_summary: 'Pack BP-2020-014: LFP 250 kWh, transit bus, SoH 58%, 5400 cycles, chassis vibration history.' } },
  ],

  'second-life-suitability': [
    { label: 'Ex-EV NMC 72% SoH — home market',
      values: { unit_summary: 'Unit SL-2026-009: NMC, 60 kWh nameplate, SoH 72%, 1900 cycles, BMS healthy.' } },
    { label: 'Ex-bus LFP 65% SoH — telecom?',
      values: { unit_summary: 'Unit SL-2026-014: LFP, 250 kWh, SoH 65%, 4200 cycles, heavy vibration history.' } },
    { label: 'Ex-fleet NMC 78% SoH — microgrid Kenya',
      values: { unit_summary: 'Unit SL-2026-022: NMC622, 75 kWh, SoH 78%, 1100 cycles, off-contract.' } },
    { label: 'Grid pack 60% SoH — borderline',
      values: { unit_summary: 'Unit SL-2026-031: LFP 200 kWh, SoH 60%, 5500 cycles, cell imbalance.' } },
    { label: 'Ride-share NCA 81% SoH — DCFC buffer',
      values: { unit_summary: 'Unit SL-2026-040: NCA, 85 kWh, SoH 81%, 1600 cycles, 200k miles.' } },
  ],

  'thermal-anomaly-detect': [
    { label: '5-min window — single hot cell',
      values: { window_summary: 'Pack BP-2026-014, 5-minute telemetry window: 14 cells, avg 38°C, cell 7 at 47°C (+9°C delta), rising 0.6°C/min. Ambient 32°C, fan at 100%.' } },
    { label: '15-min window — sensor failure suspect',
      values: { window_summary: 'Pack BP-2026-029, 15-minute window: cell 3 reading -40°C (impossible), siblings normal 28-32°C. Likely sensor.' } },
    { label: 'Sustained delta — module C',
      values: { window_summary: 'Pack BP-2026-021, 1-hour window: Module C cells consistently +6°C above modules A/B/D. Coolant flow flagged low.' } },
    { label: '2-min window — DCFC burst',
      values: { window_summary: 'Pack BP-2026-007 mid-DC-fast-charge, 2-minute window: cells 38-44°C, no outliers, ambient 28°C, normal profile.' } },
    { label: '10-min window — rapid rise after fan loss',
      values: { window_summary: 'Pack BP-2026-029 outdoor BESS: fan failed 8 min ago, all cells climbing 1°C every 90s, currently 49-58°C.' } },
  ],

  'recycling-stream-route': [
    { label: 'NMC EV pack — hydromet candidate',
      values: { pack_summary: 'Retired pack BP-2024-088: NMC811, 60 kWh, 380 kg, SoH 38%. Contains valuable Co and Ni. Customer-returned, intact.' } },
    { label: 'LFP grid pack — direct or hydromet?',
      values: { pack_summary: 'Retired pack BP-2024-031: LFP 280Ah cells, 200 kWh, 2400 kg, SoH 42%. Low Co/Ni value, Li and Fe-phosphate recovery focus.' } },
    { label: 'NCA premium recovery',
      values: { pack_summary: 'Retired pack BP-2023-047: NCA, 85 kWh, 540 kg, collision damage. Premium Ni/Co content.' } },
    { label: 'LTO buffer scrap',
      values: { pack_summary: 'Retired pack BP-2022-031: LTO, 2 MWh, 9200 kg. Titanate cells, very low cobalt, specialty stream.' } },
    { label: 'Mixed R&D cell lot',
      values: { pack_summary: 'R&D scrap lot: 320 prismatic LFP cells, mixed states, ~480 kg total. Will need mechanical pretreatment first.' } },
  ],

  'soc-predict': [
    { label: '4-hr LFP idle — overnight float',
      values: { context_summary: 'Pack BP-2026-021: LFP 400 kWh, current SoC 78%, idle overnight. Site holding for 06:00 dispatch. Ambient 18°C.', horizon_minutes: 360 } },
    { label: 'EV DCFC mid-session — 30 min',
      values: { context_summary: 'Pack BP-2026-007: NMC 60 kWh, charging at 150 kW DC, current SoC 42%, taper expected past 80%.', horizon_minutes: 30 } },
    { label: 'BESS scheduled discharge — 4 hr',
      values: { context_summary: 'Pack BP-2026-021: LFP 400 kWh, SoC 92%, beginning 4-hr discharge into CAISO peak at 100 kW.', horizon_minutes: 240 } },
    { label: 'FCAS regulation — 1 hr',
      values: { context_summary: 'Pack BP-2026-044: 3 MWh LFP, currently SoC 55%, providing raise-6-sec FCAS, expected net energy flat.', horizon_minutes: 60 } },
    { label: 'Home self-consumption — 12 hr',
      values: { context_summary: 'Pack BP-2026-005: 20 kWh NCA home unit, SoC 88%, sunset in 4 hr, household evening load ~3 kWh.', horizon_minutes: 720 } },
  ],
};

// GET /api/ai/samples?feature=<verb>
router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) {
      return res.json({ features: Object.keys(SAMPLES) });
    }
    const samples = SAMPLES[feature];
    if (!samples) {
      return res.status(404).json({ error: `unknown feature: ${feature}` });
    }
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/ai/history?feature=<name>&limit=<n>
router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    let r;
    if (feature) {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results WHERE feature = $1 ORDER BY created_at DESC LIMIT $2',
        [feature, limit]
      );
    } else {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
    }
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 1. degradation-forecast ───────────
router.post('/degradation-forecast', async (req, res) => {
  try {
    const { pack_summary, horizon_cycles } = req.body || {};
    const pack = pack_summary || (await pool.query('SELECT * FROM battery_packs ORDER BY id ASC LIMIT 1')).rows[0] || {};
    const horizon = { cycles: horizon_cycles ?? 2000 };
    const result = await ai.degradationForecast(pack, horizon);
    await record('degradation-forecast', { pack_summary, horizon_cycles }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 2. soh-trend ───────────
router.post('/soh-trend', async (req, res) => {
  try {
    let packs = req.body?.packs;
    if (!packs) {
      const r = await pool.query('SELECT * FROM battery_packs ORDER BY id ASC LIMIT 30');
      packs = r.rows;
    }
    const result = await ai.sohTrend(packs);
    await record('soh-trend', { packs_count: packs.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 3. warranty-draft ───────────
router.post('/warranty-draft', async (req, res) => {
  try {
    const { claim_summary } = req.body || {};
    if (!claim_summary) return res.status(400).json({ error: 'claim_summary is required' });
    const result = await ai.warrantyDraft({ claim_summary });
    await record('warranty-draft', { claim_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 4. second-life-route ───────────
router.post('/second-life-route', async (req, res) => {
  try {
    const { unit_summary } = req.body || {};
    if (!unit_summary) return res.status(400).json({ error: 'unit_summary is required' });
    const result = await ai.secondLifeRoute({ unit_summary });
    await record('second-life-route', { unit_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 5. dispatch-optimize ───────────
router.post('/dispatch-optimize', async (req, res) => {
  try {
    const { pack_summary, market_summary } = req.body || {};
    if (!pack_summary) return res.status(400).json({ error: 'pack_summary is required' });
    const result = await ai.dispatchOptimize({ pack_summary }, { market_summary });
    await record('dispatch-optimize', { pack_summary, market_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 6. thermal-risk ───────────
router.post('/thermal-risk', async (req, res) => {
  try {
    const { context_summary } = req.body || {};
    if (!context_summary) return res.status(400).json({ error: 'context_summary is required' });
    const result = await ai.thermalRisk({ context_summary });
    await record('thermal-risk', { context_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 7. cell-balance-suggest ───────────
router.post('/cell-balance-suggest', async (req, res) => {
  try {
    const { cells_summary } = req.body || {};
    if (!cells_summary) return res.status(400).json({ error: 'cells_summary is required' });
    const result = await ai.cellBalanceSuggest([{ cells_summary }]);
    await record('cell-balance-suggest', { cells_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 8. executive-brief ───────────
router.post('/executive-brief', async (req, res) => {
  try {
    const [packs, warranty, secondLife, alarms, dispatch] = await Promise.all([
      pool.query("SELECT COUNT(*) FILTER (WHERE status='in_service') AS in_service, COUNT(*) FILTER (WHERE status='warning') AS warning, COUNT(*) FILTER (WHERE status='retired') AS retired, COUNT(*) AS total FROM battery_packs"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) FILTER (WHERE status='approved') AS approved, COUNT(*) AS total FROM warranty_claims"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='routed') AS routed, COUNT(*) FILTER (WHERE status='evaluation') AS evaluation, COUNT(*) AS total FROM second_life_units"),
      pool.query("SELECT COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) AS total FROM alarms"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COUNT(*) AS total FROM dispatch_schedules"),
    ]);
    const snapshot = {
      battery_packs: packs.rows[0],
      warranty_claims: warranty.rows[0],
      second_life_units: secondLife.rows[0],
      alarms: alarms.rows[0],
      dispatch_schedules: dispatch.rows[0],
      ...(req.body?.notes ? { notes: req.body.notes } : {}),
    };
    const result = await ai.executiveBrief(snapshot);
    const out = { snapshot, brief: result };
    await record('executive-brief', { notes: req.body?.notes || null }, out);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 9. recycling-quote ───────────
router.post('/recycling-quote', async (req, res) => {
  try {
    const { pack_summary, vendor_summary } = req.body || {};
    if (!pack_summary) return res.status(400).json({ error: 'pack_summary is required' });
    const result = await ai.recyclingQuote({ pack_summary }, { vendor_summary });
    await record('recycling-quote', { pack_summary, vendor_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 10. vendor-quality-score ───────────
router.post('/vendor-quality-score', async (req, res) => {
  try {
    const { vendor_summary } = req.body || {};
    if (!vendor_summary) return res.status(400).json({ error: 'vendor_summary is required' });
    const result = await ai.vendorQualityScore({ vendor_summary });
    await record('vendor-quality-score', { vendor_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 11. customer-soh-report ───────────
router.post('/customer-soh-report', async (req, res) => {
  try {
    const { customer_summary } = req.body || {};
    if (!customer_summary) return res.status(400).json({ error: 'customer_summary is required' });
    const packs = (await pool.query('SELECT * FROM battery_packs ORDER BY id ASC LIMIT 12')).rows;
    const result = await ai.customerSohReport({ customer_summary }, packs);
    await record('customer-soh-report', { customer_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 12. fleet-health ───────────
router.post('/fleet-health', async (req, res) => {
  try {
    const [packs, cells, alarms, warranty] = await Promise.all([
      pool.query('SELECT * FROM battery_packs ORDER BY id ASC LIMIT 30'),
      pool.query("SELECT status, COUNT(*) AS count FROM cells GROUP BY status"),
      pool.query("SELECT severity, status, COUNT(*) AS count FROM alarms GROUP BY severity, status"),
      pool.query("SELECT status, COUNT(*) AS count FROM warranty_claims GROUP BY status"),
    ]);
    const snapshot = {
      packs: packs.rows,
      cells_by_status: cells.rows,
      alarms_summary: alarms.rows,
      warranty_summary: warranty.rows,
    };
    const result = await ai.fleetHealth(snapshot);
    await record('fleet-health', { packs_count: packs.rows.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 13. anomaly-cluster ───────────
router.post('/anomaly-cluster', async (req, res) => {
  try {
    let alarms = req.body?.alarms;
    if (!alarms) {
      const r = await pool.query("SELECT * FROM alarms WHERE status='open' ORDER BY opened_at DESC LIMIT 30");
      alarms = r.rows;
    }
    const result = await ai.anomalyCluster(alarms);
    await record('anomaly-cluster', { alarms_count: alarms.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 14. capacity-fade-explain ───────────
router.post('/capacity-fade-explain', async (req, res) => {
  try {
    const { pack_summary, history_summary } = req.body || {};
    if (!pack_summary) return res.status(400).json({ error: 'pack_summary is required' });
    const result = await ai.capacityFadeExplain({ pack_summary }, [{ history_summary }]);
    await record('capacity-fade-explain', { pack_summary, history_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 15. replacement-timeline ───────────
router.post('/replacement-timeline', async (req, res) => {
  try {
    const horizonMonths = Number(req.body?.horizon_months) || 36;
    const packs = (await pool.query('SELECT * FROM battery_packs ORDER BY id ASC LIMIT 30')).rows;
    const result = await ai.replacementTimeline(packs.map((p) => ({ ...p, _horizon_months: horizonMonths })));
    await record('replacement-timeline', { horizon_months: horizonMonths, packs_count: packs.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 16. ppa-revenue-forecast ───────────
router.post('/ppa-revenue-forecast', async (req, res) => {
  try {
    const { site_summary, ppa_summary } = req.body || {};
    if (!site_summary) return res.status(400).json({ error: 'site_summary is required' });
    const result = await ai.ppaRevenueForecast({ site_summary }, { ppa_summary });
    await record('ppa-revenue-forecast', { site_summary, ppa_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 17. end-of-life-classify ───────────
router.post('/end-of-life-classify', async (req, res) => {
  try {
    const { pack_summary } = req.body || {};
    if (!pack_summary) return res.status(400).json({ error: 'pack_summary is required' });
    const result = await ai.endOfLifeClassify({ pack_summary });
    await record('end-of-life-classify', { pack_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 18. second-life-suitability ───────────
router.post('/second-life-suitability', async (req, res) => {
  try {
    const { unit_summary } = req.body || {};
    if (!unit_summary) return res.status(400).json({ error: 'unit_summary is required' });
    const result = await ai.secondLifeSuitability({ unit_summary });
    await record('second-life-suitability', { unit_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 19. thermal-anomaly-detect ───────────
router.post('/thermal-anomaly-detect', async (req, res) => {
  try {
    const { window_summary } = req.body || {};
    if (!window_summary) return res.status(400).json({ error: 'window_summary is required' });
    const result = await ai.thermalAnomalyDetect({ window_summary });
    await record('thermal-anomaly-detect', { window_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 20. recycling-stream-route ───────────
router.post('/recycling-stream-route', async (req, res) => {
  try {
    const { pack_summary } = req.body || {};
    if (!pack_summary) return res.status(400).json({ error: 'pack_summary is required' });
    const result = await ai.recyclingStreamRoute({ pack_summary });
    await record('recycling-stream-route', { pack_summary }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────── 21. soc-predict ───────────
router.post('/soc-predict', async (req, res) => {
  try {
    const { context_summary, horizon_minutes } = req.body || {};
    if (!context_summary) return res.status(400).json({ error: 'context_summary is required' });
    const result = await ai.socPredict({ context_summary, horizon_minutes: horizon_minutes ?? 60 });
    await record('soc-predict', { context_summary, horizon_minutes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
