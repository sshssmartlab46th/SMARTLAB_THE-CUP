import React, { useState, useEffect } from 'react';
import { AppDocument, AppDocumentSection, AppDocumentGalleryImage, UserProfile } from '../../types';
import { 
  listenAllAppDocuments, 
  saveAppDocument, 
  resetAppDocument 
} from '../../services/firebaseService';
import { DEFAULT_APP_DOCUMENTS } from '../../data/defaultDocuments';
import { 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  Eye, 
  Edit3, 
  AlertCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Camera,
  Maximize2
} from 'lucide-react';
import { formatKSTDateTime } from '../../utils/kstTime';
import { ImageUploadField } from '../common/ImageUploadField';

interface AdminDocumentManagerTabProps {
  currentUser?: UserProfile | null;
}

export const AdminDocumentManagerTab: React.FC<AdminDocumentManagerTabProps> = ({
  currentUser
}) => {
  const [documents, setDocuments] = useState<Record<string, AppDocument>>(DEFAULT_APP_DOCUMENTS);
  const [selectedDocId, setSelectedDocId] = useState<string>('rules');
  const [editingDoc, setEditingDoc] = useState<AppDocument | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Custom Document dialog state
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocId, setNewDocId] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');

  // Subscribe to real-time document updates
  useEffect(() => {
    const unsub = listenAllAppDocuments((docsMap) => {
      setDocuments(docsMap);
    });
    return () => unsub();
  }, []);

  // Update working edit buffer when selectedDocId changes or documents load
  useEffect(() => {
    const current = documents[selectedDocId] || DEFAULT_APP_DOCUMENTS[selectedDocId];
    if (current) {
      setEditingDoc(JSON.parse(JSON.stringify(current)));
    }
  }, [selectedDocId, documents]);

  const showToast = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSelectDoc = (docId: string) => {
    setSelectedDocId(docId);
    setIsPreviewMode(false);
  };

  const handleSave = async () => {
    if (!editingDoc) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const operatorName = currentUser?.name ? `${currentUser.name} (${currentUser.role === 'admin' ? '총괄관리자' : '운영진'})` : '총괄본부';
      await saveAppDocument({
        ...editingDoc,
        updatedBy: operatorName
      });
      showToast(`'${editingDoc.title}' 문서가 안전하게 저장되었습니다.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('문서 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!editingDoc) return;
    if (!DEFAULT_APP_DOCUMENTS[selectedDocId]) {
      alert('이 문서는 기본 템플릿이 없는 사용자 정의 문서입니다.');
      return;
    }

    if (window.confirm(`정말 '${editingDoc.title}' 문서를 초기 기본 규정 및 내용으로 원복하시겠습니까? 현재 수정한 내용이 시스템 기본값으로 대체됩니다.`)) {
      setIsSaving(true);
      try {
        const restored = await resetAppDocument(selectedDocId, currentUser?.name || '총괄 관리자');
        setEditingDoc(JSON.parse(JSON.stringify(restored)));
        showToast(`'${restored.title}' 문서가 기본 템플릿으로 초기화되었습니다.`);
      } catch (err) {
        console.error(err);
        setErrorMsg('초기화 실패');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddSection = () => {
    if (!editingDoc) return;
    const newSection: AppDocumentSection = {
      id: `sec_${Date.now()}`,
      title: '새 종목 또는 조항 제목',
      badge: '규정 항목',
      items: ['첫 번째 세부 규칙 또는 조항 내용']
    };
    setEditingDoc({
      ...editingDoc,
      sections: [...(editingDoc.sections || []), newSection]
    });
  };

  const handleRemoveSection = (index: number) => {
    if (!editingDoc || !editingDoc.sections) return;
    const next = [...editingDoc.sections];
    next.splice(index, 1);
    setEditingDoc({ ...editingDoc, sections: next });
  };

  const handleSectionChange = (index: number, field: keyof AppDocumentSection, value: any) => {
    if (!editingDoc || !editingDoc.sections) return;
    const next = [...editingDoc.sections];
    next[index] = { ...next[index], [field]: value };
    setEditingDoc({ ...editingDoc, sections: next });
  };

  const handleItemChange = (secIndex: number, itemIndex: number, value: string) => {
    if (!editingDoc || !editingDoc.sections) return;
    const nextSections = [...editingDoc.sections];
    const nextItems = [...(nextSections[secIndex].items || [])];
    nextItems[itemIndex] = value;
    nextSections[secIndex].items = nextItems;
    setEditingDoc({ ...editingDoc, sections: nextSections });
  };

  const handleAddItemToSection = (secIndex: number) => {
    if (!editingDoc || !editingDoc.sections) return;
    const nextSections = [...editingDoc.sections];
    const nextItems = [...(nextSections[secIndex].items || []), '새 세부 항목'];
    nextSections[secIndex].items = nextItems;
    setEditingDoc({ ...editingDoc, sections: nextSections });
  };

  const handleRemoveItemFromSection = (secIndex: number, itemIndex: number) => {
    if (!editingDoc || !editingDoc.sections) return;
    const nextSections = [...editingDoc.sections];
    const nextItems = [...(nextSections[secIndex].items || [])];
    nextItems.splice(itemIndex, 1);
    nextSections[secIndex].items = nextItems;
    setEditingDoc({ ...editingDoc, sections: nextSections });
  };

  const handleAddGalleryImage = () => {
    if (!editingDoc) return;
    const newImg: AppDocumentGalleryImage = {
      id: `img_${Date.now()}`,
      url: '',
      title: '스마트랩 활동 사진',
      caption: '',
      uploadedAt: new Date().toISOString()
    };
    setEditingDoc({
      ...editingDoc,
      gallery: [...(editingDoc.gallery || []), newImg]
    });
  };

  const handleRemoveGalleryImage = (idx: number) => {
    if (!editingDoc || !editingDoc.gallery) return;
    const next = [...editingDoc.gallery];
    next.splice(idx, 1);
    setEditingDoc({ ...editingDoc, gallery: next });
  };

  const handleGalleryImageChange = (idx: number, field: keyof AppDocumentGalleryImage, val: any) => {
    if (!editingDoc || !editingDoc.gallery) return;
    const next = [...editingDoc.gallery];
    next[idx] = { ...next[idx], [field]: val };
    setEditingDoc({ ...editingDoc, gallery: next });
  };

  const handleCreateCustomDoc = async () => {
    if (!newDocId.trim() || !newDocTitle.trim()) {
      alert('문서 영문 식별자(ID)와 제목을 모두 입력해주세요.');
      return;
    }
    const cleanId = newDocId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) {
      alert('올바른 영문/숫자 ID를 입력해주세요.');
      return;
    }

    const newDoc: AppDocument = {
      id: cleanId,
      title: newDocTitle.trim(),
      subtitle: '대회 운영 안내 문서',
      badge: '공식 안내',
      content: '내용을 작성해주세요.',
      sections: [],
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || '총괄본부'
    };

    await saveAppDocument(newDoc);
    setShowNewDocModal(false);
    setNewDocId('');
    setNewDocTitle('');
    setSelectedDocId(cleanId);
    showToast(`'${newDoc.title}' 새 문서가 생성되었습니다.`);
  };

  const docIcons: Record<string, any> = {
    rules: BookOpen,
    smartlab: Sparkles,
    privacy: ShieldCheck,
    terms: FileText
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Document Selector Nav Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.keys(documents).map((docId) => {
            const docItem = documents[docId];
            const Icon = docIcons[docId] || FileText;
            const isSelected = selectedDocId === docId;
            return (
              <button
                key={docId}
                type="button"
                onClick={() => handleSelectDoc(docId)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{docItem.title || docId}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowNewDocModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 문서 추가</span>
        </button>
      </div>

      {editingDoc ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Document Header & Action Bar */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  ID: {editingDoc.id}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {editingDoc.updatedAt ? formatKSTDateTime(editingDoc.updatedAt) : '기본 버전'}
                </span>
                {editingDoc.updatedBy && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    수정자: {editingDoc.updatedBy}
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingDoc.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isPreviewMode 
                    ? 'bg-amber-500 text-white border-amber-600' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{isPreviewMode ? '편집 모드로 복귀' : '사용자 화면 미리보기'}</span>
              </button>

              {DEFAULT_APP_DOCUMENTS[selectedDocId] && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="기본 규정 및 내용으로 원복"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>기본값 복원</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? '저장 중...' : '변경사항 전체 저장'}</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {isPreviewMode ? (
              /* PREVIEW MODE */
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-6">
                {/* Optional Cover Banner in Preview */}
                {editingDoc.coverImage && (
                  <div className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-xs">
                    <img
                      src={editingDoc.coverImage}
                      alt="대표 커버 배너"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  {editingDoc.badge && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-2">
                      {editingDoc.badge}
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingDoc.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {editingDoc.subtitle}
                  </p>
                </div>

                {editingDoc.content && (
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {editingDoc.content}
                  </div>
                )}

                {editingDoc.sections && editingDoc.sections.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editingDoc.sections.map((sec, idx) => (
                      <div key={sec.id || idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                        {sec.imageUrl && (
                          <div className="rounded-xl overflow-hidden max-h-40 border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 mb-2">
                            <img
                              src={sec.imageUrl}
                              alt={sec.title}
                              className="w-full h-36 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {sec.title}
                          </h4>
                          {sec.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {sec.badge}
                            </span>
                          )}
                        </div>
                        {sec.content && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                            {sec.content}
                          </p>
                        )}
                        {sec.items && sec.items.length > 0 && (
                          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                            {sec.items.map((item, itemIdx) => (
                              <li key={itemIdx}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Photo Gallery in Preview */}
                {editingDoc.gallery && editingDoc.gallery.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-red-600" />
                      <span>활동 사진 갤러리 ({editingDoc.gallery.length}장)</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {editingDoc.gallery.map((img, imgIdx) => (
                        <div key={img.id || imgIdx} className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-4/3 relative">
                          <img
                            src={img.url}
                            alt={img.title || '활동 사진'}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {img.title && (
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[10px] text-white truncate font-bold">
                              {img.title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingDoc.footerNote && (
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                    {editingDoc.footerNote}
                  </div>
                )}
              </div>
            ) : (
              /* EDITING FORM */
              <div className="space-y-6">
                {/* Optional Cover Banner Uploader */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <ImageUploadField
                    label="대표 커버 배너 이미지 (선택)"
                    description="문서 최상단에 노출되는 공식 배너/전경 사진입니다 (드래그 앤 드롭 또는 파일 첨부)"
                    value={editingDoc.coverImage || ''}
                    onChange={(url) => setEditingDoc({ ...editingDoc, coverImage: url })}
                  />
                </div>

                {/* Basic Meta Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      문서 공식 제목
                    </label>
                    <input
                      type="text"
                      value={editingDoc.title}
                      onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                      placeholder="예: 상산고등학교 체육대회 공식 규정집"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      배지 태그 문구
                    </label>
                    <input
                      type="text"
                      value={editingDoc.badge || ''}
                      onChange={(e) => setEditingDoc({ ...editingDoc, badge: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                      placeholder="예: 공식 규정집, 공시 사항"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    부제목 및 한 줄 설명
                  </label>
                  <input
                    type="text"
                    value={editingDoc.subtitle || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                    placeholder="예: 공정한 경기 진행과 학우 간 상호 존중을 위한 대회 운영 원칙입니다."
                  />
                </div>

                {/* SMARTLAB Activity Photo Gallery (If smartlab or has gallery) */}
                {(editingDoc.id === 'smartlab' || (editingDoc.gallery && editingDoc.gallery.length > 0)) && (
                  <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Camera className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>스마트랩 활동 사진 갤러리 관리</span>
                          <span className="text-xs font-normal text-slate-500">
                            ({(editingDoc.gallery || []).length}개 첨부됨)
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          스마트랩 동아리 활동, 개발 및 운영 사진을 드래그 앤 드롭 또는 파일 첨부로 등록할 수 있습니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddGalleryImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>사진 추가</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(editingDoc.gallery || []).map((img, imgIdx) => (
                        <div
                          key={img.id || imgIdx}
                          className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                              <span>활동 사진 #{imgIdx + 1}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(imgIdx)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                              title="사진 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <ImageUploadField
                            label=""
                            description="사진을 끌어다 놓거나 클릭하여 첨부"
                            value={img.url}
                            onChange={(url) => handleGalleryImageChange(imgIdx, 'url', url)}
                          />

                          <div className="space-y-2">
                            <input
                              type="text"
                              value={img.title || ''}
                              onChange={(e) => handleGalleryImageChange(imgIdx, 'title', e.target.value)}
                              placeholder="사진 제목 (예: 체육대회 종합 관제 시스템 개발)"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                            />
                            <input
                              type="text"
                              value={img.caption || ''}
                              onChange={(e) => handleGalleryImageChange(imgIdx, 'caption', e.target.value)}
                              placeholder="설명/캡션 (생략 가능)"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Content (Optional free-text / Markdown) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>본문 전체 설명 (서술형 전문)</span>
                    <span className="text-[11px] font-normal text-slate-400">자유 텍스트 및 줄바꿈 지원</span>
                  </label>
                  <textarea
                    rows={4}
                    value={editingDoc.content || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden leading-relaxed font-mono"
                    placeholder="필요한 경우 전체 개요나 전문을 입력하세요."
                  />
                </div>

                {/* Structured Sections (종목별 규칙 또는 조항 목록) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>종목별 규정 및 세부 섹션 관리</span>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          (총 {(editingDoc.sections || []).length}개 항목)
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        축구, 농구, 피구, 계주 등 종목 규칙이나 개인정보 조항을 자유롭게 수정·추가·삭제할 수 있습니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition cursor-pointer border border-red-200 dark:border-red-900"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>새 종목/조항 추가</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(editingDoc.sections || []).map((sec, secIdx) => (
                      <div
                        key={sec.id || secIdx}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                종목 / 조항 제목
                              </label>
                              <input
                                type="text"
                                value={sec.title}
                                onChange={(e) => handleSectionChange(secIdx, 'title', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                                placeholder="예: ⚽ 축구 (남자부)"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                시간 / 태그 배지
                              </label>
                              <input
                                type="text"
                                value={sec.badge || ''}
                                onChange={(e) => handleSectionChange(secIdx, 'badge', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                                placeholder="예: 전후반 각 20분"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSection(secIdx)}
                            className="p-2 text-slate-400 hover:text-red-600 transition cursor-pointer self-end mb-1"
                            title="이 섹션 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Optional Section Image Attachment */}
                        <div className="pt-1">
                          <ImageUploadField
                            label="항목 첨부 이미지 (경기장 안내도 / 사진 / 스크린샷)"
                            description="해당 항목 카드 상단에 노출될 사진을 드래그 앤 드롭 또는 클릭하여 첨부할 수 있습니다"
                            value={sec.imageUrl || ''}
                            onChange={(url) => handleSectionChange(secIdx, 'imageUrl', url)}
                          />
                        </div>

                        {/* If section has content (free paragraph) */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            상세 설명 본문
                          </label>
                          <textarea
                            rows={2}
                            value={sec.content || ''}
                            onChange={(e) => handleSectionChange(secIdx, 'content', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden leading-relaxed"
                            placeholder="본문 설명글 (생략 가능)"
                          />
                        </div>

                        {/* If section has bullet items */}
                        <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                              세부 규칙 리스트 ({ (sec.items || []).length }개)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddItemToSection(secIdx)}
                              className="text-[11px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>규칙 줄 추가</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(sec.items || []).map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs font-mono shrink-0">
                                  {itemIdx + 1}.
                                </span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => handleItemChange(secIdx, itemIdx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                                  placeholder="세부 규칙 내용을 입력하세요"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemFromSection(secIdx, itemIdx)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                  title="줄 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    하단 고지 및 주의사항 (스포츠맨십, 이의제기 원칙 등)
                  </label>
                  <textarea
                    rows={3}
                    value={editingDoc.footerNote || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, footerNote: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden leading-relaxed font-mono"
                    placeholder="1. 판정 결과 승복 및 스포츠맨십..."
                  />
                </div>

                {/* Persistent Credit check note */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    시스템 공식 하단 크레딧: <strong>made by SMARTLAB</strong> (자동 고정 적용)
                  </span>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '문서 저장하기'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">
          문서를 선택해주세요.
        </div>
      )}

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" />
              새로운 안내/규정 문서 추가
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              체육대회 관련 새로운 지침이나 안내 문서를 등록합니다.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  문서 영문 ID (예: event_guide, safety)
                </label>
                <input
                  type="text"
                  value={newDocId}
                  onChange={(e) => setNewDocId(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 outline-hidden"
                  placeholder="safety_manual"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  문서 공식 제목
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                  placeholder="예: 체육대회 안전 매뉴얼"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewDocModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreateCustomDoc}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                문서 만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
