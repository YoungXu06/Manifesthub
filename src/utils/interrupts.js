/**
 * Pattern interrupts — local-only scheduling using setTimeout chains.
 *
 * The browser's Notification API can only fire while the page is open.
 * This module also writes "due" entries to localStorage so we can show an
 * in-app inbox banner (regardless of whether the user granted permission).
 *
 * For users who keep the tab open: real notifications fire.
 * For users who don't: the next time they visit, missed prompts are queued
 * in the inbox banner.
 */

import { INTERRUPT_PROMPTS } from './manifestProtocol';
import { toDateStr } from './dateUtils';

const STORAGE_KEY = 'manifestHub:interrupts';

/** Read user-facing interrupt config from localStorage. */
export function getInterruptSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch { return {}; }
}

export function setInterruptSettings(patch) {
  const cur = getInterruptSettings();
  const next = { ...cur, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/** Slot key (filterable per-day in storage). e.g. "11:00" → "i1_avoiding". */
export function slotKeyForTime(time) {
  return INTERRUPT_PROMPTS.find(p => p.time === time)?.key;
}

/** Today's prompts that are due (time has passed) and not yet answered. */
export function getDuePrompts(answers, now = new Date()) {
  const due = [];
  for (const p of INTERRUPT_PROMPTS) {
    if (p.time === 'free') continue;
    const [hh, mm] = p.time.split(':').map(Number);
    const t = new Date(now);
    t.setHours(hh, mm, 0, 0);
    if (now >= t && !(answers || {})[p.key]) due.push(p);
  }
  return due;
}

/** Next prompt scheduled for today (used for "next interrupt at HH:MM"). */
export function getNextPrompt(answers, now = new Date()) {
  for (const p of INTERRUPT_PROMPTS) {
    if (p.time === 'free') continue;
    const [hh, mm] = p.time.split(':').map(Number);
    const t = new Date(now);
    t.setHours(hh, mm, 0, 0);
    if (now < t && !(answers || {})[p.key]) return { ...p, at: t };
  }
  return null;
}

// ── Notification scheduling (deduplicated) ──────────────────────────────────
let lastHandles = [];

/** Clear all previously scheduled notification timers for today. */
export function cancelTodayNotifications() {
  if (!lastHandles.length) return;
  lastHandles.forEach((h) => clearTimeout(h));
  lastHandles = [];
}

/** Schedule notifications for the rest of the day in the current tab. */
export function scheduleTodayNotifications(answers) {
  // Deduplicate: tear down any previous schedule before creating a new one.
  cancelTodayNotifications();
  const settings = getInterruptSettings();
  if (!settings.enabled) return [];
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return [];

  const handles = [];
  const now = new Date();
  for (const p of INTERRUPT_PROMPTS) {
    if (p.time === 'free') continue;
    if ((answers || {})[p.key]) continue;
    const [hh, mm] = p.time.split(':').map(Number);
    const fireAt = new Date(now);
    fireAt.setHours(hh, mm, 0, 0);
    const ms = fireAt.getTime() - now.getTime();
    if (ms < 0 || ms > 24 * 60 * 60 * 1000) continue;
    const handle = setTimeout(() => {
      try {
        const n = new Notification('ManifestHub', {
          body: `What am I avoiding right now? · ${p.time}`,
          icon: '/manifest-hub-logo.jpg',
          tag: `mh-${p.key}-${toDateStr(now)}`,
        });
        n.onclick = () => {
          // SPA navigation: dispatch an event that MainLayout listens for and
          // routes on — no full page load.
          window.focus();
          window.dispatchEvent(new CustomEvent('mh:open-interrupt', { detail: { slot: p.key } }));
        };
      } catch (e) { /* ignore */ }
    }, ms);
    handles.push(handle);
  }
  lastHandles = handles;
  return handles;
}

/** Request the browser permission, returning the granted state. */
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

// ── Draft persistence (per day + slot) ──────────────────────────────────────
export function saveInterruptDraft(dateStr, slot, answer) {
  try {
    localStorage.setItem(
      `manifestHub:interruptDraft:${dateStr}:${slot}`,
      JSON.stringify({ answer, savedAt: Date.now() })
    );
  } catch { /* ignore */ }
}

export function loadInterruptDraft(dateStr, slot) {
  try {
    const raw = localStorage.getItem(`manifestHub:interruptDraft:${dateStr}:${slot}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.answer === 'string' ? parsed.answer : null;
  } catch { return null; }
}

export function clearInterruptDraft(dateStr, slot) {
  try { localStorage.removeItem(`manifestHub:interruptDraft:${dateStr}:${slot}`); } catch { /* ignore */ }
}

// ── Dismissal persistence (per day) ─────────────────────────────────────────
export function isInterruptDismissed(dateStr) {
  try { return localStorage.getItem(`manifestHub:interruptDismissed:${dateStr}`) === 'true'; } catch { return false; }
}

export function dismissInterrupts(dateStr) {
  try { localStorage.setItem(`manifestHub:interruptDismissed:${dateStr}`, 'true'); } catch { /* ignore */ }
}
