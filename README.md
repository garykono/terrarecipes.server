## TerraRecipes Backend README (Node/Express API)

# TerraRecipes (Backend)

The backend API for TerraRecipes — a full-stack recipe web app built to support rich browsing, advanced search, and future extensibility (recommendations, personalization, and more).

This repo contains the **Node/Express** API, MongoDB models, and supporting services.

## Features

- REST API for recipes, categories, and supporting entities
- Advanced recipe search (filters, sorting, pagination)
- Grocery list generation support (structured ingredient output)
- Authentication (sign up / sign in)
- Email verification flow (Resend + email templates)
- Robust logging and error handling
- Scalable structure designed for feature growth

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Auth: (JWT and cookies)
- Email: Resend
- Logging: Pino
- Testing: Postman collections
- Deployment: Render

## Getting Started

### 1 - Install dependencies
npm install

### 2 - Configure environment variables
Create a .env file in the project root:

NODE_ENV=development
APP_VERSION=1.0

LOG_LEVEL=info

CLIENT_URL_DEV=http://localhost:5173
SERVERPORT=8080

#### Mongodb database info
DATABASE=
DATABASE_USERNAME=
DATABASE_PASSWORD=

JWT_SECRET=
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN_DAYS=90

RESEND_API_KEY=
EMAIL_FROM=
SUPPORT_EMAIL_ADDRESS=

3) Run locally
npm start

The API should be available at:

http://localhost:5000

## Scripts

npm start - Run development server

npm build - Build for deployment

npm start:prod - Run production server

### API Overview
Example endpoints:

GET /recipes — List recipes (supports pagination/filtering)

GET /recipes/:id — Get recipe by id

POST /collections/ — Add multiple recipes to one place, can also create combined grocery lists

POST /users/signup — Create account

POST /users/login — Login

## Project Structure (High Level)
src/

    app.js|server.js     Express app bootstrap

    routes/              Route definitions

    controllers/         Request handlers

    models/              Mongoose schemas/models

    normalizers/         Whitelisting and formatting query params and POST bodies

    policy/              Allowed/Required query params and variables

    services/            Mostly used for caching right now

    middleware/          Currently helpers for parsing queries and searching

    types/               For typescript

    utils/               Helpers (env, async wrappers, etc.)

## Error Handling & Logging
Centralized error middleware for consistent API responses

Structured logs (Pino) for easier debugging in local + production environments

## Deployment Notes
If deploying to Render (or similar):

Set environment variables in the dashboard

Ensure MongoDB connection uses the hosted URI

Configure CORS allowed origin to your deployed frontend URL

## Roadmap
Recommendation engine / “smart suggestions”

More advanced faceted browsing and ranking

Improved search scoring and synonym support

Educational content (simple "how to chop an onion" article with illustrations or photos)