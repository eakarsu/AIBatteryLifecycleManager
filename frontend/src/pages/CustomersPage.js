import React from 'react';
import CrudPage from '../components/CrudPage';
import { customersApi } from '../services/api';

export default function CustomersPage() {
  return (
    <CrudPage
      title="Customers"
      subtitle="Utilities, IPPs, EV networks and microgrid operators."
      api={customersApi}
      statusKey="status"
      fields={[
        { key: 'customer_id', label: 'Customer ID' },
        { key: 'name',        label: 'Name' },
        { key: 'type',        label: 'Type', type: 'select', options: ['utility','merchant','evcharging','microgrid','residential','commercial','industrial','transit'] },
        { key: 'region',      label: 'Region' },
        { key: 'status',      label: 'Status', type: 'select', options: ['prospect','active','churned'] },
        { key: 'contract_id', label: 'Contract ID' },
      ]}
    />
  );
}
