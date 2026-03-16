# Invoice Generation API by T16BCreditCrew

A simple API to generate a UBL invoice from user provided data.

## Table of Contents
- [Overview](#overview)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Running Locally](#running-locally)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
- [Authentication](#authentication)
- [Quick Start](#quick-start)
- [Endpoints](#endpoints)
- [Errors](#errors)
- [Tech Stack](#tech-stack)
- [Changelog](#changelog)

## Overview

With the digital transformation of manufacturing, Credit Crews' invoice generation API offers a cost-effective and flexible solution for small and medium enterprises (SMEs) participating in digital trade. This API focuses exclusively on automating invoice generation and validation, aiming to reduce manual errors, improve operational efficiency, and maintain interoperability with digital trade partners. 

The Invoice Generation API is a RESTful service that automatically generates UBL-compliant invoice XML documents from structured input data.

The API allows users to:
- Generate draft invoices
- Edit invoice fields
- Validate invoice data
- Finalise invoices
- Store and retrieve all invoices
- Export invoices as XML

## Deployment
This API is deployed using Render.

Production URL: https://t16bcreditcrew-86oh.onrender.com

## Documentation
Full API documentation is available in [`swagger.yaml`](./swagger.yaml).
You can paste it into [Swagger Editor](https://editor.swagger.io) to browse 
and test all endpoints interactively.

## Running Locally
### Prerequisites

Ensure the following are installed:

- Node.js (v18 or higher)
- npm
- MongoDB (local instance or MongoDB Atlas)

## Environment Variables
Create a `.env` file in the project root with the following variables:

MONGODB_URI=your_database_connection_string
JWT_SECRET=your_secret_key
PORT=3000

## Installation
1. Install dependencies using npm install
2.  Start the server using `npm start`

The API will be available through http://localhost:3000

## Authentication
All requests require a bearer token obtained at login. Pass it in the 
`Authorization` header with every request:

Authorization: Bearer YOUR_TOKEN

## Quick Start
Get up and running in 3 steps.

### 1. Register an account
```bash
curl -X POST https://t16bcreditcrew-86oh.onrender.com/v1/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "businessName": "Janes Design Co.",
    "abn": "12345678901",
    "password": "••••••••"
  }'
```

### 2. Log in to get a token
```bash
curl -X POST https://t16bcreditcrew-86oh.onrender.com/v1/admin/auth/login \
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

### 3. Generate your first invoice
```bash
curl -X POST https://t16bcreditcrew-86oh.onrender.com/v1/admin/order/draft-invoice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    ...invoice fields go here
  }'
```

That's it — you're ready to start generating invoices.

## Endpoints
### Account Creation and Management

| Method | Endpoint | Description |
|------|------|------|
| POST | `/v1/admin/auth/register` | Register a new admin user |
| POST | `/v1/admin/auth/login` | Log in and receive a JWT token |
| POST | `/v1/admin/auth/logout` | Log out user and invalidate token |
| GET | `/v1/admin/user/details` | Retrieve details of the authenticated admin |
| PUT | `/v1/admin/user/details` | Update admin account information |

---

### Invoice Generation and Management

| Method | Endpoint | Description |
|------|------|------|
| POST | `/v1/admin/order/upload` | Upload an order contract (XML or JSON) |
| POST | `/v1/admin/order/parse` | Extract order details from uploaded order document |
| POST | `/v1/admin/order/draft-invoice` | Generate a draft invoice from parsed order data |
| POST | `/v1/invoices/generate` | Automatically generate and finalise a UBL invoice |
| GET | `/v1/admin/invoices` | Retrieve all invoices belonging to the authenticated user |
| GET | `/v1/invoices/{invoiceId}` | Retrieve a specific invoice |
| PUT | `/v1/invoices/{invoiceId}` | Edit invoice fields |
| DELETE | `/v1/invoices/{invoiceId}` | Delete a specific invoice |
| GET | `/v1/admin/invoice/{invoiceId}/xml` | Export invoice as a downloadable XML document |

---

### Validation

| Method | Endpoint | Description |
|------|------|------|
| POST | `/v1/invoices/{invoiceId}/validate` | Validate invoice against UBL XSD schema and business rules |

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

## Tech Stack
- Node.js
- Express
- TypeScript
- MongoDB - database
- OpenAPI 3.0 (Swagger)
- Render (deployment)

## Changelog
See [CHANGELOG.md](./CHANGELOG.md) for release history.
