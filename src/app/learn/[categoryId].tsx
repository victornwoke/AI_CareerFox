import { useLocalSearchParams, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";

import { LearningDetailScreen } from "@/components/learning/learning-detail-screen";
import { colors } from "@/constants/colors";
import { learningCategories } from "@/data/interviewCategories";

export default function LearningCategoryDetailScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string | string[] }>();
  const rawCategoryId = params.categoryId;
  const categoryId = Array.isArray(rawCategoryId)
    ? rawCategoryId[0]
    : rawCategoryId;
  const category = learningCategories.find((item) => item.id === categoryId);
  const { width } = useWindowDimensions();
  const isPhone = width < 744;

  useEffect(() => {
    if (categoryId) {
      posthog.capture("learning_category_viewed", {
        category_id: categoryId,
        category_title: category?.title ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  if (categoryId === "technical-interviews") {
    return (
      <LearningDetailScreen
        actions={[
          {
            label: "Open interview practice",
            onPress: () => router.push("/interview"),
          },
          {
            label: "Choose a target role",
            onPress: () => router.push("/target-role"),
            variant: "secondary",
          },
        ]}
        description="Practice practical problem-solving, tradeoffs, and role-specific depth with a structured technical interview flow."
        eyebrow="Technical Track"
        hideIcon={isPhone}
        icon={category?.icon ?? "chevron.left.forwardslash.chevron.right"}
        iconBackground={category?.iconBackground ?? colors.mutedPurple}
        iconColor={category?.iconColor ?? colors.primary}
        sections={[
          {
            body: "Focus on concept checks, debugging, system design, and the real-world decisions interviewers care about.",
            bullets: [
              "Role-specific technical question banks",
              "Short practice sessions with clear progress",
              "A simple path to start a coached mock interview",
            ],
            title: "What you’ll practise",
          },
          {
            body: "Use this screen as the entry point before you jump into the practice flow.",
            bullets: [
              "Review technical gaps quickly",
              "Move into interview practice when ready",
              "Keep your plan aligned to your target role",
            ],
            title: "How to use it",
          },
        ]}
        stats={[
          { background: colors.primary, label: "Questions", value: "54+" },
          { background: colors.blue, label: "Focus areas", value: "3" },
          { background: colors.success, label: "Session", value: "15m" },
        ]}
        title={category?.title ?? "Technical Interviews"}
      />
    );
  }

  if (categoryId === "behavioral-interviews") {
    return (
      <LearningDetailScreen
        actions={[
          {
            label: "Start behavioural practice",
            onPress: () => router.push("/interview/behavioral"),
          },
          {
            label: "Open practice hub",
            onPress: () => router.push("/interview"),
            variant: "secondary",
          },
        ]}
        description="Build confident STAR answers, explain impact clearly, and practise the kinds of questions interviewers ask most often."
        eyebrow="Behavioural Track"
        hideIcon={isPhone}
        icon={category?.icon ?? "person.crop.circle.fill"}
        iconBackground={category?.iconBackground ?? colors.softSuccess}
        iconColor={category?.iconColor ?? colors.success}
        sections={[
          {
            body: "Turn stories from your experience into clear, confident answers with a simple structure.",
            bullets: [
              "STAR and XYZ answer practice",
              "Improved confidence under pressure",
              "Feedback focused on clarity and relevance",
            ],
            title: "What you’ll practise",
          },
          {
            body: "Use this screen to warm up before moving into the question flow.",
            bullets: [
              "Review common behavioural themes",
              "Spot the strongest story to use",
              "Continue into the full practice lesson",
            ],
            title: "How to use it",
          },
        ]}
        stats={[
          { background: colors.success, label: "Themes", value: "6" },
          { background: colors.primary, label: "Questions", value: "48+" },
          { background: colors.energy, label: "Session", value: "12m" },
        ]}
        title={category?.title ?? "Behavioural Interviews"}
      />
    );
  }

  if (categoryId === "skills-knowledge") {
    return (
      <LearningDetailScreen
        actions={[
          {
            label: "Open learning categories",
            onPress: () => router.push("/learn"),
          },
          {
            label: "Update target role",
            onPress: () => router.push("/target-role"),
            variant: "secondary",
          },
        ]}
        description="Strengthen the core knowledge and role-specific concepts that support interviews, CVs, and day-to-day confidence."
        eyebrow="Skills Builder"
        hideIcon={isPhone}
        icon={category?.icon ?? "book.closed"}
        iconBackground={category?.iconBackground ?? colors.softBlue}
        iconColor={category?.iconColor ?? colors.blue}
        sections={[
          {
            body: "Break down the skills you need into practical learning paths and quick drills.",
            bullets: [
              "Role-specific concept refreshers",
              "Quick drills for weak spots",
              "Save your progress as you learn",
            ],
            title: "What you’ll build",
          },
          {
            body: "Ideal when you want to close a knowledge gap before your next practice session.",
            bullets: [
              "Short lessons you can finish daily",
              "Track the skills tied to your target role",
              "Return here whenever you need a reset",
            ],
            title: "How to use it",
          },
        ]}
        stats={[
          { background: colors.blue, label: "Skill paths", value: "4" },
          { background: colors.primary, label: "Drills", value: "Quick" },
          { background: colors.success, label: "Progress", value: "Saved" },
        ]}
        title={category?.title ?? "Skills & Knowledge"}
      />
    );
  }

  if (categoryId === "career-guidance") {
    return (
      <LearningDetailScreen
        actions={[
          {
            label: "Review your career plan",
            onPress: () => router.push("/profile"),
          },
          {
            label: "Go to today’s plan",
            onPress: () => router.push("/home"),
            variant: "secondary",
          },
        ]}
        description="Use this path to clarify your goals, tighten your focus, and turn a vague job search into a practical weekly plan."
        headerSubtitle="Clarify goals, next steps, and career direction."
        headerTitle="Career Guidance"
        hideIcon={isPhone}
        icon={category?.icon ?? "target"}
        iconBackground={category?.iconBackground ?? colors.softEnergy}
        iconColor={category?.iconColor ?? colors.energy}
        sections={[
          {
            body: "Keep your job search aligned with the role you want and the habits you need to build.",
            bullets: [
              "Clarify the target role and level",
              "Turn uncertainty into a next-step plan",
              "Keep momentum with a daily routine",
            ],
            title: "What you’ll use it for",
          },
          {
            body: "This screen works as a home base for the broader direction of your career preparation.",
            bullets: [
              "Check your current focus",
              "Return to your coaching plan quickly",
              "Use progress to guide next actions",
            ],
            title: "How to use it",
          },
        ]}
        stats={[
          { background: colors.energy, label: "Plan", value: "Weekly" },
          { background: colors.primary, label: "Focus", value: "Clear" },
          { background: colors.blue, label: "Direction", value: "Tracked" },
        ]}
        title={category?.title ?? "Career Guidance"}
      />
    );
  }

  return (
    <LearningDetailScreen
      description={
        category?.description ??
        "This learning path is being prepared for a future CareerFox AI lesson."
      }
      icon={category?.icon ?? "book.closed"}
      iconBackground={category?.iconBackground ?? colors.mutedPurple}
      iconColor={category?.iconColor ?? colors.primary}
      title={category?.title ?? "Learning Category"}
    />
  );
}
