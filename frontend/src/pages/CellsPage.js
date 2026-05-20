import React from 'react';
import CrudPage from '../components/CrudPage';
import { cellsApi } from '../services/api';

export default function CellsPage() {
  return (
    <CrudPage
      title="Cells"
      subtitle="Cell-level voltage, temperature and health flags."
      api={cellsApi}
      statusKey="status"
      fields={[
        { key: 'cell_id',       label: 'Cell ID' },
        { key: 'pack_id',       label: 'Pack ID' },
        { key: 'position',      label: 'Position' },
        { key: 'voltage_v',     label: 'Voltage (V)',     type: 'number' },
        { key: 'temperature_c', label: 'Temperature (°C)', type: 'number' },
        { key: 'status',        label: 'Status', type: 'select', options: ['nominal','warning','fault','isolated'] },
      ]}
    />
  );
}
