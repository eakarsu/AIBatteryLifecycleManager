import React from 'react';
import AIPage from '../components/AIPage';
import { aiDegradationForecast } from '../services/api';

export default function AIDegradationForecastPage() {
  return (
    <AIPage
      title="AI · Degradation Forecast"
      feature="degradation-forecast"
      subtitle="Project capacity fade for a pack out N cycles. Identifies knee-point and end-of-life."
      inputs={[
        { key: 'pack_summary',   label: 'Pack Summary', type: 'textarea', placeholder: 'Chemistry, capacity, cycle count, SoH, duty profile.' },
        { key: 'horizon_cycles', label: 'Horizon (cycles)', type: 'number', defaultValue: 2000 },
      ]}
      run={(v) => aiDegradationForecast({ pack_summary: v.pack_summary, horizon_cycles: Number(v.horizon_cycles) || 2000 })}
    />
  );
}
