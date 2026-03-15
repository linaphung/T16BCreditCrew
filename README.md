# Invoice Generation API by T16BCreditCrew

A simple API to generate a UBL invoice from user provided data.

## Overview

A simple REST API for generating and managing invoices. Send a few fields, get back a ready-to-send PDF — no billing platform required.

**Base URL:** ``

## Authentication
All requests require a bearer token obtained at login. Pass it in the 
`Authorization` header with every request:

Authorization: Bearer YOUR_TOKEN

### Register
```bash
curl -X POST https://api.acme.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "businessName": "Jane's Design Co.",
    "abn": "12345678901",
    "password": "••••••••"
  }'
```

Response:
```json
{ "code": 200, "userId": "64f1a2b3c4d5e6f7a8b9c0d1" }
```

### Login
```bash
curl -X POST https://api.acme.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane@example.com", "password": "••••••••" }'
```

Response:
```json
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```


