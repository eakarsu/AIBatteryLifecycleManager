import React from 'react';
import AIPage from '../components/AIPage';
import { aiAnomalyCluster } from '../services/api';

export default function AIAnomalyClusterPage() {
  return (
    <AIPage
      title="AI · Anomaly Cluster"
      feature="anomaly-cluster"
      subtitle="Group recent alarms into root-cause clusters for triage."
      inputs={[{ key: 'review_focus', label: 'Triage focus (optional)', type: 'textarea', placeholder: 'Describe the alarm pattern or triage question to prioritize.' }]}
      run={(values, requestOptions) => aiAnomalyCluster(values, requestOptions)}
    />
  );
}
