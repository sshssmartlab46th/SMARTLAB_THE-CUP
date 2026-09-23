import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Zap,
  RefreshCw,
  MapPin,
  Compass,
  Wind,
  Droplets,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Sunrise,
  Sunset,
  Eye,
  Calendar,
  Clock,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react';
import { WeatherInfo } from '../../types';

export interface WeatherDetailPageProps {
  weather: WeatherInfo | null;
  refreshing: boolean;
  onRefresh: () => void;
  onBack: () => void;
}

export const WeatherDetailPage: React.FC<WeatherDetailPageProps> = ({
  weather,
  refreshing,
  onRefresh,
  onBack
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'forecast' | 'sports'>('forecast');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentCardRef = useRef<HTMLDivElement>(null);

  // Scroll to current hour card centering logic
  const scrollToCurrentHour = useCallback((smooth: boolean = true) => {
    const container = scrollContainerRef.current;
    const currentCard = currentCardRef.current;
    if (!container || !currentCard) return;

    const containerWidth = container.clientWidth;
    const cardOffsetLeft = currentCard.offsetLeft;
    const cardWidth = currentCard.offsetWidth;

    // Calculate position so the card is right in the center of the scroll container
    // If it's near edges, Math.max(0, target) & scrollWidth clamp handle it naturally
    const targetScrollLeft = cardOffsetLeft - (containerWidth / 2) + (cardWidth / 2);

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Auto-scroll to center the current hour when entering or when forecast data arrives
  useEffect(() => {
    if (!weather?.hourlyForecast || weather.hourlyForecast.length === 0) return;

    // A small delay ensures the DOM layout and card dimensions are computed
    const timer = setTimeout(() => {
      scrollToCurrentHour(true);
    }, 120);

    return () => clearTimeout(timer);
  }, [weather?.hourlyForecast, scrollToCurrentHour]);

  const scrollByAmount = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Helper for weather icons
  const getWeatherIcon = (code: number = 0, isDay: boolean = true, className = 'w-7 h-7') => {
    switch (code) {
      case 0:
        return isDay ? <Sun className={`${className} text-amber-500`} /> : <Moon className={`${className} text-indigo-400`} />;
      case 1:
        return isDay ? <Sun className={`${className} text-amber-500`} /> : <Moon className={`${className} text-indigo-400`} />;
      case 2:
        return <CloudSun className={`${className} text-amber-400`} />;
      case 3:
        return <Cloud className={`${className} text-slate-400`} />;
      case 45:
      case 48:
        return <CloudFog className={`${className} text-slate-400`} />;
      case 51:
      case 53:
      case 55:
        return <CloudDrizzle className={`${className} text-blue-400`} />;
      case 61:
      case 63:
      case 65:
        return <CloudRain className={`${className} text-blue-500`} />;
      case 71:
      case 73:
      case 75:
      case 77:
      case 85:
      case 86:
        return <CloudSnow className={`${className} text-cyan-400`} />;
      case 80:
      case 81:
      case 82:
        return <CloudLightning className={`${className} text-blue-600`} />;
      case 95:
      case 96:
      case 99:
        return <Zap className={`${className} text-amber-500`} />;
      default:
        return <Cloud className={`${className} text-slate-400`} />;
    }
  };

  // Cardinal direction from degrees
  const getWindDirectionLabel = (deg: number = 0) => {
    const directions = ['북풍 (N)', '북동풍 (NE)', '동풍 (E)', '남동풍 (SE)', '남풍 (S)', '남서풍 (SW)', '서풍 (W)', '북서풍 (NW)'];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return directions[index] || '변풍';
  };

  const isRainAlert = (weather?.rainProb ?? 0) >= 60 || (weather?.weatherCode ?? 0) >= 51;
  const isHeatAlert = (weather?.temp ?? 22) >= 32;
  const isWindAlert = (weather?.windSpeed ?? 8) >= 25;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>뒤로가기</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                상산고 기상 예보 & 날씨 센터
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                실시간 관측
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-emerald-400" />
              <span>전북 전주시 완산구 거마평로 130 상산고등학교 (35.8034°N, 127.1183°E)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="text-right hidden sm:block text-[11px] text-slate-400 font-mono">
            {weather?.lastUpdated ? `${weather.lastUpdated} 기준` : '실시간'}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>날씨 새로고침</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveViewTab('forecast')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeViewTab === 'forecast'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>실시간 & 예보 (시간별/주간)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('sports')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeViewTab === 'sports'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>종목별 경기장 적합도</span>
        </button>
      </div>

      {/* VIEW TAB 1: FORECAST */}
      {activeViewTab === 'forecast' && (
        <div className="space-y-6">
          {/* Main Weather Hero Card */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/70 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60">
                  {getWeatherIcon(weather?.weatherCode ?? 0, weather?.isDay ?? true, 'w-14 h-14 sm:w-16 sm:h-16')}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                      {weather?.temp ?? 22}°C
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">
                      {weather?.condition ?? '맑음'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    체감 온도 <strong>{weather?.apparentTemp ?? 22}°C</strong> · {weather?.isDay ? '주간' : '야간'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5" />
                      강수확률 {weather?.rainProb ?? 10}%
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5" />
                      풍속 {weather?.windSpeed ?? 8} km/h
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5" />
                      자외선 {weather?.uvIndex || '보통'} ({weather?.uvIndexValue ?? 4.2})
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Alert / Recommendation Card */}
              <div className="p-4 rounded-2xl border max-w-md bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  {isRainAlert ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  )}
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    체육대회 야외 진행 진단
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {weather?.statusText || '대운동장 및 농구장 야외 종목 진행에 완벽한 최적의 날씨입니다.'}
                </p>
                <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                  <span>일출 {weather?.sunrise || '06:15'}</span>
                  <span>일몰 {weather?.sunset || '18:45'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Meteorological Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Thermometer className="w-3.5 h-3.5 text-red-500" />
                <span>체감 온도</span>
              </div>
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                {weather?.apparentTemp ?? 22}°C
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">실제 기온과 유사</div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>상대 습도</span>
              </div>
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                {weather?.humidity ?? 55}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">쾌적 수준</div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Wind className="w-3.5 h-3.5 text-emerald-500" />
                <span>풍속</span>
              </div>
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                {weather?.windSpeed ?? 8} km/h
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">약한 바람</div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                <span>풍향</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white truncate">
                {getWindDirectionLabel(weather?.windDirection)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{weather?.windDirection ?? 180}°</div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>자외선 지수</span>
              </div>
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                {weather?.uvIndexValue ?? 4.2}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{weather?.uvIndex || '보통'} 등급</div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Sunrise className="w-3.5 h-3.5 text-orange-500" />
                <span>일출 / 일몰</span>
              </div>
              <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-1">
                {weather?.sunrise || '06:15'} / {weather?.sunset || '18:45'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">주간 활동 적정</div>
            </div>
          </div>

          {/* 24-Hour Hourly Forecast Section (0h ~ 24h) */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    시간대별 24시간 상세 예보 (0시 ~ 24시)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    당일 24개 시간대
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  현재 시각이 중앙에 위치하며, 좌우로 스크롤하여 하루 전체 날씨 변화를 확인할 수 있습니다.
                </p>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => scrollByAmount(-220)}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="이전 시간대 보기"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByAmount(220)}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="다음 시간대 보기"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Hourly Container */}
            <div
              ref={scrollContainerRef}
              className="flex items-stretch gap-3 overflow-x-auto pb-4 pt-2 scrollbar-thin scroll-smooth"
            >
              {(weather?.hourlyForecast || []).map((hf, idx) => {
                const isCurrent = Boolean(hf.isCurrentHour);
                const isPast = Boolean(hf.isPast);

                return (
                  <div
                    key={hf.hourNum ?? idx}
                    ref={isCurrent ? currentCardRef : null}
                    className={`flex-shrink-0 w-28 p-3 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'border-2 border-red-600 dark:border-red-500 bg-red-50/90 dark:bg-red-950/40 shadow-md ring-4 ring-red-500/20 transform -translate-y-0.5'
                        : isPast
                        ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30 opacity-70 hover:opacity-100'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      {/* Top Time & Status Badge */}
                      <div className="flex items-center justify-center gap-1 mb-1.5">
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse shadow-2xs">
                            ● 지금
                          </span>
                        ) : isPast ? (
                          <span className="text-[10px] text-slate-400 font-medium">
                            지남
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            예정
                          </span>
                        )}
                      </div>

                      <div className={`text-xs font-bold ${
                        isCurrent ? 'text-red-700 dark:text-red-300 font-black' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {hf.hourLabel}
                      </div>

                      {/* Weather Condition Icon */}
                      <div className="my-2 flex justify-center">
                        {getWeatherIcon(hf.weatherCode, hf.isDay, isCurrent ? 'w-7 h-7' : 'w-6 h-6')}
                      </div>

                      {/* Temperature */}
                      <div className={`text-lg font-black font-mono ${
                        isCurrent ? 'text-red-700 dark:text-red-200' : 'text-slate-900 dark:text-white'
                      }`}>
                        {hf.temp}°C
                      </div>

                      {/* Condition Text */}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                        {hf.condition}
                      </div>
                    </div>

                    {/* Bottom Rain Prob */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      <Droplets className="w-3 h-3" />
                      <span>{hf.rainProb}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-Day Weekly Forecast Section */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                주간 7일 날씨 예보 (상산고 기상대)
              </h3>
            </div>

            <div className="space-y-2">
              {(weather?.dailyForecast || []).map((df, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center gap-3 w-32">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {df.dayName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {df.date.slice(5)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-36">
                    {getWeatherIcon(df.weatherCode, true, 'w-5 h-5')}
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {df.condition}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 w-24 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{df.rainProbMax}%</span>
                    {df.precipSum > 0 && (
                      <span className="text-[10px] text-slate-400">({df.precipSum}mm)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-slate-400">{df.tempMin}°</span>
                    <div className="w-20 sm:w-28 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-amber-500"
                        style={{
                          width: `${Math.min(100, Math.max(20, (df.tempMax - df.tempMin) * 8))}%`
                        }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{df.tempMax}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: SPORTS SUITABILITY */}
      {activeViewTab === 'sports' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              <strong>경기 운영 수칙:</strong> 강수량이 시간당 2mm를 초과하거나 강수 확률이 70% 이상일 경우 총괄본부 통제 하에 실내 체육관(본관 체육관 A/B)으로 즉시 전환됩니다.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">⚽ 축구 (대운동장 잔디구장)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  정상 진행 권장
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                현재 지면 상태 양호. 축구화 스터드 마모도를 점검하고 안전 신가드를 필히 착용하십시오. 비 예보 시 미끄럼 방지 테이핑 권장.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">🏀 농구 (야외 농구장)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  정상 진행 권장
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                우레탄 바닥 건조 상태 유지 중. 풍속 8km/h로 슛 궤적 영향 미미. 우천 시 즉각 본관 체육관 B코트로 변경됩니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">🏃‍♂️ 계주 (대운동장 트랙)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  트랙 컨디션 최상
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                코너 구간 수막 현상 없음. 바톤 터치 존 라인 시인성 양호.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">🤾‍♀️ 피구 & 줄다리기 (운동장 메인)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  접지력 충분
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                지면 접지력 확보 상태. 선수들은 목장갑 및 규정 운동화를 착용하십시오.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
