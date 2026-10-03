# Sip 'n' Dine — Hospitality Mobile App (PRD)

Premium Expo/React Native app for Sip 'n' Dine, Indian fine dining at SCO 16-A, Madhya Marg, Sector 7-C, Chandigarh. Guests browse freely; signing in (name, email, mobile) unlocks table bookings, takeaway ordering, member offers with single-use codes, and manager enquiries. Staff manage **everything** from an in-app admin panel.

## Design direction (locked by client)
Warm dark-brown palette from the client video: `#2A1E18` background, `#3A2A24` / `#5E4739` cards, `#D4A86A` gold accents, `#F5EEDC` cream text (all in `frontend/src/theme.ts`, incl. `scrim` keys). Brand logo at `frontend/assets/brand/logo.png` (transparent). Icons: `AppIcon` = SF Symbols on iOS, Ionicons elsewhere.

## Navigation
Tabs: **Home · Sign in / Log out (label switches with session) · Contact · More**.
Stack routes: `/offers`, `/membership`, `/banqueting`, `/gallery`, `/menu` (`?mode=takeaway`, `?category=Bar`), `/reserve`, `/notifications`, `/admin/*`.

## Screens
- **Home**: logo + brand + greeting + bell → **Book a table** hero card (first) → promo banner → tag grid (Membership, Offers & combos, Banqueting & catering, Takeaway order, Dine-in menu, Food & bar, Gallery, Book a table) → **Favourites & recommendations** → **New additions** (AI-generated dish photos, admin-replaceable) → Gallery strip → latest note.
- **Sign in / Log out**: logged out = sign-in pitch; logged in = member card, quick actions, my table requests, Log out.
- **Contact**: WhatsApp CTA, Call / Directions (Google Maps) / Email / Book, address card, hours, About Us, banqueting link.
- **More**: Membership, Offers & combos, Banqueting & catering, Dine-in menu, Takeaway, Gallery, Notifications + **Admin panel** (only entry point).
- **Menu**: category chips; takeaway mode adds a cart and sends the order on WhatsApp (sign-in required).
- **Reserve**: day chips (10 days), time slots, party stepper, occasion, note; sign-in required; success → nudge on WhatsApp.
- **Admin** (`/admin`, JWT): dashboard stats → Verify code (keypad) · Bookings & enquiries (status chips, call/WhatsApp) · Settings (every text, contact, about, photos) · Menu / Offers / Gallery / Notifications / Managers CRUD with photo upload · Customers & app usage · Redemption log · change password.

## Backend (FastAPI + MongoDB, `/api/*`)
Files: `server.py` (entry), `core.py` (db, JWT, bcrypt), `routes_public.py`, `routes_admin.py`, `seed.py`, `storage.py` (Emergent Object Storage), `generate_images.py` (one-off Nano Banana image generation → storage → `generated_images.json`).
- Public: `GET /home /settings /menu /offers /gallery /notifications /managers`, `POST /track` (device-level app opens), `POST /auth/sign-in`, `POST /offers/{id}/claim`, `POST /inquiries`, `POST /reservations`, `GET /reservations/mine/{customer_id}`, `GET /files/{path}` (image proxy, cached).
- Admin (Bearer): `POST /admin/login`, `GET /admin/me`, `POST /admin/password`, `GET /admin/stats`, `GET|PUT /admin/settings`, `GET|POST /admin/content/{menu|offers|gallery|notifications|managers}`, `PUT|DELETE /admin/content/{c}/{id}`, `POST /admin/upload` (multipart → object storage), `GET /admin/reservations` + `PATCH`, `GET /admin/inquiries` + `PATCH`, `GET /admin/customers`, `GET /admin/redemptions`, `POST /admin/verify`.
- Env: `MONGO_URL`, `DB_NAME`, `EMERGENT_LLM_KEY`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Discount anti-misuse
Sign-in with name/email/mobile required → per-member, per-offer 6-digit code, 60 s, single-use → cap of `max_per_day` redemptions per 24 h (admin-editable per offer) → max 5 code generations per hour → verification only by signed-in staff → full redemption log (codes hidden).

## Data
`settings` (singleton), `menu_items`, `offers`, `gallery`, `notifications`, `managers`, `customers`, `app_sessions`, `redemptions`, `reservations`, `inquiries`, `admins`, `uploads`.

## Tests
`backend/tests/test_sip_n_dine.py` (9 tests: home, menu+image proxy, tracking, reservations gating, claim/verify/cap, admin guards, settings roundtrip, content CRUD, admin lists).

## Backlog
- Real WhatsApp number from client (default +91 172 464 1656 used; editable in Admin → Settings → Contact).
- Points accrual on verified redemption; tier auto-upgrade.
