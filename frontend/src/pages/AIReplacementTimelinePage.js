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
        { key: 'review_focus', label: 'Planning focus (optional)', type: 'textarea', placeholder: 'Describe the persisted pack and replacement planning question to prioritize.' },
      ]}
      run={(v, requestOptions) => aiReplacementTimeline({ horizon_months: Number(v.horizon_months) || 36, review_focus: v.review_focus }, requestOptions)}
    />
  );
}
