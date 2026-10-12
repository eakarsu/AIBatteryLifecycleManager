import AIFieldPresets, { completeExample, requiresSource } from './AIFieldPresets';
import { safeAIExamples, nativeAIFields, mergeReviewedSources } from './AIPagePresets';
import useCancelableAI from './useCancelableAI';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AIResultDisplay from './AIResultView';
import { getAIHistory, getAISamples, getAISources } from '../services/api';

/**
 * Generic AI feature page.
 * Props:
 *   - title, subtitle
 *   - feature: string  (matches backend `feature` column in ai_results, e.g. "plan-mission")
 *   - inputs: [{ key, label, type?, placeholder?, options?, defaultValue? }]
 *   - run: async (values) => result
 *   - buttonLabel?
 */
export default function AIPage({ title, subtitle, feature, inputs, run, buttonLabel = 'Generate with OpenRouter' }) {
  const nativeInputs = nativeAIFields(inputs, feature);
  const previousDemo = useRef({});
  const initial = Object.fromEntries(
    (inputs || []).map((i) => [i.key, i.defaultValue ?? (i.type === 'number' ? 0 : '')])
  );
  const [values, setValues] = useState(initial);
  const aiRequest = useCancelableAI();
  const { loading, result, error, setResult, setError } = aiRequest;



  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [samples, setSamples] = useState([]);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [samplesError, setSamplesError] = useState('');
  const samplesRequest = useRef(null);

  const [sourceConfig, setSourceConfig] = useState({ summaryField: null, sources: [] });
  const [selectedSource, setSelectedSource] = useState('');
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState('');
  const sourcesRequest = useRef(null);
  const sourcePinned = useRef(false);

  const loadSamples = useCallback(async () => {
    samplesRequest.current?.abort();
    if (!feature) { setSamplesLoading(false); return; }
    const controller = new AbortController();
    samplesRequest.current = controller;
    setSamplesLoading(true);
    setSamplesError('');
    try {
      const data = await getAISamples(feature, { signal: controller.signal });
      if (!Array.isArray(data?.samples) || data.samples.length < 3) {
        throw new Error('AI examples returned an invalid response.');
      }
      if (!controller.signal.aborted) setSamples(data.samples);
    } catch (failure) {
      if (!controller.signal.aborted) {
        setSamples([]);
        setSamplesError(failure.message || 'AI examples could not be loaded.');
      }
    } finally {
      if (samplesRequest.current === controller) {
        samplesRequest.current = null;
        setSamplesLoading(false);
      }
    }
  }, [feature]);

  useEffect(() => {
    void loadSamples();
    return () => samplesRequest.current?.abort();
  }, [loadSamples]);

  const loadSources = useCallback(async () => {
    sourcesRequest.current?.abort();
    if (!feature) { setSourcesLoading(false); return; }
    const controller = new AbortController();
    sourcesRequest.current = controller;
    setSourcesLoading(true);
    setSourcesError('');
    try {
      const data = await getAISources(feature, { signal: controller.signal });
      if (!data || !Array.isArray(data.sources)) throw new Error('Saved sources returned an invalid response.');
      if (!controller.signal.aborted) {
        setSourceConfig({ summaryField: data.summaryField || null, sources: data.sources });
        setSelectedSource('');
        sourcePinned.current = false;
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setSourceConfig({ summaryField: null, sources: [] });
        setSourcesError(failure.message || 'Saved sources could not be loaded.');
      }
    } finally {
      if (sourcesRequest.current === controller) {
        sourcesRequest.current = null;
        setSourcesLoading(false);
      }
    }
  }, [feature]);

  useEffect(() => {
    void loadSources();
    return () => sourcesRequest.current?.abort();
  }, [loadSources]);

  const setField = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const applySample = (sample, index = 0) => {
    let normalized = safeAIExamples(nativeInputs, sample || {}, values);
    const sources = sourceConfig.sources || [];
    const chosen = sourcePinned.current && selectedSource
      ? sources.find((item) => item.reference === selectedSource)
      : sources[index % Math.max(sources.length, 1)];
    if (chosen && sourceConfig.summaryField) {
      setSelectedSource(chosen.reference);
      const supplied = normalized.values || {};
      const context = String(supplied[sourceConfig.summaryField] || '').trim();
      normalized = {
        ...normalized,
        values: {
          ...supplied,
          [sourceConfig.summaryField]: `${chosen.summary}${context ? `\n\nIllustrative planning context (not source evidence): ${context}` : ''}`,
        },
      };
    }
    setValues(mergeReviewedSources(nativeInputs, completeExample(nativeInputs, normalized, index, title, values), values, previousDemo.current));
    setResult(null); setError(null);
  };

  const missingReferences = nativeInputs.filter(field => field.required && requiresSource(field) && !String(values[field.key] ?? '').trim());
  const handleRun = async (event) => {
    event?.preventDefault?.();
    if (sourcesError) {
      setError('Saved source records are unavailable. Retry sources before generating.');
      return;
    }
    if (sourceConfig.sources.length > 0 && !selectedSource) {
      setError('Select an actual saved source record before generating.');
      return;
    }
    if (missingReferences.length) {
      setError('Select actual saved references before generating: ' + missingReferences.map(field => field.label).join(', '));
      return;
    }
    return aiRequest.run((options) => run(values, options));
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryRows([]);
    try {
      const rows = await getAIHistory(feature, 50);
      setHistoryRows(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setHistoryError(e.message);
    } finally {
      setHistoryLoading(false);
    }
  };
  const closeHistory = () => setHistoryOpen(false);

  return (
    <div className="sr-ai-workspace">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="page-header-actions">
          {feature && (
            <button className="btn secondary" onClick={openHistory}>History</button>
          )}
          <button className="btn ai" onClick={handleRun} disabled={loading || sourcesLoading || Boolean(sourcesError) || (sourceConfig.sources.length > 0 && !selectedSource) || missingReferences.length > 0}>
            {loading ? <><span className="spinner" />Running...</> : buttonLabel}
          </button>
          {loading && <button type="button" className="btn secondary btn-secondary" onClick={aiRequest.cancel}>Cancel</button>}
        </div>
      </div>

      <AIFieldPresets fields={nativeInputs} samples={samples.map((sample, index) => ({ ...sample, label: `Demo AI · ${sample.label || ["Quick review", "Team planning", "Detailed review"][index % 3]}` }))} context={title} disabled={loading || samplesLoading || sourcesLoading || Boolean(sourcesError)} onFill={applySample} />
      {samplesLoading && <p role="status">Loading fictional AI examples…</p>}
      {samplesError && <div className="ai-error" role="alert">{samplesError} <button type="button" className="btn secondary" onClick={loadSamples}>Retry examples</button></div>}
      {sourcesLoading && <p role="status">Loading saved source records…</p>}
      {sourcesError && <div className="ai-error" role="alert">{sourcesError} <button type="button" className="btn secondary" onClick={loadSources}>Retry sources</button></div>}
      {missingReferences.length > 0 && <p role="status">Choose actual saved records for {missingReferences.map(field => field.label).join(", ")}. Demo AI never invents IDs.</p>}
      <p>Demo inputs are illustrative planning examples. Preserve verified observations, record references and original source data; review them before sending.</p>
      {aiRequest.notice && <div className="sr-notice" role="status">{aiRequest.notice}</div>}

      {(inputs && inputs.length > 0) && (
        <div className="card">
          {sourceConfig.sources.length > 0 && (
            <div className="form-group full-width">
              <label htmlFor={`ai-source-${feature}`}>Saved source record</label>
              <select
                id={`ai-source-${feature}`}
                data-ai-field="source_reference"
                required
                value={selectedSource}
                onChange={(event) => {
                  const reference = event.target.value;
                  const source = sourceConfig.sources.find((item) => item.reference === reference);
                  sourcePinned.current = Boolean(reference);
                  setSelectedSource(reference);
                  if (source && sourceConfig.summaryField) setField(sourceConfig.summaryField, source.summary);
                  else if (sourceConfig.summaryField) setField(sourceConfig.summaryField, '');
                  setResult(null); setError(null);
                }}
              >
                <option value="">Select a persisted record…</option>
                {sourceConfig.sources.map((source) => <option key={source.reference} value={source.reference}>{source.label}</option>)}
              </select>
              <p>Examples choose a real persisted source when blank. A source you select manually is preserved across example changes.</p>
            </div>
          )}
          <div className="form-grid">
            {nativeInputs.map((i) => (
              <div key={i.key} className={`form-group ${i.type === 'textarea' ? 'full-width' : ''}`}>
                <label>{i.label}</label>
                {i.type === 'select' ? (
                  <select data-ai-field={i.key} required={Boolean(nativeInputs.find(field => field.key === i.key)?.required)} value={values[i.key] ?? ''} onChange={(e) => setField(i.key, e.target.value)}>
                    <option value="">—</option>
                    {(i.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : i.type === 'textarea' ? (
                  <textarea
                    data-ai-field={i.key}
                    required={Boolean(nativeInputs.find(field => field.key === i.key)?.required)}
                    placeholder={i.placeholder || ''}
                    value={values[i.key] ?? ''}
                    onChange={(e) => setField(i.key, e.target.value)}
                  />
                ) : (
                  <input data-ai-field={i.key} required={Boolean(nativeInputs.find(field => field.key === i.key)?.required)}
                    type={i.type || 'text'}
                    placeholder={i.placeholder || ''}
                    value={values[i.key] ?? ''}
                    onChange={(e) =>
                      setField(i.key, i.type === 'number' ? Number(e.target.value || 0) : e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AIResultDisplay
        result={result}
        loading={loading}
        error={error}
        feature={feature}
        title={title}
        onRetry={handleRun}
      />

      {historyOpen && (
        <div className="modal-overlay" onClick={closeHistory}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h3>{title} · History</h3>
              <button className="modal-close" onClick={closeHistory}>×</button>
            </div>
            <div className="modal-body">
              {historyLoading && <div className="empty-state">Loading history...</div>}
              {historyError && <div className="ai-error" role="alert">{historyError} <button type="button" className="btn secondary" onClick={openHistory}>Retry history</button></div>}
              {!historyLoading && !historyError && historyRows.length === 0 && (
                <div className="empty-state">No past results for this feature yet.</div>
              )}
              {historyRows.map((row) => (
                <div key={row.id} className="history-entry">
                  <div className="history-entry-meta">
                    <span className="history-entry-id">#{row.id}</span>
                    <span className="history-entry-time">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                  {row.input && Object.keys(row.input).length > 0 && (
                    <details>
                      <summary>Input parameters</summary>
                      <div style={{ marginTop: 8 }}>
                        <AIResultDisplay result={row.input} feature={`${feature}-input`} title="Input" />
                      </div>
                    </details>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <AIResultDisplay result={row.output} feature={feature} title={title} />
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={closeHistory}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
