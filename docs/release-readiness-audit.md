# Release-readiness audit

Repository inspection can establish implementation and automated behavior; it cannot prove Play Console declarations, tester engagement, a production Supabase deployment, or physical-device behavior. Treat every **manual** item below as a release blocker until evidence is recorded.

| Area | Repository status | Required manual evidence |
| --- | --- | --- |
| Android/TWA identity | Package, host, start URL, signing fingerprints, version name/code, target SDK, and asset links are checked by release preflight. | Install the current Play closed-track AAB and confirm trusted-web-activity behavior and displayed version. |
| Authentication | Email/password and Google sign-in exist; restricted cloud/AI flows check authenticated state. | Test signup verification, login, Google redirect, logout, expired session, and reviewer account. |
| Account deletion | Authenticated Edge Function, exact-email confirmation, in-app path, public page, cascade audit, and explicit feedback deletion are implemented. | Deploy function; add OAuth redirect URL; test disposable email and Google accounts; verify auth user and owned rows are gone. |
| Local persistence/offline | Service worker and local SRS storage support offline study; cache version is bumped. | Install, go offline, study/restart, reconnect, and prove no lost or duplicated progress. |
| Cloud sync | Bidirectional word/progress/stats/grammar sync and retry handling exist. | Exercise conflicting updates on two devices and validate winner/merge behavior. |
| AI and translation | Functions authenticate, rate-limit and log requests; UI exposes errors. | Test success, quota/rate limit, provider outage, unsafe/empty input, and privacy disclosure. |
| Notifications | Push registration, timezone/preferences, diagnostics, server cron, delivery logs, and follow-up function migration exist. | Push migrations/functions; verify Vault/config; test notification at scheduled local time and failed-delivery diagnostics on two Android versions. |
| Android sharing | TWA share target and app handling are configured. | Share Cyrillic text from at least two source apps and verify import after cold and warm launch. |
| Privacy/Data Safety | Policy lists account, study, feedback, analytics, AI/IP, translation, and reminder processing. | Reconcile every Play Data Safety answer with deployed SDKs/providers and verify public URLs. |
| Store listing | Copy, reviewer instructions, screenshot plan, 512 icon, and valid 1024×500 feature graphic exist. | Upload assets, inspect Play previews on phone/tablet, complete content rating/target audience/ads declarations. |
| Release automation | Tests gate builds; Play upload requires manual dispatch, explicit track, and the `google-play` environment. | Configure required reviewers and secrets; prove a normal push cannot publish to Play; perform one guarded internal/closed upload. |
| Observability | Feedback, AI request, reminder and push delivery records exist; Play vitals/pre-launch report are external. | Record daily crash/ANR, pre-launch, Supabase error, and push-health reviews during the test. |
| Closed-test evidence | Fourteen-day tasks, private form, roster and reapplication templates exist. | Complete real 14-day evidence with at least 12 continuously opted-in testers and truthful responses. |

## Stop-ship conditions

- Any qualifying tester count or continuity uncertainty.
- Crash, data loss, broken auth, broken account deletion, exposed secret, or unresolved major tester issue.
- Data Safety/privacy answers that do not match implementation.
- Public privacy/deletion URL unavailable.
- Closed release or reviewer credentials cannot be accessed.
- Release versions differ across package, TWA, Gradle, Play, or visible build information.
