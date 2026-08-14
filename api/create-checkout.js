/**
 * POST /api/create-checkout
 *
 * Authenticates the caller with a Firebase ID token, then creates a fresh
 * Lemonsqueezy checkout via the LS API with custom_data.uid attached so the
 * webhook can map the resulting subscription back to the Firebase user.
 *
 * Required env (set in Vercel project settings):
 *   LEMON_SQUEEZY_API_KEY
 *   LEMON_SQUEEZY_STORE_ID
 *   LEMON_SQUEEZY_VARIANT_ID
 *   LEMON_SQUEEZY_HOST  (optional, defaults to https://api.lemonsqueezy.com)
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */
import admin from 'firebase-admin';
import { createCheckout } from './_lib/lemonsqueezy.js';

function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Authenticate the caller via Firebase ID token ──────────────
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/i);
  if (!match) return res.status(401).json({ error: 'Missing bearer token' });

  let decoded;
  try {
    decoded = await getAdmin().auth().verifyIdToken(match[1]);
  } catch (e) {
    console.warn('verifyIdToken failed:', e.message);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const uid   = decoded.uid;
  const email = decoded.email || (req.body && req.body.email) || undefined;
  const name  = (req.body && req.body.name) || decoded.name || undefined;

  try {
    const origin = req.headers.origin
                || `https://${req.headers.host || 'manifest-hub.com'}`;
    const { url } = await createCheckout({
      uid,
      email,
      name,
      redirectUrl: `${origin}/dashboard?upgraded=1`,
    });
    return res.status(200).json({ url });
  } catch (e) {
    console.error('create-checkout error:', e);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
