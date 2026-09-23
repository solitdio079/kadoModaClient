# API integration findings

Inspected on 2026-09-23 against the local `kadomodaAPI` source and the live
`https://api.kadomoda.com` service. Local source may differ from deployed code.
No backend implementation was changed in Step 1.

## Verified live

- Anonymous `GET /product` initially returned `401`. During implementation the
  backend was updated; the final direct and proxied checks both returned `200`
  with `{"data":[]}`. Public product browsing is now available.
- The initial cross-origin preflight `OPTIONS /product` returned `401` without
  an Access-Control-Allow-Origin header. It was not re-tested after the update.
- The frontend uses a same-origin reverse proxy, so the browser needs no CORS
  exception. This does not remove or bypass backend authorization.

## Source contract used in Step 1

- `POST /auth/login`: JSON `{ email, password }`; success `{ message, token }`.
- `GET /product`: `{ data: Product[] }`, now available without login.
- Product data: `id`, `name`, `details`, `sizes`, `total_qty`, decimal-string `price`,
  filename array `images`, `variant`, nested `category` and `campaign`.
- Static files are served from the API root (`/<uploaded filename>`).

## Work required before commercial checkout

1. Product/category/campaign reads were made public during this work. Retain
   server-side admin authorization on writes. Never ship an admin JWT to allow
   public browsing.
2. `/order` was mounted during this work, before the global JWT middleware. The
   current order router has no authentication middleware visible; review its
   handlers and ensure authentication and ownership checks precede all operations.
3. Product PUT/PATCH handlers still call `prisma.product.create`. Editing must update
   the existing ID instead of creating a duplicate. The category-product query
   still filters `campaignId`, not `categoryId`.
4. Product/category/campaign mutations now require JWT, but product delete and
   category mutations lack visible admin guards. Check campaign mutations too.
   Authentication alone must not allow ordinary users to change merchandise.
5. Public signup creates a USER, and role promotion needs an existing ADMIN.
   Bootstrap the requested initial admin through a controlled server/database
   operation. Never expose self-promotion or store its password in Vite variables.
6. Sample imports need valid category/campaign relationships; schema defaults are
   ID 0. Create or select real related records, track seed IDs, and confirm cleanup
   rules before using the sample catalog with the admin UI.
7. Audit order ownership, server-authoritative prices/totals, stock per size,
   quantity validation, payment/webhook idempotency and status transitions before
   turning on checkout. A frontend cart total must not authorize a charge.
8. Address validation uses `zipCode` while the schema uses `zipcode`; confirm the
   controller mapping. Confirm supported payment provider, shipping rates and
   merchant business information at their implementation milestones.

These findings define the later milestones; they are not claims that the current
API is ready to accept customer payments or that fixes have already been deployed.
