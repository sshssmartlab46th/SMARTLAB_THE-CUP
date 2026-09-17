import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Clock, 
  Server, 
  Globe, 
  EyeOff, 
  Trash2, 
  HelpCircle, 
  Phone, 
  ChevronRight, 
  Sparkles, 
  Layers,
  Printer,
  Edit3,
  Save,
  RotateCcw,
  X
} from 'lucide-react';
import { UserProfile, AppDocument } from '../../types';
import { listenAppDocument, saveAppDocument, resetAppDocument } from '../../services/firebaseService';
import { DEFAULT_APP_DOCUMENTS } from '../../data/defaultDocuments';
import { formatKSTDateTime } from '../../utils/kstTime';

interface PrivacyPageProps {
  currentUser?: UserProfile | null;
  onNavigateToAdmin?: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({
  currentUser,
  onNavigateToAdmin
}) => {
  const [docData, setDocData] = useState<AppDocument>(DEFAULT_APP_DOCUMENTS['privacy']);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState<AppDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<string>('all');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.studentId === 'sshsgym';

  useEffect(() => {
    const unsub = listenAppDocument('privacy', (doc) => {
      setDocData(doc);
    });
    return () => unsub();
  }, []);

  const handleStartEdit = () => {
    setEditBuffer(JSON.parse(JSON.stringify(docData)));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editBuffer) return;
    setIsSaving(true);
    try {
      const operatorName = currentUser?.name ? `${currentUser.name} (${currentUser.role === 'admin' ? '총괄관리자' : '운영진'})` : '총괄본부';
      await saveAppDocument({
        ...editBuffer,
        updatedBy: operatorName
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert('개인정보 처리방침 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('개인정보 처리방침을 기본 원문으로 복원하시겠습니까?')) {
      setIsSaving(true);
      try {
        const restored = await resetAppDocument('privacy', currentUser?.name || '총괄 관리자');
        setEditBuffer(JSON.parse(JSON.stringify(restored)));
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const articles = [
    { id: 'art-1', title: '제1조 (목적 및 정의)' },
    { id: 'art-2', title: '제2조 (개인정보 처리 원칙 및 연속 운영 정책)' },
    { id: 'art-3', title: '제3조 (수집 항목, 생성 정보 및 수집 방법)' },
    { id: 'art-4', title: '제4조 (학번 알고리즘 분석 및 권한 제한)' },
    { id: 'art-5', title: '제5조 (차기 대회 연계를 위한 보유 및 관리 기간)' },
    { id: 'art-6', title: '제6조 (데이터 안전 보관 및 불필요 정보 정비·파기)' },
    { id: 'art-7', title: '제7조 (제3자 제공, 목적 외 이용 및 철회)' },
    { id: 'art-8', title: '제8조 (업무 위탁 및 국외 이전 면책)' },
    { id: 'art-9', title: '제9조 (특수 서비스 기능 및 Zero-Storage)' },
    { id: 'art-10', title: '제10조 (정보주체 및 법정대리인의 권리·의무)' },
    { id: 'art-11', title: '제11조 (정보 수정 불가 원칙 및 면책)' },
    { id: 'art-12', title: '제12조 (안전성 확보 조치 및 한계 면책)' },
    { id: 'art-13', title: '제13조 (감사 로그 보관 및 위·변조 방지)' },
    { id: 'art-14', title: '제14조 (자동 수집 장치, 로컬 저장소 및 쿠키)' },
    { id: 'art-15', title: '제15조 (손해배상 및 종합 면책 조항)' },
    { id: 'art-16', title: '제16조 (보호책임자 및 분쟁 해결 창구)' },
    { id: 'art-17', title: '제17조 (개정, 고지 및 해석)' }
  ];

  const filteredArticles = articles.filter((art) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return art.title.toLowerCase().includes(q) || art.id.toLowerCase().includes(q);
  });

  const scrollToArticle = (id: string) => {
    setActiveArticle(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner & Official Metadata */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="relative h-48 sm:h-64 w-full bg-slate-950 overflow-hidden">
          <img 
            src="/images/privacy_shield_banner.jpg" 
            alt="THE SANGSAN Privacy & Security" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/sangsan_logo.png" 
                  alt="상산고등학교 교표" 
                  className="w-8 h-8 object-contain drop-shadow-md"
                />
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white tracking-wide">
                  {docData.badge || '상산고등학교 공식 규정'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800/80 backdrop-blur-xs text-slate-300 border border-slate-700">
                  {docData.updatedAt ? `최종 개정: ${formatKSTDateTime(docData.updatedAt)}` : '시행일: 2026. 09. 14'}
                </span>
              </div>

              {isAdmin && !isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>방침 수정하기</span>
                </button>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {docData.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {docData.subtitle || docData.content}
            </p>
          </div>
        </div>

        {/* Admin Inline Edit Panel */}
        {isEditing && editBuffer && (
          <div className="p-6 bg-red-50/40 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-red-600" />
                개인정보 처리방침 수정 모드
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>원문 복원</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? '저장 중...' : '저장 완료'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  공식 규정 명칭
                </label>
                <input
                  type="text"
                  value={editBuffer.title}
                  onChange={(e) => setEditBuffer({ ...editBuffer, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  상단 배지 표기
                </label>
                <input
                  type="text"
                  value={editBuffer.badge || ''}
                  onChange={(e) => setEditBuffer({ ...editBuffer, badge: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                방침 목적 및 개요 설명
              </label>
              <textarea
                rows={2}
                value={editBuffer.subtitle || ''}
                onChange={(e) => setEditBuffer({ ...editBuffer, subtitle: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
              />
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-500 text-white text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>개인정보 처리방침이 성공적으로 수정·저장되었습니다.</span>
            </div>
          </div>
        )}

        {/* Core Principles Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 p-4 bg-slate-50/70 dark:bg-slate-800/40 text-center text-xs">
          <div className="p-3">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
              <Server className="w-3.5 h-3.5 text-blue-500" />
              차기 대회 연계 & 안전 보존
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              다음 대회 및 학내 행사를 위한 데이터 연속 보관
            </div>
          </div>
          <div className="p-3">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              비밀번호 미수집 원칙
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              학번·이름 기반 안심 세션 인증
            </div>
          </div>
          <div className="p-3">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
              <EyeOff className="w-3.5 h-3.5 text-emerald-500" />
              부상 사진 Zero-Storage
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              AI 분석 즉시 메모리 영구 소멸
            </div>
          </div>
          <div className="p-3">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              감사 로그 위·변조 방지
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              점수·일정 변경 시 불변 이력 보존
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls: Search & Table of Contents */}
      <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="방침 내 조항 검색 (예: 학번, 사진, Grok, 위탁, 감사 로그, 면책)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-red-500"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>방침 인쇄</span>
            </button>
          </div>
        </div>

        {/* Quick jump tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            type="button"
            onClick={() => scrollToArticle('all')}
            className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
              activeArticle === 'all' 
                ? 'bg-red-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            전체 보기
          </button>
          {filteredArticles.map((art) => (
            <button
              key={art.id}
              type="button"
              onClick={() => scrollToArticle(art.id)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                activeArticle === art.id 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {art.title.split(' ')[0]} {art.title.split(' ')[1]?.slice(0, 8)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Privacy Policy Content */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-10 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        
        {/* Document Metadata Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>최종 개정일: 2026년 9월 14일</span>
            <span>시행일: 2026년 9월 14일</span>
          </div>
          <div className="text-[11px] text-slate-500">
            상산고등학교 체육대회·축제 운영위원회 및 총괄본부 시스템 관리 규정
          </div>
        </div>

        {/* 제1조 */}
        <section id="art-1" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제1조 (목적 및 정의)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. <strong>상산고등학교</strong> 학내 체육대회, 동아리 축제, 상산컵 등 학내 행사 전용 관리 시스템인 <strong>‘THE SANGSAN’</strong>(이하 "서비스")은 정보주체(학생, 교원, 학부모, 기타 사용자 등)의 개인정보를 보호하고 관련 법령을 준수하기 위해 본 개인정보 처리방침(이하 "본 방침")을 수립·고지합니다.
            </p>
            <p>2. 본 방침에서 사용하는 용어의 정의는 다음과 같습니다.</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>"서비스"라 함은:</strong> 접속 기기(PC, 스마트폰, 태블릿 등)에 구애받지 않고 사용자가 이용할 수 있는 ‘THE SANGSAN’ 웹 및 애플리케이션 형태의 전용 플랫폼을 의미합니다.</li>
              <li><strong>"사용자"라 함은:</strong> 서비스에 접속하여 본 방침 및 이용조건에 따라 서비스를 이용하는 학생, 교원, 관리자 및 기타 관계자를 통칭합니다.</li>
              <li><strong>"세션 토큰"이라 함은:</strong> 본인 확인 후 발행되어 사용자의 단말기 내에 저장되는 무작위 암호화 문자열 형태의 식별 장치를 의미합니다.</li>
              <li><strong>"감사 로그"라 함은:</strong> 데이터 조작, 점수 수정, 일정 변경 등의 행위가 발생하였을 때 시스템이 자동으로 기록하는 미삭제 이력 데이터를 의미합니다.</li>
            </ul>
          </div>
        </section>

        {/* 제2조 */}
        <section id="art-2" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제2조 (개인정보 처리 기본 원칙 및 연간 학내 행사 연속 운영 정책)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 서비스는 사용자의 개인정보 수집 시 서비스 제공에 필요한 최소한의 범위로 한정하며, 사용자의 기본적 인권을 침해할 우려가 있는 민감한 개인정보는 원칙적으로 수집하지 않습니다.
            </p>
            <p>
              2. <strong>연간 행사 및 차기 대회 연속 운영의 명시:</strong> 본 서비스는 단발성 일회용 시스템에 그치지 않고, 상산고등학교 내 체육대회, 동아리 축제, 상산컵 등 학기별·학년도별 차기 대회 및 교내 행사의 원활한 연속 운영, 역대 경기 결과 공식 아카이빙, 학생 계정 편의를 위하여 수집된 기본 데이터 및 경기 기록을 지속적으로 안전하게 보존·관리합니다.
            </p>
            <p>
              3. 행사 종료 시에도 사용자의 기본 프로필(학번, 이름, 학년)과 경기 기록, 감사 로그 등은 차기 대회 연계 및 명예의 전당 보존을 위해 영구 소멸되지 않고 안전하게 유지됩니다. 단, 제9조에 명시된 AI 부상 지식백과 매칭 시 첨부된 환부 사진 등 일회성 민감 데이터는 분석 즉시 파기(Zero-Storage)됩니다.
            </p>
          </div>
        </section>

        {/* 제3조 */}
        <section id="art-3" className="scroll-mt-32 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제3조 (수집하는 개인정보의 항목, 생성 정보 및 수집 방법)
          </h2>
          <div className="space-y-3 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 서비스는 회원 가입 및 서비스 제공을 위하여 다음과 같은 개인정보 항목을 수집 및 처리합니다. 서비스는 보안 위험 및 절차 지연을 최소화하기 위하여 <strong>비밀번호, 이메일 주소, 자택 주소, 전화번호 등을 수집하지 않습니다.</strong>
            </p>

            {/* Table 1: 수집 정보 항목 */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold">
                  <tr>
                    <th className="p-3">수집 구문</th>
                    <th className="p-3">필수 / 선택</th>
                    <th className="p-3">수집 및 처리 정보 항목</th>
                    <th className="p-3">이용 목적</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">기본 가입 정보</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">필수</span></td>
                    <td className="p-3">학번(5자리 숫자), 이름, 학년</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">본인 식별, 중복 가입 방지, 고정 닉네임 생성, 학년/반/성별 자동 분류</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">교원 판별 정보</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">필수(자동)</span></td>
                    <td className="p-3 font-mono">학번 끝자리 00 조합 데이터</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">교원 계정 판별, 학년 정보 비노출 처리, 출전 라인업 후보군 원천 제외</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">AI 부상 매칭 정보</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">선택</span></td>
                    <td className="p-3">입력 증상 텍스트, 부상 부위 촬영 사진 이미지</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">Grok API 기반 부상 지식백과 항목 매칭, 응급처치 가이드 제공</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">자동 생성 정보</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">필수(자동)</span></td>
                    <td className="p-3 font-mono">세션 토큰, 접속 IP, 서비스 이용 기록, 접속 로그, 기기 식별</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">세션 유지, 동시 접속자 관리, 실시간 브로드캐스팅, 부정 이용 방지</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 pt-2">
              <p className="font-bold text-slate-900 dark:text-white">2. 개인정보 수집 방법</p>
              <ul className="space-y-1 pl-2 text-slate-600 dark:text-slate-400">
                <li><strong>가. 사용자 입력 방식:</strong> 회원 가입 과정에서 사용자가 직접 학번, 이름, 학년을 입력하고 최종 확인 절차를 거침으로써 수집합니다.</li>
                <li><strong>나. 자동 수집 방식:</strong> 서비스 접속 과정에서 세션 토큰이 발행되어 사용자 단말기 저장소(Local Storage)에 저장되며, 웹소켓 연결 및 HTTP 요청 시 IP 및 접속 기록이 자동 수집됩니다.</li>
                <li><strong>다. 기능 실행에 따른 수집:</strong> 사용자가 AI 부상 매칭 모듈을 실행하여 입력창에 텍스트를 기재하거나 이미지 파일을 업로드할 때 해당 데이터가 수집됩니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제4조 */}
        <section id="art-4" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제4조 (학번 알고리즘에 기반한 개인정보 자동 분석, 분류 및 권한 제한)
          </h2>
          <div className="space-y-3 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 서비스는 사용자가 입력한 5자리 학번 데이터에 근거하여 별도의 수동 확인 절차 없이 알고리즘에 의해 정보를 자동 구문 분석(Parsing)하고 처리합니다.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>자릿수별 자동 판별:</strong> 첫 번째 자리는 '학년', 두 번째와 세 번째 자리는 '반', 네 번째와 다섯 번째 자리는 '번호'로 자동 인식됩니다.</li>
              <li><strong>성별 및 종목 자동 분류:</strong> 학번 내 반 정보를 기준으로 1~4반 및 9~12반은 '남학생반', 5~8반은 '여학생반'으로 자동 판별되어 해당 성별이 참가하는 종목 및 브라켓으로 자동 배치됩니다.</li>
            </ul>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
              <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                2. 교원 계정의 자동 분류 및 기능 제한 특례
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800/90 dark:text-blue-300/90 text-xs">
                <li>학번의 마지막 두 자리가 <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">00</code>으로 종료되는 데이터는 교원 계정으로 자동 판별됩니다.</li>
                <li>교원 계정은 학년 정보가 서비스 전반에서 노출되지 않으며, 가입 시 수동 선택된 학년 정보는 무시됩니다.</li>
                <li>교원 계정은 해당 반에 자동 소속되나, <strong>반장에 의한 경기 출전 라인업(축구 포메이션, 계주 순서 등) 구성 시 후보선수 목록에서 자동 제외</strong>됩니다.</li>
                <li>교원 계정에는 해당 반 공지 작성 권한 및 쪽지 송수신 권한이 자동으로 부여됩니다.</li>
              </ul>
            </div>

            <p>
              3. <strong>고정 표기 닉네임 및 사용자 변경 불가 정책:</strong> 시스템 내에서 사용자를 식별하는 표기명은 <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">[학번] [이름]</code> 형태의 단일 조합으로 고정되며, 사용자는 임의로 닉네임을 변경할 수 없습니다.
            </p>
          </div>
        </section>

        {/* 제5조 */}
        <section id="art-5" className="scroll-mt-32 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제5조 (개인정보의 처리, 차기 대회 연계를 위한 보유 및 관리 기간)
          </h2>
          <div className="space-y-3 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 서비스는 상산고등학교 내 차기 대회(다음 학기·차기 연도 체육대회, 상산컵, 동아리 축제 등)의 연속적인 연계 운영과 역대 경기 기록 공식 아카이빙을 위하여 사용자의 기본 식별 데이터 및 경기 로그를 안전하게 보관·관리합니다.
            </p>
            <p>2. 본 서비스의 개인정보 및 데이터 보유·관리 기간은 다음과 같습니다.</p>

            {/* Table 2: 보유 기간 */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold">
                  <tr>
                    <th className="p-3">개인정보 항목</th>
                    <th className="p-3">보유 및 이용 기간</th>
                    <th className="p-3">보유 목적 및 관리 기준</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">사용자 가입 정보 (학번, 이름, 학년)</td>
                    <td className="p-3 font-medium text-blue-600 dark:text-blue-400">재학 기간 및 차기 대회 연속 운영 기간</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">차기 대회(체육대회, 상산컵 등) 계정 재사용, 출전 선수 등록 및 학생 식별 목적 보존</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">경기 결과, 스코어보드, 타임라인 기록</td>
                    <td className="p-3 font-medium text-blue-600 dark:text-blue-400">학내 공식 기록 아카이빙 (준영구)</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">상산고 행사 역사 보존, 명예의 전당, 역대 전적 조회 및 학내 공식 통계</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">세션 토큰 및 인증 데이터</td>
                    <td className="p-3">보안 세션 유효 기간</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">세션 만료 시 갱신 관리 및 사용자 로그아웃 시 단말기 소멸</td>
                  </tr>
                  <tr className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 bg-emerald-50/20 dark:bg-emerald-950/10">
                    <td className="p-3 font-bold text-emerald-800 dark:text-emerald-300">부상 지식백과 첨부 사진 데이터</td>
                    <td className="p-3 font-bold text-red-600 dark:text-red-400">분석 실행 즉시 파기 (Zero-Storage)</td>
                    <td className="p-3 font-bold text-emerald-700 dark:text-emerald-300">API 전송 및 분석 완료 즉시 0초 내 임시 메모리 파기 (미성년자 프라이버시 보호)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">부상 분석 요약 텍스트 로그</td>
                    <td className="p-3">당해 학년도 보건 안전 지원 기간</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">행사 안전 관리, 의무실 통계 및 보건 지원 목적 후 정비</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">점수 및 일정 수정 감사 로그</td>
                    <td className="p-3 font-medium text-purple-600 dark:text-purple-400">영구 보존 (위·변조 방지)</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">시스템 감사, 분쟁 조정, 무단 조작 검증 목적으로 수정·삭제 불가 보존</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">퇴출 사용자 이력 데이터</td>
                    <td className="p-3">행사 연속 운영 기간</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">차기 대회 비인가 접근 및 부정 이용 방지 목적으로 보존 관리</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 제6조 */}
        <section id="art-6" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제6조 (데이터의 장기 안전 보관 및 불필요 정보 정비·파기 기준)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. <strong>차기 대회를 위한 안전 보관 원칙:</strong> 본 서비스의 데이터는 단일 행사 종료 시 임의로 일괄 삭제되지 않으며, 차기 대회 운영 및 학내 공식 기록 보존을 위해 인가된 관리자만 접근 가능한 보안 클라우드 데이터베이스에 안전하게 영속 보관됩니다.
            </p>
            <p>
              2. <strong>불필요 정보의 선별적 정비:</strong> 학생 졸업, 당사자의 정당한 삭제 청구권 행사, 또는 운영위원회의 심의에 따라 더 이상 보관이 불필요하다고 판단되는 노후 데이터에 한하여 선별적으로 정비 및 파기를 수행합니다.
            </p>
            <p>3. <strong>기술적 파기방법 (파기 대상 확정 시):</strong></p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>전자적 파일 형태:</strong> 데이터베이스 내 영구 삭제 대상 레코드는 복구 및 재생이 불가능하도록 표준 데이터베이스 삭제 명령 및 영구 덮어쓰기 기법을 적용합니다.</li>
              <li><strong>일회성 민감 데이터:</strong> AI 부상 분석을 위해 임시 전송된 사진 파일은 제9조에 의거하여 RAM 및 백엔드 임시 버퍼에서 분석 프로세스 완료 즉시 0초 내 완전 덮어쓰기(Overwrite) 소멸 조치(Zero-Storage Policy)를 유지합니다.</li>
            </ul>
          </div>
        </section>

        {/* 제7조 */}
        <section id="art-7" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제7조 (개인정보의 제3자 제공, 목적 외 이용 및 동의 철회 조치)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 서비스 제공자는 정보주체의 개인정보를 제3조에서 명시한 범위 내에서만 처리하며, 정보주체의 사전 동의 없이 개인정보를 외부에 제공하거나 목적 외의 용도로 이용하지 않습니다. 단, 다음 각 호의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li>가. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              <li>나. 학내 응급 상황, 대형 안전사고, 부상자 발생 등에 따라 학생의 생명이나 신체, 건강을 보호하기 위하여 긴급히 필요한 경우</li>
            </ul>
            <p>
              2. 사용자는 개인정보의 제3자 제공 및 목적 외 이용에 대한 동의를 언제든지 철회할 수 있으나, 동의 철회 시 서비스의 전체 또는 일부 이용이 제한될 수 있습니다.
            </p>
          </div>
        </section>

        {/* 제8조 */}
        <section id="art-8" className="scroll-mt-32 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제8조 (개인정보 처리 업무의 위탁 및 국외 이전 면책 조치)
          </h2>
          <div className="space-y-3 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 서비스는 원활한 서비스 제공, 시스템 안정성 확보 및 첨단 기능 구현을 위하여 다음과 같이 외부 전문 클라우드 인프라 및 API 제공업체에 개인정보 처리 업무를 위탁합니다.
            </p>
            <p>
              2. 사용자는 본 서비스를 이용함과 동시에 아래의 개인정보 처리 위탁 및 데이터의 국외 이전(또는 해외 서버 데이터 저장) 사항에 대해 동의한 것으로 간주됩니다.
            </p>

            {/* Table 3: 위탁 업체 */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold">
                  <tr>
                    <th className="p-3">수탁업체</th>
                    <th className="p-3">위탁 국가</th>
                    <th className="p-3">위탁 정보 항목</th>
                    <th className="p-3">위탁 업무 목적</th>
                    <th className="p-3">보유 및 이용 기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">Supabase Inc.</td>
                    <td className="p-3">미국 등 해외 인프라</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">학번, 이름, 학년, 세션 데이터, 공지/쪽지/건의함 데이터</td>
                    <td className="p-3">데이터베이스 호스팅 및 데이터 영속성 유지</td>
                    <td className="p-3 font-medium">서비스 종료 시까지</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">Oracle Corporation</td>
                    <td className="p-3">한국 / 미국</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">접속 IP, 세션 토큰, 스코어/타이머 데이터, 감사 로그</td>
                    <td className="p-3">가상 서버 호스팅, 실시간 웹소켓 통신 전담</td>
                    <td className="p-3 font-medium">서비스 종료 시까지</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">Vercel Inc.</td>
                    <td className="p-3">미국 등 해외 CDN</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">클라이언트 접속 기록, 정적 페이지 렌더링 세션</td>
                    <td className="p-3">프론트엔드 웹 애플리케이션 호스팅</td>
                    <td className="p-3 font-medium">서비스 종료 시까지</td>
                  </tr>
                  <tr className="hover:bg-red-50/30 dark:hover:bg-red-950/20 bg-red-50/10 dark:bg-red-950/5">
                    <td className="p-3 font-bold text-red-700 dark:text-red-400">xAI Corp. (Grok API)</td>
                    <td className="p-3">미국</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">부상 설명 텍스트, 부상 부위 첨부 사진</td>
                    <td className="p-3">AI 기반 부상 증상 분석 및 지식백과 매칭</td>
                    <td className="p-3 font-bold text-red-600 dark:text-red-400">API 처리 즉시 소멸 (미저장)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500">
              3. <strong>위탁 관련 면책 조치:</strong> 서비스 제공자는 위 수탁업체의 과실, 인프라 장애, 천재지변, 해외 통신망 문제 등으로 인하여 발생하는 서비스 중단, 데이터 손실 또는 개인정보 유출에 대하여 관련 법령이 허용하는 최대 범위 내에서 책임이 면제됩니다.
            </p>
          </div>
        </section>

        {/* 제9조 */}
        <section id="art-9" className="scroll-mt-32 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제9조 (특수 서비스 기능에 관한 개인정보 및 데이터 보호 면책 방침)
          </h2>
          <div className="space-y-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            
            {/* 9.1 Zero-Storage Policy Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-emerald-600" />
                    9.1 AI 기반 부상 지식백과 분석 및 사진 데이터 파기 (Zero-Storage Policy)
                  </h3>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    미성년자 신체 부위 민감 사진에 대한 원천 불저장 및 임시 메모리 즉시 소멸 조치
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                  Zero-Storage 방침 적용
                </span>
              </div>

              {/* Infographic Graphic for Zero-Storage */}
              <div className="rounded-xl overflow-hidden border border-emerald-200/80 dark:border-emerald-800/80 bg-white dark:bg-slate-900 max-h-56">
                <img 
                  src="/images/zero_storage_graphic.jpg" 
                  alt="Zero Storage Ephemeral Lifecycle Diagram" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center max-h-56 opacity-90"
                />
              </div>

              <div className="space-y-1.5 text-xs text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
                <p>1. 사용자가 다친 부위를 촬영하여 업로드하는 사진 데이터는 미성년자의 신체 일부가 포함될 수 있는 민감 정보에 해당할 수 있습니다.</p>
                <p>2. 서비스는 사진 데이터를 서버 저장소에 영구 보관하지 않으며, AI 분석 알고리즘 통과 직후 백엔드 메모리에서 즉시 완전 삭제(Zero-Storage Policy)합니다.</p>
                <p>3. 분석 후 데이터베이스에는 단순 텍스트 형태의 요약문만 저장됩니다. 사용자는 본 사진 처리 방식에 동의하는 경우에만 사진 첨부 기능을 이용해야 하며, 첨부로 인해 발생하는 예기치 못한 민감정보 노출 위험에 대해 서비스 제공자는 기술적 조치를 다한 경우 면책됩니다.</p>
                <p className="font-bold text-red-700 dark:text-red-400">4. AI 매칭 기능은 사전 검수된 원문 항목을 추천하는 참고용 도구일 뿐 의학적 진단이 아니므로, 출력된 매칭 결과로 인해 발생하는 모든 신체적·의료적 문제에 대하여 서비스 제공자는 어떠한 법적 책임도 지지 않습니다.</p>
              </div>
            </div>

            {/* 9.2 */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                9.2 실시간 데이터 브로드캐스팅, 스코어보드 및 응원하기 기능
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                1. 실시간 경기 스코어, 타이머, 응원 카운트, 타임라인 데이터는 동시 접속자 전체에게 웹소켓(WebSocket) 기술을 통해 실시간 송수신(Broadcasting)됩니다.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                2. 응원하기 기능은 어뷰징 방지 장치 없이 운영되므로, 사용자의 다중 클릭 행위로 인해 발생하는 접속 지연이나 화면 과부하 현상에 대해 서비스 제공자는 책임을 지지 않습니다.
              </p>
            </div>

            {/* 9.3 */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                9.3 음성 인식 기반 실시간 경기 해설(STT) 데이터의 가공 및 활용
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                1. 관리자가 지정한 해설위원의 음성은 텍스트로 변환(Speech-to-Text)되어 10초 주기로 전교생에게 스트리밍 노출될 수 있습니다.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                2. 해설위원의 음성 데이터 및 변환된 텍스트 데이터는 서비스 운영 및 기록 보관 목적으로 가공·표출될 수 있으며, 해설위원으로 지정된 사용자는 이에 사전 동의한 것으로 봅니다.
              </p>
            </div>
          </div>
        </section>

        {/* 제10조 */}
        <section id="art-10" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제10조 (정보주체 및 법정대리인의 권리·의무와 그 행사 제한)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 정보주체(학생, 교원, 법정대리인)는 서비스 제공자에 대하여 언제든지 개인정보 열람, 정지, 파기 요구 등의 권리를 행사할 수 있습니다.
            </p>
            <p>2. <strong>권리 행사의 제한:</strong></p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li>가. 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우</li>
              <li>나. 다른 사람의 생명·신체를 해할 우려가 있거나 다른 사람의 재산과 기타 이익을 부당하게 침해할 우려가 있는 경우</li>
              <li>다. 개인정보를 처리하지 아니하면 약정한 서비스를 제공하지 못하는 등 계약의 이행이 곤란한 경우로서 정보주체가 그 계약의 해지 의사를 명확하게 밝히지 아니한 경우</li>
            </ul>
            <p>
              3. 만 14세 미만 아동의 가입 시, 법정대리인은 아동의 개인정보에 대한 열람, 정지, 삭제 요구권을 행사할 수 있으나, 학내 행사의 원활한 진행을 위해 가입 처리 자체를 거부할 경우 행사 참여 기능이 제한될 수 있습니다.
            </p>
          </div>
        </section>

        {/* 제11조 */}
        <section id="art-11" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제11조 (정보 수정 불가 원칙 및 서비스 제공자의 과실 면책)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. <strong>정보 수정을 위한 정당한 사유의 제한:</strong> 서비스의 원활하고 신속한 가입 처리를 위하여 최초 가입 시 사용자가 직접 입력하고 확인 팝업창을 통과한 학번, 이름, 학년 정보는 <strong>사용자 본인이 시스템상에서 직접 수정하는 것이 불가능</strong>합니다.
            </p>
            <p>
              2. <strong>사용자의 입력 오류에 대한 면책:</strong> 사용자가 학번, 이름, 학년 등을 잘못 입력하여 본인 식별이 불가능하거나 타인 계정과의 충돌, 동명이인 오류, 라인업 배정 오류, 공지/쪽지 수신 오류 등이 발생하는 경우, 서비스 제공자는 이에 대한 책임을 지지 않습니다.
            </p>
            <p>
              3. <strong>예외 조치 수단의 한계:</strong> 오타 등으로 인한 정보 수정은 관리자에 의하여 DB의 값을 직접 변경해 주는 방식으로만 예외 처리됩니다. 관리자의 수정 작업이 진행되는 동안 발생하는 서비스 이용 지연이나 권한 불이익에 대해 서비스 제공자는 어떠한 보상 책임도 지지 않습니다.
            </p>
          </div>
        </section>

        {/* 제12조 */}
        <section id="art-12" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제12조 (개인정보의 안전성 확보 조치 및 기술적 한계에 대한 면책)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              서비스는 「개인정보 보호법」 제29조에 따라 다음과 같은 기술적·관리적 및 물리적 조치를 적용하고 있습니다.
            </p>
            <p>1. <strong>관리적 조치:</strong> 개인정보 접근 권한의 최소화, 권한 오남용 방지, 내부 관리 계획의 수립 및 실행</p>
            <p>2. <strong>기술적 조치:</strong></p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>가. 비밀번호 미수집 및 세션 기반 인증:</strong> 비밀번호 유출 위험을 원천 차단하며, 세션 토큰 저장을 통한 인증 상태 유지</li>
              <li><strong>나. 통신 구간 암호화:</strong> SSL/TLS 프로토콜 기반의 암호화 통신(<code className="font-mono">HTTPS</code>, <code className="font-mono">WSS</code>)을 통한 송수신 데이터 보호</li>
              <li><strong>다. 데이터베이스 보안 정책:</strong> 특정 감사 로그 데이터의 미삭제 정책(RLS) 및 접근 제어</li>
            </ul>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs">
              <strong>3. 기술적 한계에 대한 면책:</strong> 서비스 제공자가 상기 기술적 안전성 확보 조치를 성실히 이행하였음에도 불구하고, 사용자의 단말기 관리 소홀, 세션 토큰 유출, 타인에 의한 학번 무단 도용, 웹브라우저 허점, 디바이스 해킹, 해커의 고도화된 침입 행위 등 서비스 제공자의 귀책사유가 없는 원인으로 발생한 개인정보 유출 및 손해에 대하여 서비스 제공자는 책임을 지지 않습니다.
            </div>
          </div>
        </section>

        {/* 제13조 */}
        <section id="art-13" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제13조 (감사 로그, 접속 기록 보관 및 위·변조 방지)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 서비스는 시스템 조작 방지, 경기 결과의 투명성 확보 및 보안 사고 대응을 위하여 다음 각 호의 행위 발생 시 감사 로그(Audit Log)를 자동으로 생성하여 저장합니다.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li>가. 지정된 경기 담당자가 아닌 타 권한자에 의한 점수 입력, 수정 및 취소 행위</li>
              <li>나. 관리자에 의한 경기 일정, 장소, 브라켓 및 대진표 변경 행위</li>
              <li>다. 관리자에 의한 권한(반장, 학생회, 보건 담당, 해설위원)의 부여 및 회수 행위</li>
            </ul>
            <p>
              2. <strong>감사 로그의 삭제 절대 불가 원칙:</strong> 감사 로그는 시스템의 신뢰성을 증명하기 위한 데이터이므로, 최상위 관리자를 포함한 그 어떠한 계정으로도 <strong>수정하거나 삭제할 수 없습니다.</strong>
            </p>
            <p>
              3. 감사 로그는 표(Table) 형태로 열람될 수 있으며, 행사의 공정성 검증 목적 외에는 사용되지 않습니다.
            </p>
          </div>
        </section>

        {/* 제14조 */}
        <section id="art-14" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제14조 (자동 수집 장치 운영, 로컬 저장소 활용 및 쿠키 관련 방침)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>1. 서비스는 사용자의 개별적인 쿠키(Cookie) 정보를 생성하거나 추적 목적의 트래커를 설치·운영하지 않습니다.</p>
            <p>2. 서비스는 사용자 단말기의 로컬 저장소(Local Storage)를 활용합니다.</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>저장 항목:</strong> 발급된 세션 토큰 문자열, 개인별 알림 설정값</li>
              <li><strong>저장 목적:</strong> 자동 로그인 유지, 실시간 웹소켓 인증 및 사용자 편의성 제공</li>
            </ul>
            <p>
              3. 사용자는 웹브라우저 또는 앱 설정을 통해 저장소 데이터를 삭제할 수 있습니다. 단, 로컬 저장소 데이터를 삭제할 경우 서비스 세션이 종료되어 자동 로그인이 해제될 수 있으며, 이로 인한 가입 재확인 절차 등의 불편에 대해 서비스 제공자는 책임지지 않습니다.
            </p>
          </div>
        </section>

        {/* 제15조 */}
        <section id="art-15" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제15조 (손해배상, 책임 제한 및 종합 면책 조항)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. <strong>무료 서비스에 대한 책임 제한:</strong> 본 서비스는 학생 및 교원을 대상으로 제공되는 무상 서비스로서, 관련 법령에 특별한 규정이 없는 한 서비스 이용과 관련하여 발생한 어떠한 손해에 대해서도 손해배상 책임을 지지 않습니다.
            </p>
            <p>
              2. <strong>서비스 불가항력 면책:</strong> 천재지변, 통신 사업자의 회선 장애, 클라우드 인프라(Oracle Cloud, Supabase, Vercel 등)의 중단, 학내 와이파이/통신망 접속 불량, 서버 과부하, 디바이스 오류 등으로 인하여 서비스가 일시 중단되거나 데이터가 전송되지 못한 경우 서비스 제공자는 면책됩니다.
            </p>
            <p>
              3. <strong>사용자 간 분쟁 면책:</strong> 서비스 내 쪽지 기능, 건의함, 공지사항, 응원하기 기능 등을 통해 사용자 간 발생한 언어폭력, 명예훼손, 분쟁, 손해 등에 대하여 서비스 제공자는 개입할 의무가 없으며 이에 대한 어떠한 책임도 지지 않습니다.
            </p>
            <p>
              4. <strong>계정 도용 및 타인 행세 면책:</strong> 사용자가 본인의 학번 및 인적 정보를 타인에게 유출하여 타인이 무단으로 가입하거나 세션을 취득함으로써 발생한 손해에 대해 서비스 제공자는 책임을 지지 않습니다.
            </p>
            <p>
              5. <strong>하단 푸터 표기 명의와 실제 제작 주체에 관한 면책:</strong> 서비스 하단 화면에 표기된 <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">made by SMARTLAB</code> 문구는 개발팀의 명의상의 표기일 뿐이며, 특정 개인은 실제 앱 개발 및 개인정보 처리, 데이터 관리의 법적 주체가 아닙니다. 사용자는 이와 관련하여 표기된 특정 인물에게 어떠한 법적, 행정적 책임이나 손해배상을 청구할 수 없습니다.
            </p>
          </div>
        </section>

        {/* 제16조 */}
        <section id="art-16" className="scroll-mt-32 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제16조 (개인정보 보호책임자, 담당 부서 및 분쟁 해결)
          </h2>
          <div className="space-y-3 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-900 dark:text-white">개인정보 보호 총괄 책임자</span>
                <span className="text-slate-600 dark:text-slate-300">상산고등학교 체육대회/축제 관리자 (총괄본부)</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-900 dark:text-white">시스템 기획 및 데이터 관리</span>
                <span className="text-slate-600 dark:text-slate-300">서비스 기획자 본인</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-900 dark:text-white">시스템 푸터 표기 명의</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">made by SMARTLAB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">학내 문의 및 민원 창구</span>
                <span className="text-red-600 dark:text-emerald-400 font-bold">서비스 내 ‘건의함’ 메뉴 (실명 작성)</span>
              </div>
            </div>

            <p className="pt-2 font-bold text-slate-900 dark:text-white">
              2. 개인정보침해 관련 공공 구제 및 상담 기관 안내
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">개인정보분쟁조정위원회</div>
                  <div className="text-[11px] text-slate-400">www.kopico.go.kr</div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">(국번없이) 1833-6972</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">개인정보침해신고센터</div>
                  <div className="text-[11px] text-slate-400">privacy.kisa.or.kr</div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">(국번없이) 118</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">대검찰청 사이버범죄수사단</div>
                  <div className="text-[11px] text-slate-400">www.spo.go.kr</div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">(국번없이) 1301</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">경찰청 사이버수사국</div>
                  <div className="text-[11px] text-slate-400">ecrm.police.go.kr</div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">(국번없이) 182</span>
              </div>
            </div>
          </div>
        </section>

        {/* 제17조 */}
        <section id="art-17" className="scroll-mt-32 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            제17조 (개인정보 처리방침의 개정, 고지 및 해석)
          </h2>
          <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
            <p>
              1. 본 개인정보 처리방침은 시행일로부터 적용되며, 법령, 보안 기술, 서비스 시스템 기능의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 시에는 개정 최소 3일 전부터 서비스 내 공지사항 및 접속 팝업창을 통하여 고지합니다.
            </p>
            <p>
              2. 본 방침에 명시되지 않은 사항은 관련 법령 및 학내 규정에 따르며, 해석상 이견이 있는 경우 서비스 제공자의 해석에 따릅니다.
            </p>
            <div className="pt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                공고 일자: 2026년 9월 14일
              </span>
              <span className="px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold">
                시행 일자: 2026년 9월 14일
              </span>
            </div>
          </div>
        </section>

        {/* Bottom Guarantee Banner */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <img 
              src="/images/sangsan_logo.png" 
              alt="상산고등학교" 
              className="w-5 h-5 object-contain"
            />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              상산고등학교 체육대회·축제 관리 시스템 THE SANGSAN
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            개인정보보호법 및 학내 보안 지침 준수
          </div>
        </div>

      </div>
    </div>
  );
};
