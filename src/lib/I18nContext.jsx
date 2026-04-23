import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { t as tFn, DEFAULT_LOCALE, MESSAGES } from './i18n'

const Ctx = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (k) => k,
  languages: { fr: 'Français', en: 'English' },
})

export function I18nProvider({ children }) {
  const fromStorage = typeof localStorage !== 'undefined' && localStorage.getItem('studyplan:locale')
  const [locale, setLocaleState] = useState(() => {
    if (fromStorage && MESSAGES[fromStorage]) return fromStorage
    return DEFAULT_LOCALE
  })

  useEffect(() => {
    try {
      localStorage.setItem('studyplan:locale', locale)
      if (typeof document !== 'undefined') {
        document.documentElement.lang = locale
      }
    } catch {
      /* ignore */
    }
  }, [locale])

  const setLocale = useCallback((L) => {
    if (MESSAGES[L]) setLocaleState(L)
  }, [])

  const t = useCallback((key) => tFn(locale, key), [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      languages: { fr: 'Français', en: 'English' },
    }),
    [locale, setLocale, t],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  return useContext(Ctx)
}
