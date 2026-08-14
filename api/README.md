# Vercel Serverless API

Two endpoints, both deployed automatically when you push to Vercel.

## `POST /api/create-checkout`

Authenticated endpoint (Firebase ID token in `Authorization: Bearer …`).
Creates a fresh single-use Lemonsqueezy checkout via the LS API and returns
its `url`. The checkout includes `meta.custom_data.uid` so the webhook can
map the resulting subscription back to the Firebase user.

## `POST /api/lemonsqueezy-webhook`

Receives Lemonsqueezy subscription events, verifies the `X-Signature` HMAC,
and updates `users/{uid}.subscriptionStatus` (+ related fields) in Firestore
via the Firebase Admin SDK.

## Required env vars (Vercel → Project → Settings → Environment Variables)

See `../DEPLOYMENT.md` for the full setup walkthrough.

- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_VARIANT_ID`
- `LEMON_SQUEEZY_SIGNATURE_SECRET`
- `LEMON_SQUEEZY_HOST` (optional, defaults to `https://api.lemonsqueezy.com`)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Local testing

`vercel dev` runs both functions on `http://localhost:3000/api/...`.
