/**
 * Shared helpers for Lemonsqueezy server-side integration.
 * Used by /api/create-checkout and /api/lemonsqueezy-webhook.
 */
import crypto from 'node:crypto';

const DEFAULT_HOST = 'https://api.lemonsqueezy.com';

export function lsHost() {
  return (process.env.LEMON_SQUEEZY_HOST || DEFAULT_HOST).replace(/\/$/, '');
}

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

/**
 * Create a checkout via Lemonsqueezy API.
 *
 * Docs: https://docs.lemonsqueezy.com/api/checkouts/create-checkout
 *
 * Returns the cart URL the client should redirect to (or open in Lemon.js).
 */
export async function createCheckout({ uid, email, name, redirectUrl }) {
  const apiKey   = requireEnv('LEMON_SQUEEZY_API_KEY');
  const storeId  = requireEnv('LEMON_SQUEEZY_STORE_ID');
  const variant  = requireEnv('LEMON_SQUEEZY_VARIANT_ID');

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        // Single-use checkout that expires after 24h — fine for our case
        // (clicking "Upgrade" creates a fresh one each time).
        checkout_data: {
          email: email || undefined,
          name:  name  || undefined,
          // `meta.custom_data.uid` will arrive in every webhook for this
          // subscription, letting us map back to the Firebase user.
          custom: { uid: String(uid || '') },
        },
        product_options: redirectUrl ? { redirect_url: redirectUrl } : undefined,
      },
      relationships: {
        store:   { data: { type: 'stores',   id: String(storeId) } },
        variant: { data: { type: 'variants', id: String(variant) } },
      },
    },
  };

  const resp = await fetch(`${lsHost()}/v1/checkouts`, {
    method: 'POST',
    headers: {
      'Accept':        'application/vnd.api+json',
      'Content-Type':  'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Lemonsqueezy create-checkout failed: ${resp.status} ${text}`);
  }

  const json = await resp.json();
  const url = json?.data?.attributes?.url;
  if (!url) throw new Error('Lemonsqueezy response missing data.attributes.url');
  return { url, raw: json };
}

/**
 * Verify a Lemonsqueezy webhook payload.
 * Returns true if the X-Signature header matches HMAC-SHA256(body, secret).
 *
 * `rawBody` MUST be the raw bytes — do NOT re-stringify a parsed JSON body
 * (it changes whitespace / key order and the HMAC will mismatch).
 */
export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.LEMON_SQUEEZY_SIGNATURE_SECRET
              || process.env.LEMON_SQUEEZY_WEBHOOK_SECRET; // backward-compat alias
  if (!secret) throw new Error('Missing LEMON_SQUEEZY_SIGNATURE_SECRET');
  if (!signatureHeader) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(String(signatureHeader), 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}
