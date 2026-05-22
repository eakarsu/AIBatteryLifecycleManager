import React from 'react';
import CrudPage from '../components/CrudPage';
import { marketplaceListingsApi } from '../services/api';

export default function MarketplaceListingsPage() {
  return (
    <CrudPage
      title="Marketplace Listings"
      subtitle="Internal second-life listing surface — title, price, SoH and status."
      api={marketplaceListingsApi}
      statusKey="status"
      fields={[
        { key: 'listing_id',       label: 'Listing ID' },
        { key: 'unit_id',          label: 'Unit ID' },
        { key: 'title',            label: 'Title' },
        { key: 'description',      label: 'Description', type: 'textarea' },
        { key: 'asking_price_usd', label: 'Asking ($)', type: 'number' },
        { key: 'soh_pct',          label: 'SoH (%)', type: 'number' },
        { key: 'status',           label: 'Status', type: 'select', options: ['draft','listed','reserved','sold','withdrawn'] },
        { key: 'listed_at',        label: 'Listed At', type: 'datetime-local' },
      ]}
    />
  );
}
