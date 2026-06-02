# Security Specification: ZafNira Spice Store

This spec outlines the attribute-based access control (ABAC) and security invariants for the Firestore collections of ZafNira.

## 1. Core Data Invariants
- **Categories**: Read is public. Write/Edit is strictly restricted to authenticated Admins. Names and images have strict size bounds to block Resource Poisoning attacks.
- **Products**: Read is public. Write/Edit is restricted to Admins. Prices and stock numbers must be non-negative.
- **Orders**: A user can only see/list/create their own orders (`userId == request.auth.uid`), unless the requesting user is an Admin.
- **Coupons**: General public can check/read any single coupon to validate it. CRUD is Admin-only. Usage limits must be maintained.
- **Popups**: Anyone can read active popups. CRUD is Admin-only.
- **CMSConfig**: Anyone can read the shop configuration (global pages, layout and prices), but editing is strictly Admin-only.

## 2. The Dirty Dozen Payloads
We test 12 malicious or structural bypass attempts in our environment to verify they are rejected with `PERMISSION_DENIED`:
1. **Admin Impersonation**: Create a category with a random UID setting `isAdmin: true` on the user profile or setting role directly.
2. **Order Hijacking (Read)**: Attempt to read someone else's order document.
3. **Order Spoofing (Write)**: Create a new order with a different user's `userId`.
4. **Negative Product Pricing**: Create/update a product with a price equal to -10 SAR.
5. **Junk ID Resource Exhaustion**: Create a Category using an extremely large string (e.g., 2000 characters of junk) as the Document ID.
6. **Self-Generated Coupon code**: Non-Admin user attempt to write active coupon offering 99% off with no expiry.
7. **Bypassing Category Schema**: Creating a Category without mandatory fields (`slug`).
8. **Malicious CMS Defacement**: Anonymous user overwriting page content or banners in `cms_config/homepage`.
9. **Tampering with Order Status**: Standard customer updates order status directly to `delivered` or `shipped`.
10. **Bypassing Server Timestamp Integrity**: Setting local client system clock time in `createdAt`.
11. **Illegal Field Injection (Ghost Field)**: Update a product adding a ghost field `isFlagged: true` that is not allowed.
12. **Double-Applying or Illegal Price Update**: Standard user updates `totalSAR` on an existing order after checked out.

## 3. The Rules Layout (Draft)

We will implement the firestore security rules checking both standard email lists (including the bootstrapped admin `farukbangla53@gmail.com`) and dedicated document entries.
The Rules verify that all requests are validated, types match, and proper roles are assigned.
