import { Image } from "expo-image";
import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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

type OnboardingStep = {
  id: string;
  title: string;
  accent?: string;
  body: string;
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: "career-coach",
    title: "Your AI",
    accent: "Career Coach.",
    body: "Personalized guidance, real practice, and smart feedback to help you land your dream job.",
  },
  {
    id: "practice-interviews",
    title: "Practice",
    accent: "interviews.",
    body: "Train with realistic questions for your target role.",
  },
  {
    id: "boost-cv",
    title: "Boost",
    accent: "your CV.",
    body: "Find weak bullets, missing keywords, and stronger ways to show impact.",
  },
  {
    id: "track-progress",
    title: "Land your",
    accent: "dream role.",
    body: "Stay consistent with missions, XP, streaks, and application tracking.",
  },
];

const signUpHref = "/sign-up" as Href;

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingStep>>(null);

  const horizontalPadding = width < 360 ? 22 : 30;
  const mascotSize = useMemo(() => {
    if (width < 360) {
      return { width: 205, height: 238 };
    }

    return { width: 246, height: 286 };
  }, [width]);

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

  const handleGetStarted = useCallback(() => {
    router.push(signUpHref);
  }, [router]);

  const renderStep = useCallback(
    ({ item }: { item: OnboardingStep }) => (
      <View style={[styles.slide, { width }]}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: horizontalPadding,
            paddingTop: width < 360 ? 30 : 38,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Image
              source={images.careerFoxLogoMark}
              style={{ height: 28, width: 28 }}
              contentFit="contain"
              accessibilityLabel="CareerFox logo"
            />
            <Text
              className="text-[18px] font-bold"
              style={{ color: colors.textPrimary }}
            >
              CareerFox
            </Text>
          </View>

          <View className="pt-11">
            <Text
              className="text-[31px] font-bold leading-[39px]"
              style={{ color: colors.textPrimary }}
            >
              {item.title}
            </Text>
            {item.accent ? (
              <Text
                className="text-[31px] font-bold leading-[39px]"
                style={{ color: colors.primary }}
              >
                {item.accent}
              </Text>
            ) : null}
            <Text
              className="mt-4 max-w-[310px] text-[13px] leading-[20px]"
              style={{ color: colors.textSecondary }}
            >
              {item.body}
            </Text>
          </View>

          <View style={styles.mascotWrap}>
            <Image
              source={images.careerFoxCoach}
              style={mascotSize}
              contentFit="contain"
              accessibilityLabel="Friendly CareerFox career coach mascot"
            />
          </View>
        </View>
      </View>
    ),
    [horizontalPadding, mascotSize, width],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
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
        style={{
          alignItems: "center",
          paddingHorizontal: horizontalPadding,
          paddingBottom: width < 360 ? 14 : 22,
        }}
      >
        <View className="mb-10 flex-row items-center justify-center gap-[7px]">
          {onboardingSteps.map((step, index) => {
            const isActive = activeIndex === index;

            return (
              <Pressable
                key={step.id}
                onPress={() => handleDotPress(index)}
                accessibilityRole="button"
                accessibilityLabel={`Go to onboarding step ${index + 1}`}
                className="h-7 w-7 items-center justify-center"
              >
                <View
                  className="rounded-full"
                  style={{
                    width: isActive ? 10 : 8,
                    height: isActive ? 10 : 8,
                    backgroundColor: isActive
                      ? colors.primary
                      : colors.paginationInactive,
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleGetStarted}
          accessibilityRole="button"
          className="h-[64px] w-full flex-row items-center justify-center rounded-[14px]"
          style={{
            backgroundColor: colors.primary,
            experimental_backgroundImage:
              "linear-gradient(90deg, #5B38F6 0%, #6C4EF5 52%, #7B55FF 100%)",
            boxShadow: "0 12px 24px rgba(108, 78, 245, 0.22)",
          }}
        >
          <Text className="text-[15px] font-bold text-white">Get Started</Text>
          <Text className="absolute right-7 text-[30px] leading-[30px] text-white">
            {">"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
  mascotWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
