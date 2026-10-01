import { MatchItem } from '../types';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the Service Worker for PWA capabilities and background push notifications.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    console.log('[NotificationService] Service Worker registered:', reg.scope);
    return reg;
  } catch (err) {
    console.warn('[NotificationService] Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Get active Service Worker registration
 */
export async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    swRegistration = (await navigator.serviceWorker.getRegistration()) || null;
    if (!swRegistration) {
      swRegistration = await registerServiceWorker();
    }
  }
  return swRegistration;
}

/**
 * Request notification permission from the user browser.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('[NotificationService] Request permission error:', e);
    return Notification.permission;
  }
}

/**
 * Display a background push notification through Service Worker.
 * Falls back to standard Notification if SW is unavailable.
 */
export async function sendSWNotification(
  title: string,
  options: NotificationOptions & { url?: string } = {}
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[NotificationService] Permission not granted for notification');
    return false;
  }

  const notificationOptions = {
    icon: '/images/sangsan_logo.png',
    badge: '/images/sangsan_logo.png',
    tag: 'sangsan-match-alert',
    renotify: true,
    data: { url: options.url || '/' },
    ...options
  };

  try {
    const reg = await getSWRegistration();
    if (reg && reg.showNotification) {
      // Use Service Worker's showNotification (runs in background and handles device system notification)
      await reg.showNotification(title, notificationOptions);
      return true;
    } else if (reg && reg.active) {
      reg.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: notificationOptions
      });
      return true;
    }
  } catch (e) {
    console.warn('[NotificationService] Service Worker showNotification failed, using fallback:', e);
  }

  // Fallback to standard Notification API
  try {
    new Notification(title, notificationOptions);
    return true;
  } catch (e) {
    console.error('[NotificationService] Notification construction failed:', e);
    return false;
  }
}

const NOTIFIED_STORAGE_KEY_PREFIX = 'sangsan_notified_15m_';

/**
 * Check match schedules and automatically trigger 15-minute pre-match notifications
 * for all upcoming matches or user bookmarked matches.
 */
export function checkAndTrigger15MinMatchNotifications(
  matches: MatchItem[],
  userReminders: string[] = []
): void {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const prefPush = localStorage.getItem('sangsan_pref_push');
  if (prefPush === 'false') {
    return;
  }

  const now = Date.now();

  matches.forEach((match) => {
    if (match.status === 'FINISHED') return;

    // Determine target start timestamp
    const targetTimeString = match.startTime || match.scheduledTime;
    if (!targetTimeString) return;

    const matchTime = new Date(targetTimeString).getTime();
    if (isNaN(matchTime)) return;

    const diffMinutes = (matchTime - now) / (1000 * 60);

    // Trigger if match starts in 10 to 16 minutes (approx. 15분 전) or if specifically reminded
    const isBookmarked = userReminders.includes(match.id);
    const isWithin15MinWindow = diffMinutes >= 0 && diffMinutes <= 16;

    if (isWithin15MinWindow || (isBookmarked && diffMinutes >= 0 && diffMinutes <= 20)) {
      const storageKey = `${NOTIFIED_STORAGE_KEY_PREFIX}${match.id}`;
      const alreadyNotified = localStorage.getItem(storageKey);

      if (!alreadyNotified) {
        const title = `[경기 15분 전 알림] ${match.title}`;
        const body = `[${match.round}] ${match.homeTeam} vs ${match.awayTeam}\n장소: ${match.court || '대운동장'}\n잠시 후 경기가 시작됩니다! 코트에 집결해주세요.`;

        sendSWNotification(title, {
          body,
          tag: `match-15m-${match.id}`,
          data: { matchId: match.id, url: '/' }
        });

        localStorage.setItem(storageKey, new Date().toISOString());
      }
    }
  });
}
