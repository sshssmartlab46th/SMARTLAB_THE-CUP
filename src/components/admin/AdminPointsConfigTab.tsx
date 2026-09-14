import React, { useState, useEffect } from 'react';
import { SportPointsConfig, SportType } from '../../types';
import { listenPointsConfig, savePointsConfig } from '../../services/firebaseService';
import { Trophy, Award, Medal, Check, Save, RefreshCw } from 'lucide-react';

interface AdminPointsConfigTabProps {
  onNotice: (msg: string) => void;
}

const DEFAULT_SPORT_POINTS: SportPointsConfig[] = [
  {
    sport: 'soccer',
    label: '축구 (남자 8강)',
    gender: 'male',
    champion: 500,
    runnerUp: 300,
    thirdPlace: 200,
    winPerMatch: 100,
    drawPerMatch: 50,
    participation: 50
  },
  {
    sport: 'basketball',
    label: '농구 (남자 8강)',
    gender: 'male',
    champion: 400,
    runnerUp: 250,
    thirdPlace: 150,
    winPerMatch: 80,
    drawPerMatch: 40,
    participation: 50
  },
  {
    sport: 'dodgeball',
    label: '피구 (여자 4강)',
    gender: 'female',
    champion: 350,
    runnerUp: 200,
    thirdPlace: 120,
    winPerMatch: 70,
    drawPerMatch: 35,
    participation: 50
  },
  {
    sport: 'relay_male',
    label: '남자 계주 릴레이',
    gender: 'male',
    champion: 600,
    runnerUp: 400,
    thirdPlace: 250,
    winPerMatch: 0,
    drawPerMatch: 0,
    participation: 100
  },
  {
    sport: 'relay_female',
    label: '여자 계주 릴레이',
    gender: 'female',
    champion: 450,
    runnerUp: 300,
    thirdPlace: 180,
    winPerMatch: 0,
    drawPerMatch: 0,
    participation: 100
  },
  {
    sport: 'tug_of_war',
    label: '줄다리기',
    gender: 'mixed',
    champion: 300,
    runnerUp: 180,
    thirdPlace: 100,
    winPerMatch: 60,
    drawPerMatch: 30,
    participation: 50
  },
  {
    sport: 'group_rope',
    label: '단체 줄넘기',
    gender: 'mixed',
    champion: 300,
    runnerUp: 180,
    thirdPlace: 100,
    winPerMatch: 60,
    drawPerMatch: 30,
    participation: 50
  }
];

export const AdminPointsConfigTab: React.FC<AdminPointsConfigTabProps> = ({
  onNotice
}) => {
  const [configs, setConfigs] = useState<SportPointsConfig[]>(() => {
    try {
      const saved = localStorage.getItem('sangsan_sport_points_config');
      return saved ? JSON.parse(saved) : DEFAULT_SPORT_POINTS;
    } catch {
      return DEFAULT_SPORT_POINTS;
    }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync real-time points config from Firestore
  useEffect(() => {
    const unsub = listenPointsConfig((cloudConfigs) => {
      if (cloudConfigs && cloudConfigs.length > 0) {
        setConfigs(cloudConfigs as SportPointsConfig[]);
        try {
          localStorage.setItem('sangsan_sport_points_config', JSON.stringify(cloudConfigs));
        } catch {
          // ignore local cache error
        }
      }
    });
    return () => unsub();
  }, []);

  const handleValueChange = (sport: SportType, field: keyof SportPointsConfig, val: number) => {
    setConfigs(prev => prev.map(c => {
      if (c.sport === sport) {
        return { ...c, [field]: isNaN(val) ? 0 : val };
      }
      return c;
    }));
  };

  const handleSaveConfigs = async () => {
    setIsSyncing(true);
    try {
      localStorage.setItem('sangsan_sport_points_config', JSON.stringify(configs));
      await savePointsConfig(configs);
      setSavedSuccess(true);
      onNotice('종목별 배점 기준이 Firestore 클라우드에 성공적으로 동기화되었습니다. 전교 학급 종합 순위에 즉시 반영됩니다.');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      onNotice('배점 설정 로컬 저장 완료 (클라우드 오프라인)');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('기본 배점 설정으로 초기화하시겠습니까?')) {
      setConfigs(DEFAULT_SPORT_POINTS);
      try {
        localStorage.setItem('sangsan_sport_points_config', JSON.stringify(DEFAULT_SPORT_POINTS));
        await savePointsConfig(DEFAULT_SPORT_POINTS);
      } catch (err) {
        console.warn(err);
      }
      onNotice('배점 설정이 기본값으로 초기화되었습니다.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            종목별 종합 점수(배점) 설정
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            우승, 준우승, 3위 및 승리 점수를 종목 특성에 맞추어 다르게 설정할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            기본값 복원
          </button>
          <button
            type="button"
            onClick={handleSaveConfigs}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savedSuccess ? '저장 완료!' : '배점 설정 저장'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Sport Config Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((cfg) => (
          <div 
            key={cfg.sport}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {cfg.label}
                </h4>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  cfg.gender === 'male' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                  cfg.gender === 'female' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {cfg.gender === 'male' ? '남자부' : cfg.gender === 'female' ? '여자부' : '혼성/공통'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {/* Champion points */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" /> 우승 (1위)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={cfg.champion}
                    onChange={(e) => handleValueChange(cfg.sport, 'champion', parseInt(e.target.value, 10))}
                    className="w-20 p-1.5 text-right font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400">점</span>
                </div>
              </div>

              {/* Runner-up points */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5 text-slate-400" /> 준우승 (2위)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={cfg.runnerUp}
                    onChange={(e) => handleValueChange(cfg.sport, 'runnerUp', parseInt(e.target.value, 10))}
                    className="w-20 p-1.5 text-right font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400">점</span>
                </div>
              </div>

              {/* Third place */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-amber-700 dark:text-amber-600 flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5 text-amber-600" /> 3위
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={cfg.thirdPlace}
                    onChange={(e) => handleValueChange(cfg.sport, 'thirdPlace', parseInt(e.target.value, 10))}
                    className="w-20 p-1.5 text-right font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400">점</span>
                </div>
              </div>

              {/* Match Win */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">경기 승리 점수</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={cfg.winPerMatch}
                    onChange={(e) => handleValueChange(cfg.sport, 'winPerMatch', parseInt(e.target.value, 10))}
                    className="w-20 p-1.5 text-right font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400">점</span>
                </div>
              </div>

              {/* Participation */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400">참가 기본 점수</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={cfg.participation}
                    onChange={(e) => handleValueChange(cfg.sport, 'participation', parseInt(e.target.value, 10))}
                    className="w-20 p-1.5 text-right font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400">점</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
