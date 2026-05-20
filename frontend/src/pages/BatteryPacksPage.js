import React from 'react';
import CrudPage from '../components/CrudPage';
import { batteryPacksApi } from '../services/api';

export default function BatteryPacksPage() {
  return (
    <CrudPage
      title="Battery Packs"
      subtitle="Full pack registry — utility BESS, EV traction and stationary storage."
      api={batteryPacksApi}
      statusKey="status"
      fields={[
        { key: 'pack_id',      label: 'Pack ID' },
        { key: 'vendor',       label: 'Vendor' },
        { key: 'chemistry',    label: 'Chemistry', type: 'select', options: ['LFP','NMC811','NMC622','NCM','NCA','LTO','Blade','Solid-state'] },
        { key: 'capacity_kwh', label: 'Capacity (kWh)', type: 'number' },
        { key: 'installed_at', label: 'Installed', type: 'date' },
        { key: 'status',       label: 'Status', type: 'select', options: ['in_service','warning','fault','maintenance','retired'] },
      ]}
    />
  );
}
