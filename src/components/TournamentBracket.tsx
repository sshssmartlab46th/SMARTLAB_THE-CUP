import React, { useState } from 'react';
import { Match, SportType } from '../types';
import { Trophy, Users, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface TournamentBracketProps {
  matches: Match[];
  onSelectMatch: (matchId: string) => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  matches,
  onSelectMatch,
}) => {
  const [selectedSport, setSelectedSport] = useState<SportType>('soccer');

  // Male relay time trial data mock
  const [maleRelayTimes, setMaleRelayTimes] = useState([
    { rank: 1, classId: '2학년 1반', group: 'A조', record: '48.12초', advance: true },
    { rank: 2, classId: '2학년 3반', group: 'B조', record: '48.90초', advance: true },
    { rank: 3, classId: '1학년 2반', group: 'A조', record: '49.25초', advance: true },
    { rank: 4, classId: '2학년 4반', group: 'B조', record: '49.88초', advance: true },
    { rank: 5, classId: '1학년 1반', group: 'A조', record: '50.15초', advance: false },
    { rank: 6, classId: '1학년 4반', group: 'B조', record: '51.40초', advance: false },
    { rank: 7, classId: '1학년 9반', group: 'A조', record: '52.02초', advance: false },
    { rank: 8, classId: '2학년 10반', group: 'B조', record: '53.11초', advance: false },
  ]);

  const sportMatches = matches.filter((m) => m.sport === selectedSport);

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'soccer', name: '축구 (토너먼트)' },
          { id: 'basketball', name: '농구 (토너먼트)' },
          { id: 'dodgeball', name: '피구 (토너먼트)' },
          { id: 'relay_male', name: '남학생 계주 (예선 타임트라이얼 → 4강 결승)' },
          { id: 'relay_female', name: '여학생 계주 (단판 4팀 결승)' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSport(s.id as SportType)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedSport === s.id
                ? 'bg-red-900 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Bracket or Time-trial rendering */}
      {selectedSport === 'relay_male' ? (
        /* Male Relay: Type 2 Spec (Group Stage Time Trial -> Top 4 advance to finals) */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  남학생 계주 타임트라이얼 예선 순위표
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  각 조별 타임트라이얼 기록 상위 4개 학급이 최종 결승전에 자동 진출합니다.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-amber-950 text-amber-300 rounded border border-amber-800 font-semibold">
                상위 4팀 결승 진출 (Q)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">순위</th>
                    <th className="py-2.5 px-3">학급</th>
                    <th className="py-2.5 px-3">배정 조</th>
                    <th className="py-2.5 px-3">기록 (400m)</th>
                    <th className="py-2.5 px-3">진출 여부</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {maleRelayTimes.map((row) => (
                    <tr
                      key={row.classId}
                      className={row.advance ? 'bg-amber-950/20 text-white' : 'text-slate-400'}
                    >
                      <td className="py-3 px-3 font-bold font-mono">
                        {row.rank <= 3 ? (
                          <span className="text-amber-400 font-black text-sm">#{row.rank}</span>
                        ) : (
                          `#${row.rank}`
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-100">{row.classId}</td>
                      <td className="py-3 px-3">{row.group}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">{row.record}</td>
                      <td className="py-3 px-3">
                        {row.advance ? (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[11px] font-bold border border-emerald-800">
                            결승 진출 확정
                          </span>
                        ) : (
                          <span className="text-slate-500">탈락</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : selectedSport === 'relay_female' ? (
        /* Female Relay: Type 3 Spec (Single 4-team heat final) */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  여학생 계주 4팀 통합 결승전 단판 레이스
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  1학년 및 2학년 여학생 전체 학급(5반, 6반, 7반, 8반) 대표 선수의 단판 결승 레이스입니다.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-red-950 text-red-300 rounded border border-red-800 font-semibold">
                단판 결승 레이스
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { lane: '1번 레인', classId: '2학년 5반', seed: 'A시드', status: '출전 대기' },
                { lane: '2번 레인', classId: '2학년 6반', seed: 'B시드', status: '출전 대기' },
                { lane: '3번 레인', classId: '2학년 7반', seed: 'C시드', status: '출전 대기' },
                { lane: '4번 레인', classId: '2학년 8반', seed: 'D시드', status: '출전 대기' },
              ].map((team) => (
                <div
                  key={team.lane}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2"
                >
                  <div className="text-xs font-mono font-bold text-amber-400">{team.lane}</div>
                  <div className="text-sm font-bold text-white font-serif">{team.classId}</div>
                  <span className="inline-block text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                    {team.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Tournament Bracket: Type 1 Spec (Soccer, Basketball, Dodgeball) */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
          <div className="min-w-[700px] space-y-6">
            <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 pb-2">
              <span>8강전 (Quarter-Finals)</span>
              <span>4강 준결승 (Semi-Finals)</span>
              <span>결승전 (Championship)</span>
            </div>

            <div className="grid grid-cols-3 gap-8 items-center py-4">
              {/* Quarter finals */}
              <div className="space-y-6">
                {[
                  {
                    title: '8강 1경기',
                    teamA: '2학년 1반',
                    scoreA: 2,
                    teamB: '2학년 2반',
                    scoreB: 1,
                    winner: 'A',
                  },
                  {
                    title: '8강 2경기',
                    teamA: '2학년 3반',
                    scoreA: 0,
                    teamB: '2학년 4반',
                    scoreB: 0,
                    winner: null,
                  },
                  {
                    title: '8강 3경기',
                    teamA: '1학년 1반',
                    scoreA: 3,
                    teamB: '1학년 2반',
                    scoreB: 1,
                    winner: 'A',
                  },
                  {
                    title: '8강 4경기',
                    teamA: '1학년 3반',
                    scoreA: 0,
                    teamB: '1학년 4반',
                    scoreB: 0,
                    winner: null,
                  },
                ].map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 shadow"
                  >
                    <span className="text-[10px] text-red-400 font-semibold">{m.title}</span>
                    <div className="flex justify-between font-bold text-slate-200">
                      <span className={m.winner === 'A' ? 'text-amber-400' : ''}>{m.teamA}</span>
                      <span className="font-mono">{m.scoreA}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-200">
                      <span className={m.winner === 'B' ? 'text-amber-400' : ''}>{m.teamB}</span>
                      <span className="font-mono">{m.scoreB}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Semi finals */}
              <div className="space-y-16">
                {[
                  {
                    title: '4강 1경기',
                    teamA: '2학년 1반',
                    scoreA: 0,
                    teamB: '8강 2경기 승자',
                    scoreB: 0,
                  },
                  {
                    title: '4강 2경기',
                    teamA: '1학년 1반',
                    scoreA: 0,
                    teamB: '8강 4경기 승자',
                    scoreB: 0,
                  },
                ].map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-3 rounded-xl border border-red-900/50 text-xs space-y-1.5 shadow-md"
                  >
                    <span className="text-[10px] text-amber-400 font-semibold">{m.title}</span>
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>{m.teamA}</span>
                      <span className="font-mono">{m.scoreA}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-400">
                      <span>{m.teamB}</span>
                      <span className="font-mono">{m.scoreB}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Finals */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-red-950/80 via-slate-950 to-slate-900 p-4 rounded-xl border-2 border-amber-500/80 shadow-2xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold font-serif text-sm">
                    <Trophy className="w-4 h-4" />
                    최종 결승전 (FINAL)
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-100 py-1">
                    <span>4강 1경기 승자</span>
                    <span className="font-mono text-amber-400">0</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-100 py-1 border-t border-slate-800">
                    <span>4강 2경기 승자</span>
                    <span className="font-mono text-amber-400">0</span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-center pt-1">
                    상산고 대운동장 특설무대 | 15:30 개시
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
