import React, { useState } from 'react';
import { MatchItem, SportType } from '../../types';
import { SoccerFormationBuilder } from '../lineup/SoccerFormationBuilder';
import { Users, Shield, Save, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

interface FormationInputPageProps {
  matches: MatchItem[];
  userClass?: string; // e.g., '302' or '3-2'
}

export const FormationInputPage: React.FC<FormationInputPageProps> = ({
  matches,
  userClass = '302'
}) => {
  const [selectedSport, setSelectedSport] = useState<SportType>('soccer');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Find matches relevant to this class
  const classMatches = matches.filter(m => 
    m.homeClass === userClass || m.awayClass === userClass ||
    m.homeTeam.includes(userClass) || m.awayTeam.includes(userClass) ||
    m.homeTeam.includes('3-2') || m.awayTeam.includes('3-2')
  );

  const targetMatchId = classMatches.length > 0 ? classMatches[0].id : (matches[0]?.id || 'match-demo');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
            CLASS LEADER (반대표)
          </span>
          <span className="text-xs text-slate-400">학급 스코프: {userClass}반</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-2">
          <Users className="w-6 h-6 text-red-600 dark:text-emerald-400" />
          우리 반 출전 선수 포메이션 & 라인업 입력
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          경기 시작 15분 전까지 선발 및 후보 명단을 배치하고 저장하세요. 경기 시작 5분 전 전술이 양팀에 공개됩니다.
        </p>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>라인업 보안 및 포그 오브 워(Fog of War) 수칙:</strong>
          <p className="mt-0.5">
            등록한 라인업은 본부 시스템에 안전하게 암호화되어 보관되며, 상대 팀 전술 노출을 방지하기 위해 킥오프 5분 전까지 양 팀 모두에게 비공개 처리됩니다.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>라인업과 포메이션이 성공적으로 클라우드에 저장되었습니다!</span>
        </div>
      )}

      {/* Formation Builder Component Container */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <SoccerFormationBuilder
          matchId={targetMatchId}
          classId={userClass}
          sport={selectedSport}
          onSaved={() => {
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
          }}
        />
      </div>
    </div>
  );
};
