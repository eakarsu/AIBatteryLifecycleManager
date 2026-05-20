import React from 'react';
import AIPage from '../components/AIPage';
import { aiFleetHealth } from '../services/api';

export default function AIFleetHealthPage() {
  return (
    <AIPage
      title="AI · Fleet Health"
      feature="fleet-health"
      subtitle="Comprehensive fleet diagnostic with critical packs, watch list and recommendations."
      inputs={[]}
      run={() => aiFleetHealth({})}
    />
  );
}
