import { create } from 'zustand';

/** YYYY-MM-DD for `n` days ago (local time). */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Admin date-range filter (drives the ?from/?to on /admin/metrics). */
interface FilterState {
  from: string;
  to: string;
  setRange: (from: string, to: string) => void;
}

export const useFilters = create<FilterState>((set) => ({
  from: daysAgo(30),
  to: daysAgo(0),
  setRange: (from, to) => set({ from, to }),
}));
