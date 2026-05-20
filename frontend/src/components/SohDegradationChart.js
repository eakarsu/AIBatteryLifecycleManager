import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ReferenceDot, ResponsiveContainer,
} from 'recharts';
import { API_BASE, getToken } from '../services/api';

// Distinct colors per pack line (cycled if more packs than colors).
const COLORS = [
  '#2563eb', '#16a34a', '#dc2626', '#ea580c', '#9333ea',
  '#0891b2', '#ca8a04', '#db2777', '#475569', '#15803d',
];

function colorFor(idx) {
  return COLORS[idx % COLORS.length];
}

export default function SohDegradationChart() {
  const [data, setData] = useState({ packs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/custom-views/degradation-curves`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
        if (alive) setData(json);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="ai-loading"><span className="spinner" />Loading degradation curves...</div>;
  if (error)   return <div className="ai-error">{error}</div>;

  const packs = data.packs || [];
  if (!packs.length) {
    return <div className="ai-empty">No degradation curve samples yet.</div>;
  }

  // Merge all packs into a single dataset keyed by cycle_count, one column per pack.
  const cycleSet = new Set();
  packs.forEach((p) => p.points.forEach((pt) => cycleSet.add(pt.cycle_count)));
  const cycles = Array.from(cycleSet).sort((a, b) => a - b);

  const merged = cycles.map((cycle) => {
    const row = { cycle_count: cycle };
    packs.forEach((p) => {
      const hit = p.points.find((pt) => pt.cycle_count === cycle);
      if (hit) row[p.pack_id] = hit.soh_pct;
    });
    return row;
  });

  return (
    <div data-testid="soh-degradation-chart">
      <div style={{ marginBottom: 12, color: '#475569', fontSize: 13 }}>
        Overlay of SoH (%) vs. cycle count for {packs.length} battery pack{packs.length === 1 ? '' : 's'}.
        The dashed line at 80% marks the typical "knee point" threshold for end-of-warranty service.
      </div>
      <div style={{ width: '100%', height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 16, right: 32, bottom: 24, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="cycle_count"
              type="number"
              label={{ value: 'Cycle Count', position: 'insideBottom', offset: -10 }}
              stroke="#64748b"
            />
            <YAxis
              domain={[60, 100]}
              label={{ value: 'SoH (%)', angle: -90, position: 'insideLeft' }}
              stroke="#64748b"
            />
            <Tooltip
              formatter={(value) => (value == null ? '—' : `${Number(value).toFixed(1)}%`)}
              labelFormatter={(v) => `Cycle ${v}`}
            />
            <Legend />
            <ReferenceLine
              y={80}
              stroke="#dc2626"
              strokeDasharray="6 4"
              label={{ value: 'Knee Point (80% SoH)', position: 'insideTopRight', fill: '#dc2626', fontSize: 12 }}
            />
            {packs.map((p, idx) => (
              <Line
                key={p.pack_id}
                type="monotone"
                dataKey={p.pack_id}
                stroke={colorFor(idx)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
            {packs.map((p, idx) =>
              p.knee_point ? (
                <ReferenceDot
                  key={`${p.pack_id}-knee`}
                  x={p.knee_point.cycle_count}
                  y={p.knee_point.soh_pct}
                  r={6}
                  fill={colorFor(idx)}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                  label={{
                    value: `${p.pack_id} knee`,
                    position: 'top',
                    fill: '#0f172a',
                    fontSize: 11,
                  }}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table style={{ marginTop: 16, width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
            <th style={{ padding: '8px 10px' }}>Pack</th>
            <th style={{ padding: '8px 10px' }}>Samples</th>
            <th style={{ padding: '8px 10px' }}>Knee @ Cycle</th>
            <th style={{ padding: '8px 10px' }}>Knee SoH</th>
          </tr>
        </thead>
        <tbody>
          {packs.map((p, idx) => (
            <tr key={p.pack_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '6px 10px', color: colorFor(idx), fontWeight: 600 }}>{p.pack_id}</td>
              <td style={{ padding: '6px 10px' }}>{p.sample_count}</td>
              <td style={{ padding: '6px 10px' }}>{p.knee_point ? p.knee_point.cycle_count : '—'}</td>
              <td style={{ padding: '6px 10px' }}>{p.knee_point ? `${p.knee_point.soh_pct.toFixed(1)}%` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
