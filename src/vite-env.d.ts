/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RELEASE_SHA: string;
  readonly VITE_ANALYTICS_ENABLED?: string;
  readonly VITE_ANALYTICS_API_URL?: string;
}
