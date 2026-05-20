import React from 'react';
import CrudPage from '../components/CrudPage';
import { leasesApi } from '../services/api';

export default function LeasesPage() {
  return (
    <CrudPage
      title="Leases"
      subtitle="Battery-as-a-Service contracts mapping packs to customers."
      api={leasesApi}
      statusKey="status"
      fields={[
        { key: 'lease_id',    label: 'Lease ID' },
        { key: 'customer_id', label: 'Customer ID' },
        { key: 'pack_id',     label: 'Pack ID' },
        { key: 'start_date',  label: 'Start', type: 'date' },
        { key: 'term_months', label: 'Term (months)', type: 'number' },
        { key: 'status',      label: 'Status', type: 'select', options: ['active','in_renewal','expired','terminated'] },
      ]}
    />
  );
}
