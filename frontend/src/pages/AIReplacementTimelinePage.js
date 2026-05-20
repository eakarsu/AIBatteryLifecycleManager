import React from 'react';
import AIPage from '../components/AIPage';
import { aiReplacementTimeline } from '../services/api';

export default function AIReplacementTimelinePage() {
  return (
    <AIPage
      title="AI · Replacement Timeline"
      feature="replacement-timeline"
      subtitle="Build a replacement timeline for the fleet with cost and second-life recovery."
      inputs={[
        { key: 'horizon_months', label: 'Horizon (months)', type: 'number', defaultValue: 36 },
      ]}
      run={(v) => aiReplacementTimeline({ horizon_months: Number(v.horizon_months) || 36 })}
    />
  );
}
