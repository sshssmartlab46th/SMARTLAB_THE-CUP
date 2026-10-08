import React from 'react';
import { ShieldAlert, LogIn } from 'lucide-react';
import { FestivalConfig } from '../../types';
import { MainNavTab, Footer } from '../../components';

interface AppEmergencyLockoutProps {
  festivalConfig: FestivalConfig;
  onNavigateToLogin: () => void;
}

export const AppEmergencyLockout: React.FC<AppEmergencyLockoutProps> = ({
  festivalConfig,
  onNavigateToLogin
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md p-8 rounded-2xl border border-red-800 bg-red-950/40 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
        <h1 className="text-xl font-black tracking-tight text-red-200">
          {festivalConfig.name || '상산고등학교 체육대회'} 시스템 비상 잠금
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          {festivalConfig.description || '총괄 관리자에 의해 시스템이 일시적으로 잠겼습니다. 안전 점검 또는 대회 점검 중입니다.'}
        </p>
        <div className="pt-4 border-t border-red-900/60 flex justify-center">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>관리자 계정으로 로그인</span>
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};
