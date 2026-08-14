/**
 * POST /api/lemonsqueezy-webhook
 *
 * Verifies the X-Signature HMAC against LEMON_SQUEEZY_SIGNATURE_SECRET, then
 * applies the subscription state change to users/{uid} via Firebase Admin.
 *
 * Required env:
 *   LEMON_SQUEEZY_SIGNATURE_SECRET   (signing secret of THIS specific webhook)
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */
import admin from 'firebase-admin';
import { verifyWebhookSignature } from './_lib/lemonsqueezy.js';

function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin.firestore();
}

// Map LS event names → our internal status strings.
function deriveStatus(eventName, attr) {
  switch (eventName) {
    case 'subscription_created':
    case 'subscription_resumed':
    case 'subscription_payment_success':
    case 'subscription_payment_recovered':
    case 'subscription_updated':
      return attr.cancelled ? 'cancelled' : 'active';
    case 'subscription_cancelled':
      return 'cancelled';
    case 'subscription_expired':
    case 'subscription_payment_failed':
      return 'expired';
    default:
      return null;
  }
}

// Vercel needs the raw body (Buffer) for signature verification.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method not allowed');
  }

  let raw;
  try { raw = await readRawBody(req); }
  catch { return res.status(400).send('Could not read body'); }

  if (!verifyWebhookSignature(raw, req.headers['x-signature'])) {
    console.warn('Invalid signature on Lemonsqueezy webhook');
    return res.status(401).send('Invalid signature');
  }

  let payload;
  try { payload = JSON.parse(raw.toString('utf8')); }
  catch { return res.status(400).send('Invalid JSON'); }

  const eventName  = payload?.meta?.event_name;
  const customData = payload?.meta?.custom_data || {};
  const uid        = customData.uid;
  const data       = payload?.data?.attributes || {};

  if (!uid) {
    console.warn(`Webhook ${eventName}: missing custom_data.uid — ignoring`);
    return res.status(200).send('No uid');
  }

  const status = deriveStatus(eventName, data);
  if (!status) return res.status(200).send('Ignored');

  const updates = {
    subscriptionStatus:         status,
    lemonsqueezyCustomerId:     String(data.customer_id     || ''),
    lemonsqueezySubscriptionId: String(payload.data?.id     || ''),
    lemonsqueezyVariantId:      String(data.variant_id      || ''),
    subscriptionUpdatedAt:      admin.firestore.FieldValue.serverTimestamp(),
  };
  if (data.renews_at) {
    updates.subscriptionExpiresAt =
      admin.firestore.Timestamp.fromDate(new Date(data.renews_at));
  } else if (data.ends_at) {
    updates.subscriptionExpiresAt =
      admin.firestore.Timestamp.fromDate(new Date(data.ends_at));
  }
  if (data.urls?.customer_portal) {
    updates.lemonsqueezyCustomerPortalUrl = data.urls.customer_portal;
  }

  try {
    await getDb().doc(`users/${uid}`).set(updates, { merge: true });
    console.log(`✓ ${eventName} → ${uid} → ${status}`);
    return res.status(200).send('OK');
  } catch (e) {
    console.error('Firestore update failed:', e);
    return res.status(500).send('Storage error');
  }
}
