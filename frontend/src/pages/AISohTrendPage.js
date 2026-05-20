import React from 'react';
import AIPage from '../components/AIPage';
import { aiSohTrend } from '../services/api';

export default function AISohTrendPage() {
  return (
    <AIPage
      title="AI · SoH Trend"
      feature="soh-trend"
      subtitle="Fleet-wide state-of-health trend with cohort breakdown and outliers."
      inputs={[]}
      run={() => aiSohTrend({})}
    />
  );
}
