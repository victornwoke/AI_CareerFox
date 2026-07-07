import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra;
const supportEmail =
  typeof extra?.supportEmail === "string"
    ? extra.supportEmail
    : "support@careerfox.ai";

export const legalLinks = {
  privacyPolicyUrl:
    typeof extra?.privacyPolicyUrl === "string"
      ? extra.privacyPolicyUrl
      : "https://careerfox.ai/privacy",
  supportEmail,
  supportMailto: `mailto:${supportEmail}?subject=CareerFox%20AI%20Support`,
  termsOfServiceUrl:
    typeof extra?.termsOfServiceUrl === "string"
      ? extra.termsOfServiceUrl
      : "https://careerfox.ai/terms",
} as const;
