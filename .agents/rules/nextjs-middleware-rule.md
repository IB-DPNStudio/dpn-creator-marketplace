---
description: Critical structural rules for Next.js App Router and Supabase Middleware
---

# Next.js Middleware Requirements

**CRITICAL LESSON LEARNED FROM PAST FAILURE:**
In a Next.js App Router project, it is NOT enough to write middleware logic inside utility files (e.g., `src/utils/supabase/middleware.ts`). 

Next.js will **silently ignore** this code unless it is explicitly imported and exported from a central router file located exactly at:
- `src/middleware.ts` (if using a src directory)
- `middleware.ts` (if at the project root)

When building or modifying interceptors, MFA checks, or auth routing, you MUST verify that `src/middleware.ts` exists and is correctly configured with a `matcher` array, otherwise the interception logic will fail in production without throwing any build errors.
