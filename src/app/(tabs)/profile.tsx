import { TabPlaceholder } from "@/components/tabs/tab-placeholder";
import { colors } from "@/constants/colors";

export default function ProfileScreen() {
  return (
    <TabPlaceholder
      description="Career badges, milestones, and celebration moments will live here."
      iconName="rosette"
      title="Awards"
      accentColor={colors.blue}
    />
  );
}
