import React, { useState } from 'react';
import { SangsanUser, SportType, ClassLineup, LineupPlayer } from '../types';
import { INITIAL_LINEUPS } from '../data/mockFestivalData';
import { Users, Lock, Unlock, ShieldAlert, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface LineupManagerProps {
  currentUser: SangsanUser | null;
}

export const LineupManager: React.FC<LineupManagerProps> = ({ currentUser }) => {
  const [lineups, setLineups] = useState<Record<string, ClassLineup>>(INITIAL_LINEUPS);
  const [selectedSport, setSelectedSport] = useState<SportType>('soccer');
  const [selectedClass, setSelectedClass] = useState<string>(
    currentUser?.classNum ? `${currentUser.grade}-${currentUser.classNum}` : '2-1'
  );

  // Lineup player input
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [playerPosition, setPlayerPosition] = useState('FW');

  const lineupKey = `${selectedClass}-${selectedSport}`;
  const currentLineup = lineups[lineupKey];

  const isAuthorizedToEdit =
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'class_president' &&
      `${currentUser.grade}-${currentUser.classNum}` === selectedClass);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !playerNumber.trim()) return;

    const newPlayer: LineupPlayer = {
      id: `p-${Date.now()}`,
      name: playerName.trim(),
      studentId: playerNumber.trim(),
      position: playerPosition,
    };

    const updatedPlayers = currentLineup ? [...currentLineup.players, newPlayer] : [newPlayer];

    const updatedLineup: ClassLineup = {
      id: currentLineup?.id || `lin-${Date.now()}`,
      classId: selectedClass,
      sport: selectedSport,
      players: updatedPlayers,
      submittedBy: `${currentUser?.studentId} ${currentUser?.name} (반장)`,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLineups({
      ...lineups,
      [lineupKey]: updatedLineup,
    });

    setPlayerName('');
    setPlayerNumber('');
  };

  const handleRemovePlayer = (id: string) => {
    if (!isAuthorizedToEdit || !currentLineup) return;
    const updatedPlayers = currentLineup.players.filter((p) => p.id !== id);
    setLineups({
      ...lineups,
      [lineupKey]: {
        ...currentLineup,
        players: updatedPlayers,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Security rule notice banner */}
      <div className="bg-amber-950/40 border border-amber-900/60 p-4 rounded-xl flex items-start gap-3 text-xs">
        <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">
            상산고등학교 전략 보호 안개(Lineup Fog-of-War) 보안 규정 적용
          </p>
          <p className="text-slate-300 leading-relaxed">
            모든 학급의 출전 엔트리는 타 학급의 전략 누설을 방지하기 위해 비공개로 암호화 보관되며,{' '}
            <strong className="text-white">경기 시작 정확히 5분 전</strong>에 전교생에게 투명하게 자동 해제되어 공개됩니다.
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap gap-2">
          {['soccer', 'basketball', 'dodgeball', 'relay_male', 'relay_female'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSport(s as SportType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedSport === s
                  ? 'bg-red-900 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s === 'soccer'
                ? '축구'
                : s === 'basketball'
                ? '농구'
                : s === 'dodgeball'
                ? '피구'
                : s === 'relay_male'
                ? '남학생 계주'
                : '여학생 계주'}
            </button>
          ))}
        </div>

        {/* Class selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">조회 학급:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
          >
            {[1, 2].flatMap((g) =>
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((c) => (
                <option key={`${g}-${c}`} value={`${g}-${c}`}>
                  {g}학년 {c}반 {c <= 4 || c >= 9 ? '(남)' : '(여)'}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Lineup Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Current Submitted Roster */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Users className="w-4 h-4 text-red-400" />
                {selectedClass.replace('-', '학년 ')}반 {selectedSport} 출전 명단
              </h3>
              {currentLineup ? (
                <span className="text-[11px] text-slate-400">
                  최종 제출: {currentLineup.submittedBy} ({currentLineup.submittedAt})
                </span>
              ) : (
                <span className="text-[11px] text-amber-400">
                  아직 제출된 엔트리가 없습니다.
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 text-emerald-400 rounded-md border border-slate-800 text-xs font-semibold">
              <Unlock className="w-3.5 h-3.5" />
              경기 5분 전 자동 공개 적용
            </div>
          </div>

          {!currentLineup || currentLineup.players.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
              <p>등록된 선수가 없습니다.</p>
              {isAuthorizedToEdit && (
                <p className="text-slate-400">
                  우측의 선수 등록 양식을 통해 학급 대표 선수를 등록하십시오.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentLineup.players.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        학번: {p.studentId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-900">
                      {p.position}
                    </span>
                    {isAuthorizedToEdit && (
                      <button
                        onClick={() => handleRemovePlayer(p.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Class President Lineup Submitter Form */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-red-400" />
            선수 추가 (반장 전용)
          </h4>

          {isAuthorizedToEdit ? (
            <form onSubmit={handleAddPlayer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">선수 이름</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="예: 김준호"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  선수 학번 (5자리)
                </label>
                <input
                  type="text"
                  value={playerNumber}
                  onChange={(e) => setPlayerNumber(e.target.value)}
                  placeholder="예: 20104"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">포지션 / 주자 순서</label>
                <select
                  value={playerPosition}
                  onChange={(e) => setPlayerPosition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="FW">공격수 (FW)</option>
                  <option value="MF">미드필더 (MF)</option>
                  <option value="DF">수비수 (DF)</option>
                  <option value="GK">골키퍼 (GK)</option>
                  <option value="1번 주자">1번 주자 (계주)</option>
                  <option value="2번 주자">2번 주자 (계주)</option>
                  <option value="3번 주자">3번 주자 (계주)</option>
                  <option value="앵커(4번)">최종 앵커(4번 주자)</option>
                  <option value="주전 선수">주전 선수</option>
                  <option value="후보">후보 선수</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold transition shadow mt-2"
              >
                선수 명단 추가
              </button>
            </form>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 space-y-2">
              <Lock className="w-6 h-6 text-slate-600 mx-auto" />
              <p>해당 학급 반장 또는 총괄관리자만 라인업을 작성하거나 수정할 수 있습니다.</p>
              <p className="text-[11px] text-slate-400">
                (상단에서 반장 계정으로 로그인 후 시도하세요)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
