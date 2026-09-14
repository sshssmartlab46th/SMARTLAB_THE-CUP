import React, { useState, useRef } from 'react';
import { UserProfile, SuggestionItem } from '../../types';
import { submitSuggestion } from '../../services/firebaseService';
import { 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  AlertTriangle, 
  EyeOff, 
  Image as ImageIcon, 
  X, 
  ZoomIn, 
  Loader2, 
  Paperclip,
  UploadCloud
} from 'lucide-react';
import { filterProfanity } from '../../utils/profanityFilter';
import { compressImageFile } from '../../utils/imageCompressor';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

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
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedbackMsg('이미지 파일만 첨부할 수 있습니다.');
      return;
    }
    setFeedbackMsg(null);
    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.78
      });
      setAttachedImage(compressedDataUrl);
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg(err.message || '이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

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
        imageUrl: attachedImage || undefined,
        images: attachedImage ? [attachedImage] : undefined,
        authorName: currentUser?.name || '익명 학우',
        authorGrade: currentUser?.grade || '전체',
        authorClass: currentUser?.classNum || '0'
      });
      setTitle('');
      setContent('');
      setAttachedImage(null);
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

          {/* Photo Attachment Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>사진 / 참고 자료 첨부 (선택)</span>
              </label>
              {attachedImage && (
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="text-[11px] text-red-500 hover:text-red-600 font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  첨부 취소
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="suggestion-image-input"
            />

            {isCompressing ? (
              <div className="p-4 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-1">
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  사진을 안전하게 압축 중입니다...
                </p>
              </div>
            ) : attachedImage ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2.5 flex items-center gap-3">
                <div
                  className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 cursor-pointer group"
                  onClick={() => setLightboxSrc(attachedImage)}
                >
                  <img
                    src={attachedImage}
                    alt="건의 첨부 사진"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>첨부된 사진 1건</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setLightboxSrc(attachedImage)}
                      className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold hover:bg-emerald-100 transition cursor-pointer"
                    >
                      확대 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] hover:bg-slate-300 transition cursor-pointer"
                    >
                      사진 변경
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-xl border-2 border-dashed transition text-center cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:border-slate-300'
                }`}
              >
                <UploadCloud className="w-5 h-5 text-slate-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  사진을 첨부하려면 클릭하거나 드래그하세요
                </p>
                <p className="text-[10px] text-slate-400">
                  현장 시설 문제, 안내판 오류 등의 사진을 첨부할 수 있습니다
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
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
            {suggestions.map(s => {
              const img = s.imageUrl || s.images?.[0];
              return (
                <div key={s.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
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

                  {img && (
                    <div className="pt-1">
                      <div
                        className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group"
                        onClick={() => setLightboxSrc(img)}
                      >
                        <img
                          src={img}
                          alt="건의 첨부 이미지"
                          referrerPolicy="no-referrer"
                          className="max-h-36 max-w-full rounded-xl object-contain group-hover:opacity-90 transition"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )}

                  {s.answer && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-blue-600 dark:text-blue-400">
                      <strong>대회 본부 답변:</strong> {s.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ImageLightboxModal
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
};
