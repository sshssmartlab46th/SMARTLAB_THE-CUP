import React, { useState } from 'react';
import { UserProfile, SuggestionItem } from '../../types';
import { submitSuggestion } from '../../services/firebaseService';
import { HelpCircle, Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

interface ContactInquiryPageProps {
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
}

export const ContactInquiryPage: React.FC<ContactInquiryPageProps> = ({
  currentUser,
  onOpenLogin
}) => {
  const [category, setCategory] = useState<'system_error' | 'schedule_inquiry' | 'general_suggestion'>('system_error');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !content.trim()) {
      setErrorMessage('제목과 문의 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSuggestion({
        title: title.trim(),
        content: content.trim(),
        category: category,
        authorName: currentUser?.name || '익명 학우',
        authorGrade: currentUser?.grade || '전체',
        authorClass: currentUser?.classNum || '0'
      });
      setIsSubmitted(true);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error(err);
      setErrorMessage('문의 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-500" />
          문의하기 및 대회 본부 직통 창구
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          체육대회 진행 중 발생하는 시스템 오류, 경기 일정 문의 또는 긴급 건의사항을 대회 본부로 즉시 접수합니다.
        </p>
      </div>

      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        {isSubmitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              문의사항이 성공적으로 접수되었습니다.
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              대회 운영진 및 시스템 관리자가 내용을 확인한 후 신속히 조치하겠습니다.
            </p>
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="mt-4 px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold transition cursor-pointer"
            >
              추가 문의 작성하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                문의 분류
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('system_error')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                    category === 'system_error'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-600 dark:text-red-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  시스템 오류 신고
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('schedule_inquiry')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                    category === 'schedule_inquiry'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  경기/일정 문의
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('general_suggestion')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                    category === 'general_suggestion'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  일반 문의/건의
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                문의 제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="간략하고 명확한 제목을 입력하세요"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                상세 내용
              </label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="구체적인 상황(경기 번호, 장소, 시간, 에러 현상 등)을 적어주시면 빠른 처리에 도움이 됩니다."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                작성자: <strong>{currentUser ? `${currentUser.name} (${currentUser.grade}-${currentUser.classNum})` : '익명 학우'}</strong>
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? '접수 중...' : '문의 접수하기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
