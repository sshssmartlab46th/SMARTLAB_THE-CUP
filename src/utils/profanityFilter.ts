export function filterProfanity(text: string): { filteredText: string; hasProfanity: boolean } {
  if (!text) return { filteredText: text, hasProfanity: false };

  // Common Korean profanities & abuse words
  const BAD_WORDS = [
    '시발', '씨발', '개새끼', '새끼', '존나', '졸라', '병신', '지랄',
    '닥쳐', '미친', '새키', '썅', '염병', '느금', '애미', '창녀',
    '보지', '자지', '섹스', 'ㅅㅂ', 'ㅆㅂ', 'ㅄ', 'ㅈㄹ', 'ㄲㅈ',
    '꺼져', '닥치', '등신', '호구', '새퀴', '시벌', '씨벌'
  ];

  let filtered = text;
  let detected = false;

  for (const bad of BAD_WORDS) {
    const regex = new RegExp(bad, 'gi');
    if (regex.test(filtered)) {
      detected = true;
      const mask = '♥'.repeat(bad.length);
      filtered = filtered.replace(regex, mask);
    }
  }

  return {
    filteredText: filtered,
    hasProfanity: detected
  };
}
