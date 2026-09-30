import React, { useState } from 'react';
import { MatchItem, SportType, MatchStatus } from '../../types';
import { 
  Trophy, 
  Shuffle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  MapPin,
  Clock,
  Edit3,
  X,
  Save,
  RefreshCw,
  Crown,
  Medal,
  CheckSquare,
  Square,
  Sparkles,
  Play,
  Pause,
  PlayCircle
} from 'lucide-react';
import { 
  createMatch, 
  deleteMatch, 
  batchDeleteMatches, 
  updateMatch, 
  advanceTournamentRound, 
  syncAllTournamentAdvancements,
  getMatchTournamentSlot,
  getMatchGrade,
  startMatch,
  pauseMatch,
  resumeMatch,
  finishMatch,
  autoStartDueMatches,
  parseMatchStartTime,
  toKSTIsoString,
  parseKSTDateAndTime,
  formatKSTTime,
  formatKSTDate,
  formatKSTDateTime,
  getKSTNowParts
} from '../../services/firebaseService';

interface AdminBracketManagerTabProps {
  matches: MatchItem[];
  onNotice: (msg: string) => void;
}

// Sangsan High School Class Definition
// Total 12 classes per grade:
// Male: 1, 2, 3, 4, 9, 10, 11, 12 (8 classes)
// Female: 5, 6, 7, 8 (4 classes)
const MALE_CLASSES = ['1', '2', '3', '4', '9', '10', '11', '12'];
const FEMALE_CLASSES = ['5', '6', '7', '8'];

const SPORT_OPTIONS: { key: SportType; label: string; gender: 'male' | 'female' | 'both'; defaultCourt: string }[] = [
  { key: 'soccer', label: '축구 (남자 8강 토너먼트)', gender: 'male', defaultCourt: '대운동장 A' },
  { key: 'basketball', label: '농구 (남자 8강 토너먼트)', gender: 'male', defaultCourt: '체육관 1층' },
  { key: 'dodgeball', label: '피구 (여자 4강 토너먼트)', gender: 'female', defaultCourt: '체육관 2층' },
  { key: 'relay_male', label: '남자 계주 (남자 8개 반 릴레이)', gender: 'male', defaultCourt: '육상 트랙' },
  { key: 'relay_female', label: '여자 계주 (여자 4개 반 릴레이)', gender: 'female', defaultCourt: '육상 트랙' },
  { key: 'tug_of_war', label: '줄다리기 (단판/토너먼트)', gender: 'both', defaultCourt: '대운동장 중앙' }
];

export const AdminBracketManagerTab: React.FC<AdminBracketManagerTabProps> = ({
  matches,
  onNotice
}) => {
  // Creation filter state
  const [targetGrade, setTargetGrade] = useState<'1' | '2' | '3'>('1');
  const [targetSport, setTargetSport] = useState<SportType>('soccer');
  const [selectedGenderForBoth, setSelectedGenderForBoth] = useState<'male' | 'female'>('male');
  
  // Manual match fields
  const initialKST = getKSTNowParts();
  const [homeClassNum, setHomeClassNum] = useState<string>('1');
  const [awayClassNum, setAwayClassNum] = useState<string>('2');
  const [roundName, setRoundName] = useState<string>('8강 1경기');
  const [courtName, setCourtName] = useState<string>('대운동장 A');
  const [matchDate, setMatchDate] = useState<string>(initialKST.dateStr);
  const [matchTime, setMatchTime] = useState<string>(initialKST.timeStr);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected matches for batch operations
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);

  // In-App Confirmation Modal State (replaces window.confirm which is blocked in iframes)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    details?: string[];
    confirmLabel: string;
    confirmStyle?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Edit Match Modal State
  const [editingMatch, setEditingMatch] = useState<MatchItem | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    round: string;
    homeTeam: string;
    awayTeam: string;
    homeClass: string;
    awayClass: string;
    homeScore: number;
    awayScore: number;
    status: MatchStatus;
    period: string;
    court: string;
    date: string;
    time: string;
    assignedRefereeName: string;
  }>({
    title: '',
    round: '',
    homeTeam: '',
    awayTeam: '',
    homeClass: '',
    awayClass: '',
    homeScore: 0,
    awayScore: 0,
    status: 'SCHEDULED',
    period: '경기전',
    court: '',
    date: '2026-09-14',
    time: '10:00',
    assignedRefereeName: ''
  });

  // Get active sport metadata
  const currentSportMeta = SPORT_OPTIONS.find(s => s.key === targetSport) || SPORT_OPTIONS[0];
  const activeGender = currentSportMeta.gender === 'both' ? selectedGenderForBoth : currentSportMeta.gender;
  const availableClassNums = activeGender === 'male' ? MALE_CLASSES : FEMALE_CLASSES;

  // Handle Sport switch
  const handleSportChange = (sportKey: SportType) => {
    setTargetSport(sportKey);
    const meta = SPORT_OPTIONS.find(s => s.key === sportKey);
    if (meta) {
      setCourtName(meta.defaultCourt);
      const gender = meta.gender === 'both' ? selectedGenderForBoth : meta.gender;
      const classes = gender === 'male' ? MALE_CLASSES : FEMALE_CLASSES;
      setHomeClassNum(classes[0]);
      setAwayClassNum(classes[1] || classes[0]);
      setRoundName(gender === 'male' ? '8강 1경기' : '4강 1경기');
    }
  };

  // Filtered matches by current grade & sport for convenient view
  const currentFilteredMatches = matches.filter(
    m => m.sport === targetSport && getMatchGrade(m) === targetGrade
  );

  // 1. Manual Match Creation Handler
  const handleCreateManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeClassNum === awayClassNum) {
      onNotice('홈팀과 원정팀은 서로 다른 반이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const homeTeamLabel = `${targetGrade}-${homeClassNum}반`;
      const awayTeamLabel = `${targetGrade}-${awayClassNum}반`;
      const homeClassCode = `${targetGrade}${homeClassNum.padStart(2, '0')}`;
      const awayClassCode = `${targetGrade}${awayClassNum.padStart(2, '0')}`;
      const startDateTime = toKSTIsoString(matchDate, matchTime);

      await createMatch({
        sport: targetSport,
        matchType: targetSport.startsWith('relay') ? 'relay_group' : 'tournament',
        title: `${targetGrade}학년 ${currentSportMeta.label.split(' ')[0]} ${roundName}`,
        round: roundName,
        homeTeam: homeTeamLabel,
        awayTeam: awayTeamLabel,
        homeClass: homeClassCode,
        awayClass: awayClassCode,
        court: courtName,
        status: 'SCHEDULED',
        period: '경기전',
        startTime: startDateTime
      });

      onNotice(`[${targetGrade}학년 ${homeTeamLabel} vs ${awayTeamLabel}] 매치가 정상 등록되었습니다.`);
    } catch (err) {
      console.error(err);
      onNotice('대진표 매치 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Full-Bracket Automatic Tournament Draw Execution Engine
  // Generates complete bracket tree (8강 4경기 -> 4강 2경기 -> 결승 1경기 -> 3위전 1경기)
  const executeAutoDraw = async () => {
    setIsSubmitting(true);
    try {
      // Shuffle available classes
      const shuffled = [...availableClassNums].sort(() => Math.random() - 0.5);
      const sportName = currentSportMeta.label.split(' ')[0];

      if (activeGender === 'male') {
        // 8 Classes -> 4 QF + 2 SF + 1 Final + 1 Bronze (Total 8 matches)
        // 1) 8강전 4경기
        for (let i = 0; i < 4; i++) {
          const home = shuffled[i * 2];
          const away = shuffled[i * 2 + 1];
          const qfHour = 9 + Math.floor(i * 50 / 60);
          const qfMin = (i * 50) % 60;
          const matchStartTime = toKSTIsoString(matchDate, `${String(qfHour).padStart(2, '0')}:${String(qfMin).padStart(2, '0')}`);

          await createMatch({
            sport: targetSport,
            matchType: 'tournament',
            title: `${targetGrade}학년 ${sportName} 8강 ${i + 1}경기`,
            round: `8강 ${i + 1}경기`,
            tournamentSlot: `QF${i + 1}` as any,
            homeTeam: `${targetGrade}-${home}반`,
            awayTeam: `${targetGrade}-${away}반`,
            homeClass: `${targetGrade}${home.padStart(2, '0')}`,
            awayClass: `${targetGrade}${away.padStart(2, '0')}`,
            court: courtName,
            status: 'SCHEDULED',
            period: '경기전',
            startTime: matchStartTime
          });
        }

        // 2) 4강전 2경기 (준결승)
        // SF1: QF1 승자 vs QF2 승자
        const sf1Time = toKSTIsoString(matchDate, '13:30');
        await createMatch({
          sport: targetSport,
          matchType: 'tournament',
          title: `${targetGrade}학년 ${sportName} 4강 1경기`,
          round: '4강 1경기',
          tournamentSlot: 'SF1',
          homeTeam: '8강 1G 승자',
          awayTeam: '8강 2G 승자',
          homeClass: 'TBD',
          awayClass: 'TBD',
          court: courtName,
          status: 'SCHEDULED',
          period: '경기전',
          startTime: sf1Time
        });

        // SF2: QF3 승자 vs QF4 승자
        const sf2Time = toKSTIsoString(matchDate, '14:30');
        await createMatch({
          sport: targetSport,
          matchType: 'tournament',
          title: `${targetGrade}학년 ${sportName} 4강 2경기`,
          round: '4강 2경기',
          tournamentSlot: 'SF2',
          homeTeam: '8강 3G 승자',
          awayTeam: '8강 4G 승자',
          homeClass: 'TBD',
          awayClass: 'TBD',
          court: courtName,
          status: 'SCHEDULED',
          period: '경기전',
          startTime: sf2Time
        });

        // 3) 결승전 (4강 1G 승자 vs 4강 2G 승자) - 3·4위전 미진행 정책
        const finalTime = toKSTIsoString(matchDate, '16:30');
        await createMatch({
          sport: targetSport,
          matchType: 'tournament',
          title: `${targetGrade}학년 ${sportName} 결승전`,
          round: '결승전',
          tournamentSlot: 'FINAL',
          homeTeam: '4강 1G 승자',
          awayTeam: '4강 2G 승자',
          homeClass: 'TBD',
          awayClass: 'TBD',
          court: courtName,
          status: 'SCHEDULED',
          period: '경기전',
          startTime: finalTime
        });

        onNotice(`${targetGrade}학년 ${sportName} 전체 8강 토너먼트(8강 4경기, 4강 2경기, 결승전 총 7경기)가 완벽히 자동 추첨 생성되었습니다. (3·4위전 미진행)`);
      } else {
        // 4 Classes -> 2 SF + 1 Final (Total 3 matches, 3·4위전 미진행)
        // 1) 4강 2경기
        for (let i = 0; i < 2; i++) {
          const home = shuffled[i * 2];
          const away = shuffled[i * 2 + 1];
          const matchStartTime = toKSTIsoString(matchDate, `${String(10 + i).padStart(2, '0')}:00`);

          await createMatch({
            sport: targetSport,
            matchType: 'tournament',
            title: `${targetGrade}학년 ${sportName} 4강 ${i + 1}경기`,
            round: `4강 ${i + 1}경기`,
            tournamentSlot: `SF${i + 1}` as any,
            homeTeam: `${targetGrade}-${home}반`,
            awayTeam: `${targetGrade}-${away}반`,
            homeClass: `${targetGrade}${home.padStart(2, '0')}`,
            awayClass: `${targetGrade}${away.padStart(2, '0')}`,
            court: courtName,
            status: 'SCHEDULED',
            period: '경기전',
            startTime: matchStartTime
          });
        }

        // 2) 결승전
        const finalTime = toKSTIsoString(matchDate, '14:30');
        await createMatch({
          sport: targetSport,
          matchType: 'tournament',
          title: `${targetGrade}학년 ${sportName} 결승전`,
          round: '결승전',
          tournamentSlot: 'FINAL',
          homeTeam: '4강 1G 승자',
          awayTeam: '4강 2G 승자',
          homeClass: 'TBD',
          awayClass: 'TBD',
          court: courtName,
          status: 'SCHEDULED',
          period: '경기전',
          startTime: finalTime
        });

        onNotice(`${targetGrade}학년 ${sportName} 전체 4강 토너먼트(4강 2경기, 결승전 총 3경기)가 완벽히 자동 추첨 생성되었습니다. (3·4위전 미진행)`);
      }
    } catch (err) {
      console.error(err);
      onNotice('대진표 자동 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger for One-Click Auto Tournament Draw with In-App Confirmation
  const handleAutoDraw = () => {
    const genderLabel = activeGender === 'male' ? '남자부 (8개 반)' : '여자부 (4개 반)';
    const sportName = currentSportMeta.label.split(' ')[0];
    const existingMatches = currentFilteredMatches;

    setConfirmDialog({
      isOpen: true,
      title: `${targetGrade}학년 [${currentSportMeta.label}] 원클릭 자동 추첨 생성`,
      description: existingMatches.length > 0
        ? `현재 ${targetGrade}학년 ${sportName}에 이미 등록된 경기 ${existingMatches.length}개가 존재합니다.\n기존 경기를 모두 삭제하고 새로 공정 무작위 추첨하여 대진표를 생성하시겠습니까?`
        : `${targetGrade}학년 ${genderLabel}의 전체 토너먼트 대진을 자동 무작위 추첨하여 생성하시겠습니까?`,
      details: [
        ...(existingMatches.length > 0 ? [`⚠️ 기존 경기 ${existingMatches.length}개가 먼저 일괄 삭제된 후 새 대진표가 등록됩니다.`] : []),
        activeGender === 'male'
          ? '• 8강전 4경기 (공정 난수 추첨 매칭)\n• 4강 준결승 2경기 (승자 대기 슬롯)\n• 결승전 1경기 (우승 결정전)\n• 3·4위전 1경기 (총 8경기 생성)'
          : '• 4강 준결승 2경기 (공정 난수 추첨 매칭)\n• 결승전 1경기 (우승 결정전)\n• 3·4위전 1경기 (총 4경기 생성)',
        '※ 8강 및 4강 경기 종료 시 승리 팀이 다음 라운드 대진으로 자동 진출합니다.'
      ],
      confirmLabel: existingMatches.length > 0 ? '기존 삭제 후 자동 재추첨' : '원클릭 자동 추첨 생성',
      confirmStyle: existingMatches.length > 0 ? 'warning' : 'primary',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          if (existingMatches.length > 0) {
            const oldIds = existingMatches.map(m => m.id);
            await batchDeleteMatches(oldIds);
            setSelectedMatchIds(prev => prev.filter(id => !oldIds.includes(id)));
          }
          await executeAutoDraw();
        } catch (err) {
          console.error(err);
          onNotice('대진표 자동 생성 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  // 3. Tournament Auto-Advance Synchronization
  const handleSyncAdvancements = async () => {
    setIsSubmitting(true);
    try {
      const res = await syncAllTournamentAdvancements(matches);
      if (res.updatedCount > 0) {
        onNotice(`[토너먼트 라운드 자동 진출 완료] ${res.updatedCount}건의 대진이 승리 팀으로 자동 진출되었습니다: ${res.logs.join(' / ')}`);
      } else if (res.pendingInfo && res.pendingInfo.length > 0) {
        onNotice(`[라운드 진행 현황] n강 전 경기 종료 시 다음 라운드로 자동 진출합니다: ${res.pendingInfo.slice(0, 2).join(' | ')}`);
      } else {
        onNotice('현재 대기 중인 모든 다음 라운드 대진이 최신 경기 결과와 완벽히 동기화되어 있습니다.');
      }
    } catch (err) {
      console.error(err);
      onNotice('토너먼트 자동 진출 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Delete Single Match Handler with In-App Confirmation
  const handleDeleteMatch = (matchId: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '경기 영구 삭제',
      description: `정말로 [${title}] 경기를 삭제하시겠습니까?`,
      details: [
        '해당 경기는 실시간 대진표, 토너먼트 트리 및 일정 목록에서 즉시 제거됩니다.',
        '삭제된 경기는 복구할 수 없습니다.'
      ],
      confirmLabel: '경기 영구 삭제',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await deleteMatch(matchId);
          setSelectedMatchIds(prev => prev.filter(id => id !== matchId));
          if (editingMatch?.id === matchId) {
            setEditingMatch(null);
          }
          onNotice(`[${title}] 경기가 정상적으로 삭제되었습니다.`);
        } catch (err) {
          console.error(err);
          onNotice('경기 삭제 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  // 5. Batch Delete Filtered Matches with In-App Confirmation
  const handleDeleteFilteredMatches = () => {
    if (currentFilteredMatches.length === 0) return;
    const sportName = currentSportMeta.label.split(' ')[0];

    setConfirmDialog({
      isOpen: true,
      title: `${targetGrade}학년 ${sportName} 전체 경기 일괄 삭제`,
      description: `현재 선택된 [${targetGrade}학년 ${sportName}] 전체 ${currentFilteredMatches.length}개 경기를 모두 삭제하시겠습니까?`,
      details: [
        `삭제 대상: ${targetGrade}학년 ${sportName} 전체 ${currentFilteredMatches.length}경기`,
        '기존 대진을 초기화하고 원클릭 자동 추첨을 새로 진행할 때 유용합니다.',
        '삭제 즉시 모든 학생과 심판 화면에 실시간으로 반영됩니다.'
      ],
      confirmLabel: `전체 ${currentFilteredMatches.length}경기 삭제`,
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const ids = currentFilteredMatches.map(m => m.id);
          const count = await batchDeleteMatches(ids);
          setSelectedMatchIds(prev => prev.filter(id => !ids.includes(id)));
          onNotice(`[${targetGrade}학년 ${sportName}] ${count}경기가 모두 삭제되었습니다. 새로운 대진을 추첨할 수 있습니다.`);
        } catch (err) {
          console.error(err);
          onNotice('경기 일괄 삭제 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  // 6. Batch Delete Selected Matches with In-App Confirmation
  const handleDeleteSelected = () => {
    if (selectedMatchIds.length === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: '선택 경기 일괄 삭제',
      description: `체크박스로 선택하신 ${selectedMatchIds.length}개 경기를 일괄 삭제하시겠습니까?`,
      details: [
        `선택된 경기 수: 총 ${selectedMatchIds.length}개`,
        '선택한 모든 경기가 Firestore 데이터베이스에서 영구 삭제됩니다.'
      ],
      confirmLabel: `선택한 ${selectedMatchIds.length}개 경기 삭제`,
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const count = await batchDeleteMatches(selectedMatchIds);
          setSelectedMatchIds([]);
          onNotice(`선택한 ${count}개 경기가 성공적으로 삭제되었습니다.`);
        } catch (err) {
          console.error(err);
          onNotice('선택 경기 삭제 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  // 7. Toggle Select All
  const handleToggleSelectAll = () => {
    if (selectedMatchIds.length === currentFilteredMatches.length) {
      setSelectedMatchIds([]);
    } else {
      setSelectedMatchIds(currentFilteredMatches.map(m => m.id));
    }
  };

  // Match Status Actions
  const handleStartMatch = async (matchId: string, sport?: SportType) => {
    setIsSubmitting(true);
    try {
      await startMatch(matchId, sport);
      onNotice('경기가 성공적으로 시작되었습니다. (LIVE 상태로 전환)');
    } catch (e) {
      console.error(e);
      onNotice('경기 시작 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePauseMatch = async (matchId: string) => {
    setIsSubmitting(true);
    try {
      await pauseMatch(matchId);
      onNotice('경기가 일시정지되었습니다.');
    } catch (e) {
      console.error(e);
      onNotice('경기 일시정지 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeMatch = async (matchId: string) => {
    setIsSubmitting(true);
    try {
      await resumeMatch(matchId);
      onNotice('경기가 재개되었습니다.');
    } catch (e) {
      console.error(e);
      onNotice('경기 재개 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishMatch = async (matchId: string) => {
    setIsSubmitting(true);
    try {
      await finishMatch(matchId);
      onNotice('경기가 공식 종료되었습니다.');
    } catch (e) {
      console.error(e);
      onNotice('경기 종료 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchStartDueMatches = async () => {
    setIsSubmitting(true);
    try {
      const started = await autoStartDueMatches(matches);
      if (started.length > 0) {
        onNotice(`시작 시각이 도달한 ${started.length}개 경기를 일괄 LIVE로 전환했습니다.`);
      } else {
        onNotice('현재 시작 시각이 경과한 대기 경기가 없거나, 이전 라운드 승자가 미정입니다.');
      }
    } catch (e) {
      console.error(e);
      onNotice('일괄 시작 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 8. Open Edit Modal
  const handleOpenEdit = (m: MatchItem) => {
    setEditingMatch(m);
    const { date: dateStr, time: timeStr } = parseKSTDateAndTime(m.startTime);

    setEditForm({
      title: m.title || '',
      round: m.round || '',
      homeTeam: m.homeTeam || '',
      awayTeam: m.awayTeam || '',
      homeClass: m.homeClass || '',
      awayClass: m.awayClass || '',
      homeScore: Number(m.homeScore) || 0,
      awayScore: Number(m.awayScore) || 0,
      status: m.status || 'SCHEDULED',
      period: m.period || '경기전',
      court: m.court || '',
      date: dateStr,
      time: timeStr,
      assignedRefereeName: m.assignedRefereeName || ''
    });
  };

  // 9. Save Edited Match
  const handleSaveEdit = async (autoAdvance: boolean = true) => {
    if (!editingMatch) return;
    setIsSubmitting(true);
    try {
      const startDateTime = toKSTIsoString(editForm.date, editForm.time);
      const updatedPayload: Partial<MatchItem> = {
        title: editForm.title,
        round: editForm.round,
        homeTeam: editForm.homeTeam,
        awayTeam: editForm.awayTeam,
        homeClass: editForm.homeClass,
        awayClass: editForm.awayClass,
        homeScore: editForm.homeScore,
        awayScore: editForm.awayScore,
        status: editForm.status,
        period: editForm.period,
        court: editForm.court,
        startTime: startDateTime,
        assignedRefereeName: editForm.assignedRefereeName
      };

      await updateMatch(editingMatch.id, updatedPayload);

      // Auto-advance if requested
      if (autoAdvance) {
        const mergedMatch: MatchItem = {
          ...editingMatch,
          ...updatedPayload
        } as MatchItem;
        const advRes = await advanceTournamentRound(mergedMatch, matches);
        if (advRes.updatedCount > 0) {
          onNotice(`[${editForm.title}] 수정 저장 완료 및 ${advRes.messages.join(', ')}`);
        } else {
          onNotice(`[${editForm.title}] 경기 정보가 성공적으로 수정되었습니다.`);
        }
      } else {
        onNotice(`[${editForm.title}] 경기 정보가 성공적으로 수정되었습니다.`);
      }

      setEditingMatch(null);
    } catch (err) {
      console.error(err);
      onNotice('경기 수정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Grade/Sport Selection */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              상산고 대진표 관리 (학년별·성별 엄격 매칭 & 토너먼트 자동 진출)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              원클릭 추첨 시 8강·4강·결승·3위전 전체 브래킷이 자동 생성되며, 승리 팀이 다음 라운드로 자동 진출합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncAdvancements}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="종료된 모든 경기의 승자를 다음 라운드 대진으로 동기화"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>승자 자동 진출 동기화</span>
            </button>

            <button
              type="button"
              onClick={handleAutoDraw}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              <span>{targetGrade}학년 {currentSportMeta.label.split(' ')[0]} 원클릭 전체 토너먼트 추첨 생성</span>
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Grade selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              대상 학년 선택
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['1', '2', '3'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setTargetGrade(g)}
                  className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                    targetGrade === g
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          {/* Sport selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              종목 선택
            </label>
            <select
              value={targetSport}
              onChange={(e) => handleSportChange(e.target.value as SportType)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-hidden focus:border-red-500 text-slate-800 dark:text-slate-200"
            >
              {SPORT_OPTIONS.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Gender selection if both */}
          {currentSportMeta.gender === 'both' ? (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                성별 부문 선택
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGenderForBoth('male')}
                  className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                    selectedGenderForBoth === 'male'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  남자부 (8개 반)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGenderForBoth('female')}
                  className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                    selectedGenderForBoth === 'female'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  여자부 (4개 반)
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                기본 경기장 / 일시
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                  placeholder="경기장"
                />
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Class pool summary */}
          <div className="sm:col-span-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                출전 대상 학급 ({availableClassNums.length}개 반):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableClassNums.map(c => (
                  <span
                    key={c}
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      activeGender === 'male'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {targetGrade}-{c}반
                  </span>
                ))}
              </div>
            </div>

            {currentFilteredMatches.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteFilteredMatches}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-2.5 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-bold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{targetGrade}학년 {currentSportMeta.label.split(' ')[0]} 경기 전체 삭제 ({currentFilteredMatches.length}경기)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Match Registration Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-red-600" />
          단일 경기 수동 등록
        </h4>

        <form onSubmit={handleCreateManualMatch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Home team */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              홈 팀 ({activeGender === 'male' ? '남학급' : '여학급'})
            </label>
            <select
              value={homeClassNum}
              onChange={(e) => setHomeClassNum(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
            >
              {availableClassNums.map(c => (
                <option key={c} value={c}>{targetGrade}학년 {c}반</option>
              ))}
            </select>
          </div>

          {/* Away team */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              원정 팀 ({activeGender === 'male' ? '남학급' : '여학급'})
            </label>
            <select
              value={awayClassNum}
              onChange={(e) => setAwayClassNum(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
            >
              {availableClassNums.map(c => (
                <option key={c} value={c}>{targetGrade}학년 {c}반</option>
              ))}
            </select>
          </div>

          {/* Round */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              라운드 구분
            </label>
            <input
              type="text"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              placeholder="예: 8강 1경기, 4강 2경기, 결승전"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              required
            />
          </div>

          {/* Court */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              경기 장소
            </label>
            <input
              type="text"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              placeholder="예: 대운동장 A, 체육관"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              경기 날짜
            </label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              경기 시작 시각
            </label>
            <input
              type="time"
              value={matchTime}
              onChange={(e) => setMatchTime(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              required
            />
          </div>

          {/* Submit button */}
          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              대진표에 단일 경기 등록
            </button>
          </div>
        </form>
      </div>

      {/* Currently Registered Matches List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              등록된 경기 목록 (선택 필터: {currentFilteredMatches.length}경기 / 전체 {matches.length}경기)
            </h4>
            {selectedMatchIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={isSubmitting}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>선택 {selectedMatchIds.length}개 삭제</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>수정 및 삭제 시 실시간 대진표와 토너먼트 트리에 즉시 반영됩니다.</span>
          </div>
        </div>

        {/* Real-time Match State & Auto-Start Status Bar */}
        {(() => {
          const nowEpoch = Date.now();
          const liveMatchesCount = matches.filter(m => m.status === 'LIVE').length;
          const dueMatches = matches.filter(m => {
            if (m.status !== 'SCHEDULED') return false;
            const epoch = parseMatchStartTime(m.startTime);
            return Boolean(epoch && epoch <= nowEpoch && !m.homeTeam?.includes('승자') && !m.awayTeam?.includes('승자') && m.homeTeam !== 'TBD' && m.awayTeam !== 'TBD');
          });

          return (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  실시간 진행 중: <strong className="text-red-600 dark:text-red-400">{liveMatchesCount}</strong>경기
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <span className={`w-2 h-2 rounded-full ${dueMatches.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                  시작 시각 도달 대기: <strong className={dueMatches.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600'}>{dueMatches.length}</strong>경기
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  설정 시각 도달 시 자동 LIVE 전환 활성화됨
                </span>
              </div>

              {dueMatches.length > 0 && (
                <button
                  type="button"
                  onClick={handleBatchStartDueMatches}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs animate-pulse"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>시작 시각 도달 {dueMatches.length}경기 일괄 LIVE 시작</span>
                </button>
              )}
            </div>
          );
        })()}

        {matches.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            등록된 경기가 없습니다. 상단의 원클릭 자동 추첨 또는 수동 등록으로 대진을 생성하세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-3 px-3 w-8">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="전체 선택/해제"
                    >
                      {selectedMatchIds.length > 0 && selectedMatchIds.length === currentFilteredMatches.length ? (
                        <CheckSquare className="w-4 h-4 text-red-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">경기명 / 라운드</th>
                  <th className="py-3 px-3">대진 (홈 vs 원정)</th>
                  <th className="py-3 px-3 text-center">스코어</th>
                  <th className="py-3 px-3">일시 및 장소</th>
                  <th className="py-3 px-3">진행 상태</th>
                  <th className="py-3 px-3 text-right">관리 (수정/삭제)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(currentFilteredMatches.length > 0 ? currentFilteredMatches : matches).map((m) => {
                  const isSelected = selectedMatchIds.includes(m.id);
                  const isHomeWinner = m.status === 'FINISHED' && m.homeScore > m.awayScore;
                  const isAwayWinner = m.status === 'FINISHED' && m.awayScore > m.homeScore;

                  return (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                        isSelected ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedMatchIds(prev => 
                              prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                            );
                          }}
                          className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{m.title}</span>
                          {m.tournamentSlot && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
                              {m.tournamentSlot}
                            </span>
                          )}
                        </div>
                        {m.round && <div className="text-[11px] font-normal text-slate-400">{m.round}</div>}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold flex items-center gap-1 ${isHomeWinner ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {isHomeWinner && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                            {m.homeTeam}
                          </span>
                          <span className="text-slate-400 text-[10px]">vs</span>
                          <span className={`font-bold flex items-center gap-1 ${isAwayWinner ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {isAwayWinner && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                            {m.awayTeam}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-sm">
                        {m.status === 'FINISHED' || m.status === 'LIVE' ? (
                          <span className={m.status === 'LIVE' ? 'text-red-600 animate-pulse' : 'text-slate-900 dark:text-white'}>
                            {m.homeScore} : {m.awayScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">예정</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        <div>{formatKSTTime(m.startTime)}</div>
                        <div className="text-[11px] text-slate-400">{m.court}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            m.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' :
                            m.status === 'FINISHED' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                            m.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}>
                            {m.status === 'LIVE' ? '진행중' : m.status === 'FINISHED' ? '종료' : m.status === 'PAUSED' ? '일시중지' : '예정'}
                          </span>
                          {m.status === 'SCHEDULED' && (() => {
                            const ep = parseMatchStartTime(m.startTime);
                            if (ep && ep <= Date.now()) {
                              return (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-black animate-pulse">
                                  시각도달
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Lifecycle Buttons */}
                          {m.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              onClick={() => handleStartMatch(m.id, m.sport)}
                              disabled={isSubmitting}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                              title="즉시 LIVE 경기 시작"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>시작</span>
                            </button>
                          )}
                          {m.status === 'LIVE' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePauseMatch(m.id)}
                                disabled={isSubmitting}
                                className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                                title="경기 일시정지"
                              >
                                <Pause className="w-3 h-3" />
                                <span>정지</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFinishMatch(m.id)}
                                disabled={isSubmitting}
                                className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                                title="경기 공식 종료"
                              >
                                <span>종료</span>
                              </button>
                            </>
                          )}
                          {m.status === 'PAUSED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleResumeMatch(m.id)}
                                disabled={isSubmitting}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                                title="경기 재개"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>재개</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFinishMatch(m.id)}
                                disabled={isSubmitting}
                                className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                                title="경기 공식 종료"
                              >
                                <span>종료</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(m)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer flex items-center gap-1"
                            title="경기 상세 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            <span>수정</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMatch(m.id, m.title)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                            title="경기 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  경기 상세 정보 수정
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  팀, 스코어, 진행 상태, 일시, 장소를 수정할 수 있으며 승자 다음 라운드 자동 진출을 지원합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Title & Round */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    경기 제목
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    라운드 구분
                  </label>
                  <input
                    type="text"
                    value={editForm.round}
                    onChange={(e) => setEditForm(prev => ({ ...prev, round: e.target.value }))}
                    placeholder="예: 8강 1경기, 4강 1경기, 결승전"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Teams and Scores */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>팀 정보 및 스코어 설정</span>
                  <span className="text-[11px] text-slate-400">학급 명칭을 수정하거나 승자 팀을 직접 입력할 수 있습니다.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Home Team Box */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-950/60 space-y-2">
                    <div className="font-bold text-red-600 dark:text-red-400 flex items-center justify-between">
                      <span>홈 팀 (HOME)</span>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">팀 이름</label>
                      <input
                        type="text"
                        value={editForm.homeTeam}
                        onChange={(e) => setEditForm(prev => ({ ...prev, homeTeam: e.target.value }))}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">학급 코드</label>
                      <input
                        type="text"
                        value={editForm.homeClass}
                        onChange={(e) => setEditForm(prev => ({ ...prev, homeClass: e.target.value }))}
                        placeholder="예: 101, 102, TBD"
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">홈 점수</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, homeScore: Math.max(0, prev.homeScore - 1) }))}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold hover:bg-slate-200 cursor-pointer"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          value={editForm.homeScore}
                          onChange={(e) => setEditForm(prev => ({ ...prev, homeScore: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-20 p-2 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-base text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, homeScore: prev.homeScore + 1 }))}
                          className="px-2.5 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 cursor-pointer"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Away Team Box */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-950/60 space-y-2">
                    <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                      <span>원정 팀 (AWAY)</span>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">팀 이름</label>
                      <input
                        type="text"
                        value={editForm.awayTeam}
                        onChange={(e) => setEditForm(prev => ({ ...prev, awayTeam: e.target.value }))}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">학급 코드</label>
                      <input
                        type="text"
                        value={editForm.awayClass}
                        onChange={(e) => setEditForm(prev => ({ ...prev, awayClass: e.target.value }))}
                        placeholder="예: 102, 103, TBD"
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">원정 점수</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, awayScore: Math.max(0, prev.awayScore - 1) }))}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold hover:bg-slate-200 cursor-pointer"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          value={editForm.awayScore}
                          onChange={(e) => setEditForm(prev => ({ ...prev, awayScore: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-20 p-2 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-base text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, awayScore: prev.awayScore + 1 }))}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 cursor-pointer"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    경기 진행 상태
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as MatchStatus;
                      setEditForm(prev => ({
                        ...prev,
                        status: newStatus,
                        period: newStatus === 'FINISHED' ? '경기 종료' : newStatus === 'LIVE' ? '전반전' : prev.period
                      }));
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    <option value="SCHEDULED">예정 (SCHEDULED)</option>
                    <option value="LIVE">실시간 진행중 (LIVE)</option>
                    <option value="PAUSED">일시 중지 (PAUSED)</option>
                    <option value="FINISHED">경기 종료 (FINISHED - 승자 확정)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    피리어드 / 진행 단계
                  </label>
                  <input
                    type="text"
                    value={editForm.period}
                    onChange={(e) => setEditForm(prev => ({ ...prev, period: e.target.value }))}
                    placeholder="예: 경기전, 전반전, 후반전, 연장전, 경기 종료"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Date, Time, Court */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    경기 날짜
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    시작 시각
                  </label>
                  <input
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    경기 장소 (코트)
                  </label>
                  <input
                    type="text"
                    value={editForm.court}
                    onChange={(e) => setEditForm(prev => ({ ...prev, court: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Referee Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  담당 공인 심판원 이름 (선택)
                </label>
                <input
                  type="text"
                  value={editForm.assignedRefereeName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, assignedRefereeName: e.target.value }))}
                  placeholder="예: 공인 심판원 20112 홍길동"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition cursor-pointer"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMatch(editingMatch.id, editingMatch.title)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 rounded-xl font-bold transition cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>이 경기 삭제</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEdit(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  수정 저장만 하기
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEdit(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>수정 저장 및 다음 라운드 승자 자동 진출</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. In-App Confirmation Modal (Replaces blocked window.confirm in iframes) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-2xl shrink-0 ${
                confirmDialog.confirmStyle === 'danger' 
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                  : confirmDialog.confirmStyle === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                  : 'bg-red-100 dark:bg-red-950/60 text-red-600'
              }`}>
                {confirmDialog.confirmStyle === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmDialog.confirmStyle === 'warning' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmDialog.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {confirmDialog.description}
                </p>
              </div>
            </div>

            {confirmDialog.details && confirmDialog.details.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                {confirmDialog.details.map((item, idx) => (
                  <div key={idx} className="leading-snug whitespace-pre-line">
                    {item}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.onConfirm()}
                disabled={isSubmitting}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                  confirmDialog.confirmStyle === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.confirmStyle === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmDialog.confirmLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
