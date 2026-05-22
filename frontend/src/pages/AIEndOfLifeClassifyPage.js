import React from 'react';
import AIPage from '../components/AIPage';
import { aiEndOfLifeClassify } from '../services/api';

export default function AIEndOfLifeClassifyPage() {
  return (
    <AIPage
      title="AI · End-of-Life Classifier"
      feature="end-of-life-classify"
      subtitle="Decide retire vs second-life vs recycle for a pack — disposition with confidence."
      inputs={[
        { key: 'pack_summary', label: 'Pack Summary', type: 'textarea', placeholder: 'Chemistry, SoH, cycles, anomalies, customer context.' },
      ]}
      run={(v) => aiEndOfLifeClassify({ pack_summary: v.pack_summary })}
    />
  );
}
