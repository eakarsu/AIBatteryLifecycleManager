import React from 'react';
import CrudPage from '../components/CrudPage';
import { lcaEntriesApi } from '../services/api';

export default function LcaEntriesPage() {
  return (
    <CrudPage
      title="LCA Accounting"
      subtitle="Carbon-footprint and lifecycle-assessment entries per pack and stage."
      api={lcaEntriesApi}
      statusKey="stage"
      fields={[
        { key: 'entry_id',    label: 'Entry ID' },
        { key: 'pack_id',     label: 'Pack ID' },
        { key: 'stage',       label: 'Lifecycle Stage', type: 'select', options: ['raw_materials','manufacture','transport','use','second_life','recycling','end_of_life'] },
        { key: 'co2e_kg',     label: 'CO2e (kg)', type: 'number' },
        { key: 'energy_kwh',  label: 'Energy (kWh)', type: 'number' },
        { key: 'water_l',     label: 'Water (L)', type: 'number' },
        { key: 'recorded_at', label: 'Recorded', type: 'date' },
        { key: 'source',      label: 'Source' },
      ]}
    />
  );
}
