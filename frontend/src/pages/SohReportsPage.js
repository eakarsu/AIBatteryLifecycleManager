import React from 'react';
import CrudPage from '../components/CrudPage';
import { sohReportsApi } from '../services/api';

export default function SohReportsPage() {
  return (
    <CrudPage
      title="SoH Reports"
      subtitle="Pack-level state-of-health summaries with recommendations."
      api={sohReportsApi}
      statusKey="status"
      fields={[
        { key: 'report_id',       label: 'Report ID' },
        { key: 'pack_id',         label: 'Pack ID' },
        { key: 'soh_pct',         label: 'SoH (%)', type: 'number' },
        { key: 'period',          label: 'Period' },
        { key: 'recommendations', label: 'Recommendations', type: 'textarea' },
        { key: 'status',          label: 'Status', type: 'select', options: ['draft','final','superseded'] },
      ]}
    />
  );
}
