---
trigger: always_on
---

- Never do large refactors unless explicitly requested.
- Keep changes minimal and incremental.
- Prefer additive changes over rewriting.
- Use clear modular architecture.
- New features must be implemented in isolated modules/folders.
- Avoid placing feature logic in random existing files.
- Avoid deep imports; expose modules through index exports.
- No circular dependencies.
- Type safety first: prefer strict typing.
- No "any" unless unavoidable (must comment why).
- No duplicate logic; reuse shared utilities.
- Follow linting/formatting; ensure build passes.
- Never store secrets in repo, code, logs, or UI.
- No sensitive logging (tokens, credentials, financial data, personal data).
- Validate and sanitize all user inputs.
- Use parameterized queries only (prevent injection).
- Use least privilege access patterns.
- Protect against XSS: no unsafe HTML injection.
- Use secure defaults in authentication/session handling.
- Never delete user data without explicit requirement.
- Prefer soft delete where applicable.
- Ensure migrations are safe and reversible when possible.
- Do NOT clutter UI.
- Keep primary actions clear.
- Mobile-first design.
- Prefer minimal UI changes unless redesign is requested.
- Avoid unnecessary re-renders.
- Avoid expensive computations inside UI render; move to services/hooks.
- Cache heavy queries when appropriate.
- When adding a new module/feature, update a short README comment in code or a small doc note if required.
- Provide a summary of files added/modified after implementation.

NON-NEGOTIABLE:

- If any rule conflicts with convenience, the rule wins.
