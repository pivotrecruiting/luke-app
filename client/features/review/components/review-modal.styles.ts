import { StyleSheet } from "react-native";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";

export const styles = StyleSheet.create({
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  contentInner: {
    alignSelf: "stretch",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.body,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  subtitle: {
    ...Typography.small,
    color: "#9CA3AF",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.sm,
  },
  illustration: {
    width: 160,
    height: 160,
  },
  ctaText: {
    ...Typography.body,
    color: "#000000",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: Spacing.sm,
  },
  primaryButton: {
    width: "100%",
    height: Spacing.buttonHeight,
    marginBottom: Spacing.md,
    backgroundColor: "#7340FD",
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    backgroundColor: "#8258f5",
  },
  primaryButtonText: {
    ...Typography.button,
    color: "#FFFFFF",
  },
  laterButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  laterButtonText: {
    ...Typography.body,
    color: "#6B7280",
  },
});
