# Google Play listing and declarations package

## Listing copy

**App name:** Privyetik: Learn Russian

**Short description:** Master Russian vocabulary, grammar and Cyrillic with smart daily practice.

**Full description:**

> Build a Russian-learning habit with short, focused practice.
>
> Privyetik combines vocabulary study, Cyrillic reference, grammar practice, pronunciation, and progress tracking in one learning workspace. Review words with spaced repetition, practise recall through flashcards, multiple choice and writing, and follow your progress through XP, streaks and detailed statistics.
>
> Key features:
> • Russian vocabulary decks with custom words and decks
> • Smart due-card reviews and adjustable daily study limits
> • Cyrillic alphabet reference and spoken pronunciation
> • Placement assessment and grammar practice
> • Optional AI assistance for word and grammar explanations
> • Offline-friendly local study with optional account-based cloud sync
> • Optional daily study reminders
> • Share Russian text into Privyetik to continue learning
> • Export/import tools, privacy controls and self-service account deletion
>
> Some cloud, AI, translation, sync and notification features require an internet connection. An account is optional for core local study and required for cloud-backed features.

## Graphic assets

- Store icon: `store_icon.png` (512×512).
- Feature graphic: `play_store_feature_graphic-v2.png` (1024×500, no alpha).
- Recommended phone screenshot order: dashboard, vocabulary dictionary, study mode, grammar practice, alphabet, statistics.
- Use tablet screenshots only when captured from genuine tablet layouts. Avoid device frames, rankings, awards, prices, or claims not visible in the app.
- Check generated screenshots for real text encoding, no email addresses, no debug UI, current branding, and current version.

Official asset guidance: [Add preview assets](https://support.google.com/googleplay/android-developer/answer/9866151).

## App access for review

Core local learning is available without an account. AI grammar, cloud sync, feedback, and some reminder diagnostics require sign-in. In Play Console App access:

1. State that parts are restricted by authentication.
2. Add concise navigation instructions: open Cloud Account, sign in, then open Grammar or Sync.
3. Supply a dedicated reviewer account with verified email and stable test data, or document Google sign-in if no additional verification is required.
4. Keep credentials only in Play Console; never place them in this repository.

## Data Safety inventory to reconcile in Play Console

This is an implementation inventory, not a legal determination. Confirm each item against the deployed services, Google’s definitions, retention, and contracts.

| Data / source | Purpose | Handling evidence |
| --- | --- | --- |
| Email, auth user ID | Account management and sync | Supabase Auth and user-owned tables |
| Custom vocabulary, study progress, grammar activity | App functionality, personalization, sync | Supabase tables and local storage |
| Feedback text | Support and app improvement | `voc_feedback` |
| AI prompts/context and action logs | App functionality, abuse prevention | Gemini requests and `voc_ai_request_logs` |
| IP address | Security and rate limiting | AI function request logs |
| Push endpoint/keys, timezone, reminder settings/history | Notifications and diagnostics | push/reminder tables |
| App interactions, device/browser identifiers, approximate location inferred by provider | Analytics | Google Analytics loaded by the web app |
| Text sent for translation | App functionality | Google Translate request path |

Verify encryption-in-transit, deletion behavior, whether data is optional, collection versus sharing classifications, and analytics/AI provider treatment. The Privacy Policy and Data Safety answers must match.

## Account deletion

- In-app path: Cloud Account → Danger Zone → Delete My Account.
- Web resource after deployment: `https://itayura.github.io/VocRussian/delete-account.html`.
- Enter that HTTPS URL in the Data safety account-deletion field only after it loads publicly and end-to-end deletion has been verified.
- Google requires both an in-app deletion path and an outside-the-app web resource when the app offers account creation. See [Google’s account-deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111).

## Closed-track release notes

> Production-readiness beta: adds self-service account deletion, clearer privacy and build information, more reliable reminders, safer release checks, and updated Play Store artwork. Please follow the 14-day test tasks and report the app version, device and Android version with each issue.
