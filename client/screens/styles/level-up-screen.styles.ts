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
    // No margin - aligned to start via space-between
  },
  badgeContainer: {
    alignItems: "center",
  },
  iconContainer: {
    // Centered in middle section
  },
  progressContainer: {
    width: "100%",
  },
  buttonContainer: {
    width: "100%",
    // No margin - aligned to end via space-between
  },
});
