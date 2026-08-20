/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Base de la instancia de Umami. Sin definir ⇒ analítica deshabilitada. */
  readonly VITE_UMAMI_URL?: string;
  /** UUID del sitio en Umami. Sin definir ⇒ analítica deshabilitada. */
  readonly VITE_UMAMI_WEBSITE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
