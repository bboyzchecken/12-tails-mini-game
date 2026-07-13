'use client';

import { useState } from 'react';
import { useFilters } from '@/lib/store/filters';
import { downloadCsv } from '@/lib/api/queries';

/** Date-range filter (Zustand) + CSV export of the applied range. */
export function Controls() {
  const { from, to, setRange } = useFilters();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState('');

  async function onExport() {
    if (exporting) return;
    setExporting(true);
    setErr('');
    try {
      await downloadCsv(from, to); // exports the APPLIED range (what the board shows)
    } catch {
      setErr('ส่งออกไม่สำเร็จ');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col text-xs text-muted">
        จาก
        <input type="date" className="field mt-1" value={f} max={t} onChange={(e) => setF(e.target.value)} />
      </label>
      <label className="flex flex-col text-xs text-muted">
        ถึง
        <input type="date" className="field mt-1" value={t} min={f} onChange={(e) => setT(e.target.value)} />
      </label>
      <button type="button" className="btn btn-ghost" onClick={() => setRange(f, t)}>
        ใช้ช่วงเวลา
      </button>
      <div className="ml-auto flex items-center gap-2">
        {err && <span className="text-xs text-danger">{err}</span>}
        <button type="button" className="btn btn-primary" disabled={exporting} onClick={onExport}>
          {exporting ? 'กำลังส่งออก…' : '⬇ Export CSV'}
        </button>
      </div>
    </div>
  );
}
