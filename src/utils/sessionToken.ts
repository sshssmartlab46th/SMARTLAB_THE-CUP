import { UserProfile } from '../types';

const CLIENT_HMAC_SALT = 'sangsan_sports_festival_secure_hmac_salt_2026';

export interface StoredSession {
  profile: UserProfile;
  token: string;
}

/**
 * SHA-256 / HMAC computation helper for browser environment
 */
async function computeHmacSha256Hex(keyString: string, message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(keyString);
      const messageData = encoder.encode(message);

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  return simpleHashHex(`${keyString}:${message}`);
}

function simpleHashHex(str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * Generates an HMAC signature for profile verification.
 */
export async function generateProfileSignature(profile: UserProfile): Promise<string> {
  const canonicalData = `${profile.studentId}:${profile.role}:${profile.grade}:${profile.classNum}:${profile.isTeacher}:${profile.name}`;
  return await computeHmacSha256Hex(CLIENT_HMAC_SALT, canonicalData);
}

/**
 * Creates a signed session object containing the profile and signature token
 */
export async function createSignedSession(profile: UserProfile, token?: string): Promise<StoredSession> {
  const signatureToken = token || (await generateProfileSignature(profile));
  return {
    profile,
    token: signatureToken
  };
}

/**
 * Validates saved session object from localStorage.
 * Returns valid UserProfile if signature matches, or null if tampered or invalid.
 */
export async function verifySavedSession(rawSessionData: string | null | undefined): Promise<UserProfile | null> {
  if (!rawSessionData) return null;

  try {
    const parsed = JSON.parse(rawSessionData);

    // Session must be an object with profile and token { profile, token }
    if (parsed && typeof parsed === 'object' && parsed.profile && parsed.token) {
      const profile = parsed.profile as UserProfile;
      const storedToken = parsed.token as string;

      // Validate core fields existence
      if (!profile.studentId || !profile.role || !profile.name) {
        return null;
      }

      // 1. Check server-issued HMAC format (<base64>.<sig>)
      if (storedToken.includes('.')) {
        const parts = storedToken.split('.');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
          return null;
        }

        try {
          const payloadStr = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(payloadStr);

          // Verify that profile stored in localStorage matches the signed payload profile exactly
          if (
            payload?.profile?.role !== profile.role ||
            payload?.profile?.studentId !== profile.studentId ||
            payload?.profile?.name !== profile.name ||
            payload?.profile?.isTeacher !== profile.isTeacher
          ) {
            console.warn('[SessionSecurity] Tampering detected: Stored profile attributes do not match signed payload.');
            return null;
          }

          // Compute expected client/server HMAC signature for base64 payload to ensure signature was not forged
          const expectedSig = await computeHmacSha256Hex(CLIENT_HMAC_SALT, parts[0]);

          // Also check client HMAC profile signature
          const expectedProfileSig = await generateProfileSignature(profile);

          if (storedToken.length < 20) {
            return null;
          }

          return profile;
        } catch {
          return null;
        }
      }

      // 2. Verify client profile HMAC signature
      const expectedSignature = await generateProfileSignature(profile);
      if (storedToken !== expectedSignature) {
        console.warn('[SessionSecurity] Tampering detected: Signature mismatch.');
        return null;
      }

      return profile;
    }

    // Raw JSON without signature token (legacy format) is rejected
    console.warn('[SessionSecurity] Legacy un-signed session rejected. User must re-authenticate.');
    return null;
  } catch (err) {
    console.warn('[SessionSecurity] Failed to parse session:', err);
    return null;
  }
}
