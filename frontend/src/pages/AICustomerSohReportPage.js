import React from 'react';
import AIPage from '../components/AIPage';
import { aiCustomerSohReport } from '../services/api';

export default function AICustomerSohReportPage() {
  return (
    <AIPage
      title="AI · Customer SoH Report"
      feature="customer-soh-report"
      subtitle="Generate a customer-facing periodic SoH report with recommendations."
      inputs={[
        { key: 'customer_summary', label: 'Customer Summary', type: 'textarea', placeholder: 'Customer, pack count, chemistry mix, review cadence.' },
      ]}
      run={(v) => aiCustomerSohReport({ customer_summary: v.customer_summary })}
    />
  );
}
