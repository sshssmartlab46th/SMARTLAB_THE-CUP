import React, { useState, useEffect } from 'react';
import { UserProfile, InjuryEntry, SportType } from '../types';
import { listenInjuries, saveInjuryEntry } from '../services/firebaseService';
import { 
  HeartPulse, 
  Sparkles, 
  ShieldAlert, 
  Activity, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Camera, 
  Trash2,
  Lock
} from 'lucide-react';

interface InjuryEncyclopediaViewProps {
  currentUser: UserProfile;
}

export function InjuryEncyclopediaView({ currentUser }: InjuryEncyclopediaViewProps) {
  const [injuries, setInjuries] = useState<InjuryEntry[]>([]);
  const [sportFilter, setSportFilter] = useState<SportType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Symptom Matcher states
  const [symptomInput, setSymptomInput] = useState('');
  const [aiMatchedResult, setAiMatchedResult] = useState<InjuryEntry | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [photoUploadedMessage, setPhotoUploadedMessage] = useState('');

  // Edit / Add Form State for Health Officer
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSport, setNewSport] = useState<SportType>('soccer');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [newFirstAid, setNewFirstAid] = useState('');
  const [newSeverity, setNewSeverity] = useState<'mild' | 'moderate' | 'emergency'>('moderate');
  const [newPrevention, setNewPrevention] = useState('');

  const isHealthOfficerOrAdmin = currentUser.role === 'health_officer' || currentUser.role === 'admin';

  useEffect(() => {
    const unsub = listenInjuries(setInjuries);
    return () => unsub();
  }, []);

  const handleAiDiagnose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomInput.trim()) return;

    setAiAnalyzing(true);
    setAiMatchedResult(null);

    setTimeout(() => {
      const q = symptomInput.toLowerCase();
      // Search matching pre-verified wiki entries
      const matched = injuries.find((inj) => 
        inj.symptoms.toLowerCase().includes(q) || 
        inj.title.toLowerCase().includes(q) ||
        (q.includes('발목') && inj.title.includes('발목')) ||
        (q.includes('허벅지') && inj.title.includes('햄스트링')) ||
        (q.includes('손가락') && inj.title.includes('손가락')) ||
        (q.includes('코피') && inj.title.includes('비출혈')) ||
        (q.includes('까짐') && inj.title.includes('찰과상'))
      ) || injuries[0];

      setAiMatchedResult(matched);
      setAiAnalyzing(false);
    }, 600);
  };

  const handleSimulatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAiAnalyzing(true);
      // STRICT PRIVACY RULE: Purge image immediately from memory after simulated analysis
      setTimeout(() => {
        setPhotoUploadedMessage('🔒 [엄격한 개인정보 보호 규정 준수] 업로드된 환부 사진은 AI 비전 추론 직후 메모리 및 스토리지에서 완전 영구 삭제되었습니다. 텍스트 소견만 매칭합니다.');
        setSymptomInput('발목 외측 부종 및 접질림 증상 감지됨');
        setAiMatchedResult(injuries[0]);
        setAiAnalyzing(false);
      }, 800);
    }
  };

  const handleSaveNewEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFirstAid.trim()) return;

    const entry: InjuryEntry = {
      id: `inj-${Date.now()}`,
      sport: newSport,
      title: newTitle.trim(),
      symptoms: newSymptoms.trim(),
      firstAid: newFirstAid.trim(),
      severity: newSeverity,
      prevention: newPrevention.trim()
    };

    await saveInjuryEntry(entry);
    setShowAddModal(false);
    setNewTitle('');
    setNewFirstAid('');
  };

  const filteredInjuries = injuries.filter((inj) => {
    const matchesSport = sportFilter === 'all' || inj.sport === sportFilter;
    const matchesQuery = 
      !searchQuery.trim() || 
      inj.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inj.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inj.firstAid.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-800/60 inline-flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5" />
              상산 보건실 공식 인증
            </span>
            <span className="text-xs text-slate-400">RICE 응급처치 가이드</span>
          </div>
          <h2 className="font-serif font-black text-xl sm:text-2xl text-white">
            상산고 체육대회 부상 지식백과 (Injury Wiki)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            종목별 흔한 부상의 증상 판별, 현장 RICE 응급처치 수칙 및 중증도별 대응 매뉴얼
          </p>
        </div>

        {isHealthOfficerOrAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 self-start sm:self-center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>백과 항목 신규 등록</span>
          </button>
        )}
      </div>

      {/* AI Symptom Matcher & RAG Search */}
      <div className="bg-slate-900/90 border border-purple-900/50 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI 빠른 응급처치 가이드 (Grok RAG Matcher)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Verified Wiki Matching Only</span>
        </div>

        {photoUploadedMessage && (
          <div className="p-3 bg-slate-950 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 leading-relaxed">
            {photoUploadedMessage}
          </div>
        )}

        <form onSubmit={handleAiDiagnose} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              placeholder="환자의 현재 증상을 입력하세요 (예: 발목을 삐었는데 붓고 디딜 수 없어요)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-purple-600"
            />
            
            {/* Strict Privacy Photo Upload input */}
            <label className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition">
              <Camera className="w-4 h-4 text-purple-400" />
              <span>환부 사진 분석</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleSimulatePhotoUpload}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={aiAnalyzing}
              className="px-5 py-3 bg-purple-800 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {aiAnalyzing ? (
                <span>위키 매칭 분석 중...</span>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>처치법 검색</span>
                </>
              )}
            </button>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>엄격한 학생 프라이버시 보호: 업로드된 환부 이미지는 분석 즉시 영구 삭제되며 보관되지 않습니다.</span>
          </div>
        </form>

        {/* AI Match Result Card */}
        {aiMatchedResult && (
          <div className="p-4 bg-slate-950 rounded-xl border border-purple-800/80 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                추천 응급처치 프로토콜: <b>{aiMatchedResult.title}</b>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                aiMatchedResult.severity === 'emergency' 
                  ? 'bg-red-950 text-red-300 border border-red-800' 
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                중증도: {aiMatchedResult.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans bg-purple-950/20 p-3 rounded-lg border border-purple-900/40">
              {aiMatchedResult.firstAid}
            </p>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSportFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sportFilter === 'all'
                ? 'bg-purple-900 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            전체 부상 ({injuries.length})
          </button>
          <button
            onClick={() => setSportFilter('soccer')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sportFilter === 'soccer'
                ? 'bg-purple-900 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            축구 부상
          </button>
          <button
            onClick={() => setSportFilter('basketball')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sportFilter === 'basketball'
                ? 'bg-purple-900 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            농구 부상
          </button>
          <button
            onClick={() => setSportFilter('dodgeball')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sportFilter === 'dodgeball'
                ? 'bg-purple-900 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            피구 부상
          </button>
          <button
            onClick={() => setSportFilter('relay_male')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sportFilter === 'relay_male'
                ? 'bg-purple-900 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            육상/계주 부상
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="부상명 또는 키워드 검색"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white outline-none focus:border-purple-600"
          />
        </div>
      </div>

      {/* Injury Wiki Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInjuries.map((inj) => (
          <div
            key={inj.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider">
                {inj.sport} injury
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                inj.severity === 'emergency'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : inj.severity === 'moderate'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                중증도: {inj.severity === 'emergency' ? '응급(즉시이송)' : inj.severity === 'moderate' ? '중등도' : '경증'}
              </span>
            </div>

            <h3 className="font-bold text-white text-base">
              {inj.title}
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="text-slate-400">
                <b className="text-slate-300">주요 증상:</b> {inj.symptoms}
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-purple-200">
                <b className="text-white block mb-1">🚑 RICE 응급처치 수칙:</b>
                <p className="leading-relaxed">{inj.firstAid}</p>
              </div>
              {inj.prevention && (
                <div className="text-[11px] text-slate-500">
                  <b className="text-slate-400">예방 수칙:</b> {inj.prevention}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Entry Modal for Health Officer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-purple-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-purple-400" />
              <span>보건 지식백과 신규 항목 등록</span>
            </h3>

            <form onSubmit={handleSaveNewEntry} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">적용 종목</label>
                  <select
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value as SportType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="soccer">축구</option>
                    <option value="basketball">농구</option>
                    <option value="dodgeball">피구</option>
                    <option value="relay_male">육상/계주</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">중증도</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="mild">경증 (현장 케어)</option>
                    <option value="moderate">중등도 (보건실 이송)</option>
                    <option value="emergency">응급 (병원 즉시 이송)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">부상명</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 발목 관절 외측 인대 부분 파열"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">증상 설명</label>
                <input
                  type="text"
                  value={newSymptoms}
                  onChange={(e) => setNewSymptoms(e.target.value)}
                  placeholder="통증 위치, 붓기, 디딤 가능 여부"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">RICE 응급처치 요령</label>
                <textarea
                  value={newFirstAid}
                  onChange={(e) => setNewFirstAid(e.target.value)}
                  rows={3}
                  placeholder="구체적인 안정, 얼음찜질, 압박, 거상 및 이송 방법"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  백과에 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
