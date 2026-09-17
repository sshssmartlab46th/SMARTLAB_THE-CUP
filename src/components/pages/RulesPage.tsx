import React, { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle2, ShieldAlert, Edit3, Save, X, Plus, Trash2, Clock, User, RotateCcw } from 'lucide-react';
import { AppDocument, AppDocumentSection, UserProfile } from '../../types';
import { listenAppDocument, saveAppDocument, resetAppDocument } from '../../services/firebaseService';
import { DEFAULT_APP_DOCUMENTS } from '../../data/defaultDocuments';
import { formatKSTDateTime } from '../../utils/kstTime';

interface RulesPageProps {
  currentUser?: UserProfile | null;
  onNavigateToAdmin?: () => void;
}

export const RulesPage: React.FC<RulesPageProps> = ({
  currentUser,
  onNavigateToAdmin
}) => {
  const [docData, setDocData] = useState<AppDocument>(DEFAULT_APP_DOCUMENTS['rules']);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState<AppDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.studentId === 'sshsgym';

  useEffect(() => {
    const unsub = listenAppDocument('rules', (doc) => {
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
      alert('규정집 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('정말 공식 규정집을 초기 기본값으로 복원하시겠습니까?')) {
      setIsSaving(true);
      try {
        const restored = await resetAppDocument('rules', currentUser?.name || '총괄 관리자');
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
      title: '새 종목 규정',
      badge: '경기 규칙',
      items: ['규정 세부 내용을 입력하세요.']
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

  const handleItemChange = (secIdx: number, itemIdx: number, val: string) => {
    if (!editBuffer || !editBuffer.sections) return;
    const next = [...editBuffer.sections];
    const items = [...(next[secIdx].items || [])];
    items[itemIdx] = val;
    next[secIdx].items = items;
    setEditBuffer({ ...editBuffer, sections: next });
  };

  const handleAddItem = (secIdx: number) => {
    if (!editBuffer || !editBuffer.sections) return;
    const next = [...editBuffer.sections];
    const items = [...(next[secIdx].items || []), '새로운 규칙 내용'];
    next[secIdx].items = items;
    setEditBuffer({ ...editBuffer, sections: next });
  };

  const handleRemoveItem = (secIdx: number, itemIdx: number) => {
    if (!editBuffer || !editBuffer.sections) return;
    const next = [...editBuffer.sections];
    const items = [...(next[secIdx].items || [])];
    items.splice(itemIdx, 1);
    next[secIdx].items = items;
    setEditBuffer({ ...editBuffer, sections: next });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>체육대회 공식 규정집이 성공적으로 저장·전교생에게 즉시 반영되었습니다.</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              {docData.badge || '대회 공식 규정'}
            </span>
            {docData.updatedAt && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatKSTDateTime(docData.updatedAt)} 기준
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <BookOpen className="w-6 h-6 text-red-600 dark:text-emerald-400" />
            {docData.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {docData.subtitle}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>관리자 규정 수정</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>기본값 복원</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? '저장 중...' : '저장 완료'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDITING FORM VIEW */}
      {isEditing && editBuffer ? (
        <div className="p-6 rounded-3xl border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  규정집 타이틀
                </label>
                <input
                  type="text"
                  value={editBuffer.title}
                  onChange={(e) => setEditBuffer({ ...editBuffer, title: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  부제목
                </label>
                <input
                  type="text"
                  value={editBuffer.subtitle}
                  onChange={(e) => setEditBuffer({ ...editBuffer, subtitle: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                종목별 규정 섹션 편집 (총 {(editBuffer.sections || []).length}개)
              </h4>
              <button
                type="button"
                onClick={handleAddSection}
                className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-200 dark:border-red-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>종목 추가</span>
              </button>
            </div>

            <div className="space-y-4">
              {(editBuffer.sections || []).map((sec, secIdx) => (
                <div key={sec.id || secIdx} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => handleSectionChange(secIdx, 'title', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                        placeholder="종목 이름"
                      />
                      <input
                        type="text"
                        value={sec.badge || ''}
                        onChange={(e) => handleSectionChange(secIdx, 'badge', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        placeholder="경기 시간 배지"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(secIdx)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bullet items */}
                  <div className="space-y-1.5">
                    {(sec.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs font-mono">{itemIdx + 1}.</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleItemChange(secIdx, itemIdx, e.target.value)}
                          className="flex-1 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(secIdx, itemIdx)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddItem(secIdx)}
                      className="text-[11px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>규칙 한 줄 추가</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note edit */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                스포츠맨십 및 점수 판정 원칙
              </label>
              <textarea
                rows={3}
                value={editBuffer.footerNote || ''}
                onChange={(e) => setEditBuffer({ ...editBuffer, footerNote: e.target.value })}
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL READ-ONLY VIEW */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(docData.sections || []).map((sec, idx) => (
              <div key={sec.id || idx} className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    {sec.title}
                  </h3>
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

          {/* Footer note: Sportsmanship & Scoring */}
          {docData.footerNote && (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                스포츠맨십 및 점수 판정 원칙
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {docData.footerNote}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
