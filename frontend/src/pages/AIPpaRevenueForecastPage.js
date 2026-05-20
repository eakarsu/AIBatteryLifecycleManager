import React from 'react';
import AIPage from '../components/AIPage';
import { aiPpaRevenueForecast } from '../services/api';

export default function AIPpaRevenueForecastPage() {
  return (
    <AIPage
      title="AI · PPA Revenue Forecast"
      feature="ppa-revenue-forecast"
      subtitle="Forecast PPA / tolling revenue with degradation drag and risk cases."
      inputs={[
        { key: 'site_summary', label: 'Site Summary', type: 'textarea', placeholder: 'Site, capacity, duration, SoH.' },
        { key: 'ppa_summary',  label: 'PPA Summary',  type: 'textarea', placeholder: 'Counterparty, structure, term, guarantees.' },
      ]}
      run={(v) => aiPpaRevenueForecast({ site_summary: v.site_summary, ppa_summary: v.ppa_summary })}
    />
  );
}
