---
name: Expo workspace quirks
description: Environment-specific constraints discovered while building Ember's Expo mobile artifact.
---

The Expo mobile artifact must use a non-root preview path when the web artifact already owns `/`; `/mobile` avoids a service-path conflict. In this workspace template, Expo Doctor rejects the usual `expo.splash` field in `app.json`, so the app's branded splash experience is implemented in the React screen while the icon remains configured.

**Why:** The artifact registration and Expo config schema are stricter than a standalone Expo project; following standalone defaults creates either a path conflict or a Doctor failure.

**How to apply:** Check existing artifact preview paths before creating a mobile artifact, and run Expo Doctor after changing `app.json`. A missing `libglib-2.0.so.0` warning from optional React Native DevTools does not prevent Metro or Expo Go from running.