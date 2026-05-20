import React from 'react';
import AIPage from '../components/AIPage';
import { aiVendorQualityScore } from '../services/api';

export default function AIVendorQualityScorePage() {
  return (
    <AIPage
      title="AI · Vendor Quality Score"
      feature="vendor-quality-score"
      subtitle="Scorecard a battery vendor across capacity retention, warranty rate, thermal events and cycle life."
      inputs={[
        { key: 'vendor_summary', label: 'Vendor Summary', type: 'textarea', placeholder: 'Vendor, packs deployed, avg SoH, warranty count, thermal events, OTD.' },
      ]}
      run={(v) => aiVendorQualityScore({ vendor_summary: v.vendor_summary })}
    />
  );
}
