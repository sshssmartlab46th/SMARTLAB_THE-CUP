import React, { useState } from 'react';
import { InjuryGuide, SangsanUser, SportType } from '../types';
import { INJURY_DATABASE } from '../data/mockFestivalData';
import {
  HeartPulse,
  AlertTriangle,
  ShieldCheck,
  Search,
  Sparkles,
  Camera,
  Trash2,
  FileCheck,
  Activity,
  Plus,
} from 'lucide-react';

interface InjuryEncyclopediaProps {
  currentUser: SangsanUser | null;
}

export const InjuryEncyclopedia: React.FC<InjuryEncyclopediaProps> = ({ currentUser }) => {
  const [guides, setGuides] = useState<InjuryGuide[]>(INJURY_DATABASE);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<InjuryGuide>(guides[0]);

  // AI Inference & Strict Privacy state
  const [aiInputText, setAiInputText] = useState('');
  const [hasUploadedPhoto, setHasUploadedPhoto] = useState(false);
  const [photoDestroyedConfirmed, setPhotoDestroyedConfirmed] = useState(false);
  const [aiResultSummary, setAiResultSummary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isHealthOfficerAuthorized =
    currentUser?.role === 'admin' || currentUser?.role === 'health_officer';

  // AI Matching with strict privacy disposal
  const handleRunAiAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputText.trim() && !hasUploadedPhoto) return;

    setIsAnalyzing(true);
    setAiResultSummary(null);

    // Simulate AI inference & instant memory wipe for uploaded photo
    setTimeout(() => {
      setIsAnalyzing(false);
      if (hasUploadedPhoto) {
        setPhotoDestroyedConfirmed(true);
      }

      // RAG matching logic based on keywords
      const lower = aiInputText.toLowerCase();
      let matchedGuide = guides[0];
      if (lower.includes('발목') || lower.includes('접질') || lower.includes('발')) {
        matchedGuide = guides.find((g) => g.id === 'inj-1') || guides[0];
      } else if (lower.includes('손가락') || lower.includes('잼') || lower.includes('손')) {
        matchedGuide = guides.find((g) => g.id === 'inj-2') || guides[1];
      } else if (lower.includes('얼굴') || lower.includes('머리') || lower.includes('코피')) {
        matchedGuide = guides.find((g) => g.id === 'inj-3') || guides[2];
      } else if (lower.includes('허벅지') || lower.includes('햄스트링') || lower.includes('달리기')) {
        matchedGuide = guides.find((g) => g.id === 'inj-4') || guides[3];
      }

      setSelectedGuide(matchedGuide);
      setAiResultSummary(
        `[AI 분석 완료] 분석 증상: "${aiInputText || '환부 사진 기반 분석'}".\n가장 유력한 진단: "${matchedGuide.title}". 권장 행동: ${matchedGuide.firstAidSteps[0]}`
      );
    }, 1200);
  };

  const handleSimulatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setHasUploadedPhoto(true);
      setPhotoDestroyedConfirmed(false);
    }
  };

  const filteredGuides = guides.filter((g) => {
    const matchesSport = selectedSport === 'all' || g.sport === selectedSport;
    const matchesQuery =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.symptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSport && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Strict Privacy Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-900/60 p-4 rounded-xl flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-rose-300">
            상산고 보건실 & AI 긴급 응급처치 지식백과 (부상 사진 파기 의무 준수)
          </p>
          <p className="text-slate-300 leading-relaxed">
            학생들의 민감한 신체 부위 및 환부 사진은{' '}
            <strong className="text-white underline decoration-rose-500">
              AI 추론 즉시 메모리 및 저장소에서 영구 삭제
            </strong>
            되며, 오직 텍스트 요약 진단만 보존됩니다.
          </p>
        </div>
      </div>

      {/* AI First-Aid Matcher Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-serif">
              AI 실시간 응급처치 분석기 (Grok/Gemini RAG Pattern)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            증상 묘사 또는 환부 상태 입력 시 매뉴얼 즉시 검색
          </span>
        </div>

        <form onSubmit={handleRunAiAnalysis} className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              placeholder="예: 축구 경기 중 발목이 안쪽으로 꺾여서 부어오르고 디딜 수가 없어요"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />

            {/* Photo input with auto-destroy indicator */}
            <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg border border-slate-700 cursor-pointer transition">
              <Camera className="w-4 h-4 text-slate-400" />
              <span>{hasUploadedPhoto ? '사진 첨부됨 (즉시파기 대기)' : '환부 사진 첨부'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleSimulatePhotoUpload}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-5 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg transition shadow"
            >
              {isAnalyzing ? 'AI 분석 중...' : '응급처치 매뉴얼 매칭'}
            </button>
          </div>

          {/* Privacy confirmation badge */}
          {photoDestroyedConfirmed && (
            <div className="flex items-center gap-2 text-emerald-400 text-[11px] bg-emerald-950/40 p-2 rounded border border-emerald-800/40">
              <ShieldCheck className="w-4 h-4" />
              <span>[개인정보 보호 준수] 분석이 완료되어 업로드된 사진이 메모리에서 안전하게 영구 파기되었습니다.</span>
            </div>
          )}

          {/* AI Result Box */}
          {aiResultSummary && (
            <div className="bg-slate-950 p-4 rounded-xl border border-red-900/60 text-slate-200 text-xs leading-relaxed space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                AI 매칭 결과 요약
              </div>
              <p className="whitespace-pre-line">{aiResultSummary}</p>
            </div>
          )}
        </form>
      </div>

      {/* Main Encyclopedia Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Guide List & Filters */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="증상 또는 부상명 검색..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: '전체' },
              { id: 'soccer', label: '축구' },
              { id: 'basketball', label: '농구' },
              { id: 'dodgeball', label: '피구' },
              { id: 'relay_male', label: '계주' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedSport(cat.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  selectedSport === cat.id
                    ? 'bg-red-900 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                className={`p-3.5 rounded-xl border cursor-pointer transition text-xs ${
                  selectedGuide.id === guide.id
                    ? 'bg-slate-800 border-red-800 ring-1 ring-red-700/50'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white font-serif">{guide.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      guide.severity === 'severe'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : guide.severity === 'moderate'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {guide.severity === 'severe'
                      ? '응급'
                      : guide.severity === 'moderate'
                      ? '주의'
                      : '경미'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  증상: {guide.symptoms.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detailed Protocol & RICE Steps */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                  {selectedGuide.sport}
                </span>
                <h3 className="text-lg font-bold text-white font-serif">
                  {selectedGuide.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                상산고등학교 보건실 공식 인증 응급처치 표준 프로토콜
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedGuide.severity === 'severe'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : selectedGuide.severity === 'moderate'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-blue-950 text-blue-300 border border-blue-800'
              }`}
            >
              중증도:{' '}
              {selectedGuide.severity === 'severe'
                ? '응급(의무대 후송)'
                : selectedGuide.severity === 'moderate'
                ? '주의(보건실 방문)'
                : '경미(현장 조치)'}
            </span>
          </div>

          {/* Symptoms List */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-red-400" />
              주요 증상 확인 (Symptoms)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {selectedGuide.symptoms.map((symp, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200"
                >
                  • {symp}
                </div>
              ))}
            </div>
          </div>

          {/* RICE Protocol Highlight Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-red-900/50 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-red-400" />
              R.I.C.E. 표준 응급처치 4대 원칙
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-bold text-red-400 font-mono">R - REST (안정)</span>
                <p className="text-slate-300 mt-1">{selectedGuide.riceProtocol.rest}</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-bold text-blue-400 font-mono">I - ICE (냉찜질)</span>
                <p className="text-slate-300 mt-1">{selectedGuide.riceProtocol.ice}</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-bold text-emerald-400 font-mono">C - COMPRESSION (압박)</span>
                <p className="text-slate-300 mt-1">{selectedGuide.riceProtocol.compression}</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-bold text-purple-400 font-mono">E - ELEVATION (거상)</span>
                <p className="text-slate-300 mt-1">{selectedGuide.riceProtocol.elevation}</p>
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
              현장 조치 세부 단계
            </h4>
            <ol className="space-y-2 text-xs">
              {selectedGuide.firstAidSteps.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-slate-300"
                >
                  <span className="font-mono font-bold text-red-400">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Emergency contacts footer */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>보건부스 위치: 상산체육관 1층 의무실</span>
            <span className="text-red-400 font-semibold">응급 연락처: 063-239-5300 (내선 119)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
