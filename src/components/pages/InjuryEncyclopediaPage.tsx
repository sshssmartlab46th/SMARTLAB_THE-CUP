import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit3,
  ExternalLink,
  FileEdit,
  FileImage,
  FileText,
  HeartPulse,
  ImagePlus,
  LayoutGrid,
  Loader2,
  Maximize2,
  Plus,
  Printer,
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
import { GoogleDocsEditor } from '../editor/GoogleDocsEditor';

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

  // Editor States
  const [googleDocsOpen, setGoogleDocsOpen] = useState(false);
  const [googleDocsTitle, setGoogleDocsTitle] = useState('');
  const [googleDocsInitialHtml, setGoogleDocsInitialHtml] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingSport, setEditingSport] = useState<InjuryEntry['sport']>('common');
  const [editingSeverity, setEditingSeverity] = useState<InjuryEntry['severity']>('mild');

  const generateDocsHtmlFromEntry = (entry: InjuryEntry): string => {
    if (entry.contentHtml && entry.contentHtml.trim().length > 0) {
      return entry.contentHtml;
    }

    const sportLabel = SPORT_OPTIONS.find((s) => s.value === entry.sport)?.label || entry.sport;
    const sevClass = entry.severity === 'emergency' ? '#fee2e2' : entry.severity === 'moderate' ? '#ffedd5' : '#dcfce7';
    const sevTextColor = entry.severity === 'emergency' ? '#b91c1c' : entry.severity === 'moderate' ? '#c2410c' : '#15803d';

    return `
      <h1 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 26px; font-weight: 800; margin-bottom: 8px;">${entry.title}</h1>
      <p style="color: #64748b; font-size: 13px; margin-top: 4px; margin-bottom: 16px;">
        <strong>종목 분류:</strong> ${sportLabel} &nbsp;|&nbsp; 
        <strong>중증도:</strong> <span style="background-color: ${sevClass}; color: ${sevTextColor}; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${severityLabel[entry.severity]}</span>
        ${entry.tags && entry.tags.length > 0 ? ` &nbsp;|&nbsp; <strong>태그:</strong> ${entry.tags.map(t => `#${t}`).join(' ')}` : ''}
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
        <p style="font-size: 14px; color: #334155; margin: 0; line-height: 1.6;">
          <strong>요약:</strong> ${entry.summary || entry.symptoms}
        </p>
      </div>

      <h2 style="color: #0f172a; margin-top: 24px; margin-bottom: 8px; font-size: 18px; font-weight: 700; border-left: 4px solid #ef4444; padding-left: 8px;">1. 주요 증상 및 판별 기준</h2>
      <p style="line-height: 1.8; color: #334155; margin-bottom: 16px;">${entry.symptoms}</p>

      <h2 style="color: #0f172a; margin-top: 24px; margin-bottom: 8px; font-size: 18px; font-weight: 700; border-left: 4px solid #3b82f6; padding-left: 8px;">2. 발생 원인 및 위험 상황</h2>
      <p style="line-height: 1.8; color: #334155; margin-bottom: 16px;">${entry.commonCauses || '기본 기재된 원인 정보가 없습니다.'}</p>

      <h2 style="color: #0f172a; margin-top: 24px; margin-bottom: 8px; font-size: 18px; font-weight: 700; border-left: 4px solid #10b981; padding-left: 8px;">3. 현장 응급처치 수칙 (RICE 프로토콜)</h2>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 12px 0 20px 0;">
        <p style="white-space: pre-wrap; line-height: 1.8; color: #14532d; margin: 0;">${entry.firstAid}</p>
      </div>

      ${entry.redFlags && entry.redFlags.length > 0 ? `
        <h2 style="color: #0f172a; margin-top: 24px; margin-bottom: 8px; font-size: 18px; font-weight: 700; border-left: 4px solid #dc2626; padding-left: 8px;">4. 즉시 도움을 받아야 하는 신호 (Red Flags)</h2>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px;">
          <ul style="color: #991b1b; line-height: 1.8; margin: 0; padding-left: 18px;">
            ${entry.redFlags.map((flag) => `<li>${flag}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <h2 style="color: #0f172a; margin-top: 24px; margin-bottom: 8px; font-size: 18px; font-weight: 700; border-left: 4px solid #6366f1; padding-left: 8px;">5. 보건실 방문 및 경기 복귀 기준</h2>
      <p style="line-height: 1.8; color: #334155; margin-bottom: 16px;">${entry.whenToSeekCare || '통증이 지속되거나 부기가 심해지는 경우 보건실을 방문하여 보건교사의 확인을 받습니다.'}</p>

      ${entry.prevention ? `
        <h2 style="color: #0f172a; margin-top: 24px; margin-bottom: 8px; font-size: 18px; font-weight: 700; border-left: 4px solid #eab308; padding-left: 8px;">6. 예방 수칙</h2>
        <p style="line-height: 1.8; color: #334155; margin-bottom: 16px;">${entry.prevention}</p>
      ` : ''}

      ${entry.attachments && entry.attachments.length > 0 ? `
        <h2 style="color: #0f172a; margin-top: 24px; margin-bottom: 8px; font-size: 18px; font-weight: 700; border-left: 4px solid #a855f7; padding-left: 8px;">7. 첨부 이미지 자료</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px;">
          ${entry.attachments.filter(a => a.type === 'image').map(img => `<img src="${img.url}" alt="${img.name}" style="max-width: 280px; border-radius: 8px; border: 1px solid #e2e8f0;" />`).join('')}
        </div>
      ` : ''}
    `;
  };

  const openGoogleDocs = (entry?: InjuryEntry) => {
    if (entry) {
      setEditingEntryId(entry.id);
      setEditingSport(entry.sport);
      setEditingSeverity(entry.severity);
      setGoogleDocsTitle(entry.title);
      setGoogleDocsInitialHtml(generateDocsHtmlFromEntry(entry));
    } else {
      setEditingEntryId(`injury-${Date.now()}`);
      setEditingSport('common');
      setEditingSeverity('mild');
      setGoogleDocsTitle('새 부상 지식백과 가이드');
      setGoogleDocsInitialHtml(`
        <h1 style="color: #1e293b; font-size: 26px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">새 부상 대응 가이드</h1>
        <p style="color: #64748b; font-size: 14px;">상산고등학교 체육대회 및 축제 공식 보건실 지침</p>
        <hr style="margin: 16px 0; border: 0; border-top: 1px solid #e2e8f0;" />
        
        <h2 style="color: #0f172a; border-left: 4px solid #ef4444; padding-left: 8px;">1. 주요 증상 및 판별 기준</h2>
        <p>선수가 호소하는 통증 부위, 외관상 징후(부기, 멍 등) 및 초기 관찰 사항을 기록하세요.</p>

        <h2 style="color: #0f172a; border-left: 4px solid #3b82f6; padding-left: 8px;">2. 발생 원인 및 위험 상황</h2>
        <p>경기 중 어떠한 동작(착지, 충돌, 급가속 등)에서 부상이 주로 유발되는지 설명하세요.</p>

        <h2 style="color: #0f172a; border-left: 4px solid #10b981; padding-left: 8px;">3. 현장 응급처치 수칙 (RICE 프로토콜)</h2>
        <p>현장에서 즉시 취해야 하는 안정(Rest), 냉찜질(Ice), 압박(Compression), 거상(Elevation) 조치를 기재하세요.</p>

        <h2 style="color: #0f172a; border-left: 4px solid #dc2626; padding-left: 8px;">4. 즉각 이송 및 보건실 의뢰 기준 (위험 신호)</h2>
        <p>119 긴급 연락이나 의료기관 이송이 필요한 위험 징후를 명시하세요.</p>
      `);
    }
    setGoogleDocsOpen(true);
  };

  const handleSaveGoogleDocs = async (data: { title: string; contentHtml: string; plainText: string }) => {
    if (!currentUser) return;
    const id = editingEntryId || `injury-${Date.now()}`;
    setIsSaving(true);
    try {
      await saveInjuryEntry({
        id,
        sport: editingSport,
        title: data.title.trim() || '제목 없는 문서',
        contentHtml: data.contentHtml,
        summary: data.plainText.slice(0, 160).replace(/\s+/g, ' ').trim(),
        symptoms: data.plainText.slice(0, 300).replace(/\s+/g, ' ').trim(),
        commonCauses: '구글 닥스 본문 참조',
        firstAid: '구글 닥스 상세 문서 본문 참조',
        prevention: '구글 닥스 상세 문서 본문 참조',
        redFlags: [],
        whenToSeekCare: '보건실 방문 및 구글 닥스 문서 본문 참조',
        severity: editingSeverity,
        tags: ['구글닥스', SPORT_OPTIONS.find((s) => s.value === editingSport)?.label || '공통'],
        attachments: [],
        sourceUrl: '',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: `${currentUser.name} (${roleLabel[currentUser.role] || currentUser.role})`
      });
      setSelectedId(id);
      setGoogleDocsOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '문서를 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadHtml = (entry: InjuryEntry) => {
    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <title>${entry.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1e293b; line-height: 1.6; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          table th, table td { border: 1px solid #cbd5e1; padding: 8px 12px; }
          table th { background-color: #f1f5f9; }
          img { max-width: 100%; border-radius: 8px; }
        </style>
      </head>
      <body>
        ${generateDocsHtmlFromEntry(entry)}
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => openGoogleDocs()}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileEdit className="h-3.5 w-3.5" />
                새 문서 작성
              </button>
              <button
                type="button"
                onClick={() => openEditor()}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="간편 양식으로 문서 추가"
              >
                <Plus className="mr-1 inline-block h-3.5 w-3.5" />
                간편 추가
              </button>
            </div>
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

          <article className="min-h-[560px] rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7 flex flex-col">
            {selectedEntry ? (
              <>
                {/* Document Top Bar: Action Buttons & Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${severityClass[selectedEntry.severity]}`}>
                      {severityLabel[selectedEntry.severity]}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      {SPORT_OPTIONS.find((option) => option.value === selectedEntry.sport)?.label || selectedEntry.sport}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      최종 검수: {formatUpdatedAt(selectedEntry.updatedAt)}{selectedEntry.updatedBy ? ` · ${selectedEntry.updatedBy}` : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openGoogleDocs(selectedEntry)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                        title="문서 편집"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                        문서 편집
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                      title="문서 인쇄"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      인쇄
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadHtml(selectedEntry)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                      title="HTML 파일로 다운로드"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditor(selectedEntry)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:border-slate-300 transition cursor-pointer"
                          title="간편 양식 수정"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {firestoreEntries.some((item) => item.id === selectedEntry.id) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(selectedEntry)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs transition cursor-pointer"
                            title="문서 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Unified Document Reader View (Supports rich text, headings, tables, and full images) */}
                <div className="flex-1 rounded-2xl bg-[#f0f4f9] dark:bg-slate-950/70 p-3 sm:p-6 border border-slate-200 dark:border-slate-800/80 overflow-y-auto max-h-[75vh]">
                  <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200/90 dark:border-slate-800 p-6 sm:p-12 min-h-[520px]">
                    {/* Official Document Ribbon */}
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>상산고등학교 체육대회·축제 보건 지식백과</span>
                      </div>
                      <div>최종 검수: {formatUpdatedAt(selectedEntry.updatedAt)}{selectedEntry.updatedBy ? ` · ${selectedEntry.updatedBy}` : ''}</div>
                    </div>

                    {/* Rendered HTML content with rich formatting & images */}
                    <div
                      className="google-docs-rendered prose max-w-none dark:prose-invert text-slate-800 dark:text-slate-200 [&_img]:rounded-xl [&_img]:max-w-full [&_img]:shadow-xs [&_img]:border [&_img]:border-slate-200 dark:[&_img]:border-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: generateDocsHtmlFromEntry(selectedEntry)
                      }}
                    />
                  </div>
                </div>
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

      {/* Full-featured Google Docs Editor Modal */}
      {googleDocsOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-xs">
          {/* Top Classification Sub-bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-white shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-emerald-400">상산고 보건 지식백과 · 문서 편집</span>
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] text-slate-400">종목:</label>
                <select
                  value={editingSport}
                  onChange={(e) => setEditingSport(e.target.value as InjuryEntry['sport'])}
                  className="bg-slate-800 text-white rounded-md px-2 py-1 text-xs border border-slate-700 outline-none"
                >
                  {SPORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] text-slate-400">중증도:</label>
                <select
                  value={editingSeverity}
                  onChange={(e) => setEditingSeverity(e.target.value as InjuryEntry['severity'])}
                  className="bg-slate-800 text-white rounded-md px-2 py-1 text-xs border border-slate-700 outline-none"
                >
                  <option value="mild">경증</option>
                  <option value="moderate">중등도</option>
                  <option value="emergency">응급 (위험)</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGoogleDocsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="에디터 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 w-full h-[calc(100vh-44px)] overflow-hidden">
            <GoogleDocsEditor
              initialTitle={googleDocsTitle}
              initialContentHtml={googleDocsInitialHtml}
              documentCategory={SPORT_OPTIONS.find((s) => s.value === editingSport)?.label || '지식백과'}
              onSave={handleSaveGoogleDocs}
              onClose={() => setGoogleDocsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};