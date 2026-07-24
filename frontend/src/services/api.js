const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  process.env.REACT_APP_API_BASE ||
  'http://localhost:3065/api';

export { API_BASE };

const TOKEN_KEY = 'blm_token';
const USER_KEY  = 'blm_user';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (_) {}
}
export function logout() {
  setToken(null);
  setStoredUser(null);
  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
}

// Role helpers
export function getRole() {
  return (getStoredUser()?.role || 'viewer').toLowerCase();
}
export function canWrite() {
  return ['admin', 'ops'].includes(getRole());
}
export function isAdmin() {
  return getRole() === 'admin';
}
// Backwards-compatible alias used by template pages.
export const isCommander = isAdmin;

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  } catch (e) {
    throw new Error(`Network error: ${e.message}`);
  }

  if (res.status === 401) {
    if (!url.startsWith('/auth/login')) {
      logout();
      throw new Error('Session expired');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Generic CRUD factory
function crud(base) {
  return {
    list:   ()       => request(`/${base}`),
    get:    (id)     => request(`/${base}/${id}`),
    create: (data)   => request(`/${base}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d)  => request(`/${base}/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
    remove: (id)     => request(`/${base}/${id}`, { method: 'DELETE' }),
    bulkImport: (csv) => request(`/${base}/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    }),
    listAttachments: (id) => request(`/${base}/${id}/attachments`),
    uploadAttachment: async (id, file) => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

// 18 battery-domain entities
export const batteryPacksApi       = crud('battery-packs');
export const cellsApi              = crud('cells');
export const modulesApi            = crud('modules');
export const chargersApi           = crud('chargers');
export const sitesApi              = crud('sites');
export const customersApi          = crud('customers');
export const leasesApi             = crud('leases');
export const secondLifeUnitsApi    = crud('second-life-units');
export const warrantyClaimsApi     = crud('warranty-claims');
export const telemetryApi          = crud('telemetry');
export const degradationCurvesApi  = crud('degradation-curves');
export const sohReportsApi         = crud('soh-reports');
export const dispatchSchedulesApi  = crud('dispatch-schedules');
export const recyclingOrdersApi    = crud('recycling-orders');
export const certificationsApi     = crud('certifications');
export const maintenanceLogsApi    = crud('maintenance-logs');
export const alarmsApi             = crud('alarms');
export const auditLogApi           = crud('audit-log');
export const packQuarantineReviewApi = crud('pack-quarantine-review');

// Apply pass 7 — additional CRUD entities
export const custodyEventsApi       = crud('custody-events');
export const coaRecordsApi          = crud('coa-records');
export const ppaSchedulesApi        = crud('ppa-schedules');
export const batteryPassportsApi    = crud('battery-passports');
export const complianceRecordsApi   = crud('compliance-records');
export const lcaEntriesApi          = crud('lca-entries');
export const escalationRulesApi     = crud('escalation-rules');
export const warrantyWorkflowApi    = crud('warranty-workflow');
export const marketplaceListingsApi = crud('marketplace-listings');

// Compliance scoring (rule-based, no AI call)
export const getComplianceScore = (assetId) => {
  const qs = new URLSearchParams(assetId ? { asset_id: assetId } : {}).toString();
  return request(`/compliance-records/score${qs ? `?${qs}` : ''}`);
};

// Warranty workflow state-machine helpers
export const getWarrantyStateMachine = () => request('/warranty-workflow/state-machine');
export const transitionWarrantyWorkflow = (id, to_state, notes) =>
  request(`/warranty-workflow/${id}/transition`, { method: 'POST', body: JSON.stringify({ to_state, notes }) });

// Battery passport public lookup (still behind auth — public surface stub)
export const getBatteryPassportPublic = (slug) => request(`/battery-passports/public/${encodeURIComponent(slug)}`);

// Dashboard
export const getDashboardStats = () => request('/dashboard');

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

// AI endpoints — 16 battery verbs
export const aiDegradationForecast = (body) => request('/ai/degradation-forecast', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSohTrend            = (body) => request('/ai/soh-trend',            { method: 'POST', body: JSON.stringify(body || {}) });
export const aiWarrantyDraft       = (body) => request('/ai/warranty-draft',       { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSecondLifeRoute     = (body) => request('/ai/second-life-route',    { method: 'POST', body: JSON.stringify(body || {}) });
export const aiDispatchOptimize    = (body) => request('/ai/dispatch-optimize',    { method: 'POST', body: JSON.stringify(body || {}) });
export const aiThermalRisk         = (body) => request('/ai/thermal-risk',         { method: 'POST', body: JSON.stringify(body || {}) });
export const aiCellBalanceSuggest  = (body) => request('/ai/cell-balance-suggest', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiExecutiveBrief      = (body) => request('/ai/executive-brief',      { method: 'POST', body: JSON.stringify(body || {}) });
export const aiRecyclingQuote      = (body) => request('/ai/recycling-quote',      { method: 'POST', body: JSON.stringify(body || {}) });
export const aiVendorQualityScore  = (body) => request('/ai/vendor-quality-score', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiCustomerSohReport   = (body) => request('/ai/customer-soh-report',  { method: 'POST', body: JSON.stringify(body || {}) });
export const aiFleetHealth         = (body) => request('/ai/fleet-health',         { method: 'POST', body: JSON.stringify(body || {}) });
export const aiAnomalyCluster      = (body) => request('/ai/anomaly-cluster',      { method: 'POST', body: JSON.stringify(body || {}) });
export const aiCapacityFadeExplain = (body) => request('/ai/capacity-fade-explain',{ method: 'POST', body: JSON.stringify(body || {}) });
export const aiReplacementTimeline = (body) => request('/ai/replacement-timeline', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiPpaRevenueForecast  = (body) => request('/ai/ppa-revenue-forecast', { method: 'POST', body: JSON.stringify(body || {}) });

// Apply pass 7 — additional AI verbs
export const aiEndOfLifeClassify     = (body) => request('/ai/end-of-life-classify',     { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSecondLifeSuitability = (body) => request('/ai/second-life-suitability', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiThermalAnomalyDetect  = (body) => request('/ai/thermal-anomaly-detect',  { method: 'POST', body: JSON.stringify(body || {}) });
export const aiRecyclingStreamRoute  = (body) => request('/ai/recycling-stream-route',  { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSocPredict            = (body) => request('/ai/soc-predict',             { method: 'POST', body: JSON.stringify(body || {}) });

// AI history
export const getAIHistory = (feature, limit = 25) => {
  const qs = new URLSearchParams({
    ...(feature ? { feature } : {}),
    limit: String(limit),
  }).toString();
  return request(`/ai/history?${qs}`);
};

// AI sample fills — backend returns { feature, samples: [{label, values}, ...] }
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

// Notifications
export const getNotifications       = () => request('/notifications');
export const getUnreadNotifications = () => request('/notifications/unread');
export const markNotificationRead   = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/mark-all-read', { method: 'POST' });

// Webhooks
export const webhooksApi = {
  list:    ()         => request('/webhooks'),
  create:  (d)        => request('/webhooks',          { method: 'POST', body: JSON.stringify(d) }),
  update:  (id, d)    => request(`/webhooks/${id}`,    { method: 'PUT',  body: JSON.stringify(d) }),
  remove:  (id)       => request(`/webhooks/${id}`,    { method: 'DELETE' }),
  test:    (event, payload) => request('/webhooks/test', {
    method: 'POST',
    body: JSON.stringify({ event, payload }),
  }),
  deliveries: (id)    => request(`/webhooks/${id}/deliveries`),
};
