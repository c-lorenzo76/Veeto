import { createContext, useContext, useState, useEffect } from 'react';
import { strings, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/constants/strings';

const LANGUAGE_STORAGE_KEY = 'veto-language';

const LanguageContext = createContext();

function getInitialLanguage() {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
}

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(getInitialLanguage);

    useEffect(() => {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    return useContext(LanguageContext);
};

export const useStrings = () => {
    const { language } = useLanguage();
    return strings[language] || strings[DEFAULT_LANGUAGE];
};
