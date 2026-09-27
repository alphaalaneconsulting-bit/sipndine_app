# Sip 'N' Dine — Hospitality Mobile App (PRD)

Premium Expo/React Native hospitality app for a Chandigarh restaurant group. Members join free, unlock in-house / buffet / combo discounts through short-lived single-use codes, browse the promotion gallery, and contact managers for banqueting or corporate dining.

## Product goals (from client artifacts)
1. Customer privileges club with a tiered digital card.
2. In-house discount redemption that cannot be misused (single-use, 60-second codes).
3. Buffet, combo, and restaurant offer management.
4. Manager enquiries for banqueting / private dining / catering.
5. Notifications for upcoming events and festival greetings.
6. Promotion gallery to showcase all offerings.
7. Homepage tag grid (Membership · Offers & combos · Banqueting & catering · Gallery · Take away · Dine in · Menu · Favorites & recommendations · New additions) — verbatim from the client's recommendations doc.
8. Staff verification panel for redemption codes.

## Design direction
Warm dark-brown hospitality palette pulled from the client walkthrough video: `#2A1E18` background, `#3A2A24` / `#5E4739` cards, `#D4A86A` golden beige accents, `#F5EEDC` creamy text. All colors flow from `frontend/src/theme.ts`.

## Architecture
- **Frontend**: Expo Router (SDK 57), four tabs (Home, Offers, Club, More) + `/admin` route.
- **Backend**: FastAPI + MongoDB. All routes under `/api/*`.
- **State**: Session persisted with AsyncStorage (`lumiere_customer` key kept for backwards compat).

## Backend endpoints
- `GET  /api/home`
- `GET  /api/offers`
- `GET  /api/gallery`
- `GET  /api/notifications`
- `GET  /api/managers`
- `POST /api/auth/sign-in` — creates or reuses membership from name/email/phone.
- `GET  /api/membership/{customer_id}`
- `POST /api/offers/{offer_id}/claim` — mints a 6-digit code valid 60s.
- `POST /api/redemptions/{redemption_id}/verify` — legacy verify by id + code.
- `POST /api/redemptions/verify` — **staff panel**: verify by code alone, returns 404/409/410 for missing / already-redeemed / expired.
- `POST /api/inquiries` — member-gated banqueting / concierge enquiry (returns 401 without a valid `customer_id`).

## Screens
- **Home (`app/(tabs)/index.tsx`)**: greeting + gold hero, promotional banner from the top offer, homepage tag grid (9 tags, all navigating to the correct section), "Favorites & recommendations" carousel, promotion gallery, upcoming notification note, staff panel entry, "Call the house" footer.
- **Offers**: filter chips (All · In-house · Buffet · Combo), offer cards with "Get ur discount" CTA when logged out; live 60-second code modal after claim.
- **Club**: privileges card, tier progress, digital member card with points, sign out.
- **More**: manager list with Call / WhatsApp / Enquire, member-gated enquiry sheet, promotion gallery tiles, notifications list, call-the-house footer.
- **Admin (`app/admin.tsx`)**: staff keypad + text input to enter a 6-digit code. Handles success / expired / already-redeemed / not-found. No login (host device physical control assumption).

## Security notes
- Manager enquiries require a valid `customer_id`. Anonymous POST returns 401.
- Redemption codes are per-guest, per-offer, expire in 60 seconds and are single-use. Screenshots cannot be reused.
- No hardcoded URLs / secrets. Backend reads `MONGO_URL` + `DB_NAME` from env. Frontend reads `EXPO_PUBLIC_BACKEND_URL`.

## Test coverage
- Static: TypeScript + ESLint clean.
- Backend curl: anonymous inquiry → 401; member inquiry → 200 with "Received"; claim + verify happy path; retry verify → 409; unknown code → 404.
- E2E screenshot: home + admin panel verified.

## Backlog / next
- Optional: member-facing loyalty tier progression animations.
- Optional: manager availability calendar.
- Optional: push notifications for new offers (needs Emergent-managed push key + real device build).
