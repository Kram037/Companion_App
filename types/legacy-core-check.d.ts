interface Window {
  APP_VERSION?: string;
  APP_BUILD_DATE?: string;
  CompanionConfig?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    debug?: boolean;
  };
  supabaseClient?: unknown;
  getAppLang?: () => 'it' | 'en';
  setAppLang?: (lang: string, save?: boolean) => void;
  loadAppLang?: () => void;
}

declare const elements: {
  langIt?: Element | null;
  langEn?: Element | null;
};

declare function appDebug(...messages: unknown[]): void;
