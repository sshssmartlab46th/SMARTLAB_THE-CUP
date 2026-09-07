import { getAccessToken } from './firebase';

export interface WorkspaceFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export interface ContactPerson {
  resourceName: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  photoUrl?: string;
}

// 1. Google Drive & Picker
export async function listDriveFiles(query?: string): Promise<WorkspaceFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Workspace 인증이 필요합니다.');

  const q = query ? encodeURIComponent(query) : encodeURIComponent("trashed = false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,webViewLink,modifiedTime)&pageSize=15`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Drive 파일 목록을 불러오지 못했습니다.');
  }

  const data = await res.json();
  return data.files || [];
}

// 2. Google Calendar
export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Workspace 인증이 필요합니다.');

  const timeMin = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&maxResults=10&orderBy=startTime&singleEvents=true`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Calendar 일정을 불러오지 못했습니다.');
  }

  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(event: {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
}): Promise<CalendarEvent> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Workspace 인증이 필요합니다.');

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startDateTime },
        end: { dateTime: event.endDateTime },
        location: event.location,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || '캘린더 일정 추가에 실패했습니다.');
  }

  return await res.json();
}

// 3. Gmail Notification Broadcast
export async function sendGmailAlert(to: string, subject: string, bodyText: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Workspace 인증이 필요합니다.');

  // UTF-8 base64 encoded RFC 2822 email format
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText,
  ];
  const message = messageParts.join('\r\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || '이메일 발송에 실패했습니다.');
  }

  return true;
}

// 4. Google Sheets (Festival Match Score Records)
export async function createScoreSpreadsheet(title: string, matchRows: Array<[string, string, string, number, number, string]>): Promise<{ id: string; url: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Workspace 인증이 필요합니다.');

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: `[상산고] ${title}` },
      sheets: [
        {
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: '종목' } },
                    { userEnteredValue: { stringValue: '경기 라운드' } },
                    { userEnteredValue: { stringValue: '팀 A' } },
                    { userEnteredValue: { stringValue: '점수 A' } },
                    { userEnteredValue: { stringValue: '점수 B' } },
                    { userEnteredValue: { stringValue: '팀 B' } },
                  ],
                },
                ...matchRows.map((r) => ({
                  values: [
                    { userEnteredValue: { stringValue: r[0] } },
                    { userEnteredValue: { stringValue: r[1] } },
                    { userEnteredValue: { stringValue: r[2] } },
                    { userEnteredValue: { numberValue: r[3] } },
                    { userEnteredValue: { numberValue: r[4] } },
                    { userEnteredValue: { stringValue: r[5] } },
                  ],
                })),
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Google Sheets 생성에 실패했습니다.');
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    url: data.spreadsheetUrl,
  };
}

// 5. Google Tasks (Referee / Staff Checklist)
export async function listGoogleTasks(): Promise<GoogleTask[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Workspace 인증이 필요합니다.');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || '할 일(Tasks) 목록을 불러오지 못했습니다.');
  }

  const data = await res.json();
  return (data.items || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    notes: t.notes,
    status: t.status,
    due: t.due,
  }));
}

export async function createGoogleTask(title: string, notes?: string): Promise<GoogleTask> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Workspace 인증이 필요합니다.');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, notes }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Task 추가에 실패했습니다.');
  }

  return await res.json();
}

// 6. Google Contacts (Faculty & Council Directory)
export async function listDirectoryContacts(): Promise<ContactPerson[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Workspace 인증이 필요합니다.');

  const res = await fetch(
    `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=20`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || '연락처 목록을 불러오지 못했습니다.');
  }

  const data = await res.json();
  return (data.connections || []).map((c: any) => ({
    resourceName: c.resourceName,
    displayName: c.names?.[0]?.displayName || '이름 없음',
    email: c.emailAddresses?.[0]?.value,
    phoneNumber: c.phoneNumbers?.[0]?.value,
    photoUrl: c.photos?.[0]?.url,
  }));
}
