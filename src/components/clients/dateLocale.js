import { es, bg } from 'date-fns/locale';

// Map i18n language → date-fns locale (undefined = English default).
export const dateLocale = (lng) => ({ es, bg }[(lng || '').slice(0, 2)]);
