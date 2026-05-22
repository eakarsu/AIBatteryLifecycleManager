import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

const ASSETS = [
  { to: '/battery-packs',   label: 'Battery Packs' },
  { to: '/cells',           label: 'Cells' },
  { to: '/modules',         label: 'Modules' },
  { to: '/chargers',        label: 'Chargers' },
  { to: '/sites',           label: 'Sites' },
];

const CUSTOMERS = [
  { to: '/customers',          label: 'Customers' },
  { to: '/leases',             label: 'Leases' },
  { to: '/certifications',     label: 'Certifications' },
];

const OPERATIONS = [
  { to: '/telemetry',           label: 'Telemetry' },
  { to: '/dispatch-schedules',  label: 'Dispatch Schedules' },
  { to: '/alarms',              label: 'Alarms' },
  { to: '/maintenance-logs',    label: 'Maintenance Logs' },
  { to: '/pack-quarantine-review', label: 'Pack Quarantine Review' },
];

const WARRANTY = [
  { to: '/warranty-claims',     label: 'Warranty Claims' },
  { to: '/soh-reports',         label: 'SoH Reports' },
  { to: '/degradation-curves',  label: 'Degradation Curves' },
];

const RECYCLING = [
  { to: '/second-life-units',     label: 'Second-Life Units' },
  { to: '/recycling-orders',      label: 'Recycling Orders' },
  { to: '/marketplace-listings',  label: 'Marketplace Listings' },
];

const LIFECYCLE = [
  { to: '/battery-passports',  label: 'Battery Passports' },
  { to: '/coa-records',        label: 'CoA Records' },
  { to: '/custody-events',     label: 'Chain of Custody' },
  { to: '/lca-entries',        label: 'LCA Accounting' },
  { to: '/compliance-records', label: 'Compliance' },
];

const COMMERCIAL = [
  { to: '/ppa-schedules',      label: 'PPA / Tariffs' },
  { to: '/warranty-workflow',  label: 'Warranty Workflow' },
  { to: '/escalation-rules',   label: 'Escalation Rules' },
];

const AI_FORECASTING = [
  { to: '/ai/degradation-forecast',  label: 'AI · Degradation Forecast' },
  { to: '/ai/soh-trend',             label: 'AI · SoH Trend' },
  { to: '/ai/capacity-fade-explain', label: 'AI · Capacity Fade Explain' },
  { to: '/ai/replacement-timeline',  label: 'AI · Replacement Timeline' },
  { to: '/ai/ppa-revenue-forecast',  label: 'AI · PPA Revenue Forecast' },
  { to: '/ai/soc-predict',           label: 'AI · SoC Predictor' },
  { to: '/ai/end-of-life-classify',  label: 'AI · End-of-Life Classifier' },
];

const AI_MAINTENANCE = [
  { to: '/ai/thermal-risk',             label: 'AI · Thermal Risk' },
  { to: '/ai/thermal-anomaly-detect',   label: 'AI · Thermal Anomaly Detector' },
  { to: '/ai/cell-balance-suggest',     label: 'AI · Cell Balance Suggest' },
  { to: '/ai/anomaly-cluster',          label: 'AI · Anomaly Cluster' },
  { to: '/ai/dispatch-optimize',        label: 'AI · Dispatch Optimize' },
  { to: '/ai/second-life-route',        label: 'AI · Second-Life Route' },
  { to: '/ai/second-life-suitability',  label: 'AI · Second-Life Suitability' },
  { to: '/ai/recycling-quote',          label: 'AI · Recycling Quote' },
  { to: '/ai/recycling-stream-route',   label: 'AI · Recycling Stream Router' },
];

const AI_REPORTING = [
  { to: '/ai/executive-brief',       label: 'AI · Executive Brief' },
  { to: '/ai/fleet-health',          label: 'AI · Fleet Health' },
  { to: '/ai/customer-soh-report',   label: 'AI · Customer SoH Report' },
  { to: '/ai/vendor-quality-score',  label: 'AI · Vendor Quality Score' },
  { to: '/ai/warranty-draft',        label: 'AI · Warranty Draft' },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>BATTERY LIFECYCLE</h1>
        <p>BESS + EV Second-Life Hub</p>
      </div>

      <NavLink to="/" end>Overview</NavLink>

      <div className="sidebar-group-label">Assets</div>
      {ASSETS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Customers</div>
      {CUSTOMERS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Operations</div>
      {OPERATIONS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Warranty</div>
      {WARRANTY.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Recycling</div>
      {RECYCLING.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Lifecycle</div>
      {LIFECYCLE.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Commercial</div>
      {COMMERCIAL.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">AI Forecasting</div>
      {AI_FORECASTING.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">AI Maintenance</div>
      {AI_MAINTENANCE.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">AI Reporting</div>
      {AI_REPORTING.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Analytics</div>
      <NavLink to="/custom-views">Battery Analytics</NavLink>

      <div className="sidebar-group-label">Admin</div>
      <NavLink to="/audit-log">Audit Log</NavLink>
      <NavLink to="/webhooks">Webhooks</NavLink>

      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
