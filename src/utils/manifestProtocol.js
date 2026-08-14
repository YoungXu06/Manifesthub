/**
 * The "Reset Protocol" — questions library for the 1-day life-reset ritual.
 * Source: How to fix your entire life in 1 day. Sections referenced as §VI etc.
 *
 * All keys point at i18n entries in `protocol.*` so prompts can be localized
 * while the structure (ordering / metadata) is hard-coded here.
 */

// ── Foundation: 6 elements that compose the "video game" of one's life ──
export const FOUNDATION_ELEMENTS = [
  { key: 'antiVision',         maxLen: 240, lines: 2 },
  { key: 'vision',             maxLen: 240, lines: 2 },
  { key: 'identityStatement',  maxLen: 200, lines: 2 },
  { key: 'oneYearLens',        maxLen: 200, lines: 2 },
  { key: 'oneMonthProject',    maxLen: 200, lines: 2 },
  { key: 'constraints',        maxLen: 400, lines: 4 },
];

// ── Reset Protocol — Morning excavation (14 prompts) ──
// Q1–Q4 surface dissatisfaction; Q5–Q11 build the anti-vision; Q12–Q14 seed the vision.
export const RESET_MORNING_KEYS = [
  'q1_dullDissatisfaction',
  'q2_repeatedComplaints',
  'q3_behaviorVsWords',
  'q4_unbearableTruth',
  'q5_fiveYearTuesday',
  'q6_tenYearMissed',
  'q7_endOfLife',
  'q8_alreadyLivingFuture',
  'q9_identityToGiveUp',
  'q10_embarrassingReason',
  'q11_protectionCost',
  'q12_idealTuesday',
  'q13_identityToHave',
  'q14_oneActionThisWeek',
];

// ── Pattern interrupts (6 + 3) — fired throughout the day ──
export const INTERRUPT_PROMPTS = [
  { time: '11:00', key: 'i1_avoiding' },
  { time: '13:30', key: 'i2_filmedBehavior' },
  { time: '15:15', key: 'i3_lifeIHate' },
  { time: '17:00', key: 'i4_pretendingNotImportant' },
  { time: '19:30', key: 'i5_identityProtection' },
  { time: '21:00', key: 'i6_aliveVsDead' },
  { time: 'free',  key: 'i7_stoppedNeeding' },
  { time: 'free',  key: 'i8_aliveVsSafety' },
  { time: 'free',  key: 'i9_smallestVersion' },
];

// ── Reset Protocol — Evening synthesis (8 prompts) ──
export const RESET_EVENING_KEYS = [
  'e1_whyStuck',
  'e2_actualEnemy',
  'e3_antiVisionSentence',     // → maps to foundation.antiVision
  'e4_visionSentence',          // → maps to foundation.vision
  'e5_oneYearLens',             // → maps to foundation.oneYearLens
  'e6_oneMonthLens',            // → maps to foundation.oneMonthProject
  'e7_dailyLevers',
  'e8_constraints',             // → maps to foundation.constraints
];

// ── Mini Reset (free tier quarterly) — distilled essentials ──
export const MINI_RESET_KEYS = [
  'q1_dullDissatisfaction',
  'q5_fiveYearTuesday',
  'q9_identityToGiveUp',
  'q12_idealTuesday',
  'q13_identityToHave',
  'e3_antiVisionSentence',
  'e4_visionSentence',
];

// ── Weekly reflection (5 prompts, controlled by Sunday cadence) ──
export const WEEKLY_REFLECTION_KEYS = [
  'w1_identityProgress',  // 1–5 scale
  'w2_antiVisionSlips',
  'w3_futureMomentum',
  'w4_projectStatus',     // ahead/on/behind/adjust
  'w5_dailyLevers',
];

// ── Free-tier limits ──
export const FREE_TIER_LIMITS = {
  yearLens: 1,
  monthLens: 1,
  weekLens: 3,
  dayLens: Infinity,
  reflectionHistoryWeeks: 4,
  miniResetPerYear: 4,         // quarterly
  fullResetPerYear: 0,         // paid only
  foundationVersionHistory: false,
};

// ── Lens hierarchy — vision board level taxonomy ──
export const LENS_LEVELS = [
  { id: 'year',  emoji: '🎯', gradient: 'from-purple-500 to-indigo-600' },
  { id: 'month', emoji: '🗻', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'week',  emoji: '⚔️', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'day',   emoji: '⚡', gradient: 'from-amber-500 to-orange-500' },
];
