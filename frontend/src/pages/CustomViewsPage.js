import React from 'react';
import SohDegradationChart from '../components/SohDegradationChart';
import CellVoltageGrid from '../components/CellVoltageGrid';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Battery Analytics</h1>
        <p style={{ margin: '6px 0 0', color: '#64748b' }}>
          Multi-pack SoH degradation overlay and per-pack cell voltage heatmap.
        </p>
      </header>

      <section style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}>
        <h2 style={{ marginTop: 0, fontSize: 18, color: '#0f172a' }}>SoH Degradation Curves</h2>
        <SohDegradationChart />
      </section>

      <section style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: 20,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}>
        <h2 style={{ marginTop: 0, fontSize: 18, color: '#0f172a' }}>Cell Voltage Heatmap</h2>
        <CellVoltageGrid />
      </section>
    </div>
  );
}
