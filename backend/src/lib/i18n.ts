import { Request } from 'express';

export type Locale = 'en' | 'hi';

const SUPPORTED_LOCALES: Locale[] = ['en', 'hi'];

// Minimal dictionary covering the small set of server-generated (non-DB) user-facing
// strings. DB content (titles, messages entered by teachers/principals) is stored as
// authored and is out of scope for translation here.
const translations: Record<Locale, Record<string, string>> = {
  en: {
    'error.notFound': 'Not found.',
    'error.forbidden': 'Access denied.',
    'error.serverError': 'Something went wrong. Please try again.',
    'notification.welcome.title': 'Welcome!',
    'notification.welcome.message': 'Your account is ready to use.',
  },
  hi: {
    'error.notFound': 'नहीं मिला।',
    'error.forbidden': 'पहुँच अस्वीकृत।',
    'error.serverError': 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।',
    'notification.welcome.title': 'स्वागत है!',
    'notification.welcome.message': 'आपका खाता उपयोग के लिए तैयार है।',
  },
};

export function resolveLocale(req: Request): Locale {
  const header = req.headers['accept-language'];
  const requested = Array.isArray(header) ? header[0] : header;
  const primary = requested?.split(',')[0]?.trim().split('-')[0] as Locale | undefined;
  return primary && SUPPORTED_LOCALES.includes(primary) ? primary : 'en';
}

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}
