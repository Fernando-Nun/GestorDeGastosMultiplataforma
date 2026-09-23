# Ember

Ember is a React + Vite subscription expense tracker with a mobile-first liquid-glass interface.

## Run

- `pnpm dev` starts the combined Express and Vite server on port 5000.
- `pnpm run build` builds the client for production.
- `pnpm start` serves the production build and API.

## Persistence

The app uses Replit PostgreSQL for all application data:

- `app_users` stores accounts with scrypt password hashes.
- `app_sessions` stores hashed, expiring HTTP-only session tokens.
- `password_reset_tokens` stores one-hour recovery tokens for a future email delivery provider.
- `expenses` stores each user's recurring payments.

The schema is versioned in `database-schema.sql` and has already been applied to the development database. The API in `server/index.ts` owns authentication and expense CRUD; the browser never receives database credentials.

`DATABASE_URL` is provided by Replit. `SESSION_SECRET` should be managed through Replit Secrets and is used to sign session token hashes.

## UI conventions

Service branding is represented with inline SVG icons only. Do not add emoji characters to the interface.