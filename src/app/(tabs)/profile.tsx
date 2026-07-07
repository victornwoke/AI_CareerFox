import { TabPlaceholder } from "@/components/tabs/tab-placeholder";
import { colors } from "@/constants/colors";

export default function ProfileScreen() {
  return (
    <TabPlaceholder
      description="Career goals, progress, and account settings will live here."
      iconName="person"
      title="Profile"
      accentColor={colors.blue}
    />
  );
}
