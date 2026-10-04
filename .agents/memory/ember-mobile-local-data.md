---
name: Ember mobile local data
description: Product decisions for the iPhone app's offline storage and currency conversion.
---

**Rule:** Ember's iPhone app stores subscriptions and its manual USD/MXN rate on-device with Expo SQLite. It starts with an empty local database, has no account or automatic sync, and does not import website/API records. Leave the separate web app, API, and existing server records unchanged.

**Why:** The user explicitly requested local-only mobile data without third-party services and chose a fresh local database; remote records must remain untouched.

**How to apply:** Do not add login, cloud sync, or automatic data migration to the iPhone app without explicit direction. Keep exchange-rate conversion manual and offline. Room is Android-specific; use an iOS-compatible local database for this Expo app.