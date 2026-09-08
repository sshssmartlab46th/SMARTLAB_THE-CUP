import { MatchItem, NoticeItem, InjuryEntry, SuggestionItem, AuditLogEntry } from '../types';

export const INITIAL_MATCHES: MatchItem[] = [
  {
    id: 'soccer-final-01',
    sport: 'soccer',
    matchType: 'tournament',
    title: '제45회 상산체전 축구 결승전',
    round: '결승전',
    homeTeam: '2학년 3반 (White Dragons)',
    awayTeam: '2학년 4반 (Red Phoenix)',
    homeClass: '203',
    awayClass: '204',
    homeScore: 2,
    awayScore: 1,
    status: 'LIVE',
    period: '후반전',
    elapsedSeconds: 2430, // 40분 30초
    timerRunning: true,
    startTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    court: '상산고 대운동장 A코트',
    events: [
      {
        id: 'evt-s01',
        minute: 14,
        type: 'GOAL',
        team: 'home',
        player: '20305 김민준',
        description: '아크 정면에서 환상적인 오른발 중거리 감아차기 선제골!',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'evt-s02',
        minute: 28,
        type: 'YELLOW_CARD',
        team: 'away',
        player: '20412 이준서',
        description: '역습 차단 파울로 옐로카드 경고',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      },
      {
        id: 'evt-s03',
        minute: 41,
        type: 'GOAL',
        team: 'away',
        player: '20409 박도현',
        description: '코너킥 세트피스 상황에서 러닝 헤더 동점골 성공!',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 'evt-s04',
        minute: 55,
        type: 'GOAL',
        team: 'home',
        player: '20311 정우진',
        description: '측면 컷백 크로스를 침착하게 골문 구석으로 밀어 넣어 추가골!',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'basketball-semi-01',
    sport: 'basketball',
    matchType: 'tournament',
    title: '농구 4강 1경기 (남학생부)',
    round: '4강전',
    homeTeam: '1학년 2반',
    awayTeam: '1학년 9반',
    homeClass: '102',
    awayClass: '109',
    homeScore: 38,
    awayScore: 35,
    status: 'LIVE',
    period: '4쿼터',
    elapsedSeconds: 580,
    timerRunning: true,
    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    court: '상산 체육관 1층 메인코트',
    events: [
      {
        id: 'evt-b01',
        minute: 8,
        type: 'POINT_3',
        team: 'home',
        player: '10204 최현우',
        description: '탑 코트에서 버저비터 3점슛 성공!',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 'evt-b02',
        minute: 12,
        type: 'POINT_2',
        team: 'away',
        player: '10915 강동훈',
        description: '골밑 돌파 후 리버스 레이업 득점',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dodgeball-final-01',
    sport: 'dodgeball',
    matchType: 'tournament',
    title: '피구 결승전 (여학생부)',
    round: '결승전',
    homeTeam: '2학년 6반',
    awayTeam: '2학년 7반',
    homeClass: '206',
    awayClass: '207',
    homeScore: 6, // Remaining players
    awayScore: 4,
    status: 'PAUSED',
    period: '2세트 (작전타임)',
    elapsedSeconds: 720,
    timerRunning: false,
    startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    court: '체육관 2층 다목적구장',
    events: [
      {
        id: 'evt-d01',
        minute: 4,
        type: 'OUT',
        team: 'away',
        player: '20703 박서윤',
        description: '외야 패스 공격에 맞아 아웃 (외야 이동)',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'relay-male-heat01',
    sport: 'relay_male',
    matchType: 'relay_group',
    title: '남학생 800m 계주 조별 타임트라이얼 (A조)',
    round: '조별 예선',
    homeTeam: '2학년 1반, 2반, 3반, 4반',
    awayTeam: '기록 측정 경기',
    homeClass: '201-204',
    awayClass: '201-204',
    homeScore: 0,
    awayScore: 0,
    status: 'SCHEDULED',
    period: '경기 대기',
    elapsedSeconds: 0,
    timerRunning: false,
    startTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15분 뒤 (라인업 비공개 상태)
    court: '육상 트랙 메인레인',
    events: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'relay-female-final',
    sport: 'relay_female',
    matchType: 'relay_final',
    title: '여학생 400m 계주 결승 레이스',
    round: '결승전',
    homeTeam: '1학년 5반 vs 2학년 6반 vs 3학년 7반 vs 2학년 8반',
    awayTeam: '4팀 단판 결승',
    homeClass: '여학생 대표반',
    awayClass: '여학생 대표반',
    homeScore: 0,
    awayScore: 0,
    status: 'SCHEDULED',
    period: '오후 3시 예정',
    elapsedSeconds: 0,
    timerRunning: false,
    startTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    court: '육상 트랙',
    events: [],
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'notice-g01',
    title: '📢 [전체 공지] 제45회 상산체전 본부석 운영 수칙 및 부상자 긴급 이송 안내',
    content: '상산고등학교 체육대회 본부입니다. 경기 중 발목 접질림이나 타박상 발생 시 즉시 본부석 우측 보건텐트로 방문해 주시기 바랍니다. 모든 선수는 페어플레이 정신을 준수해 주십시오.',
    type: 'global',
    authorName: '학생회 체육부장',
    authorRole: '학생회',
    authorId: 'council-01',
    important: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notice-g02',
    title: '🏆 종목별 라인업 제출 마감 및 5분 전 자동 공개 규정 안내',
    content: '각 반 반장님들은 경기 시작 20분 전까지 반드시 라인업을 입력해 주셔야 합니다. 상대 반에는 경기 시작 5분 전 정각에만 명단이 투명하게 공개됩니다.',
    type: 'global',
    authorName: '상산체육위원회',
    authorRole: 'admin',
    authorId: 'admin-01',
    important: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notice-c01',
    title: '🔔 [2학년 3반 담임] 오후 축구 결승전 응원석 집결 시간',
    content: '우리 3반 학생들은 오후 2시 10분까지 본관 앞 잔디스탠드 C구역으로 전원 집결해 주세요. 생수와 응원 수건은 반장이 배부합니다.',
    type: 'class',
    targetClass: '203',
    authorName: '2학년 3반 담임선생님',
    authorRole: 'teacher',
    authorId: 'teacher-203',
    important: true,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_INJURIES: InjuryEntry[] = [
  {
    id: 'inj-01',
    sport: 'soccer',
    title: '발목 외측 인대 염좌 (접질림)',
    symptoms: '발목 외측 부위의 급격한 통증, 부종(붓기), 체중 부하 시 디딤 통증, 멍 발생.',
    firstAid: 'RICE 원칙 적용: 1) 즉시 경기 중단 및 안정(Rest), 2) 냉찜질(Ice) 15~20분 적용, 3) 압박 붕대(Compression)로 부기 억제, 4) 심장보다 높게 올리기(Elevation).',
    severity: 'moderate',
    prevention: '경기 전 충분한 발목 회전 스트레칭, 인조잔디 스터드 축구화 착용.'
  },
  {
    id: 'inj-02',
    sport: 'soccer',
    title: '햄스트링 급성 근육 좌상 (허벅지 뒤쪽 통증)',
    symptoms: '전력 질주 시 허벅지 뒤쪽에서 뚝 하는 느낌과 함께 날카로운 통증 발생, 무릎을 굽히기 어려움.',
    firstAid: '즉시 보행 중단. 얼음찜질 적용 및 탄력 붕대로 가볍게 압박. 절대 스트레칭을 억지로 시도하지 말고 보건실 들것 요청.',
    severity: 'moderate',
    prevention: '경기 전 대퇴이두근 웜업 및 조깅 10분 이상 필수.'
  },
  {
    id: 'inj-03',
    sport: 'basketball',
    title: '손가락 관절 염좌 및 탈구',
    symptoms: '농구공에 손가락 끝이 정면 충돌한 후 관절 팽창, 굴곡 불가, 심한 통증.',
    firstAid: '손가락을 억지로 잡아당기지 마십시오. 인접한 정상 손가락과 함께 테이핑하여 고정(Buddy Taping) 후 즉시 얼음팩 적용 및 병원 이송.',
    severity: 'emergency',
    prevention: '손가락 테이핑 보강 및 공 캐치 시 집중력 유지.'
  },
  {
    id: 'inj-04',
    sport: 'dodgeball',
    title: '안면 타박상 및 비출혈 (코피)',
    symptoms: '피구공에 안면 충돌 후 코피 발생, 코 주위 부종, 통증.',
    firstAid: '고개를 앞으로 약간 숙이고 콧볼의 부드러운 부위를 5~10분간 엄지와 검지로 지그시 압박. 목 뒤로 피가 넘어가지 않도록 주의.',
    severity: 'mild',
    prevention: '공의 궤적 주시, 보호 안경 착용 권장.'
  },
  {
    id: 'inj-05',
    sport: 'relay_male',
    title: '아스팔트/우레탄 트랙 심한 찰과상',
    symptoms: '넘어짐으로 인한 피부 표피 박리, 출혈, 모래 및 이물질 흡착.',
    firstAid: '생리식염수 또는 깨끗한 물로 상처 부위 이물질을 꼼꼼히 세척. 알코올로 직접 상처를 문지르지 말고 멸균 거즈로 덮은 후 보건교사에게 처치 받기.',
    severity: 'mild',
    prevention: '무리한 바톤 터치 인코스 추월 자제, 규격 육상화 착용.'
  }
];

export const INITIAL_SUGGESTIONS: SuggestionItem[] = [
  {
    id: 'sug-01',
    authorId: 'user-20305',
    authorName: '20305 김민준',
    authorStudentId: '20305',
    title: '운동장 본부석 음향 스피커 볼륨 조절 건의',
    content: '축구 경기장 북측 스탠드 쪽에서는 장내 아나운서 방송 소리가 잘 들리지 않습니다. 북측 스탠드 방향 스피커 볼륨을 조금만 올려주시면 감사하겠습니다!',
    answer: '[학생회 답변] 건의해 주셔서 감사합니다. 북측 스탠드 보조 스피커의 게인을 상향 조정 완료했습니다!',
    answeredBy: '학생회 부회장',
    answeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
  },
  {
    id: 'sug-02',
    authorId: 'user-10412',
    authorName: '10412 이서진',
    authorStudentId: '10412',
    title: '점심시간 이후 식수대 종이컵 추가 비치 요청',
    content: '농구 경기 후 목이 마른 학생들이 많은데 체육관 입구 식수대 종이컵이 금방 소진됩니다. 여분 비치 부탁드립니다.',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-01',
    operatorId: 'sshsgym',
    operatorName: '총괄본부 (sshsgym)',
    operatorRole: 'admin',
    matchId: 'soccer-final-01',
    matchTitle: '제45회 상산체전 축구 결승전',
    action: 'SCORE_UPDATE',
    reason: '정상 득점 인정 (20311 정우진 추가골)',
    oldValue: '1 : 1',
    newValue: '2 : 1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: 'audit-02',
    operatorId: 'council-ref01',
    operatorName: '학생회 심판위원',
    operatorRole: 'student_council',
    matchId: 'basketball-semi-01',
    matchTitle: '농구 4강 1경기 (남학생부)',
    action: 'SCORE_ROLLBACK',
    reason: '오심 수정 (슛 동작 이전 라인아웃 파울 판정으로 2점 취소)',
    oldValue: '40 : 35',
    newValue: '38 : 35',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  }
];
