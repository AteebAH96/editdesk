# Security and deployment checklist

## Required production configuration

- Set `NODE_ENV=production`.
- Generate `JWT_SECRET` with a cryptographically secure generator (at least 32 random bytes).
- Set `MONGO_URI` only in the hosting provider's secret manager. Use a dedicated database user
  with access only to the EditDesk database and restrict Atlas network access.
- Set `CLIENT_URL` to the exact frontend origin. Multiple origins must be comma-separated; wildcards
  are intentionally unsupported.
- Use `AUTH_COOKIE_SAMESITE=none` only when the API and frontend are on different sites. Both must
  use HTTPS. Prefer `lax` when they share a site.
- Do not define either `SEED_*_PASSWORD` variable in production and never run `npm run seed` there.

## Implemented controls

- HttpOnly, Secure production session cookie; CSRF token on state-changing cookie requests.
- JWT algorithm, issuer, and audience pinning; current roles loaded from MongoDB on every request.
- Server-side owner/admin checks on every order and message route.
- Per-account authentication throttling plus global API throttling.
- Exact-origin credentialed CORS allowlist, small JSON body limit, NoSQL key rejection, and strict
  field/URL limits.
- API and frontend security headers, including CSP, clickjacking protection, HSTS, referrer policy,
  and MIME sniffing protection.
- Password hashes excluded from queries by default and generated with bcrypt cost 12.
- Production seeding is blocked, debug error details are hidden, and known demo passwords are gone.

## Operational notes

- The built-in rate limiter is per process. If the API is horizontally scaled, replace its store
  with a shared Redis-backed limiter so limits apply across all instances.
- Rotate `JWT_SECRET`, the MongoDB password, and any third-party key immediately if one is ever
  committed or exposed. Removing a secret from Git does not revoke it.
- Run `npm audit` in both `server` and `client` during CI and enable automated dependency updates.
- Back up MongoDB, test restores, enable provider audit logs, and alert on unusual authentication
  failures and request spikes.
