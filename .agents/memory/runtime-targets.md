---
name: Runtime targets
description: Deployment and development environments that constrain future setup decisions.
---

The project must work in Vercel and Google AI Studio before any Replit-specific setup or deployment work.

**Why:** The user explicitly established these environments as the project’s required baseline.

**How to apply:** Preserve the existing React/Vite structure and prefer configuration compatible with Vercel and Google AI Studio; treat Replit workflow configuration as optional follow-up work, not the default runtime target.