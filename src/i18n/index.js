import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Every JSON in ./locales/<lng>/*.json is merged into that language's
// translation bundle. Module files must use a unique top-level key
// (e.g. { "clients": { ... } }) so merging never collides.
const files = import.meta.glob('./locales/*/*.json', { eager: true });

const resources = {};
for (const path in files) {
  const lng = path.match(/\.\/locales\/([^/]+)\//)[1];
  resources[lng] ??= { translation: {} };
  Object.assign(resources[lng].translation, files[path].default);
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('inksync-lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const setLanguage = (lng) => {
  localStorage.setItem('inksync-lang', lng);
  i18n.changeLanguage(lng);
};

export default i18n;
