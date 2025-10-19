import { translate } from '@vitalets/google-translate-api';

export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml';

const LANGUAGE_CODES = {
  en: 'en',
  hi: 'hi',
  te: 'te',
  ta: 'ta',
  kn: 'kn',
  ml: 'ml',
} as const;

export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage: SupportedLanguage = 'en'
): Promise<string> {
  try {
    // Skip translation if same language or text empty
    if (!text || text.trim() === '' || sourceLanguage === targetLanguage) {
      return text;
    }

    const result = await translate(text, {
      from: LANGUAGE_CODES[sourceLanguage],
      to: LANGUAGE_CODES[targetLanguage],
    });

    return result.text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // fallback to original text
  }
}

export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  try {
    // Basic Unicode pattern detection
    const hindiPattern = /[\u0900-\u097F]/;
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const teluguPattern = /[\u0C00-\u0C7F]/;
    const kannadaPattern = /[\u0C80-\u0CFF]/;
    const malayalamPattern = /[\u0D00-\u0D7F]/;

    if (hindiPattern.test(text)) return 'hi';
    if (tamilPattern.test(text)) return 'ta';
    if (teluguPattern.test(text)) return 'te';
    if (kannadaPattern.test(text)) return 'kn';
    if (malayalamPattern.test(text)) return 'ml';
    return 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // default
  }
}

export function getLanguageName(code: SupportedLanguage): string {
  const names = {
    en: 'English',
    hi: 'Hindi',
    te: 'Telugu',
    ta: 'Tamil',
    kn: 'Kannada',
    ml: 'Malayalam',
  } as const;
  return names[code];
}
