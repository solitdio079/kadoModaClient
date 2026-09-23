# Kado Moda — Storefront

Step 1 of a staged launch, using the selected **Luxury Department Store** proposal.
The original campaign photos, product images and gold figure were recovered from the
proposal. The figure sits before the Kado Moda wordmark on desktop and mobile.

## Current milestone

- Responsive Turkish homepage and real React Router routes.
- Eight explicit preview products, Turkish search, category/size filters and sorting.
- Product details, size selection, stock-limited local cart and favorites.
- Zustand persistence for cart/favorites; integer kuruş totals.
- React Hook Form + Zod validation, Sonner feedback, FlyonUI CSS components.
- Real login request to the existing API. No mock login or client-side admin role.
- Coolify Dockerfile, Nginx SPA fallback and same-origin API proxy.

**This milestone is a deployable preview, not a sales-ready store.** Ordering and
payments are closed. The admin account has not been created and demo records have
not been inserted into the live database. They are reserved for Step 2, after this
deployment is checked. No supplied password is stored in this repository.

## Local development

Node.js 22.12+ is required.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies `/api/*` to
`https://api.kadomoda.com/*`; Nginx uses the same mapping in production.

```sh
npm run check
```

This runs domain/API tests, TypeScript checking, and the production build.
`npm run preview` serves static output only and does not provide the API proxy;
use the development server or Docker for integration checks.

## Deploy Step 1 to Coolify

The existing Git remote is `git@github.com:solitdio079/kadoModaClient.git`.
Review, commit and push this folder to that repository. In Coolify:

| Setting | Value |
| --- | --- |
| Source | `solitdio079/kadoModaClient` |
| Branch | `main` (or the branch you push) |
| Build pack | Dockerfile |
| Base directory | `/` |
| Dockerfile location | `/Dockerfile` |
| Ports Exposes | `8080` |
| Domain | `https://kadomoda.com` |
| Health check | HTTP GET `/saglik`, port `8080`, expected status `200` |
| Persistent storage | None for the frontend |

No database URL, JWT secret, Brevo key, or admin password belongs in this frontend.
They stay in the API service. No custom start/build command is needed with the
Dockerfile build pack. Point the domain's DNS to the VPS and let Coolify issue TLS.

`VITE_CATALOG_MODE=demo` is the Docker build default. To use database products
later, set the Docker **build argument** `VITE_CATALOG_MODE=live` and rebuild.
Changing a runtime variable after an image is built does not change Vite output.
The live API now supports anonymous product browsing and currently returns an empty
catalog. Keep demo mode for the first visual review; switch after database seeding.
Live mode reports failures; it never silently replaces real data with mocks.

The Dockerfile builds with Node 22 and serves with unprivileged Nginx on 8080.
The API proxy uses a fixed HTTPS upstream with certificate verification and
forwards the visitor's authorization header. It does not inject admin credentials.
Uploaded API images are read through that proxy as well.

### Live acceptance check

1. Open `/` on desktop and a phone. Check the original luxury layout and logo order.
2. Search `FİYONK` or `gul kurusu`; filter category/size and change sorting.
3. Open a product, try adding without a size, then select a size and add it.
4. Add/remove a favorite. Adjust cart quantity and refresh; check persistence.
5. Directly open `/urun/-1`, `/koleksiyon`, `/sepetim` and refresh each route.
6. Submit an empty login form and check Turkish validation. Existing users can
   test real login; the requested new admin is not provisioned yet.
7. Verify checkout stays disabled and the preview banner is visible.
8. Confirm `https://kadomoda.com/saglik` returns `ok`.
9. `/api/product` currently returns `200` with `{"data":[]}` when logged out; this
   confirms the proxy reaches the backend rather than returning the SPA HTML.

## Next milestones — stop for a live deployment check after each

| Step | Deliverable |
| --- | --- |
| 1 — implemented | Luxury storefront, preview catalog, local cart/favorites, login, deployment shell |
| 2 | API contract corrections, public catalog, secure admin bootstrap for Djoko Keita (`solitdio079@gmail.com`), database sample seeding with tracked cleanup, product/category/campaign administration |
| 3 | Signup and verification, session lifecycle, customer profiles/addresses, authenticated cart synchronization and account orders |
| 4 | Server-validated checkout, payment provider integration, inventory reservation, idempotent order/payment webhooks, shipping rules |
| 5 | Merchant-approved legal/contact/return content, transactional email, SEO, monitoring, backups, accessibility and full purchase/refund acceptance checks |

For Step 2, sample products must be real database records so an authorized admin can
edit/delete them. Keep a server-side manifest of inserted IDs; do not implement a
frontend “delete everything” button or pretend browser-local changes affect the DB.
The current local fixtures live in `src/data/products.ts` and use negative IDs to
stay separate from real database records.

See [API-NOTES.md](API-NOTES.md) for verified integration findings and launch blockers.

## Validation completed locally

- Domain/API tests: cart size/stock boundaries, exact totals, demo/live separation,
  Turkish searching and filtering, API adaptation, Turkish error messages.
- TypeScript and production build.
- Desktop and 390px mobile browser checks, including cart refresh persistence.

Docker is unavailable on this machine, so the container build and Nginx runtime
must be verified by the first Coolify deployment. Successful live login has not
been claimed without a valid account test.

## Implementation notes

FlyonUI supplies styled buttons, inputs, selects and loading states. React controls
interactive state; no FlyonUI DOM mutation runtime is required for these components.
Fonts are bundled locally, including Turkish glyphs. Preview images are original
proposal assets; they must be replaced/approved as real merchandise before sales.
The preview is intentionally `noindex`. Change indexing only at the launch milestone.

Cart/favorites are browser-local and are not authoritative inventory or pricing.
Login tokens are memory-only and clear on reload; persistent secure sessions are
part of the account milestone. All UI feedback uses authored Turkish strings;
raw API messages are never displayed.
