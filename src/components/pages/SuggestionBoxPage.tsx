import React, { useState } from 'react';
import { UserProfile, SuggestionItem } from '../../types';
import { submitSuggestion } from '../../services/firebaseService';
import { HelpCircle, Send, CheckCircle2, MessageSquare, AlertTriangle, EyeOff } from 'lucide-react';
import { filterProfanity } from '../../utils/profanityFilter';

interface SuggestionBoxPageProps {
  currentUser?: UserProfile | null;
  suggestions: SuggestionItem[];
}

export const SuggestionBoxPage: React.FC<SuggestionBoxPageProps> = ({
  currentUser,
  suggestions
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'facility' | 'referee' | 'cheering' | 'general'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!title.trim() || !content.trim()) {
      setFeedbackMsg('제목과 내용을 모두 작성해주세요.');
      return;
    }

    // Auto profanity filtering
    const titleFilter = filterProfanity(title.trim());
    const contentFilter = filterProfanity(content.trim());

    setIsSubmitting(true);
    try {
      await submitSuggestion({
        title: titleFilter.filteredText,
        content: contentFilter.filteredText,
        category: category,
        authorName: currentUser?.name || '익명 학우',
        authorGrade: currentUser?.grade || '전체',
        authorClass: currentUser?.classNum || '0'
      });
      setTitle('');
      setContent('');
      setFeedbackMsg('소중한 건의사항이 익명으로 안전하게 본부에 접수되었습니다.');
    } catch (err) {
      console.error(err);
      setFeedbackMsg('건의 접수 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-emerald-500" />
          학생 전용 익명 건의함
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          시설 개선, 심판 판정, 응원 안전 등 대회 전반에 관한 자유로운 의견을 제안하세요.
        </p>
      </div>

      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>작성자의 개인 식별 정보는 철저히 마스킹되어 안전하게 익명으로 처리됩니다.</span>
        </div>

        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
            {feedbackMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              건의 분류
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'facility', label: '시설/운동장' },
                { key: 'referee', label: '심판/경기진행' },
                { key: 'cheering', label: '응원/매너' },
                { key: 'general', label: '기타 일반' }
              ].map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key as any)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                    category === c.key
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              건의 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="건의 사항의 핵심을 요약해주세요"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-emerald-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              상세 의견
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="체육대회 발전을 위한 구체적인 제안을 편안하게 남겨주세요."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? '접수 중...' : '익명 건의함에 투입하기'}
          </button>
        </form>
      </div>

      {/* Suggestion Feed / List */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          최근 접수된 학우들의 목소리
        </h3>
        {suggestions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
            아직 접수된 건의사항이 없습니다. 첫 번째 의견을 남겨주세요!
          </div>
        ) : (
          <div className="space-y-2.5">
            {suggestions.map(s => (
              <div key={s.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {s.title}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === 'RESOLVED' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                  }`}>
                    {s.status === 'RESOLVED' ? '조치완료' : '검토중'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {s.content}
                </p>
                {s.answer && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-blue-600 dark:text-blue-400">
                    <strong>대회 본부 답변:</strong> {s.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
