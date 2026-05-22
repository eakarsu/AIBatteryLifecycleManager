import React from 'react';
import CrudPage from '../components/CrudPage';
import { escalationRulesApi } from '../services/api';

export default function EscalationRulesPage() {
  return (
    <CrudPage
      title="Escalation Rules"
      subtitle="Severity-driven escalation rules — fixed-threshold row table (no DSL)."
      api={escalationRulesApi}
      statusKey="severity"
      fields={[
        { key: 'rule_id',        label: 'Rule ID' },
        { key: 'severity',       label: 'Severity', type: 'select', options: ['low','medium','high','critical'] },
        { key: 'trigger_event',  label: 'Trigger Event' },
        { key: 'notify_channel', label: 'Channel', type: 'select', options: ['email','webhook','sms','pager','slack'] },
        { key: 'notify_target',  label: 'Target' },
        { key: 'delay_minutes',  label: 'Delay (min)', type: 'number' },
        { key: 'active',         label: 'Active', type: 'select', options: ['true','false'] },
      ]}
    />
  );
}
