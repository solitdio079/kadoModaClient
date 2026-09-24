# Kado Moda — Storefront

Step 2 of a staged launch, using the selected **Luxury Department Store** proposal.
The original campaign photos, product images and gold figure were recovered from the
proposal. The figure sits before the Kado Moda wordmark on desktop and mobile.

## Current milestone

- Responsive Turkish homepage and real React Router routes.
- Eight explicit preview products, Turkish search, category/size filters and sorting.
- Product details, size selection, stock-limited local cart and favorites.
- Zustand persistence for cart/favorites; integer kuruş totals.
- React Hook Form + Zod validation, Sonner feedback, FlyonUI CSS components.
- Real login and server-verified role; ADMIN users go directly to /yonetim.
- Responsive admin CRUD for products, images, categories and campaigns.
- Search, seeded-product filter, deletion confirmation and Turkish feedback.
- Live campaign pricing and refreshed local cart snapshots after catalog changes.
- Coolify Dockerfile, Nginx SPA fallback and same-origin API proxy.

**This milestone is a deployable preview, not a sales-ready store.** Ordering and
payments are closed. The user successfully bootstrapped the live ADMIN account (id 1). Demo seeding
is optional and has not been confirmed. The API now includes tested bootstrap and demo-seeding scripts; run them on the
server after API deployment using its README instructions. No supplied password is stored in this repository.

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

## Deploy Step 2 to Coolify

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

`VITE_CATALOG_MODE=live` is now the Docker build default. Remove any old
`VITE_CATALOG_MODE=demo` override in Coolify, or change the Docker **build argument**
to `live`, then rebuild.
Changing a runtime variable after an image is built does not change Vite output.
The live API now supports anonymous product browsing and currently returns an empty
catalog until products are added or seeded. Use demo mode only for an explicit
visual preview.
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
| 2 — implemented; live setup pending | API contract corrections, public catalog, secure admin bootstrap for Djoko Keita (`solitdio079@gmail.com`), database sample seeding with tracked cleanup, product/category/campaign administration |
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

## Stage 2: administrator setup and live check

In Coolify select the **API application**, not the frontend. Add server runtime
variables BOOTSTRAP_ADMIN_EMAIL (`solitdio079@gmail.com`), BOOTSTRAP_ADMIN_NAME
(`Djoko Keita`) and BOOTSTRAP_ADMIN_PASSWORD (your chosen password). Redeploy the
API to make them available in its running container. Open that application's
Terminal, connect to the API container, and run:

```sh
cd /app
npm run admin:bootstrap
# Optional proposal demo catalog:
npm run seed:demo
npm run seed:demo -- --list
```

After successful bootstrap, remove the three bootstrap variables and redeploy.
The account remains in PostgreSQL. Passwords are never stored in this frontend.
Do not run these scripts in the frontend container. No live admin/seed mutation
was performed by the assistant.

1. Publish this frontend update with live catalog mode.
2. Open `/hesabim`, log in with the admin account, and verify navigation to
   `/yonetim`. `/admin` redirects there too. A refresh requires another login;
   the current session remains memory-only.
3. Create a category, create a product with an image, then edit the same product.
   Check its price, stock, category and image in the storefront.
4. Create a campaign and link it to a product. Verify discounted prices.
5. Filter “Yalnızca örnek ürünler”; edit or individually delete seeded products.
   Cancel a deletion once to verify nothing changes.
6. Check the same forms on mobile. Verify that a regular customer cannot access
   management and that anonymous API writes still fail.

`npm run check` passes 17 tests plus TypeScript/build. The optional
`tests/admin.browser.cjs` uses Playwright and installed Chrome against a running
Vite server. It intercepts every API call, so its test accounts/products never
reach production. Run with Playwright on NODE_PATH. Screenshots go to /private/tmp.

See IYZICO-READINESS.md for outstanding merchant review requirements. Passing
technical tests does not mean iyzico has approved the site or payment integration.

## Stage 2b: publish store information for review

Deploy **kadomodaAPI first**, then this frontend. The API adds one SiteContent
migration; the existing Docker startup applies it without removing catalog/users.
Your existing administrator remains valid; do not bootstrap again.

Open `/yonetim/bilgiler` after login. There are six sections:

- İşletme ve iletişim: actual business identity, address, phone/email, shipping
  descriptions, return address and applicable registration information.
- Hakkımızda, Gizlilik politikası, Mesafeli satış sözleşmesi, Teslimat koşulları,
  and İptal ve iade koşulları: merchant-approved plain-text content.

“Kaydet” saves a private draft; “Mağazada yayımla” publishes a separate snapshot
only after validation and your accuracy confirmation. Saving later drafts leaves
published text intact. “Yayından kaldır” hides the public snapshot and retains
the draft. Stale versions return a conflict rather than overwriting another edit.
The editor warns about unsaved section changes and leaving through links/reload.

Public routes are `/iletisim`, `/hakkimizda`, `/gizlilik`,
`/mesafeli-satis-sozlesmesi`, `/teslimat`, `/iptal-ve-iade`. Published policy links
appear in the footer. Contact is always linked; an unpublished page clearly says
information is not published. No invented merchant data or legal text is seeded.
Text is escaped; entering HTML never runs it.

Live acceptance: save a draft and confirm it is absent publicly; publish a correct
page, check its footer link/content from a logged-out browser; save a revised draft
and verify the previous public version remains; test unpublishing. Complete the
remaining merchant requirements in IYZICO-READINESS.md before requesting review.
Payment integration and customer-account features are still subsequent stages.
