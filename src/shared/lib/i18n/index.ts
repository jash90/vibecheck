import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import pl from './locales/pl.json';

const deviceLang = getLocales()[0]?.languageCode ?? 'pl';
const supported = ['pl', 'en'] as const;
const initial = (supported as readonly string[]).includes(deviceLang) ? deviceLang : 'pl';

// eslint-disable-next-line import/no-named-as-default-member
void i18next.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: initial,
  fallbackLng: 'pl',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
  keySeparator: false,
  returnNull: false,
});

export default i18next;
