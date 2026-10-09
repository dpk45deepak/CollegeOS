# Contributing

Thanks for helping improve College OS. The project prioritizes useful workflows, privacy, accessibility, and maintainable engineering over feature count.

## Before starting

1. Read the root README and relevant architecture documentation.
2. Check existing issues and pull requests.
3. For substantial changes, open an issue or discussion first to agree on scope.
4. Never use real student, staff, or college credentials in development examples.

## Development principles

- Keep controllers and UI components small.
- Put business rules in domain services.
- Validate input at trust boundaries.
- Enforce permissions on the backend.
- Prefer explicit types and avoid `any`.
- Add tests for bug fixes and business rules.
- Update API/architecture documentation when contracts change.
- Keep AI features permission-aware and grounded in sources.

## Suggested workflow

1. Create a focused branch: `feat/attendance-alerts` or `fix/tenant-scope`.
2. Make the smallest coherent change.
3. Add or update tests.
4. Run formatting, linting, type checks, and relevant tests.
5. Update documentation and example environment variables if needed.
6. Open a pull request with context, screenshots for UI changes, test results, and migration notes.

## Pull request checklist

- [ ] The problem and expected behavior are described.
- [ ] Changes are scoped and readable.
- [ ] Authorization and tenant isolation are considered.
- [ ] Tests cover important success and failure cases.
- [ ] Database migrations are included where needed.
- [ ] API contracts and docs are updated.
- [ ] UI includes loading, empty, and error states where relevant.
- [ ] No secrets or real personal data are included.
- [ ] Accessibility and responsive behavior are checked for UI changes.

## Commit messages

Use clear, action-oriented messages. Example:

- `feat(attendance): add shortage alerts`
- `fix(auth): rotate refresh tokens`
- `docs(rag): explain citation metadata`
- `test(complaints): cover unauthorized access`

## Reporting security issues

Do not publish exploitable details in a public issue. Use the repository owner's private security reporting process, if available.
