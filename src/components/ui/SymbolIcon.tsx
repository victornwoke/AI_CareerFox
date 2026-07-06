import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

const symbolFallbacks: Record<string, AndroidSymbol> = {
  briefcase: "business_center",
  "chart.bar.xaxis": "bar_chart",
  "checkmark.circle.fill": "check_circle",
  checkmark: "done",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "keyboard_arrow_right",
  cloud: "cloud",
  envelope: "mail",
  eye: "visibility",
  "eye.slash": "visibility_off",
  lock: "lock",
  magnifyingglass: "search",
  megaphone: "campaign",
  paintpalette: "palette",
  person: "person",
  target: "track_changes",
  "waveform.path.ecg": "ecg_heart",
};

type SymbolIconProps = {
  accessibilityLabel?: string;
  color: ColorValue;
  name: string;
  size: number;
  style?: StyleProp<ViewStyle>;
};

export function SymbolIcon({
  accessibilityLabel,
  color,
  name,
  size,
  style,
}: SymbolIconProps) {
  const fallbackName = symbolFallbacks[name] ?? "help";

  return (
    <SymbolView
      accessibilityLabel={accessibilityLabel}
      name={{
        android: fallbackName,
        ios: name as SFSymbol,
        web: fallbackName,
      }}
      resizeMode="scaleAspectFit"
      size={size}
      style={style}
      tintColor={color}
    />
  );
}
