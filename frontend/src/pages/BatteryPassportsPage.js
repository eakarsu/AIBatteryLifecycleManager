import React from 'react';
import CrudPage from '../components/CrudPage';
import { batteryPassportsApi } from '../services/api';

export default function BatteryPassportsPage() {
  return (
    <CrudPage
      title="Battery Passports"
      subtitle="Digital twin per pack — EU Battery Regulation 2023/1542 aligned."
      api={batteryPassportsApi}
      statusKey="status"
      fields={[
        { key: 'passport_id',              label: 'Passport ID' },
        { key: 'pack_id',                  label: 'Pack ID' },
        { key: 'chemistry',                label: 'Chemistry', type: 'select', options: ['LFP','NMC811','NMC622','NCM','NCA','LTO','Blade','Solid-state'] },
        { key: 'manufacturer',             label: 'Manufacturer' },
        { key: 'manufacture_date',         label: 'Manufactured', type: 'date' },
        { key: 'nominal_capacity_kwh',     label: 'Capacity (kWh)', type: 'number' },
        { key: 'recycled_content_pct',     label: 'Recycled Content (%)', type: 'number' },
        { key: 'carbon_footprint_kg_co2e', label: 'CO2e (kg)', type: 'number' },
        { key: 'supply_chain',             label: 'Supply Chain', type: 'textarea' },
        { key: 'public_url_slug',          label: 'Public Slug' },
        { key: 'status',                   label: 'Status', type: 'select', options: ['draft','published','revoked'] },
      ]}
    />
  );
}
