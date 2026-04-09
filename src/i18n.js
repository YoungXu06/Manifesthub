import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';
import es from './locales/es.json';
import ja from './locales/ja.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import ko from './locales/ko.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',    nativeName: 'English',    flag: '🇺🇸', dir: 'ltr', htmlLang: 'en'    },
  { code: 'zh', name: 'Chinese',    nativeName: '中文',        flag: '🇨🇳', dir: 'ltr', htmlLang: 'zh-CN' },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',    flag: '🇪🇸', dir: 'ltr', htmlLang: 'es'    },
  { code: 'ja', name: 'Japanese',   nativeName: '日本語',      flag: '🇯🇵', dir: 'ltr', htmlLang: 'ja'    },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',    flag: '🇩🇪', dir: 'ltr', htmlLang: 'de'    },
  { code: 'fr', name: 'French',     nativeName: 'Français',   flag: '🇫🇷', dir: 'ltr', htmlLang: 'fr'    },
  { code: 'ko', name: 'Korean',     nativeName: '한국어',      flag: '🇰🇷', dir: 'ltr', htmlLang: 'ko'    },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português',  flag: '🇧🇷', dir: 'ltr', htmlLang: 'pt'    },
  { code: 'ru', name: 'Russian',    nativeName: 'Русский',    flag: '🇷🇺', dir: 'ltr', htmlLang: 'ru'    },
];

export const getLangMeta = (code) =>
  SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];

function detectInitialLang() {
  const stored = localStorage.getItem('language');
  if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) return stored;
  const browserLangs = navigator.languages || [navigator.language || 'en'];
  for (const bl of browserLangs) {
    const code = bl.split('-')[0].toLowerCase();
    if (SUPPORTED_LANGUAGES.some(l => l.code === code)) return code;
  }
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      es: { translation: es },
      ja: { translation: ja },
      de: { translation: de },
      fr: { translation: fr },
      ko: { translation: ko },
      pt: { translation: pt },
      ru: { translation: ru },
    },
    lng: detectInitialLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    saveMissing: false,
  });

i18n.on('languageChanged', (code) => {
  const meta = getLangMeta(code);
  document.documentElement.lang = meta.htmlLang;
  document.documentElement.dir  = meta.dir;
  localStorage.setItem('language', code);
});

const initialMeta = getLangMeta(i18n.language);
document.documentElement.lang = initialMeta.htmlLang;
document.documentElement.dir  = initialMeta.dir;

export default i18n;
