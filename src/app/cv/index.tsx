import { readAsStringAsync } from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import { targetRoles } from "@/data/roles";
import { trackCvAnalysisStarted } from "@/lib/analytics";
import { extractUploadedText } from "@/lib/api";
import { useCvAnalysisStore } from "@/store/useCvAnalysisStore";

const minCvLength = 80;
const supportedDocumentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/rtf",
];

type UploadKind = "cv" | "jobDescription";

type UploadedDocument = {
  base64: string;
  mimeType: string | null;
  name: string;
  size: number | null;
  text: string | null;
};

const formatFileSize = (size: number | null) => {
  if (!size) {
    return null;
  }

  if (size >= 1_000_000) {
    return `${(size / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1000))} KB`;
};

const getUploadLabel = (kind: UploadKind) =>
  kind === "cv" ? "Upload CV" : "Upload job description";

const getDocumentPickerUnavailableMessage = () =>
  "File upload needs the latest native app build. You can still paste text here, or rebuild the iOS app to enable uploads.";

function getFileExtension(name: string): string {
  const dot = name.lastIndexOf(".");

  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

async function readPickedFileText(asset: {
  mimeType?: string | null;
  name: string;
  size?: number | null;
  uri: string;
}): Promise<UploadedDocument> {
  const mime = asset.mimeType ?? "";
  const extension = getFileExtension(asset.name);
  const base64 = await readAsStringAsync(asset.uri, {
    encoding: "base64",
  });
  let text: string | null = null;

  if (
    extension === "docx" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = await import("mammoth");
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);

      for (let index = 0; index < binaryString.length; index += 1) {
        bytes[index] = binaryString.charCodeAt(index);
      }

      const buffer = bytes.buffer;

      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      const extractedText = result.value?.trim() ?? "";

      if (extractedText.length > 0) {
        text = extractedText;
      }
    } catch {
      // Keep the uploaded file payload even if local extraction fails.
    }
  } else if (
    extension === "txt" ||
    extension === "rtf" ||
    mime.startsWith("text/")
  ) {
    try {
      const rawText = await readAsStringAsync(asset.uri);
      const trimmedText = rawText.trim();

      if (trimmedText.length > 0) {
        text = trimmedText;
      }
    } catch {
      // Keep the payload and let the server resolve text if needed.
    }
  }

  return {
    base64,
    mimeType: asset.mimeType ?? null,
    name: asset.name,
    size: asset.size ?? null,
    text,
  };
}

async function extractUploadedDocumentText(asset: {
  mimeType?: string | null;
  name: string;
  base64: string;
}): Promise<string | null> {
  try {
    const extractedText = await extractUploadedText({
      base64: asset.base64,
      fileName: asset.name,
      ...(asset.mimeType ? { mimeType: asset.mimeType } : {}),
    });
    const trimmedText = extractedText.trim();

    return trimmedText.length > 0 ? trimmedText : null;
  } catch {
    return null;
  }
}

export default function CvScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 370;
  const [cvFile, setCvFile] = useState<UploadedDocument | null>(null);
  const [cvFileText, setCvFileText] = useState<string | null>(null);
  const [cvFileUnsupported, setCvFileUnsupported] = useState(false);
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [jobDescriptionFile, setJobDescriptionFile] =
    useState<UploadedDocument | null>(null);
  const [jobDescriptionFileText, setJobDescriptionFileText] = useState<
    string | null
  >(null);
  const [jobDescriptionFileUnsupported, setJobDescriptionFileUnsupported] =
    useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCvRoleId, setSelectedCvRoleId] = useState<string | null>(null);
  const trimmedJobDescription = jobDescriptionText.trim();
  const cvFileTextValue = cvFileText?.trim() ?? "";
  const jobDescriptionFileTextValue = jobDescriptionFileText?.trim() ?? "";
  const effectiveCvText = cvFileTextValue;
  const effectiveJobDescription =
    trimmedJobDescription.length > 0
      ? trimmedJobDescription
      : jobDescriptionFileTextValue;
  const hasCvSource = effectiveCvText.length >= minCvLength || cvFile !== null;
  const hasJobDescriptionSource =
    effectiveJobDescription.length > 0 || jobDescriptionFile !== null;
  const canAnalyse = hasCvSource;
  const selectedRole = useMemo(
    () => targetRoles.find((role) => role.id === selectedCvRoleId) ?? null,
    [selectedCvRoleId],
  );

  const pickDocument = async (kind: UploadKind) => {
    setUploadError(null);

    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: supportedDocumentTypes,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        setUploadError("We could not read that file. Please try another one.");
        return;
      }

      const uploadedDocument = await readPickedFileText(asset);

      // Set the file immediately so the Analyse button is enabled now.
      // Server extraction runs in the background and updates the text
      // state when it resolves — analysis falls back to base64 if it fails.
      if (kind === "cv") {
        setCvFile({
          base64: uploadedDocument.base64,
          mimeType: uploadedDocument.mimeType,
          name: uploadedDocument.name,
          size: uploadedDocument.size,
          text: uploadedDocument.text,
        });
        setCvFileText(uploadedDocument.text);
        setCvFileUnsupported(false);

        if (!uploadedDocument.text) {
          void extractUploadedDocumentText({
            base64: uploadedDocument.base64,
            mimeType: uploadedDocument.mimeType,
            name: uploadedDocument.name,
          }).then((serverText) => {
            if (serverText) {
              setCvFileText(serverText);
            }
          });
        }

        return;
      }

      setJobDescriptionFile({
        base64: uploadedDocument.base64,
        mimeType: uploadedDocument.mimeType,
        name: uploadedDocument.name,
        size: uploadedDocument.size,
        text: uploadedDocument.text,
      });
      setJobDescriptionFileText(uploadedDocument.text);
      setJobDescriptionFileUnsupported(false);

      if (!uploadedDocument.text) {
        void extractUploadedDocumentText({
          base64: uploadedDocument.base64,
          mimeType: uploadedDocument.mimeType,
          name: uploadedDocument.name,
        }).then((serverText) => {
          if (serverText) {
            setJobDescriptionFileText(serverText);
          }
        });
      }
    } catch {
      setUploadError(getDocumentPickerUnavailableMessage());
    }
  };

  const handleAnalyse = () => {
    if (!canAnalyse) {
      return;
    }

    trackCvAnalysisStarted({
      cvInputType: cvFile ? "file" : "text",
      cvTextLength: effectiveCvText.length,
      hasJobDescription: hasJobDescriptionSource,
      targetRoleId: selectedCvRoleId,
    });

    useCvAnalysisStore.getState().setRequest({
      cvInputType: cvFile ? "file" : "text",
      cvFile: cvFile
        ? {
            base64: cvFile.base64,
            mimeType: cvFile.mimeType ?? undefined,
            name: cvFile.name,
          }
        : undefined,
      cvText: effectiveCvText || undefined,
      jobDescription: effectiveJobDescription || undefined,
      jobDescriptionFile: jobDescriptionFile
        ? {
            base64: jobDescriptionFile.base64,
            mimeType: jobDescriptionFile.mimeType ?? undefined,
            name: jobDescriptionFile.name,
          }
        : undefined,
      roleId: selectedCvRoleId,
    });

    router.push("/cv/results");
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F7F4FF]"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
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
            paddingTop: Math.max(insets.top - 20, 18),
          }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/18"
              hitSlop={10}
              onPress={() => router.back()}
            >
              <SymbolIcon color={colors.white} name="chevron.left" size={22} />
            </Pressable>

            <View className="flex-row items-center gap-2 rounded-full bg-white/16 px-3 py-2">
              <SymbolIcon color={colors.white} name="sparkles" size={16} />
              <Text className="text-[12px] font-bold leading-[16px] text-white">
                Private review
              </Text>
            </View>
          </View>

          <View className="mt-8">
            <View className="h-14 w-14 items-center justify-center rounded-[22px] bg-white/18">
              <SymbolIcon color={colors.white} name="doc.text.fill" size={30} />
            </View>
            <Text className="mt-5 text-[30px] font-bold leading-[36px] text-white">
              CV Coach
            </Text>
            <Text className="mt-2 max-w-[310px] text-[16px] font-semibold leading-[24px] text-white/76">
              Paste or upload your CV, then add a job description for sharper
              feedback.
            </Text>
          </View>

          <View className="mt-6 flex-row gap-3">
            <View className="min-h-[86px] flex-1 rounded-[22px] bg-white/15 px-4 py-4">
              <Text className="text-[23px] font-bold leading-[28px] text-white">
                8
              </Text>
              <Text className="mt-1 text-[12px] font-bold leading-[16px] text-white/78">
                Focus checks
              </Text>
            </View>
            <View className="min-h-[86px] flex-1 rounded-[22px] bg-white/15 px-4 py-4">
              <Text className="text-[23px] font-bold leading-[28px] text-white">
                ATS
              </Text>
              <Text className="mt-1 text-[12px] font-bold leading-[16px] text-white/78">
                Keyword scan
              </Text>
            </View>
            <View className="min-h-[86px] flex-1 rounded-[22px] bg-white/15 px-4 py-4">
              <Text className="text-[23px] font-bold leading-[28px] text-white">
                3
              </Text>
              <Text className="mt-1 text-[12px] font-bold leading-[16px] text-white/78">
                Next actions
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View
          className="-mt-4 gap-5"
          style={{ paddingHorizontal: isNarrow ? 20 : 24 }}
        >
          <View
            className="rounded-[24px] bg-white p-5"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
                  CV content
                </Text>
                <Text className="mt-1 text-[13px] font-semibold leading-[19px] text-[#8F92A8]">
                  Upload your latest CV for AI feedback.
                </Text>
              </View>
              <View className="rounded-full bg-soft-purple px-3 py-2">
                <Text className="text-[12px] font-bold leading-[15px] text-primary">
                  {cvFile ? "File ready" : "No file"}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityLabel={getUploadLabel("cv")}
              accessibilityRole="button"
              className="mt-5 min-h-[58px] flex-row items-center rounded-[18px] border border-[#E9E0FF] bg-white px-4"
              onPress={() => void pickDocument("cv")}
            >
              <View className="h-10 w-10 items-center justify-center rounded-[16px] bg-soft-purple">
                <SymbolIcon
                  color={colors.primary}
                  name="doc.text.fill"
                  size={20}
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-bold leading-[18px] text-text-primary">
                  Upload CV
                </Text>
                <Text className="mt-0.5 text-[12px] font-semibold leading-[16px] text-[#8F92A8]">
                  PDF, DOCX, TXT, or RTF
                </Text>
              </View>
              <SymbolIcon color={colors.primary} name="arrow.right" size={18} />
            </Pressable>

            {cvFile ? (
              <View className="mt-3 flex-row items-center rounded-[18px] bg-soft-purple px-4 py-3">
                <SymbolIcon
                  color={colors.primary}
                  name="checkmark.circle.fill"
                  size={18}
                />
                <View className="ml-3 flex-1">
                  <Text
                    className="text-[13px] font-bold leading-[18px] text-text-primary"
                    numberOfLines={1}
                  >
                    {cvFile.name}
                  </Text>
                  {formatFileSize(cvFile.size) ? (
                    <Text className="mt-0.5 text-[11px] font-semibold leading-[15px] text-[#8F92A8]">
                      {formatFileSize(cvFile.size)}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel="Remove uploaded CV"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => {
                    setCvFile(null);
                    setCvFileText(null);
                    setCvFileUnsupported(false);
                  }}
                >
                  <Text className="text-[12px] font-bold leading-[16px] text-primary">
                    Clear
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {cvFileUnsupported ? (
              <Text className="mt-3 text-[12px] font-semibold leading-[18px] text-[#8F92A8]">
                Pre-read failed — CareerFox will extract text from this file
                when you tap Analyse.
              </Text>
            ) : null}
          </View>

          <View
            className="rounded-[24px] bg-white p-5"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
                  Job description
                </Text>
                <Text className="mt-1 text-[13px] font-semibold leading-[19px] text-[#8F92A8]">
                  Paste or upload the role brief for tailored ATS feedback.
                </Text>
              </View>
              <View className="rounded-full bg-soft-blue px-3 py-2">
                <Text className="text-[12px] font-bold leading-[15px] text-blue">
                  Optional
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityLabel={getUploadLabel("jobDescription")}
              accessibilityRole="button"
              className="mt-5 min-h-[58px] flex-row items-center rounded-[18px] border border-[#E9E0FF] bg-white px-4"
              onPress={() => void pickDocument("jobDescription")}
            >
              <View className="h-10 w-10 items-center justify-center rounded-[16px] bg-soft-blue">
                <SymbolIcon
                  color={colors.blue}
                  name="briefcase.fill"
                  size={20}
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-bold leading-[18px] text-text-primary">
                  Upload job description
                </Text>
                <Text className="mt-0.5 text-[12px] font-semibold leading-[16px] text-[#8F92A8]">
                  PDF, DOCX, TXT, or RTF
                </Text>
              </View>
              <SymbolIcon color={colors.blue} name="arrow.right" size={18} />
            </Pressable>

            {jobDescriptionFile ? (
              <View className="mt-3 flex-row items-center rounded-[18px] bg-soft-blue px-4 py-3">
                <SymbolIcon
                  color={colors.blue}
                  name="checkmark.circle.fill"
                  size={18}
                />
                <View className="ml-3 flex-1">
                  <Text
                    className="text-[13px] font-bold leading-[18px] text-text-primary"
                    numberOfLines={1}
                  >
                    {jobDescriptionFile.name}
                  </Text>
                  {formatFileSize(jobDescriptionFile.size) ? (
                    <Text className="mt-0.5 text-[11px] font-semibold leading-[15px] text-[#8F92A8]">
                      {formatFileSize(jobDescriptionFile.size)}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel="Remove uploaded job description"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => {
                    setJobDescriptionFile(null);
                    setJobDescriptionFileText(null);
                    setJobDescriptionFileUnsupported(false);
                  }}
                >
                  <Text className="text-[12px] font-bold leading-[16px] text-blue">
                    Clear
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {jobDescriptionFileUnsupported && !trimmedJobDescription ? (
              <Text className="mt-3 text-[12px] font-semibold leading-[18px] text-[#8F92A8]">
                We could not read that file. Paste the job description text, or
                upload a .txt, .rtf, .docx, or .pdf file.
              </Text>
            ) : null}

            <TextInput
              accessibilityLabel="Job description"
              className="mt-4 min-h-[178px] rounded-[22px] border border-[#E9E0FF] bg-[#F6F2FF] px-4 py-4 text-[15px] font-semibold leading-[22px] text-text-primary"
              multiline
              onChangeText={setJobDescriptionText}
              placeholder="Paste the job description, responsibilities, requirements, and preferred skills here..."
              placeholderTextColor="#A19AB8"
              scrollEnabled
              style={{ textAlignVertical: "top" }}
              value={jobDescriptionText}
            />
          </View>

          {uploadError ? (
            <View className="rounded-[18px] bg-soft-error px-4 py-3">
              <Text className="text-[12px] font-bold leading-[18px] text-error">
                {uploadError}
              </Text>
            </View>
          ) : null}

          <View
            className="rounded-[24px] bg-white p-5"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
          >
            <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
              Target role
            </Text>
            <Text className="mt-1 text-[13px] font-semibold leading-[19px] text-[#8F92A8]">
              Optional, but it makes keyword feedback sharper.
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <Pressable
                accessibilityLabel="Use a general CV review"
                accessibilityRole="button"
                className="min-h-[42px] items-center justify-center rounded-full border px-4"
                onPress={() => setSelectedCvRoleId(null)}
                style={{
                  backgroundColor: selectedRole ? colors.white : colors.primary,
                  borderColor: selectedRole ? "#E8E1FA" : colors.primary,
                }}
              >
                <Text
                  className="text-[12px] font-bold leading-[16px]"
                  style={{ color: selectedRole ? "#8F92A8" : colors.white }}
                >
                  General review
                </Text>
              </Pressable>

              {targetRoles.map((role) => {
                const isSelected = role.id === selectedCvRoleId;

                return (
                  <Pressable
                    accessibilityLabel={`Review CV for ${role.title}`}
                    accessibilityRole="button"
                    className="min-h-[42px] flex-row items-center justify-center rounded-full border px-3"
                    key={role.id}
                    onPress={() => setSelectedCvRoleId(role.id)}
                    style={{
                      backgroundColor: isSelected
                        ? role.iconBackground
                        : colors.white,
                      borderColor: isSelected ? role.iconColor : "#E8E1FA",
                    }}
                  >
                    <SymbolIcon
                      color={isSelected ? role.iconColor : "#9A93B3"}
                      name={role.icon}
                      size={15}
                    />
                    <Text
                      className="ml-2 text-[12px] font-bold leading-[16px]"
                      style={{ color: isSelected ? role.iconColor : "#8F92A8" }}
                    >
                      {role.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            accessibilityLabel="Analyse CV"
            accessibilityRole="button"
            disabled={!canAnalyse}
            onPress={handleAnalyse}
            style={{
              boxShadow: canAnalyse
                ? "0 14px 28px rgba(108, 78, 245, 0.24)"
                : "none",
              opacity: canAnalyse ? 1 : 0.52,
            }}
          >
            <LinearGradient
              colors={gradients.primary}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={{
                alignItems: "center",
                borderRadius: 18,
                minHeight: 60,
                justifyContent: "center",
              }}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-[16px] font-bold leading-[21px] text-white">
                  Analyse CV
                </Text>
                <SymbolIcon color={colors.white} name="arrow.right" size={18} />
              </View>
            </LinearGradient>
          </Pressable>

          <View className="flex-row items-start rounded-[20px] bg-white px-4 py-4">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-soft-purple">
              <SymbolIcon color={colors.primary} name="lock" size={16} />
            </View>
            <Text className="ml-3 flex-1 text-[12px] font-semibold leading-[18px] text-[#8F92A8]">
              Your CV and job description are only sent for analysis when you
              tap Analyse.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
