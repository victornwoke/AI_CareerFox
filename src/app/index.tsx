import { type Href, Redirect } from "expo-router";

const onboardingHref = "/onboarding" as Href;

export default function Index() {
  return <Redirect href={onboardingHref} />;
}
