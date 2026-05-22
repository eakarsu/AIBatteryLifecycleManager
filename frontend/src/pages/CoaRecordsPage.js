import React from 'react';
import CrudPage from '../components/CrudPage';
import { coaRecordsApi } from '../services/api';

export default function CoaRecordsPage() {
  return (
    <CrudPage
      title="Certificates of Analysis"
      subtitle="Cell-lot CoA records — chemistry, measured capacity, IR."
      api={coaRecordsApi}
      statusKey="status"
      fields={[
        { key: 'coa_id',                label: 'CoA ID' },
        { key: 'pack_id',               label: 'Pack ID' },
        { key: 'cell_lot',              label: 'Cell Lot' },
        { key: 'chemistry',             label: 'Chemistry', type: 'select', options: ['LFP','NMC811','NMC622','NCM','NCA','LTO','Blade','Solid-state'] },
        { key: 'nominal_capacity_ah',   label: 'Nominal (Ah)', type: 'number' },
        { key: 'measured_capacity_ah',  label: 'Measured (Ah)', type: 'number' },
        { key: 'ir_mohm',               label: 'IR (mΩ)', type: 'number' },
        { key: 'issued_at',             label: 'Issued', type: 'date' },
        { key: 'status',                label: 'Status', type: 'select', options: ['draft','signed','released','revoked'] },
      ]}
    />
  );
}
