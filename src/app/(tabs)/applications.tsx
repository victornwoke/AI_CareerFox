import { TabPlaceholder } from "@/components/tabs/tab-placeholder";
import { colors } from "@/constants/colors";

export default function ApplicationsScreen() {
  return (
    <TabPlaceholder
      description="Job applications and follow-up tracking will live here."
      iconName="briefcase"
      title="Applications"
      accentColor={colors.energy}
    />
  );
}
