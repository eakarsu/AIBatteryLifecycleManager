import React from 'react';
import CrudPage from '../components/CrudPage';
import { custodyEventsApi } from '../services/api';

export default function CustodyEventsPage() {
  return (
    <CrudPage
      title="Chain of Custody"
      subtitle="Transfer events across owner / handler / site — signed custody ledger per pack."
      api={custodyEventsApi}
      statusKey="event_id"
      fields={[
        { key: 'event_id',    label: 'Event ID' },
        { key: 'pack_id',     label: 'Pack ID' },
        { key: 'from_party',  label: 'From Party' },
        { key: 'to_party',    label: 'To Party' },
        { key: 'handler',     label: 'Handler' },
        { key: 'site_from',   label: 'Site From' },
        { key: 'site_to',     label: 'Site To' },
        { key: 'occurred_at', label: 'Occurred At', type: 'datetime-local' },
        { key: 'signature',   label: 'Signature' },
        { key: 'notes',       label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
