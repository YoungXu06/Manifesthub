# ManifestHub — Identity Transformation Engine

> **Transform how you think about your life by connecting identity, vision, and daily action.**

ManifestHub is an operating system for identity-driven manifestation, built on the framework from *"How to fix your entire life in 1 day"*. It helps users excavate their anti-vision, anchor a 6-element identity foundation, and close the loop between who they say they are and what their actions reveal.

---

## Table of Contents

1. [Product Philosophy](#product-philosophy)
2. [Core Design Principles](#core-design-principles)
3. [Product Architecture](#product-architecture)
4. [Implementation Overview](#implementation-overview)
5. [Monetization Model](#monetization-model)
6. [Deployment Guide](#deployment-guide)

---

## Product Philosophy

### The Root Problem

Users fall into manifestation trap: they know *what* they want, but they've never examined **who they need to become** to naturally live that life. Traditional goal-tracking apps (calendars, to-do lists, affirmation carousels) reinforce goal-orientation *without* identity transformation, which is why 93% of New Year resolutions fail by mid-January.

ManifestHub flips this: **identity first, goals second**. It's anchored on seven propositions from the original framework:

1. **Identity determines behavior** — You are not your goals; you are your identity, and behavior is the byproduct
2. **All behavior is goal-directed** — Your goals act as a perceptual filter; change the goal, change what you see
3. **Identity protects itself** — Fear-driven avoidance masquerades as "being realistic"; this needs excavation
4. **Consciousness has stages** — Whether you can reach your destination depends on your stage of mind
5. **Intelligence = cybernetics** — Act → Perceive → Compare → Adjust; close the loop weekly and yearly
6. **The 1-Day Reset Protocol** — Morning excavation → daytime interrupts → evening synthesis in 24 hours
7. **Life as a game** — Anti-vision / Vision / 1-Year Lens / 1-Month Project / Daily Levers / Constraints

### Why This Matters

**吸引力法则 (Law of Attraction) reframed as operational rigor:**

The original framework isn't mystical — it's applied cybernetics + behavioral psychology:
- Antivision exposes the *gravity* behind your effort (what you're moving away from drives faster than what you're moving toward)
- Identity statement locks in belief; belief shapes perception; perception shapes behavior
- Daily levers (2–3 actions the future-you would take without negotiation) bypass the prefrontal cortex and run on autopilot
- Weekly reflection closes the feedback loop: did my *actions* align with my *identity claims*?

**The product is not about luck or manifestation magic.** It's about **rigorous identity alignment**, with optional AI to mirror back inconsistencies.

---

## Core Design Principles

### 1. **Identity-First, Not Goal-Centric**

Every feature defaults to "who am I becoming?" rather than "what do I want?"

- Dashboard hero: your current Identity Statement (not static affirmations)
- Affirmation carousel: auto-generated from your Foundation (antiVision / vision / monthly project / yearly lens)
- Intention input: "What would the [identityStatement] version of you do today?"
- Vision cards: include `identityLink` field — how does this serve your identity?

### 2. **Anti-Vision Before Vision**

Users intuitively know what they hate more vividly than what they love. Start there.

- "I refuse to let my life become…" is the first prompt in both Foundation and Reset Protocol
- This negative energy becomes *directional velocity* — faster than abstract aspirations
- Anti-vision also prevents the "hedgehog dilemma": you move toward vision but also away from anti-vision

### 3. **Hierarchical, Not Flat**

All vision is NOT created equal. Lens hierarchy mirrors game-design structure:

```
Year Lens    (1 card)  — The one thing that proves old patterns broke
   ↓
Month Project (1–2)    — The boss fight of this month
   ↓
Week Quests  (2–4)     — Mini-objectives refreshing each Sunday
   ↓
Daily Levers (2–3)     — Needle-moving actions on autopilot
```

This prevents "vision board paralysis" (100 random cards) and makes priorities obvious.

### 4. **Closed-Loop Feedback**

Cybernetics requires *sense → compare → adjust*. Every temporal layer has a reflection rhythm:

- **Daily**: Check-in + intention + mood + gratitude (+ optional pattern interrupts)
- **Weekly**: 5-question reflection (identity progress / anti-vision slips / future momentum / project status / next week's levers)
- **Monthly**: Implied review as new 1-Month Project is set
- **Yearly**: Full Reset Protocol (morning → day → evening synthesis)

Missing any of these breaks the loop.

### 5. **Embodied, Not Templated**

Static affirmations ("You are worthy") don't work because they're not *yours*. All user-facing text is generated from the user's own Foundation + Reset answers:

- "I am the type of person who [your identity statement]"
- "Today I refuse to let my life become [your anti-vision]"
- "This month I'm building [your monthly project]"
- "By [date] one thing is true: [your yearly lens]"

Even AI features (Probe / Mirror / Connect) only *ask questions* — they never write the user's answers.

### 6. **No Outsourcing Core Thinking**

Per the framework: *"Do not attempt to outsource this contemplation to AI."*

- Reset Protocol **prohibits AI auto-fill**; all 30 questions require hand-typed responses
- AI is only invited to: ask smarter follow-ups, mirror back inconsistencies, connect this year's answers to last year's
- Product *design* prevents users from hitting "AI write my answer" — that button simply doesn't exist

---

## Product Architecture

### Phase A: Identity Foundation (MVP — Weeks 1–8)

#### A1. Identity Foundation Module (`/foundation`)

A 5-minute, one-time + revisitable "OS configuration" of 6 elements:

| Element | Prompt | Commitment |
|---------|--------|-----------|
| **antiVision** | "I refuse to let my life become…" | 1–2 sentences of vivid dread |
| **vision** | "I'm building toward…" | 1 sentence (will evolve) |
| **identityStatement** | "I am the type of person who…" | 1 sentence, believed |
| **oneYearLens** | "One year from now, this is true…" | 1 concrete, observable thing |
| **oneMonthProject** | "This month I'm shipping / learning…" | The boss fight of 30 days |
| **constraints** | "I will not sacrifice…" | 3–5 rules of the game |

**Data model**: Versioned (`foundationHistory[]`); allows user to see their evolution year-over-year.

#### A2. Lens Hierarchy (Refactored Vision Board)

Re-architected from flat card pile → 4-layer quest pyramid:

- **Year Lens** (1 card) — comes from Foundation
- **Month Project** (1–2) — current quarter's goal
- **Week Quests** (2–4) — mini-objectives per week
- **Daily Levers** (2–3) — autopilot actions

Each card includes:
- Original fields (image, progress, sub-steps, feelings, visualization)
- **NEW**: `identityLink` — one sentence on how this serves your identity statement

**UI**: Level tabs + quota indicator (free tier: 1Y + 1M + 3W + ∞D)

#### A3. Identity-Linked Dashboard

Top hero: **your current Identity Statement** (not static i18n affirmations).

Affirmation carousel: auto-generated rotation from Foundation:
- "I am the type of person who…"
- "Today I refuse…"
- "What I'm building…"
- "This month…"
- "By [date]…"

Intention input prompt: *"What would the [identityStatement] version of you do today?"*

---

### Phase B: Closed-Loop & Protocols (Weeks 9–14)

#### B1. Reset Protocol (`/reset`)

The flagship feature: multi-step wizard guiding user through the 1-day framework.

**Part 1 / Morning (15–30 min)**: 14 excavation questions (hand-written, no AI, original answers preserved)

**Part 2 / Throughout Day**: Browser push notifications (configurable times: 11am, 1:30pm, 3:15pm, 5pm, 7:30pm, 9pm) + 6 + 3 supplementary questions; user logs brief responses to each.

**Part 3 / Evening**: 8 synthesis questions that funnel user's raw answers directly into Foundation fields (antiVision sentence / vision sentence / identity statement / yearly lens / monthly project / daily levers / constraints).

**Variants**:
- **Full Reset**: Yearly, complete all 3 parts (~1 day total)
- **Mini Reset**: Quarterly, Parts 1+3 distilled (7 questions, ~30 min)

**Data model**: `resetSessions/{sessionId}` collection; immutable record of all prompts + responses + completion time. Enables "time capsule" — comparing your answers year-over-year.

#### B2. Pattern Interrupts (`/interrupt`)

Daily push notifications (or in-app inbox if browser notifications denied) at scheduled times, showing one question + a 60-second response box.

Questions come from the original framework's 9 daytime interrupts:
- *"What am I avoiding right now?"*
- *"If someone filmed my last 2 hours, what would they conclude I actually want?"*
- *"Am I moving toward the life I want or the life I hate?"*
- (… 6 more)

**Responses saved to**: `interruptResponses/{userId}/{date}/{time}` — used during evening synthesis to surface blind spots.

**Lowered to**: If user denies notification permission, in-app inbox banner appears ("You have 1 unanswered interrupt question").

#### B3. Weekly Reflection (`/reflect/weekly`)

Every Sunday (user-configurable): 5-question reflection prompt:

1. *"How much this week did I move toward my Identity Statement?"* (1–5 scale)
2. *"Which anti-vision behaviors recurred?"*
3. *"What felt most like the future-me?"*
4. *"1-Month Project: ahead / on / behind / adjust?"*
5. *"Two daily levers I commit to next week?"*

Completion generates a shareable "weekly snapshot card" + feeds back into the control-loop (sense → compare → adjust).

**Data model**: `weeklyReflections/{uid}_{ISOWeek}`; enables trend analysis (D7/D30/D365 patterns).

---

### Phase C: Intelligence & Community (Ongoing)

#### C1. AI Assistance (Thinking, Not Doing)

AI features are **strictly read-only, question-generating**:

- **Probe**: After user writes an answer, AI asks a Socratic follow-up that exposes contradictions
  - Example: User wrote "I want XYZ but my actions this week pursued ABC" → AI mirrors this inconsistency
- **Mirror**: Synthesize 10 week's worth of answers into a third-person portrait of "what your behavior actually reveals you want"
- **Connect**: Compare this year's Reset answers to last year's; highlight what evolved vs. what stayed static

All AI uses Claude API with low temperature; **zero generation of user answers**.

#### C2. Optional Antagonist Role

Advanced users can enable "truth-teller mode": When user claims daily levers but hasn't completed them for 7 days, app surfaces a slightly sharp prompt:

> *"You've been saying you'd [daily lever] for 9 days, but you haven't. Your behavior says you actually want [opposite]. Ready to be honest?"*

Language borrowed from the original framework — designed to bypass rationalization.

#### C3. Stage of Mind Self-Assessment (Optional)

One-time + quarterly 9-stage self-evaluation (from the framework §IV: Impulsive → Unitive).

Adjusts UI language tone based on stage (early stages use concrete action language; later stages use abstract awareness language).

**Experimental feature** — low visibility, not in main nav.

#### C4. Public Identity Card (Community Seed)

Users can generate a shareable card (Twitter / Little Red Book / Threads) with:
- Their current Identity Statement
- Their current Yearly Lens
- Optional: one of their daily levers

Anonymized, de-identified — but creates **public commitment** signal + social proof for growth.

---

## Implementation Overview

### Tech Stack

- **Frontend**: React 18 + Zustand (state) + Tailwind + Vite
- **Backend**: Vercel Serverless (Node.js) for checkout + webhook APIs
- **Database**: Firebase Firestore + Auth
- **Payment**: Lemonsqueezy (annual $99.99 / year only)
- **AI**: Claude API (optional, gated to paid)

### Key Collections (Firestore)

```
users/{uid}
  ├─ subscription* (status, expiresAt, etc.)
  ├─ foundation (antiVision, vision, identity, yearLens, monthProject, constraints)
  └─ lemonsqueezy* (customerId, subscriptionId, etc.)

foundationHistory/{uid}_{date}
  └─ snapshot of Foundation at that moment (immutable, for history)

resetSessions/{sessionId}
  ├─ all 30 questions + user's answers
  ├─ completedAt timestamp
  └─ kind ('mini' | 'full')

interruptResponses/{uid}/{date}/{time}
  └─ user's 60-second response to that day's interrupt

weeklyReflections/{uid}_{ISOWeek}
  ├─ 5 reflection answers
  ├─ completedAt
  └─ snapshot of foundation at reflection time

visionBoard/{docId}
  ├─ title, content, image, progress, steps
  ├─ level ('year' | 'month' | 'week' | 'day')  [NEW]
  ├─ identityLink (optional, 1-sentence) [NEW]
  └─ (existing fields: category, priority, dueDate, etc.)
```

### Firestore Security

- All collections scoped to owner (`userId` field check)
- `subscriptionStatus` / billing fields protected: only Admin SDK can write (Lemonsqueezy webhook only)
- Foundation versioning: old versions immutable
- Reset sessions: immutable once created

### API Endpoints (Vercel Serverless)

```
POST /api/create-checkout
  ├─ Auth: Firebase ID token
  └─ Returns: Lemonsqueezy cart URL

POST /api/lemonsqueezy-webhook
  ├─ Auth: HMAC-SHA256 signature verify
  ├─ Ingests: subscription lifecycle events
  └─ Updates: users/{uid} billing fields
```

### i18n & Localization

- **Phase A**: EN + 中文 fully translated
- **Phase B+**: EN + 中文; other 7 legacy languages revert to old UI
- Reset / Foundation prompts kept as structured i18n keys (vs. embedded text)
- Community translations accepted post-launch

### Frontend-to-Backend Data Flow

```
User fills Foundation
  ↓ (auto-save on blur, debounced)
Cloud Function writes foundation/{uid}
  ↓
Zustand store listens via onSnapshot (live)
  ↓
Dashboard / all downstream features reactively re-render Identity Statement
```

No polling; all updates fire within 1–2 seconds.

---

## Monetization Model

### Philosophy: Single Tier, Annual Commitment

**Why not multi-tier?**
- Reduces decision paralysis (free users don't wonder if they're "missing" tier features mid-experience)
- Annual payment creates psychological "identity lock-in" (paying $99.99 = "I'm serious about identity work this year")
- Lemonsqueezy's annual churn is naturally lower than monthly (12-month calendar anchor = renewal prompt at year anniversary)
- Operational simplicity: one paywall, one feature gate, one support story

### Free Tier

- 1 Foundation active version (overwrites prev, no history)
- Dashboard Identity Statement + affirmation rotation
- Vision Board **limited**: 1Y + 1M + 3W + ∞D cards
- Daily check-in / mood / intention / gratitude: unlimited
- **Mini Reset**: 1 per quarter
- **Weekly Reflection**: last 4 weeks visible; older hidden

### Annual Tier ($99.99/year)

- ✅ Foundation **unlimited versions** + evolution timeline
- ✅ Vision Board **unlimited** cards (all levels)
- ✅ **Full Reset Protocol** (1–2 per year recommended)
- ✅ Pattern Interrupts: full 6 times + custom times + history
- ✅ Weekly Reflection: **all history** + year-over-year compare
- ✅ AI Probe / Mirror / Connect (limited to 200 calls/month)
- ✅ Public Identity Card sharing (de-identified)
- ✅ Year-end Recap PDF (auto-generated, shareable)

### Lemonsqueezy Integration

**Minimal config**: 1 product, recurring annual, auto-renew.

**Webhook flow**:
1. User clicks Upgrade → calls `/api/create-checkout` (authenticated with ID token)
2. API creates Lemonsqueezy checkout with `meta.custom_data.uid = user.uid`
3. User pays $99.99; LS webhook fires `subscription_created` event
4. Webhook handler verifies HMAC signature + updates `users/{uid}.subscriptionStatus = 'active'`
5. Zustand `useSubscription()` hook listens to `user` doc via onSnapshot
6. UI re-renders: sidebar badge changes, paid features unlock

**Grace period**: If payment fails, user keeps access until `subscriptionExpiresAt` date. Gentle downgrade, not immediate lockout.

### Pricing Rationale

- $99.99 = $8.33/month, positioned between a monthly yoga class ($12–15) and annual course ($500)
- Single trigger: "I'm serious about identity work *this year*" — matches annual Reset-day rhythm
- Lemonsqueezy handles tax/VAT/currency — no manual invoicing needed

---

## Deployment Guide

### Quick Links

**For detailed step-by-step instructions**, see [`DEPLOYMENT.md`](./DEPLOYMENT.md) in this repo.

### TL;DR Deployment Steps

1. **Lemonsqueezy**: Create API key + Store ID + Webhook signing secret
2. **Firebase**: Generate Service Account (for Serverless API)
3. **Vercel**: Push repo → set 14 environment variables (7 client `VITE_*` + 7 server)
4. **Firebase CLI**: Deploy Firestore rules + indexes
5. **Test**: Run the 5-item pre-launch checklist in DEPLOYMENT.md

**Estimated time**: 2–3 hours for first-time deploy; 15 min for updates after.

---

## Success Metrics & Hypotheses

### Key Hypotheses

1. **Free → Annual conversion**: 3–5% of free users will upgrade
   - Anchor: completing Foundation unlocks Reset awareness
   - Trigger: first Reset attempt shows "upgrade to full" prompt
2. **Engagement via identity**: Users who fill Foundation will have 2x+ D7/D30 retention vs. those who skip it
3. **Weekly reflection closes the loop**: Users who complete weekly reflection 4+ times/month show 40%+ better goal completion vs. control group
4. **Anti-vision drives faster than vision**: Reset sessions with vivid antiVision text show higher downstream follow-through than those with only positive vision

### Instrumentation

- **Amplitude**: Track Foundation completion rate, Reset attempt rate, weekly reflection completion, feature unlock events
- **Firestore**: Query `resetSessions`, `foundationHistory`, `weeklyReflections` to compute cohort stats
- **Lemonsqueezy**: Watch annual renewal rate, churn rate, payment decline trends
- **Qualitative**: Email 10% of annual tier users monthly with "What's your identity shift so far?" open-ended prompt

---

## Roadmap (Post-Launch)

### Q1–Q2: Stabilization

- Monitor churn / renewal
- Gather qualitative feedback on Reset Protocol completion
- Fix edge cases in live reset sessions

### Q3: Community Beta

- Enable public identity card sharing
- Monitor shares → new signup attribution
- Begin "testimonial" collection from paid users

### Q4: AI Expansion

- Roll out Probe / Mirror / Connect features
- Monitor token usage (200 calls/mo/user target)
- Build operator dashboard for support (see all users' resets, flag concerning patterns, etc.)

### Year 2: Platform

- Optional: cohort / accountability groups (pay users matching on year-lens)
- Optional: "Stage of Mind" coaching add-on (not included in annual)
- Internationalization for top 3 non-EN markets

---

## Authors & Attribution

**Product Philosophy**: Adapted from *"How to fix your entire life in 1 day"* framework.

**Implementation**: Built with care over 8 weeks (Aug–Sep 2026) by ManifestHub team.

**Tech**: React + Zustand + Firebase + Lemonsqueezy + Claude API.

---

## License

[Choose: MIT / Apache 2.0 / Proprietary]

---

## Contact & Support

- **Email**: support@manifest-hub.com
- **Issues**: GitHub issues (for public feature requests)
- **Reset Protocol feedback**: Email us a copy of your evening synthesis — it helps us refine questions

