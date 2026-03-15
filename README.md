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
  -d '{ "email": "jane@example.com", "password": "••••••••" }'
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


