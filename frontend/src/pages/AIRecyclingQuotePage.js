import React from 'react';
import AIPage from '../components/AIPage';
import { aiRecyclingQuote } from '../services/api';

export default function AIRecyclingQuotePage() {
  return (
    <AIPage
      title="AI · Recycling Quote"
      feature="recycling-quote"
      subtitle="Estimate net recovery value for a retired pack — black-mass + metal recovery."
      inputs={[
        { key: 'pack_summary',   label: 'Pack Summary',   type: 'textarea', placeholder: 'Chemistry, mass, SoH, intactness.' },
        { key: 'vendor_summary', label: 'Vendor Summary', type: 'textarea', placeholder: 'Recycler, process, current metal pricing.' },
      ]}
      run={(v) => aiRecyclingQuote({ pack_summary: v.pack_summary, vendor_summary: v.vendor_summary })}
    />
  );
}
