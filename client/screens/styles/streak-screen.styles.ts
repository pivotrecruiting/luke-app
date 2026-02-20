import { StyleSheet } from "react-native";
import { Spacing, Typography } from "@/constants/theme";

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
  middleSection: {
    flex: 1,
    flexShrink: 1,
    justifyContent: "center",
  },
  iconContainer: {},
  xpContainer: {
    width: "100%",
    marginTop: Spacing["4xl"],
  },
  descriptionContainer: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  description: {
    ...Typography.small,
    color: "#FFFFFF",
    textAlign: "center",
  },
  streakBarContainer: {
    width: "100%",
    marginTop: Spacing["2xl"],
  },
  buttonContainer: {
    width: "100%",
    marginTop: Spacing["4xl"],
  },
});
