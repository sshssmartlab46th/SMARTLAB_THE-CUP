import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SuggestionItem } from '../../types';
import { listenSuggestions, submitSuggestion, answerSuggestion } from '../../services/firebaseService';
import { formatKSTDate } from '../../utils/kstTime';
import { 
  HelpCircle, 
  X, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  CheckCheck, 
  User,
  Image as ImageIcon,
  ZoomIn,
  Loader2,
  Paperclip
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

interface SuggestionModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestionModal: React.FC<SuggestionModalProps> = ({
  currentUser,
  isOpen,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current user can answer (Admin or student council with canAnswerSuggestion permission)
  const canAnswer = currentUser.role === 'admin' || (currentUser.role === 'student_council' && currentUser.canAnswerSuggestion === true);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = listenSuggestions((items) => setSuggestions(items));
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 첨부할 수 있습니다.');
      return;
    }
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 });
      setAttachedImage(compressed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await submitSuggestion({
        authorId: currentUser.uid,
        authorName: currentUser.name,
        authorStudentId: currentUser.studentId,
        title: title.trim(),
        content: content.trim(),
        imageUrl: attachedImage || undefined,
        images: attachedImage ? [attachedImage] : undefined
      });
      setTitle('');
      setContent('');
      setAttachedImage(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = async (id: string) => {
    const text = replyTextMap[id];
    if (!text || !text.trim()) return;

    try {
      await answerSuggestion(id, text.trim(), `${currentUser.studentId} ${currentUser.name}`);
      setReplyTextMap((prev) => ({ ...prev, [id]: '' }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                학생회 및 운영진 실명 건의함
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                기획서 규정에 따라 모든 건의는 100% 실명으로 접수됩니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to submit new suggestion */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-600" />
                작성자: {currentUser.studentId} {currentUser.name} ({currentUser.isTeacher ? '선생님' : `${currentUser.grade}학년 ${currentUser.classNum}반`})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">실명 인증 완료</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="건의 제목을 간결하게 입력해주세요"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              required
            />
            <div className="flex gap-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder="대회 운영, 시설, 경기 진행 관련 불편사항이나 개선 건의를 작성해주세요..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-hidden resize-none"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || isCompressing || !title.trim() || !content.trim()}
                className="px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>등록</span>
              </button>
            </div>

            {/* Photo attachment controls */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                id="modal-suggestion-file"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                {isCompressing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-red-500" />
                )}
                <span>{attachedImage ? '사진 변경' : '사진 첨부'}</span>
              </button>

              {attachedImage && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  <div
                    className="relative w-6 h-6 rounded overflow-hidden bg-slate-200 dark:bg-slate-700 cursor-pointer"
                    onClick={() => setLightboxSrc(attachedImage)}
                  >
                    <img
                      src={attachedImage}
                      alt="첨부 미리보기"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">첨부 완료</span>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="p-0.5 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Suggestion list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {suggestions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              접수된 건의 사항이 없습니다.
            </div>
          ) : (
            suggestions.map((item) => {
              const img = item.imageUrl || item.images?.[0];
              return (
                <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      {item.answer ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 답변 완료
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          답변 대기중
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {item.authorStudentId} {item.authorName} · {item.createdAt ? formatKSTDate(item.createdAt) : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                    {item.content}
                  </p>

                  {img && (
                    <div className="pt-1">
                      <div
                        className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group"
                        onClick={() => setLightboxSrc(img)}
                      >
                        <img
                          src={img}
                          alt="건의 첨부 사진"
                          referrerPolicy="no-referrer"
                          className="max-h-32 max-w-full rounded-xl object-contain group-hover:opacity-90 transition"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Answer if exists */}
                  {item.answer ? (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                        <span className="flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" />
                          답변자: {item.answeredBy}
                        </span>
                        {item.answeredAt && (
                          <span>{formatKSTDate(item.answeredAt)}</span>
                        )}
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ) : canAnswer ? (
                    /* Answer Input for authorized admin or selected student council */
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={replyTextMap[item.id] || ''}
                        onChange={(e) => setReplyTextMap({ ...replyTextMap, [item.id]: e.target.value })}
                        placeholder="공식 답변을 입력하세요..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleAnswer(item.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        답변 등록
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      <ImageLightboxModal
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
};
