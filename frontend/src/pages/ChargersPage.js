import React from 'react';
import CrudPage from '../components/CrudPage';
import { chargersApi } from '../services/api';

export default function ChargersPage() {
  return (
    <CrudPage
      title="Chargers"
      subtitle="DC fast-charge and stationary inverter / PCS fleet."
      api={chargersApi}
      statusKey="status"
      fields={[
        { key: 'charger_id', label: 'Charger ID' },
        { key: 'site',       label: 'Site' },
        { key: 'vendor',     label: 'Vendor' },
        { key: 'power_kw',   label: 'Power (kW)', type: 'number' },
        { key: 'status',     label: 'Status', type: 'select', options: ['online','offline','fault','maintenance'] },
        { key: 'last_event', label: 'Last Event', type: 'datetime-local' },
      ]}
    />
  );
}
