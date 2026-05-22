import React from 'react';
import AIPage from '../components/AIPage';
import { aiThermalAnomalyDetect } from '../services/api';

export default function AIThermalAnomalyDetectPage() {
  return (
    <AIPage
      title="AI · Thermal Anomaly Detector"
      feature="thermal-anomaly-detect"
      subtitle="Detect hot-spots, rapid rises and sustained deltas in a telemetry window."
      inputs={[
        { key: 'window_summary', label: 'Window Summary', type: 'textarea', placeholder: 'Time window, ambient, cell temps, observed anomalies.' },
      ]}
      run={(v) => aiThermalAnomalyDetect({ window_summary: v.window_summary })}
    />
  );
}
