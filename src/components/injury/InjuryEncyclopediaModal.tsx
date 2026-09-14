import React, { useState, useEffect } from 'react';
import { UserProfile, InjuryEntry, SportType } from '../../types';
import { listenInjuries, saveInjuryEntry } from '../../services/firebaseService';
import { ShieldCheck, Plus, Search, Sparkles, X, AlertTriangle, Activity, CheckCircle, FileText } from 'lucide-react';

interface InjuryEncyclopediaModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const InjuryEncyclopediaModal: React.FC<InjuryEncyclopediaModalProps> = ({
  currentUser,
  isOpen,
  onClose
}) => {
  const [injuries, setInjuries] = useState<InjuryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<SportType | 'common'>('soccer');
  const [searchTerm, setSearchTerm] = useState('');
  
  // AI Matching mode
  const [aiInput, setAiInput] = useState('');
  const [aiResults, setAiResults] = useState<{ entry: InjuryEntry; confidence: '높음' | '중간' | '낮음' }[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Health officer create/edit
  const isHealthOfficer = currentUser.role === 'health_officer' || currentUser.role === 'admin';
  const [showEditor, setShowEditor] = useState(false);
  const [editingInjury, setEditingInjury] = useState<Partial<InjuryEntry>>({
    sport: 'soccer',
    severity: 'mild'
  });

  useEffect(() => {
    if (!isOpen) return;
    const unsub = listenInjuries((list) => setInjuries(list));
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter injuries by sport tab and search term
  const filteredInjuries = injuries.filter((item) => {
    const matchSport = activeTab === 'common' || item.sport === activeTab;
    const matchSearch = !searchTerm || item.title.includes(searchTerm) || item.symptoms.includes(searchTerm);
    return matchSport && matchSearch;
  });

  // AI Matching logic (Client-side RAG matching against verified encyclopedia entries)
  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setIsAiLoading(true);
    setTimeout(() => {
      const inputKeywords = aiInput.trim().toLowerCase().split(/\s+/);
      
      const scored = injuries.map((entry) => {
        let score = 0;
        const text = `${entry.title} ${entry.symptoms} ${entry.firstAid}`.toLowerCase();
        
        inputKeywords.forEach((kw) => {
          if (text.includes(kw)) score += 2;
        });

        // Common keywords
        if (aiInput.includes('발목') && (entry.title.includes('발목') || entry.symptoms.includes('발목'))) score += 5;
        if (aiInput.includes('골절') && (entry.title.includes('골절') || entry.severity === 'emergency')) score += 5;
        if (aiInput.includes('경련') || aiInput.includes('쥐') && entry.title.includes('경련')) score += 5;
        if (aiInput.includes('피') || aiInput.includes('출혈') && entry.symptoms.includes('출혈')) score += 5;
        if (aiInput.includes('머리') || aiInput.includes('어지') && entry.title.includes('뇌진탕')) score += 6;

        return { entry, score };
      });

      const sorted = scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((s, idx) => ({
          entry: s.entry,
          confidence: idx === 0 ? ('높음' as const) : idx === 1 ? ('중간' as const) : ('낮음' as const)
        }));

      setAiResults(sorted.length > 0 ? sorted : []);
      setIsAiLoading(false);
    }, 400);
  };

  const handleSaveInjury = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInjury.title || !editingInjury.firstAid) return;

    const id = editingInjury.id || `inj-${Date.now()}`;
    await saveInjuryEntry({
      id,
      sport: editingInjury.sport || 'soccer',
      title: editingInjury.title || '',
      symptoms: editingInjury.symptoms || '',
      firstAid: editingInjury.firstAid || '',
      severity: editingInjury.severity || 'mild',
      prevention: editingInjury.prevention || ''
    });

    setShowEditor(false);
    setEditingInjury({ sport: 'soccer', severity: 'mild' });
  };

  const getSeverityBadge = (sev: 'mild' | 'moderate' | 'emergency') => {
    switch (sev) {
      case 'emergency':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">중증 (응급/119)</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">중등도</span>;
      case 'mild':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">경증</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                상산 부상 지식백과 및 AI 응급 매칭
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                보건 담당 검수 완료 응급처치 가이드 (축구, 농구, 피구, 계주)
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

        {/* Mandatory Disclaimer Box */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>주의 안내:</strong> 본 지식백과 및 AI 매칭은 현장 보조 참고용이며 의사의 진단이 아닙니다. 골절, 심한 출혈, 의식 소실 시 즉시 보건실 또는 119로 연락하세요.
          </span>
        </div>

        {/* AI Symptom Search Area */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <form onSubmit={handleAiSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Sparkles className="w-4 h-4 text-purple-500 absolute left-3 top-3" />
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="다친 부위와 증상을 설명해주세요 (예: 농구 중 착지하다 발목을 삐끗하고 심하게 부음)"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={isAiLoading || !aiInput.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-40"
            >
              {isAiLoading ? '분석 중...' : 'AI 매칭 검색'}
            </button>
            {aiResults && (
              <button
                type="button"
                onClick={() => { setAiResults(null); setAiInput(''); }}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                초기화
              </button>
            )}
          </form>

          {/* AI Matching Results (Top 1~3) */}
          {aiResults && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                AI 추천 지식백과 매칭 결과 ({aiResults.length}건)
              </div>
              {aiResults.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">
                  일치하는 지식백과 항목을 찾지 못했습니다. 아래 종목별 백과를 확인해주세요.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {aiResults.map(({ entry, confidence }, idx) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 shadow-xs space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          #{idx + 1} {entry.title}
                        </span>
                        {getSeverityBadge(entry.severity)}
                      </div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                        일치도: {confidence}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {entry.symptoms}
                      </p>
                      <div className="pt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        응급처치: {entry.firstAid}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sport Category Tabs: Soccer, Basketball, Dodgeball, Relay */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5">
            {[
              { key: 'soccer', label: '축구' },
              { key: 'basketball', label: '농구' },
              { key: 'dodgeball', label: '피구' },
              { key: 'relay_male', label: '계주' },
              { key: 'common', label: '공통 부상' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isHealthOfficer && (
            <button
              type="button"
              onClick={() => {
                setEditingInjury({ sport: activeTab === 'common' ? 'soccer' : activeTab, severity: 'mild' });
                setShowEditor(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>항목 추가 (보건담당)</span>
            </button>
          )}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredInjuries.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              등록된 부상 지식백과 항목이 없습니다. 보건 담당자가 콘텐츠를 등록할 수 있습니다.
            </div>
          ) : (
            filteredInjuries.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    {getSeverityBadge(item.severity)}
                  </div>
                  <span className="text-[11px] text-slate-400 uppercase font-mono">
                    {item.sport}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">주요 증상 및 판별 기준:</span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {item.symptoms}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    단계별 응급처치 (R.I.C.E. 등):
                  </span>
                  <p className="leading-relaxed text-[11px]">{item.firstAid}</p>
                </div>

                {item.prevention && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">예방 수칙: </span>
                    {item.prevention}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Modal for Health Officer */}
      {showEditor && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">부상 지식백과 등록 (보건담당)</h3>
              <button onClick={() => setShowEditor(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveInjury} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">종목</label>
                <select
                  value={editingInjury.sport}
                  onChange={(e) => setEditingInjury({ ...editingInjury, sport: e.target.value as any })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="soccer">축구</option>
                  <option value="basketball">농구</option>
                  <option value="dodgeball">피구</option>
                  <option value="relay_male">계주</option>
                  <option value="common">공통</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">부상명</label>
                <input
                  type="text"
                  value={editingInjury.title || ''}
                  onChange={(e) => setEditingInjury({ ...editingInjury, title: e.target.value })}
                  placeholder="예: 발목 염좌"
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">심각도 구분</label>
                <select
                  value={editingInjury.severity}
                  onChange={(e) => setEditingInjury({ ...editingInjury, severity: e.target.value as any })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="mild">경증</option>
                  <option value="moderate">중등도</option>
                  <option value="emergency">중증 (응급/119)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">증상 및 발생 상황</label>
                <textarea
                  value={editingInjury.symptoms || ''}
                  onChange={(e) => setEditingInjury({ ...editingInjury, symptoms: e.target.value })}
                  rows={2}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">응급처치 요령 (R.I.C.E. 단계 등)</label>
                <textarea
                  value={editingInjury.firstAid || ''}
                  onChange={(e) => setEditingInjury({ ...editingInjury, firstAid: e.target.value })}
                  rows={2}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
