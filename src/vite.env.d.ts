/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_DASHBOARD_SIDEBAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
