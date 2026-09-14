import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  AlertTriangle, 
  PhoneCall, 
  Sparkles,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export const InjuryEncyclopediaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'encyclopedia' | 'ai_consultant'>('encyclopedia');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedInjuryId, setSelectedInjuryId] = useState<string>('ankle-sprain');

  // AI Matching / Triage State
  const [injuryDesc, setInjuryDesc] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Standard Knowledge Base
  const INJURIES_DATABASE = [
    {
      id: 'ankle-sprain',
      name: '발목 염좌 (접질림)',
      sport: '축구, 농구, 계주',
      severity: 'MODERATE',
      summary: '발목 관절을 지탱하는 인대가 늘어나거나 파열된 상태',
      riceSteps: [
        { label: 'Rest (안정)', detail: '체중 부하를 즉시 중단하고 경기장에서 부축하여 안전지대로 이동합니다.' },
        { label: 'Ice (냉찜질)', detail: '15~20분간 얼음팩을 수건에 감싸 대어 혈관 수축 및 부종을 방지합니다.' },
        { label: 'Compression (압박)', detail: '탄력 붕대로 압박하되 혈액순환이 방해되지 않도록 합니다.' },
        { label: 'Elevation (거상)', detail: '심장보다 높은 위치로 발목을 올려 정맥혈 환류를 돕습니다.' }
      ],
      warning: '체중을 딛지 못할 정도의 극심한 통증이나 뼈 부위 압통 시 골절 의심 (의무실 즉시 이송)'
    },
    {
      id: 'muscle-cramp',
      name: '근육 경련 (쥐남 / 탈수)',
      sport: '축구, 줄다리기, 계주',
      severity: 'MILD',
      summary: '과도한 운동과 전해질/수분 부족으로 인한 불수의적 근수축',
      riceSteps: [
        { label: '스트레칭', detail: '무릎을 펴고 발끝을 몸쪽으로 천천히 당겨 비복근을 늘려줍니다.' },
        { label: '마사지', detail: '경련 부위를 부드럽게 주무르고 온찜질로 이완시킵니다.' },
        { label: '수분 보충', detail: '이온 음료나 식염 포도당을 섭취하여 전해질을 회복합니다.' }
      ],
      warning: '경련이 지속되거나 의식 저하, 오한을 동반할 경우 열사병 의심'
    },
    {
      id: 'abrasion',
      name: '찰과상 (쓸림 / 피부 까짐)',
      sport: '대운동장 전 종목',
      severity: 'MILD',
      summary: '운동장 인조잔디/마사토 마찰로 인한 피부 표피 손상',
      riceSteps: [
        { label: '세척', detail: '생리식염수나 흐르는 깨끗한 물로 이물질을 철저히 씻어냅니다.' },
        { label: '소독', detail: '포비돈/소독액으로 상처 주변을 소독합니다.' },
        { label: '드레싱', detail: '항생제 연고 도포 후 멸균 거즈 또는 습윤 밴드로 보호합니다.' }
      ],
      warning: '모래나 이물질이 깊게 박힌 경우 무리하게 긁어내지 말고 의무실 방문'
    },
    {
      id: 'heat-exhaustion',
      name: '열탈진 및 탈수 (일사병)',
      sport: '야외 전 종목',
      severity: 'CRITICAL',
      summary: '고온 직사광선 환경에서 땀 배출 과다로 인한 체액 불균형',
      riceSteps: [
        { label: '그늘 이동', detail: '서늘한 본관 그늘이나 에어컨이 가동되는 보건실로 즉시 이동합니다.' },
        { label: '체온 냉각', detail: '단추를 풀고 목, 겨드랑이 등에 얼음팩을 대어 체온을 낮춥니다.' },
        { label: '수분 공급', detail: '의식이 온전할 때만 시원한 물/이온음료를 천천히 마시게 합니다.' }
      ],
      warning: '의식이 혼미하거나 땀이 전혀 나지 않는 체온 40도 이상 시 열사병(119 즉시 신고)'
    }
  ];

  const filteredList = INJURIES_DATABASE.filter(item => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return item.name.toLowerCase().includes(kw) || item.sport.toLowerCase().includes(kw);
  });

  const selectedInjury = INJURIES_DATABASE.find(i => i.id === selectedInjuryId) || INJURIES_DATABASE[0];

  // AI Instant First Aid Matching
  const handleAiConsult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!injuryDesc.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      const q = injuryDesc.toLowerCase();
      let matched = INJURIES_DATABASE[0];
      if (q.includes('쥐') || q.includes('경련') || q.includes('당김')) {
        matched = INJURIES_DATABASE[1];
      } else if (q.includes('피') || q.includes('까짐') || q.includes('쓸림') || q.includes('상처')) {
        matched = INJURIES_DATABASE[2];
      } else if (q.includes('어지') || q.includes('더위') || q.includes('탈수') || q.includes('열')) {
        matched = INJURIES_DATABASE[3];
      }

      setAiResult(`[판정 결과]: ${matched.name} (중증도: ${matched.severity})
[요약 권고]: ${matched.summary}
[현장 필수 조치]:
${matched.riceSteps.map(s => `• ${s.label}: ${s.detail}`).join('\n')}

[주의사항]: ${matched.warning}
※ 본 자문은 보건의무본부 긴급 지침이며, 증상 지속 시 본관 1층 의무실로 즉시 이송하십시오.`);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-red-600 dark:text-emerald-400" />
            상산고 실시간 부상 백과 & 응급조치
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            운동장 및 체육관 경기 중 발생하는 스포츠 부상 대처법과 즉시 처치 가이드를 제공합니다.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('encyclopedia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'encyclopedia'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            스포츠 부상 백과
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai_consultant')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'ai_consultant'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            증상 검색 & 즉시 처치
          </button>
        </div>
      </div>

      {activeTab === 'encyclopedia' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left list */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="부상명, 종목 검색..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500 transition"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <div className="space-y-2">
              {filteredList.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedInjuryId(item.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-1 ${
                    selectedInjuryId === item.id
                      ? 'bg-red-50/70 dark:bg-red-950/40 border-red-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.severity === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : item.severity === 'MODERATE'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    주요 종목: {item.sport}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Detail */}
          <div className="lg:col-span-8 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedInjury.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedInjury.summary}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold">
                <PhoneCall className="w-4 h-4" />
                보건실: 내선 305
              </div>
            </div>

            {/* RICE steps */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                현장 응급처치 수칙 (RICE 프로토콜)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedInjury.riceSteps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <span className="text-xs font-bold text-red-600 dark:text-emerald-400">
                      {step.label}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">중증 경고 증상</strong>
                <p className="mt-0.5">{selectedInjury.warning}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Symptom Matching Tab */
        <div className="max-w-2xl mx-auto p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>상산고등학교 보건실 인증 RICE 및 트리아지 응급처치 가이드라인입니다.</span>
          </div>

          <form onSubmit={handleAiConsult} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                환자의 부상 증상 및 상황 키워드 입력
              </label>
              <textarea
                rows={3}
                value={injuryDesc}
                onChange={(e) => setInjuryDesc(e.target.value)}
                placeholder="예: 축구 경기 중 발목을 심하게 접질렸고 부어오르고 있습니다 / 종아리에 쥐가 났습니다."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-red-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !injuryDesc.trim()}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isLoading ? '의료 지침 매칭 중...' : '응급처치 가이드 즉시 조회'}
            </button>
          </form>

          {aiResult && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                응급처치 권고안
              </h4>
              <pre className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {aiResult}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
