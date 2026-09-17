import React, { useRef } from 'react';
import { MatchItem, SportType } from '../../types';
import { TournamentBracketView } from '../matches/TournamentBracketView';
import { SchedulePage } from './SchedulePage';
import { Calendar, Trophy, ArrowDown, Sparkles } from 'lucide-react';

export interface MatchSchedulePageProps {
  matches: MatchItem[];
  sport: SportType;
  onSelectSport: (sport: SportType) => void;
  userReminders: string[];
  onToggleReminder: (match: MatchItem) => void;
  onOpenMatchDetail?: (match: MatchItem) => void;
  onSelectMatch: (match: MatchItem) => void;
}

export const MatchSchedulePage: React.FC<MatchSchedulePageProps> = ({
  matches,
  sport,
  onSelectSport,
  userReminders,
  onToggleReminder,
  onOpenMatchDetail,
  onSelectMatch
}) => {
  const bracketRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Top Banner & Quick Navigation */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-red-500/10 via-amber-500/5 to-transparent dark:from-red-950/30 dark:via-amber-950/20 dark:to-transparent p-5 sm:p-6 backdrop-blur-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white tracking-wide">
                MATCH & TOURNAMENT
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                상산고등학교 체육대회
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              경기 일정 및 대진표
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              상단에서 종목별 토너먼트 대진표를 확인하고, 하단에서 대회 전체 경기 타임테이블을 검색 및 확인하세요.
            </p>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection(bracketRef)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs hover:border-red-500 transition cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>대진표로 이동</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection(scheduleRef)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white shadow-xs hover:bg-red-700 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>전체 일정으로 이동</span>
              <ArrowDown className="w-3 h-3 text-red-200" />
            </button>
          </div>
        </div>
      </div>

      {/* TOP SECTION: TOURNAMENT BRACKET (대진표) */}
      <section ref={bracketRef} className="scroll-mt-24 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                종목별 토너먼트 대진표
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                학년 및 종목을 선택하여 8강/4강/결승 진출 현황과 경기 결과를 확인합니다.
              </p>
            </div>
          </div>
        </div>

        <TournamentBracketView
          matches={matches}
          sport={sport}
          onSelectSport={onSelectSport}
          userReminders={userReminders}
          onToggleReminder={onToggleReminder}
          onOpenMatchDetail={onOpenMatchDetail}
        />
      </section>

      {/* SEPARATOR DIVIDER */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50 dark:bg-[#0b0f19] px-4 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-full py-1 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-emerald-400" />
            대회 전체 경기 일정표
          </span>
        </div>
      </div>

      {/* BOTTOM SECTION: FULL SCHEDULE (전체 일정) */}
      <section ref={scheduleRef} className="scroll-mt-24">
        <SchedulePage
          matches={matches}
          userReminders={userReminders}
          onToggleReminder={onToggleReminder}
          onSelectMatch={onSelectMatch}
        />
      </section>
    </div>
  );
};
