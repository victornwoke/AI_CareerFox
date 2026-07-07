import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { usePostHog } from "posthog-react-native";

import { LearningDetailScreen } from "@/components/learning/learning-detail-screen";
import { colors } from "@/constants/colors";
import { learningCategories } from "@/data/interviewCategories";

export default function LearningCategoryDetailScreen() {
  const posthog = usePostHog();
  const params = useLocalSearchParams<{ categoryId?: string | string[] }>();
  const rawCategoryId = params.categoryId;
  const categoryId = Array.isArray(rawCategoryId)
    ? rawCategoryId[0]
    : rawCategoryId;
  const category = learningCategories.find((item) => item.id === categoryId);

  useEffect(() => {
    if (categoryId) {
      posthog.capture('learning_category_viewed', {
        category_id: categoryId,
        category_title: category?.title ?? null,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

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
