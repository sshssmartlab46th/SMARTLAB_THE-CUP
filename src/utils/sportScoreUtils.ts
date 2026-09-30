import { SportType, TimelineEvent } from '../types';

export interface SportScoringOption {
  id: string;
  label: string;
  desc: string;
  points: number;
  type: TimelineEvent['type'];
  badge: string;
}

export interface QuickDeltaOption {
  delta: number;
  label: string;
  desc: string;
  type?: TimelineEvent['type'];
}

export interface SportScoreMeta {
  sport: SportType | 'common';
  sportName: string;
  sportIcon: string;
  scoreUnit: string;
  scoreNoun: string;
  actionButtonLabel: string;
  primaryPointName: string;
  scoringOptions: SportScoringOption[];
  quickDeltas: QuickDeltaOption[];
  undoReasons: string[];
}

const SPORT_SCORE_CONFIGS: Record<string, SportScoreMeta> = {
  soccer: {
    sport: 'soccer',
    sportName: '축구',
    sportIcon: '⚽',
    scoreUnit: '골',
    scoreNoun: '골',
    actionButtonLabel: '골 선수 기록',
    primaryPointName: '골',
    scoringOptions: [
      { id: '필드골', label: '필드골 (+1골)', desc: '오픈 플레이 필드 득점', points: 1, type: 'GOAL', badge: '⚽ 필드골' },
      { id: '페널티킥', label: '페널티킥 PK (+1골)', desc: '11m 페널티킥 성공', points: 1, type: 'GOAL', badge: '⚽ PK' },
      { id: '프리킥', label: '직접 프리킥 (+1골)', desc: '세트피스 직접 슈팅 득점', points: 1, type: 'GOAL', badge: '⚽ 프리킥' },
      { id: '헤더골', label: '헤더 골 (+1골)', desc: '크로스 및 세트피스 헤딩 득점', points: 1, type: 'GOAL', badge: '⚽ 헤더' },
      { id: '자책골', label: '상대 자책골 (+1골)', desc: '수비수 자책 득점 (OG)', points: 1, type: 'GOAL', badge: '⚽ 자책골' }
    ],
    quickDeltas: [
      { delta: 1, label: '+1골', desc: '1골 득점', type: 'GOAL' },
      { delta: -1, label: '-1골', desc: '1골 취소/정정' }
    ],
    undoReasons: [
      '입력 실수 (단순 오타/점수 착오)',
      '오프사이드 반칙 (골 무효)',
      '공격자 파울/핸드볼 반칙 (골 무효)',
      '골키퍼 차징 반칙 (골 무효)',
      '심판 합의 판정 번복',
      '기타 사유 직접 입력'
    ]
  },
  basketball: {
    sport: 'basketball',
    sportName: '농구',
    sportIcon: '🏀',
    scoreUnit: '점',
    scoreNoun: '득점',
    actionButtonLabel: '득점 선수 기록',
    primaryPointName: '득점',
    scoringOptions: [
      { id: '2점슛', label: '2점 필드골 (+2점)', desc: '레이업, 점퍼, 페인트존 득점', points: 2, type: 'POINT_2', badge: '🏀 2점' },
      { id: '3점슛', label: '3점 슛 (+3점)', desc: '3점 라인 밖 외곽슛 성공', points: 3, type: 'POINT_3', badge: '🏀 3점' },
      { id: '자유투', label: '자유투 FT (+1점)', desc: '파울 후 주어진 1점 자유투 성공', points: 1, type: 'FREE_THROW', badge: '🏀 자유투' },
      { id: '앤드원', label: '앤드원 3점 플레이 (+3점)', desc: '파울 득점 인정 + 추가 자유투 성공', points: 3, type: 'POINT_3', badge: '🏀 앤드원' },
      { id: '덩크슛', label: '슬램 덩크 (+2점)', desc: '호쾌한 림 직격 덩크 득점', points: 2, type: 'POINT_2', badge: '🏀 덩크' }
    ],
    quickDeltas: [
      { delta: 2, label: '+2점', desc: '2점 필드골', type: 'POINT_2' },
      { delta: 3, label: '+3점', desc: '3점슛', type: 'POINT_3' },
      { delta: 1, label: '+1점', desc: '자유투 (FT)', type: 'FREE_THROW' },
      { delta: -1, label: '-1점', desc: '1점 정정' },
      { delta: -2, label: '-2점', desc: '2점 정정' }
    ],
    undoReasons: [
      '입력 실수 (단순 오타/점수 착오)',
      '오펜스 파울/차징 (득점 무효)',
      '트래블링/더블드리블 바이얼레이션 (득점 무효)',
      '샷클락(24초) 초과 (득점 무효)',
      '사이드라인/엔드라인 크로스 무효',
      '심판 합의 판정 번복',
      '기타 사유 직접 입력'
    ]
  },
  dodgeball: {
    sport: 'dodgeball',
    sportName: '피구',
    sportIcon: '🏐',
    scoreUnit: '점',
    scoreNoun: '아웃/세트',
    actionButtonLabel: '아웃/득점 선수 기록',
    primaryPointName: '아웃',
    scoringOptions: [
      { id: '공격 아웃', label: '타격 아웃 (+1점)', desc: '외야/내야 공격 성공으로 상대 내야수 아웃', points: 1, type: 'OUT', badge: '🏐 아웃' },
      { id: '포구 부활', label: '포구 부활 (+1점/부활)', desc: '상대 강습구 캐치 성공으로 아군 1명 부활', points: 1, type: 'OUT', badge: '🏐 캐치' },
      { id: '라인 아웃', label: '상대 라인아웃 (+1점)', desc: '상대방 경기장 선 밟음 탈락', points: 1, type: 'OUT', badge: '🏐 라인' },
      { id: '세트 승리', label: '세트 스코어 (+1세트)', desc: '내야 잔여 인원 우세 세트 승리', points: 1, type: 'GOAL', badge: '🏐 세트' }
    ],
    quickDeltas: [
      { delta: 1, label: '+1점', desc: '아웃/세트 획득', type: 'OUT' },
      { delta: -1, label: '-1점', desc: '판정 정정/차감' }
    ],
    undoReasons: [
      '입력 실수 (단순 오타/기록 착오)',
      '헤드샷 파울 (머리 강타로 공격 무효)',
      '공격자 라인 침범 (아웃 무효)',
      '공격 전 패스 횟수/규정 위반',
      '심판 합의 판정 번복',
      '기타 사유 직접 입력'
    ]
  },
  tug_of_war: {
    sport: 'tug_of_war',
    sportName: '줄다리기',
    sportIcon: '🪢',
    scoreUnit: '승',
    scoreNoun: '세트 승리',
    actionButtonLabel: '세트 승리 기록',
    primaryPointName: '승',
    scoringOptions: [
      { id: '세트 승리', label: '세트 승리 (+1승)', desc: '중앙 표식 당겨 승리', points: 1, type: 'GOAL', badge: '🪢 +1승' }
    ],
    quickDeltas: [
      { delta: 1, label: '+1승', desc: '세트 승리' },
      { delta: -1, label: '-1승', desc: '판정 정정' }
    ],
    undoReasons: [
      '부정 출발로 인한 재경기',
      '장갑/보호구 규정 위반 판정',
      '단순 입력 실수'
    ]
  },
  relay_male: {
    sport: 'relay_male',
    sportName: '남자 계주',
    sportIcon: '🏃',
    scoreUnit: '순위',
    scoreNoun: '기록',
    actionButtonLabel: '주자·기록 관리',
    primaryPointName: '순위',
    scoringOptions: [
      { id: '1위 완주', label: '1위 완주 (+1)', desc: '결승선 1위 통과', points: 1, type: 'GOAL', badge: '🥇 1위' },
      { id: '2위 완주', label: '2위 완주', desc: '결승선 2위 통과', points: 1, type: 'GOAL', badge: '🥈 2위' }
    ],
    quickDeltas: [
      { delta: 1, label: '+1', desc: '순위/점수' },
      { delta: -1, label: '-1', desc: '정정' }
    ],
    undoReasons: [
      '바톤 터치존 이탈 실격',
      '레인 침범 판정',
      '기록 측정 오차'
    ]
  },
  relay_female: {
    sport: 'relay_female',
    sportName: '여자 계주',
    sportIcon: '🏃',
    scoreUnit: '순위',
    scoreNoun: '기록',
    actionButtonLabel: '주자·기록 관리',
    primaryPointName: '순위',
    scoringOptions: [
      { id: '1위 완주', label: '1위 완주 (+1)', desc: '결승선 1위 통과', points: 1, type: 'GOAL', badge: '🥇 1위' },
      { id: '2위 완주', label: '2위 완주', desc: '결승선 2위 통과', points: 1, type: 'GOAL', badge: '🥈 2위' }
    ],
    quickDeltas: [
      { delta: 1, label: '+1', desc: '순위/점수' },
      { delta: -1, label: '-1', desc: '정정' }
    ],
    undoReasons: [
      '바톤 터치존 이탈 실격',
      '레인 침범 판정',
      '기록 측정 오차'
    ]
  }
};

/**
 * Returns sport-specific scoring metadata, fallbacks gracefully to soccer.
 */
export function getSportScoreMeta(sport?: string): SportScoreMeta {
  if (!sport) return SPORT_SCORE_CONFIGS.soccer;
  const key = sport.toLowerCase().trim();
  if (SPORT_SCORE_CONFIGS[key]) {
    return SPORT_SCORE_CONFIGS[key];
  }
  // Try substring matches
  if (key.includes('basket') || key.includes('농구')) return SPORT_SCORE_CONFIGS.basketball;
  if (key.includes('dodge') || key.includes('피구')) return SPORT_SCORE_CONFIGS.dodgeball;
  if (key.includes('tug') || key.includes('줄다리기')) return SPORT_SCORE_CONFIGS.tug_of_war;
  if (key.includes('relay') || key.includes('계주') || key.includes('달리기')) return SPORT_SCORE_CONFIGS.relay_male;
  return SPORT_SCORE_CONFIGS.soccer;
}

/**
 * Returns icon, badge text and badge styling for timeline events
 */
export function getTimelineEventDisplay(evt: TimelineEvent, sport?: string): {
  icon: string;
  badgeLabel: string;
  badgeClass: string;
} {
  const meta = getSportScoreMeta(sport);
  switch (evt.type) {
    case 'POINT_3':
      return {
        icon: '🏀',
        badgeLabel: '3점슛 (+3점)',
        badgeClass: 'bg-orange-600 text-white'
      };
    case 'POINT_2':
      return {
        icon: '🏀',
        badgeLabel: '2점슛 (+2점)',
        badgeClass: 'bg-amber-600 text-white'
      };
    case 'FREE_THROW':
      return {
        icon: '🏀',
        badgeLabel: '자유투 (+1점)',
        badgeClass: 'bg-blue-600 text-white'
      };
    case 'OUT':
      return {
        icon: '🏐',
        badgeLabel: '아웃 (+1점)',
        badgeClass: 'bg-indigo-600 text-white'
      };
    case 'GOAL':
      return {
        icon: meta.sport === 'soccer' ? '⚽' : meta.sportIcon,
        badgeLabel: meta.sport === 'soccer' ? '골 (+1골)' : `${meta.scoreNoun} (+1${meta.scoreUnit})`,
        badgeClass: 'bg-emerald-600 text-white'
      };
    case 'YELLOW_CARD':
      return {
        icon: '🟨',
        badgeLabel: '경고',
        badgeClass: 'bg-amber-400 text-slate-900 font-black'
      };
    case 'RED_CARD':
      return {
        icon: '🟥',
        badgeLabel: '퇴장',
        badgeClass: 'bg-red-600 text-white font-black'
      };
    case 'SUBSTITUTION':
      return {
        icon: '🔄',
        badgeLabel: '선수 교체',
        badgeClass: 'bg-slate-500 text-white'
      };
    default:
      return {
        icon: meta.sportIcon,
        badgeLabel: evt.points ? `+${evt.points}${meta.scoreUnit}` : evt.type,
        badgeClass: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
      };
  }
}

/**
 * Formats a score action message for timeline / toast.
 */
export function formatScoreActionText(
  sport: string | undefined,
  teamName: string,
  scorerName: string,
  minute: number,
  scoreType: string,
  points: number = 1
): string {
  const meta = getSportScoreMeta(sport);
  if (meta.sport === 'soccer') {
    return `${teamName} ${scorerName} 선수 ${minute}분 골 (${scoreType})`;
  }
  if (meta.sport === 'basketball') {
    return `${teamName} ${scorerName} 선수 ${minute}분 ${scoreType} (+${points}점)`;
  }
  if (meta.sport === 'dodgeball') {
    return `${teamName} ${scorerName} 선수 ${minute}분 ${scoreType} (+${points}점)`;
  }
  return `${teamName} ${scorerName} 선수 ${minute}분 ${scoreType} (+${points}${meta.scoreUnit})`;
}
