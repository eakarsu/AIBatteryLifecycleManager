import React from 'react';
import CrudPage from '../components/CrudPage';
import { ppaSchedulesApi } from '../services/api';

export default function PpaSchedulesPage() {
  return (
    <CrudPage
      title="PPA / Tariff Schedules"
      subtitle="Power-purchase and tariff contracts driving revenue forecasts."
      api={ppaSchedulesApi}
      statusKey="status"
      fields={[
        { key: 'schedule_id',                  label: 'Schedule ID' },
        { key: 'site_id',                      label: 'Site ID' },
        { key: 'counterparty',                 label: 'Counterparty' },
        { key: 'ppa_type',                     label: 'PPA Type', type: 'select', options: ['tolling','merchant','aFRR','FCAS','dynamic_containment','behind_the_meter'] },
        { key: 'capacity_price_usd_kw_month',  label: 'Capacity ($/kW-mo)', type: 'number' },
        { key: 'energy_price_usd_mwh',         label: 'Energy ($/MWh)', type: 'number' },
        { key: 'start_date',                   label: 'Start', type: 'date' },
        { key: 'end_date',                     label: 'End', type: 'date' },
        { key: 'status',                       label: 'Status', type: 'select', options: ['draft','active','expired','cancelled'] },
      ]}
    />
  );
}
