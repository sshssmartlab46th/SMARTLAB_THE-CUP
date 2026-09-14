import React from 'react';
import { BookOpen, Award, CheckCircle2, ShieldAlert } from 'lucide-react';

export const RulesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-red-600 dark:text-emerald-400" />
          상산고등학교 체육대회 공식 규정집
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          공정한 경기 진행과 학우 간 상호 존중을 위한 대회 운영 원칙 및 종목별 규칙입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 축구 규정 */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              ⚽ 축구 (남자부)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              전후반 각 20분
            </span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
            <li>경기 시작 15분 전까지 출전 선수 라인업(선발 11명, 교체)을 시스템에 등록해야 합니다.</li>
            <li>경기 시작 5분 전 전술 라인업이 양 학급에 동시 공개(Fog of War 해제)됩니다.</li>
            <li>무승부 시 연장전 없이 즉시 승부차기(5인)를 진행합니다.</li>
          </ul>
        </div>

        {/* 농구 규정 */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              🏀 농구 (남자부)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              전후반 각 15분
            </span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
            <li>5인제 풀코트 경기 진행, 팀파울 5개 초과 시 보너스 자유투 적용.</li>
            <li>개인 파울 5회 시 퇴장 및 교체 선수 투입.</li>
            <li>작전 타임은 전/후반 각 1회(1분) 허용됩니다.</li>
          </ul>
        </div>

        {/* 피구 규정 */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              🏐 피구 (여자부)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              3판 2선승제 (각 7분)
            </span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
            <li>외야수 1명 이상 상시 배치 필수.</li>
            <li>헤드샷 공격은 무효 처리되며 경고 1회가 부여됩니다.</li>
            <li>경기 종료 시점 내야 잔여 인원이 많은 팀이 세트 승리.</li>
          </ul>
        </div>

        {/* 계주 릴레이 규정 */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              🏃 계주 (남/여 400m 릴레이)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold">
              배점 가중치 높음
            </span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
            <li>각 학급 4인(1주자~4주자 앵커) 구성, 테이크오버 존 이탈 시 실격.</li>
            <li>바톤 낙하 시 떨어뜨린 주자가 직접 주워 인계해야 인정됩니다.</li>
            <li>레인 침범 및 고의 진로 방해는 즉시 실격 처리됩니다.</li>
          </ul>
        </div>
      </div>

      {/* 스포츠맨십 & 점수 판정 원칙 */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          스포츠맨십 및 점수 판정 원칙
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          1. 모든 경기의 승패 및 점수는 현장 공인 심판진의 판정을 최종으로 하며, 심판 판정에 대한 폭언 및 비신사적 행위 시 해당 학급 감점 조치가 부과됩니다.<br />
          2. 공식 스코어는 심판원이 제출한 뒤 총괄 본부 관리자의 승인 절차를 거쳐 학급 순위표에 실시간 자동 반영됩니다.<br />
          3. 이의제기는 경기 종료 후 15분 이내에 학급 반대표를 통해서만 본부에 서면 접수할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
