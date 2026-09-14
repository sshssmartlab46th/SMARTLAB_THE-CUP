import React, { useState, useEffect } from 'react';
import { 
  MatchItem, 
  AuditLogEntry, 
  SuggestionItem, 
  FestivalConfig,
  UserProfile,
  ScoreApprovalRequestItem
} from '../../types';
import { 
  AdminEmergencyControlCard, 
  AdminSystemStatusCard, 
  AdminScoreApprovalCard, 
  AdminAuditLogCard, 
  AdminInquiryListCard 
} from '../index';
import { 
  ShieldAlert, 
  Users, 
  Trophy, 
  CheckCircle2, 
  History, 
  LayoutDashboard, 
  Bell,
  MessageSquare
} from 'lucide-react';
import { 
  listenAllUsers, 
  listenScoreApprovals, 
  approveScoreRequest, 
  rejectScoreRequest,
  updateFestivalConfig,
  updateMatch,
  answerSuggestion,
  sendNotice
} from '../../services/firebaseService';
import { AdminStudentRosterTab } from '../admin/AdminStudentRosterTab';
import { AdminBracketManagerTab } from '../admin/AdminBracketManagerTab';
import { AdminPointsConfigTab } from '../admin/AdminPointsConfigTab';
import { AdminNoticeManagerTab } from '../admin/AdminNoticeManagerTab';
import { NoticeItem } from '../../types';

interface AdminConsolePageProps {
  matches: MatchItem[];
  notices?: NoticeItem[];
  auditLogs: AuditLogEntry[];
  inquiries: SuggestionItem[];
  festivalConfig: FestivalConfig | null;
  onRefresh?: () => void;
}

export const AdminConsolePage: React.FC<AdminConsolePageProps> = ({
  matches,
  notices = [],
  auditLogs,
  inquiries,
  festivalConfig
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'roster' | 'brackets' | 'notices' | 'points' | 'audit'>('roster');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [scoreRequests, setScoreRequests] = useState<ScoreApprovalRequestItem[]>([]);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [selectedInquiryToAnswer, setSelectedInquiryToAnswer] = useState<SuggestionItem | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  useEffect(() => {
    const unsubUsers = listenAllUsers((list) => {
      setAllUsers(list);
    });
    const unsubApprovals = listenScoreApprovals((list) => {
      if (list && list.length > 0) {
        setScoreRequests(list as ScoreApprovalRequestItem[]);
      } else {
        // Fallback demo approval requests if empty from recent finished matches
        const finishedAwaiting = matches
          .filter(m => m.status === 'FINISHED')
          .slice(0, 3)
          .map((m, idx) => ({
            id: `req-match-${m.id}`,
            reqCode: `REQ-0${idx + 1}`,
            matchId: m.id,
            sport: m.sport,
            title: m.title,
            homeTeam: m.homeTeam,
            homeScore: m.homeScore,
            awayTeam: m.awayTeam,
            awayScore: m.awayScore,
            reporterName: '공식 심판진',
            reporterRole: '공인 심판원',
            notes: '경기 종료 후 현장 부심 및 기록원 교차 검증 완료',
            status: 'PENDING' as const,
            pointsToAward: 100,
            createdAt: new Date().toISOString()
          }));
        setScoreRequests(finishedAwaiting);
      }
    });
    return () => {
      unsubUsers();
      unsubApprovals();
    };
  }, [matches]);

  const handleNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  // 1. Score Approval Handlers
  const handleApproveScore = async (id: string) => {
    const target = scoreRequests.find(r => r.id === id);
    if (!target) return;
    try {
      await approveScoreRequest(id, target.matchId, target.homeScore, target.awayScore);
      setScoreRequests(prev => prev.filter(r => r.id !== id));
      handleNotice(`[승인 완료] ${target.title} (${target.homeScore}:${target.awayScore}) 점수가 공식 확정되었습니다.`);
    } catch (err) {
      console.error(err);
      handleNotice('점수 승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleRejectScore = async (id: string) => {
    const target = scoreRequests.find(r => r.id === id);
    if (!target) return;
    try {
      await rejectScoreRequest(id, '총괄본부 재확인 요청으로 반려');
      setScoreRequests(prev => prev.filter(r => r.id !== id));
      handleNotice(`[반려 완료] ${target.title} 점수 승인 요청이 심판진으로 반려되었습니다.`);
    } catch (err) {
      console.error(err);
      handleNotice('점수 반려 처리 중 오류가 발생했습니다.');
    }
  };

  // 2. Emergency Control Handlers
  const handleStopAllMatches = async () => {
    try {
      await updateFestivalConfig({ isEmergencyActive: true });
      // Pause any LIVE matches
      const liveMatches = matches.filter(m => m.status === 'LIVE');
      for (const lm of liveMatches) {
        await updateMatch(lm.id, {
          status: 'PAUSED',
          timerRunning: false,
          period: '대회 일시정지'
        });
      }
      await sendNotice({
        title: '🚨 [긴급] 체육대회 전체 경기 비상 일시정지 발령',
        content: '기상 악화 또는 안전 점검으로 인해 전 경기 진행이 일시 중지되었습니다. 학생들은 각 학급 지도교사의 지시에 따라 안전 대기 바랍니다.',
        authorName: '총괄본부',
        authorRole: 'admin',
        authorId: 'sshsgym',
        important: true,
        type: 'global'
      });
      handleNotice('대회 전체 비상 정지가 발령되었습니다.');
    } catch (e) {
      console.error(e);
      handleNotice('비상 정지 처리 중 오류가 발생했습니다.');
    }
  };

  const handleResumeAllMatches = async () => {
    try {
      await updateFestivalConfig({ isEmergencyActive: false });
      await sendNotice({
        title: '📢 [공지] 체육대회 전 경기 정상 재개 안내',
        content: '안전 점검이 완료되어 일시 정지되었던 전 경기가 정상 재개됩니다.',
        authorName: '총괄본부',
        authorRole: 'admin',
        authorId: 'sshsgym',
        important: true,
        type: 'global'
      });
      handleNotice('대회 비상 정지가 해제되어 정상 상태로 복구되었습니다.');
    } catch (e) {
      console.error(e);
      handleNotice('비상 정지 해제 중 오류가 발생했습니다.');
    }
  };

  const handleSwitchToIndoor = async () => {
    try {
      const outdoorMatches = matches.filter(m => m.status !== 'FINISHED');
      for (const om of outdoorMatches) {
        const newCourt = om.court?.includes('농구') ? '본관 체육관 B' : '본관 체육관 A';
        await updateMatch(om.id, { court: newCourt });
      }
      await sendNotice({
        title: '☔ [기상 대응] 전 경기 실내 체육관 경기장으로 일괄 대체 배정',
        content: '기상 및 야외 환경을 고려하여 모든 실외 경기 일정이 본관 체육관 A, B코트로 긴급 전환되었습니다.',
        authorName: '총괄본부',
        authorRole: 'admin',
        authorId: 'sshsgym',
        important: true,
        type: 'global'
      });
      handleNotice('전 경기 실내 체육관 대체 배정이 완료되었습니다.');
    } catch (e) {
      console.error(e);
      handleNotice('경기장 일괄 대체 중 오류가 발생했습니다.');
    }
  };

  // 3. Inquiry Answer Submission
  const handleOpenAnswerModal = (id: string) => {
    const inq = inquiries.find(i => i.id === id);
    if (inq) {
      setSelectedInquiryToAnswer(inq);
      setAnswerDraft(inq.answer || '');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedInquiryToAnswer || !answerDraft.trim()) return;
    setIsSubmittingAnswer(true);
    try {
      await answerSuggestion(selectedInquiryToAnswer.id, answerDraft.trim(), '대회 총괄본부');
      handleNotice('이의제기/건의사항에 대한 본부 공식 답변이 등록되었습니다.');
      setSelectedInquiryToAnswer(null);
      setAnswerDraft('');
    } catch (e) {
      console.error(e);
      handleNotice('답변 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const pendingRequests = scoreRequests.filter(r => r.status === 'PENDING');
  const unconfirmedTotal = pendingRequests.reduce((sum, r) => sum + (r.pointsToAward || 100), 0);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white">
              SYSTEM ADMINISTRATOR
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              전교 데이터 & 대진 제어
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
            상산고 체육대회 통합 어드민 콘솔
          </h2>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
          {[
            { key: 'roster', label: '반별 학생 명단 & 엑셀', icon: Users },
            { key: 'brackets', label: '대진표 관리 (남녀 구분)', icon: Trophy },
            { key: 'notices', label: '전교 공지사항 관리', icon: Bell },
            { key: 'points', label: '종목별 배점 설정', icon: Trophy },
            { key: 'overview', label: '종합 관제', icon: LayoutDashboard },
            { key: 'audit', label: '감사 로그', icon: History }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveSubTab(t.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeSubTab === t.key
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time notification banner */}
      {noticeMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* 1. Roster Subtab: Class-by-class Student Roster & Excel Download */}
      {activeSubTab === 'roster' && (
        <AdminStudentRosterTab
          allUsers={allUsers}
          onNotice={handleNotice}
        />
      )}

      {/* 2. Brackets Subtab: Sangsan High School 12 Classes Match Creation */}
      {activeSubTab === 'brackets' && (
        <AdminBracketManagerTab
          matches={matches}
          onNotice={handleNotice}
        />
      )}

      {/* 3. Notices Subtab: School-wide Announcements Manager */}
      {activeSubTab === 'notices' && (
        <AdminNoticeManagerTab
          notices={notices}
          onNotice={handleNotice}
        />
      )}

      {/* 4. Points Subtab: Sport-specific Scoring Criteria */}
      {activeSubTab === 'points' && (
        <AdminPointsConfigTab
          onNotice={handleNotice}
        />
      )}

      {/* 5. Overview Subtab */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <AdminSystemStatusCard
            userCount={allUsers.length}
            matchCount={matches.length}
            inquiryCount={inquiries.length}
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <AdminScoreApprovalCard 
                requests={pendingRequests}
                unconfirmedPointsTotal={unconfirmedTotal}
                onApprove={handleApproveScore}
                onReject={handleRejectScore}
              />
              <AdminInquiryListCard 
                inquiries={inquiries}
                onAnswerInquiry={handleOpenAnswerModal}
              />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <AdminEmergencyControlCard 
                isEmergencyActive={festivalConfig?.isEmergencyActive || false}
                onStopAllMatches={handleStopAllMatches}
                onResumeAllMatches={handleResumeAllMatches}
                onSwitchToIndoor={handleSwitchToIndoor}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Audit Logs Subtab */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <AdminAuditLogCard auditLogs={auditLogs} />
        </div>
      )}

      {/* Inquiry Answer Modal */}
      {selectedInquiryToAnswer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  이의제기 / 건의 답변 작성
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiryToAnswer(null)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                닫기
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>작성자: {selectedInquiryToAnswer.authorName}</span>
                <span>{new Date(selectedInquiryToAnswer.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                "{selectedInquiryToAnswer.content}"
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                총괄본부 공식 답변
              </label>
              <textarea
                rows={4}
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                placeholder="학생 및 학급에 전달할 공식 처리 결과와 답변을 입력하세요."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-red-500 outline-hidden leading-relaxed text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInquiryToAnswer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isSubmittingAnswer || !answerDraft.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingAnswer ? '등록 중...' : '답변 등록 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
