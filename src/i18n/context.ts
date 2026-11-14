import { createContext, useContext } from 'react';
import { Language, LanguageOption } from './types';

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string) => string;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};


