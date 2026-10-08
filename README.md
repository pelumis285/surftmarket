# Surftmarket

Surftmarket is a multi-vendor marketplace prototype built with Next.js, React,
Tailwind CSS, Drizzle ORM, and PostgreSQL.

## Local development

1. Copy `.env.example` to `.env` and replace the placeholder credentials.
2. Install dependencies with `npm install`.
3. Start PostgreSQL. A development database is included for Docker users:

   ```bash
   docker compose up -d db
   ```

4. Apply versioned migrations with `npm run db:migrate`.
5. Provision the first administrator with `npm run admin:create`.
6. Start the application with `npm run dev`.

The application is available at `http://localhost:3000`.

## Authentication

Email/phone plus password registration and login are database-backed. Passwords
are hashed with scrypt. Sessions use opaque, hashed database tokens delivered in
HTTP-only, same-site cookies. Public registration is limited to customer,
vendor, affiliate, and rider accounts; privileged roles must be provisioned by
an operator. Admin APIs enforce role permissions and sensitive actions are
written to the audit log.

Vendor, rider, and affiliate registrations begin in a pending state. OTP,
Google login, password reset, and verification messages require external
providers and are intentionally not represented as working yet.

Quality checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Current status

Authentication is the first production-backed vertical slice. The storefront,
catalog, checkout, escrow, affiliate, and delivery flows still contain demo data
or mock behavior and must not yet be treated as production-ready.
