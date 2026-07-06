import { colors, gradients, semanticColors } from "@/constants/colors";
import { images } from "@/constants/images";

export const typography = {
  fontFamily: {
    sans: "Poppins",
    regular: "Poppins-Regular",
    medium: "Poppins-Medium",
    semiBold: "Poppins-SemiBold",
    bold: "Poppins-Bold",
  },
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
  },
  h2: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "600",
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
  },
  h4: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "400",
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400",
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "400",
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "400",
  },
} as const;

export const spacing = {
  screenX: 24,
  screenTop: 24,
  screenBottom: 32,
  card: 20,
  controlX: 18,
  controlY: 16,
} as const;

export const radii = {
  xs: 8,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const shadows = {
  card: "0 12px 28px rgba(13, 19, 43, 0.08)",
  button: "0 12px 24px rgba(108, 78, 245, 0.22)",
  soft: "0 8px 20px rgba(13, 19, 43, 0.06)",
} as const;

export const componentStyles = {
  screen: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screenX,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.card,
    boxShadow: shadows.card,
  },
  primaryButton: {
    borderRadius: radii.md,
    boxShadow: shadows.button,
    minHeight: 64,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 56,
    paddingHorizontal: spacing.controlX,
  },
} as const;

export const theme = {
  colors,
  gradients,
  semanticColors,
  typography,
  spacing,
  radii,
  shadows,
  components: componentStyles,
  images,
} as const;

export type Theme = typeof theme;
