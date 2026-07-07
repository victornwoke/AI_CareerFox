import { TabPlaceholder } from "@/components/tabs/tab-placeholder";
import { colors } from "@/constants/colors";

export default function LearnScreen() {
  return (
    <TabPlaceholder
      description="Learning paths and interview skill categories will live here."
      iconName="book.closed"
      title="Learn"
      accentColor={colors.success}
    />
  );
}
