import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Edit3,
  ExternalLink,
  FileImage,
  HeartPulse,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { InjuryAttachment, InjuryEntry, SportType, UserProfile, UserRole } from '../../types';
import { deleteInjuryEntry, listenInjuries, saveInjuryEntry } from '../../services/firebaseService';
import { compressImageFile } from '../../utils/imageCompressor';
import { askGroq } from '../../services/groqService';

interface InjuryEncyclopediaPageProps {
  currentUser?: UserProfile | null;
}

type InjuryFilter = 'all' | SportType | 'common';

const EDITOR_ROLES: UserRole[] = ['admin', 'health_officer', 'student_council'];

const SPORT_OPTIONS: Array<{ value: InjuryEntry['sport']; label: string }> = [
  { value: 'common', label: '공통' },
  { value: 'soccer', label: '축구' },
  { value: 'basketball', label: '농구' },
  { value: 'dodgeball', label: '피구' },
  { value: 'relay_male', label: '남자 계주' },
  { value: 'relay_female', label: '여자 계주' },
  { value: 'tug_of_war', label: '줄다리기' },
  { value: 'group_rope', label: '단체 줄넘기' }
];

const STARTER_ENTRIES: InjuryEntry[] = [
  {
    id: 'ankle-sprain',
    sport: 'common',
    title: '발목 염좌 (접질림)',
    summary: '발목 인대가 늘어나거나 일부 손상된 상태입니다.',
    symptoms: '접질린 직후 통증, 부기, 멍, 발목 움직임 제한과 체중 부하 시 통증이 나타납니다.',
    commonCauses: '점프 착지, 방향 전환, 다른 선수의 발을 밟는 상황에서 흔합니다.',
    firstAid: '활동을 즉시 중단하고 안전한 곳으로 이동합니다.\n냉찜질은 천으로 감싸 15~20분 시행합니다.\n탄력 붕대로 가볍게 압박하고 발목을 심장보다 높게 올립니다.',
    prevention: '경기 전 발목과 종아리 워밍업을 하고, 바닥에 맞는 운동화를 착용합니다.',
    redFlags: ['뼈를 눌렀을 때 심한 압통', '발을 전혀 디딜 수 없음', '빠르게 커지는 부기나 변형'],
    whenToSeekCare: '위험 신호가 있거나 24~48시간 안에 통증과 부기가 줄지 않으면 보건실 또는 의료기관에서 확인합니다.',
    severity: 'moderate',
    tags: ['발목', '염좌', 'RICE']
  },
  {
    id: 'muscle-cramp',
    sport: 'common',
    title: '근육 경련 (쥐)',
    summary: '피로, 탈수 또는 전해질 불균형으로 근육이 갑자기 수축하는 상태입니다.',
    symptoms: '종아리나 허벅지 근육이 단단하게 뭉치고 갑작스러운 통증과 움직임 제한이 생깁니다.',
    commonCauses: '더운 날씨, 장시간 운동, 수분 부족, 준비운동 부족이 원인이 될 수 있습니다.',
    firstAid: '활동을 중단하고 그늘에서 쉬게 합니다.\n통증이 줄어드는 범위에서 근육을 천천히 늘립니다.\n의식이 또렷하면 물이나 전해질 음료를 조금씩 마십니다.',
    prevention: '운동 전후 수분을 보충하고, 종아리·허벅지 스트레칭을 충분히 합니다.',
    redFlags: ['10분 이상 지속되는 심한 경련', '실신·혼란·호흡 곤란', '반복되는 전신 근육 경련'],
    whenToSeekCare: '경련이 반복되거나 의식 변화, 열감, 전신 쇠약이 동반되면 즉시 보건실로 이동합니다.',
    severity: 'mild',
    tags: ['경련', '탈수', '스트레칭']
  },
  {
    id: 'abrasion',
    sport: 'common',
    title: '찰과상 (쓸림·피부 까짐)',
    summary: '넘어지거나 미끄러지며 피부 표면이 마찰로 벗겨진 상처입니다.',
    symptoms: '피부가 벗겨지고 따갑거나 소량의 출혈이 있으며 흙·잔디 이물이 묻을 수 있습니다.',
    commonCauses: '운동장, 인조잔디, 마사토에서 넘어지거나 미끄러질 때 발생합니다.',
    firstAid: '손을 씻고 흐르는 깨끗한 물이나 생리식염수로 이물을 씻어냅니다.\n깨끗한 거즈로 지혈한 뒤 습윤 밴드나 멸균 거즈로 덮습니다.\n상처에 박힌 이물을 억지로 파내지 않습니다.',
    prevention: '경기장 상태를 확인하고 보호장비와 종목에 맞는 복장을 착용합니다.',
    redFlags: ['10분 이상 멈추지 않는 출혈', '깊게 벌어진 상처', '눈·얼굴·관절 부위의 큰 상처'],
    whenToSeekCare: '오염이 심하거나 상처가 깊고 넓으면 보건실에서 세척과 드레싱을 받습니다.',
    severity: 'mild',
    tags: ['상처', '출혈', '세척']
  },
  {
    id: 'heat-exhaustion',
    sport: 'common',
    title: '열탈진·탈수',
    summary: '더운 환경에서 땀을 많이 흘려 체액과 염분이 부족해진 상태입니다.',
    symptoms: '심한 갈증, 두통, 어지러움, 메스꺼움, 창백하고 축축한 피부, 무기력이 나타날 수 있습니다.',
    commonCauses: '고온 다습한 날씨에서 장시간 경기하거나 수분 섭취가 부족할 때 발생합니다.',
    firstAid: '즉시 경기를 중단하고 그늘이나 냉방 공간으로 이동합니다.\n목·겨드랑이·사타구니를 시원하게 하고 옷을 느슨하게 합니다.\n의식이 또렷할 때만 물이나 전해질 음료를 조금씩 마십니다.',
    prevention: '경기 전후와 휴식 시간에 수분을 섭취하고, 더운 시간대에는 그늘에서 충분히 쉽니다.',
    redFlags: ['의식이 흐려짐 또는 실신', '경련', '말이 어눌해짐', '뜨겁고 마른 피부 또는 체온 상승'],
    whenToSeekCare: '의식 변화, 경련, 실신이 있으면 음료를 억지로 먹이지 말고 119에 신고합니다.',
    severity: 'emergency',
    tags: ['열탈진', '탈수', '온열질환']
  },
  {
    id: 'concussion',
    sport: 'common',
    title: '뇌진탕 의심',
    summary: '머리에 충격 후 일시적으로 뇌 기능이 변한 상태일 수 있습니다.',
    symptoms: '두통, 어지러움, 구역감, 멍한 느낌, 기억 공백, 빛·소리에 대한 민감성이 나타날 수 있습니다.',
    commonCauses: '충돌, 넘어짐, 공이나 장비에 머리를 맞는 상황에서 발생할 수 있습니다.',
    firstAid: '경기를 즉시 중단하고 혼자 두지 않습니다.\n머리와 목을 불필요하게 움직이지 않으며 보건 담당자에게 알립니다.\n증상이 사라져도 당일 경기에 복귀하지 않습니다.',
    prevention: '종목별 보호장비를 올바르게 착용하고 충돌 위험이 있는 상황에서 속도를 줄입니다.',
    redFlags: ['반복 구토', '점점 심해지는 두통', '경련·실신', '한쪽 팔다리 힘 빠짐', '동공 크기 차이'],
    whenToSeekCare: '위험 신호가 하나라도 있으면 즉시 119에 연락합니다. 증상이 가벼워도 보호자와 의료진의 확인을 받습니다.',
    severity: 'emergency',
    tags: ['머리', '충돌', '뇌진탕']
  }
];

const emptyDraft = (sport: InjuryEntry['sport'] = 'common'): Partial<InjuryEntry> => ({
  sport,
  severity: 'mild',
  title: '',
  summary: '',
  symptoms: '',
  commonCauses: '',
  firstAid: '',
  prevention: '',
  redFlags: [],
  whenToSeekCare: '',
  tags: [],
  attachments: [],
  sourceUrl: '',
  published: true
});

const severityLabel: Record<InjuryEntry['severity'], string> = {
  mild: '경증',
  moderate: '중등도',
  emergency: '응급'
};

const severityClass: Record<InjuryEntry['severity'], string> = {
  mild: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
};

const roleLabel: Record<string, string> = {
  admin: '관리자',
  health_officer: '보건 담당',
  student_council: '학생회'
};

function formatUpdatedAt(value?: string) {
  if (!value) return '기본 제공 문서';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export const InjuryEncyclopediaPage: React.FC<InjuryEncyclopediaPageProps> = ({ currentUser }) => {
  const [firestoreEntries, setFirestoreEntries] = useState<InjuryEntry[]>([]);
  const [selectedId, setSelectedId] = useState(STARTER_ENTRIES[0].id);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filter, setFilter] = useState<InjuryFilter>('all');
  const [activeView, setActiveView] = useState<'encyclopedia' | 'ai'>('encyclopedia');
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<InjuryEntry>>(emptyDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState('');
  const [aiError, setAiError] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const canManage = Boolean(currentUser && EDITOR_ROLES.includes(currentUser.role));

  useEffect(() => {
    const unsubscribe = listenInjuries((items) => {
      setFirestoreEntries(items);
      setIsLoadingEntries(false);
    });
    return unsubscribe;
  }, []);

  const entries = useMemo(() => {
    const merged = new Map(STARTER_ENTRIES.map((entry) => [entry.id, entry]));
    firestoreEntries.forEach((entry) => merged.set(entry.id, { ...merged.get(entry.id), ...entry }));
    return Array.from(merged.values()).filter((entry) => canManage || entry.published !== false);
  }, [canManage, firestoreEntries]);

  const filteredEntries = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesFilter = filter === 'all' || entry.sport === filter;
      const haystack = [
        entry.title,
        entry.summary,
        entry.symptoms,
        entry.commonCauses,
        ...(entry.tags || [])
      ].filter(Boolean).join(' ').toLowerCase();
      return matchesFilter && (!keyword || haystack.includes(keyword));
    });
  }, [entries, filter, searchKeyword]);

  const selectedEntry = entries.find((entry) => entry.id === selectedId) || filteredEntries[0] || entries[0];

  useEffect(() => {
    if (!selectedEntry && entries.length === 0) return;
    if (selectedEntry && selectedEntry.id !== selectedId) setSelectedId(selectedEntry.id);
  }, [entries, selectedEntry, selectedId]);

  const openEditor = (entry?: InjuryEntry) => {
    setEditorError('');
    setDraft(entry ? { ...entry, redFlags: [...(entry.redFlags || [])], tags: [...(entry.tags || [])], attachments: [...(entry.attachments || [])] } : emptyDraft());
    setEditorOpen(true);
  };

  const updateDraft = <K extends keyof InjuryEntry>(key: K, value: InjuryEntry[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleEditorImages = async (files: FileList | null) => {
    if (!files) return;
    const remaining = Math.max(0, 4 - (draft.attachments || []).filter((item) => item.type === 'image').length);
    const selectedFiles = Array.from(files).slice(0, remaining);
    const attachments = await Promise.all(selectedFiles.map(async (file) => ({
      id: `image-${Date.now()}-${file.name}`,
      name: file.name,
      type: 'image' as const,
      url: await compressImageFile(file, { maxWidth: 1100, maxHeight: 900, quality: 0.68 }),
      size: file.size
    })));
    updateDraft('attachments', [...(draft.attachments || []), ...attachments]);
  };

  const handleAiImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      setAiImage(await compressImageFile(file, { maxWidth: 1000, maxHeight: 800, quality: 0.68 }));
      setAiError('');
    } catch (error) {
      setAiError(error instanceof Error ? error.message : '이미지를 읽지 못했습니다.');
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !canManage) return;
    if (!draft.title?.trim() || !draft.firstAid?.trim() || !draft.symptoms?.trim()) {
      setEditorError('문서명, 증상 및 판별 기준, 응급처치는 필수입니다.');
      return;
    }

    setIsSaving(true);
    setEditorError('');
    const id = draft.id || `injury-${Date.now()}`;
    try {
      await saveInjuryEntry({
        id,
        sport: draft.sport || 'common',
        title: draft.title.trim(),
        summary: draft.summary?.trim() || '',
        symptoms: draft.symptoms.trim(),
        commonCauses: draft.commonCauses?.trim() || '',
        firstAid: draft.firstAid.trim(),
        prevention: draft.prevention?.trim() || '',
        redFlags: draft.redFlags || [],
        whenToSeekCare: draft.whenToSeekCare?.trim() || '',
        tags: draft.tags || [],
        severity: draft.severity || 'mild',
        attachments: draft.attachments || [],
        sourceUrl: draft.sourceUrl?.trim() || '',
        published: draft.published !== false,
        createdAt: draft.createdAt,
        updatedBy: `${currentUser.name} (${roleLabel[currentUser.role] || currentUser.role})`
      });
      setSelectedId(id);
      setEditorOpen(false);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : '문서를 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entry: InjuryEntry) => {
    if (!canManage || !firestoreEntries.some((item) => item.id === entry.id)) return;
    if (!window.confirm(`"${entry.title}" 문서를 삭제할까요?`)) return;
    try {
      await deleteInjuryEntry(entry.id);
      setSelectedId(STARTER_ENTRIES[0].id);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : '문서를 삭제하지 못했습니다.');
    }
  };

  const handleAiConsult = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!aiPrompt.trim() || isAiLoading) return;
    setIsAiLoading(true);
    setAiResult('');
    setAiError('');

    const context = entries.slice(0, 12).map((entry) => (
      `문서명: ${entry.title}\n중증도: ${severityLabel[entry.severity]}\n증상: ${entry.symptoms}\n응급처치: ${entry.firstAid}\n위험 신호: ${(entry.redFlags || []).join(', ')}`
    )).join('\n\n');

    const userContent = aiImage
      ? [
          { type: 'text' as const, text: `학생이 설명한 상황:\n${aiPrompt}\n\n아래 이미지는 참고용입니다. 사진만으로 확정 진단하지 마세요.` },
          { type: 'image_url' as const, image_url: { url: aiImage } }
        ]
      : `학생이 설명한 상황:\n${aiPrompt}`;

    try {
      const result = await askGroq([
        {
          role: 'system',
          content: `너는 학교 체육대회 보건실을 보조하는 안전 안내 AI다. 의학적 확정 진단이나 처방을 하지 말고, 아래 검수 문서를 근거로 한국어로 답하라.
반드시 다음 순서로 짧고 명확하게 답하라:
1) 가능성이 있는 상황(확정 진단 아님)
2) 지금 할 일 3~5개
3) 즉시 보건실/119로 가야 하는 위험 신호
4) 경기 복귀 전 주의사항
학생에게 겁을 주거나 사진을 저장한다고 말하지 말고, 심한 증상·의식 변화·호흡 곤란·변형·멈추지 않는 출혈이면 즉시 119를 안내하라.

검수된 지식백과:
${context}`
        },
        { role: 'user', content: userContent }
      ], {
        model: aiImage ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile',
        maxTokens: 900
      });
      setAiResult(result);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI 상담에 실패했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-[0.16em]">
              <BookOpen className="w-4 h-4" />
              SANGSAN HEALTH KNOWLEDGE BASE
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              스포츠 안전 지식백과
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              경기 중 자주 발생하는 부상과 응급상황을 증상·처치·위험 신호·예방 정보로 정리했습니다.
              문서는 보건 담당자와 운영진이 현장 기준에 맞게 관리합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-xs">
              <span className="block text-slate-400">등록 문서</span>
              <strong className="text-slate-900 dark:text-white">{entries.length}개</strong>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs">
              <span className="block text-emerald-600/70 dark:text-emerald-300/70">내 권한</span>
              <strong className="text-emerald-700 dark:text-emerald-300">
                {canManage ? roleLabel[currentUser?.role || ''] : '열람 전용'}
              </strong>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setActiveView('encyclopedia')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${activeView === 'encyclopedia' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            <BookOpen className="mr-1.5 inline-block h-3.5 w-3.5" />
            문서 찾아보기
          </button>
          <button
            type="button"
            onClick={() => setActiveView('ai')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${activeView === 'ai' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300'}`}
          >
            <Sparkles className="mr-1.5 inline-block h-3.5 w-3.5" />
            Groq AI 증상 상담
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => openEditor()}
              className="ml-auto rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-700"
            >
              <Plus className="mr-1.5 inline-block h-3.5 w-3.5" />
              새 문서 추가
            </button>
          )}
        </div>
      </header>

      {activeView === 'ai' ? (
        <section className="mx-auto max-w-4xl rounded-3xl border border-purple-200 bg-white p-5 shadow-xs dark:border-purple-900/50 dark:bg-slate-900 sm:p-7">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mr-1.5 inline-block h-4 w-4 align-text-bottom" />
            AI는 보건실 안내를 돕는 참고 도구입니다. 사진이나 설명만으로 진단하지 않습니다. 의식 변화, 호흡 곤란, 심한 출혈·변형이 있으면 AI보다 먼저 119에 연락하세요.
          </div>
          <div className="mt-6 flex items-start gap-3">
            <div className="rounded-2xl bg-purple-100 p-3 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-950 dark:text-white">증상을 설명하면 현장 대응 순서를 안내합니다</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">검수된 지식백과 내용을 함께 참고해 Groq가 답변합니다.</p>
            </div>
          </div>
          <form onSubmit={handleAiConsult} className="mt-5 space-y-3">
            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              rows={5}
              placeholder="예: 농구 착지 후 발목이 붓고 걷기 힘들어요. 언제 보건실에 가야 하나요?"
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <ImagePlus className="h-4 w-4 text-purple-500" />
                증상 사진 첨부 (선택)
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleAiImage(event.target.files?.[0])} />
              </label>
              {aiImage && (
                <button type="button" onClick={() => setAiImage(null)} className="text-xs text-red-600 hover:underline">
                  첨부 사진 제거
                </button>
              )}
              <button
                type="submit"
                disabled={isAiLoading || !aiPrompt.trim()}
                className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAiLoading ? <><Loader2 className="mr-1.5 inline-block h-4 w-4 animate-spin" />분석 중...</> : <><Sparkles className="mr-1.5 inline-block h-4 w-4" />Groq로 안전 안내 받기</>}
              </button>
            </div>
            {aiImage && <img src={aiImage} alt="AI 상담 첨부 미리보기" className="max-h-48 rounded-xl border border-slate-200 object-contain dark:border-slate-700" />}
          </form>
          {aiError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{aiError}</div>}
          {aiResult && (
            <div className="mt-5 rounded-2xl border border-purple-200 bg-purple-50/60 p-5 dark:border-purple-900/50 dark:bg-purple-950/20">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-purple-800 dark:text-purple-200"><Sparkles className="h-4 w-4" />AI 안전 안내</div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700 dark:text-slate-200">{aiResult}</pre>
            </div>
          )}
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="문서명, 증상, 태그 검색"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setFilter('all')} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${filter === 'all' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>전체</button>
                {SPORT_OPTIONS.slice(0, 5).map((option) => (
                  <button key={option.value} type="button" onClick={() => setFilter(option.value)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${filter === option.value ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {isLoadingEntries && <div className="rounded-2xl bg-white p-5 text-center text-xs text-slate-400 dark:bg-slate-900"><Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />문서를 불러오는 중...</div>}
              {!isLoadingEntries && filteredEntries.length === 0 && <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-400 dark:bg-slate-900">검색 결과가 없습니다.</div>}
              {filteredEntries.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className={`w-full rounded-2xl border p-3.5 text-left transition ${selectedEntry?.id === entry.id ? 'border-red-500 bg-red-50/70 dark:border-emerald-500 dark:bg-emerald-950/20' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{entry.title}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${severityClass[entry.severity]}`}>{severityLabel[entry.severity]}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{entry.summary || entry.symptoms}</p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400"><ChevronRight className="h-3 w-3" />{SPORT_OPTIONS.find((option) => option.value === entry.sport)?.label || entry.sport}</div>
                </button>
              ))}
            </div>
          </aside>

          <article className="min-h-[560px] rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            {selectedEntry ? (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${severityClass[selectedEntry.severity]}`}>{severityLabel[selectedEntry.severity]}</span>
                      <span className="text-[11px] font-bold text-slate-400">{SPORT_OPTIONS.find((option) => option.value === selectedEntry.sport)?.label || selectedEntry.sport}</span>
                      {selectedEntry.attachments?.length ? <span className="text-[11px] font-bold text-purple-500"><FileImage className="mr-1 inline h-3.5 w-3.5" />첨부 {selectedEntry.attachments.length}</span> : null}
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{selectedEntry.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{selectedEntry.summary || selectedEntry.symptoms}</p>
                    <p className="mt-2 text-[11px] text-slate-400">최종 검수: {formatUpdatedAt(selectedEntry.updatedAt)}{selectedEntry.updatedBy ? ` · ${selectedEntry.updatedBy}` : ''}</p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => openEditor(selectedEntry)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-red-400 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"><Edit3 className="mr-1 inline h-3.5 w-3.5" />편집</button>
                      {firestoreEntries.some((item) => item.id === selectedEntry.id) && <button type="button" onClick={() => handleDelete(selectedEntry)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"><Trash2 className="mr-1 inline h-3.5 w-3.5" />삭제</button>}
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                  <section>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><Activity className="h-4 w-4 text-red-500" />주요 증상 및 판별 기준</h3>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedEntry.symptoms}</p>
                  </section>
                  <section>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><ShieldCheck className="h-4 w-4 text-emerald-500" />발생 원인·상황</h3>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedEntry.commonCauses || '등록된 발생 원인 정보가 없습니다.'}</p>
                  </section>
                </div>

                <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-800 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4" />현장 응급처치</h3>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-emerald-950 dark:text-emerald-100">{selectedEntry.firstAid}</p>
                </section>

                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  <section className="rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-red-800 dark:text-red-200"><AlertTriangle className="h-4 w-4" />즉시 도움을 받아야 하는 신호</h3>
                    {selectedEntry.redFlags?.length ? <ul className="space-y-2 text-sm leading-relaxed text-red-900 dark:text-red-100">{selectedEntry.redFlags.map((flag) => <li key={flag} className="flex gap-2"><span>•</span>{flag}</li>)}</ul> : <p className="text-sm text-red-800/70 dark:text-red-200/70">등록된 위험 신호가 없습니다.</p>}
                  </section>
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <h3 className="mb-2 text-sm font-black text-slate-900 dark:text-white">보건실 방문·경기 복귀 기준</h3>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedEntry.whenToSeekCare || '증상이 지속되면 보건 담당자에게 확인받고, 허가 없이 경기에 복귀하지 않습니다.'}</p>
                  </section>
                </div>

                {selectedEntry.prevention && (
                  <section className="mt-5">
                    <h3 className="mb-2 text-sm font-black text-slate-900 dark:text-white">예방 수칙</h3>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedEntry.prevention}</p>
                  </section>
                )}

                {selectedEntry.attachments?.some((item) => item.type === 'image') && (
                  <section className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><ImagePlus className="h-4 w-4 text-purple-500" />참고 이미지</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {selectedEntry.attachments.filter((item) => item.type === 'image').map((item) => <img key={item.id} src={item.url} alt={item.name} className="aspect-square w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700" />)}
                    </div>
                  </section>
                )}

                {selectedEntry.sourceUrl && (
                  <a href={selectedEntry.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"><ExternalLink className="h-3.5 w-3.5" />관련 참고 자료 열기</a>
                )}
              </>
            ) : (
              <div className="flex h-full min-h-[500px] items-center justify-center text-sm text-slate-400">표시할 문서가 없습니다.</div>
            )}
          </article>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        이 지식백과는 현장 대응을 위한 교육용 참고 자료이며 의료진의 진단을 대신하지 않습니다. 응급상황에서는 지체하지 말고 보건실 또는 119에 연락하세요.
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-red-600">EDITORIAL WORKSPACE</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{draft.id ? '지식백과 문서 편집' : '새 지식백과 문서'}</h2>
                <p className="mt-1 text-xs text-slate-500">관리자·보건 담당·학생회만 문서를 추가하거나 수정할 수 있습니다.</p>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">문서명<input required value={draft.title || ''} onChange={(event) => updateDraft('title', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="예: 햄스트링 손상" /></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">관련 종목<select value={draft.sport || 'common'} onChange={(event) => updateDraft('sport', event.target.value as InjuryEntry['sport'])} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">{SPORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">중증도<select value={draft.severity || 'mild'} onChange={(event) => updateDraft('severity', event.target.value as InjuryEntry['severity'])} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="mild">경증</option><option value="moderate">중등도</option><option value="emergency">응급</option></select></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">태그 (쉼표 구분)<input value={(draft.tags || []).join(', ')} onChange={(event) => updateDraft('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="발목, 염좌, RICE" /></label>
              <label className="sm:col-span-2 text-xs font-bold text-slate-700 dark:text-slate-300">한 줄 요약<textarea rows={2} value={draft.summary || ''} onChange={(event) => updateDraft('summary', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">증상 및 판별 기준<textarea required rows={5} value={draft.symptoms || ''} onChange={(event) => updateDraft('symptoms', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">발생 원인·상황<textarea rows={5} value={draft.commonCauses || ''} onChange={(event) => updateDraft('commonCauses', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
              <label className="sm:col-span-2 text-xs font-bold text-slate-700 dark:text-slate-300">단계별 응급처치<textarea required rows={6} value={draft.firstAid || ''} onChange={(event) => updateDraft('firstAid', event.target.value)} className="mt-1.5 w-full rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 font-normal outline-none focus:border-emerald-500 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-white" placeholder="한 줄에 한 단계씩 입력하면 읽기 쉽습니다." /></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">위험 신호 (한 줄씩)<textarea rows={4} value={(draft.redFlags || []).join('\n')} onChange={(event) => updateDraft('redFlags', event.target.value.split('\n').map((flag) => flag.trim()).filter(Boolean))} className="mt-1.5 w-full rounded-xl border border-red-200 bg-red-50/50 p-3 font-normal outline-none focus:border-red-500 dark:border-red-900/50 dark:bg-red-950/20 dark:text-white" /></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">보건실 방문·복귀 기준<textarea rows={4} value={draft.whenToSeekCare || ''} onChange={(event) => updateDraft('whenToSeekCare', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">예방 수칙<textarea rows={4} value={draft.prevention || ''} onChange={(event) => updateDraft('prevention', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">관련 자료 URL<input type="url" value={draft.sourceUrl || ''} onChange={(event) => updateDraft('sourceUrl', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="https://..." /></label>

              <div className="sm:col-span-2 rounded-2xl border border-dashed border-purple-300 bg-purple-50/50 p-4 dark:border-purple-900/60 dark:bg-purple-950/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="text-xs font-black text-purple-800 dark:text-purple-200">문서 이미지 첨부</p><p className="mt-1 text-[11px] text-purple-700/70 dark:text-purple-300/70">최대 4장 · 자동 압축 후 문서에 저장됩니다.</p></div>
                  <label className="cursor-pointer rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700"><Upload className="mr-1 inline h-3.5 w-3.5" />이미지 선택<input type="file" accept="image/*" multiple className="hidden" onChange={(event) => handleEditorImages(event.target.files)} /></label>
                </div>
                {(draft.attachments || []).length > 0 && <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{(draft.attachments || []).map((attachment) => <div key={attachment.id} className="relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-900/60">{attachment.type === 'image' ? <img src={attachment.url} alt={attachment.name} className="aspect-square w-full object-cover" /> : <a href={attachment.url} target="_blank" rel="noreferrer" className="block p-3 text-xs text-blue-600">{attachment.name}</a>}<button type="button" onClick={() => updateDraft('attachments', (draft.attachments || []).filter((item) => item.id !== attachment.id))} className="absolute right-1 top-1 rounded-lg bg-slate-950/70 p-1 text-white"><X className="h-3 w-3" /></button></div>)}</div>}
              </div>

              {editorError && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{editorError}</div>}
              <div className="flex items-center justify-between gap-3 pt-2 sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={draft.published !== false} onChange={(event) => updateDraft('published', event.target.checked)} /> 학생에게 공개</label>
                <div className="flex gap-2"><button type="button" onClick={() => setEditorOpen(false)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">취소</button><button type="submit" disabled={isSaving} className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isSaving ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" />저장 중</> : '문서 저장'}</button></div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};