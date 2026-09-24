# iyzico review preparation

Checked against https://www.iyzico.com/destek/yardim-merkezi on 2026-09-24
(section “Başvuru koşulları nelerdir?”). Approval remains iyzico’s decision.

## Provider requirements to complete

- A usable website with actual product and price information.
- Privacy, distance-sales agreement, delivery/return terms and about pages.
- Directly reachable contact details from the homepage, including business
  identity, address, email/phone, applicable registration/KEP and chamber details.
- HTTPS on the payment page, applicable business licenses, and required payment
  brand assets from the provider’s official package.

## Current site status

- HTTPS storefront/API available; live admin screens included in deployed bundle.
- Admin account successfully bootstrapped by the user in Coolify (id 1).
- Admin products/categories/campaigns forms implemented; /admin alias and automatic
  admin login navigation are in the latest local update, awaiting publication.
- Actual inventory and merchant-approved photos/prices need to replace demo stock.
- About/contact/privacy/sales/delivery-return routes and a draft/publish admin
  editor are now implemented locally. Deploy API then frontend to enable them.
  Actual merchant identity, customer-support details, shipping rules and approved
  policy content must still be entered and published via /yonetim/bilgiler.
- Payment integration, per-size inventory, order snapshots and end-to-end purchase
  flow are not complete. Checkout is explicitly disabled; no approval is claimed.

## Information needed from the merchant

Business type and registered name; business and return address; applicable
MERSIS/tax identity, KEP and chamber details; customer-service phone/email;
shipping fee, dispatch/delivery promise and return process; accurate about text;
approved privacy, distance-sales and delivery/return documents.

Do not publish invented business details, placeholder legal agreements, fabricated
payment acceptance or an iyzico approval badge. Add accurate pages once the merchant
supplies the missing details, then review the public site before submitting it.

## Technical release checks

Deploy API then frontend; log in with the existing admin; verify image persistence across API
redeploys; create/edit a real product; verify storefront discount/stock updates;
exercise mobile forms, anonymous access, non-admin denial, and deletion cancellation.
Use a sandbox payment account for payment testing when the integration milestone
is implemented. Do not use live customer charges as a readiness check.
