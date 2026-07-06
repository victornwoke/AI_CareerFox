export const colors = {
  primary: "#6C4EF5",
  deepPurple: "#5B38F6",
  blue: "#4D8BFF",
  success: "#21C16B",
  warning: "#FFC800",
  energy: "#FF8A00",
  error: "#FF4D4F",
  accent: "#FF5DA8",
  textPrimary: "#0D132B",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  surface: "#F6F7FB",
  background: "#FFFFFF",
  white: "#FFFFFF",
  black: "#0D132B",
  info: "#4D8BFF",
  mutedPurple: "#EEE9FF",
  softPurple: "#F2EEFF",
  softBlue: "#EEF5FF",
  softSuccess: "#E9F9F0",
  softWarning: "#FFF8D6",
  softEnergy: "#FFF0E0",
  softError: "#FFECEC",
  softAccent: "#FFEAF4",
  paginationInactive: "#DDD7F8",
} as const;

export type ColorName = keyof typeof colors;

export const gradients = {
  primary: ["#5B38F6", "#6C4EF5", "#7B55FF"],
  primaryCss: "linear-gradient(90deg, #5B38F6 0%, #6C4EF5 52%, #7B55FF 100%)",
  bluePurple: ["#4D8BFF", "#6C4EF5"],
  bluePurpleCss: "linear-gradient(135deg, #4D8BFF 0%, #6C4EF5 100%)",
  softSurface: ["#FFFFFF", "#F6F7FB"],
  softSurfaceCss: "linear-gradient(180deg, #FFFFFF 0%, #F6F7FB 100%)",
} as const;

export const semanticColors = {
  success: {
    text: colors.success,
    background: colors.softSuccess,
  },
  warning: {
    text: colors.energy,
    background: colors.softWarning,
  },
  error: {
    text: colors.error,
    background: colors.softError,
  },
  info: {
    text: colors.blue,
    background: colors.softBlue,
  },
  accent: {
    text: colors.accent,
    background: colors.softAccent,
  },
} as const;
