# Security and Privacy

## Security objectives

Protect student, staff, academic, financial, and communication data. Apply least privilege, tenant isolation, secure defaults, and auditable workflows.

## Authentication

- Hash passwords with a modern password-hashing algorithm such as Argon2id or bcrypt using a suitable work factor.
- Use short-lived access credentials and rotate refresh tokens.
- Store refresh-session records so sessions can be revoked.
- Implement rate limiting, login attempt controls, and secure password-reset flows.
- Prefer secure, HttpOnly, SameSite cookies for browser sessions where compatible with the chosen architecture.
- Protect cookie-authenticated state-changing requests against CSRF.
- Never log passwords, raw tokens, API keys, or reset links.

## Authorization

- Enforce role and permission checks on the server.
- Apply resource-level checks to every student, teacher, section, document, complaint, and message access.
- Resolve tenant scope from trusted authentication/session context.
- Test IDOR/BOLA cases by substituting IDs belonging to another user or college.
- Do not rely on frontend route guards as a security boundary.

## Data handling

- Collect only data needed for a defined feature.
- Restrict access to financial, guardian, disciplinary, health-related, and other sensitive records.
- Use TLS in transit and managed encryption at rest where available.
- Redact sensitive fields from logs and error telemetry.
- Define retention, deletion, export, and access-review policies before production use.
- Use synthetic data in development and tests.

## API and file security

- Validate and transform every request.
- Configure CORS with explicit trusted origins.
- Use secure headers, request-size limits, and rate limits.
- Validate uploaded file types using content inspection as well as extension/MIME checks.
- Set file-size limits; store uploads outside executable/public paths.
- Use malware scanning where appropriate.
- Serve private files through short-lived authorized download URLs or an authorization-controlled endpoint.

## AI/RAG security

- Filter retrieval by tenant and document-level permissions before passing text to a model.
- Never expose private messages or private records through general-purpose search.
- Treat documents and model output as untrusted.
- Validate tool inputs and outputs.
- Do not expose secrets to the model.
- Require user confirmation for consequential write actions.
- Test for cross-tenant retrieval leakage, prompt injection, and unauthorized tool calls.

## Auditability

Record security-sensitive actions such as attendance corrections, grade changes, permission changes, fee adjustments, and complaint state transitions. Audit records should include actor, action, target, timestamp, reason where appropriate, and correlation/request ID. Restrict audit-log access and prevent ordinary users from modifying historical entries.

## Release checklist

- [ ] No secrets committed to Git.
- [ ] Production environment variables validated at startup.
- [ ] Authentication and permission tests pass.
- [ ] Cross-tenant access tests pass.
- [ ] CORS and cookie settings reviewed.
- [ ] Rate limits and upload limits configured.
- [ ] Logs redact sensitive data.
- [ ] Backups and restore procedure tested.
- [ ] Dependency and container scans reviewed.
- [ ] Error responses do not expose internals.
- [ ] AI retrieval and tool permissions tested.
