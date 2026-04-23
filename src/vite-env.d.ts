/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de base de l’API hébergée ailleurs (Vercel), ex. `https://studyplan-xxx.vercel.app` (sans / final) */
  readonly VITE_API_BASE_URL?: string
  /** Client OAuth Google (type « Application Web ») — même client ID sur l’API (audience) */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
