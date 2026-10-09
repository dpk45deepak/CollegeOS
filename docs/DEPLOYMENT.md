# Deployment Guide

This guide describes a deployment approach. Update exact commands and platform settings to match the actual repository and hosting provider.

## Environments

Maintain separate development, staging, and production environments. Use different databases, credentials, storage buckets, and AI keys for each environment.

## Required services

- Next.js web application
- NestJS API
- PostgreSQL (with pgvector if RAG vectors are stored there)
- Redis for cache and BullMQ
- Object storage for uploaded documents
- Background worker process for document ingestion and scheduled jobs

For a small initial deployment, the API and worker may share a codebase while running as separate processes. Do not run long document-processing tasks inside ordinary request handlers.

## Environment variables

Create `.env.example` files with placeholder values. Validate required variables at startup.

Typical API variables:
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `WEB_ORIGIN`
- authentication secrets/keys
- AI provider selection and server-only provider keys
- object-storage configuration
- email provider configuration

Typical web variables:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`

Only variables intentionally prefixed for public browser use should be exposed to the frontend. Never place database URLs, JWT signing secrets, or LLM provider keys in `NEXT_PUBLIC_*` variables.

## Deployment sequence

1. Provision PostgreSQL and Redis with network access restricted to application services.
2. Provision private object storage and define upload/download access rules.
3. Configure environment variables through the hosting provider's secret manager.
4. Build and test the API, web app, and worker.
5. Run database migrations as a controlled release step.
6. Deploy the API and worker.
7. Deploy the web app with the correct API origin.
8. Verify health/readiness checks, authentication, tenant isolation, and a basic user workflow.
9. Verify background jobs, document ingestion, notifications, and logs.
10. Monitor errors, latency, queue failures, database connections, and AI usage.

## Docker guidance

Use a multi-stage Dockerfile, run as a non-root user, pin major dependencies, and keep secrets out of images. Local Compose should be for development and should not be treated as a complete production security configuration.

## Health checks

Provide:
- liveness: process is alive
- readiness: critical dependencies are available
- worker health: queue connectivity and job processing status where feasible

Do not expose sensitive infrastructure details in public health responses.

## Backups and recovery

- Enable automated database backups.
- Define recovery point and recovery time objectives.
- Test restore procedures, not just backup creation.
- Consider object-storage versioning/lifecycle policies.
- Document how to rotate credentials and recover from compromised secrets.

## Production release checklist

- [ ] Migrations reviewed and backed up.
- [ ] Secrets configured outside source control.
- [ ] HTTPS enabled.
- [ ] Allowed origins restricted.
- [ ] Database and Redis not publicly exposed.
- [ ] Logging and monitoring enabled.
- [ ] Background workers deployed.
- [ ] Backup restoration tested.
- [ ] Rollback procedure documented.
