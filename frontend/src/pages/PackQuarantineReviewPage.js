import React from 'react';
import CrudPage from '../components/CrudPage';
import { packQuarantineReviewApi } from '../services/api';

export default function PackQuarantineReviewPage() {
  return (
    <CrudPage
      title="Pack Quarantine Review"
      subtitle="Review battery packs on safety hold before reuse, warranty release or recycling."
      api={packQuarantineReviewApi}
      allowAttachments={false}
      statusKey="hold_status"
      fields={[
        { key: 'pack_id', label: 'Pack ID' },
        { key: 'quarantine_reason', label: 'Reason', type: 'textarea' },
        { key: 'risk_level', label: 'Risk', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
        { key: 'hold_status', label: 'Hold Status', type: 'select', options: ['quarantined', 'under_review', 'released', 'scrap'] },
        { key: 'reviewer', label: 'Reviewer' },
        { key: 'recommended_action', label: 'Recommended Action', type: 'textarea' },
        { key: 'opened_at', label: 'Opened At', type: 'datetime-local' },
      ]}
    />
  );
}
