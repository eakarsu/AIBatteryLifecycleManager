import React from 'react';
import CrudPage from '../components/CrudPage';
import { warrantyClaimsApi } from '../services/api';

export default function WarrantyClaimsPage() {
  return (
    <CrudPage
      title="Warranty Claims"
      subtitle="Vendor-side defect claims with workflow status."
      api={warrantyClaimsApi}
      statusKey="status"
      fields={[
        { key: 'claim_id',    label: 'Claim ID' },
        { key: 'pack_id',     label: 'Pack ID' },
        { key: 'defect_type', label: 'Defect Type' },
        { key: 'status',      label: 'Status', type: 'select', options: ['open','investigating','approved','denied','closed'] },
        { key: 'opened_at',   label: 'Opened At', type: 'datetime-local' },
        { key: 'owner',       label: 'Owner' },
      ]}
    />
  );
}
