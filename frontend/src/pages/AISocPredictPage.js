import React from 'react';
import AIPage from '../components/AIPage';
import { aiSocPredict } from '../services/api';

export default function AISocPredictPage() {
  return (
    <AIPage
      title="AI · SoC Predictor"
      feature="soc-predict"
      subtitle="Short-horizon operational state-of-charge prediction (distinct from long-horizon SoH)."
      inputs={[
        { key: 'context_summary', label: 'Pack / Duty Summary', type: 'textarea', placeholder: 'Current SoC, planned activity, ambient, charge/discharge rate.' },
        { key: 'horizon_minutes', label: 'Horizon (minutes)', type: 'number', defaultValue: 60 },
      ]}
      run={(v) => aiSocPredict({ context_summary: v.context_summary, horizon_minutes: Number(v.horizon_minutes) || 60 })}
    />
  );
}
