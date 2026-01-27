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
    justifyContent: "flex-start",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["3xl"],
    paddingBottom: Spacing["3xl"],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  titleContainer: {
    marginBottom: Spacing["3xl"],
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
    marginTop: Spacing.xl,
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
    marginTop: "auto",
  },
});
