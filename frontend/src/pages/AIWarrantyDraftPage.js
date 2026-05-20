import React from 'react';
import AIPage from '../components/AIPage';
import { aiWarrantyDraft } from '../services/api';

export default function AIWarrantyDraftPage() {
  return (
    <AIPage
      title="AI · Warranty Draft"
      feature="warranty-draft"
      subtitle="Generate a warranty-claim package with evidence list, clause reference and draft letter."
      inputs={[
        { key: 'claim_summary', label: 'Claim Summary', type: 'textarea', placeholder: 'Pack, vendor, defect, contractual context.' },
      ]}
      run={(v) => aiWarrantyDraft({ claim_summary: v.claim_summary })}
    />
  );
}
