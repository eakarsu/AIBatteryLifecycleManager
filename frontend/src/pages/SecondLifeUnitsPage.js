import React from 'react';
import CrudPage from '../components/CrudPage';
import { secondLifeUnitsApi } from '../services/api';

export default function SecondLifeUnitsPage() {
  return (
    <CrudPage
      title="Second-Life Units"
      subtitle="Retired EV / BESS modules pending evaluation, repurposing or recycling."
      api={secondLifeUnitsApi}
      statusKey="status"
      fields={[
        { key: 'unit_id',            label: 'Unit ID' },
        { key: 'source_pack',        label: 'Source Pack' },
        { key: 'soh_pct',            label: 'SoH (%)', type: 'number' },
        { key: 'target_application', label: 'Target Application', type: 'select', options: ['home_storage','telecom_backup','solar_microgrid','dcfc_buffer','forklift_industrial','agricultural_irrigation','evaluation','recycle'] },
        { key: 'status',             label: 'Status', type: 'select', options: ['evaluation','routed','deployed','recycled','rejected'] },
        { key: 'routed_to',          label: 'Routed To' },
      ]}
    />
  );
}
