---
name: Ember API migration compatibility
description: Reason for preserving Ember's existing frontend request behavior during API integration changes
---

For Ember, retain the existing client request flow unless a replacement preserves its session-cookie handling and error-message behavior end to end.

**Why:** During the multi-artifact port, the existing client was kept intact despite adding a generated API contract. Replacing its requests with hooks during a structural migration would have risked changing authentication and mutation behavior without adding user-visible value.

**How to apply:** When later changing Ember's API callers, verify credentials, response envelopes, error text, refresh after mutations, and logout together rather than assuming generated hooks are a drop-in replacement. The Expo web preview calls the API from a separate `expo.spock.replit.dev` origin, so credentialed requests require an explicit CORS allowlist rather than `*`.