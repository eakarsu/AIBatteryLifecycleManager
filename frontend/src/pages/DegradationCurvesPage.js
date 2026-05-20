import React from 'react';
import CrudPage from '../components/CrudPage';
import { degradationCurvesApi } from '../services/api';

export default function DegradationCurvesPage() {
  return (
    <CrudPage
      title="Degradation Curves"
      subtitle="Captured SoH vs cycle-count observations per pack."
      api={degradationCurvesApi}
      fields={[
        { key: 'curve_id',    label: 'Curve ID' },
        { key: 'pack_id',     label: 'Pack ID' },
        { key: 'cycle_count', label: 'Cycle Count', type: 'number' },
        { key: 'soh_pct',     label: 'SoH (%)',     type: 'number' },
        { key: 'captured_at', label: 'Captured At', type: 'datetime-local' },
        { key: 'model',       label: 'Model' },
      ]}
    />
  );
}
