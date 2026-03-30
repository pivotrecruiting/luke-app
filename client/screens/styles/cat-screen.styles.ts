import { StyleSheet } from "react-native";
import {
  BorderRadius,
  CelebrationScreenBackground,
  Colors,
  Spacing,
  Typography,
} from "@/constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CelebrationScreenBackground,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 34,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  textSection: {
    gap: Spacing.lg,
    marginTop: -Spacing.sm,
  },
  title: {
    ...Typography.h1,
    color: Colors.light.buttonText,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    maxWidth: 260,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.buttonText,
    fontSize: 18,
    lineHeight: 25,
    maxWidth: 320,
    opacity: 0.95,
  },
  subtitleStrong: {
    fontWeight: "800",
  },
  heroSection: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 360,
    marginVertical: Spacing.lg,
  },
  catImage: {
    width: 308,
    height: 340,
    maxWidth: "100%",
  },
  ornament: {
    position: "absolute",
    width: 44,
    height: 44,
    tintColor: "#FFFFFF",
  },
  ornamentLeft: {
    left: 0,
    top: 118,
  },
  ornamentRight: {
    right: 8,
    bottom: 96,
  },
  bottomSection: {
    alignItems: "center",
  },
  buttonContainer: {
    width: "100%",
    marginTop: Spacing["4xl"],
  },
  amount: {
    ...Typography.h1,
    color: Colors.light.buttonText,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    ...Typography.body,
    color: Colors.light.buttonText,
    fontSize: 18,
    lineHeight: 25,
    textAlign: "center",
    marginTop: Spacing.md,
    opacity: 0.95,
    maxWidth: 340,
  },
  button: {
    height: 60,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
});
