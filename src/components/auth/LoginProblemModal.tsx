import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { getUserProfile, submitLoginInquiry } from '../../services/firebaseService';

interface LoginProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentId?: string;
  defaultName?: string;
}

export const LoginProblemModal: React.FC<LoginProblemModalProps> = ({
  isOpen,
  onClose,
  defaultStudentId = '',
  defaultName = ''
}) => {
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [claimedName, setClaimedName] = useState(defaultName);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = studentId.trim();
    const trimmedName = claimedName.trim();
    const trimmedMsg = message.trim();

    if (!trimmedId || trimmedId.length !== 5) {
      setErrorMessage('정확한 5자리 학번을 입력해주세요. (예: 20305, 30101, 교사는 10100)');
      return;
    }
    if (!trimmedName) {
      setErrorMessage('본인의 실명(이름)을 입력해주세요.');
      return;
    }
    if (!trimmedMsg) {
      setErrorMessage('관리자에게 전달할 사연 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find what name is currently registered on this studentId if any
      const existingUser = await getUserProfile(trimmedId);
      const registeredName = existingUser?.name || null;

      await submitLoginInquiry({
        studentId: trimmedId,
        claimedName: trimmedName,
        registeredName,
        message: trimmedMsg
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit login inquiry:', err);
      setErrorMessage('사연 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                로그인 문제 해결 및 관리자 사연 접수
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                총괄 관리자(총괄본부)에게 직접 전송됩니다
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  관리자에게 접수되었습니다
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  총괄 관리자가 학생의 학번과 사연을 확인한 후 계정 재설정 또는 이름 정정을 진행합니다. 잠시 후 다시 로그인을 시도해주세요.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold transition cursor-pointer"
              >
                창 닫기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  학번 최초 입력 시 등록된 이름과 일치하지 않거나, 다른 학생이 실수로 본인의 학번을 먼저 등록한 경우 사연을 보내주시면 관리자가 조치해 드립니다.
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    5자리 학번
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                    placeholder="예: 20305"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-wider focus:outline-hidden focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    본인 성명 (실명)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={claimedName}
                    onChange={(e) => setClaimedName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  사연 및 문제 상황 설명
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="예: 처음에 친구가 장난으로 다른 이름으로 제 학번을 등록했습니다. / 오타가 나서 이름을 잘못 입력했습니다. / 본인 확인 부탁드립니다."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-hidden focus:border-amber-500 transition resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? '전송 중...' : '관리자에게 사연 보내기'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
