import React from 'react';
import AIPage from '../components/AIPage';
import { aiSecondLifeRoute } from '../services/api';

export default function AISecondLifeRoutePage() {
  return (
    <AIPage
      title="AI · Second-Life Route"
      feature="second-life-route"
      subtitle="Recommend a downstream application path for a retired EV / BESS unit."
      inputs={[
        { key: 'unit_summary', label: 'Unit Summary', type: 'textarea', placeholder: 'Source pack, chemistry, SoH, cycles, mechanical condition.' },
      ]}
      run={(v) => aiSecondLifeRoute({ unit_summary: v.unit_summary })}
    />
  );
}
