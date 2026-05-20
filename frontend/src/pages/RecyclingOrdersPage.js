import React from 'react';
import CrudPage from '../components/CrudPage';
import { recyclingOrdersApi } from '../services/api';

export default function RecyclingOrdersPage() {
  return (
    <CrudPage
      title="Recycling Orders"
      subtitle="Retired-pack shipments to Redwood, Li-Cycle, Cirba and Ascend Elements."
      api={recyclingOrdersApi}
      statusKey="status"
      fields={[
        { key: 'order_id',     label: 'Order ID' },
        { key: 'pack_id',      label: 'Pack ID' },
        { key: 'vendor',       label: 'Recycler' },
        { key: 'status',       label: 'Status', type: 'select', options: ['requested','scheduled','in_transit','completed','cancelled'] },
        { key: 'scheduled_at', label: 'Scheduled', type: 'datetime-local' },
        { key: 'value_usd',    label: 'Net Value (USD)', type: 'number' },
      ]}
    />
  );
}
