import { StyleSheet } from "react-native";

/**
 * Shared styles for header tab toggles (AddScreen, InsightsScreen).
 * Based on AddScreen design - larger text, solid white inactive state.
 */
export const headerTabToggleStyles = StyleSheet.create({
  toggleContainer: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  toggleButtonIcon: {
    flex: 0,
    width: 56,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  toggleButtonTextActive: {
    color: "#3B5BDB",
  },
});

export const TOGGLE_ICON_COLOR = "#FFFFFF";
export const TOGGLE_ICON_COLOR_ACTIVE = "#3B5BDB";
export const TOGGLE_ICON_SIZE = 20;
