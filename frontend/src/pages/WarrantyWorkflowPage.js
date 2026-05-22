import React, { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { warrantyWorkflowApi, getWarrantyStateMachine } from '../services/api';

function StateMachineBanner() {
  const [sm, setSm] = useState(null);
  useEffect(() => {
    let alive = true;
    getWarrantyStateMachine()
      .then((d) => { if (alive) setSm(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!sm) return null;
  return (
    <div style={{ padding: '10px 14px', background: '#16202c', borderRadius: 6, marginBottom: 12 }}>
      <div style={{ marginBottom: 6 }}><strong>Workflow States:</strong> {sm.states.join(' → ')}</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Allowed transitions: {Object.entries(sm.transitions || {}).map(([from, to]) => (
          to.length ? `${from} → [${to.join(', ')}]` : null
        )).filter(Boolean).join('; ')}
      </div>
    </div>
  );
}

export default function WarrantyWorkflowPage() {
  return (
    <div>
      <StateMachineBanner />
      <CrudPage
        title="Warranty Workflow"
        subtitle="Guided claim workflow: intake → diagnosis → approval → resolution → closed."
        api={warrantyWorkflowApi}
        statusKey="state"
        fields={[
          { key: 'workflow_id', label: 'Workflow ID' },
          { key: 'claim_id',    label: 'Claim ID' },
          { key: 'state',       label: 'State', type: 'select', options: ['intake','diagnosis','approval','resolution','closed','rejected'] },
          { key: 'assignee',    label: 'Assignee' },
          { key: 'sla_due_at',  label: 'SLA Due', type: 'datetime-local' },
          { key: 'notes',       label: 'Notes', type: 'textarea' },
        ]}
      />
    </div>
  );
}
