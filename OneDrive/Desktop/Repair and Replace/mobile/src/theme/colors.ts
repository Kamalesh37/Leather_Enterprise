export type ThemeMode = 'dark' | 'light';

export const darkColors = {
  // Backgrounds
  background: '#090d16',
  card: '#111827',
  cardBorder: '#1f293d',
  surface: '#151d2e',
  surfaceElevated: '#1a243a',
  inputBg: '#0e1422',

  // Primary & Accents
  primary: '#059669', // Industrial emerald
  primaryLight: '#10b981',
  primaryDark: '#047857',
  primaryGlow: 'rgba(16, 185, 129, 0.15)',

  // Secondary / Cyan
  secondary: '#06b6d4',
  secondaryLight: '#22d3ee',

  // Statuses
  critical: '#ef4444',
  criticalBg: 'rgba(239, 68, 68, 0.12)',
  criticalBorder: '#7f1d1d',

  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  warningBorder: '#78350f',

  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.12)',
  successBorder: '#064e3b',

  info: '#3b82f6',
  infoBg: 'rgba(59, 130, 246, 0.12)',
  infoBorder: '#1e3a8a',

  // Typography
  textMain: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDisabled: '#475569',

  // Borders & Dividers
  border: '#26334d',
  borderLight: '#334155',

  // Role accents
  mechanicBadge: '#10b981',
  techLeadBadge: '#6366f1',
};

export const lightColors: typeof darkColors = {
  // Backgrounds
  background: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  surface: '#ffffff',
  surfaceElevated: '#f1f5f9',
  inputBg: '#f1f5f9',

  // Primary & Accents
  primary: '#059669',
  primaryLight: '#10b981',
  primaryDark: '#047857',
  primaryGlow: 'rgba(16, 185, 129, 0.12)',

  // Secondary / Cyan
  secondary: '#0891b2',
  secondaryLight: '#06b6d4',

  // Statuses
  critical: '#dc2626',
  criticalBg: '#fef2f2',
  criticalBorder: '#fecaca',

  warning: '#d97706',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',

  success: '#059669',
  successBg: '#ecfdf5',
  successBorder: '#a7f3d0',

  info: '#2563eb',
  infoBg: '#eff6ff',
  infoBorder: '#bfdbfe',

  // Typography
  textMain: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textDisabled: '#94a3b8',

  // Borders & Dividers
  border: '#e2e8f0',
  borderLight: '#cbd5e1',

  // Role accents
  mechanicBadge: '#059669',
  techLeadBadge: '#4f46e5',
};

export type ThemeColors = typeof darkColors;

// Default fallback export
export const colors = darkColors;
