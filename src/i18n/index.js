import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ar from './locales/ar.json';
import fr from './locales/fr.json';

const deviceLang = Localization.getLocales()[0]?.languageCode;
const fallbackLang = 'ar';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
    },
    lng: deviceLang === 'fr' ? 'fr' : fallbackLang,
    fallbackLng: fallbackLang,
    interpolation: { escapeValue: false },
  });

export default i18n;
