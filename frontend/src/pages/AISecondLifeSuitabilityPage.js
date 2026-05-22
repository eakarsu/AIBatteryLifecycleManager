import React from 'react';
import AIPage from '../components/AIPage';
import { aiSecondLifeSuitability } from '../services/api';

export default function AISecondLifeSuitabilityPage() {
  return (
    <AIPage
      title="AI · Second-Life Suitability"
      feature="second-life-suitability"
      subtitle="Score a retired unit across candidate applications (stationary, telecom, microgrid, DCFC buffer, residential)."
      inputs={[
        { key: 'unit_summary', label: 'Unit Summary', type: 'textarea', placeholder: 'Source pack, chemistry, SoH, cycles, condition.' },
      ]}
      run={(v) => aiSecondLifeSuitability({ unit_summary: v.unit_summary })}
    />
  );
}
