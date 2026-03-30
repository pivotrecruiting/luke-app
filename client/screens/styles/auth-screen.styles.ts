import { StyleSheet } from "react-native";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";

export const authScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  logo: {
    ...Typography.h1,
    color: Colors.light.text,
    fontWeight: "700",
    fontSize: 30,
  },
  formContainer: {
    marginTop: 64,
    paddingHorizontal: Spacing["2xl"],
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
  },
  title: {
    ...Typography.h3,
    color: Colors.light.text,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.small,
    color: "#6B7280",
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing["3xl"],
    ...Typography.body,
    color: Colors.light.text,
  },
  inputWithTightSpacing: {
    marginTop: Spacing.md,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  inlineErrorText: {
    ...Typography.small,
    width: "100%",
    color: "#EF4444",
    marginTop: Spacing.xs,
  },
  primaryButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#1A1A1A",
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  primaryButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    width: "100%",
    height: 48,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: "#000000",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successMessageContainer: {
    width: "100%",
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.light.successBackground,
    borderWidth: 1,
    borderColor: Colors.light.successBorder,
  },
  successMessageText: {
    ...Typography.small,
    color: Colors.light.success,
    textAlign: "center",
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: Spacing.sm,
  },
  forgotPasswordText: {
    ...Typography.small,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: Spacing["2xl"],
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    ...Typography.small,
    color: "#9CA3AF",
    paddingHorizontal: Spacing.lg,
  },
  socialButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: BorderRadius.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  socialButtonText: {
    ...Typography.body,
    fontWeight: "500",
    color: "#000000",
  },
  termsText: {
    ...Typography.tiny,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: Spacing["3xl"],
    lineHeight: 18,
  },
  termsLink: {
    color: "#6B7280",
    fontWeight: "500",
  },
  workshopCodeButton: {
    marginTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "#4F46E5",
    paddingBottom: 2,
  },
  workshopCodeText: {
    ...Typography.small,
    color: "#4F46E5",
    fontWeight: "500",
  },
});
