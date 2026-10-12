import React from 'react';
import AIPage from '../components/AIPage';
import { aiFleetHealth } from '../services/api';

export default function AIFleetHealthPage() {
  return (
    <AIPage
      title="AI · Fleet Health"
      feature="fleet-health"
      subtitle="Comprehensive fleet diagnostic with critical packs, watch list and recommendations."
      inputs={[{ key: 'review_focus', label: 'Review focus (optional)', type: 'textarea', placeholder: 'Describe the fleet health decision to support.' }]}
      run={(values, requestOptions) => aiFleetHealth(values, requestOptions)}
    />
  );
}
