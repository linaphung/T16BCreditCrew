# Invoice Generation API by T16BCreditCrew

A simple API to generate a UBL invoice from user provided data.

## Overview

A simple REST API for generating and managing invoices. Send a few fields, get back a ready-to-send XML — no billing platform required.

**Base URL:** ``

## Authentication
All requests require a bearer token obtained at login. Pass it in the 
`Authorization` header with every request:

Authorization: Bearer YOUR_TOKEN

## Quick Start
Get up and running in 3 steps.

### 1. Register an account
```bash
curl -X POST https://api.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "businessName": "Jane's Design Co.",
    "abn": "12345678901",
    "password": "••••••••"
  }'
```

### 2. Log in to get a token
```bash
curl -X POST https://api.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "••••••••"
  }'
```
Response:
```json
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```
> **Note:** Tokens expire after 1 hour. Log in again to get a new one.

### 3. Generate your first invoice
```bash
curl -X POST https://api.com/v1/admin/invoice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    ...invoice fields go here
  }'
```

That's it — you're ready to start generating invoices.

## Endpoints
Full API reference is available in [`swagger.yaml`](./swagger.yaml).
You can paste it into [Swagger Editor](https://editor.swagger.io) to browse 
and test all endpoints interactively.

## Errors
All errors follow a consistent response shape:
```json
{
  "error": "ERROR_NAME",
  "message": "A description of what went wrong."
}
```

| HTTP Code | Error Name | Description |
|-----------|------------|-------------|
| 400 | `MISSING_FIELD` | A required field was not provided |
| 400 | `INVALID_EMAIL` | Email is not a valid format or already in use |
| 400 | `EMAIL_EXISTS` | An account with this email already exists |
| 400 | `INVALID_PASSWORD` | Password does not meet requirements |
| 400 | `INVALID_PASSWORD_OR_EMAIL` | Email and password combination is incorrect |
| 400 | `INVALID_TOKEN` | Token is missing, expired, or invalid |
| 400 | `Invoice_Bad_Request` | Invoice request is malformed or contains invalid data |
| 404 | `USER_DOES_NOT_EXIST` | No account found for the given user |
| 404 | `INVOICE_NOT_FOUND` | No invoice found with the given ID |
| 500 | `Server Error` | An unexpected error occurred on our end |
