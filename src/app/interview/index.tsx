import { LearningDetailScreen } from "@/components/learning/learning-detail-screen";
import { colors } from "@/constants/colors";

export default function InterviewPracticeScreen() {
  return (
    <LearningDetailScreen
      description="Mock interview practice, answer structure, and confidence drills personalized to your role and level."
      icon="mic.fill"
      iconBackground={colors.softSuccess}
      iconColor={colors.success}
      nextDescription="Behavioral, technical, HR / hiring manager, and case interview modules will open from here as the lesson flow grows."
      nextTitle="Interview modules"
      title="Interview Practice"
    />
  );
}
