import React from 'react';
import AIPage from '../components/AIPage';
import { aiThermalRisk } from '../services/api';

export default function AIThermalRiskPage() {
  return (
    <AIPage
      title="AI · Thermal Risk"
      feature="thermal-risk"
      subtitle="Assess thermal-runaway risk and recommend mitigations."
      inputs={[
        { key: 'context_summary', label: 'Context Summary', type: 'textarea', placeholder: 'Pack, ambient, cell temps, recent dispatches, HVAC status.' },
      ]}
      run={(v) => aiThermalRisk({ context_summary: v.context_summary })}
    />
  );
}
