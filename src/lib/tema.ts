export const COOKIE_TEMA = 'tema';
export const TEMAS_UI = ['claro', 'oscuro', 'sistema'] as const;
export type TemaUI = (typeof TEMAS_UI)[number];
export const temaDesdeCookie = (v: string | undefined): TemaUI => ((TEMAS_UI as readonly string[]).includes(v ?? '') ? (v as TemaUI) : 'sistema');
export const dataThemeDe = (t: TemaUI): 'light' | 'dark' | undefined => (t === 'claro' ? 'light' : t === 'oscuro' ? 'dark' : undefined);
