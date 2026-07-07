import { LearningDetailScreen } from "@/components/learning/learning-detail-screen";
import { colors } from "@/constants/colors";

export default function CvScreen() {
  return (
    <LearningDetailScreen
      description="Resume and CV review lessons, bullet rewrites, role keywords, and impact checks."
      icon="doc.text.fill"
      iconBackground={colors.mutedPurple}
      iconColor={colors.primary}
      nextDescription="CV tasks will guide users through summaries, measurable bullets, keywords, and tailored application proof points."
      nextTitle="Resume coaching"
      title="Resume & CV"
    />
  );
}
