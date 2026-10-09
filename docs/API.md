# API Conventions

## Base path

Use versioned routes:

`/api/v1`

Example: `GET /api/v1/students/me/attendance`

The actual route list must be generated from the implemented NestJS controllers and kept aligned with Swagger/OpenAPI.

## Conventions

- Use nouns for resources and HTTP methods for actions.
- Validate request input with DTOs and class-validator.
- Use explicit response DTOs; do not return raw ORM objects.
- Use ISO 8601 timestamps in UTC unless a field explicitly represents local college time.
- Apply pagination to list endpoints.
- Return consistent error codes suitable for frontend handling.
- Document authentication, permissions, request examples, responses, and expected errors in Swagger.

## Suggested response envelope

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "request-id"
  }
}
```

Paginated success:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "requestId": "request-id"
  }
}
```

Error:

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "The request could not be validated.",
  "details": [],
  "requestId": "request-id",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Do not return stack traces, secrets, or internal infrastructure details to clients.

## Example endpoint map

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Start a session |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke current session |
| GET | `/students/me` | Current student's profile |
| GET | `/students/me/attendance` | Current student's attendance summary |
| GET | `/students/me/timetable` | Current student's schedule |
| GET | `/students/me/assignments` | Current student's assignments |
| POST | `/attendance` | Record attendance, if permitted |
| POST | `/attendance/correction-requests` | Request a correction |
| POST | `/complaints` | Create a complaint |
| GET | `/complaints/mine` | List complaints visible to the current user |
| POST | `/ai/chat` | Submit a question to the AI assistant |
| POST | `/documents` | Upload a document, if permitted |
| GET | `/notifications` | List current user's notifications |

These are proposed examples, not a guarantee that routes already exist.

## Pagination, filtering, sorting

Use bounded pagination such as `?page=1&limit=20`. Enforce a maximum page size server-side. Validate all sort fields against an allowlist; never interpolate user input into raw SQL.

## Authentication and permissions

Protected endpoints should require the configured session/authentication strategy. Enforce resource-level authorization in services/guards. A user must not gain access merely by changing an ID in the URL.

## Idempotency and concurrency

Use idempotency keys for operations where duplicate submissions could cause harm, such as payment initiation. Use transactions and appropriate uniqueness/concurrency controls for attendance marking, grading, and other sensitive workflows.

## Documentation

Expose Swagger in development and protect or disable public documentation in production according to deployment policy.
