import React from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  Droplets, 
  Wind, 
  Thermometer, 
  RefreshCw, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useOpenMeteoWeather } from '../../hooks/useOpenMeteoWeather';

interface WeatherWidgetProps {
  variant?: 'compact' | 'card' | 'banner';
  className?: string;
  onOpenDetails?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  variant = 'card',
  className = '',
  onOpenDetails
}) => {
  const { weather, loading, refreshing, refetch } = useOpenMeteoWeather({
    refreshIntervalMs: 60000 // Automatically refreshes every 1 minute from Open-Meteo
  });

  const getWeatherIcon = () => {
    if (!weather) return <Sun className="w-5 h-5 text-amber-500" />;
    const code = weather.weatherCode ?? 0;
    if (code === 0 || code === 1) return <Sun className="w-5 h-5 text-amber-500" />;
    if (code === 2) return <CloudSun className="w-5 h-5 text-amber-400" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-500" />;
    return <Cloud className="w-5 h-5 text-slate-400" />;
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 ${className}`}>
        <button
          type="button"
          onClick={onOpenDetails}
          className="flex items-center gap-1 hover:opacity-80 transition cursor-pointer text-left"
          title="날씨 상세 예보 열기"
        >
          {getWeatherIcon()}
          <span className="font-bold">{weather?.temp ?? 22}°C</span>
          <span className="text-slate-500 dark:text-slate-400">{weather?.condition ?? '맑음'}</span>
        </button>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Droplets className="w-3.5 h-3.5 text-blue-500" />
          <span>강수 {weather?.rainProb ?? 10}%</span>
        </span>
        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
          >
            자세히
          </button>
        )}
        <button
          type="button"
          onClick={() => refetch()}
          disabled={refreshing}
          title="날씨 즉시 새로고침"
          className="p-1 hover:text-red-600 dark:hover:text-emerald-400 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-red-600 dark:text-emerald-400' : ''}`} />
        </button>
      </div>
    );
  }

  if (variant === 'banner') {
    const isAlert = (weather?.rainProb ?? 0) >= 60 || (weather?.temp ?? 0) >= 33;
    return (
      <div className={`p-4 rounded-2xl border ${
        isAlert 
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200' 
          : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200'
      } shadow-xs ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-xs shrink-0">
              {getWeatherIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  상산고 실시간 기상 현황
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/70 dark:bg-slate-800/80">
                  {weather?.lastUpdated ? `${weather.lastUpdated} 관측` : '실시간'}
                </span>
              </div>
              <p className="text-xs mt-0.5 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                {isAlert ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                <span>{weather?.statusText || '야외 체육활동 및 경기 진행에 적합한 날씨입니다.'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-semibold self-end sm:self-center">
            <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
              <Thermometer className="w-3.5 h-3.5 text-red-500" />
              {weather?.temp ?? 22}°C (체감 {weather?.apparentTemp ?? 22}°C)
            </span>
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Droplets className="w-3.5 h-3.5" />
              강수 {weather?.rainProb ?? 10}%
            </span>
            {onOpenDetails && (
              <button
                type="button"
                onClick={onOpenDetails}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-sans text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer shadow-xs"
              >
                <span>상세 예보 보기</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={refreshing}
              className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="실시간 기상 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121826] shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            상산고 운동장 실시간 기상
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenDetails && (
            <button
              type="button"
              onClick={onOpenDetails}
              className="text-[11px] font-bold text-red-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>자세히</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={refreshing}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
            title="날씨 실시간 새로고침"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-red-600 dark:text-emerald-400' : ''}`} />
            <span>{weather?.lastUpdated || '방금'}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
            {getWeatherIcon()}
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {weather?.temp ?? 22}°C
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {weather?.condition ?? '맑음'} · 체감 {weather?.apparentTemp ?? 22}°C
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-right text-[11px] font-mono">
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-transparent dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-300 text-[10px] block">강수확률</span>
            <span className="font-bold text-blue-600 dark:text-sky-400">{weather?.rainProb ?? 10}%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-transparent dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-300 text-[10px] block">습도</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{weather?.humidity ?? 55}%</span>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-transparent dark:border-slate-700/50 text-[11px] text-slate-700 dark:text-slate-200 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
          <span>{weather?.statusText || '야외 경기 진행 최적 상태입니다.'}</span>
        </div>
      </div>

      {onOpenDetails && (
        <button
          type="button"
          onClick={onOpenDetails}
          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs border border-transparent dark:border-slate-700/60"
        >
          <span>시간대별 예보 및 기상 센터 열기</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

