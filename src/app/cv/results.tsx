import { useAuth } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon, type SymbolIconName } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import { targetRoles } from "@/data/roles";
import { trackCvAnalysisCompleted } from "@/lib/analytics";
import { postCvFeedback } from "@/lib/api";
import type { CvFeedbackOutput } from "@/lib/server/aiFeedback";
import { useCareerStore } from "@/store/useCareerStore";
import { useCvAnalysisStore } from "@/store/useCvAnalysisStore";

type ScoreMetric = {
  color: string;
  key: keyof CvFeedbackOutput["categories"];
  label: string;
};

const categoryMetrics: ScoreMetric[] = [
  { color: colors.primary, key: "clarity", label: "Clarity" },
  { color: colors.energy, key: "impact", label: "Impact" },
  { color: colors.success, key: "relevance", label: "Relevance" },
  { color: colors.blue, key: "atsReadability", label: "ATS readability" },
  { color: colors.accent, key: "roleAlignment", label: "Role alignment" },
];

function normalizeUploadedFile(
  file:
    | {
        base64: string;
        mimeType?: string | null;
        name: string;
      }
    | undefined,
) {
  if (!file) {
    return undefined;
  }

  return {
    base64: file.base64,
    ...(file.mimeType ? { mimeType: file.mimeType } : {}),
    name: file.name,
  };
}

function ProgressBar({ color, progress }: { color: string; progress: number }) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View className="h-2 overflow-hidden rounded-full bg-[#EEE9FF]">
      <View
        className="h-full rounded-full"
        style={{ backgroundColor: color, width: `${clampedProgress}%` }}
      />
    </View>
  );
}

function ResultSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View
      className="rounded-[24px] bg-white p-5"
      style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
    >
      <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
        {title}
      </Text>
      <View className="mt-4 gap-3">{children}</View>
    </View>
  );
}

function BulletItem({
  background = colors.softPurple,
  children,
  icon = "checkmark.circle.fill",
  iconColor = colors.primary,
}: {
  background?: string;
  children: React.ReactNode;
  icon?: SymbolIconName;
  iconColor?: string;
}) {
  return (
    <View
      className="flex-row items-start rounded-[18px] px-4 py-4"
      style={{ backgroundColor: background }}
    >
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-white">
        <SymbolIcon color={iconColor} name={icon} size={17} />
      </View>
      <Text className="ml-3 flex-1 text-[13px] font-semibold leading-[20px] text-text-primary">
        {children}
      </Text>
    </View>
  );
}

export default function CvResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { width } = useWindowDimensions();
  const request = useCvAnalysisStore((state) => state.request);
  const selectedExperienceLevel = useCareerStore(
    (state) => state.selectedExperienceLevel,
  );

  const [feedback, setFeedback] = useState<CvFeedbackOutput | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  const selectedRole =
    targetRoles.find((role) => role.id === request?.roleId) ?? null;
  const targetRoleTitle = selectedRole?.title ?? "General CV review";
  const isNarrow = width < 370;
  const hasCvText = Boolean(request?.cvText?.trim());
  const hasCvFile = Boolean(request?.cvFile?.base64);

  const preconditionError = request
    ? !hasCvText && !hasCvFile
      ? "Add your CV or re-upload the file so CareerFox can review it."
      : !userId
        ? "Sign in again to analyse your CV."
        : null
    : null;

  const runFetch = useCallback(async () => {
    if (!request || !userId) {
      setStatus("error");
      setError("Sign in again to analyse your CV.");
      return;
    }

    if (!request.cvText?.trim() && !request.cvFile?.base64) {
      setStatus("error");
      setError("Add your CV or re-upload the file so CareerFox can review it.");
      return;
    }

    try {
      const result = await postCvFeedback({
        cvFile: normalizeUploadedFile(request.cvFile),
        cvText: request.cvText?.trim() || undefined,
        experienceLevel: selectedExperienceLevel ?? undefined,
        jobDescription: request.jobDescription?.trim() || undefined,
        jobDescriptionFile: normalizeUploadedFile(request.jobDescriptionFile),
        targetRole: targetRoleTitle,
        userId,
      });

      setFeedback(result);
      setStatus("success");
      trackCvAnalysisCompleted({
        atsKeywordGapCount: result.keywordGaps.length,
        hasJobDescription:
          Boolean(request.jobDescription) ||
          Boolean(request.jobDescriptionFile),
        score: result.score,
        targetRoleId: request.roleId,
      });
    } catch (caughtError) {
      setStatus("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "CareerFox could not analyse your CV right now.",
      );
    }
  }, [request, selectedExperienceLevel, targetRoleTitle, userId]);

  useEffect(() => {
    if (!request || preconditionError || !userId) {
      return;
    }

    let active = true;

    (async () => {
      try {
        const result = await postCvFeedback({
          cvFile: normalizeUploadedFile(request.cvFile),
          cvText: request.cvText?.trim() || undefined,
          experienceLevel: selectedExperienceLevel ?? undefined,
          jobDescription: request.jobDescription?.trim() || undefined,
          jobDescriptionFile: normalizeUploadedFile(request.jobDescriptionFile),
          targetRole: targetRoleTitle,
          userId,
        });

        if (!active) {
          return;
        }

        setFeedback(result);
        setStatus("success");
        trackCvAnalysisCompleted({
          atsKeywordGapCount: result.keywordGaps.length,
          hasJobDescription:
            Boolean(request.jobDescription) ||
            Boolean(request.jobDescriptionFile),
          score: result.score,
          targetRoleId: request.roleId,
        });
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setStatus("error");
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "CareerFox could not analyse your CV right now.",
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [
    request,
    preconditionError,
    userId,
    selectedExperienceLevel,
    targetRoleTitle,
  ]);

  const displayStatus: "loading" | "success" | "error" = preconditionError
    ? "error"
    : status;
  const displayError = preconditionError ?? error;
  const isPreconditionError = Boolean(preconditionError);

  if (!request) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F4FF] px-6">
        <View
          className="w-full max-w-[340px] items-center rounded-[28px] bg-white px-7 py-8"
          style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
        >
          <Text className="text-center text-[20px] font-bold leading-[26px] text-text-primary">
            Start a CV review
          </Text>
          <Text className="mt-2 text-center text-[14px] font-semibold leading-[21px] text-[#8F92A8]">
            Paste your CV in the CV Coach and tap Analyse to see feedback.
          </Text>
          <Pressable
            accessibilityLabel="Back to CV Coach"
            accessibilityRole="button"
            className="mt-6 w-full overflow-hidden rounded-[18px]"
            onPress={() => router.back()}
            style={{ boxShadow: "0 12px 24px rgba(108, 78, 245, 0.22)" }}
          >
            <LinearGradient
              colors={gradients.primary}
              end={{ x: 1, y: 0.5 }}
              start={{ x: 0, y: 0.5 }}
              style={{
                alignItems: "center",
                minHeight: 56,
                justifyContent: "center",
              }}
            >
              <Text className="text-[16px] font-bold leading-[22px] text-white">
                Back
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  const overallScore = feedback?.score ?? null;
  const featuredMetrics = categoryMetrics.slice(0, 3);
  const isLoading = displayStatus === "loading";

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={gradients.primary}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          paddingHorizontal: isNarrow ? 20 : 24,
          paddingTop: Math.max(insets.top - 20, 18),
          paddingBottom: 14,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Go back to CV Coach"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/18"
            hitSlop={10}
            onPress={() => router.back()}
          >
            <SymbolIcon color={colors.white} name="chevron.left" size={22} />
          </Pressable>

          <View className="flex-row items-center gap-2 rounded-full bg-white/16 px-3 py-2">
            <SymbolIcon color={colors.white} name="doc.text.fill" size={15} />
            <Text className="text-[12px] font-bold leading-[16px] text-white">
              {isLoading
                ? "Analysing"
                : displayStatus === "error"
                  ? "Analysis"
                  : "AI review"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F7F4FF]"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.primary}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{
            borderBottomLeftRadius: 46,
            borderBottomRightRadius: 46,
            paddingBottom: 34,
            paddingHorizontal: isNarrow ? 20 : 24,
            paddingTop: 8,
          }}
        >
          <View className="mt-7 flex-row items-end justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[15px] font-bold leading-[20px] text-white/76">
                Overall CV score
              </Text>
              {isLoading || overallScore === null ? (
                <View className="mt-2 h-[60px] items-start justify-center">
                  <ActivityIndicator color={colors.white} size="large" />
                </View>
              ) : (
                <Text className="mt-2 text-[54px] font-bold leading-[60px] text-white">
                  {overallScore}%
                </Text>
              )}
              <Text className="mt-2 text-[15px] font-semibold leading-[22px] text-white/76">
                {feedback
                  ? `Good base for ${selectedRole?.title ?? "your target role"}, with stronger impact bullets needed.`
                  : "Reviewing your CV now."}
              </Text>
            </View>

            <View className="h-[104px] w-[104px] items-center justify-center rounded-full bg-white/16">
              <View className="h-[76px] w-[76px] items-center justify-center rounded-full bg-white">
                <SymbolIcon color={colors.primary} name="sparkles" size={32} />
              </View>
            </View>
          </View>

          {feedback ? (
            <View className="mt-6 flex-row gap-3">
              {featuredMetrics.map((metric) => (
                <View
                  className="min-h-[86px] flex-1 rounded-[22px] bg-white/15 px-3 py-4"
                  key={metric.key}
                >
                  <Text className="text-[23px] font-bold leading-[28px] text-white">
                    {feedback.categories[metric.key]}%
                  </Text>
                  <Text
                    adjustsFontSizeToFit
                    className="mt-1 text-[12px] font-bold leading-[16px] text-white/78"
                    minimumFontScale={0.72}
                    numberOfLines={2}
                  >
                    {metric.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </LinearGradient>

        <View
          className="-mt-4 gap-5"
          style={{ paddingHorizontal: isNarrow ? 20 : 24 }}
        >
          {displayStatus === "error" ? (
            <View
              className="rounded-[22px] bg-soft-error px-5 py-6"
              style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
            >
              <View className="flex-row items-center gap-2">
                <SymbolIcon
                  color={colors.error}
                  name="xmark.circle.fill"
                  size={20}
                />
                <Text className="text-[16px] font-bold leading-[22px] text-error">
                  Analysis failed
                </Text>
              </View>
              <Text className="mt-2 text-[13px] font-semibold leading-[20px] text-error">
                {displayError}
              </Text>
              <Pressable
                accessibilityLabel="Try CV analysis again"
                accessibilityRole="button"
                className="mt-5 w-full overflow-hidden rounded-[18px]"
                onPress={() => {
                  if (isPreconditionError) {
                    router.back();
                    return;
                  }

                  setStatus("loading");
                  setError(null);
                  void runFetch();
                }}
                style={{ boxShadow: "0 12px 24px rgba(255, 77, 79, 0.22)" }}
              >
                <LinearGradient
                  colors={[colors.error, "#FF6B6B"]}
                  end={{ x: 1, y: 0.5 }}
                  start={{ x: 0, y: 0.5 }}
                  style={{
                    alignItems: "center",
                    minHeight: 54,
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-[15px] font-bold leading-[20px] text-white">
                    Try again
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {feedback?.isAiFallback ? (
            <View
              className="flex-row items-center gap-3 rounded-[18px] bg-[#FFF8E6] px-4 py-4"
              style={{ boxShadow: "0 4px 12px rgba(255, 160, 0, 0.10)" }}
            >
              <Text className="text-[18px]">⚠️</Text>
              <Text className="flex-1 text-[13px] font-semibold leading-[20px] text-[#92400E]">
                AI analysis is temporarily unavailable — showing an offline
                template. Please try again in a moment for full personalised
                feedback.
              </Text>
            </View>
          ) : null}

          {isLoading || feedback ? (
            <ResultSection title="Score breakdown">
              {categoryMetrics.map((metric) => {
                const value = feedback ? feedback.categories[metric.key] : 0;

                return (
                  <View key={metric.key}>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-[14px] font-bold leading-[18px] text-text-primary">
                        {metric.label}
                      </Text>
                      <Text
                        className="text-[14px] font-bold leading-[18px]"
                        style={{ color: metric.color }}
                      >
                        {isLoading ? "—" : `${value}%`}
                      </Text>
                    </View>
                    <ProgressBar color={metric.color} progress={value} />
                  </View>
                );
              })}
            </ResultSection>
          ) : null}

          {isLoading || feedback ? (
            <ResultSection title="ATS keyword gaps">
              <View className="flex-row flex-wrap gap-2">
                {(feedback?.keywordGaps ?? []).map((keyword) => (
                  <View
                    className="min-h-[40px] justify-center rounded-full border border-[#E9E0FF] bg-soft-purple px-4"
                    key={keyword}
                  >
                    <Text className="text-[12px] font-bold leading-[16px] text-primary">
                      {keyword}
                    </Text>
                  </View>
                ))}
                {isLoading && feedback === null ? (
                  <Text className="text-[13px] font-semibold leading-[20px] text-[#8F92A8]">
                    Finding keyword gaps for your target role…
                  </Text>
                ) : null}
              </View>
              {feedback ? (
                <Text className="text-[13px] font-semibold leading-[20px] text-[#8F92A8]">
                  {request.jobDescription
                    ? "These are matched against the supplied job description. Add them only where they honestly reflect your experience."
                    : "Add a job description next time to make these gaps more specific to the role."}
                </Text>
              ) : null}
            </ResultSection>
          ) : null}

          {renderBulletSection(
            "Weak bullet points",
            feedback?.weakBullets ?? [],
            isLoading,
            colors.softEnergy,
            "bolt.fill",
            colors.energy,
          )}

          {renderBulletSection(
            "Improved bullet suggestions",
            feedback?.improvedBullets ?? [],
            isLoading,
            colors.softSuccess,
            "checkmark.circle.fill",
            colors.success,
          )}

          {isLoading || feedback ? (
            <ResultSection title="Recommended next actions">
              {(feedback?.nextActions ?? []).map((action, index) => (
                <View
                  className="flex-row items-start rounded-[18px] bg-[#F8F6FF] px-4 py-4"
                  key={action}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
                    <Text className="text-[13px] font-bold leading-[17px] text-primary">
                      {index + 1}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="mb-1 flex-row items-center gap-2">
                      <SymbolIcon
                        color={colors.primary}
                        name="arrow.right"
                        size={15}
                      />
                      <Text className="text-[13px] font-bold leading-[18px] text-primary">
                        Next step
                      </Text>
                    </View>
                    <Text className="text-[13px] font-semibold leading-[20px] text-text-primary">
                      {action}
                    </Text>
                  </View>
                </View>
              ))}
            </ResultSection>
          ) : null}

          <Pressable
            accessibilityLabel="Analyse another CV"
            accessibilityRole="button"
            className="min-h-[58px] items-center justify-center rounded-[18px] bg-white"
            disabled={isLoading}
            onPress={() => router.back()}
            style={{ boxShadow: "0 10px 24px rgba(13, 19, 43, 0.06)" }}
          >
            <Text className="text-[15px] font-bold leading-[20px] text-primary">
              Analyse another CV
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function renderBulletSection(
  title: string,
  bullets: string[],
  isLoading: boolean,
  background: string,
  icon: SymbolIconName,
  iconColor: string,
) {
  if (!isLoading && bullets.length === 0) {
    return null;
  }

  return (
    <ResultSection title={title}>
      {bullets.map((bullet) => (
        <BulletItem
          background={background}
          icon={icon}
          iconColor={iconColor}
          key={bullet}
        >
          {bullet}
        </BulletItem>
      ))}
      {isLoading && bullets.length === 0 ? (
        <Text className="text-[13px] font-semibold leading-[20px] text-[#8F92A8]">
          Reviewing your bullets…
        </Text>
      ) : null}
    </ResultSection>
  );
}
