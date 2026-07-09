import { useRouter } from "expo-router";
import {
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon, type SymbolIconName } from "@/components/ui/SymbolIcon";
import { colors } from "@/constants/colors";

type LearningDetailSection = {
  body: string;
  bullets: string[];
  title: string;
};

type LearningDetailStat = {
  background: string;
  label: string;
  value: string;
};

type LearningDetailAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

type LearningDetailScreenProps = {
  actions?: LearningDetailAction[];
  description: string;
  eyebrow?: string;
  headerSubtitle?: string;
  headerTitle?: string;
  hideIcon?: boolean;
  icon: SymbolIconName;
  iconBackground: string;
  iconColor: string;
  sections?: LearningDetailSection[];
  stats?: LearningDetailStat[];
  nextDescription?: string;
  nextTitle?: string;
  title: string;
};

export function LearningDetailScreen({
  actions = [],
  description,
  eyebrow,
  headerSubtitle,
  headerTitle,
  hideIcon = false,
  icon,
  iconBackground,
  iconColor,
  sections,
  stats,
  nextDescription = "Structured lessons, practice prompts, XP rewards, and saved progress will be added here as this path grows.",
  nextTitle = "Coming next",
  title,
}: LearningDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const displayHeaderTitle = headerTitle ?? title;
  const isCompact = width < 380;
  const horizontalPadding = isCompact ? 20 : 24;
  const headerTitleSize = isCompact ? 21 : 23;
  const bodyDescriptionSize = isCompact ? 15 : 16;

  return (
    <View className="flex-1 bg-[#F6F2FF]">
      <View
        className="bg-[#F6F2FF] px-6"
        style={{
          paddingBottom: isCompact ? 10 : 12,
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
          paddingTop: Math.max(insets.top + 12, 32),
        }}
      >
        <View className="flex-row items-center gap-4">
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
            onPress={() => router.back()}
            style={{ boxShadow: "0 8px 20px rgba(13, 19, 43, 0.06)" }}
          >
            <SymbolIcon
              accessibilityLabel="Back"
              color={colors.textPrimary}
              name="chevron.right"
              size={20}
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </Pressable>

          <View className="flex-1">
            <Text
              adjustsFontSizeToFit
              className="text-[23px] font-bold leading-[28px] text-text-primary"
              minimumFontScale={0.68}
              numberOfLines={2}
              style={{ fontSize: headerTitleSize }}
            >
              {displayHeaderTitle}
            </Text>
            {headerSubtitle ? (
              <Text
                adjustsFontSizeToFit
                className="mt-1 text-[13px] font-semibold leading-[18px] text-[#8F92A8]"
                minimumFontScale={0.74}
                numberOfLines={2}
              >
                {headerSubtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: horizontalPadding,
          paddingTop: isCompact ? 6 : 8,
        }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="mt-5 rounded-[28px] bg-white px-6 py-8"
          style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
        >
          {!hideIcon ? (
            <View
              className="h-20 w-20 items-center justify-center rounded-[28px]"
              style={{ backgroundColor: iconBackground }}
            >
              <SymbolIcon
                accessibilityLabel={title}
                color={iconColor}
                name={icon}
                size={38}
              />
            </View>
          ) : null}
          {eyebrow ? (
            <View className="mt-4 self-start rounded-full bg-[#F3EEFF] px-3 py-1.5">
              <Text className="text-[12px] font-bold leading-[16px] text-primary">
                {eyebrow}
              </Text>
            </View>
          ) : null}
          <Text
            className="mt-3 font-semibold leading-[22px] text-[#8F92A8]"
            style={{ fontSize: bodyDescriptionSize }}
          >
            {description}
          </Text>

          {stats?.length ? (
            <View className="mt-6 flex-row flex-wrap gap-3">
              {stats.map((stat) => (
                <View
                  className="min-h-[82px] flex-1 rounded-[22px] px-4 py-4"
                  key={`${stat.label}-${stat.value}`}
                  style={{ backgroundColor: stat.background }}
                >
                  <Text
                    adjustsFontSizeToFit
                    className="text-[22px] font-bold leading-[26px] text-white"
                    minimumFontScale={0.7}
                    numberOfLines={1}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    adjustsFontSizeToFit
                    className="mt-1 text-[12px] font-bold leading-[16px] text-white/80"
                    minimumFontScale={0.7}
                    numberOfLines={1}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {sections?.length ? (
            <View className="mt-6 gap-3">
              {sections.map((section) => (
                <View
                  className="rounded-[24px] bg-[#F6F2FF] px-4 py-4"
                  key={section.title}
                >
                  <Text className="text-[15px] font-bold leading-[21px] text-text-primary">
                    {section.title}
                  </Text>
                  <Text className="mt-2 text-[13px] font-semibold leading-[19px] text-[#8F92A8]">
                    {section.body}
                  </Text>
                  <View className="mt-3 gap-2">
                    {section.bullets.map((bullet) => (
                      <View
                        className="flex-row items-start gap-2 rounded-[16px] bg-white px-3 py-2"
                        key={bullet}
                      >
                        <View className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <Text className="flex-1 text-[12px] font-semibold leading-[17px] text-text-primary">
                          {bullet}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="mt-6 rounded-[22px] bg-[#F6F2FF] px-5 py-5">
              <Text className="text-[15px] font-bold leading-[21px] text-text-primary">
                {nextTitle}
              </Text>
              <Text className="mt-2 text-[13px] font-semibold leading-[19px] text-[#8F92A8]">
                {nextDescription}
              </Text>
            </View>
          )}

          {actions.length ? (
            <View className="mt-6 gap-3">
              {actions.map((action) => {
                const isPrimary = action.variant !== "secondary";

                return (
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[52px] items-center justify-center rounded-[18px]"
                    key={action.label}
                    onPress={action.onPress}
                    style={{
                      backgroundColor: isPrimary ? colors.primary : "#F3EEFF",
                    }}
                  >
                    <Text
                      className="text-[15px] font-bold leading-[21px]"
                      style={{
                        color: isPrimary ? colors.white : colors.primary,
                      }}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
