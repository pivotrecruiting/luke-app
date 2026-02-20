import { StyleSheet } from "react-native";
import { Spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  topSection: {
    flexShrink: 1,
  },
  titleContainer: {
    marginBottom: Spacing["2xl"],
  },
  descriptionContainer: {
    marginBottom: Spacing.md,
  },
  badgeContainer: {
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: 0,
  },
  middleSection: {
    flex: 1,
    flexShrink: 1,
    justifyContent: "center",
  },
  iconContainer: {
    // Centered in middle section
  },
  progressContainer: {
    width: "100%",
    marginTop: Spacing["4xl"],
  },
  buttonContainer: {
    width: "100%",
    marginTop: Spacing["4xl"],
  },
});
