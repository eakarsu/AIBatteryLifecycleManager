import React from 'react';
import AIPage from '../components/AIPage';
import { aiSohTrend } from '../services/api';

export default function AISohTrendPage() {
  return (
    <AIPage
      title="AI · SoH Trend"
      feature="soh-trend"
      subtitle="Fleet-wide state-of-health trend with cohort breakdown and outliers."
      inputs={[{ key: 'review_focus', label: 'Review focus (optional)', type: 'textarea', placeholder: 'Describe the fleet trend question to prioritize.' }]}
      run={(values, requestOptions) => aiSohTrend(values, requestOptions)}
    />
  );
}
