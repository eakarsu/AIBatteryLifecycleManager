import React from 'react';
import AIPage from '../components/AIPage';
import { aiExecutiveBrief } from '../services/api';

export default function AIExecutiveBriefPage() {
  return (
    <AIPage
      title="AI · Executive Brief"
      feature="executive-brief"
      subtitle="Leadership snapshot — fleet health, warranty exposure, second-life pipeline and decisions required."
      inputs={[
        { key: 'notes', label: 'Bias / Notes', type: 'textarea', placeholder: 'Optional: bias the brief toward a topic (warranty, dispatch, safety…).' },
      ]}
      run={(v) => aiExecutiveBrief({ notes: v.notes })}
    />
  );
}
