# Google Play closed-test rerun

This runbook starts from the real current state: Privyetik is already published on a closed track and the first production-access application was rejected. Keep the existing closed track and publish the stronger release candidate to it. Do not create a second track unless Play Console specifically requires one.

Google currently requires eligible new personal accounts to have at least 12 testers continuously opted in for the preceding 14 days when applying. Recruit 15–18 relevant testers as a buffer and record real participation; enrollment alone is not useful evidence. See [Google's testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).

## Before the new evidence period

1. Resolve every blocker in `docs/release-readiness-audit.md` and deploy the deletion function, database migrations, and web app.
2. In Play Console, upload the new AAB to the existing closed track. Record its version name/code and wait until the release status is **Available to testers**.
3. Verify the Play opt-in URL from a tester account, install from Google Play, and confirm the displayed app version.
4. Retain the rejection email and exact Play Console questions privately. Do not store tester names, email addresses, reviewer credentials, or screenshots containing personal data in Git.
5. Create a private evidence log from `docs/closed-test-evidence.md` and a private feedback form from `docs/beta-feedback-form.md`.
6. Run `npm run test:preflight` and `npm test`. Retain the CI run URL and signed AAB identity.
7. Start Day 1 only after the replacement release is available and at least 15 testers have opted in. Use Jerusalem time consistently in the log.

## Tester invitation

> I’m testing Privyetik, a Russian-learning app, before resubmitting it for Google Play production access. Join with this Google account, install from the Play opt-in page, remain opted in for the full test, and spend 5–10 minutes on each assigned task. Report confusing steps, defects, and suggestions through the private form, including your device model, Android version, Privyetik version, and a safe screenshot when useful. Please tell me before opting out or uninstalling.

## Fourteen-day task schedule

| Day | Required task | Feedback prompt |
| --- | --- | --- |
| 1 | Opt in, install, launch, and complete onboarding. | Could you install and start without help? |
| 2 | Create/sign in to an account and take the placement test. | Were account and level-result steps clear? |
| 3 | Complete a vocabulary review and rate cards. | Did controls and results behave as expected? |
| 4 | Add/edit a word, restart, and confirm it remains. | Was persistence reliable and understandable? |
| 5 | Use an AI grammar or word feature. | Was the result useful and were errors actionable? |
| 6 | Enable a reminder and run the notification diagnostic. | Did permission and reminder setup make sense? |
| 7 | Complete a normal session and submit mid-test feedback. | What is the single most important improvement? |
| 8 | Use the app offline or on a weak network, then reconnect. | Was work retained and did recovery succeed? |
| 9 | Sign in on another browser/device if available and verify sync. | Were progress, streak, and words consistent? |
| 10 | Share a Russian word/phrase into Privyetik. | Did the shared text arrive correctly? |
| 11 | Exercise the dictionary, alphabet, grammar, and stats views. | What felt slow, confusing, or unreliable? |
| 12 | Find Privacy Policy, build version, and account deletion controls. Do not delete the primary test account. | Were trust and account controls discoverable? |
| 13 | Retest an issue fixed during the period or repeat a full session. | Is the fix verified on your device? |
| 14 | Launch, study, review, restart, then submit final feedback. | Would you use it again, and what remains? |

Use a separate disposable account to test end-to-end deletion on at least one physical Android device and one web browser. Confirm the account can no longer sign in and its user-owned rows are gone.

## Daily operator routine

- Capture the Play Console opted-in count and anonymized completion total.
- Send one task and one reminder; mark complete only after a response or form submission.
- Triage reports as blocker, major, minor, or suggestion and acknowledge within one day.
- Fix blockers/major issues in closed testing, record the new version, and obtain tester verification.
- Check crash/ANR dashboards, Supabase errors, reminder delivery diagnostics, and CI status.
- If the continuously opted-in count drops below 12, do not apply until 12 qualifying testers again satisfy the full preceding 14-day window.

## Day 15 decision gate

Apply only when Play Console shows the eligibility control, at least 12 testers have remained continuously opted in for the last 14 days, the evidence log contains genuine feature usage and feedback, and no blocker/major issue remains. Use the response draft in `docs/production-access-reapplication.md`, replacing every placeholder with true counts and examples.
