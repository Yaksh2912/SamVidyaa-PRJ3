import React, { createContext, useContext, useEffect, useState } from 'react'
import { translations } from './translations'

const I18nContext = createContext()

export function useI18n() {
  return useContext(I18nContext)
}

const interpolate = (value, params = {}) => {
  if (typeof value !== 'string') return value

  return value.replace(/\{(\w+)\}/g, (_, key) => {
    const replacement = params[key]
    return replacement === undefined || replacement === null ? `{${key}}` : replacement
  })
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('language')
    return savedLang || 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language]

    for (const currentKey of keys) {
      value = value?.[currentKey]
    }

    return value === undefined ? key : interpolate(value, params)
  }

  const changeLanguage = (lang) => {
    setLanguage(lang)
  }

  const value = {
    language,
    changeLanguage,
    t,
    translations: translations[language]
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
