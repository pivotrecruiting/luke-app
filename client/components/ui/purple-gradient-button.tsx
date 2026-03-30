import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PurpleButtonGradient } from "@/constants/theme";

type PurpleGradientButtonPropsT = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedOpacity?: number;
};

/**
 * Reusable purple gradient button surface for primary actions.
 */
export function PurpleGradientButton({
  children,
  style,
  disabled = false,
  pressedOpacity = 0.92,
  ...pressableProps
}: PurpleGradientButtonPropsT) {
  return (
    <Pressable disabled={disabled} {...pressableProps}>
      {({ pressed }) => (
        <LinearGradient
          colors={
            disabled
              ? PurpleButtonGradient.disabledColors
              : PurpleButtonGradient.colors
          }
          start={PurpleButtonGradient.start}
          end={PurpleButtonGradient.end}
          style={[
            style,
            styles.base,
            pressed && !disabled ? { opacity: pressedOpacity } : null,
          ]}
        >
          {children}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
