# Privyetik product and engineering roadmap

Updated: 2026-08-11

## Product direction

Privyetik should become the most dependable daily Russian practice tool for beginner and intermediate independent learners. The next releases should improve the learning loop and prove retention before adding social, marketplace, or monetization surface area.

The roadmap assumes the current web/PWA and Android TWA remain the shared product, guest study remains useful offline, and accounts continue to unlock cloud sync, AI, and reliable cross-device reminders.

## Current baseline

The product already has a broad foundation:

- three vocabulary practice modes: flashcards, multiple choice, and Cyrillic writing;
- fixed-interval Leitner review, due queues, session limits, reverse study, favorites, XP, streaks, achievements, and learner statistics;
- a 120-word curated deck, a 3,376-word expanded deck, custom decks, import/export, and link sharing;
- a 60-question adaptive placement assessment spanning A1-C2;
- 14 grammar topics, AI lessons, generated quizzes, a writing sandbox, and word-inflection help;
- alphabet reference and recognition/writing games;
- offline caching, guest use, email/Google authentication, cloud sync, backup/restore, and account deletion;
- daily push reminders, delivery diagnostics, Android text sharing, release automation, and a detailed closed-test evidence process.

Important constraints discovered in the current implementation:

- The expanded deck has no explicit `level` field. CEFR is inferred from the category prefix, and 3,376 words are spread across 678 raw category labels. The standard deck contains only A1-B1 content.
- Placement questions have a CEFR band but no skill/domain metadata, so the result cannot explain whether vocabulary, grammar, or comprehension caused the estimate.
- Scheduling uses fixed 1/2/4/7/14-day Leitner intervals. Review events are embedded in per-card JSON and capped at 100; the global activity log is capped at 500.
- Core grammar content and quiz variation depend heavily on AI. Only cached material remains available when the provider is unavailable.
- Pronunciation currently means text-to-speech playback; there is no learner recording, comparison, or speech assessment.
- Google Analytics captures virtual page views, but the repository does not define activation, session-completion, recall, sync-recovery, or AI reliability events.
- Feature work is concentrated in `index.html` (2,404 lines), `js/app.js` (5,913 lines), and `js/grammar.js` (1,905 lines), increasing regression risk as new learning modes are added.

## Roadmap overview

| Phase | Timing | Outcome |
| --- | --- | --- |
| 0. Trustworthy launch | Now-2 weeks | Finish closed-beta evidence and make product/reliability outcomes measurable. |
| 1. Strong daily learning loop | Weeks 2-6 | Give each learner a clear, adaptive plan and a curated A1 path. |
| 2. Broader language skills | Weeks 6-12 | Add dependable grammar, listening, dictation, and pronunciation practice. |
| 3. Sustainable scale | Months 3-6 | Make content, sync, observability, accessibility, and code structure scale safely. |
| 4. Validated growth | Month 6+ | Add community, shared content, new platforms, or monetization only after retention is proven. |

Timing is directional and assumes a small team. Each phase is gated by its exit criteria, not by its calendar date.

## Phase 0 - Trustworthy launch

### 0.1 Complete the existing release gate (P0)

Finish every manual item in [the release-readiness audit](release-readiness-audit.md): deploy the current migrations/functions, verify account deletion, perform two-device sync conflict tests, exercise offline recovery, test reminders on physical Android devices, reconcile Data Safety declarations, complete the Play pre-launch report, and record the real 14-day closed-test evidence.

Exit criteria:

- no unresolved crash, data-loss, authentication, deletion, privacy, or secret-exposure blocker;
- current Play build, web build identity, repository commit, and evidence record agree;
- at least one verified cold-start and warm-start share flow, offline/reconnect flow, and cross-device conflict flow;
- Android vitals and push-delivery health have an assigned review cadence.

### 0.2 Define privacy-safe product telemetry (P0)

Keep page views, then add a small documented event taxonomy. Measure events such as onboarding completed/skipped, first session started/completed, due session completed, answer result, grammar quiz completed, reminder opt-in, sync failed/recovered, AI request failed/succeeded, and account deletion started/completed. Do not send words, sentences, free-form answers, email addresses, deck names, or other learner content as analytics parameters.

Build four funnels/dashboards:

1. first visit -> first completed learning session;
2. due queue shown -> due session completed;
3. placement started -> result applied -> first recommended session;
4. sync/reminder/AI failure -> recovery.

Exit criteria:

- event names, allowed properties, retention, and consent behavior are documented;
- the same action is not double-counted by page navigation or retry logic;
- beta data can answer where activation fails and which learning modes are repeatedly used.

### 0.3 Add quality baselines (P0)

- Add automated accessibility checks for the landing page, navigation, study modes, grammar quiz, settings, and all modals.
- Record mobile startup, largest-contentful render, static asset size, offline startup, and large-deck filtering performance.
- Add a release smoke test for denied notification permission, expired auth, AI timeout/invalid response, interrupted sync, and corrupt local backup.
- Turn push monitoring into a broader weekly operational checklist covering Android vitals, client errors, Edge Function failures, AI error/rate-limit rates, sync recovery, and account deletion failures.

## Phase 1 - Strong daily learning loop

### 1.1 Build a unified Today plan (P0)

Replace the dashboard's collection of entry points with one recommended plan composed from:

- due vocabulary;
- a configurable number of new words;
- weak or stale vocabulary from recent mistakes;
- one weak grammar topic or alphabet refresher when relevant.

Show estimated duration, allow learners to edit the mix, save progress after every answer, and resume an interrupted session. Preserve direct access to all existing modes for learners who want manual control.

Exit criteria:

- a new guest can start useful practice in one action;
- a returning learner can see why each task was recommended;
- closing/reloading during a session resumes without duplicate XP or review events;
- due backlog, new-word pacing, and next-seven-day review forecast are visible.

### 1.2 Add a mistake notebook and remediation loop (P1)

Create a filtered view of recently missed vocabulary, writing errors, and grammar topics. Store the error type without retaining unnecessary free-form learner text. Offer a short corrective session and mark an item recovered only after later successful evidence, not immediately after revealing the answer.

Exit criteria:

- learners can answer "what am I getting wrong?" from one screen;
- every mistake links to a focused retry or explanation;
- recovery is based on a later attempt and survives sync.

### 1.3 Create a curated A1 curriculum (P0)

Normalize content metadata into explicit fields such as CEFR level, canonical topic, part of speech, frequency rank, source/license, content version, and review status. Build a human-reviewed A1 path of roughly 8-10 practical units and at least 300 core words, reusing the best existing content. Add schema validation for accents, transliteration, examples, translations, duplicate senses, and stable IDs.

Treat the expanded deck as an explorer/reference source until its 678 category labels are mapped into a smaller canonical taxonomy. Do not present raw size as equivalent to a designed course.

Exit criteria:

- all curriculum items have explicit CEFR and canonical topic metadata;
- the content validator runs in CI;
- each A1 unit has vocabulary, recognition, production, listening-ready prompts, and a unit review;
- corrections can be versioned without resetting learner progress.

### 1.4 Improve placement and recommendations (P1)

Tag every placement item by skill and topic, report confidence and band-level evidence, and return a useful profile rather than only one CEFR label. Use the result to recommend a starting curriculum unit without promoting unseen cards as mastered.

Validate question difficulty and ambiguity with beta evidence before claiming precise C1/C2 placement.

## Phase 2 - Broader language skills

### 2.1 Make core grammar deterministic and offline-capable (P0)

Author reviewed A1/A2 explanations, examples, and question banks for the highest-value topics: noun cases, present/past/future verb forms, aspect basics, adjective agreement, and verbs of motion. Use AI for optional explanation variants, extra examples, and feedback—not as the only source of truth or the only path to a quiz.

Exit criteria:

- the core A1 grammar path works offline and during an AI outage;
- generated questions pass the existing structural validator plus topic-specific answer validation;
- ambiguous or reported questions can be retired by content version.

### 2.2 Add listening and dictation modes (P1)

Start with audio-to-choice and audio-to-Cyrillic dictation using existing vocabulary and example sentences. Prefer reviewed human recordings for the core curriculum; keep device TTS as a fallback and label it clearly. Add replay, slow playback, transcript reveal, and mistake-specific feedback.

Exit criteria:

- listening is included in unit review and the Today plan;
- every core item declares recording, approved TTS, or no-audio status;
- the mode works with screen readers and does not rely on audio alone for navigation.

### 2.3 Add pronunciation practice as an opt-in beta (P2)

Let learners record a word or short sentence, replay it locally, and receive limited feedback on recognized text, stress, or target sounds. Request microphone permission only when this feature starts. Do not upload or retain audio by default; clearly disclose any external speech-processing provider and provide a non-recording fallback.

Treat scores as coaching signals, not authoritative pronunciation grades.

### 2.4 Add scenario-based mini lessons (P1)

Create short goal-oriented sequences such as introductions, ordering food, transport, shopping, and daily routines. Reuse curriculum vocabulary and grammar, then finish each scenario with recognition, writing, and listening checks. Avoid a separate content silo that does not feed SRS or mastery.

## Phase 3 - Sustainable scale

### 3.1 Versioned content delivery and editorial workflow (P1)

Move curriculum metadata and reviewed content out of giant bundled JavaScript arrays into versioned content packs or a server-managed catalog with offline manifests. Add draft/review/publish states, automated validation, rollback, and learner-progress compatibility. Keep a bundled starter pack so first launch and offline guest study still work.

### 3.2 Normalize learning events and sync (P1)

Move long-lived review and activity evidence from capped JSON arrays to append-only, idempotent event rows. Keep compact projections for fast dashboard reads. Define conflict rules for edits, deletions, placement, review events, settings, and content-version changes; add two-device integration tests for each rule.

Any new Supabase Data API table must have explicit role grants where required, RLS, ownership checks in both `USING` and `WITH CHECK`, bounded retention, export behavior, and account-deletion coverage. Supabase's current changelog notes that new tables are no longer automatically exposed to the Data API, so migrations must not rely on historical defaults.

### 3.3 Refactor by feature boundary (P1)

Avoid a framework rewrite. Extract one tested vertical slice at a time from the monolith into modules for navigation, sessions, dictionary/decks, settings/reminders, analytics, and UI primitives. Separate state/domain logic from DOM rendering, add typed data contracts, and make content validation independent of the browser.

Exit criteria:

- new learning modes do not add more global functions to `app.js`;
- core scheduling, content validation, sync merge, and recommendation logic run as fast unit tests;
- CI covers desktop/mobile layout, keyboard navigation, offline behavior, and the main Android/TWA lifecycle.

### 3.4 Complete localization and accessibility (P1)

The current native-language setting changes translations and AI output, not the full interface. Extract user-facing strings, ship English and Hebrew UI first, support RTL deliberately, and then add Spanish/French UI based on demand. Target WCAG 2.2 AA for contrast, focus, names/roles, text scaling, reduced motion, error announcements, and keyboard/switch access.

### 3.5 Expand curriculum based on evidence (P2)

Extend the reviewed path to A2 and then B1 only after A1 completion, mistake, and retention data identify what learners need. Keep advanced expanded-deck search available, but avoid claiming a complete C1/C2 course until content and assessment are calibrated.

## Phase 4 - Validated growth

Only start these after the daily learning loop shows repeat use and phases 0-2 are reliable:

- a moderated public deck library with versioning, reporting, provenance, and safe update/merge behavior;
- private friend or study-group accountability challenges before public leaderboards;
- teacher-created assignments and progress summaries, with a separate consent and privacy design;
- iOS packaging or a deeper native Android shell if device demand and TWA limitations justify the maintenance cost;
- paid plans only after AI/content costs and retained-user value are measured. Core offline study, export, and deletion should remain dependable regardless of plan.

## Prioritized backlog

| Rank | Initiative | Priority | Effort | Why now |
| ---: | --- | --- | --- | --- |
| 1 | Close beta/release evidence | P0 | M | Production access and trust are prerequisites for every growth feature. |
| 2 | Learning and reliability telemetry | P0 | M | The project currently cannot measure activation, retention, or recovery well enough to prioritize empirically. |
| 3 | Unified Today plan and session resume | P0 | M | Reduces choice overload and strengthens the core daily habit. |
| 4 | Canonical content schema and curated A1 path | P0 | L | Fixes the gap between a large word list and a teachable course. |
| 5 | Mistake notebook/remediation | P1 | M | Converts existing answer history into immediately useful personalization. |
| 6 | Deterministic A1/A2 grammar | P1 | L | Improves correctness, offline value, cost control, and resilience. |
| 7 | Listening and dictation | P1 | M | Covers a major language skill using existing content and audio infrastructure. |
| 8 | Placement skill profile | P1 | M | Makes recommendations explainable and assessment claims more credible. |
| 9 | Modularization and automated accessibility | P1 | L | Keeps the growing product safe to change. |
| 10 | Normalized event sync/content delivery | P1 | L | Needed before histories and content versions outgrow capped JSON/local bundles. |
| 11 | Pronunciation beta | P2 | L | High learner value but higher privacy, UX, and platform risk. |
| 12 | Community, marketplace, or payments | P3 | L | Valuable only after retention, moderation, and support capacity are proven. |

## Success metrics and decision gates

Use cohorts, not total downloads, and compare guest and signed-in paths without creating cross-device identity for guests.

- **Activation:** first learning session completed, time to first answer, placement-to-practice conversion.
- **Engagement:** learning days per week, D1/D7/D30 return, due-session completion, interrupted-session resume.
- **Learning:** recall on due mature cards, writing accuracy, mistake recovery, grammar accuracy by topic/level, listening accuracy, assessment movement over time.
- **Reliability:** crash/ANR, offline startup, sync failure and recovery, duplicate/lost event rate, push success, AI error/rate-limit/latency, deletion success.
- **Content quality:** reported ambiguity, missing metadata, failed validation, correction frequency, and unit completion/drop-off.
- **Cost:** AI requests and spend per active/retained learner, push delivery volume, and support time per release.

Decision gates:

- Do not expand launch scope while the release audit has a manual blocker.
- Do not replace the scheduling algorithm until review telemetry can compare the change against a baseline; improve pacing and recommendations first.
- Do not make AI mandatory for the core learning path.
- Do not ship microphone use without just-in-time permission, clear processing/retention disclosure, deletion behavior, and a fallback.
- Do not build public social/content features before moderation, reporting, and abuse handling are designed.
- Do not add monetization before retained-user value and AI cost are measurable.

## Recommended next sprint

1. Complete and record the remaining manual release-readiness evidence.
2. Write the analytics event contract and instrument the four phase-0 funnels without learner content.
3. Add a content-schema validator and a report that maps the 678 expanded categories into canonical CEFR/topic candidates.
4. Prototype the Today plan from existing due, weakness, placement, and grammar data; keep it local-only first.
5. Add automated accessibility smoke tests and a denied-permission/offline/expired-session regression matrix.

## External guardrails

- [Android core app quality guidelines](https://developer.android.com/docs/quality-guidelines/archive/core/core-app-quality-2026-03-20) emphasize complete user-flow, interruption, performance, permissions, privacy, and current-platform testing.
- [Android vitals](https://developer.android.com/topic/performance/vitals/index.html) should be reviewed continuously because user-perceived crash and ANR rates can affect Play visibility.
- [Supabase breaking-change changelog](https://supabase.com/changelog?types=breaking-change) should be checked before backend work, especially the current Data API exposure changes.
- [Service worker lifecycle guidance](https://web.dev/articles/service-worker-lifecycle) remains relevant to safe offline updates and cache-version changes.
