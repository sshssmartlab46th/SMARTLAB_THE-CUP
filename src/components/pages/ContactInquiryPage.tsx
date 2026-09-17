import React, { useState, useRef } from 'react';
import { UserProfile, SuggestionItem } from '../../types';
import { submitSuggestion } from '../../services/firebaseService';
import { 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  UploadCloud, 
  X, 
  ZoomIn, 
  Loader2,
  Paperclip
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

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
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.');
      return;
    }
    setErrorMessage(null);
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
      setErrorMessage(err.message || '이미지 압축 처리 중 오류가 발생했습니다.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input value so user can re-select same file if needed
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

  const handleRemoveImage = () => {
    setAttachedImage(null);
  };

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
        ...(attachedImage ? { imageUrl: attachedImage, images: [attachedImage] } : {}),
        authorName: currentUser?.name || '익명 학우',
        authorGrade: currentUser?.grade || '전체',
        authorClass: currentUser?.classNum || '0'
      });
      setIsSubmitted(true);
      setTitle('');
      setContent('');
      setAttachedImage(null);
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>상세 내용</span>
              </label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="구체적인 상황(경기 번호, 장소, 시간, 에러 현상 등)을 적어주시면 빠른 처리에 도움이 됩니다."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>

            {/* Photo Attachment Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>사진 / 스크린샷 첨부 (선택)</span>
                </label>
                {attachedImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
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
                id="inquiry-image-input"
              />

              {isCompressing ? (
                <div className="p-6 rounded-2xl border border-dashed border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    이미지를 안전하게 압축 및 최적화하는 중입니다...
                  </p>
                </div>
              ) : attachedImage ? (
                <div className="relative group rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2.5 flex items-center gap-3">
                  <div 
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 cursor-pointer group/thumb"
                    onClick={() => setLightboxSrc(attachedImage)}
                  >
                    <img
                      src={attachedImage}
                      alt="문의 첨부 사진"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center text-white">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>첨부된 사진 1건</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      클릭하여 사진을 확대하거나 본부로 함께 전송합니다.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setLightboxSrc(attachedImage)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer flex items-center gap-1"
                      >
                        <ZoomIn className="w-3 h-3" />
                        확대 보기
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium hover:bg-slate-300 transition cursor-pointer"
                      >
                        다른 사진으로 변경
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
                  className={`p-5 rounded-2xl border-2 border-dashed transition text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:border-slate-300'
                  }`}
                >
                  <UploadCloud className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    오류 화면이나 현장 사진을 첨부하려면 클릭하거나 드래그하세요
                  </p>
                  <p className="text-[11px] text-slate-400">
                    JPG, PNG, GIF, WebP 지원 • 최대 1장 자동 최적화
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                작성자: <strong>{currentUser ? `${currentUser.name} (${currentUser.grade}-${currentUser.classNum})` : '익명 학우'}</strong>
              </span>

              <button
                type="submit"
                disabled={isSubmitting || isCompressing}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? '접수 중...' : '문의 접수하기'}
              </button>
            </div>
          </form>
        )}
      </div>

      <ImageLightboxModal
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
};
