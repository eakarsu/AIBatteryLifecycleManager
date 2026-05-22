# Audit Note — AIBatteryLifecycleManager

Domain: battery lifecycle management — state-of-health monitoring, second-life routing, recycling stream optimization, degradation forecasting (EV, stationary storage, industrial).

## Stack
- Backend: Node + Express (`backend/server.js`, port 3065), JWT auth (`middleware/auth`), `_crudFactory` (RBAC + bulk-import + attachments), Postgres (`config/database`).
- Frontend: React (CRA, `frontend/src/`), `services/api.js`, `AIPage`/`CrudPage` wrappers, `AIResultDisplay`.
- AI: OpenRouter via `routes/ai.js` (`callOpenRouter` + `parseAIJson` + persistence to `ai_analyses`, samples + `/history`).

## Current inventory
- 18 CRUD routes: battery-packs, cells, modules, chargers, sites, customers, leases, second-life-units, warranty-claims, telemetry, degradation-curves, soh-reports, dispatch-schedules, recycling-orders, certifications, maintenance-logs, alarms, audit-log.
- Cross-cutting: notifications, attachments, webhooks, dashboard, custom-views.
- 16 AI endpoints (POST under `/api/ai`): degradation-forecast, soh-trend, warranty-draft, second-life-route, dispatch-optimize, thermal-risk, cell-balance-suggest, executive-brief, recycling-quote, vendor-quality-score, customer-soh-report, fleet-health, anomaly-cluster, capacity-fade-explain, replacement-timeline, ppa-revenue-forecast.
- Frontend pages mirror each AI endpoint + each CRUD entity (LoginPage, Dashboard, CustomViews, Codex custom-viz/ops).

## Audit recommendations

### Missing AI counterparts
- AI-MISSING-1: End-of-life classifier (retire vs. second-life vs. recycle decision with confidence).
- AI-MISSING-2: Second-life suitability recommender (target application match: stationary, telecom, microgrid) — current `second-life-route` is logistics, not suitability scoring.
- AI-MISSING-3: Thermal anomaly detector on telemetry windows (current `thermal-risk` is forward risk; need detection on streaming data).
- AI-MISSING-4: Recycling-stream router (chemistry-aware: NMC vs. LFP vs. NCA vs. LMO to hydrometallurgical / pyrometallurgical / direct recycling streams).
- AI-MISSING-5: SoC predictor distinct from SoH (operational, short-horizon).

### Missing non-AI features
- NONAI-MISSING-1: Chain-of-custody ledger (transfer events across owner/handler/site with signatures) — `audit-log` is generic, not custody-specific.
- NONAI-MISSING-2: Certificate of Analysis (CoA) generation/storage per battery/cell lot.
- NONAI-MISSING-3: Supplier integrations (OEM/cell-vendor data feeds, MES connectors).
- NONAI-MISSING-4: PPA / tariff schedule entity (used implicitly by `ppa-revenue-forecast` but no CRUD).
- NONAI-MISSING-5: Real-time alarming webhook channel (webhooks exist; no severity-driven escalation rules).

### Missing custom / domain features
- CUSTOM-MISSING-1: Battery Passport / digital-twin per pack (EU Battery Regulation 2023/1542 aligned: chemistry, supply chain, carbon footprint, recycled content).
- CUSTOM-MISSING-2: Regulatory compliance tracker (EU Battery Regulation, UN 38.3, IEC 62619, UL 1973) with deadline + evidence matrix.
- CUSTOM-MISSING-3: Warranty claim assistant workflow (intake -> diagnosis -> resolution) — `warranty-draft` AI exists but no guided workflow state machine.
- CUSTOM-MISSING-4: Carbon footprint / LCA accounting per pack lifecycle stage.
- CUSTOM-MISSING-5: Resale / second-life marketplace listing surface.

## Implemented
None — audit-only.

## Backlog by tag

### MECHANICAL (template-cloneable AI/CRUD; reuses `callOpenRouter` + `_crudFactory`)
- AI-MISSING-1 end-of-life classifier
- AI-MISSING-2 second-life suitability recommender
- AI-MISSING-3 thermal anomaly detector
- AI-MISSING-4 recycling-stream router
- AI-MISSING-5 SoC predictor
- NONAI-MISSING-1 chain-of-custody CRUD
- NONAI-MISSING-2 CoA CRUD + PDF render
- NONAI-MISSING-4 PPA/tariff schedule CRUD
- CUSTOM-MISSING-1 battery passport entity (CRUD + read-only public view)
- CUSTOM-MISSING-2 regulatory compliance entity + scoring endpoint
- CUSTOM-MISSING-4 LCA accounting entity

### NEEDS-CREDS (external system access)
- NONAI-MISSING-3 supplier / OEM / MES integration credentials
- CUSTOM-MISSING-1 battery passport public registry endpoint (EU CIRPASS — credentials/spec TBD)

### NEEDS-PRODUCT-DECISION
- NONAI-MISSING-5 severity-driven escalation rules (rule DSL vs. fixed thresholds)
- CUSTOM-MISSING-3 warranty workflow state machine (states/transitions/SLA matrix)
- CUSTOM-MISSING-5 marketplace surface (internal listing vs. external broker integration)

## Categorization counts
- AI missing: 5
- Non-AI missing: 5
- Custom missing: 5
- Total gaps: 15
- MECHANICAL: 11
- NEEDS-CREDS: 2
- NEEDS-PRODUCT-DECISION: 3
- Currently implemented (CRUD): 18
- Currently implemented (AI): 16

## Status
Apply pass 7 complete — full backlog implemented (MECHANICAL + NEEDS-PRODUCT-DECISION with reasonable defaults; NEEDS-CREDS as 503 stubs).

## Apply pass 7 (full backlog implementation)

### Migration
- `backend/migrations/003_schema.sql` — adds 9 tables with `CREATE TABLE IF NOT EXISTS`:
  `custody_events`, `coa_records`, `ppa_schedules`, `battery_passports`, `compliance_records`, `lca_entries`, `escalation_rules`, `warranty_workflow`, `marketplace_listings`.

### New backend AI endpoints (mounted on `/api/ai`, recorded to `ai_results`, samples included)
- `POST /api/ai/end-of-life-classify` (AI-MISSING-1)
- `POST /api/ai/second-life-suitability` (AI-MISSING-2)
- `POST /api/ai/thermal-anomaly-detect` (AI-MISSING-3)
- `POST /api/ai/recycling-stream-route` (AI-MISSING-4)
- `POST /api/ai/soc-predict` (AI-MISSING-5)

### New backend CRUD endpoints (mounted before `app.listen`)
- `/api/custody-events` (NONAI-MISSING-1)
- `/api/coa-records` (NONAI-MISSING-2)
- `/api/ppa-schedules` (NONAI-MISSING-4)
- `/api/battery-passports` + `GET /api/battery-passports/public/:slug` + `POST /api/battery-passports/:id/publish-registry` (CUSTOM-MISSING-1; registry push is a 503 NEEDS-CREDS stub)
- `/api/compliance-records` + `GET /api/compliance-records/score` (CUSTOM-MISSING-2; deterministic rule-based score)
- `/api/lca-entries` (CUSTOM-MISSING-4)
- `/api/escalation-rules` (NONAI-MISSING-5 — reasonable default: fixed-threshold row-per-rule rather than DSL)
- `/api/warranty-workflow` + `GET /api/warranty-workflow/state-machine` + `POST /api/warranty-workflow/:id/transition` (CUSTOM-MISSING-3 — reasonable-default states `intake→diagnosis→approval→resolution→closed` plus `rejected`)
- `/api/marketplace-listings` (CUSTOM-MISSING-5 — reasonable default: internal listing surface)

### NEEDS-CREDS — 503 stubs
- `/api/supplier-integrations/oem-feed`, `/cell-vendor-feed`, `/mes-connector` (+ `/sync` POSTs) — NONAI-MISSING-3.
- `POST /api/battery-passports/:id/publish-registry` — CUSTOM-MISSING-1 EU CIRPASS push.

### New frontend pages (wired into `App.js` + `Sidebar.js`)
- CRUD: `CustodyEventsPage`, `CoaRecordsPage`, `PpaSchedulesPage`, `BatteryPassportsPage`, `ComplianceRecordsPage` (with score banner), `LcaEntriesPage`, `EscalationRulesPage`, `WarrantyWorkflowPage` (with state-machine banner), `MarketplaceListingsPage`.
- AI: `AIEndOfLifeClassifyPage`, `AISecondLifeSuitabilityPage`, `AIThermalAnomalyDetectPage`, `AIRecyclingStreamRoutePage`, `AISocPredictPage`.
- Sidebar gained two new groups: **Lifecycle** and **Commercial**; recycling group gained `Marketplace Listings`; AI groups gained the 5 new verbs.

### Service layer
- `backend/services/ai.js` — added `endOfLifeClassify`, `secondLifeSuitability`, `thermalAnomalyDetect`, `recyclingStreamRoute`, `socPredict` (each returns strict JSON schema, reuses `callOpenRouter` + `safeJsonParse`).
- `frontend/src/services/api.js` — added 9 CRUD helpers, 5 AI helpers, plus `getComplianceScore`, `getWarrantyStateMachine`, `transitionWarrantyWorkflow`, `getBatteryPassportPublic`.

### Constraints satisfied
- No new dependencies (backend uses existing `express` / `pg`; frontend uses existing `react-router-dom` and `services/api`).
- All new routes mounted in `server.js` before `app.listen` (no 404 handler exists yet).
- Schema migration is additive only (`CREATE TABLE IF NOT EXISTS`).
- `node --check` clean on every backend `.js` touched, plus `frontend/src/services/api.js`.
- Frontend JSX pages parse-checked with `@babel/parser` (CRA build-equivalent).

### Counts after pass 7
- AI endpoints: 16 → 21 (+5)
- CRUD entities: 18 → 27 (+9 mechanical/product-decision tables)
- 503 stubs: 4 endpoints across supplier-integrations + 1 on battery-passports.

