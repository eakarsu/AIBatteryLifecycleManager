import React from 'react';
import AIPage from '../components/AIPage';
import { aiDispatchOptimize } from '../services/api';

export default function AIDispatchOptimizePage() {
  return (
    <AIPage
      title="AI · Dispatch Optimize"
      feature="dispatch-optimize"
      subtitle="Optimise BESS dispatch into an energy or ancillary-services market."
      inputs={[
        { key: 'pack_summary',   label: 'Pack Summary',   type: 'textarea', placeholder: 'Capacity, power, duration, SoH, cycle budget.' },
        { key: 'market_summary', label: 'Market Summary', type: 'textarea', placeholder: 'Market, prices, AS opportunity, constraints.' },
      ]}
      run={(v) => aiDispatchOptimize({ pack_summary: v.pack_summary, market_summary: v.market_summary })}
    />
  );
}
