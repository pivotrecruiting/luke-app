import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  headerTabToggleStyles as styles,
  TOGGLE_ICON_COLOR,
  TOGGLE_ICON_COLOR_ACTIVE,
  TOGGLE_ICON_SIZE,
} from "./header-tab-toggle.styles";

type TabConfigT<T extends string> =
  | { value: T; label: string }
  | { value: T; icon: string };

type HeaderTabTogglePropsT<T extends string> = {
  tabs: TabConfigT<T>[];
  value: T;
  onChange: (value: T) => void;
};

function isIconTab<T extends string>(
  tab: TabConfigT<T>,
): tab is { value: T; icon: string } {
  return "icon" in tab;
}

/**
 * Reusable header tab toggle for gradient headers (AddScreen, InsightsScreen).
 * Supports text tabs and icon-only tabs with consistent AddScreen styling.
 */
export function HeaderTabToggle<T extends string>({
  tabs,
  value,
  onChange,
}: HeaderTabTogglePropsT<T>) {
  return (
    <View style={styles.toggleContainer}>
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        if (isIconTab(tab)) {
          return (
            <Pressable
              key={tab.value}
              style={[
                styles.toggleButtonIcon,
                isActive && styles.toggleButtonActive,
              ]}
              onPress={() => onChange(tab.value)}
            >
              <Feather
                name={tab.icon as any}
                size={TOGGLE_ICON_SIZE}
                color={isActive ? TOGGLE_ICON_COLOR_ACTIVE : TOGGLE_ICON_COLOR}
              />
            </Pressable>
          );
        }
        return (
          <Pressable
            key={tab.value}
            style={[
              styles.toggleButton,
              isActive && styles.toggleButtonActive,
            ]}
            onPress={() => onChange(tab.value)}
          >
            <Text
              style={[
                styles.toggleButtonText,
                isActive && styles.toggleButtonTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
