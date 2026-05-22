import React from 'react';
import AIPage from '../components/AIPage';
import { aiRecyclingStreamRoute } from '../services/api';

export default function AIRecyclingStreamRoutePage() {
  return (
    <AIPage
      title="AI · Recycling Stream Router"
      feature="recycling-stream-route"
      subtitle="Chemistry-aware routing: NMC vs LFP vs NCA vs LMO to hydromet / pyromet / direct / mechanical-pretreatment."
      inputs={[
        { key: 'pack_summary', label: 'Pack Summary', type: 'textarea', placeholder: 'Chemistry, mass, SoH, damage state, customer return path.' },
      ]}
      run={(v) => aiRecyclingStreamRoute({ pack_summary: v.pack_summary })}
    />
  );
}
