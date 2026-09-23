---
name: Replit preview port
description: Port and bind-address requirement for the project's web preview workflow.
---

Web preview workflows must bind the application to port 5000 and `0.0.0.0`; binding only the imported scaffold's default port causes the workflow to report that no port opened.

**Why:** The imported project originally defaulted to port 8443, while Replit webview workflows wait for port 5000.

**How to apply:** Keep the server's fallback port at 5000 and preserve the workflow's `waitForPort: 5000` configuration.