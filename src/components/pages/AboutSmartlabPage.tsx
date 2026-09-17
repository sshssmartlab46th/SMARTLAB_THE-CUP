import React, { useState, useEffect } from 'react';
import { SmartlabLogo } from '../common/SmartlabLogo';
import { 
  Code, Cpu, Award, Sparkles, Edit3, Save, RotateCcw, Plus, Trash2, 
  CheckCircle2, Clock, Image as ImageIcon, Camera, X, ExternalLink, Maximize2 
} from 'lucide-react';
import { AppDocument, AppDocumentSection, AppDocumentGalleryImage, UserProfile } from '../../types';
import { listenAppDocument, saveAppDocument, resetAppDocument } from '../../services/firebaseService';
import { DEFAULT_APP_DOCUMENTS } from '../../data/defaultDocuments';
import { formatKSTDateTime } from '../../utils/kstTime';
import { ImageUploadField } from '../common/ImageUploadField';

interface AboutSmartlabPageProps {
  currentUser?: UserProfile | null;
}

export const AboutSmartlabPage: React.FC<AboutSmartlabPageProps> = ({
  currentUser
}) => {
  const [docData, setDocData] = useState<AppDocument>(DEFAULT_APP_DOCUMENTS['smartlab']);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState<AppDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Lightbox / Image Zoom Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title?: string; caption?: string } | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.studentId === 'sshsgym';

  useEffect(() => {
    const unsub = listenAppDocument('smartlab', (doc) => {
      setDocData(doc);
    });
    return () => unsub();
  }, []);

  const handleStartEdit = () => {
    setEditBuffer(JSON.parse(JSON.stringify(docData)));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditBuffer(null);
  };

  const handleSave = async () => {
    if (!editBuffer) return;
    setIsSaving(true);
    try {
      const operatorName = currentUser?.name ? `${currentUser.name} (${currentUser.role === 'admin' ? '총괄관리자' : '운영진'})` : '총괄본부';
      await saveAppDocument({
        ...editBuffer,
        updatedBy: operatorName
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert('스마트랩 소개 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('스마트랩 소개 내용을 기본값으로 복원하시겠습니까? (첨부된 이미지도 기본값으로 초기화됩니다)')) {
      setIsSaving(true);
      try {
        const restored = await resetAppDocument('smartlab', currentUser?.name || '총괄 관리자');
        setEditBuffer(JSON.parse(JSON.stringify(restored)));
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddSection = () => {
    if (!editBuffer) return;
    const newSec: AppDocumentSection = {
      id: `sec_${Date.now()}`,
      title: '새로운 기술적 특징 및 연구 활동',
      content: '활동 및 특징에 대한 상세 설명을 입력하세요.',
      badge: '기술 소개',
      imageUrl: '',
      imageCaption: ''
    };
    setEditBuffer({
      ...editBuffer,
      sections: [...(editBuffer.sections || []), newSec]
    });
  };

  const handleRemoveSection = (idx: number) => {
    if (!editBuffer || !editBuffer.sections) return;
    const next = [...editBuffer.sections];
    next.splice(idx, 1);
    setEditBuffer({ ...editBuffer, sections: next });
  };

  const handleSectionChange = (idx: number, field: keyof AppDocumentSection, val: any) => {
    if (!editBuffer || !editBuffer.sections) return;
    const next = [...editBuffer.sections];
    next[idx] = { ...next[idx], [field]: val };
    setEditBuffer({ ...editBuffer, sections: next });
  };

  // Gallery image handling
  const handleAddGalleryItem = () => {
    if (!editBuffer) return;
    const newImg: AppDocumentGalleryImage = {
      id: `img_${Date.now()}`,
      url: '',
      title: '활동 사진',
      caption: '',
      uploadedAt: new Date().toISOString()
    };
    setEditBuffer({
      ...editBuffer,
      gallery: [...(editBuffer.gallery || []), newImg]
    });
  };

  const handleRemoveGalleryItem = (idx: number) => {
    if (!editBuffer || !editBuffer.gallery) return;
    const next = [...editBuffer.gallery];
    next.splice(idx, 1);
    setEditBuffer({ ...editBuffer, gallery: next });
  };

  const handleGalleryItemChange = (idx: number, field: keyof AppDocumentGalleryImage, val: any) => {
    if (!editBuffer || !editBuffer.gallery) return;
    const next = [...editBuffer.gallery];
    next[idx] = { ...next[idx], [field]: val };
    setEditBuffer({ ...editBuffer, gallery: next });
  };

  const getSectionIcon = (idx: number) => {
    if (idx % 3 === 0) return <Cpu className="w-5 h-5 text-red-600 dark:text-red-400" />;
    if (idx % 3 === 1) return <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    return <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
  };

  const currentGallery = isEditing ? (editBuffer?.gallery || []) : (docData.gallery || []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>스마트랩 소개 및 첨부 이미지가 성공적으로 수정·저장되었습니다.</span>
          </div>
        </div>
      )}

      {/* Optional Cover Banner Image (If registered) */}
      {docData.coverImage && !isEditing && (
        <div 
          onClick={() => setPreviewImage({ url: docData.coverImage!, title: 'SMARTLAB 대표 배너' })}
          className="relative w-full h-48 sm:h-64 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs group cursor-pointer bg-slate-900"
        >
          <img
            src={docData.coverImage}
            alt="스마트랩 대표 배너"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-white/90 bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>SMARTLAB 활동 전경</span>
              </span>
              <span className="text-white/80 p-1.5 rounded-full bg-black/40 backdrop-blur-xs group-hover:bg-red-600 transition">
                <Maximize2 className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shrink-0">
            <SmartlabLogo size={72} showText={false} />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {docData.badge || '상산고등학교 IT & 소프트웨어 엔지니어링 동아리'}
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {docData.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              {docData.subtitle || docData.content}
            </p>
            {docData.updatedAt && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1 justify-center sm:justify-start">
                <Clock className="w-3 h-3" />
                최종 갱신: {formatKSTDateTime(docData.updatedAt)}
              </p>
            )}
          </div>
        </div>

        {isAdmin && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs shrink-0 self-center sm:self-start"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>소개 및 사진 수정</span>
          </button>
        )}
      </div>

      {/* Editing Form */}
      {isEditing && editBuffer ? (
        <div className="p-6 rounded-3xl border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-red-600" />
              스마트랩 소개 및 첨부 이미지 편집
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>기본값 복원</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? '저장 중...' : '저장 완료'}</span>
              </button>
            </div>
          </div>

          {/* Cover Banner Image Uploader */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <ImageUploadField
              label="대표 커버 배너 이미지 (선택)"
              description="스마트랩 최상단에 노출되는 와이드 배너 사진입니다 (드래그 앤 드롭 또는 클릭)"
              value={editBuffer.coverImage || ''}
              onChange={(url) => setEditBuffer({ ...editBuffer, coverImage: url })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                공식 명칭
              </label>
              <input
                type="text"
                value={editBuffer.title}
                onChange={(e) => setEditBuffer({ ...editBuffer, title: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                상단 배지 태그
              </label>
              <input
                type="text"
                value={editBuffer.badge || ''}
                onChange={(e) => setEditBuffer({ ...editBuffer, badge: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              핵심 소개 및 미션 설명
            </label>
            <textarea
              rows={3}
              value={editBuffer.subtitle || ''}
              onChange={(e) => setEditBuffer({ ...editBuffer, subtitle: e.target.value })}
              className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          {/* Activity Photo Gallery Management */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-red-600" />
                  <span>스마트랩 활동 사진 갤러리</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({(editBuffer.gallery || []).length}개 등록됨)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  해커톤, 개발 회의, 체육대회 현장 부스 등 스마트랩 활동 모습을 사진으로 첨부할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddGalleryItem}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>사진 추가</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(editBuffer.gallery || []).map((img, imgIdx) => (
                <div 
                  key={img.id || imgIdx} 
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-red-500" />
                      <span>활동 사진 #{imgIdx + 1}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryItem(imgIdx)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                      title="사진 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Image Uploader */}
                  <ImageUploadField
                    label=""
                    description="사진 파일을 끌어다 놓거나 클릭하세요"
                    value={img.url}
                    onChange={(url) => handleGalleryItemChange(imgIdx, 'url', url)}
                  />

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <input
                      type="text"
                      value={img.title || ''}
                      onChange={(e) => handleGalleryItemChange(imgIdx, 'title', e.target.value)}
                      placeholder="사진 제목 (예: 2026 체육대회 실시간 관제 센터)"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={img.caption || ''}
                      onChange={(e) => handleGalleryItemChange(imgIdx, 'caption', e.target.value)}
                      placeholder="상세 설명/캡션 (예: 전교생 동시접속 릴레이 모니터링)"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sections with Image Attachments */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-600" />
                <span>주요 성과 및 기술 강점 카드 (카드별 스크린샷 첨부 가능)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddSection}
                className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>카드 추가</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(editBuffer.sections || []).map((sec, idx) => (
                <div key={sec.id || idx} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">#{idx + 1} 카드</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                    placeholder="카드 제목"
                  />
                  <textarea
                    rows={3}
                    value={sec.content || ''}
                    onChange={(e) => handleSectionChange(idx, 'content', e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                    placeholder="카드 설명"
                  />
                  
                  {/* Section Card Specific Image */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <ImageUploadField
                      label="카드 첨부 이미지 (스크린샷/다이어그램)"
                      description="카드 상단에 표시될 시연 사진 또는 아키텍처 다이어그램"
                      value={sec.imageUrl || ''}
                      onChange={(url) => handleSectionChange(idx, 'imageUrl', url)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Normal View Mode */
        <>
          {/* Details Grid Normal Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(docData.sections || []).map((sec, idx) => (
              <div 
                key={sec.id || idx} 
                className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  {/* Card Attached Image if exists */}
                  {sec.imageUrl && (
                    <div 
                      onClick={() => setPreviewImage({ url: sec.imageUrl!, title: sec.title, caption: sec.imageCaption })}
                      className="mb-3 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 max-h-48 flex items-center justify-center cursor-pointer group relative"
                    >
                      <img
                        src={sec.imageUrl}
                        alt={sec.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5 drop-shadow-md" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold shrink-0">
                      {getSectionIcon(idx)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {sec.title}
                      </h3>
                      {sec.badge && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                          {sec.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line mt-2">
                    {sec.content}
                  </p>
                </div>

                {sec.imageCaption && (
                  <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-800">
                    📸 {sec.imageCaption}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Activity Photo Gallery Section */}
          {currentGallery && currentGallery.length > 0 && (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-red-600" />
                    <span>스마트랩 활동 및 개발 갤러리</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    학내 소프트웨어 개발과 시스템 엔지니어링 프로젝트 현장 사진입니다.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  총 {currentGallery.length}장
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {currentGallery.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    onClick={() => setPreviewImage(img)}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-xs aspect-4/3 flex flex-col justify-end"
                  >
                    <img
                      src={img.url}
                      alt={img.title || `스마트랩 활동 사진 ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-95 transition" />
                    <div className="relative p-3 space-y-0.5 text-white">
                      {img.title && (
                        <p className="text-xs font-bold leading-tight drop-shadow-sm truncate">
                          {img.title}
                        </p>
                      )}
                      {img.caption && (
                        <p className="text-[11px] text-slate-300 drop-shadow-sm truncate">
                          {img.caption}
                        </p>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 transition backdrop-blur-xs">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Official Persistent Credit */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs text-center space-y-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          시스템 총괄 개발 및 프로젝트 디렉팅: <strong>made by SMARTLAB</strong>
        </p>
        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          DESIGNED AND ENGINEERED FOR SANGSAN HIGH SCHOOL SPORTS FESTIVAL
        </p>
      </div>

      {/* Lightbox / Zoom Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-bold truncate max-w-md">
                  {previewImage.title || '이미지 미리보기'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black/40 min-h-[300px]">
              <img
                src={previewImage.url}
                alt={previewImage.title || '상세 이미지'}
                className="max-h-[70vh] max-w-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            {previewImage.caption && (
              <div className="p-4 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300 text-center">
                {previewImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

