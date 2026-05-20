import React from 'react';
import AIPage from '../components/AIPage';
import { aiCellBalanceSuggest } from '../services/api';

export default function AICellBalanceSuggestPage() {
  return (
    <AIPage
      title="AI · Cell Balance Suggest"
      feature="cell-balance-suggest"
      subtitle="Recommend bleed / swap / isolate actions to restore cell balance."
      inputs={[
        { key: 'cells_summary', label: 'Cells Summary', type: 'textarea', placeholder: 'Module, chemistry, voltage spread, outliers, last balance.' },
      ]}
      run={(v) => aiCellBalanceSuggest({ cells_summary: v.cells_summary })}
    />
  );
}
