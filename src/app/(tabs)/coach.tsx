import { TabPlaceholder } from "@/components/tabs/tab-placeholder";
import { colors } from "@/constants/colors";

export default function CoachScreen() {
  return (
    <TabPlaceholder
      description="AI coaching and mock interview practice will live here."
      iconName="mic"
      title="Coach"
      accentColor={colors.primary}
    />
  );
}
