import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

const defineSymbolFallbacks = <
  const T extends Partial<Record<SFSymbol, AndroidSymbol>>,
>(
  fallbacks: T,
) => fallbacks;

const symbolFallbacks = defineSymbolFallbacks({
  "arrow.right": "arrow_forward",
  book: "menu_book",
  "book.closed": "menu_book",
  "book.closed.fill": "menu_book",
  briefcase: "business_center",
  "briefcase.fill": "business_center",
  "bell.badge.fill": "notifications_active",
  bell: "notifications",
  bolt: "bolt",
  "bolt.fill": "bolt",
  "chart.bar.xaxis": "bar_chart",
  "chart.bar.fill": "bar_chart",
  "checkmark.circle": "check_circle",
  "checkmark.circle.fill": "check_circle",
  checkmark: "done",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "keyboard_arrow_right",
  circle: "radio_button_unchecked",
  "circle.fill": "circle",
  cloud: "cloud",
  "doc.text": "description",
  "doc.text.fill": "description",
  envelope: "mail",
  eye: "visibility",
  "eye.slash": "visibility_off",
  flame: "local_fire_department",
  "flame.fill": "local_fire_department",
  house: "home",
  "house.fill": "home",
  lock: "lock",
  magnifyingglass: "search",
  megaphone: "campaign",
  "message.fill": "chat",
  mic: "mic",
  "mic.fill": "mic",
  paintpalette: "palette",
  person: "person",
  "person.fill": "person",
  "person.crop.circle.fill": "account_circle",
  sparkles: "auto_awesome",
  target: "track_changes",
  trophy: "emoji_events",
  "trophy.fill": "emoji_events",
  "waveform.path.ecg": "ecg_heart",
});

export type SymbolIconName = Extract<keyof typeof symbolFallbacks, SFSymbol>;

type SymbolIconProps = {
  accessibilityLabel?: string;
  color: ColorValue;
  name: SymbolIconName;
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
  const fallbackName = symbolFallbacks[name];

  return (
    <SymbolView
      accessibilityLabel={accessibilityLabel}
      name={{
        android: fallbackName,
        ios: name,
        web: fallbackName,
      }}
      resizeMode="scaleAspectFit"
      size={size}
      style={style}
      tintColor={color}
    />
  );
}
