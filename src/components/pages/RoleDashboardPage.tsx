import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserProfile, 
  MatchItem, 
  NoticeItem, 
  AuditLogEntry, 
  ClassLineup 
} from '../../types';
import { 
  Users, 
  ShieldCheck, 
  Stethoscope, 
  GraduationCap, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  FileText, 
  Search, 
  Play, 
  Pause, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  History, 
  UserCheck, 
  UserX,
  ExternalLink,
  Info
} from 'lucide-react';
import { formatKSTTime } from '../../utils/kstTime';
import { 
  updateMatch, 
  updateScoreWithAudit, 
  createNotice, 
  listenAllUsers, 
  listenAuditLogs, 
  listenLineups,
  deleteUser
} from '../../services/firebaseService';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GoalScorerModal } from '../matches/GoalScorerModal';
import { getSportScoreMeta } from '../../utils/sportScoreUtils';

interface RoleDashboardPageProps {
  currentUser: UserProfile | null;
  matches: MatchItem[];
  notices: NoticeItem[];
  onBackToHome?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const RoleDashboardPage: React.FC<RoleDashboardPageProps> = ({
  currentUser,
  matches,
  notices: _notices,
  onBackToHome,
  onNavigateToTab
}) => {
  // Determine default tab based on user's current role
  // Referee is merged into student_council as requested
  const getInitialRole = (): 'class_president' | 'student_council' | 'teacher' | 'health_officer' => {
    if (currentUser?.role === 'student_council' || currentUser?.role === 'referee') return 'student_council';
    if (currentUser?.isTeacher || currentUser?.role === 'teacher') return 'teacher';
    if (currentUser?.role === 'health_officer') return 'health_officer';
    return 'class_president';
  };

  const [activeRoleTab, setActiveRoleTab] = useState<'class_president' | 'student_council' | 'teacher' | 'health_officer'>(getInitialRole());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Users for Class Online Presence & Expel Management
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [allLineups, setAllLineups] = useState<ClassLineup[]>([]);

  // Subscriptions
  useEffect(() => {
    const unsubUsers = listenAllUsers(setAllUsers);
    const unsubAudit = listenAuditLogs(setAuditLogs);
    const unsubLineups = listenLineups(setAllLineups);
    return () => {
      unsubUsers();
      unsubAudit();
      unsubLineups();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Determine user's target class
  const userGrade = currentUser?.grade || (currentUser?.studentId ? currentUser.studentId.charAt(0) : '2');
  const userClassNum = currentUser?.classNum || (currentUser?.studentId && currentUser.studentId.length >= 3 ? currentUser.studentId.substring(1, 3) : '03');
  const userClassCode = `${userGrade}${userClassNum.padStart(2, '0')}`;
  const userClassLabel = `${userGrade}학년 ${parseInt(userClassNum, 10)}반`;

  // Matches for this class
  const classMatches = useMemo(() => {
    return matches.filter(m => m.homeClass === userClassCode || m.awayClass === userClassCode);
  }, [matches, userClassCode]);

  // Classmates for Class Online Presence
  const classmates = useMemo(() => {
    return allUsers.filter(u => {
      const g = u.grade || (u.studentId ? u.studentId.charAt(0) : '');
      const c = u.classNum || (u.studentId && u.studentId.length >= 3 ? u.studentId.substring(1, 3) : '');
      return g === userGrade && c === userClassNum && !u.isTeacher;
    }).sort((a, b) => {
      const numA = parseInt(a.studentNum || a.studentId.slice(-2) || '0', 10);
      const numB = parseInt(b.studentNum || b.studentId.slice(-2) || '0', 10);
      return numA - numB;
    });
  }, [allUsers, userGrade, userClassNum]);

  // Lineup submission status for user's class
  const soccerLineupSubmitted = allLineups.some(l => l.classId === userClassCode && ((l.sport as string) === 'soccer' || (l.sport as string) === '축구'));
  const relayLineupSubmitted = allLineups.some(l => l.classId === userClassCode && ((l.sport as string).includes('relay') || (l.sport as string).includes('계주')));

  // Search filter for classmates
  const [classmateSearch, setClassmateSearch] = useState('');
  const filteredClassmates = useMemo(() => {
    if (!classmateSearch.trim()) return classmates;
    const q = classmateSearch.trim().toLowerCase();
    return classmates.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.studentId.includes(q) ||
      (c.studentNum && c.studentNum.includes(q))
    );
  }, [classmates, classmateSearch]);

  // -------------------------------------------------------------
  // Student Council / Score Input State
  // -------------------------------------------------------------
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    matches.find(m => m.status === 'LIVE')?.id || matches[0]?.id || ''
  );
  const activeControlMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  // Score Undo Reason Modal State
  const [undoModalOpen, setUndoModalOpen] = useState(false);
  const [undoTarget, setUndoTarget] = useState<{ team: 'home' | 'away'; delta: number } | null>(null);
  const [undoReason, setUndoReason] = useState<string>('입력 실수');
  const [undoCustomReason, setUndoCustomReason] = useState('');

  // Goal Scorer Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTeam, setGoalTeam] = useState<'home' | 'away'>('home');

  // Notice Form State for Student Council & Teachers
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeImportant, setNoticeImportant] = useState(false);
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);

  // Student Council: Expel Normal Student State (User Request #2)
  const [expelSearch, setExpelSearch] = useState('');
  const [expelTargetStudent, setExpelTargetStudent] = useState<UserProfile | null>(null);
  const [expelReason, setExpelReason] = useState('대회 규칙 및 커뮤니티 가이드라인 위반');
  const [isExpelling, setIsExpelling] = useState(false);

  // Filter students for expel tool
  const expellableCandidates = useMemo(() => {
    if (!expelSearch.trim()) return [];
    const q = expelSearch.trim().toLowerCase();
    return allUsers.filter(u => 
      (u.name.toLowerCase().includes(q) || u.studentId.includes(q)) &&
      !u.isTeacher &&
      u.role !== 'admin'
    ).slice(0, 6);
  }, [allUsers, expelSearch]);

  // Score Handlers
  const handleScoreAdd = async (team: 'home' | 'away', delta: number) => {
    if (!activeControlMatch) return;
    const currentScore = team === 'home' ? (activeControlMatch.homeScore || 0) : (activeControlMatch.awayScore || 0);
    const newScore = currentScore + delta;

    try {
      await updateScoreWithAudit(
        activeControlMatch,
        team === 'home' ? newScore : activeControlMatch.homeScore,
        team === 'away' ? newScore : activeControlMatch.awayScore,
        `${team === 'home' ? '홈팀' : '원정팀'} ${delta > 0 ? `+${delta}점` : `${delta}점`} 실시간 반영`,
        {
          id: currentUser?.studentId || 'staff',
          name: currentUser?.name || '학생회 진행요원',
          role: currentUser?.role || 'student_council'
        }
      );
      showToast(`${activeControlMatch.title} 스코어가 정상 반영되었습니다.`);
    } catch (e) {
      console.error(e);
      showToast('스코어 반영 중 오류가 발생했습니다.');
    }
  };

  const handleOpenScoreUndo = (team: 'home' | 'away') => {
    setUndoTarget({ team, delta: -1 });
    setUndoReason('입력 실수');
    setUndoCustomReason('');
    setUndoModalOpen(true);
  };

  const handleConfirmScoreUndo = async () => {
    if (!activeControlMatch || !undoTarget) return;
    const currentScore = undoTarget.team === 'home' ? (activeControlMatch.homeScore || 0) : (activeControlMatch.awayScore || 0);
    const newScore = Math.max(0, currentScore - 1);
    const finalReason = undoReason === '기타 직접 입력' ? (undoCustomReason.trim() || '사유 미기재 정정') : undoReason;

    try {
      await updateScoreWithAudit(
        activeControlMatch,
        undoTarget.team === 'home' ? newScore : activeControlMatch.homeScore,
        undoTarget.team === 'away' ? newScore : activeControlMatch.awayScore,
        `[감점 정정 -1] 사유: ${finalReason}`,
        {
          id: currentUser?.studentId || 'staff',
          name: currentUser?.name || '학생회 진행요원',
          role: currentUser?.role || 'student_council'
        }
      );
      showToast(`점수가 정정되었습니다. 감사 로그에 사유(${finalReason})가 영구 기록되었습니다.`);
      setUndoModalOpen(false);
      setUndoTarget(null);
    } catch (e) {
      console.error(e);
      showToast('점수 정정 중 오류가 발생했습니다.');
    }
  };

  const handleToggleTimer = async () => {
    if (!activeControlMatch) return;
    const nextTimer = !activeControlMatch.timerRunning;
    try {
      await updateMatch(activeControlMatch.id, {
        timerRunning: nextTimer,
        status: nextTimer ? 'LIVE' : activeControlMatch.status === 'SCHEDULED' ? 'LIVE' : activeControlMatch.status
      });
      showToast(nextTimer ? '경기 공식 타이머가 가동되었습니다.' : '경기 타이머가 일시정지되었습니다.');
    } catch (e) {
      console.error(e);
      showToast('타이머 상태 변경 실패');
    }
  };

  const handleFinishMatch = async () => {
    if (!activeControlMatch) return;
    try {
      await updateMatch(activeControlMatch.id, {
        status: 'FINISHED',
        timerRunning: false,
        period: '경기 종료'
      });
      showToast(`${activeControlMatch.title} 경기가 공식 종료 처리되었습니다.`);
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Notice Handler
  const handlePublishNotice = async (scope: 'global' | 'class') => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      showToast('공지 제목과 내용을 모두 입력해주세요.');
      return;
    }
    setIsSubmittingNotice(true);
    try {
      await createNotice({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        type: scope,
        targetClass: scope === 'class' ? userClassCode : undefined,
        authorName: currentUser?.name || (scope === 'class' ? '담임교사' : '학생회'),
        authorRole: currentUser?.role || (scope === 'class' ? 'teacher' : 'student_council'),
        authorId: currentUser?.studentId || 'user',
        important: noticeImportant,
        category: noticeImportant ? 'urgent' : 'general'
      });
      showToast(scope === 'class' ? `우리 반 (${userClassLabel}) 전용 공지가 등록되었습니다.` : '전교생 공식 공지사항이 등록되었습니다.');
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeImportant(false);
    } catch (e) {
      console.error(e);
      showToast('공지 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  // Student Expel Handler (User Request #2)
  const handleExecuteExpel = async () => {
    if (!expelTargetStudent) return;
    if (expelTargetStudent.role !== 'student') {
      showToast('일반 학생 계정만 강퇴할 수 있습니다.');
      return;
    }

    setIsExpelling(true);
    try {
      // 1. Delete user doc from Firestore
      await deleteUser(expelTargetStudent.studentId);

      // 2. Record immutable audit log
      try {
        const auditRef = collection(db, 'audit_logs');
        const logItem: AuditLogEntry = {
          id: `audit-expel-${Date.now()}`,
          operatorId: currentUser?.studentId || 'staff',
          operatorName: currentUser?.name || '학생회',
          operatorRole: currentUser?.role || 'student_council',
          matchId: 'system',
          matchTitle: '학생 강퇴 조치 (Expel)',
          action: 'STATUS_CHANGE',
          reason: `[학생회 조치] 일반 학생 강퇴 (${expelTargetStudent.studentId} ${expelTargetStudent.name}): ${expelReason}`,
          oldValue: `정상 계정 (${expelTargetStudent.name})`,
          newValue: '강퇴 및 계정 초기화 완료',
          timestamp: new Date().toISOString()
        };
        await setDoc(doc(auditRef, logItem.id), logItem);
      } catch (logErr) {
        console.warn('Audit log write error during expel:', logErr);
      }

      showToast(`[${expelTargetStudent.studentId} ${expelTargetStudent.name}] 학생이 정상 강퇴(계정 초기화)되었습니다.`);
      setExpelTargetStudent(null);
      setExpelSearch('');
    } catch (e) {
      console.error(e);
      showToast('학생 강퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setIsExpelling(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                title="홈으로 돌아가기"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              OFFICIAL
            </span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              직무별 운영 대시보드
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-7">
            상산고 체육대회 필수 직무별 전용 관제 콘솔입니다.
          </p>
        </div>

        {/* Current user badge & Admin Link */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentUser && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <UserCheck className="w-4 h-4 text-red-600" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                <strong>{currentUser.name}</strong> ({currentUser.studentId}) &middot; <span className="text-red-600 font-bold">{userClassLabel}</span>
              </span>
            </div>
          )}
          {currentUser?.role === 'admin' && onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('admin')}
              className="px-3 py-2 rounded-2xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>어드민 콘솔</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Clean Role Navigation Tabs (Referee merged into Student Council) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { key: 'class_president', label: '반장 / 학급대표', icon: Users, desc: '접속 현황 & 라인업 제출' },
          { key: 'student_council', label: '학생회 / 체육진행부', icon: ShieldCheck, desc: '스코어 제어 & 강퇴 관리' },
          { key: 'teacher', label: '선생님 / 담임교사', icon: GraduationCap, desc: '학급 공지 & 경기 참관' },
          { key: 'health_officer', label: '보건 담당', icon: Stethoscope, desc: '부상 지식백과 관리' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeRoleTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveRoleTab(tab.key as any)}
              className={`p-3.5 rounded-2xl font-bold text-xs transition cursor-pointer border text-left flex items-start gap-2.5 ${
                isActive
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-black">{tab.label}</div>
                <div className={`text-[10px] font-normal mt-0.5 ${isActive ? 'text-red-100' : 'text-slate-400'}`}>
                  {tab.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. CLASS PRESIDENT (반장 / 학급대표)                      */}
      {/* ========================================================= */}
      {activeRoleTab === 'class_president' && (
        <div className="space-y-6">
          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Lineup Status */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">출전 라인업 관리</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    경기 5분 전 잠금
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2">
                  {userClassLabel} 출전 엔트리
                </h3>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>축구 포메이션 (11인):</span>
                    <span className={`font-bold ${soccerLineupSubmitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {soccerLineupSubmitted ? '✓ 제출 완료' : '미제출 (배치 필요)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>계주 릴레이 주자 명단:</span>
                    <span className={`font-bold ${relayLineupSubmitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {relayLineupSubmitted ? '✓ 제출 완료' : '미제출 (선발 필요)'}
                    </span>
                  </div>
                </div>
              </div>

              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('formation')}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>축구 & 계주 라인업 제출/수정</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Direct Messages (쪽지) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">소통 창구</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    전용 쪽지
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2">
                  학급 쪽지함 (Messages)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  담임 선생님 및 대회 총괄본부(학생회)와 긴급 전달사항을 1:1로 소통할 수 있습니다.
                </p>
              </div>

              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('messages')}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>학급 쪽지함 바로가기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 3. Class Matches Overview */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">경기 일정</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    총 {classMatches.length}경기
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2">
                  {userClassLabel} 대진 현황
                </h3>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {classMatches.length === 0 ? (
                    <p>현재 배정된 경기 일정이 없습니다.</p>
                  ) : (
                    <p>진행 예정: {classMatches.filter(m => m.status === 'SCHEDULED').length}건 &middot; 완료: {classMatches.filter(m => m.status === 'FINISHED').length}건</p>
                  )}
                </div>
              </div>

              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('schedule')}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>전체 대진표 확인하기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Core Feature: Class Online Presence (스펙 3.B.3 핵심 요건) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-600" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    우리 반 학우 실시간 접속 현황 (Class Online Presence)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {userClassLabel} 학우들의 접속 및 활동 상태입니다. (총 {classmates.length}명)
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="학우 이름 또는 번호 검색"
                  value={classmateSearch}
                  onChange={(e) => setClassmateSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {filteredClassmates.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {classmateSearch ? '검색 결과가 없습니다.' : '아직 접속한 학급 학우 정보가 없습니다.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredClassmates.map((student) => {
                  const studentNum = student.studentNum || student.studentId.slice(-2);
                  const isOnline = student.lastLogin && (Date.now() - new Date(student.lastLogin).getTime() < 30 * 60 * 1000);
                  return (
                    <div
                      key={student.studentId}
                      className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {parseInt(studentNum, 10) || studentNum}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{student.name}</span>
                            {student.role === 'class_president' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                반장
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            학번: {student.studentId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {isOnline ? '접속중' : '오프라인'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. STUDENT COUNCIL (학생회 / 체육진행부 & 심판)           */}
      {/* ========================================================= */}
      {activeRoleTab === 'student_council' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Live Match Scoreboard & Controller */}
            <div className="lg:col-span-7 space-y-5">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      실시간 경기 스코어 제어기 (Score Controller)
                    </h3>
                  </div>

                  {/* Match Selector */}
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>
                        [{m.sport?.toUpperCase()}] {m.title} ({m.status === 'LIVE' ? '진행중' : m.status === 'FINISHED' ? '종료' : '예정'})
                      </option>
                    ))}
                  </select>
                </div>

                {activeControlMatch ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{activeControlMatch.court || '대운동장'}</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {activeControlMatch.period || '진행중'} &middot; {activeControlMatch.status}
                      </span>
                    </div>

                    {/* Big Score Display */}
                    <div className="flex items-center justify-around py-3">
                      {/* Home Team */}
                      <div className="text-center space-y-1 w-1/3">
                        <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {activeControlMatch.homeTeam}
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                          {activeControlMatch.homeScore ?? 0}
                        </div>
                      </div>

                      <div className="text-lg font-black text-slate-400">VS</div>

                      {/* Away Team */}
                      <div className="text-center space-y-1 w-1/3">
                        <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {activeControlMatch.awayTeam}
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                          {activeControlMatch.awayScore ?? 0}
                        </div>
                      </div>
                    </div>

                    {/* Score Buttons Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {/* Home Team Buttons */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 text-center">{activeControlMatch.homeTeam} 득점</div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleScoreAdd('home', 1)}
                            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                          >
                            +1점
                          </button>
                          {activeControlMatch.sport === 'basketball' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleScoreAdd('home', 2)}
                                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                              >
                                +2점
                              </button>
                              <button
                                type="button"
                                onClick={() => handleScoreAdd('home', 3)}
                                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                              >
                                +3점
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenScoreUndo('home')}
                            className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                            title="점수 정정 (-1)"
                          >
                            -1
                          </button>
                        </div>
                      </div>

                      {/* Away Team Buttons */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 text-center">{activeControlMatch.awayTeam} 득점</div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleScoreAdd('away', 1)}
                            className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer"
                          >
                            +1점
                          </button>
                          {activeControlMatch.sport === 'basketball' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleScoreAdd('away', 2)}
                                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer"
                              >
                                +2점
                              </button>
                              <button
                                type="button"
                                onClick={() => handleScoreAdd('away', 3)}
                                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer"
                              >
                                +3점
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenScoreUndo('away')}
                            className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                            title="점수 정정 (-1)"
                          >
                            -1
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Goal Scorer & Timer Controls */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const meta = getSportScoreMeta(activeControlMatch.sport);
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setGoalTeam('home');
                                setShowGoalModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <span>{meta.sportIcon}</span>
                              <span>{meta.actionButtonLabel}</span>
                            </button>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleToggleTimer}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                            activeControlMatch.timerRunning
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {activeControlMatch.timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{activeControlMatch.timerRunning ? '타이머 일시정지' : '타이머 가동'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleFinishMatch}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer"
                        >
                          경기 종료
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">선택된 경기가 없습니다.</div>
                )}
              </div>

              {/* Suggestions Box Quick Link */}
              {onNavigateToTab && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                  <div className="text-xs text-blue-900 dark:text-blue-200 font-medium">
                    학생들의 실명 건의 및 축제 제안사항을 열람하고 공식 답변을 작성할 수 있습니다.
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('suggestions')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shrink-0"
                  >
                    건의함 답변하기
                  </button>
                </div>
              )}
            </div>

            {/* Right: Global Notice Publisher, Expel Student & Audit Log */}
            <div className="lg:col-span-5 space-y-5">
              {/* Global Notice Form */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    전교생 공식 공지사항 등록
                  </h3>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="공지 제목 (예: [일정 변경] 농구 8강 2경기 시작 지연)"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <textarea
                    rows={3}
                    placeholder="공지 내용 상세"
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noticeImportant}
                        onChange={(e) => setNoticeImportant(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>긴급 공지 (상단 강조)</span>
                    </label>

                    <button
                      type="button"
                      disabled={isSubmittingNotice}
                      onClick={() => handlePublishNotice('global')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
                    >
                      {isSubmittingNotice ? '등록 중...' : '공지 게시'}
                    </button>
                  </div>
                </div>
              </div>

              {/* NEW: Student Council Expel Normal Student Tool (User Request #2) */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      일반 학생 강퇴 / 계정 관리 (Expel)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    학생회 집행 권한
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  대회 규칙을 위반하거나 도용된 일반 학생 계정을 강퇴(초기화)합니다. (교원/학생회/관리자 보호)
                </p>

                {/* Search Bar for Expellable Candidates */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="강퇴 대상 학생 이름 또는 학번 검색"
                    value={expelSearch}
                    onChange={(e) => setExpelSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* Candidate List */}
                {expelSearch.trim() && (
                  <div className="space-y-1.5 pt-1">
                    {expellableCandidates.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2 text-center">검색된 학생이 없습니다.</div>
                    ) : (
                      expellableCandidates.map(st => {
                        const canExpel = st.role === 'student' && !st.isTeacher;
                        return (
                          <div
                            key={st.studentId}
                            className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white mr-1.5">{st.name}</span>
                              <span className="text-[10px] text-slate-400">({st.studentId} &middot; {st.grade}학년 {st.classNum}반)</span>
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {st.role === 'student' ? '일반 학생' : st.role}
                              </span>
                            </div>

                            {canExpel ? (
                              <button
                                type="button"
                                onClick={() => setExpelTargetStudent(st)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition cursor-pointer"
                              >
                                강퇴 처리
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">강퇴 불가(보호)</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Real-time Audit Log View (스펙 3.B.2 요건) */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    최근 스코어 수정 감사 로그 (Audit Log)
                  </h3>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {auditLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{formatKSTTime(log.timestamp)}</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">{log.operatorName} ({log.operatorRole})</span>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {log.matchTitle}: <span className="text-red-600">{log.oldValue} &rarr; {log.newValue}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        사유: {log.reason}
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">기록된 감사 로그가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TEACHER (선생님 / 학급담임)                            */}
      {/* ========================================================= */}
      {activeRoleTab === 'teacher' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Class Notice Form (스펙 3.B.4 핵심 요건) */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {userClassLabel} 전용 학급 공지 작성
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    우리 반 학생들에게만 노출되는 학급 전용 공지사항을 전달합니다.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="학급 공지 제목 (예: 오후 1시 20분까지 대운동장 본부석 집합)"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <textarea
                  rows={4}
                  placeholder="학생들에게 전달할 세부 전달사항을 작성해주세요."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticeImportant}
                      onChange={(e) => setNoticeImportant(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>중요 강조 공지</span>
                  </label>

                  <button
                    type="button"
                    disabled={isSubmittingNotice}
                    onClick={() => handlePublishNotice('class')}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
                  >
                    {isSubmittingNotice ? '등록 중...' : '학급 공지 등록'}
                  </button>
                </div>
              </div>
            </div>

            {/* Teacher Actions & Class Match Monitoring */}
            <div className="space-y-5">
              {/* Class Messaging Access */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    학급 쪽지함 (Messages)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    반장 및 학생들과 1:1 쪽지 교환이 가능합니다.
                  </p>
                </div>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('messages')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    쪽지함 열기
                  </button>
                )}
              </div>

              {/* Class Matches List */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {userClassLabel} 경기 일정 및 참관 현황
                  </h4>
                  <span className="text-xs text-slate-400">총 {classMatches.length}경기</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {classMatches.map(m => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{m.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {m.court} &middot; {m.startTime ? formatKSTTime(m.startTime) : '시간 미정'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          m.status === 'LIVE' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                          m.status === 'FINISHED' ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {m.status === 'LIVE' ? '진행중' : m.status === 'FINISHED' ? '종료' : '예정'}
                        </span>
                        <div className="text-xs font-black text-slate-900 dark:text-white mt-1">
                          {m.homeScore ?? 0} : {m.awayScore ?? 0}
                        </div>
                      </div>
                    </div>
                  ))}
                  {classMatches.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">우리 반 경기 일정이 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. HEALTH OFFICER (보건 담당)                             */}
      {/* ========================================================= */}
      {activeRoleTab === 'health_officer' && (
        <div className="space-y-6">
          {/* Official Injury Encyclopedia Management Hub (스펙 3.B.6 전담 권한) */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    부상 지식백과(Injury Encyclopedia) 전담 관리
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    보건 담당 학생 및 보건교사에게만 부여된 부상 위키 콘텐츠 등록 및 수정 권한입니다.
                  </p>
                </div>
              </div>

              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('injury')}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  <span>부상 지식백과 관리 바로가기</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Core Sports RICE First-Aid Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                sport: '축구 (Soccer)',
                focus: '발목 염좌 & 무릎 인대',
                rice: '즉시 경기 중단, 체중 부하 금지, 15분 급속 냉찜질 실시'
              },
              {
                sport: '농구 (Basketball)',
                focus: '손가락 탈구 & 타박상',
                rice: '무리하게 맞추지 말고 부목 고정 후 냉찜질'
              },
              {
                sport: '피구 (Dodgeball)',
                focus: '안면 타박 & 손목 염좌',
                rice: '비출혈(코피) 시 고개 앞으로 숙이고 콧망울 10분 압박'
              },
              {
                sport: '계주 (Relay)',
                focus: '트랙 찰과상 & 근육 경련',
                rice: '생리식염수 세척 및 습윤밴드 부착, 종아리 스트레칭'
              }
            ].map((card, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs"
              >
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400">{card.sport}</div>
                <div className="font-black text-sm text-slate-900 dark:text-white">{card.focus}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800">
                  {card.rice}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Scorer Modal */}
      {showGoalModal && activeControlMatch && currentUser && (
        <GoalScorerModal
          isOpen={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          match={activeControlMatch}
          currentUser={currentUser}
          lineups={allLineups}
          initialTeam={goalTeam}
          onSuccess={(scorer, team) => {
            const teamName = team === 'home' ? activeControlMatch.homeTeam : activeControlMatch.awayTeam;
            const meta = getSportScoreMeta(activeControlMatch.sport);
            showToast(`[${teamName}] ${scorer} 선수의 ${meta.scoreNoun} 기록이 공식 저장되었습니다.`);
          }}
        />
      )}

      {/* Score Undo Reason Modal (스펙 3.D 불변 감사 로그 요건) */}
      {undoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                점수 취소 및 감점 사유 선택
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                점수 조작 방지를 위해 감사 로그에 정정 사유가 영구 보존됩니다.
              </p>
            </div>

            <div className="space-y-2">
              {(activeControlMatch ? getSportScoreMeta(activeControlMatch.sport).undoReasons : [
                '입력 실수 (단순 오타)',
                '심판 판정 번복',
                '규칙 위반/파울 무효',
                '기타 직접 입력'
              ]).map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                >
                  <input
                    type="radio"
                    name="undoReason"
                    value={reason}
                    checked={undoReason === reason}
                    onChange={(e) => setUndoReason(e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">{reason}</span>
                </label>
              ))}

              {undoReason === '기타 직접 입력' && (
                <input
                  type="text"
                  placeholder="상세 정정 사유를 입력하세요"
                  value={undoCustomReason}
                  onChange={(e) => setUndoCustomReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUndoModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleConfirmScoreUndo}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition cursor-pointer"
              >
                정정 기록 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Expel Confirmation Modal (User Request #2) */}
      {expelTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                일반 학생 강퇴(계정 초기화) 확인
              </h3>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div><strong>대상자:</strong> {expelTargetStudent.name} ({expelTargetStudent.studentId})</div>
              <div><strong>소속:</strong> {expelTargetStudent.grade}학년 {expelTargetStudent.classNum}반</div>
              <div className="text-[11px] text-rose-700 dark:text-rose-300 pt-1">
                ※ 강퇴 처리 시 해당 학생의 세션이 만료되고 계정 데이터가 초기화됩니다.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                강퇴 조치 사유
              </label>
              <input
                type="text"
                value={expelReason}
                onChange={(e) => setExpelReason(e.target.value)}
                placeholder="예: 부적절한 언행, 도용, 대회 규칙 위반"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isExpelling}
                onClick={() => setExpelTargetStudent(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isExpelling}
                onClick={handleExecuteExpel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isExpelling ? '처리 중...' : '강퇴 실행'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
