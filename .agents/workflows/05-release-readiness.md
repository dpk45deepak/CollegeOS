# Release Readiness
1. Confirm branch and working tree.
2. Review changed files and migrations.
3. Run available lint, typecheck, unit, integration, contract, E2E and build checks.
4. Verify environment variable names and deployment assumptions.
5. Check auth, secrets, storage, workers, health checks and observability.
6. Test migrations on disposable/staging DB; never reset production.
7. Confirm rollback/recovery steps.
8. Report passed, failed, skipped and blocked checks with evidence.
9. Do not deploy without explicit approval.
