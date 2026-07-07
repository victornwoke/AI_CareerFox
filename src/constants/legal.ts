import Constants from "expo-constants";

import { legalDefaults } from "../../config/legal-defaults";

const extra = Constants.expoConfig?.extra;
const supportEmail =
  typeof extra?.supportEmail === "string"
    ? extra.supportEmail
    : legalDefaults.supportEmail;

export const legalLinks = {
  privacyPolicyUrl:
    typeof extra?.privacyPolicyUrl === "string"
      ? extra.privacyPolicyUrl
      : legalDefaults.privacyPolicyUrl,
  supportEmail,
  supportMailto: `mailto:${supportEmail}?subject=CareerFox%20AI%20Support`,
  termsOfServiceUrl:
    typeof extra?.termsOfServiceUrl === "string"
      ? extra.termsOfServiceUrl
      : legalDefaults.termsOfServiceUrl,
} as const;
