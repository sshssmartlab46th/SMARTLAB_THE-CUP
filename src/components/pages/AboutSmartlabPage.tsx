import React from 'react';
import { SmartlabLogo, SMARTLAB_LOGO_URL } from '../common/SmartlabLogo';
import { SangsanLogo } from '../common/SangsanLogo';
import { Code, Cpu, Award, Users, ExternalLink, Sparkles } from 'lucide-react';

export const AboutSmartlabPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shrink-0">
          <SmartlabLogo size={72} showText={false} />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            상산고등학교 IT & 소프트웨어 엔지니어링 동아리
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            SMARTLAB (스마트랩)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
            상산고등학교 학생들의 더 나은 학교 생활을 위해 최첨단 웹/앱 솔루션과 실시간 데이터 시스템을 직접 연구·기획·개발하는 공식 소프트웨어 공학 동아리입니다.
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            1,000 CCU 동시접속 최적화
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            전교생 및 교직원이 동시 접속하는 야외 운동장 환경에서도 끊김 없는 초저지연 상태 동기화 아키텍처를 직접 구축했습니다.
          </p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Code className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            완전 자동화 학번 엔진
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            상산고 5자리 학번 규칙을 파싱하여 별도의 관리자 수기 검증 없이 학생·교사 권한을 즉시 안전하게 부여합니다.
          </p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            철저한 프라이버시 보호
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            환부 사진 등 민감한 의료 데이터는 AI 추론 즉시 영구 파기하며 학생들의 안전한 응원 문화를 지원합니다.
          </p>
        </div>
      </div>

      {/* Credit */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs text-center space-y-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          시스템 총괄 개발 및 프로젝트 디렉팅: <strong>SMARTLAB 김태호</strong>
        </p>
        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          DESIGNED AND ENGINEERED FOR SANGSAN HIGH SCHOOL SPORTS FESTIVAL
        </p>
      </div>
    </div>
  );
};
