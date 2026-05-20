import React from 'react';
import CrudPage from '../components/CrudPage';
import { sitesApi } from '../services/api';

export default function SitesPage() {
  return (
    <CrudPage
      title="Sites"
      subtitle="Customer sites with installed BESS / charging capacity."
      api={sitesApi}
      statusKey="status"
      fields={[
        { key: 'site_id',      label: 'Site ID' },
        { key: 'name',         label: 'Name' },
        { key: 'location',     label: 'Location' },
        { key: 'customer_id',  label: 'Customer ID' },
        { key: 'capacity_kwh', label: 'Capacity (kWh)', type: 'number' },
        { key: 'status',       label: 'Status', type: 'select', options: ['commissioning','active','maintenance','retired'] },
      ]}
    />
  );
}
