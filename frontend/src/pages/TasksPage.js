import React, { useEffect, useState } from 'react';
import { tasksApi, canWrite } from '../services/api';

export default function TasksPage() {
  const [rows, setRows] = useState([]); const [title, setTitle] = useState(''); const [statusFilter, setStatusFilter] = useState(''); const [err, setErr] = useState('');
  const writer = canWrite();
  const load = async () => { try { const d = await tasksApi.list(statusFilter ? { status: statusFilter } : {}); setRows(Array.isArray(d) ? d : []); } catch (e) { setErr(e.message); } };
  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line
  const create = async () => { if (!title.trim()) return; await tasksApi.create({ title: title.trim() }); setTitle(''); load(); };
  const setStatus = async (t, status) => { await tasksApi.update(t.id, { ...t, status }); load(); };
  return (<div><h2>Tasks</h2><p>Authenticated follow-up tasks. Create and update are restricted to writer roles by the API.</p>
    {err && <p role="alert">{err}</p>}
    <label>Status filter <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="blocked">Blocked</option></select></label>
    {writer && <div><input aria-label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task title" /><button type="button" onClick={create}>Create task</button></div>}
    <ul>{rows.map((t) => (<li key={t.id}><span>{t.title} — {t.status}</span>{writer && <select aria-label={`Status for ${t.title}`} value={t.status} onChange={(e) => setStatus(t, e.target.value)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="blocked">Blocked</option></select>}</li>))}</ul>
    {rows.length === 0 && <p>No tasks reported.</p>}</div>);
}
