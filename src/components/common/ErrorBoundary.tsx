import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToHome = () => {
    try {
      // Clear any corrupted transient route state if needed
      window.location.href = '/';
    } catch {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  private handleResetLocalState = () => {
    try {
      localStorage.removeItem('sangsan_current_user');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || '알 수 없는 런타임 오류가 발생했습니다.';

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-9 h-9 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                일시적인 오류가 발생했습니다
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                화면을 렌더링하는 중 예기치 않은 오류가 감지되었습니다.<br />
                새로고침을 하거나 홈으로 이동하여 다시 시도해 주세요.
              </p>
            </div>

            {/* Error Detail Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>오류 내용</span>
              </div>
              <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all line-clamp-3">
                {errorMessage}
              </p>
            </div>

            {/* Recovery Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>페이지 새로고침</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={this.handleResetToHome}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>홈으로 이동</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleResetLocalState}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>로그인 초기화</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-600 pt-1">
              THE SANGSAN • 상산고등학교 체육대회 및 축제
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
