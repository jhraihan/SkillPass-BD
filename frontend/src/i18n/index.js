import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bnAdmin from './bn/admin.json';
import bnCommon from './bn/common.json';
import bnCustomer from './bn/customer.json';
import bnPublic from './bn/public.json';
import bnWorker from './bn/worker.json';
import enAdmin from './en/admin.json';
import enCommon from './en/common.json';
import enCustomer from './en/customer.json';
import enPublic from './en/public.json';
import enWorker from './en/worker.json';

const STORAGE_KEY = 'skillpass.lang';

function savedLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, public: enPublic, customer: enCustomer, worker: enWorker, admin: enAdmin },
    bn: { common: bnCommon, public: bnPublic, customer: bnCustomer, worker: bnWorker, admin: bnAdmin },
  },
  lng: savedLanguage() || 'bn',
  fallbackLng: 'en',
  ns: ['common', 'public', 'customer', 'worker', 'admin'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

document.documentElement.lang = i18n.language;

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Storage unavailable; language resets on reload.
  }
});

export default i18n;
