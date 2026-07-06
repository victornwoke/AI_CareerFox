import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors } from "@/constants/colors";
import { componentStyles } from "@/constants/theme";

type AuthFieldProps = {
  icon: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  textContentType?: TextInputProps["textContentType"];
  value: string;
  onToggleSecure?: () => void;
};

export function AuthField({
  icon,
  onChangeText,
  placeholder,
  secureTextEntry,
  showToggle,
  textContentType,
  value,
  onToggleSecure,
}: AuthFieldProps) {
  const isEmailField = textContentType === "emailAddress";
  const isPasswordField =
    textContentType === "password" || textContentType === "newPassword";

  return (
    <View style={[componentStyles.input, styles.container]}>
      <SymbolIcon
        color={colors.authMuted}
        name={icon}
        size={22}
      />
      <TextInput
        accessibilityLabel={placeholder}
        autoCapitalize={isEmailField || isPasswordField ? "none" : "sentences"}
        className="flex-1 text-[16px] font-semibold text-text-primary"
        inputMode={isEmailField ? "email" : "text"}
        keyboardType={isEmailField ? "email-address" : "default"}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.authMuted}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        value={value}
      />
      {showToggle ? (
        <Pressable
          accessibilityLabel={secureTextEntry ? "Show password" : "Hide password"}
          accessibilityRole="button"
          className="h-10 w-10 items-end justify-center"
          onPress={onToggleSecure}
        >
          <SymbolIcon
            accessibilityLabel={secureTextEntry ? "Show password" : "Hide password"}
            color={colors.authMuted}
            name={secureTextEntry ? "eye" : "eye.slash"}
            size={22}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
});
