import crypto from 'node:crypto';
import { UserProfile } from '../src/types';

export const SESSION_SECRET = process.env.ADMIN_SECRET_KEY || process.env.SESSION_SECRET || 'sshsgymgo_signed_session_secret_2026';

export interface SignedSessionPayload {
  profile: UserProfile;
  issuedAt: number;
}

/**
 * Creates an HMAC-SHA256 signature for the stringified payload using secret.
 */
export function generateSignature(payloadStr: string, secret: string = SESSION_SECRET): string {
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

/**
 * Encodes user profile into an HMAC-SHA256 signed session token.
 * Format: <base64url_payload>.<signature_hex>
 */
export function createSignedSessionToken(profile: UserProfile, secret: string = SESSION_SECRET): string {
  const payload: SignedSessionPayload = {
    profile,
    issuedAt: Date.now()
  };

  const payloadStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(payloadStr, 'utf-8').toString('base64url');
  const signature = generateSignature(base64Payload, secret);

  return `${base64Payload}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token and returns the untampered UserProfile.
 * Returns null if token format is invalid or signature does not match.
 */
export function verifySessionToken(token: string | null | undefined, secret: string = SESSION_SECRET): UserProfile | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [base64Payload, providedSignature] = parts;
  if (!base64Payload || !providedSignature) {
    return null;
  }

  const expectedSignature = generateSignature(base64Payload, secret);

  // Constant time comparison to prevent timing attacks
  try {
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payloadStr = Buffer.from(base64Payload, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadStr) as SignedSessionPayload;

    if (!payload || !payload.profile || !payload.profile.studentId || !payload.profile.role) {
      return null;
    }

    return payload.profile;
  } catch {
    return null;
  }
}
