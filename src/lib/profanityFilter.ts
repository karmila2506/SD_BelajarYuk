// Filter kata tidak pantas untuk keselamatan dan etika anak SD
const BANNED_WORDS = [
  'bodoh', 'tolol', 'goblok', 'bego', 'idiot', 'anjing', 'babi', 'monyet',
  'sialan', 'kampret', 'brengsek', 'bangsat', 'bajingan', 'jelek', 'culun',
  'cupu', 'cacat', 'loser', 'hate', 'stupid', 'die', 'bunuh', 'hajar'
];

export function containsInappropriateContent(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower) || lower.includes(word);
  });
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  let sanitized = text;
  BANNED_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    sanitized = sanitized.replace(regex, '🌸***🌸');
  });
  return sanitized;
}
