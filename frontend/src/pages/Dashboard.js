import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  // Assets
  { path: '/battery-packs',      title: 'Battery Packs',      icon: 'B', color: '#3b82f6', desc: 'Utility BESS, EV traction and stationary storage packs.' },
  { path: '/cells',              title: 'Cells',              icon: 'c', color: '#06b6d4', desc: 'Cell-level voltage, temperature and health flags.' },
  { path: '/modules',            title: 'Modules',            icon: 'M', color: '#10b981', desc: 'Pack subassemblies, test history and swap tracking.' },
  { path: '/chargers',           title: 'Chargers',           icon: 'C', color: '#f59e0b', desc: 'DC fast-charge and inverter / PCS fleet.' },
  { path: '/sites',              title: 'Sites',              icon: 'S', color: '#a78bfa', desc: 'Customer sites with installed capacity.' },

  // Customers
  { path: '/customers',          title: 'Customers',          icon: 'U', color: '#ec4899', desc: 'Utilities, IPPs, EV networks, microgrid operators.' },
  { path: '/leases',             title: 'Leases',             icon: 'L', color: '#22c55e', desc: 'Battery-as-a-Service contracts.' },
  { path: '/certifications',     title: 'Certifications',     icon: 'X', color: '#ef4444', desc: 'UL 9540 / UN 38.3 / IEC 62619 / grid-code.' },

  // Operations
  { path: '/telemetry',          title: 'Telemetry',          icon: 'T', color: '#0ea5e9', desc: 'Live metric points from packs, sites and chargers.' },
  { path: '/dispatch-schedules', title: 'Dispatch Schedules', icon: 'D', color: '#14b8a6', desc: 'CAISO, ERCOT, NEM, EPEX, GB dispatch slots.' },
  { path: '/alarms',             title: 'Alarms',             icon: '!', color: '#fb7185', desc: 'Active and historical alarms across the fleet.' },
  { path: '/maintenance-logs',   title: 'Maintenance Logs',   icon: 'W', color: '#facc15', desc: 'As-built maintenance activity.' },

  // Warranty
  { path: '/warranty-claims',    title: 'Warranty Claims',    icon: 'W', color: '#a3e635', desc: 'Vendor-side defect claims with workflow.' },
  { path: '/soh-reports',        title: 'SoH Reports',        icon: 'H', color: '#60a5fa', desc: 'Pack-level SoH summaries with recommendations.' },
  { path: '/degradation-curves', title: 'Degradation Curves', icon: 'G', color: '#7dd3fc', desc: 'Captured SoH vs cycle-count per pack.' },

  // Recycling
  { path: '/second-life-units',  title: 'Second-Life Units',  icon: '2', color: '#f472b6', desc: 'Retired EV / BESS modules pending repurposing.' },
  { path: '/recycling-orders',   title: 'Recycling Orders',   icon: 'R', color: '#dc2626', desc: 'Shipments to Redwood, Li-Cycle, Cirba, Ascend Elements.' },
  { path: '/audit-log',          title: 'Audit Log',          icon: 'A', color: '#34d399', desc: 'Operator actions across the platform.' },

  // AI · Forecasting
  { path: '/ai/degradation-forecast',  title: 'AI · Degradation Forecast',  icon: '*', color: '#8b5cf6', desc: 'Project capacity fade out N cycles.' },
  { path: '/ai/soh-trend',             title: 'AI · SoH Trend',             icon: '*', color: '#8b5cf6', desc: 'Fleet-wide SoH trend with cohort outliers.' },
  { path: '/ai/capacity-fade-explain', title: 'AI · Capacity Fade Explain', icon: '*', color: '#8b5cf6', desc: 'Explain dominant degradation mechanisms.' },
  { path: '/ai/replacement-timeline',  title: 'AI · Replacement Timeline',  icon: '*', color: '#8b5cf6', desc: 'When to replace what — with cost and second-life recovery.' },
  { path: '/ai/ppa-revenue-forecast',  title: 'AI · PPA Revenue Forecast',  icon: '*', color: '#8b5cf6', desc: 'Forecast PPA / tolling revenue with risk cases.' },

  // AI · Maintenance & Ops
  { path: '/ai/thermal-risk',          title: 'AI · Thermal Risk',          icon: '*', color: '#8b5cf6', desc: 'Assess thermal-runaway risk and mitigations.' },
  { path: '/ai/cell-balance-suggest',  title: 'AI · Cell Balance Suggest',  icon: '*', color: '#8b5cf6', desc: 'Recommend bleed / swap / isolate actions.' },
  { path: '/ai/anomaly-cluster',       title: 'AI · Anomaly Cluster',       icon: '*', color: '#8b5cf6', desc: 'Group alarms into root-cause clusters.' },
  { path: '/ai/dispatch-optimize',     title: 'AI · Dispatch Optimize',     icon: '*', color: '#8b5cf6', desc: 'Optimise BESS dispatch into energy markets.' },
  { path: '/ai/second-life-route',     title: 'AI · Second-Life Route',     icon: '*', color: '#8b5cf6', desc: 'Recommend downstream path for a retired pack.' },
  { path: '/ai/recycling-quote',       title: 'AI · Recycling Quote',       icon: '*', color: '#8b5cf6', desc: 'Estimate net recovery value for a pack.' },

  // AI · Reporting
  { path: '/ai/executive-brief',       title: 'AI · Executive Brief',       icon: '*', color: '#8b5cf6', desc: 'Leadership snapshot with decisions required.' },
  { path: '/ai/fleet-health',          title: 'AI · Fleet Health',          icon: '*', color: '#8b5cf6', desc: 'Comprehensive fleet diagnostic.' },
  { path: '/ai/customer-soh-report',   title: 'AI · Customer SoH Report',   icon: '*', color: '#8b5cf6', desc: 'Customer-facing periodic SoH report.' },
  { path: '/ai/vendor-quality-score',  title: 'AI · Vendor Quality Score',  icon: '*', color: '#8b5cf6', desc: 'Vendor scorecard across health dimensions.' },
  { path: '/ai/warranty-draft',        title: 'AI · Warranty Draft',        icon: '*', color: '#8b5cf6', desc: 'Generate a warranty-claim package with draft letter.' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>Battery Lifecycle Overview</h2>
        <p>Unified BESS + EV second-life picture · {new Date().toUTCString()}</p>
      </div>

      {err && <div className="ai-error">Stats unavailable: {err}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Packs</div><div className="stat-value">{stats.battery_packs?.total ?? '—'}</div><div className="stat-sub">{stats.battery_packs?.in_service ?? 0} in service · {Number(stats.battery_packs?.total_kwh || 0).toLocaleString()} kWh</div></div>
          <div className="stat"><div className="stat-label">Cells</div><div className="stat-value">{stats.cells?.total ?? '—'}</div><div className="stat-sub">{stats.cells?.warning ?? 0} warn · {stats.cells?.fault ?? 0} fault</div></div>
          <div className="stat"><div className="stat-label">Modules</div><div className="stat-value">{stats.modules?.total ?? '—'}</div><div className="stat-sub">{stats.modules?.in_service ?? 0} in service · {stats.modules?.swapped ?? 0} swapped</div></div>
          <div className="stat"><div className="stat-label">Chargers</div><div className="stat-value">{stats.chargers?.total ?? '—'}</div><div className="stat-sub">{stats.chargers?.online ?? 0} online · {stats.chargers?.offline ?? 0} offline</div></div>
          <div className="stat"><div className="stat-label">Sites</div><div className="stat-value">{stats.sites?.total ?? '—'}</div><div className="stat-sub">{Number(stats.sites?.total_kwh || 0).toLocaleString()} kWh installed</div></div>
          <div className="stat"><div className="stat-label">Customers</div><div className="stat-value">{stats.customers?.total ?? '—'}</div><div className="stat-sub">{stats.customers?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Leases</div><div className="stat-value">{stats.leases?.total ?? '—'}</div><div className="stat-sub">{stats.leases?.active ?? 0} active · {stats.leases?.expired ?? 0} expired</div></div>
          <div className="stat"><div className="stat-label">2nd-Life</div><div className="stat-value">{stats.second_life_units?.total ?? '—'}</div><div className="stat-sub">{stats.second_life_units?.routed ?? 0} routed · {stats.second_life_units?.evaluation ?? 0} eval</div></div>
          <div className="stat"><div className="stat-label">Warranty</div><div className="stat-value">{stats.warranty_claims?.total ?? '—'}</div><div className="stat-sub">{stats.warranty_claims?.open ?? 0} open · {stats.warranty_claims?.approved ?? 0} approved</div></div>
          <div className="stat"><div className="stat-label">Telemetry</div><div className="stat-value">{stats.telemetry?.total ?? '—'}</div><div className="stat-sub">points</div></div>
          <div className="stat"><div className="stat-label">Curves</div><div className="stat-value">{stats.degradation_curves?.total ?? '—'}</div><div className="stat-sub">captured</div></div>
          <div className="stat"><div className="stat-label">SoH Reports</div><div className="stat-value">{stats.soh_reports?.total ?? '—'}</div><div className="stat-sub">{stats.soh_reports?.final ?? 0} final</div></div>
          <div className="stat"><div className="stat-label">Dispatch</div><div className="stat-value">{stats.dispatch_schedules?.total ?? '—'}</div><div className="stat-sub">{stats.dispatch_schedules?.scheduled ?? 0} sched · {stats.dispatch_schedules?.executed ?? 0} exec</div></div>
          <div className="stat"><div className="stat-label">Recycling</div><div className="stat-value">{stats.recycling_orders?.total ?? '—'}</div><div className="stat-sub">${Number(stats.recycling_orders?.total_value || 0).toLocaleString()} value</div></div>
          <div className="stat"><div className="stat-label">Certs</div><div className="stat-value">{stats.certifications?.total ?? '—'}</div><div className="stat-sub">{stats.certifications?.valid ?? 0} valid · {stats.certifications?.expired ?? 0} expired</div></div>
          <div className="stat"><div className="stat-label">Maint Logs</div><div className="stat-value">{stats.maintenance_logs?.total ?? '—'}</div><div className="stat-sub">activity entries</div></div>
          <div className="stat"><div className="stat-label">Alarms</div><div className="stat-value">{stats.alarms?.total ?? '—'}</div><div className="stat-sub">{stats.alarms?.open ?? 0} open · {stats.alarms?.critical ?? 0} critical</div></div>
          <div className="stat"><div className="stat-label">Audit</div><div className="stat-value">{stats.audit_log?.total ?? '—'}</div><div className="stat-sub">entries</div></div>
        </div>
      )}

      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div
            key={f.path}
            className="feature-card"
            style={{ ['--card-color']: f.color }}
            onClick={() => navigate(f.path)}
          >
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
