import React, { useState, useEffect } from 'react';
import { UserProfile, FormationSlot, ClassLineup, SportType } from '../../types';
import { saveLineup } from '../../services/firebaseService';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Shield, User, RefreshCw, CheckCircle, Lock, ArrowRightLeft } from 'lucide-react';

interface SoccerFormationBuilderProps {
  currentUser?: UserProfile | null;
  matchId: string;
  classPlayers?: UserProfile[]; // class students, teachers filtered out
  currentLineup?: ClassLineup | null;
  onSaved?: () => void;
}

const FORMATIONS: Record<'4-4-2' | '4-3-3' | '3-5-2', FormationSlot[]> = {
  '4-4-2': [
    { slotId: 'gk', roleName: 'GK', x: 50, y: 88 },
    { slotId: 'lb', roleName: 'DF', x: 18, y: 70 },
    { slotId: 'cb1', roleName: 'DF', x: 38, y: 72 },
    { slotId: 'cb2', roleName: 'DF', x: 62, y: 72 },
    { slotId: 'rb', roleName: 'DF', x: 82, y: 70 },
    { slotId: 'lm', roleName: 'MF', x: 18, y: 45 },
    { slotId: 'cm1', roleName: 'MF', x: 38, y: 48 },
    { slotId: 'cm2', roleName: 'MF', x: 62, y: 48 },
    { slotId: 'rm', roleName: 'MF', x: 82, y: 45 },
    { slotId: 'st1', roleName: 'FW', x: 38, y: 20 },
    { slotId: 'st2', roleName: 'FW', x: 62, y: 20 }
  ],
  '4-3-3': [
    { slotId: 'gk', roleName: 'GK', x: 50, y: 88 },
    { slotId: 'lb', roleName: 'DF', x: 18, y: 70 },
    { slotId: 'cb1', roleName: 'DF', x: 38, y: 72 },
    { slotId: 'cb2', roleName: 'DF', x: 62, y: 72 },
    { slotId: 'rb', roleName: 'DF', x: 82, y: 70 },
    { slotId: 'cm1', roleName: 'MF', x: 30, y: 48 },
    { slotId: 'dm', roleName: 'MF', x: 50, y: 56 },
    { slotId: 'cm2', roleName: 'MF', x: 70, y: 48 },
    { slotId: 'lw', roleName: 'FW', x: 20, y: 22 },
    { slotId: 'st', roleName: 'FW', x: 50, y: 18 },
    { slotId: 'rw', roleName: 'FW', x: 80, y: 22 }
  ],
  '3-5-2': [
    { slotId: 'gk', roleName: 'GK', x: 50, y: 88 },
    { slotId: 'cb1', roleName: 'DF', x: 28, y: 72 },
    { slotId: 'cb2', roleName: 'DF', x: 50, y: 74 },
    { slotId: 'cb3', roleName: 'DF', x: 72, y: 72 },
    { slotId: 'lwb', roleName: 'MF', x: 14, y: 48 },
    { slotId: 'cm1', roleName: 'MF', x: 36, y: 50 },
    { slotId: 'cm2', roleName: 'MF', x: 50, y: 42 },
    { slotId: 'cm3', roleName: 'MF', x: 64, y: 50 },
    { slotId: 'rwb', roleName: 'MF', x: 86, y: 48 },
    { slotId: 'st1', roleName: 'FW', x: 38, y: 20 },
    { slotId: 'st2', roleName: 'FW', x: 62, y: 20 }
  ]
};

export const SoccerFormationBuilder: React.FC<SoccerFormationBuilderProps> = ({
  currentUser,
  matchId,
  classPlayers = [],
  currentLineup,
  onSaved
}) => {
  const userClassNum = currentUser?.classNum || '02';
  const userGrade = currentUser?.grade || '3';
  const userName = currentUser?.name || '학급 반장';
  const userStudentId = currentUser?.studentId || `${userGrade}${userClassNum}01`;

  const [formationType, setFormationType] = useState<'4-4-2' | '4-3-3' | '3-5-2'>(
    currentLineup?.formation || '4-4-2'
  );
  
  // Slots state
  const [slots, setSlots] = useState<FormationSlot[]>(() => {
    if (currentLineup?.formationSlots && currentLineup.formationSlots.length > 0) {
      return currentLineup.formationSlots;
    }
    return FORMATIONS['4-4-2'];
  });

  // Selected player on bench waiting to be placed
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Load existing lineup from Firestore if available
  useEffect(() => {
    if (!matchId) return;
    const lineupId = `lineup_${matchId}_${userClassNum}`;
    const unsub = onSnapshot(doc(db, 'lineups', lineupId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ClassLineup;
        if (data.formation) setFormationType(data.formation);
        if (data.formationSlots && data.formationSlots.length > 0) {
          setSlots(data.formationSlots);
        }
      }
    }, (err) => console.log('Lineup snapshot info:', err));
    return () => unsub();
  }, [matchId, userClassNum]);

  // Filter out teachers from eligible players & deduplicate by studentId
  const seenStudentIds = new Set<string>();
  const eligibleStudents = classPlayers.filter((p) => {
    if (p.isTeacher || p.studentNum === '00') return false;
    const sId = (p.studentId || p.uid || '').trim();
    if (!sId || seenStudentIds.has(sId)) return false;
    seenStudentIds.add(sId);
    return true;
  });

  // Fallback generation if no registered students yet in class
  const activeStudentsList = eligibleStudents.length > 0 ? eligibleStudents : Array.from({ length: 22 }, (_, idx) => {
    const numStr = String(idx + 1).padStart(2, '0');
    const sNames = ['강민우', '김도현', '박지훈', '손흥민', '이강인', '황희찬', '김민재', '조현우', '정우영', '이재성', '황인범', '설영우', '백승호', '조규성', '오현규', '배준호', '양민혁', '김태환', '정승현', '송범근', '김진수', '권경원'];
    return {
      uid: `temp_${numStr}`,
      studentId: `${userGrade}${userClassNum}${numStr}`,
      name: sNames[idx % sNames.length],
      role: 'student' as const,
      grade: userGrade,
      classNum: userClassNum,
      studentNum: numStr,
      gender: 'male' as const,
      isTeacher: false,
      createdAt: new Date().toISOString()
    };
  });

  // Currently assigned player names
  const assignedPlayerNames = slots.map((s) => s.player).filter(Boolean) as string[];

  // Bench players (not assigned yet)
  const benchPlayers = activeStudentsList.filter((s) => {
    const fullName = `${s.studentId} ${s.name}`;
    return !assignedPlayerNames.includes(fullName);
  });

  const handleSelectFormation = (type: '4-4-2' | '4-3-3' | '3-5-2') => {
    setFormationType(type);
    const base = FORMATIONS[type];
    // Keep existing player placements where slotId matches
    const newSlots = base.map((newS) => {
      const oldMatch = slots.find((oldS) => oldS.slotId === newS.slotId);
      return { ...newS, player: oldMatch?.player };
    });
    setSlots(newSlots);
  };

  const handleSlotClick = (slotId: string) => {
    if (selectedPlayer) {
      // Place selected player into this slot
      setSlots((prev) =>
        prev.map((s) => {
          if (s.slotId === slotId) {
            return { ...s, player: selectedPlayer };
          }
          if (s.player === selectedPlayer) {
            return { ...s, player: undefined };
          }
          return s;
        })
      );
      setSelectedPlayer(null);
    } else {
      // If slot already has player, return player to bench
      setSlots((prev) =>
        prev.map((s) => (s.slotId === slotId ? { ...s, player: undefined } : s))
      );
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const starters = slots.map((s) => s.player).filter(Boolean) as string[];
      const substitutes = benchPlayers.map((b) => `${b.studentId} ${b.name}`);

      const lineupData: ClassLineup = {
        id: `lineup_${matchId}_${userClassNum}`,
        matchId,
        classId: userClassNum,
        sport: 'soccer',
        formation: formationType,
        formationSlots: slots,
        starterPlayers: starters,
        substitutePlayers: substitutes,
        submittedBy: `${userStudentId} ${userName} (반장)`,
        submittedAt: new Date().toISOString()
      };

      await saveLineup(lineupData);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
      onSaved?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & 5-minute reveal policy */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-red-600" />
            {userGrade}학년 {userClassNum}반 축구 선발 포메이션 구성
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-500" />
            경기 시작 5분 전까지는 타 반에 비공개되며, 5분 전 자동으로 전체 공개됩니다.
          </p>
        </div>

        {/* Formation Picker */}
        <div className="flex items-center gap-1.5 text-xs">
          {(['4-4-2', '4-3-3', '3-5-2'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleSelectFormation(type)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                formationType === type
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Pitch, Right Bench Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Soccer Pitch Visualizer (Green field canvas) */}
        <div className="lg:col-span-2 relative aspect-[3/4] sm:aspect-[4/3] rounded-2xl bg-emerald-800 dark:bg-emerald-950/90 border-4 border-emerald-600/40 p-4 shadow-inner overflow-hidden select-none">
          {/* Pitch lines */}
          <div className="absolute inset-4 border-2 border-white/30 pointer-events-none rounded-sm"></div>
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/30 pointer-events-none -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/30 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-36 h-16 border-2 border-t-0 border-white/30 pointer-events-none"></div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-36 h-16 border-2 border-b-0 border-white/30 pointer-events-none"></div>

          {/* Interactive Player Slots */}
          {slots.map((slot) => {
            const hasPlayer = Boolean(slot.player);
            return (
              <button
                key={slot.slotId}
                type="button"
                onClick={() => handleSlotClick(slot.slotId)}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition cursor-pointer ${
                  selectedPlayer ? 'animate-pulse' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 shadow-md transition ${
                    hasPlayer
                      ? 'bg-red-600 border-white text-white'
                      : selectedPlayer
                      ? 'bg-amber-400 border-white text-slate-900 ring-2 ring-white'
                      : 'bg-emerald-900/80 border-dashed border-white/60 text-white/80 hover:bg-emerald-700'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-black">
                    {slot.roleName}
                  </span>
                </div>
                <span
                  className={`mt-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap max-w-[80px] truncate ${
                    hasPlayer
                      ? 'bg-black/80 text-white'
                      : 'bg-emerald-950/60 text-emerald-200'
                  }`}
                >
                  {slot.player ? slot.player.split(' ')[1] || slot.player : '비어있음'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bench / Candidate Players List */}
        <div className="flex flex-col p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              출전 대기 벤치 명단 ({benchPlayers.length}명)
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              선생님 계정 자동 제외됨
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            선수를 클릭(선택)한 후 운동장의 원하는 포지션 원을 클릭하여 배치하세요.
          </p>

          <div className="flex-1 overflow-y-auto max-h-60 sm:max-h-80 space-y-1.5 p-1">
            {benchPlayers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                벤치에 남은 선수가 없습니다.
              </div>
            ) : (
              benchPlayers.map((player, idx) => {
                const fullName = `${player.studentId} ${player.name}`;
                const isSelected = selectedPlayer === fullName;

                return (
                  <button
                    key={`${player.studentId || 'p'}-${player.uid || idx}`}
                    type="button"
                    onClick={() =>
                      setSelectedPlayer(isSelected ? null : fullName)
                    }
                    className={`w-full p-2 rounded-xl text-xs flex items-center justify-between border transition ${
                      isSelected
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold ring-1 ring-red-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{player.studentNum}번</span>
                      <span className="font-bold">{player.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {player.studentId}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Action Bar */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {savedNotice && (
              <div className="mb-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> 라인업이 성공적으로 저장되었습니다!
              </div>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <span>{isSaving ? '저장 중...' : '포메이션 및 라인업 확정 저장'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
