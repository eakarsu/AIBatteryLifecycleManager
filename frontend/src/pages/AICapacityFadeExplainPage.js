import React from 'react';
import AIPage from '../components/AIPage';
import { aiCapacityFadeExplain } from '../services/api';

export default function AICapacityFadeExplainPage() {
  return (
    <AIPage
      title="AI · Capacity Fade Explain"
      feature="capacity-fade-explain"
      subtitle="Explain dominant degradation mechanisms and contributing factors for a pack."
      inputs={[
        { key: 'pack_summary',    label: 'Pack Summary',    type: 'textarea', placeholder: 'Pack, chemistry, current SoH, vendor curve comparison.' },
        { key: 'history_summary', label: 'History Summary', type: 'textarea', placeholder: 'Anomalies, near-misses, environment, duty.' },
      ]}
      run={(v) => aiCapacityFadeExplain({ pack_summary: v.pack_summary, history_summary: v.history_summary })}
    />
  );
}
