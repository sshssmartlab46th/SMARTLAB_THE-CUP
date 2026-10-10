import { MatchItem, ClassStandingItem, SportPointsConfig } from '../types';

export interface ExtendedClassStandingItem extends ClassStandingItem {
  classId: string;
  className: string;
  totalPoints: number;
  wins: number;
  draws: number;
  losses: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  awardTitle?: string;
}

export const DEFAULT_SPORT_POINTS_MAP: Record<string, { champion: number; runnerUp: number; thirdPlace: number; winPerMatch: number; drawPerMatch: number; participation: number }> = {
  soccer: { champion: 500, runnerUp: 300, thirdPlace: 150, winPerMatch: 100, drawPerMatch: 50, participation: 50 },
  basketball: { champion: 500, runnerUp: 300, thirdPlace: 150, winPerMatch: 100, drawPerMatch: 50, participation: 50 },
  dodgeball: { champion: 400, runnerUp: 250, thirdPlace: 120, winPerMatch: 80, drawPerMatch: 40, participation: 40 },
  relay_male: { champion: 600, runnerUp: 400, thirdPlace: 200, winPerMatch: 150, drawPerMatch: 0, participation: 50 },
  relay_female: { champion: 600, runnerUp: 400, thirdPlace: 200, winPerMatch: 150, drawPerMatch: 0, participation: 50 },
  tug_of_war: { champion: 400, runnerUp: 250, thirdPlace: 120, winPerMatch: 80, drawPerMatch: 40, participation: 40 }
};

/**
 * Calculates overall class standings automatically from matches and sport point configurations.
 * Handles 36 classes (3 grades x 12 classes).
 */
export function calculateClassStandings(
  matches: MatchItem[],
  customPointsConfigMap?: Record<string, SportPointsConfig>
): ExtendedClassStandingItem[] {
  const classMap: Record<string, { totalPoints: number; wins: number; draws: number; losses: number; gold: number; silver: number; bronze: number }> = {};

  // Initialize 36 classes (Grades 1~3, Classes 1~12)
  for (let g = 1; g <= 3; g++) {
    for (let c = 1; c <= 12; c++) {
      const classCode = `${g}${String(c).padStart(2, '0')}`;
      classMap[classCode] = { totalPoints: 0, wins: 0, draws: 0, losses: 0, gold: 0, silver: 0, bronze: 0 };
    }
  }

  // Load points config from localStorage if custom map is not directly passed
  let pointsConfigMap: Record<string, any> = { ...DEFAULT_SPORT_POINTS_MAP };
  if (customPointsConfigMap) {
    pointsConfigMap = { ...pointsConfigMap, ...customPointsConfigMap };
  } else {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedConfig = localStorage.getItem('sangsan_sport_points_config');
        if (savedConfig) {
          const parsedList = JSON.parse(savedConfig);
          parsedList.forEach((cfg: any) => {
            if (cfg && cfg.sport) {
              pointsConfigMap[cfg.sport] = cfg;
            }
          });
        }
      }
    } catch {
      // Fallback to defaults
    }
  }

  matches.forEach((m) => {
    const sportCfg = pointsConfigMap[m.sport] || DEFAULT_SPORT_POINTS_MAP[m.sport] || {
      champion: 500,
      runnerUp: 300,
      thirdPlace: 150,
      winPerMatch: 100,
      drawPerMatch: 50,
      participation: 50
    };

    // Award participation points
    if (m.homeClass && classMap[m.homeClass]) {
      classMap[m.homeClass].totalPoints += sportCfg.participation || 0;
    }
    if (m.awayClass && classMap[m.awayClass]) {
      classMap[m.awayClass].totalPoints += sportCfg.participation || 0;
    }

    if (m.status === 'FINISHED') {
      const isFinal =
        m.tournamentSlot === 'FINAL' ||
        ((m.round?.includes('결승') || m.title?.includes('결승')) &&
          !m.round?.includes('준결승') &&
          !m.title?.includes('준결승'));

      const isBronze =
        m.tournamentSlot === 'BRONZE' ||
        m.round?.includes('3,4위') ||
        m.round?.includes('3위') ||
        m.title?.includes('3,4위') ||
        m.title?.includes('3위');

      if (m.homeScore > m.awayScore) {
        if (m.homeClass && classMap[m.homeClass]) {
          classMap[m.homeClass].wins += 1;
          if (isFinal) {
            classMap[m.homeClass].totalPoints += sportCfg.champion;
            classMap[m.homeClass].gold += 1;
          } else if (isBronze) {
            classMap[m.homeClass].totalPoints += sportCfg.thirdPlace || 150;
            classMap[m.homeClass].bronze += 1;
          } else {
            classMap[m.homeClass].totalPoints += sportCfg.winPerMatch;
          }
        }
        if (m.awayClass && classMap[m.awayClass]) {
          classMap[m.awayClass].losses += 1;
          if (isFinal) {
            classMap[m.awayClass].totalPoints += sportCfg.runnerUp;
            classMap[m.awayClass].silver += 1;
          }
        }
      } else if (m.awayScore > m.homeScore) {
        if (m.awayClass && classMap[m.awayClass]) {
          classMap[m.awayClass].wins += 1;
          if (isFinal) {
            classMap[m.awayClass].totalPoints += sportCfg.champion;
            classMap[m.awayClass].gold += 1;
          } else if (isBronze) {
            classMap[m.awayClass].totalPoints += sportCfg.thirdPlace || 150;
            classMap[m.awayClass].bronze += 1;
          } else {
            classMap[m.awayClass].totalPoints += sportCfg.winPerMatch;
          }
        }
        if (m.homeClass && classMap[m.homeClass]) {
          classMap[m.homeClass].losses += 1;
          if (isFinal) {
            classMap[m.homeClass].totalPoints += sportCfg.runnerUp;
            classMap[m.homeClass].silver += 1;
          }
        }
      } else {
        if (m.homeClass && classMap[m.homeClass]) {
          classMap[m.homeClass].draws += 1;
          classMap[m.homeClass].totalPoints += sportCfg.drawPerMatch;
        }
        if (m.awayClass && classMap[m.awayClass]) {
          classMap[m.awayClass].draws += 1;
          classMap[m.awayClass].totalPoints += sportCfg.drawPerMatch;
        }
      }
    }
  });

  const items: ExtendedClassStandingItem[] = Object.entries(classMap).map(([cId, stats]) => {
    const grade = cId.charAt(0);
    const classNum = cId.slice(1);
    const parsedNum = parseInt(classNum, 10);
    return {
      id: cId,
      classId: cId,
      className: `${grade}-${parsedNum}반`,
      classLabel: `${grade}-${parsedNum}반`,
      grade,
      classNum: String(parsedNum),
      rank: 1,
      points: stats.totalPoints,
      totalPoints: stats.totalPoints,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
      goldCount: stats.gold,
      silverCount: stats.silver,
      bronzeCount: stats.bronze
    };
  });

  // Sort with tie-breakers: Points -> Gold -> Silver -> Bronze -> Wins -> ClassId
  items.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
    if (b.silverCount !== a.silverCount) return b.silverCount - a.silverCount;
    if (b.bronzeCount !== a.bronzeCount) return b.bronzeCount - a.bronzeCount;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.classId.localeCompare(b.classId);
  });

  // Assign ranks & award designations
  items.forEach((it, idx) => {
    it.rank = idx + 1;
    if (it.rank === 1) it.awardTitle = '🏆 종합 우승';
    else if (it.rank === 2) it.awardTitle = '🥈 종합 준우승';
    else if (it.rank === 3) it.awardTitle = '🥉 종합 3위';
  });

  return items;
}
