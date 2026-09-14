import React, { useState } from 'react';
import { MatchItem, SportType } from '../../types';
import { 
  Trophy, 
  Shuffle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import { createMatch, deleteMatch } from '../../services/firebaseService';

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
  { key: 'tug_of_war', label: '줄다리기 (단판/토너먼트)', gender: 'both', defaultCourt: '대운동장 중앙' },
  { key: 'group_rope', label: '단체 줄넘기 (기록 경기)', gender: 'both', defaultCourt: '체육관 앞 광장' }
];

export const AdminBracketManagerTab: React.FC<AdminBracketManagerTabProps> = ({
  matches,
  onNotice
}) => {
  // Creation form state
  const [targetGrade, setTargetGrade] = useState<'1' | '2' | '3'>('1');
  const [targetSport, setTargetSport] = useState<SportType>('soccer');
  const [selectedGenderForBoth, setSelectedGenderForBoth] = useState<'male' | 'female'>('male');
  
  // Manual match fields
  const [homeClassNum, setHomeClassNum] = useState<string>('1');
  const [awayClassNum, setAwayClassNum] = useState<string>('2');
  const [roundName, setRoundName] = useState<string>('8강 1경기');
  const [courtName, setCourtName] = useState<string>('대운동장 A');
  const [matchDate, setMatchDate] = useState<string>('2026-09-14');
  const [matchTime, setMatchTime] = useState<string>('10:00');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Get active sport metadata
  const currentSportMeta = SPORT_OPTIONS.find(s => s.key === targetSport) || SPORT_OPTIONS[0];
  const activeGender = currentSportMeta.gender === 'both' ? selectedGenderForBoth : currentSportMeta.gender;

  // Available classes strictly based on Sangsan High School Gender Rules
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

  // 1. Manual Match Creation Handler
  const handleCreateManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeClassNum === awayClassNum) {
      alert('홈팀과 원정팀은 서로 다른 반이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const homeTeamLabel = `${targetGrade}-${homeClassNum}반`;
      const awayTeamLabel = `${targetGrade}-${awayClassNum}반`;
      const homeClassCode = `${targetGrade}${homeClassNum.padStart(2, '0')}`;
      const awayClassCode = `${targetGrade}${awayClassNum.padStart(2, '0')}`;
      const startDateTime = new Date(`${matchDate}T${matchTime}:00`).toISOString();

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
      alert('대진표 매치 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Automatic Tournament Draw Handler (Strict Same-Grade, Same-Gender Rule)
  const handleAutoDraw = async () => {
    const genderLabel = activeGender === 'male' ? '남자부(8개 반)' : '여자부(4개 반)';
    const confirmMsg = `${targetGrade}학년 [${currentSportMeta.label}] ${genderLabel}의 대진을 자동 무작위 추첨하여 생성하시겠습니까?\n\n- 대상 학급: ${availableClassNums.map(c => `${targetGrade}-${c}반`).join(', ')}`;
    
    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      // Shuffle available classes
      const shuffled = [...availableClassNums].sort(() => Math.random() - 0.5);
      const baseHour = 10;

      if (activeGender === 'male') {
        // 8 Classes -> 4 Quarterfinal Matches (8강 1, 2, 3, 4경기)
        for (let i = 0; i < 4; i++) {
          const home = shuffled[i * 2];
          const away = shuffled[i * 2 + 1];
          const homeTeamLabel = `${targetGrade}-${home}반`;
          const awayTeamLabel = `${targetGrade}-${away}반`;
          const matchStartTime = new Date(`${matchDate}T${String(baseHour + i).padStart(2, '0')}:00:00`).toISOString();

          await createMatch({
            sport: targetSport,
            matchType: 'tournament',
            title: `${targetGrade}학년 ${currentSportMeta.label.split(' ')[0]} 8강 ${i + 1}경기`,
            round: `8강 ${i + 1}경기`,
            homeTeam: homeTeamLabel,
            awayTeam: awayTeamLabel,
            homeClass: `${targetGrade}${home.padStart(2, '0')}`,
            awayClass: `${targetGrade}${away.padStart(2, '0')}`,
            court: courtName,
            status: 'SCHEDULED',
            period: '경기전',
            startTime: matchStartTime
          });
        }
        onNotice(`${targetGrade}학년 ${currentSportMeta.label.split(' ')[0]} 8강 4경기가 공정하게 자동 추첨 등록되었습니다.`);
      } else {
        // 4 Classes -> 2 Semifinal Matches (4강 1, 2경기)
        for (let i = 0; i < 2; i++) {
          const home = shuffled[i * 2];
          const away = shuffled[i * 2 + 1];
          const homeTeamLabel = `${targetGrade}-${home}반`;
          const awayTeamLabel = `${targetGrade}-${away}반`;
          const matchStartTime = new Date(`${matchDate}T${String(baseHour + i).padStart(2, '0')}:30:00`).toISOString();

          await createMatch({
            sport: targetSport,
            matchType: 'tournament',
            title: `${targetGrade}학년 ${currentSportMeta.label.split(' ')[0]} 4강 ${i + 1}경기`,
            round: `4강 ${i + 1}경기`,
            homeTeam: homeTeamLabel,
            awayTeam: awayTeamLabel,
            homeClass: `${targetGrade}${home.padStart(2, '0')}`,
            awayClass: `${targetGrade}${away.padStart(2, '0')}`,
            court: courtName,
            status: 'SCHEDULED',
            period: '경기전',
            startTime: matchStartTime
          });
        }
        onNotice(`${targetGrade}학년 ${currentSportMeta.label.split(' ')[0]} 4강 2경기가 공정하게 자동 추첨 등록되었습니다.`);
      }
    } catch (err) {
      console.error(err);
      alert('대진표 자동 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete match handler
  const handleDeleteMatch = async (matchId: string, title: string) => {
    if (window.confirm(`[${title}] 경기를 대진표에서 삭제하시겠습니까?`)) {
      try {
        await deleteMatch(matchId);
        onNotice(`[${title}] 경기가 삭제되었습니다.`);
      } catch (err) {
        console.error(err);
        alert('경기 삭제 중 오류가 발생했습니다.');
      }
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
              상산고 대진표 관리 (학년별·성별 엄격 매칭)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              동일 학년, 동일 성별(남학급 8개 반: 1~4반, 9~12반 / 여학급 4개 반: 5~8반) 간 경기만 매칭됩니다.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoDraw}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Shuffle className="w-4 h-4" />
            <span>{targetGrade}학년 {currentSportMeta.label.split(' ')[0]} 원클릭 자동 추첨 생성</span>
          </button>
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
          {currentSportMeta.gender === 'both' && (
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
          )}

          {/* Class pool summary */}
          <div className="sm:col-span-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-wrap items-center gap-2 text-xs">
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
        </div>
      </div>

      {/* Manual Match Registration Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-red-600" />
          수동 경기 등록 (선택 학년 및 성별 반만 표시)
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
              대진표에 단일 경기 수동 등록
            </button>
          </div>
        </form>
      </div>

      {/* Currently Registered Matches List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            등록된 전체 경기 목록 ({matches.length}경기)
          </h4>
          <span className="text-xs text-slate-400">
            실시간 스코어 및 토너먼트 브라켓에 즉시 연동됩니다.
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            등록된 경기가 없습니다. 상단의 자동 추첨 또는 수동 등록으로 대진을 생성하세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-3 px-3.5">경기명 / 라운드</th>
                  <th className="py-3 px-3.5">대진 (홈 vs 원정)</th>
                  <th className="py-3 px-3.5">일시 및 장소</th>
                  <th className="py-3 px-3.5">진행 상태</th>
                  <th className="py-3 px-3.5 text-right">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {matches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                      {m.title}
                      {m.round && <span className="ml-1.5 text-[11px] font-normal text-slate-400">({m.round})</span>}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                      <span className="font-bold text-red-600 dark:text-red-400">{m.homeTeam}</span> vs <span className="font-bold text-blue-600 dark:text-blue-400">{m.awayTeam}</span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400">
                      {m.startTime ? new Date(m.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'} · {m.court}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        m.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' :
                        m.status === 'FINISHED' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                        'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {m.status === 'LIVE' ? '진행중' : m.status === 'FINISHED' ? '종료' : '예정'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteMatch(m.id, m.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="경기 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
