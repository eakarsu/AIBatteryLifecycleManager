import React from 'react';
import CrudPage from '../components/CrudPage';
import { dispatchSchedulesApi } from '../services/api';

export default function DispatchSchedulesPage() {
  return (
    <CrudPage
      title="Dispatch Schedules"
      subtitle="Market dispatch slots — CAISO, ERCOT, NEM, EPEX, GB."
      api={dispatchSchedulesApi}
      statusKey="status"
      fields={[
        { key: 'sched_id', label: 'Schedule ID' },
        { key: 'pack_id',  label: 'Pack ID' },
        { key: 'market',   label: 'Market' },
        { key: 'kw',       label: 'kW',        type: 'number' },
        { key: 'start_at', label: 'Start At',  type: 'datetime-local' },
        { key: 'status',   label: 'Status', type: 'select', options: ['scheduled','executing','executed','cancelled','failed'] },
      ]}
    />
  );
}
