import type { ImageSourcePropType } from "react-native";

export const images = {
  careerFoxCoach: require("../../assets/images/mascot/careerfox-coach.png"),
  careerFoxLogoMark: require("../../assets/images/mascot/careerfox-logo-mark.png"),
  appIcon: require("../../assets/images/icon.png"),
  splashIcon: require("../../assets/images/splash-icon.png"),
  logoGlow: require("../../assets/images/logo-glow.png"),
  tabHome: require("../../assets/images/tabIcons/home.png"),
  tabExplore: require("../../assets/images/tabIcons/explore.png"),
} satisfies Record<string, ImageSourcePropType>;

export type ImageName = keyof typeof images;
