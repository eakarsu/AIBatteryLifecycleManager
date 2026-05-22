import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';

// 18 CRUD pages
import BatteryPacksPage       from './pages/BatteryPacksPage';
import CellsPage              from './pages/CellsPage';
import ModulesPage            from './pages/ModulesPage';
import ChargersPage           from './pages/ChargersPage';
import SitesPage              from './pages/SitesPage';
import CustomersPage          from './pages/CustomersPage';
import LeasesPage             from './pages/LeasesPage';
import SecondLifeUnitsPage    from './pages/SecondLifeUnitsPage';
import WarrantyClaimsPage     from './pages/WarrantyClaimsPage';
import TelemetryPage          from './pages/TelemetryPage';
import DegradationCurvesPage  from './pages/DegradationCurvesPage';
import SohReportsPage         from './pages/SohReportsPage';
import DispatchSchedulesPage  from './pages/DispatchSchedulesPage';
import RecyclingOrdersPage    from './pages/RecyclingOrdersPage';
import CertificationsPage     from './pages/CertificationsPage';
import MaintenanceLogsPage    from './pages/MaintenanceLogsPage';
import AlarmsPage             from './pages/AlarmsPage';
import AuditLogPage           from './pages/AuditLogPage';
import PackQuarantineReviewPage from './pages/PackQuarantineReviewPage';

// 16 AI pages
import AIDegradationForecastPage from './pages/AIDegradationForecastPage';
import AISohTrendPage            from './pages/AISohTrendPage';
import AIWarrantyDraftPage       from './pages/AIWarrantyDraftPage';
import AISecondLifeRoutePage     from './pages/AISecondLifeRoutePage';
import AIDispatchOptimizePage    from './pages/AIDispatchOptimizePage';
import AIThermalRiskPage         from './pages/AIThermalRiskPage';
import AICellBalanceSuggestPage  from './pages/AICellBalanceSuggestPage';
import AIExecutiveBriefPage      from './pages/AIExecutiveBriefPage';
import AIRecyclingQuotePage      from './pages/AIRecyclingQuotePage';
import AIVendorQualityScorePage  from './pages/AIVendorQualityScorePage';
import AICustomerSohReportPage   from './pages/AICustomerSohReportPage';
import AIFleetHealthPage         from './pages/AIFleetHealthPage';
import AIAnomalyClusterPage      from './pages/AIAnomalyClusterPage';
import AICapacityFadeExplainPage from './pages/AICapacityFadeExplainPage';
import AIReplacementTimelinePage from './pages/AIReplacementTimelinePage';
import AIPpaRevenueForecastPage  from './pages/AIPpaRevenueForecastPage';

// Apply pass 7 — new AI pages
import AIEndOfLifeClassifyPage     from './pages/AIEndOfLifeClassifyPage';
import AISecondLifeSuitabilityPage from './pages/AISecondLifeSuitabilityPage';
import AIThermalAnomalyDetectPage  from './pages/AIThermalAnomalyDetectPage';
import AIRecyclingStreamRoutePage  from './pages/AIRecyclingStreamRoutePage';
import AISocPredictPage            from './pages/AISocPredictPage';

// Apply pass 7 — new CRUD / domain pages
import CustodyEventsPage       from './pages/CustodyEventsPage';
import CoaRecordsPage          from './pages/CoaRecordsPage';
import PpaSchedulesPage        from './pages/PpaSchedulesPage';
import BatteryPassportsPage    from './pages/BatteryPassportsPage';
import ComplianceRecordsPage   from './pages/ComplianceRecordsPage';
import LcaEntriesPage          from './pages/LcaEntriesPage';
import EscalationRulesPage     from './pages/EscalationRulesPage';
import WarrantyWorkflowPage    from './pages/WarrantyWorkflowPage';
import MarketplaceListingsPage from './pages/MarketplaceListingsPage';

// Admin
import WebhooksPage from './pages/WebhooksPage';

// Custom analytics views
import CustomViewsPage from './pages/CustomViewsPage';

import LoginPage from './pages/LoginPage';
import { getToken } from './services/api';

import './App.css';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function ShellRoutes() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

            <Route path="/" element={<Dashboard />} />

            <Route path="/battery-packs"       element={<BatteryPacksPage />} />
            <Route path="/cells"               element={<CellsPage />} />
            <Route path="/modules"             element={<ModulesPage />} />
            <Route path="/chargers"            element={<ChargersPage />} />
            <Route path="/sites"               element={<SitesPage />} />
            <Route path="/customers"           element={<CustomersPage />} />
            <Route path="/leases"              element={<LeasesPage />} />
            <Route path="/second-life-units"   element={<SecondLifeUnitsPage />} />
            <Route path="/warranty-claims"     element={<WarrantyClaimsPage />} />
            <Route path="/telemetry"           element={<TelemetryPage />} />
            <Route path="/degradation-curves"  element={<DegradationCurvesPage />} />
            <Route path="/soh-reports"         element={<SohReportsPage />} />
            <Route path="/dispatch-schedules"  element={<DispatchSchedulesPage />} />
            <Route path="/recycling-orders"    element={<RecyclingOrdersPage />} />
            <Route path="/certifications"      element={<CertificationsPage />} />
            <Route path="/maintenance-logs"    element={<MaintenanceLogsPage />} />
            <Route path="/alarms"              element={<AlarmsPage />} />
            <Route path="/pack-quarantine-review" element={<PackQuarantineReviewPage />} />
            <Route path="/audit-log"           element={<AuditLogPage />} />

            <Route path="/ai/degradation-forecast"  element={<AIDegradationForecastPage />} />
            <Route path="/ai/soh-trend"             element={<AISohTrendPage />} />
            <Route path="/ai/warranty-draft"        element={<AIWarrantyDraftPage />} />
            <Route path="/ai/second-life-route"     element={<AISecondLifeRoutePage />} />
            <Route path="/ai/dispatch-optimize"     element={<AIDispatchOptimizePage />} />
            <Route path="/ai/thermal-risk"          element={<AIThermalRiskPage />} />
            <Route path="/ai/cell-balance-suggest"  element={<AICellBalanceSuggestPage />} />
            <Route path="/ai/executive-brief"       element={<AIExecutiveBriefPage />} />
            <Route path="/ai/recycling-quote"       element={<AIRecyclingQuotePage />} />
            <Route path="/ai/vendor-quality-score"  element={<AIVendorQualityScorePage />} />
            <Route path="/ai/customer-soh-report"   element={<AICustomerSohReportPage />} />
            <Route path="/ai/fleet-health"          element={<AIFleetHealthPage />} />
            <Route path="/ai/anomaly-cluster"       element={<AIAnomalyClusterPage />} />
            <Route path="/ai/capacity-fade-explain" element={<AICapacityFadeExplainPage />} />
            <Route path="/ai/replacement-timeline"  element={<AIReplacementTimelinePage />} />
            <Route path="/ai/ppa-revenue-forecast"  element={<AIPpaRevenueForecastPage />} />

            <Route path="/ai/end-of-life-classify"     element={<AIEndOfLifeClassifyPage />} />
            <Route path="/ai/second-life-suitability"  element={<AISecondLifeSuitabilityPage />} />
            <Route path="/ai/thermal-anomaly-detect"   element={<AIThermalAnomalyDetectPage />} />
            <Route path="/ai/recycling-stream-route"   element={<AIRecyclingStreamRoutePage />} />
            <Route path="/ai/soc-predict"              element={<AISocPredictPage />} />

            <Route path="/custody-events"       element={<CustodyEventsPage />} />
            <Route path="/coa-records"          element={<CoaRecordsPage />} />
            <Route path="/ppa-schedules"        element={<PpaSchedulesPage />} />
            <Route path="/battery-passports"    element={<BatteryPassportsPage />} />
            <Route path="/compliance-records"   element={<ComplianceRecordsPage />} />
            <Route path="/lca-entries"          element={<LcaEntriesPage />} />
            <Route path="/escalation-rules"     element={<EscalationRulesPage />} />
            <Route path="/warranty-workflow"    element={<WarrantyWorkflowPage />} />
            <Route path="/marketplace-listings" element={<MarketplaceListingsPage />} />

            <Route path="/webhooks" element={<WebhooksPage />} />

            <Route path="/custom-views" element={<CustomViewsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ShellRoutes />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
