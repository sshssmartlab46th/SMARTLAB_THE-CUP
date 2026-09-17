import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, Trash2, X, Check, Loader2 } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

interface ImageUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  allowUrlInput?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label = '이미지 첨부',
  description = '드래그 앤 드롭 또는 클릭하여 이미지를 업로드하세요 (JPG, PNG, WebP)',
  placeholder = 'https://example.com/image.jpg',
  allowUrlInput = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.82
      });
      onChange(compressedDataUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>{label}</span>
          </label>
          {allowUrlInput && (
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                파일 업로드
              </button>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                  inputMode === 'url'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                URL 입력
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Box if value exists */}
      {value ? (
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 group">
          <div className="max-h-56 sm:max-h-64 w-full flex items-center justify-center bg-black/5 dark:bg-black/20 p-2">
            <img
              src={value}
              alt="첨부 이미지 미리보기"
              className="max-h-52 sm:max-h-60 max-w-full object-contain rounded-xl shadow-xs"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden text-slate-500 dark:text-slate-400">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate text-[11px] font-mono">
                {value.startsWith('data:') ? '이미지 첨부 완료 (최적화 Data URI)' : value}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                변경
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                title="이미지 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : inputMode === 'upload' ? (
        /* Drag and Drop Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500/60 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                이미지 최적화 처리 중...
              </p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  클릭하거나 사진 파일을 이곳으로 드래그하세요
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* URL Input mode */
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyUrl}
            disabled={!urlInput.trim()}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
          >
            적용
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}

      {/* Hidden File Input for click trigger */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
      />
    </div>
  );
};
