import React from 'react';
import CrudPage from '../components/CrudPage';
import { certificationsApi } from '../services/api';

export default function CertificationsPage() {
  return (
    <CrudPage
      title="Certifications"
      subtitle="UL 9540 / UN 38.3 / IEC 62619 and grid-code certifications."
      api={certificationsApi}
      statusKey="status"
      fields={[
        { key: 'cert_id',    label: 'Cert ID' },
        { key: 'asset_id',   label: 'Asset ID' },
        { key: 'standard',   label: 'Standard' },
        { key: 'issued_at',  label: 'Issued', type: 'date' },
        { key: 'expires_at', label: 'Expires', type: 'date' },
        { key: 'status',     label: 'Status', type: 'select', options: ['valid','expiring','expired','revoked'] },
      ]}
    />
  );
}
