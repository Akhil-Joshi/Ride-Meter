export const DARK_THEME = {
  bg: '#0a0a0d',
  card: '#151518',
  cardBorder: '#232328',
  cardHover: '#1c1c20',
  modalBg: '#121216',

  // Accents & Glows
  primary: '#38bdf8', // Neon Cyan
  primaryGlow: '#7dd3fc',
  primaryDark: '#0284c7',
  glowBg: '#0c4a6e',

  // Status Indicators
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#6366f1',

  // Typography
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textHighlight: '#e0f2fe',

  // Gauges & SVG
  gaugeArcBg: '#1e293b',
  gaugeArcActive: '#38bdf8',
  gaugeNeedle: '#38bdf8',
  gaugeNeedleGlow: 'rgba(56, 189, 248, 0.6)',
  gaugeTickMajor: '#94a3b8',
  gaugeTickMinor: '#334155',
  gaugeAlertZone: 'rgba(239, 68, 68, 0.4)',
};

export const LIGHT_THEME = {
  bg: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  cardHover: '#f1f5f9',
  modalBg: '#ffffff',

  // Accents & Glows
  primary: '#0284c7', // Sky Cyan Blue
  primaryGlow: '#38bdf8',
  primaryDark: '#0369a1',
  glowBg: '#e0f2fe',

  // Status Indicators
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#4f46e5',

  // Typography
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textHighlight: '#0284c7',

  // Gauges & SVG
  gaugeArcBg: '#cbd5e1',
  gaugeArcActive: '#0284c7',
  gaugeNeedle: '#0284c7',
  gaugeNeedleGlow: 'rgba(2, 132, 199, 0.6)',
  gaugeTickMajor: '#475569',
  gaugeTickMinor: '#94a3b8',
  gaugeAlertZone: 'rgba(220, 38, 38, 0.4)',
};

export type ThemeType = typeof DARK_THEME;

export const CYANIDE_THEME = DARK_THEME;

export default CYANIDE_THEME;
