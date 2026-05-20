import React from 'react';
import CrudPage from '../components/CrudPage';
import { maintenanceLogsApi } from '../services/api';

export default function MaintenanceLogsPage() {
  return (
    <CrudPage
      title="Maintenance Logs"
      subtitle="As-built maintenance activity across packs, chargers and sites."
      api={maintenanceLogsApi}
      fields={[
        { key: 'log_id',       label: 'Log ID' },
        { key: 'asset_id',     label: 'Asset ID' },
        { key: 'work',         label: 'Work' },
        { key: 'technician',   label: 'Technician' },
        { key: 'hours',        label: 'Hours', type: 'number' },
        { key: 'completed_at', label: 'Completed', type: 'datetime-local' },
      ]}
    />
  );
}
