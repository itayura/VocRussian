# Daily learning journey

The dashboard now connects practice, useful feedback, and returning to learn. These features share the existing SRS vocabulary, review evidence, and daily XP goal.

## Learner experience

1. **Today's mission:** up to eight words from the active deck, combining overdue familiar words, the latest missed words, and new vocabulary. The preview shows the mix and an approximate duration. Hidden words are excluded. Completing the mission marks that day's mission for that deck complete.
2. **Daily goal:** the dashboard and session recap show today's earned XP against the SRS goal. Reaching the goal produces a clear completed state; it does not require another session.
3. **Focused retries:** the recap names missed words and offers a session containing only those words. Revealing an answer does not count as recovery. A subsequent successful review supplies the evidence. Non-due retries retain the existing zero-XP rule.
4. **Real-life challenges:** introductions, café orders, and train travel. Each has three phrase cards with normal/slow speech, two recognition checks, and a writing check. Wrong answers require another attempt. Writing supports a hint and a Russian keyboard. Each challenge awards 20 XP on its first completion only.
5. **Resume:** vocabulary sessions save deck, mode, direction, ordered word IDs, scored answers, and purpose on the device. Pause returns to the dashboard. Reload offers continuation at the next unanswered word, or the finished recap. Challenge steps also resume. Starting a replacement session asks before replacing the paused one.
6. **Weekly recap:** the last seven local calendar days of saved evidence show different words practiced, words recalled after at least two days, and successful recalls following mistakes. Example words and practiced skills make these counts concrete.

## Implementation and persistence

- `js/learning_journey.js`: deterministic mission selection, review-evidence summaries, answer normalization, checkpoint validation.
- `js/journey_ui.js`: dashboard cards, recaps, challenge interactions and progress display.
- `js/challenges.js`: offline phrase and exercise content with stable scenario IDs.
- `js/app.js`: integration with every vocabulary mode and session checkpoints.
- `js/srs.js`: review identifiers, mode and earned-XP evidence. Replaying the same session review does not score it twice.

Vocabulary checkpoints use `voc_russian_session_v1`; challenge checkpoints use `voc_russian_challenge_session_v1`. They are local to the device. Mission and challenge completions use existing SRS settings, which are included in the existing statistics persistence and backups. Resetting learning progress removes both checkpoint keys.

Review history is bounded by the existing 100-event-per-word retention. Recaps describe that saved evidence, not a complete lifetime history or a proficiency assessment. Challenge audio uses the device's speech synthesis; offline playback depends on an installed Russian voice. All phrase text and exercises remain available offline after the app has been cached.

## Verification

Validated locally on 2026-09-09: the full desktop/mobile suite passed 140 tests; the final repeated-challenge recap checks passed all 6 focused browser cases; all 32 logic tests and release preflight passed. `git diff --check` was clean.

- Logic tests cover mixed mission selection, hidden cards, later recall evidence, future/stale event exclusion, invalid checkpoints, answer normalization, content structure, and duplicate scoring.
- Browser tests cover the complete mission/retry loop, daily goal completion, next-card reload recovery, checkpoint reconciliation, all five vocabulary modes, all three offline challenges, one-time rewards, and paused challenges.
- Mobile visual checks cover the dashboard, challenge phrases, Russian keyboard, completion recap, and weekly examples.
- A separate browser check verifies service-worker-controlled offline reload and challenge use after reopening the app.
