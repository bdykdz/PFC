'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import en from './translations/en.json'
import ro from './translations/ro.json'

type Translations = typeof en
type Language = 'en' | 'ro'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  translations: Translations
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations: Record<Language, Translations> = {
  en,
  ro
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  return (
    <I18nContext.Provider 
      value={{ 
        language, 
        setLanguage: handleSetLanguage, 
        t,
        translations: translations[language]
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}