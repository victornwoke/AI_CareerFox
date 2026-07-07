import { Image } from "expo-image";
import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { images } from "@/constants/images";
import { trackOnboardingStarted } from "@/lib/analytics";

type OnboardingStep = {
  id: string;
  title: string[];
  body: string;
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: "practice",
    title: ["Practice Interviews.", "Boost Your Skills."],
    body: "AI-powered mock interviews tailored to your dream role and experience level.",
  },
  {
    id: "feedback",
    title: ["Get Smart Feedback.", "Improve Faster."],
    body: "Turn every answer into clear next steps for stronger, more confident interviews.",
  },
  {
    id: "progress",
    title: ["Build Career Habits.", "Land Your Role."],
    body: "Stay consistent with missions, XP, streaks, and application tracking.",
  },
];

const signUpHref = "/sign-up" as Href;

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingStep>>(null);

  useEffect(() => {
    trackOnboardingStarted();
  }, []);

  const horizontalPadding = width < 360 ? 22 : 24;
  const mascotSize = useMemo(
    () => ({
      width: Math.min(width * 0.523, 204),
      height: Math.min(width * 0.613, 239),
    }),
    [width],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      setActiveIndex(nextIndex);
    },
    [width],
  );

  const handleDotPress = useCallback(
    (index: number) => {
      listRef.current?.scrollToIndex({ animated: true, index });
      setActiveIndex(index);
    },
    [],
  );

  const handleSignUp = useCallback(() => {
    router.push(signUpHref);
  }, [router]);

  const handleNext = useCallback(() => {
    const nextIndex = activeIndex + 1;

    if (nextIndex >= onboardingSteps.length) {
      router.push(signUpHref);
      return;
    }

    listRef.current?.scrollToIndex({ animated: true, index: nextIndex });
    setActiveIndex(nextIndex);
  }, [activeIndex, router]);

  const renderStep = useCallback(
    ({ item }: { item: OnboardingStep }) => (
      <View style={[styles.slide, { width }]}>
        <View style={styles.slideInner}>
          <Image
            source={images.careerFoxOnboardingCard}
            style={[styles.mascotCard, mascotSize]}
            contentFit="contain"
            accessibilityLabel="CareerFox interview coach mascot"
          />

          <View style={styles.copyWrap}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>CareerFox</Text>
              <View style={styles.aiPill}>
                <Text style={styles.aiText}>AI</Text>
              </View>
            </View>

            <View style={styles.headlineWrap}>
              {item.title.map((line) => (
                <Text key={line} style={styles.headline}>
                  {line}
                </Text>
              ))}
            </View>

            <Text style={styles.body}>{item.body}</Text>
          </View>
        </View>
      </View>
    ),
    [mascotSize, width],
  );

  const buttonLabel =
    activeIndex === onboardingSteps.length - 1 ? "Get Started" : "Next";

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Pressable
          onPress={handleSignUp}
          accessibilityRole="button"
          style={[styles.skipButton, { right: horizontalPadding }]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <FlatList
          ref={listRef}
          style={styles.slider}
          contentContainerStyle={styles.sliderContent}
          data={onboardingSteps}
          keyExtractor={(item) => item.id}
          renderItem={renderStep}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleScrollEnd}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: width < 360 ? 32 : 48,
            },
          ]}
        >
          <View style={styles.pagination}>
            {onboardingSteps.map((step, index) => {
              const isActive = activeIndex === index;

              return (
                <Pressable
                  key={step.id}
                  onPress={() => handleDotPress(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to onboarding step ${index + 1}`}
                  style={styles.dotHitArea}
                >
                  <View
                    style={[
                      styles.dot,
                      isActive ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleNext}
            accessibilityRole="button"
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>
              {buttonLabel}
              <Text> -&gt;</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  skipButton: {
    position: "absolute",
    top: 35,
    zIndex: 2,
    minHeight: 44,
    justifyContent: "center",
  },
  skipText: {
    color: colors.onboardingSkipText,
    fontSize: 15,
    fontWeight: "800",
  },
  slider: {
    flex: 1,
  },
  sliderContent: {
    flexGrow: 1,
  },
  slide: {
    flex: 1,
  },
  slideInner: {
    flex: 1,
    alignItems: "center",
    paddingTop: 141,
  },
  mascotCard: {
    borderRadius: 40,
  },
  copyWrap: {
    alignItems: "center",
    paddingTop: 38,
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  brandText: {
    color: colors.background,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: 0,
  },
  aiPill: {
    minWidth: 29,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.onboardingSoftWhite,
    paddingHorizontal: 8,
  },
  aiText: {
    color: colors.background,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
  },
  headlineWrap: {
    paddingTop: 31,
    alignItems: "center",
  },
  headline: {
    color: colors.background,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0,
  },
  body: {
    maxWidth: 326,
    paddingTop: 18,
    color: colors.onboardingMutedText,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0,
  },
  footer: {
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  dotHitArea: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.background,
  },
  inactiveDot: {
    width: 10,
    backgroundColor: colors.onboardingDotInactive,
  },
  nextButton: {
    width: "100%",
    minHeight: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  nextButtonText: {
    color: colors.primary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    textAlign: "center",
  },
});
