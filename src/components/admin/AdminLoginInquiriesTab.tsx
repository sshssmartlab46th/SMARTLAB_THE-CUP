import React, { useState, useEffect } from 'react';
import { LoginInquiry } from '../../types';
import { 
  listenLoginInquiries, 
  resolveLoginInquiry, 
  resetStudentAccount, 
  updateStudentName,
  getUserProfile 
} from '../../services/firebaseService';
import { formatKSTDateTime } from '../../utils/kstTime';
import { parseStudentId } from '../../utils/studentIdParser';
import { 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  UserCheck, 
  AlertCircle, 
  ShieldAlert, 
  RefreshCw,
  Search,
  Check,
  User,
  GraduationCap
} from 'lucide-react';

export const AdminLoginInquiriesTab: React.FC = () => {
  const [inquiries, setInquiries] = useState<LoginInquiry[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenLoginInquiries((list) => {
      setInquiries(list);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleResolve = async (inquiryId: string) => {
    setProcessingId(inquiryId);
    try {
      await resolveLoginInquiry(inquiryId, '총괄 관리자');
      showToast('사연이 [처리 완료]로 변경되었습니다.');
    } catch (err) {
      console.error(err);
      alert('처리 상태 변경 실패');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetAccount = async (inquiry: LoginInquiry) => {
    if (!window.confirm(`[학번 ${inquiry.studentId}]의 기존 가입 데이터를 삭제(초기화)하시겠습니까?\n삭제 후 해당 학생이 올바른 이름으로 최초 가입을 진행할 수 있게 됩니다.`)) {
      return;
    }

    setProcessingId(inquiry.id);
    try {
      await resetStudentAccount(inquiry.studentId);
      await resolveLoginInquiry(inquiry.id, '총괄 관리자 (계정 초기화 조치)');
      showToast(`[${inquiry.studentId}] 계정이 초기화되었으며 사연이 처리 완료되었습니다.`);
    } catch (err) {
      console.error(err);
      alert('계정 초기화 실패');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApplyClaimedName = async (inquiry: LoginInquiry) => {
    if (!window.confirm(`[학번 ${inquiry.studentId}]의 등록 이름을 [${inquiry.claimedName}](으)로 바로 변경하시겠습니까?`)) {
      return;
    }

    setProcessingId(inquiry.id);
    try {
      await updateStudentName(inquiry.studentId, inquiry.claimedName);
      await resolveLoginInquiry(inquiry.id, `총괄 관리자 (이름을 ${inquiry.claimedName}(으)로 정정)`);
      showToast(`[${inquiry.studentId}] 이름이 [${inquiry.claimedName}]으로 수정되었습니다.`);
    } catch (err) {
      console.error(err);
      alert('이름 변경 실패');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = inquiries.filter((inq) => {
    if (filter === 'pending' && inq.status !== 'PENDING') return false;
    if (filter === 'resolved' && inq.status !== 'RESOLVED') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        inq.studentId.toLowerCase().includes(q) ||
        inq.claimedName.toLowerCase().includes(q) ||
        (inq.registeredName && inq.registeredName.toLowerCase().includes(q)) ||
        inq.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = inquiries.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {notification && (
        <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            전체 ({inquiries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            대기중 ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            처리 완료 ({inquiries.length - pendingCount})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="학번, 이름, 사연 검색..."
            className="w-full sm:w-60 pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Inquiries List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          접수된 로그인 문제 사연이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq) => {
            const isPending = inq.status === 'PENDING';
            const isBusy = processingId === inq.id;

            return (
              <div
                key={inq.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isPending
                    ? 'border-amber-300 dark:border-amber-900/60 bg-white dark:bg-slate-900 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 opacity-85'
                }`}
              >
                {/* Header Row: 2 distinct student identity pieces clearly highlighted */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* [정보 1] 학번 및 소속 반/번호 분석 */}
                    {(() => {
                      const parsed = parseStudentId(inq.studentId);
                      const parsedDetail = parsed.isValid 
                        ? (parsed.isTeacher ? '교직원' : `${parsed.grade}학년 ${parsed.classNum}반 ${parsed.studentNum}번`)
                        : '형식 미상';
                      return (
                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                          <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">[정보 1] 학번</span>
                            <span className="font-mono font-black text-xs text-blue-950 dark:text-blue-100">{inq.studentId}</span>
                            <span className="text-[11px] text-blue-700/80 dark:text-blue-300 font-medium">({parsedDetail})</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* [정보 2] 학생 본인이 제출한 실명 */}
                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                      <User className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">[정보 2] 학생 성명</span>
                        <span className="font-black text-xs text-amber-950 dark:text-amber-100">{inq.claimedName}</span>
                      </div>
                    </div>

                    {/* DB 현재 등록자 대조 (불일치 진단) */}
                    {inq.registeredName ? (
                      <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="text-[11px] font-medium text-red-700 dark:text-red-300">
                          기존 DB 선점 이름: <strong className="font-bold underline line-through">{inq.registeredName}</strong> (불일치)
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 italic bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        (DB 미등록 학번)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {isPending ? '대기중 (조치 필요)' : '처리 완료'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatKSTDateTime(inq.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Body: The Story / Message */}
                <div className="my-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    학생이 작성한 사연 내용
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {inq.message}
                  </p>
                </div>

                {/* Resolution note if resolved */}
                {inq.resolvedBy && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-3">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>조치 내역: {inq.resolvedBy} {inq.resolvedAt ? `(${formatKSTDateTime(inq.resolvedAt)})` : ''}</span>
                  </div>
                )}

                {/* Admin Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Action 1: Rename student in DB */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleApplyClaimedName(inq)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    신청인 이름 [{inq.claimedName}]으로 DB 수정
                  </button>

                  {/* Action 2: Reset account */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleResetAccount(inq)}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    학번 [{inq.studentId}] 계정 초기화 (재가입 허용)
                  </button>

                  {/* Action 3: Mark as Resolved */}
                  {isPending && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleResolve(inq.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 ml-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      처리 완료로 변경
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
