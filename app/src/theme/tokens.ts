export const colors = {
  dark: {
    background: "#09090b",
    surface: "#111113",
    surfaceElevated: "#1a1a1e",
    border: "#27272a",
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    textTertiary: "#52525b",
    accent: "#10B981",
    accentSubtle: "rgba(16, 185, 129, 0.12)",
    danger: "#EF4444",
    dangerSubtle: "rgba(239, 68, 68, 0.12)",
    success: "#22C55E",
    successSubtle: "rgba(34, 197, 94, 0.12)",
    warning: "#F59E0B",
    warningSubtle: "rgba(245, 158, 11, 0.12)",
  },
  light: {
    background: "#fafafa",
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    border: "#e4e4e7",
    textPrimary: "#18181b",
    textSecondary: "#71717a",
    textTertiary: "#a1a1aa",
    accent: "#10B981",
    accentSubtle: "rgba(16, 185, 129, 0.08)",
    danger: "#EF4444",
    dangerSubtle: "rgba(239, 68, 68, 0.08)",
    success: "#22C55E",
    successSubtle: "rgba(34, 197, 94, 0.08)",
    warning: "#F59E0B",
    warningSubtle: "rgba(245, 158, 11, 0.08)",
  },
} as const;

export type ThemeMode = "dark" | "light" | "system";
export type ColorScheme = "dark" | "light";
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSubtle: string;
  danger: string;
  dangerSubtle: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  xxxl: 34,
} as const;
