/**
 * Tiny date helpers used across foundation / reflection / interrupts.
 * Uses local timezone consistently to match the existing dashboard logic.
 */

export function toDateStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO week id `2026-W14` for indexing weekly reflections. */
export function toIsoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/** "2026-Q2" quarter id. */
export function toQuarter(date = new Date()) {
  const m = date.getMonth();
  return `${date.getFullYear()}-Q${Math.floor(m / 3) + 1}`;
}

/** Start-of-week (Sunday local). */
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** Format `2026-04-11` → `Apr 11, 2026` */
export function formatHuman(date, locale = 'en-US') {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
