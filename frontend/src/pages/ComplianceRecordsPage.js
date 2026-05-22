import React, { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { complianceRecordsApi, getComplianceScore } from '../services/api';

function ComplianceScoreBanner() {
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    getComplianceScore()
      .then((d) => { if (alive) setScore(d); })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);
  if (error) return <div style={{ padding: '8px 12px', background: '#3a1a1a', borderRadius: 6, marginBottom: 12 }}>Score error: {error}</div>;
  if (!score) return null;
  return (
    <div style={{ padding: '10px 14px', background: '#16202c', borderRadius: 6, marginBottom: 12, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <div><strong>Compliance Score:</strong> {score.score} <span style={{ opacity: 0.7 }}>(rating {score.rating})</span></div>
      <div>Total: {score.total}</div>
      <div>Compliant: {score.compliant}</div>
      <div>Pending: {score.pending}</div>
      <div>Failed: {score.failed}</div>
      <div>Overdue: {score.overdue}</div>
    </div>
  );
}

export default function ComplianceRecordsPage() {
  return (
    <div>
      <ComplianceScoreBanner />
      <CrudPage
        title="Regulatory Compliance"
        subtitle="EU Battery Regulation, UN 38.3, IEC 62619, UL 1973 — deadlines & evidence matrix."
        api={complianceRecordsApi}
        statusKey="status"
        fields={[
          { key: 'record_id',    label: 'Record ID' },
          { key: 'asset_id',     label: 'Asset ID' },
          { key: 'regulation',   label: 'Regulation', type: 'select', options: ['EU_Battery_Regulation_2023_1542','UN_38.3','IEC_62619','UL_1973','IEC_62933','GB_T_31485'] },
          { key: 'jurisdiction', label: 'Jurisdiction' },
          { key: 'due_date',     label: 'Due', type: 'date' },
          { key: 'evidence_url', label: 'Evidence URL' },
          { key: 'status',       label: 'Status', type: 'select', options: ['pending','compliant','failed','expired','waived'] },
          { key: 'notes',        label: 'Notes', type: 'textarea' },
        ]}
      />
    </div>
  );
}
