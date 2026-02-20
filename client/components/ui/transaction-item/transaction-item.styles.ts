import { Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    borderBottomWidth: 0,
    borderBottomColor: "#E5E7EB",
  },
  rowWithDivider: {
    borderBottomWidth: 1,
  },
  rowCard: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(123, 140, 222, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  amountIncome: {
    color: "#22C55E",
  },
});
