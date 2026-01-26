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
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  titleContainer: {
    marginBottom: Spacing["2xl"],
  },
  descriptionContainer: {
    marginBottom: Spacing["2xl"],
  },
  badgeContainer: {
    marginBottom: Spacing["3xl"],
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing["3xl"],
  },
  progressContainer: {
    marginBottom: Spacing["3xl"],
    width: "100%",
  },
  buttonContainer: {
    width: "100%",
    marginTop: Spacing["2xl"],
  },
});
