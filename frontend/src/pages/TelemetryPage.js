import React from 'react';
import CrudPage from '../components/CrudPage';
import { telemetryApi } from '../services/api';

export default function TelemetryPage() {
  return (
    <CrudPage
      title="Telemetry"
      subtitle="Live metric points streamed from packs, sites and chargers."
      api={telemetryApi}
      fields={[
        { key: 'point_id', label: 'Point ID' },
        { key: 'asset_id', label: 'Asset ID' },
        { key: 'metric',   label: 'Metric' },
        { key: 'value',    label: 'Value', type: 'number' },
        { key: 'units',    label: 'Units' },
        { key: 'ts',       label: 'Timestamp', type: 'datetime-local' },
      ]}
    />
  );
}
