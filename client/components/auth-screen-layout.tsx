import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing } from "@/constants/theme";
import { authScreenStyles } from "@/screens/styles/auth-screen.styles";

type AuthScreenLayoutPropsT = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Shared auth layout used by the sign-up and password recovery flows.
 */
export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthScreenLayoutPropsT) {
  const insets = useSafeAreaInsets();

  return (
    <View style={authScreenStyles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          authScreenStyles.scrollContent,
          {
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Text style={authScreenStyles.logo}>Luke</Text>

        <View style={authScreenStyles.formContainer}>
          <Text style={authScreenStyles.title}>{title}</Text>
          <Text style={authScreenStyles.subtitle}>{subtitle}</Text>
          {children}
          {footer}
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}
