import { StyleSheet } from "react-native";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

export const styles = StyleSheet.create({
  // ============================================
  // Container & Layout Styles
  // ============================================
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg, // Padding für Content nach der Card
    paddingBottom: Spacing["5xl"],
  },

  // ============================================
  // Header Styles (Gradient Background)
  // ============================================
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    minHeight: 180, // Größere Mindesthöhe
  },
  headerTitle: {
    // Used for: Main header title "Profil"
    ...Typography.h1,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    // Used for: Header subtitle "Einstellungen & mehr"
    ...Typography.body,
    color: "rgba(255,255,255,0.8)",
    marginTop: Spacing.xs,
  },

  // ============================================
  // Profile Card Styles
  // ============================================
  profileCard: {
    // Used for: Main user profile card container - positioned over the header
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: 0,
    marginHorizontal: Spacing.xl,
    // marginBottom: Spacing.xs, // Reduzierter Abstand zum Account Titel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10, // Über dem Header liegen
  },
  profileHeader: {
    // Used for: Profile header row (avatar + name)
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  profileAvatarButton: {
    // Used for: Pressable wrapper around the level emoji
    marginRight: Spacing.md,
  },
  profileAvatarButtonPressed: {
    opacity: 0.8,
  },
  profileAvatar: {
    // Used for: Profile avatar emoji
    fontSize: 32,
  },
  profileName: {
    // Used for: User name text - black color
    ...Typography.h4,
    fontWeight: "600",
    color: "#000000",
  },
  profileStats: {
    // Used for: Stats row container (Gespart, seit, Höchste Streak)
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statColumn: {
    // Used for: Individual stat column container
    flex: 1,
    alignItems: "flex-start",
  },
  statLabel: {
    // Used for: Stat labels (Gespart, seit, Höchste Streak) - gray color
    ...Typography.small,
    marginBottom: Spacing.xs,
    // Color set via ThemedText lightColor="#9CA3AF" (gray for labels)
  },
  statValue: {
    // Used for: Stat values (€ 2.478,23, 83 Tagen, etc.) - black color
    ...Typography.body,
    fontWeight: "600",
    color: "#000000",
  },
  statValueUnderlined: {
    // Used for: Underlined stat values (if needed)
    ...Typography.body,
    fontWeight: "600",
    textDecorationLine: "underline",
    // Color handled by ThemedText (defaults to theme.text = black)
  },

  // ============================================
  // Section Styles
  // ============================================
  sectionTitle: {
    // Used for: Section titles (Account, Benachrichtigungen, etc.)
    ...Typography.h3,
    fontWeight: "600",
    color: "#000000",
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitleWithIcon: {
    // Used for: Section title row with icon
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    marginTop: Spacing.sm, // Reduzierter Abstand von oben
  },
  sectionTitleIcon: {
    // Used for: Icon spacing in section title
    marginRight: Spacing.sm,
  },
  sectionCard: {
    // Used for: Section card containers (Account, Benachrichtigungen, etc.)
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing["2xl"],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHint: {
    // Used for: Helper text below section cards
    ...Typography.small,
    color: "#6B7280",
    marginTop: -Spacing.lg,
    marginBottom: Spacing["2xl"],
    lineHeight: 20,
  },

  // ============================================
  // Account Section Styles
  // ============================================
  loginMethodRow: {
    // Used for: Login method row container
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  loginMethodContent: {
    // Used for: Login method text content container
    flex: 1,
  },
  loginMethodLabel: {
    // Used for: "Login Methode" label - black color
    color: "#000000",
  },
  loginMethodValue: {
    // Used for: Login method value (e.g., "Google Account") - black color
    marginTop: Spacing.xs,
    color: "#000000",
  },
  loginMethodButton: {
    // Used for: "Manage" button in login method row
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#F3F4F6",
  },
  loginMethodButtonText: {
    // Used for: "Manage" button text - black color
    fontWeight: "500",
    color: "#000000",
  },
  accountInfoRow: {
    // Used for: Read-only account info rows
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  accountInfoRowPressable: {
    // Used for: Pressable account info rows
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  accountInfoRowDisabled: {
    // Used for: Disabled account info row
    opacity: 0.7,
  },
  accountInfoContent: {
    // Used for: Account info text content container
    flex: 1,
  },
  accountInfoEditContainer: {
    // Used for: Inline edit content wrapper
    gap: Spacing.sm,
  },
  accountInfoLabel: {
    // Used for: Account info row label
    color: "#000000",
  },
  accountInfoValue: {
    // Used for: Account info row value
    marginTop: Spacing.xs,
    color: "#000000",
  },
  accountInfoValueDisabled: {
    // Used for: Disabled account info value
    color: "#6B7280",
  },
  accountInfoInput: {
    // Used for: Inline editable account input
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  accountInfoInputError: {
    // Used for: Inline account input error state
    borderColor: "#EF4444",
  },
  accountInfoEditActions: {
    // Used for: Inline account edit button row
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
  accountInfoActionButton: {
    // Used for: Inline account action buttons
    minWidth: 96,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfoSecondaryButton: {
    // Used for: Secondary inline action button
    backgroundColor: "#F3F4F6",
  },
  accountInfoSecondaryButtonText: {
    // Used for: Secondary inline action button text
    fontWeight: "500",
    color: "#111827",
  },
  accountInfoPrimaryButton: {
    // Used for: Primary inline action button
    backgroundColor: "#111827",
  },
  accountInfoPrimaryButtonText: {
    // Used for: Primary inline action button text
    fontWeight: "600",
    color: "#FFFFFF",
  },
  accountInfoHint: {
    // Used for: Account section helper text
    ...Typography.small,
    color: "#6B7280",
    paddingTop: Spacing.md,
  },
  bankConnectRow: {
    // Used for: Bank connect row container
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  bankConnectContent: {
    // Used for: Bank connect text content container
    flex: 1,
  },
  bankConnectLabel: {
    // Used for: "Bank verbinden" label - gray color (disabled state)
    // Color set via ThemedText lightColor="#9CA3AF" (gray for disabled)
  },
  bankConnectSubtext: {
    // Used for: "Bald verfügbar" subtext - gray color
    marginTop: Spacing.xs,
    // Color set via ThemedText lightColor="#9CA3AF" (gray for secondary text)
  },
  bankConnectIconButton: {
    // Used for: Bank connect icon button container
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // ============================================
  // Delete Button Styles
  // ============================================
  deleteButton: {
    // Used for: Account delete button container
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  deleteButtonIcon: {
    // Used for: Delete button icon spacing
    marginRight: Spacing.sm,
  },
  deleteButtonText: {
    // Used for: Delete button text - red color
    ...Typography.body,
    fontWeight: "600",
    color: "#EF4444",
  },

  // ============================================
  // Development Tools Styles (__DEV__ only)
  // ============================================
  devToolsCard: {
    // Used for: Development tools card container
    backgroundColor: "#FFF4E6",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing["2xl"],
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  devToolsTitle: {
    // Used for: "Test Level Up Screen" title - orange color
    fontSize: 14,
    fontWeight: "600",
    color: "#E65100",
    marginBottom: Spacing.md,
  },
  devToolsButton: {
    // Used for: Level test button container
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    alignItems: "center",
  },
  devToolsButtonText: {
    // Used for: Level test button text - white color
    fontWeight: "600",
    // Color set via ThemedText lightColor="#FFFFFF" (white for button text)
  },

  // ============================================
  // Modal Styles
  // ============================================
  modalOverlay: {
    // Used for: Modal overlay container
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    // Used for: Modal backdrop (clickable area to close)
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    // Used for: Modal content container
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  modalHeader: {
    // Used for: Modal header row (title + close button)
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    // Used for: Modal title text - black color
    ...Typography.h3,
    fontWeight: "600",
    color: "#000000",
  },
  profileFormField: {
    // Used for: Profile edit form field wrapper
    marginBottom: Spacing.lg,
  },
  profileFormLabel: {
    // Used for: Profile edit form field label
    color: "#000000",
    marginBottom: Spacing.sm,
  },
  profileFormInput: {
    // Used for: Profile edit form text input
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  profileFormInputDisabled: {
    // Used for: Disabled profile form text input
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
  },
  profileFormInputError: {
    // Used for: Profile form input error state
    borderColor: "#EF4444",
  },
  profileFormHint: {
    // Used for: Profile form helper hint
    ...Typography.small,
    color: "#6B7280",
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  profileFormErrorText: {
    // Used for: Profile form field error text
    ...Typography.small,
    color: "#EF4444",
    marginTop: Spacing.xs,
  },
  saveProfileButton: {
    // Used for: Save profile button container
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  saveProfileButtonText: {
    // Used for: Save profile button text
    ...Typography.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryActionButton: {
    // Used for: Secondary action button container
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: Spacing.md,
  },
  secondaryActionButtonDisabled: {
    // Used for: Disabled secondary action button
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  secondaryActionButtonText: {
    // Used for: Secondary action button text
    ...Typography.body,
    fontWeight: "600",
    color: "#000000",
  },
  logoutButton: {
    // Used for: Logout button container
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  logoutButtonText: {
    // Used for: Logout button text - red color
    ...Typography.body,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: Spacing.sm,
  },

  // ============================================
  // Delete Account Modal Styles
  // ============================================
  deleteModalDescription: {
    // Used for: Delete account modal description text
    ...Typography.body,
    color: "#000000",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  deleteModalButtons: {
    // Used for: Delete modal buttons container
    flexDirection: "row",
  },
  deleteModalCancelButton: {
    // Used for: Cancel button in delete modal
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  deleteModalCancelText: {
    // Used for: Cancel button text - black color
    ...Typography.body,
    fontWeight: "600",
    color: "#000000",
  },
  deleteModalConfirmButton: {
    // Used for: Confirm delete button in delete modal
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalConfirmText: {
    // Used for: Confirm delete button text - white color
    ...Typography.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
