import React from 'react';
import CrudPage from '../components/CrudPage';
import { alarmsApi } from '../services/api';

export default function AlarmsPage() {
  return (
    <CrudPage
      title="Alarms"
      subtitle="Active and historical alarms across the fleet."
      api={alarmsApi}
      statusKey="status"
      fields={[
        { key: 'alarm_id',  label: 'Alarm ID' },
        { key: 'asset_id',  label: 'Asset ID' },
        { key: 'type',      label: 'Type' },
        { key: 'severity',  label: 'Severity', type: 'select', options: ['low','medium','high','critical'] },
        { key: 'opened_at', label: 'Opened', type: 'datetime-local' },
        { key: 'status',    label: 'Status', type: 'select', options: ['open','acknowledged','closed','suppressed'] },
      ]}
    />
  );
}
