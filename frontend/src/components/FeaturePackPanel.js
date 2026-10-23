import React, { useEffect, useState } from 'react';

export default function FeaturePackPanel() {
  const [tasks, setTasks] = useState([]); const [title, setTitle] = useState(''); const [err, setErr] = useState(''); const [ai, setAi] = useState(null);
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('blm_token') || ''}` });
  const load = () => fetch('/api/tasks', { headers: headers() }).then((r) => r.json()).then((d) => setTasks(Array.isArray(d) ? d : [])).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const create = async () => { const r = await fetch('/api/tasks', { method: 'POST', headers: headers(), body: JSON.stringify({ title }) }); if (!r.ok) return setErr('Create failed'); setTitle(''); load(); };
  const done = async (id) => { await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status: 'done' }) }); load(); };
  
  return (<div style={{ padding: 16 }}><h2>Tasks, export</h2>{err && <p role="alert">{err}</p>}
    <p><a href="/api/battery-packs/export?format=csv">Export CSV</a>{' '}<a href="/api/battery-packs/export?format=json">Export JSON</a></p>
    <input aria-label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task" /><button onClick={create} disabled={!title.trim()}>Add task</button>
    <ul>{tasks.map((t) => (<li key={t.id}>{t.title} — {t.status}{' '}{t.status !== 'done' && <button onClick={() => done(t.id)}>Mark done</button>}</li>))}</ul>
    
  </div>);
}
