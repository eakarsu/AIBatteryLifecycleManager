import React from 'react';
import AIPage from '../components/AIPage';
import { aiAnomalyCluster } from '../services/api';

export default function AIAnomalyClusterPage() {
  return (
    <AIPage
      title="AI · Anomaly Cluster"
      feature="anomaly-cluster"
      subtitle="Group recent alarms into root-cause clusters for triage."
      inputs={[]}
      run={() => aiAnomalyCluster({})}
    />
  );
}
