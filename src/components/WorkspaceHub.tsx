import React, { useState, useEffect } from 'react';
import {
  listDriveFiles,
  listCalendarEvents,
  createCalendarEvent,
  sendGmailAlert,
  createScoreSpreadsheet,
  listGoogleTasks,
  createGoogleTask,
  listDirectoryContacts,
  WorkspaceFile,
  CalendarEvent,
  GoogleTask,
  ContactPerson,
} from '../lib/workspace';
import { googleSignIn, getAccessToken, logout } from '../lib/firebase';
import { Match } from '../types';
import {
  Cloud,
  FileSpreadsheet,
  Calendar,
  Mail,
  FolderOpen,
  CheckSquare,
  Video,
  Users,
  Presentation,
  FileText,
  ExternalLink,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface WorkspaceHubProps {
  matches: Match[];
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({ matches }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    'drive' | 'sheets' | 'calendar' | 'gmail' | 'tasks' | 'meet' | 'docs' | 'contacts'
  >('sheets');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Data states
  const [driveFiles, setDriveFiles] = useState<WorkspaceFile[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);

  // Action states
  const [newCalTitle, setNewCalTitle] = useState('상산고 축구 8강 1경기');
  const [newCalTime, setNewCalTime] = useState('2026-05-15T10:00:00+09:00');
  const [emailTo, setEmailTo] = useState('student@sangsan.hs.kr');
  const [emailSubject, setEmailSubject] = useState('[상산 체육대회] 경기 개시 15분 전 긴급 안내');
  const [emailBody, setEmailBody] = useState(
    '인조잔디 대운동장 A코트에서 2학년 1반 vs 2학년 2반 축구 경기가 곧 시작됩니다. 양 팀 선수들은 본부석으로 집결해 주시기 바랍니다.'
  );
  const [newTaskTitle, setNewTaskTitle] = useState('축구 골대 그물망 및 라인 마킹 최종 점검');
  const [lastCreatedSheetUrl, setLastCreatedSheetUrl] = useState<string | null>(null);

  // Destructive / mutating operation confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = await getAccessToken();
    setIsAuthenticated(!!token);
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await googleSignIn();
      await checkAuthStatus();
      setStatusMessage('Google Workspace에 성공적으로 연동되었습니다.');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`연동 실패: ${err.message || '인증이 취소되었습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setStatusMessage('연동이 해제되었습니다.');
  };

  // 1. Google Drive load
  const loadDriveFiles = async () => {
    try {
      setLoading(true);
      const files = await listDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      setStatusMessage(`Drive 조회 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Calendar load & create
  const loadCalendarEvents = async () => {
    try {
      setLoading(true);
      const events = await listCalendarEvents();
      setCalendarEvents(events);
    } catch (err: any) {
      setStatusMessage(`Calendar 조회 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalendarEvent = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Google Calendar 일정 등록 확인',
      description: `"${newCalTitle}" 일정을 사용자 구글 캘린더에 직접 추가하시겠습니까?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await createCalendarEvent({
            summary: `[상산고 체육대회] ${newCalTitle}`,
            description: 'THE SANGSAN 대회 운영 플랫폼에서 자동 동기화된 경기 일정입니다.',
            startDateTime: newCalTime,
            endDateTime: new Date(new Date(newCalTime).getTime() + 45 * 60000).toISOString(),
            location: '전북 전주시 완산구 거마평로 130 상산고등학교',
          });
          setStatusMessage('Google Calendar에 경기 일정이 성공적으로 등록되었습니다.');
          loadCalendarEvents();
        } catch (err: any) {
          setStatusMessage(`캘린더 등록 오류: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 3. Gmail send
  const handleSendGmail = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Gmail 긴급 안내 발송 확인',
      description: `수신자 "${emailTo}"에게 체육대회 공식 알림 이메일을 전송하시겠습니까?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await sendGmailAlert(emailTo, emailSubject, emailBody);
          setStatusMessage(`"${emailTo}"님에게 Gmail 알림이 발송되었습니다.`);
        } catch (err: any) {
          setStatusMessage(`Gmail 발송 실패: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 4. Google Sheets export
  const handleExportToSheets = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Google Sheets 실시간 점수표 생성 확인',
      description:
        '현재 진행 중인 모든 종목의 실시간 경기 스코어와 타임라인을 새 구글 스프레드시트에 작성하시겠습니까?',
      onConfirm: async () => {
        try {
          setLoading(true);
          const rows: Array<[string, string, string, number, number, string]> = matches.map(
            (m) => [m.sport, m.round, m.teamA, m.scoreA, m.scoreB, m.teamB]
          );
          const sheet = await createScoreSpreadsheet('체육대회 실시간 스코어보드', rows);
          setLastCreatedSheetUrl(sheet.url);
          setStatusMessage('Google Sheets 스프레드시트가 성공적으로 생성되었습니다.');
        } catch (err: any) {
          setStatusMessage(`Sheets 생성 오류: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 5. Google Tasks
  const loadTasks = async () => {
    try {
      setLoading(true);
      const items = await listGoogleTasks();
      setTasks(items);
    } catch (err: any) {
      setStatusMessage(`Tasks 조회 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Google Tasks 심판부 체크리스트 추가',
      description: `"${newTaskTitle}" 항목을 구글 할 일 목록에 추가하시겠습니까?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await createGoogleTask(newTaskTitle, 'THE SANGSAN 체육대회 운영본부 자동 생성 과업');
          setStatusMessage('Google Tasks에 새로운 과업이 등록되었습니다.');
          setNewTaskTitle('');
          loadTasks();
        } catch (err: any) {
          setStatusMessage(`Tasks 생성 실패: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 6. Google Contacts
  const loadContacts = async () => {
    try {
      setLoading(true);
      const list = await listDirectoryContacts();
      setContacts(list);
    } catch (err: any) {
      setStatusMessage(`연락처 조회 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Auth Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-900 to-slate-950 flex items-center justify-center border border-red-800/80 shadow-md">
            <Cloud className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
              Google Workspace 공식 클라우드 통합 허브
            </h3>
            <p className="text-xs text-slate-400">
              Drive, Sheets, Gmail, Calendar, Docs, Slides, Tasks, Meet, Forms, Contacts 연동
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Workspace 연결됨
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800"
              >
                연결 해제
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <Cloud className="w-4 h-4" />
              Google Workspace 원클릭 연동
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-slate-900 border border-red-900/60 rounded-xl text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
        {[
          { id: 'sheets', label: 'Google Sheets (점수표)', icon: FileSpreadsheet },
          { id: 'calendar', label: 'Google Calendar (일정)', icon: Calendar },
          { id: 'gmail', label: 'Gmail (긴급알림)', icon: Mail },
          { id: 'drive', label: 'Google Drive & Picker (자료)', icon: FolderOpen },
          { id: 'tasks', label: 'Google Tasks (체크리스트)', icon: CheckSquare },
          { id: 'meet', label: 'Google Meet & Chat (회의실)', icon: Video },
          { id: 'docs', label: 'Docs & Slides (규정·발표)', icon: Presentation },
          { id: 'contacts', label: 'Contacts (교직원·반장)', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'drive') loadDriveFiles();
                if (tab.id === 'calendar') loadCalendarEvents();
                if (tab.id === 'tasks') loadTasks();
                if (tab.id === 'contacts') loadContacts();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-red-900 text-white shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}

      {/* 1. Google Sheets */}
      {activeTab === 'sheets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                체육대회 실시간 스코어보드 스프레드시트 동기화
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                축구, 농구, 피구, 계주 등 실시간 점수와 진출 현황을 Google Sheets로 내보냅니다.
              </p>
            </div>
            <button
              onClick={handleExportToSheets}
              disabled={!isAuthenticated || loading}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow"
            >
              Google Sheets로 즉시 생성
            </button>
          </div>

          {lastCreatedSheetUrl && (
            <div className="p-4 bg-slate-950 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-semibold">
                생성된 스프레드시트가 준비되었습니다!
              </span>
              <a
                href={lastCreatedSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-bold"
              >
                Google Sheets 열기 <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">종목</th>
                  <th className="py-2.5 px-3">라운드</th>
                  <th className="py-2.5 px-3">팀 A</th>
                  <th className="py-2.5 px-3 text-center">스코어</th>
                  <th className="py-2.5 px-3">팀 B</th>
                  <th className="py-2.5 px-3">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {matches.map((m) => (
                  <tr key={m.id} className="text-slate-200">
                    <td className="py-2 px-3 font-semibold text-red-400">{m.sport}</td>
                    <td className="py-2 px-3">{m.round}</td>
                    <td className="py-2 px-3">{m.teamA}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-amber-400">
                      {m.scoreA} : {m.scoreB}
                    </td>
                    <td className="py-2 px-3">{m.teamB}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Google Calendar */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5 font-serif">
              <Plus className="w-4 h-4 text-amber-400" />
              캘린더에 경기 일정 추가
            </h4>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">경기명 / 일정</label>
              <input
                type="text"
                value={newCalTitle}
                onChange={(e) => setNewCalTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">개시 일시</label>
              <input
                type="datetime-local"
                value={newCalTime.slice(0, 16)}
                onChange={(e) => setNewCalTime(`${e.target.value}:00+09:00`)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <button
              onClick={handleCreateCalendarEvent}
              disabled={!isAuthenticated || loading}
              className="w-full py-2.5 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg transition"
            >
              내 캘린더에 추가
            </button>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Google Calendar 등록 일정 목록
              </h4>
              <button
                onClick={loadCalendarEvents}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> 새로고침
              </button>
            </div>

            {calendarEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                조회된 캘린더 일정이 없습니다. 일정을 새로 추가해 보세요.
              </div>
            ) : (
              <div className="space-y-2">
                {calendarEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-white">{evt.summary}</div>
                      <div className="text-slate-400 text-[11px]">
                        {evt.start?.dateTime || '시간 미지정'} · {evt.location || '상산고'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Gmail Broadcast */}
      {activeTab === 'gmail' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
          <div>
            <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
              <Mail className="w-4 h-4 text-red-400" />
              학생회 공식 Gmail 경기 알림 브로드캐스트
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              선수 및 학급 대표 학생들에게 경기 소집 안내 메일을 발송합니다.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">수신 이메일</label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">메일 제목</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">메일 본문</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <button
              onClick={handleSendGmail}
              disabled={!isAuthenticated || loading}
              className="px-5 py-2.5 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg transition"
            >
              공식 알림 메일 발송
            </button>
          </div>
        </div>
      )}

      {/* 4. Google Drive & Picker */}
      {activeTab === 'drive' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                Google Drive 대회 자료 및 Google Picker 연동
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                대회 규정 파일, 상산고 행사 사진 및 응원 음원 파일 드라이브 저장소입니다.
              </p>
            </div>
            <button
              onClick={loadDriveFiles}
              className="text-xs px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700"
            >
              드라이브 파일 목록 갱신
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                name: '2026_상산고_체육대회_정규규정집.pdf',
                type: 'PDF 문서',
                size: '2.4 MB',
              },
              {
                name: '각학급_선수단_명단_통합서식.xlsx',
                type: '스프레드시트',
                size: '512 KB',
              },
              {
                name: '싸우라비_응원전_공식_배경음원.mp3',
                type: '오디오',
                size: '8.1 MB',
              },
              ...driveFiles.map((f) => ({
                name: f.name,
                type: f.mimeType,
                size: 'Google Drive',
              })),
            ].map((file, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1"
              >
                <div className="font-bold text-white truncate">{file.name}</div>
                <div className="text-slate-400 flex justify-between">
                  <span>{file.type}</span>
                  <span className="font-mono">{file.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Google Tasks */}
      {activeTab === 'tasks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Google Tasks 심판부 및 운영진 체크리스트
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                경기 준비 상태, 안전 점검 및 보건 물품 구비 과업을 동기화합니다.
              </p>
            </div>
            <button
              onClick={loadTasks}
              className="text-xs px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700"
            >
              새로고침
            </button>
          </div>

          <div className="flex gap-2 text-xs">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="새 과업 입력..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
            <button
              onClick={handleAddTask}
              disabled={!isAuthenticated || loading}
              className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg"
            >
              과업 등록
            </button>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 't-1',
                title: '대운동장 A코트 골대 그물망 고정 상태 점검',
                status: 'completed',
              },
              { id: 't-2', title: '상산체육관 메인 전광판 및 스코어 타이머 연동 테스트', status: 'completed' },
              { id: 't-3', title: '보건실 아이스팩 50개 냉동 보관 및 부스 비치', status: 'needsAction' },
              { id: 't-4', title: '학생회 심판부 호루라기 및 옐로카드 배부', status: 'needsAction' },
              ...tasks,
            ].map((t) => (
              <div
                key={t.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded border ${
                      t.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-600'
                    }`}
                  />
                  <span
                    className={
                      t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'
                    }
                  >
                    {t.title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {t.status === 'completed' ? '완료' : '진행 대기'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Google Meet & Chat */}
      {activeTab === 'meet' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              Google Meet & Chat 긴급 운영회의실
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              경기 분쟁, 우천 시 긴급 대책 회의 및 학생회-선생님 핫라인입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="font-bold text-white flex items-center justify-between">
                <span>학생회 심판부 화상 브리핑 룸</span>
                <span className="text-emerald-400 text-[10px] font-mono">LIVE ON</span>
              </div>
              <p className="text-slate-400">
                각 종목 주심 및 부심이 경기 전 판정 기준을 점검하는 Google Meet 방입니다.
              </p>
              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Meet 회의실 입장 <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="font-bold text-white flex items-center justify-between">
                <span>Google Chat 비상 알림 스페이스</span>
                <span className="text-amber-400 text-[10px] font-mono">STANDBY</span>
              </div>
              <p className="text-slate-400">
                긴급 부상자 발생 및 안전 사고 시 보건교사 및 학생회장 직통 채널입니다.
              </p>
              <a
                href="https://chat.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
              >
                Google Chat 열기 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 7. Docs, Slides & Forms */}
      {activeTab === 'docs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
              <Presentation className="w-4 h-4 text-amber-400" />
              Google Docs, Slides & Forms 공식 행사 콘텐츠
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              개막식 발표 슬라이드, 대회 규정집 및 학생 만족도 설문지(Forms) 연동입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <div className="font-bold text-white">상산 체육대회 개회 선언문</div>
              <p className="text-slate-400 text-[11px]">
                Google Docs로 작성된 교장선생님 격려사 및 학생대표 선서문입니다.
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <Presentation className="w-5 h-5 text-amber-400" />
              <div className="font-bold text-white">싸우라비 응원전 슬라이드</div>
              <p className="text-slate-400 text-[11px]">
                대운동장 대형 전광판에 송출되는 각 반 응원 구호 및 슬라이드입니다.
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <div className="font-bold text-white">대회 MVP 투표 (Forms)</div>
              <p className="text-slate-400 text-[11px]">
                Google Forms를 통해 전교생이 실시간으로 종목별 최우수 선수를 투표합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8. Google Contacts */}
      {activeTab === 'contacts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Google Contacts 교직원 및 반장 연락망
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                행사 진행 중 긴급 전달을 위한 비상 연락망 디렉토리입니다.
              </p>
            </div>
            <button
              onClick={loadContacts}
              className="text-xs px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700"
            >
              새로고침
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { displayName: '김태호 (체육부장 교사)', email: 'gym_dept@sangsan.hs.kr', phoneNumber: '063-239-5321' },
              { displayName: '장은우 (싸우라비 단장)', email: 'ssaurabi@sangsan.hs.kr', phoneNumber: '010-XXXX-1981' },
              { displayName: '보건실 담당관', email: 'nurse@sangsan.hs.kr', phoneNumber: '063-239-5300' },
              { displayName: '학생회장단 비상데스크', email: 'council@sangsan.hs.kr', phoneNumber: '063-239-5340' },
              ...contacts,
            ].map((c, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-white">{c.displayName}</div>
                  <div className="text-slate-400 text-[11px]">{c.email}</div>
                </div>
                <span className="font-mono text-amber-400 font-semibold">{c.phoneNumber}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Mutating Workspace Operations */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              {confirmModal.title}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="w-1/2 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmModal({ ...confirmModal, isOpen: false });
                  await confirmModal.onConfirm();
                }}
                className="w-1/2 py-2 rounded-lg text-xs font-semibold bg-red-800 hover:bg-red-700 text-white shadow"
              >
                진행 승인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
