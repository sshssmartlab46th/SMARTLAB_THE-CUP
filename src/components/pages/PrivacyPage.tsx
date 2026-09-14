import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-red-600 dark:text-emerald-400" />
          개인정보처리방침
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          상산고등학교 체육대회 스마트 보드는 학생과 교직원의 개인정보 보호를 최우선으로 준수합니다.
        </p>
      </div>

      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            1. 수집하는 개인정보 항목
          </h3>
          <p>
            상산고등학교 체육대회 스마트 보드는 최소한의 식별 정보만을 처리합니다:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
            <li><strong>필수 수집 항목</strong>: 5자리 학번(학년, 반, 번호), 성명</li>
            <li><strong>자동 생성/부여 항목</strong>: 소속 학급, 성별(학번에 따름), 직책 및 권한(학생, 반대표, 학생회, 심판, 관리자)</li>
            <li><strong>행사 참여 정보</strong>: 출전 종목, 포메이션 배치 정보, 응원 메시지(작성자 자동 익명 마스킹 처리)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            2. 개인정보의 이용 목적
          </h3>
          <p>
            수집된 정보는 다음 목적 이외의 용도로는 일절 사용되지 않습니다:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
            <li>체육대회 경기 출전 자격 검증 및 포메이션 라인업 관리</li>
            <li>경기 일정 알림 및 비상 시 학급/선수 비상 호출</li>
            <li>학급별 종합 순위 포인트 집계 및 점수 승인 기록 보존</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            3. 보건·의료 데이터 및 AI 부상 분석의 영구 파기 원칙
          </h3>
          <p className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
            <strong>* 의료 프라이버시 보호 의무</strong>: AI 부상 응급처치 분석 시 업로드되는 환부 사진은 진단 및 처치 안내 즉시 메모리에서 100% 영구 파기되며, 서버나 데이터베이스에 절대 저장되지 않습니다.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            4. 개인정보의 보유 및 파기
          </h3>
          <p>
            본 시스템의 모든 개인정보 및 경기 로그는 당해 연도 상산고등학교 체육대회 행사 종료 후 30일 이내에 영구 파기됩니다.
          </p>
        </section>

        <section className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <span>시행일자: 2026년 9월 1일</span>
          <span>상산고등학교 체육대회 스마트 보드 운영위원회</span>
        </section>
      </div>
    </div>
  );
};
