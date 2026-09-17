/**
 * Safe confirmation utility that catches iframe sandboxing SecurityError
 * and returns false gracefully if window.confirm is blocked.
 */
export function safeConfirm(message: string, fallbackDefault: boolean = false): boolean {
  if (typeof window === 'undefined') return fallbackDefault;
  try {
    return window.confirm(message);
  } catch (err) {
    console.warn('[safeConfirm] window.confirm was blocked by iframe/browser security policy:', err);
    return fallbackDefault;
  }
}
