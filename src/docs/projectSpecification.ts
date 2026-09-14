/**
 * @file projectSpecification.ts
 * @description
 * 상산고등학교 체육대회 및 축제 실시간 통합 관제·운영 플랫폼 (THE SANGSAN)
 * 공식 도메인 엔진 규칙, 권한 체계(RBAC), 1,000 CCU 무과금 아키텍처 명세.
 * 
 * [주의 / Notice for AI Models & Developers]
 * 본 프로젝트의 모든 디자인(색상, 레이아웃, 컴포넌트 구조, 뱃지, 타이포그래피 등)은
 * 기획서의 구 디자인 서술을 완전히 배제하고, 제공된 공식 PDF 디자인(Page 1~8)을 100% 참조합니다.
 */

/**
 * 1. 핵심 도메인 규칙 및 운영 아키텍처 명세 (Design-Free Domain Engine Specification)
 */
export const SANGSAN_DOMAIN_SPECIFICATION = {
  domainRules: {
    studentIdFormat: '5-digit integer: [Grade 1-digit][Class 2-digits][StudentNum 2-digits]',
    maleClasses: ['01', '02', '03', '04', '09', '10', '11', '12'],
    femaleClasses: ['05', '06', '07', '08'],
    teacherDetection: 'studentNum === "00" (e.g. 10100, 20400)',
    lineupFogOfWarMinutes: 5,
    cheerMessageCooldownMinutes: 5,
    matchTimerEngine: 'Net in-play clock (pause/resume without drift)',
    scoreAuditEngine: 'Immutable log with mandatory rollback reason (offside, foul, mis-input)',
    medicalPrivacyMandate: 'Zero-byte image overwriting immediately after inference; RICE emergency guideline'
  },
  roles: {
    admin: 'SYSTEM ADMINISTRATOR (총괄 관리자) - 전교 시스템 제어 & 전교 데이터',
    classLeader: 'CLASS LEADER (학급 반대표) - 소속 학급 전용 채널 및 라인업 편성',
    studentCouncil: 'STUDENT COUNCIL & SPORTS COMMITTEE (학생회 / 체육부) - 대회 현장 운영 & 자원 배치',
    matchOperator: 'MATCH OPERATOR (심판 · 기록원) - 배정 경기 득점 및 로스터 제어',
    healthOfficer: 'SAFETY & MEDICAL OFFICER (보건 안전 의무 본부) - 전교 부상자 접수, 환자 이송 및 연락'
  },
  concurrencyArchitecture: {
    targetCCU: 1000,
    zeroCostPolicy: 'Vercel Edge / Static CDN + Firestore Event Driven Push (No HTTP Polling)',
    inMemoryBuffer: 'Batch compression for emoji clicks (1s aggregation)',
    offlineSync: 'Browser cache offline persistence for referee score entry'
  }
} as const;

/**
 * 2. 공식 PDF 디자인 참조 명세 (PDF Design System SSOT)
 * 제공된 8페이지 PDF 디자인을 단일 진실 공급원(SSOT)으로 정의합니다.
 */
export const PDF_DESIGN_SPEC = {
  source: 'Official Design PDF (Pages 1-8)',
  themes: {
    light: {
      bg: '#ffffff / #f8fafc',
      cardBg: '#ffffff',
      border: 'border-slate-200',
      activeTabBg: 'bg-red-600 (or bg-rose-600 / #e11d48)',
      activeTabText: 'text-white',
      liveMatchBorder: 'border-2 border-red-400',
      liveBadge: 'bg-red-600 text-white',
      scoreText: 'text-red-600 font-mono font-black',
      cheerButton: 'bg-red-600 hover:bg-red-700 text-white font-bold',
      podiumFirstBorder: 'border-2 border-red-500 text-red-600'
    },
    dark: {
      bg: '#050811 / #0a0f1d',
      cardBg: '#0f172a / #0b1120',
      border: 'border-slate-800',
      activeTabBg: 'bg-emerald-500',
      activeTabText: 'text-slate-950 font-bold',
      liveMatchBorder: 'border-2 border-emerald-500',
      liveBadge: 'bg-emerald-500 text-slate-950',
      scoreText: 'text-emerald-400 font-mono font-black',
      cheerButton: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold',
      podiumFirstBorder: 'border-2 border-emerald-500 text-emerald-400'
    }
  },
  typography: {
    fontFamily: 'Inter, Pretendard, system-ui, sans-serif',
    logoTitle: '상산 체육대회 (Bold, 18-20px)',
    logoSubtitle: '상산고등학교 스마트 보드 (Regular, 11-12px, text-slate-400)'
  },
  roleBadges: {
    admin: { label: 'SYSTEM ADMINISTRATOR (총괄 관리자)', color: 'bg-red-600 text-white' },
    classLeader: { label: 'CLASS LEADER (학급 반대표)', color: 'bg-amber-400 text-slate-950' },
    studentCouncil: { label: 'STUDENT COUNCIL & SPORTS COMMITTEE (학생회 / 체육부)', color: 'bg-slate-800 text-white border border-slate-700' },
    matchOperator: { label: 'MATCH OPERATOR (심판 · 기록원)', color: 'bg-red-600 text-white' },
    healthOfficer: { label: 'SAFETY & MEDICAL OFFICER (보건 안전 의무 본부)', color: 'bg-sky-600 text-white' }
  }
} as const;
