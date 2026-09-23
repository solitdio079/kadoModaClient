# API integration status — 2026-09-23

The following fixes are implemented in the local kadomodaAPI repository, not yet
deployed. See its README.md for Coolify setup and bootstrap/seed commands.

## Fixed and tested

1. Catalog reads are public; allowed CORS preflight runs before authentication.
2. Orders require authentication and enforce ownership. ADMIN-only status updates
   validate transitions; payment/owner/price edits and order deletion are blocked.
3. Product PUT/PATCH update the existing ID, preserve omitted images, validate
   multipart values and filter categories using categoryId.
4. All product/category/campaign mutations and media uploads require ADMIN.
5. A server-only admin:bootstrap script creates/promotes the requested admin with
   a hashed password. It never resets an existing password. Live provisioning is pending.
6. Migration removes relation ID 0 defaults; category is required and campaign
   optional. seed:demo creates eight real products with isDemo and unique seedKey
   tracking. Reruns preserve edits; --list and --delete --apply support scoped cleanup.
   No sample records have been inserted live.
7. Carts enforce ownership, quantity/size validation, database pricing/discounts,
   aggregate stock checks and atomic line/total replacement. Checkout remains
   closed with 503 CHECKOUT_UNAVAILABLE until the full payment/inventory milestone.
8. Addresses map zipCode to zipcode, reject client userId, enforce ownership and
   prevent editing addresses already used by orders.

Additional fixes include bounded uploads/signature checks, private import files,
safe JSON errors, security headers, authentication rate limits and purpose-specific
JWTs. Existing login tokens require a fresh login after deployment.

## Frontend contracts

- POST /auth/login: { email, password }, success { message, token }.
- GET /product: { data: Product[] }; uploaded images are API-root filenames.
- Cart replacement: array of { productId, size, quantity }, no price/cartId fields.
- Addresses: zipCode input, no userId.
- Products: real categoryId, optional nullable campaignId; partial PATCH supported.
- Keep all frontend feedback Turkish through its error mapper; some legacy account
  endpoints still contain English messages.

The frontend still uses a browser-local cart and negative-ID preview fixtures.
After API deployment and optional seeding, build with VITE_CATALOG_MODE=live for
real products. Admin screens/account synchronization remain subsequent steps.

## Verification and remaining work

Passed: TypeScript, 7 unit tests, 10 isolated-database integration tests, all 15
migrations on a fresh database and schema drift check. Docker build/runtime and
live acceptance checks remain for Coolify. Production data was not changed.

Before sales: per-size stock/reservations, immutable order snapshots, shipping,
provider-verified payments and idempotent webhooks, refunds and purchase tests.
Account recovery/session lifecycle, branded email, merchant/legal content remain
later milestones. Checkout cannot be enabled by a runtime switch.
