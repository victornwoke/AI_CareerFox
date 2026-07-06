import { useSSO } from "@clerk/expo";
import * as Linking from "expo-linking";
import { useRouter, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { getClerkErrorMessage } from "@/lib/clerkErrors";

WebBrowser.maybeCompleteAuthSession();

export type SocialAuthProvider = "Apple" | "Google" | "LinkedIn";

type SocialAuthStrategy =
  | "oauth_apple"
  | "oauth_google"
  | "oauth_linkedin"
  | "oauth_linkedin_oidc";

const goalSetupHref = "/target-role" as Href;
const redirectUrl = Linking.createURL("oauth-callback");

const socialAuthStrategies = {
  Apple: ["oauth_apple"],
  Google: ["oauth_google"],
  LinkedIn: ["oauth_linkedin_oidc", "oauth_linkedin"],
} satisfies Record<SocialAuthProvider, SocialAuthStrategy[]>;

function shouldTryNextStrategy(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase();

  return (
    normalizedMessage.includes("not enabled") ||
    normalizedMessage.includes("not configured") ||
    normalizedMessage.includes("strategy") ||
    normalizedMessage.includes("unsupported")
  );
}

export function useSocialAuth() {
  const router = useRouter();
  const { startSSOFlow } = useSSO();

  const startSocialAuth = async (provider: SocialAuthProvider) => {
    let lastError: string | undefined;

    for (const strategy of socialAuthStrategies[provider]) {
      try {
        const { createdSessionId, setActive, signIn, signUp } =
          await startSSOFlow({
            redirectUrl,
            strategy,
          });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          router.replace(goalSetupHref);
          return undefined;
        }

        if (signUp?.status === "missing_requirements") {
          return `${provider} needs more account details before we can finish signup.`;
        }

        if (signIn?.status === "needs_second_factor") {
          return `${provider} sign-in needs another verification step. Please use email sign-in for now.`;
        }

        return `We could not finish ${provider} authentication. Please try again.`;
      } catch (requestError) {
        lastError = getClerkErrorMessage(requestError);

        if (!shouldTryNextStrategy(lastError)) {
          return lastError;
        }
      }
    }

    return lastError ?? `We could not start ${provider} authentication.`;
  };

  return { startSocialAuth };
}
