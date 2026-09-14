/**
 * Korean Standard Time (KST, Asia/Seoul, UTC+9) Utility Module
 * Ensures all time standards across the application strictly follow Korean Standard Time.
 */

export const KST_TIMEZONE = 'Asia/Seoul';

/**
 * Returns current date and time components strictly according to Korean Standard Time (Asia/Seoul).
 */
export function getKSTNowParts(): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dateStr: string; // 'YYYY-MM-DD'
  timeStr: string; // 'HH:mm'
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const getVal = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  const year = Number(getVal('year'));
  const month = Number(getVal('month'));
  const day = Number(getVal('day'));
  const hour = Number(getVal('hour'));
  const minute = Number(getVal('minute'));
  const second = Number(getVal('second'));

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return { year, month, day, hour, minute, second, dateStr, timeStr };
}

/**
 * Extracts 'YYYY-MM-DD' and 'HH:mm' in KST from any timestamp or ISO string.
 * Used for date/time input fields in Admin consoles and modals.
 */
export function parseKSTDateAndTime(dateOrStr?: string | number | Date | null): { date: string; time: string } {
  if (!dateOrStr) {
    const fallback = getKSTNowParts();
    return { date: fallback.dateStr, time: fallback.timeStr };
  }

  const d = new Date(dateOrStr);
  if (isNaN(d.getTime())) {
    const fallback = getKSTNowParts();
    return { date: fallback.dateStr, time: fallback.timeStr };
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const getVal = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  const year = getVal('year');
  const month = getVal('month');
  const day = getVal('day');
  const hour = getVal('hour');
  const minute = getVal('minute');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`
  };
}

/**
 * Combines date string ('YYYY-MM-DD') and time string ('HH:mm' or 'HH:mm:ss')
 * into an authoritative ISO 8601 string anchored in Korean Standard Time (+09:00).
 */
export function toKSTIsoString(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();
  const normalizedTime = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime;
  // Explicit KST offset +09:00
  const kstFormatted = `${cleanDate}T${normalizedTime}+09:00`;
  const parsed = new Date(kstFormatted);
  if (isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

/**
 * Formats time strictly according to Korean Standard Time (KST) in 24-hour format 'HH:mm'.
 */
export function formatKSTTime(isoOrDate?: string | number | Date | null): string {
  if (!isoOrDate) return '-';
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return String(isoOrDate);

  return d.toLocaleTimeString('ko-KR', {
    timeZone: KST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Formats date strictly according to Korean Standard Time (KST), e.g. '2026. 09. 14.'.
 */
export function formatKSTDate(isoOrDate?: string | number | Date | null): string {
  if (!isoOrDate) return '-';
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('ko-KR', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formats date and time strictly according to Korean Standard Time (KST), e.g. '2026. 09. 14. 14:30'.
 */
export function formatKSTDateTime(isoOrDate?: string | number | Date | null): string {
  if (!isoOrDate) return '-';
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleString('ko-KR', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Parse any format of match start time into epoch milliseconds anchored in KST.
 * Handles ISO strings, full date-times with or without offset, and 'HH:mm' format.
 */
export function parseMatchStartTimeKST(startTimeStr?: string | null): number | null {
  if (!startTimeStr) return null;
  const trimmed = startTimeStr.trim();

  // 1. Time only format: 'HH:mm' or 'H:mm' -> treat as today in KST
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const { dateStr } = getKSTNowParts();
    const [h, m] = trimmed.split(':').map((s) => s.padStart(2, '0'));
    const kstString = `${dateStr}T${h}:${m}:00+09:00`;
    const dt = new Date(kstString);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  // 2. Date + Time without explicit timezone: 'YYYY-MM-DDTHH:mm(:ss)?'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const kstString = `${withSeconds}+09:00`;
    const dt = new Date(kstString);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  // 3. Date string without time: 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const kstString = `${trimmed}T00:00:00+09:00`;
    const dt = new Date(kstString);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  // 4. Already has timezone offset or 'Z'
  const directDate = new Date(trimmed);
  if (!isNaN(directDate.getTime())) {
    return directDate.getTime();
  }

  return null;
}
