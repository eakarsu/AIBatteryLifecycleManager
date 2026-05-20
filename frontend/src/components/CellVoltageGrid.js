import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE, getToken } from '../services/api';

// Map a voltage to a color on a blue (low) → green (nominal 3.6V) → red (imbalanced) scale.
function voltageColor(v, nominal = 3.6) {
  if (!v || v <= 0) return '#94a3b8'; // unknown / grey
  const delta = v - nominal;
  const absDelta = Math.abs(delta);
  if (absDelta >= 0.25) return '#dc2626';          // severely imbalanced — red
  if (absDelta <= 0.05) return '#16a34a';          // green band — nominal
  if (delta < 0) {
    // low → blue-ish, scale 0.05 .. 0.25
    const t = Math.min((absDelta - 0.05) / 0.20, 1);
    // blend green(#16a34a) → blue(#2563eb)
    return blend('#16a34a', '#2563eb', t);
  }
  // high → red-ish
  const t = Math.min((absDelta - 0.05) / 0.20, 1);
  return blend('#16a34a', '#dc2626', t);
}

function blend(hexA, hexB, t) {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function parseHex(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export default function CellVoltageGrid() {
  const [packId, setPackId] = useState('');
  const [data, setData] = useState(null);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchView = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const qs = pid ? `?pack_id=${encodeURIComponent(pid)}` : '';
      const res = await fetch(`${API_BASE}/custom-views/cell-voltages${qs}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      setData(json);
      if (json.available_packs?.length) setPacks(json.available_packs);
      if (!pid && json.pack_id) setPackId(json.pack_id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchView(''); }, [fetchView]);

  const onChange = (e) => {
    const pid = e.target.value;
    setPackId(pid);
    fetchView(pid);
  };

  return (
    <div data-testid="cell-voltage-grid">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <label htmlFor="cell-voltage-pack" style={{ fontWeight: 600, color: '#334155' }}>Battery Pack:</label>
        <select
          id="cell-voltage-pack"
          value={packId}
          onChange={onChange}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: '#fff',
            minWidth: 200,
          }}
        >
          {packs.length === 0 && <option value="">— no packs —</option>}
          {packs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
          <Legend label="Low (<3.55 V)" color="#2563eb" />
          <Legend label="Nominal (~3.6 V)" color="#16a34a" />
          <Legend label="Imbalanced (Δ≥0.25 V)" color="#dc2626" />
        </div>
      </div>

      {loading && <div className="ai-loading"><span className="spinner" />Loading cells...</div>}
      {error && <div className="ai-error">{error}</div>}

      {!loading && !error && data && (
        <>
          {data.cells && data.cells.length > 0 ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
                gap: 6,
              }}>
                {data.cells.map((c) => {
                  const bg = voltageColor(c.voltage_v, data.nominal_v);
                  return (
                    <div
                      key={c.id}
                      title={`${c.cell_id || c.id} · ${c.position || ''} · ${c.voltage_v.toFixed(3)} V · ${c.temperature_c.toFixed(1)}°C · ${c.status || ''}`}
                      style={{
                        background: bg,
                        color: '#fff',
                        textShadow: '0 1px 1px rgba(0,0,0,0.4)',
                        borderRadius: 6,
                        padding: '10px 6px',
                        textAlign: 'center',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 11,
                        lineHeight: 1.3,
                        border: c.band === 'imbalanced' ? '2px solid #0f172a' : '1px solid rgba(0,0,0,0.1)',
                      }}
                      data-cell-band={c.band}
                    >
                      <div style={{ fontWeight: 700 }}>{(c.cell_id || `C${c.id}`).toString().slice(-6)}</div>
                      <div>{c.voltage_v.toFixed(3)} V</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, color: '#475569', fontSize: 13 }}>
                Pack <strong>{data.pack_id}</strong> · {data.cell_count} cell{data.cell_count === 1 ? '' : 's'} ·
                nominal {data.nominal_v.toFixed(2)} V ·
                imbalanced cells: <strong>{data.cells.filter((c) => c.band === 'imbalanced').length}</strong>
              </div>
            </>
          ) : (
            <div className="ai-empty">No cells found for this pack.</div>
          )}
        </>
      )}
    </div>
  );
}

function Legend({ label, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 12, height: 12, background: color, borderRadius: 3, display: 'inline-block' }} />
      {label}
    </span>
  );
}
