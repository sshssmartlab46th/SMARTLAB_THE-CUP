import React, { useState, useEffect } from 'react';
import { UserProfile, SportType, ClassLineup } from '../types';
import { listenLineups, saveLineup } from '../services/firebaseService';
import { 
  Users, 
  Lock, 
  Unlock, 
  Shield, 
  CheckCircle, 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';

interface LineupManagerViewProps {
  currentUser: UserProfile;
}

export function LineupManagerView({ currentUser }: LineupManagerViewProps) {
  const [lineups, setLineups] = useState<ClassLineup[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType>('soccer');
  const [selectedClass, setSelectedClass] = useState<string>(
    currentUser.classNum && currentUser.classNum !== '00' ? `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` : '203'
  );

  // Form states for starters & subs
  const [playerInput, setPlayerInput] = useState('');
  const [playerPosition, setPlayerPosition] = useState('FW');
  const [starterPlayers, setStarterPlayers] = useState<string[]>([
    '20305 김민준 (FW)',
    '20311 정우진 (MF)',
    '20302 강현우 (DF)',
    '20318 이도현 (GK)'
  ]);
  const [substitutePlayers, setSubstitutePlayers] = useState<string[]>([
    '20321 박서준 (SUB)',
    '20309 윤성호 (SUB)'
  ]);
  const [runningOrder, setRunningOrder] = useState<string[]>([
    '1번 주자: 20305 김민준',
    '2번 주자: 20311 정우진',
    '3번 주자: 20302 강현우',
    '4번 주자 (앵커): 20318 이도현'
  ]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Class President or Admin check
  const isClassPresidentOfSelectedClass = 
    currentUser.role === 'admin' || 
    (currentUser.role === 'class_president' && `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` === selectedClass);

  useEffect(() => {
    const unsub = listenLineups((list) => {
      setLineups(list);
      const existing = list.find((l) => l.classId === selectedClass && l.sport === selectedSport);
      if (existing) {
        setStarterPlayers(existing.starterPlayers || []);
        setSubstitutePlayers(existing.substitutePlayers || []);
        if (existing.runningOrder) setRunningOrder(existing.runningOrder);
      }
    });
    return () => unsub();
  }, [selectedClass, selectedSport]);

  const handleAddPlayer = () => {
    if (!playerInput.trim()) return;
    const formatted = `${playerInput.trim()} (${playerPosition})`;
    setStarterPlayers((prev) => [...prev, formatted]);
    setPlayerInput('');
  };

  const handleRemovePlayer = (idx: number, isSub: boolean) => {
    if (isSub) {
      setSubstitutePlayers((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setStarterPlayers((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSaveLineup = async () => {
    if (!isClassPresidentOfSelectedClass) {
      alert('반장 또는 총괄 관리자만 라인업을 제출/수정할 수 있습니다.');
      return;
    }

    const lineupPayload: ClassLineup = {
      id: `lineup-${selectedClass}-${selectedSport}`,
      matchId: `match-${selectedSport}`,
      classId: selectedClass,
      sport: selectedSport,
      starterPlayers,
      substitutePlayers,
      runningOrder: selectedSport.startsWith('relay') ? runningOrder : undefined,
      submittedBy: `${currentUser.studentId} ${currentUser.name}`,
      submittedAt: new Date().toISOString()
    };

    await saveLineup(lineupPayload);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 5-Minute Pre-Match Security Notification Banner */}
      <div className="bg-slate-900 border border-amber-600/40 rounded-2xl p-4 sm:p-5 shadow-xl flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-white text-sm">
            상산고 라인업 5분 전 비공개 보안 규정 (Lineup Secrecy Rule)
          </h4>
          <p className="text-slate-300 leading-relaxed">
            전술 유출 및 전략적 부정 행위를 방지하기 위해, 상대 학급의 라인업은 <b>경기 시작 정각 5분 전</b>에만 시스템에서 자동으로 공개됩니다.
            각 반 반장은 경기 시작 20분 전까지 최종 명단을 제출해 주십시오.
          </p>
        </div>
      </div>

      {/* Sport and Class Filter */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">종목 선택</label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value as SportType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-red-600"
            >
              <option value="soccer">⚽ 축구 (11인제)</option>
              <option value="basketball">🏀 농구 (5인제)</option>
              <option value="dodgeball">🏐 피구 (12인제)</option>
              <option value="relay_male">🏃 남학생 계주 (주자 순서)</option>
              <option value="relay_female">🏃‍♀️ 여학생 계주 (주자 순서)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">조회 및 관리 학급</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-red-600"
            >
              <option value="201">2학년 1반 (남)</option>
              <option value="202">2학년 2반 (남)</option>
              <option value="203">2학년 3반 (남)</option>
              <option value="204">2학년 4반 (남)</option>
              <option value="205">2학년 5반 (여)</option>
              <option value="206">2학년 6반 (여)</option>
              <option value="207">2학년 7반 (여)</option>
              <option value="208">2학년 8반 (여)</option>
              <option value="101">1학년 1반</option>
              <option value="102">1학년 2반</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <span className="text-slate-400">
            현재 상태: {isClassPresidentOfSelectedClass ? (
              <b className="text-emerald-400 font-bold">라인업 제출 및 수정 가능 (반장/관리자 권한)</b>
            ) : (
              <span className="text-slate-500">열람 모드 (타 학급 또는 일반 학생)</span>
            )}
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            교사는 선수 명단에 포함될 수 없습니다 (자동 제외).
          </span>
        </div>
      </div>

      {/* Lineup Builder Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-serif font-black text-lg text-white">
              {selectedClass[0]}학년 {parseInt(selectedClass.substring(1), 10)}반 {selectedSport.toUpperCase()} 라인업
            </h3>
            <p className="text-xs text-slate-400">
              선발 출전 선수 및 교체 후보 명단
            </p>
          </div>

          {isClassPresidentOfSelectedClass && (
            <button
              onClick={handleSaveLineup}
              className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <Save className="w-3.5 h-3.5" />
              <span>라인업 최종 제출하기</span>
            </button>
          )}
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>라인업이 성공적으로 저장 및 등록되었습니다.</span>
          </div>
        )}

        {/* Add Player Input (Only if authorized) */}
        {isClassPresidentOfSelectedClass && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">선수 추가 등록</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                placeholder="선수 학번 및 성명 (예: 20305 김민준)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-600"
              />
              <select
                value={playerPosition}
                onChange={(e) => setPlayerPosition(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value="FW">공격수 (FW)</option>
                <option value="MF">미드필더 (MF)</option>
                <option value="DF">수비수 (DF)</option>
                <option value="GK">골키퍼 (GK)</option>
                <option value="가드">농구 가드 (G)</option>
                <option value="포워드">농구 포워드 (F)</option>
                <option value="센터">농구 센터 (C)</option>
                <option value="피구내야">피구 내야수</option>
                <option value="피구외야">피구 외야수</option>
              </select>
              <button
                onClick={handleAddPlayer}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>선수 등록</span>
              </button>
            </div>
          </div>
        )}

        {/* Starter Players Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              선발 출전 명단 ({starterPlayers.length}명)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Starter Squad</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {starterPlayers.map((player, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-950 text-red-400 font-mono text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-white">{player}</span>
                </div>
                {isClassPresidentOfSelectedClass && (
                  <button
                    onClick={() => handleRemovePlayer(idx, false)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Substitute Players Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              교체 대기 후보 ({substitutePlayers.length}명)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Bench Substitutes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {substitutePlayers.map((player, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs"
              >
                <span className="text-slate-300">{player}</span>
                {isClassPresidentOfSelectedClass && (
                  <button
                    onClick={() => handleRemovePlayer(idx, true)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
