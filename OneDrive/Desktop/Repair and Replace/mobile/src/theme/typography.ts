import { Platform, TextStyle } from 'react-native';

const fontFamilyRegular = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'sans-serif',
});

const fontFamilyMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const typography = {
  h1: {
    fontFamily: fontFamilyRegular,
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  h2: {
    fontFamily: fontFamilyRegular,
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  h3: {
    fontFamily: fontFamilyRegular,
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    fontFamily: fontFamilyRegular,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  bodyLarge: {
    fontFamily: fontFamilyRegular,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: fontFamilyRegular,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  bodySmall: {
    fontFamily: fontFamilyRegular,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  badge: {
    fontFamily: fontFamilyRegular,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
  },
  mono: {
    fontFamily: fontFamilyMono,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: fontFamilyRegular,
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
};
