import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AIResultView from '../components/AIResultView';
import useCancelableAI from '../components/useCancelableAI';
import { reviewLifecycleReadiness, getLifecycleReadinessHistory, getAISources } from '../services/api';

export const readinessExamples = [
  { label: 'Demo AI · Evidence review', prompt: 'Fictional battery-lifecycle planning exercise: prepare an evidence checklist for a storage pack readiness meeting. Optional context: chemistry, temperature, state of health, state of charge, certification and maintenance measurements are unknown; the review window is seven days and the planning budget may be zero. Identify the current measurements and records a qualified reviewer needs. Do not infer safe operation, release quarantine, charge, dispatch or approve maintenance. Return a concise summary, missing evidence and next steps for human review.' },
  { label: 'Demo AI · Second-life planning', prompt: 'Fictional battery-lifecycle planning exercise: compare documentation needed to consider a pack for a second-life application. Optional context: the intended site is unassigned, chemistry and prior duty cycle are undocumented, capacity and isolation tests are unavailable, and no transport or reuse approval exists. Explain uncertainties and questions for a qualified battery engineer. Do not invent measurements, declare suitability, issue a warranty or authorize recycling. Return a concise summary, evidence gaps and proposed review steps.' },
  { label: 'Demo AI · Maintenance meeting', prompt: 'Fictional battery-lifecycle planning exercise: draft an agenda for a maintenance evidence review. Optional context: no actual alarm trace, thermal history, cell balance readings, inspection, service interval or incident report is supplied. The proposed planning horizon is one month; zero available spending is a constraint, not an approval. Identify records to gather and escalation questions for the qualified reviewer. Do not prescribe charging, release quarantine or claim a safe operating condition. Return a concise summary, missing evidence and next steps.' },
];
const validReceipt = value => value && Number.isInteger(Number(value.id)) && Number(value.id) > 0 && typeof value.model === 'string' && typeof value.provider_request_id === 'string';
export default function LifecycleReadinessPage() {
  const [prompt, setPrompt] = useState(''), [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]), [historyLoading, setHistoryLoading] = useState(true), [historyError, setHistoryError] = useState(''), [selected, setSelected] = useState(null);
  const [sources, setSources] = useState([]), [sourcesLoading, setSourcesLoading] = useState(true), [sourcesError, setSourcesError] = useState(''), [selectedSource, setSelectedSource] = useState('');
  const historyRequest = useRef(null), submitLock = useRef(false), input = useRef(null), priorFocus = useRef(null);
  const sourceRequest = useRef(null), sourceSummary = useRef('');
  const ai = useCancelableAI();
  const loadHistory = useCallback(async () => {
    historyRequest.current?.abort(); const controller = new AbortController(); historyRequest.current = controller;
    setHistoryLoading(true); setHistoryError('');
    try {
      const answer = await getLifecycleReadinessHistory({ signal: controller.signal });
      if (!Array.isArray(answer?.history) || answer.history.some(row => !validReceipt(row) || typeof row.content !== 'string' || typeof row.prompt !== 'string')) throw new Error('Saved reviews returned invalid data. Please retry.');
      if (!controller.signal.aborted) setHistory(answer.history);
    } catch (error) { if (!controller.signal.aborted) setHistoryError(error.message || 'Saved reviews could not be loaded.'); }
    finally { if (historyRequest.current === controller) { historyRequest.current = null; setHistoryLoading(false); } }
  }, []);
  useEffect(() => { void loadHistory(); return () => historyRequest.current?.abort(); }, [loadHistory]);
  const loadSources = useCallback(async () => {
    sourceRequest.current?.abort(); const controller = new AbortController(); sourceRequest.current = controller;
    setSourcesLoading(true); setSourcesError('');
    try {
      const answer = await getAISources('lifecycle-readiness', { signal: controller.signal });
      if (!Array.isArray(answer?.sources) || !answer.sources.length) throw new Error('Saved source records returned invalid data. Please retry.');
      if (!controller.signal.aborted) setSources(answer.sources);
    } catch (error) { if (!controller.signal.aborted) { setSources([]); setSourcesError(error.message || 'Saved source records could not be loaded.'); } }
    finally { if (sourceRequest.current === controller) { sourceRequest.current = null; setSourcesLoading(false); } }
  }, []);
  useEffect(() => { void loadSources(); return () => sourceRequest.current?.abort(); }, [loadSources]);
  useEffect(() => { if (ai.result) void loadHistory(); }, [ai.result, loadHistory]);
  useEffect(() => {
    if (!selected) return undefined;
    const onKey = event => { if (event.key === 'Escape') setSelected(null); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); priorFocus.current?.focus(); };
  }, [selected]);
  const generate = async event => {
    event.preventDefault();
    if (!selectedSource) { ai.setError('Select an actual persisted battery pack before generating.'); return; }
    if (submitLock.current || !prompt.trim() || prompt.trim().length > 4000) return;
    submitLock.current = true; setNotice('');
    try { await ai.run(async options => {
      const answer = await reviewLifecycleReadiness(prompt.trim(), options);
      if (typeof answer?.content !== 'string' || !answer.content.trim() || !validReceipt(answer.receipt)) throw new Error('The server returned an incomplete review or receipt. Please retry.');
      return answer;
    }); } finally { submitLock.current = false; }
  };
  const open = item => { priorFocus.current = document.activeElement; setSelected(item); };
  const edit = () => { priorFocus.current = input.current; setPrompt(selected.prompt); const matched = sources.find(source => selected.prompt.includes(source.reference)); setSelectedSource(matched?.reference || ''); sourceSummary.current = matched?.summary || ''; setSelected(null); ai.setResult(null); setNotice('Saved inputs loaded for a separate review. The original receipt is retained.'); input.current?.focus(); };
  const applyExample = (example, index) => {
    const source = (selectedSource && sources.find(item => item.reference === selectedSource)) || sources[index % sources.length];
    if (!source) { ai.setError('Select an actual persisted battery pack before using an example.'); return; }
    setSelectedSource(source.reference); sourceSummary.current = source.summary;
    setPrompt(`${source.summary}\n\nIllustrative planning context (not source evidence): ${example.prompt}`);
    ai.setResult(null); ai.setError(null); setNotice('All editable AI fields are filled from a persisted source plus fictional optional context. Review before generating.');
  };
  const changeSource = event => {
    const reference = event.target.value;
    const source = sources.find(item => item.reference === reference);
    const oldPrefix = sourceSummary.current ? `${sourceSummary.current}\n\n` : '';
    const context = oldPrefix && prompt.startsWith(oldPrefix) ? prompt.slice(oldPrefix.length) : prompt;
    setSelectedSource(reference); sourceSummary.current = source?.summary || '';
    setPrompt(source ? `${source.summary}\n\n${context}` : context);
    ai.setResult(null); ai.setError(null);
  };
  const trapModalTab = event => {
    if (event.key !== 'Tab') return;
    const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')];
    const next = event.shiftKey && document.activeElement === buttons[0] ? buttons[buttons.length - 1] : !event.shiftKey && document.activeElement === buttons[buttons.length - 1] ? buttons[0] : null;
    if (next) { event.preventDefault(); next.focus(); }
  };
  return <section className="sr-ai-workspace">
    <div className="page-header"><div><h2>AI · Lifecycle Readiness</h2><p>Prepare an evidence review with your configured OpenRouter model. Qualified human approval and current measurements remain required.</p></div></div>
    <form className="card" onSubmit={generate} aria-label="Lifecycle readiness review">
      <div className="sr-presets"><div><strong>Fill the entire AI request</strong><p>Each fictional example selects a persisted pack and fills the prompt, including optional context. A pack you select manually is preserved. Generate runs only when you choose it.</p></div><div className="sr-actions">{readinessExamples.map((example, index) => <button type="button" key={example.label} className="btn secondary" disabled={ai.loading || sourcesLoading || Boolean(sourcesError)} onClick={() => applyExample(example, index)}>{example.label}</button>)}</div></div>
      {sourcesLoading && <p role="status">Loading saved source records…</p>}
      {sourcesError && <div role="alert" className="ai-error">{sourcesError} <button type="button" className="btn secondary" onClick={loadSources}>Retry sources</button></div>}
      <div className="form-group"><label htmlFor="lifecycle-review-source">Saved battery pack</label><select id="lifecycle-review-source" data-ai-field="source_reference" required disabled={ai.loading || sourcesLoading || Boolean(sourcesError)} value={selectedSource} onChange={changeSource}><option value="">Select a persisted pack…</option>{sources.map(source => <option key={source.reference} value={source.reference}>{source.label}</option>)}</select></div>
      <div className="form-group"><label htmlFor="lifecycle-review-prompt">Review prompt</label><textarea id="lifecycle-review-prompt" data-ai-field="prompt" name="prompt" rows={9} maxLength={4000} required ref={input} disabled={ai.loading} value={prompt} onChange={event => { setPrompt(event.target.value); ai.setResult(null); }} /></div>
      <div className="sr-actions"><button type="submit" className="btn ai" disabled={ai.loading || sourcesLoading || Boolean(sourcesError) || !selectedSource || !prompt.trim()}>{ai.loading ? 'Generating…' : 'Generate with OpenRouter'}</button>{ai.loading && <button type="button" className="btn secondary" onClick={ai.cancel}>Cancel generation</button>}</div>
      {(notice || ai.notice) && <p role="status">{ai.notice || notice}</p>}
    </form>
    <AIResultView result={ai.result?.content} model={ai.result?.receipt.model} title="Lifecycle readiness review" loading={ai.loading} error={ai.error} onRetry={generate} />
    {ai.result && <p>Saved receipt #{ai.result.receipt.id} · {ai.result.receipt.model}</p>}
    <section className="card"><div className="page-header"><h3>Your saved reviews</h3><button type="button" className="btn secondary" onClick={loadHistory} disabled={historyLoading}>Refresh</button></div>
      {historyLoading ? <p role="status">Loading saved reviews…</p> : historyError ? <div role="alert" className="ai-error">{historyError} <button type="button" className="btn secondary" onClick={loadHistory}>Retry</button></div> : !history.length ? <p>No saved reviews yet.</p> : <ul>{history.map(item => <li key={item.id}><button type="button" className="btn secondary" onClick={() => open(item)}>Open review #{item.id}</button> · {new Date(item.created_at).toLocaleString()}</li>)}</ul>}
    </section>
    {selected && createPortal(<div className="modal-overlay" onClick={() => setSelected(null)}><section className="modal-content" role="dialog" aria-modal="true" onKeyDown={trapModalTab} aria-labelledby="saved-lifecycle-title" style={{ maxWidth: 900 }} onClick={event => event.stopPropagation()}><div className="modal-header"><h3 id="saved-lifecycle-title">Saved lifecycle readiness review</h3></div><div className="modal-body"><AIResultView result={selected.content} model={selected.model} title="Lifecycle readiness review" /><p>Provider receipts are retained. Edit inputs prepares a separate request; this workflow has no receipt-delete endpoint.</p></div><div className="modal-footer"><button type="button" className="btn secondary" disabled={ai.loading} onClick={edit}>Edit inputs</button><button type="button" className="btn secondary" disabled title="The original provider receipt is retained">Delete · retained receipt</button><button type="button" className="btn secondary" onClick={() => setSelected(null)} autoFocus>Cancel</button></div></section></div>, document.body)}
  </section>;
}
