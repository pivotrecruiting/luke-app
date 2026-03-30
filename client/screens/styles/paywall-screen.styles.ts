import { StyleSheet } from "react-native";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundDefault,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header (full width, CI gradient - same as LevelUp/Streak)
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["2xl"],
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    ...Typography.body,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: Spacing.sm,
    lineHeight: 22,
    textAlign: "center",
  },

  // Study card (white, overlapping header)
  studyCard: {
    backgroundColor: Colors.light.backgroundRoot,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginTop: -Spacing["2xl"],
    marginBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  studyCardTitle: {
    ...Typography.small,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  studyCardBody: {
    ...Typography.body,
    color: Colors.light.text,
    lineHeight: 22,
    textAlign: "center",
  },

  // Content section (horizontal padding for edge consistency)
  contentSection: {
    paddingHorizontal: Spacing.xl,
  },

  // Features headline (extra padding so it wraps to 2 lines on most screens)
  headline: {
    ...Typography.h4,
    fontWeight: "700",
    color: Colors.light.primary,
    textAlign: "center",
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing["3xl"],
  },

  // Features wrapper (same width as headline via matching padding)
  featuresWrapper: {
    paddingHorizontal: Spacing["3xl"],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  featureIcon: {
    marginRight: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.light.text,
    textAlign: "left",
    flex: 1,
  },
  featureTextSemibold: {
    fontWeight: "600",
  },

  // Plan cards section
  plansContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  planCard: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: Colors.light.backgroundRoot,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 96,
    borderWidth: 2,
    borderColor: Colors.light.chipBorder,
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  planCardBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
    width: 90,
  },
  planCardBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.light.buttonText,
  },
  planCardContent: {
    alignItems: "center",
  },
  planCardTitle: {
    ...Typography.small,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  planCardTitleWithBadge: {
    marginTop: Spacing.sm,
  },
  planCardPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.primary,
    textAlign: "center",
  },
  planCardDescription: {
    ...Typography.tiny,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
    alignSelf: "stretch",
  },

  // Pre-CTA text
  preCtaText: {
    ...Typography.small,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: Spacing.md,
  },

  // CTA Button
  ctaButton: {
    borderRadius: BorderRadius.xl,
    height: Spacing.buttonHeight,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaButtonPressed: {
    opacity: 0.9,
  },
  ctaButtonText: {
    ...Typography.button,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.buttonText,
    textAlign: "center",
  },

  // Footer links
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
    gap: 2,
  },
  footerLink: {
    fontSize: 10,
    fontWeight: "400",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  footerSeparator: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
});
