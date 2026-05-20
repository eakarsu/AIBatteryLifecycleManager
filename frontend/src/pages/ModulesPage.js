import React from 'react';
import CrudPage from '../components/CrudPage';
import { modulesApi } from '../services/api';

export default function ModulesPage() {
  return (
    <CrudPage
      title="Modules"
      subtitle="Pack subassemblies, test history and swap tracking."
      api={modulesApi}
      statusKey="status"
      fields={[
        { key: 'module_id',    label: 'Module ID' },
        { key: 'pack_id',      label: 'Pack ID' },
        { key: 'capacity_kwh', label: 'Capacity (kWh)', type: 'number' },
        { key: 'status',       label: 'Status', type: 'select', options: ['in_service','warning','fault','swapped','retired'] },
        { key: 'last_test',    label: 'Last Test', type: 'date' },
        { key: 'swapped_at',   label: 'Swapped At', type: 'date' },
      ]}
    />
  );
}
