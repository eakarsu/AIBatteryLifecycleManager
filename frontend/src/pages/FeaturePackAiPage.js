import React, { useState } from 'react';
import AIResultView from '../components/AIResultView';
import { runFeaturePackAi } from '../services/api';

const FEATURES = [{ key: 'fleet-health-summary', label: 'Fleet health summary' }, { key: 'replacement-priority', label: 'Replacement priority' }, { key: 'second-life-candidates', label: 'Second-life candidates' }];

export default function FeaturePackAiPage() {
  const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const run = async (f) => { setLoading(true); setError(''); try { setResult(await runFeaturePackAi(f.key, {})); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  return (<div><h2>AI · Battery record insights</h2><p>Domain summaries over this app's own records. Without a configured AI provider, results are a clearly labelled deterministic fallback.</p>
    {FEATURES.map((f) => <button key={f.key} type="button" onClick={() => run(f)} disabled={loading}>{f.label}</button>)}
    {result && result.aiGenerated === false && <p role="status">Deterministic fallback — no AI provider configured (aiGenerated: false).</p>}
    {result && result.aiGenerated === true && <p role="status">Provider-generated result (aiGenerated: true).</p>}
    <AIResultView result={result} loading={loading} error={error || undefined} title="Feature pack result" /></div>);
}
