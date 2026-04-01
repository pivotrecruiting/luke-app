import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { z } from "zod";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { SettingsRow } from "@/components/SettingsRow";
import { HeaderGradient, Spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { updateUserEmail, updateUserFullName } from "@/services/auth-service";
import { upsertUserName } from "@/services/app-service";
import { deleteMyAccount } from "@/services/account-service";
import {
  fetchMyNotificationSettings,
  type NotificationSettingsT,
  updateMyNotificationSettings,
} from "@/services/notification-settings-service";
import {
  deactivateStoredPushToken,
  getDeviceTimezone,
  getPushPermissionSnapshot,
  requestPushPermissionsAndRegisterToken,
  type PushPermissionSnapshotT,
} from "@/services/push-notification-service";
import { resolveLevelByXp } from "@/features/xp/utils/levels";
import { formatDaysSince } from "@/utils/dates";
import {
  openExternalUrl,
  openSubscriptionManagement,
  PRIVACY_URL,
  TERMS_URL,
} from "@/utils/external-links";
import { getUserFirstName } from "@/utils/user";
import { styles } from "./styles/profile-screen.styles";
import { AppModal } from "@/components/ui/app-modal";
import { PurpleGradientButton } from "@/components/ui/purple-gradient-button";
import { ReviewModal } from "@/features/review/components/review-modal";
import type { CurrencyCode } from "@/context/AppContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditableProfileFieldT = "name" | "email";

const CURRENCY_OPTIONS: {
  code: CurrencyCode;
  label: string;
  description: string;
}[] = [
  { code: "EUR", label: "Euro", description: "Euro (EUR)" },
  { code: "USD", label: "US Dollar", description: "US Dollar (USD)" },
  {
    code: "CHF",
    label: "Schweizer Franken",
    description: "Schweizer Franken (CHF)",
  },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsT = {
  pushNotificationsEnabled: false,
  dailyReminderEnabled: false,
  weeklyReportEnabled: false,
  monthlyReminderEnabled: false,
  trialEndingPushEnabled: true,
  timezone: null,
  reminderTime: null,
  weeklyReportDay: 1,
  monthlyReminderDay: 1,
};

const DEFAULT_PUSH_PERMISSION: PushPermissionSnapshotT = {
  status: "undetermined",
  canAskAgain: true,
  granted: false,
};

const profileNameSchema = z
  .string()
  .trim()
  .min(1, "Bitte gib deinen Namen ein.")
  .max(80, "Dein Name darf maximal 80 Zeichen lang sein.");

const profileEmailSchema = z
  .string()
  .trim()
  .email("Bitte gib eine gültige E-Mail-Adresse ein.");

const getProviderLabel = (provider: string) => {
  switch (provider) {
    case "google":
      return "Google";
    case "apple":
      return "Apple";
    case "email":
      return "E-Mail & Passwort";
    case "phone":
      return "Telefon";
    default:
      return provider;
  }
};

/**
 * Profile screen displaying user information, settings, and account options.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {
    hasAccess,
    levels,
    userProgress,
    transactionBalance,
    currency,
    setCurrency,
    userName,
    setUserName,
  } = useApp();
  const { user } = useAuth();
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] =
    useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingNotificationSettings, setIsLoadingNotificationSettings] =
    useState(true);
  const [isSavingNotificationSettings, setIsSavingNotificationSettings] =
    useState(false);
  const [pushPermission, setPushPermission] = useState<PushPermissionSnapshotT>(
    DEFAULT_PUSH_PERMISSION,
  );
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettingsT>(DEFAULT_NOTIFICATION_SETTINGS);
  const [activeEditField, setActiveEditField] =
    useState<EditableProfileFieldT | null>(null);
  const [profileNameInput, setProfileNameInput] = useState("");
  const [profileEmailInput, setProfileEmailInput] = useState("");
  const [profileNameError, setProfileNameError] = useState<string | null>(null);
  const [profileEmailError, setProfileEmailError] = useState<string | null>(
    null,
  );
  const [selectedCurrency, setSelectedCurrency] =
    useState<CurrencyCode>(currency);
  const profileNameInputRef = useRef<TextInput | null>(null);
  const profileEmailInputRef = useRef<TextInput | null>(null);

  const profileCardOverlap = Spacing["4xl"];
  const appVersion = "1.0.0";

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const currentLevel = useMemo(() => {
    const sortedLevels = [...levels].sort(
      (a, b) => a.xpRequired - b.xpRequired,
    );
    const xpTotalValue = userProgress?.xpTotal ?? 0;
    return (
      resolveLevelByXp(sortedLevels, xpTotalValue) ?? sortedLevels[0] ?? null
    );
  }, [levels, userProgress]);

  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;
  const currentFullName = (userName ?? metadataName ?? "").trim();
  const firstName = getUserFirstName(currentFullName);
  const fallbackLevel = currentLevel?.levelNumber ?? 1;
  const profileName = firstName ?? `Level ${fallbackLevel}`;
  const profileEmail = user?.email ?? null;
  const authProviders = useMemo(() => {
    const providerSet = new Set<string>();

    if (Array.isArray(user?.app_metadata?.providers)) {
      for (const provider of user.app_metadata.providers) {
        if (typeof provider === "string" && provider.trim()) {
          providerSet.add(provider);
        }
      }
    }

    if (typeof user?.app_metadata?.provider === "string") {
      providerSet.add(user.app_metadata.provider);
    }

    if (providerSet.size === 0 && profileEmail) {
      providerSet.add("email");
    }

    return Array.from(providerSet);
  }, [
    profileEmail,
    user?.app_metadata?.provider,
    user?.app_metadata?.providers,
  ]);
  const hasOAuthProvider = authProviders.some(
    (provider) => provider !== "email" && provider !== "phone",
  );
  const canEditEmail = Boolean(profileEmail) && !hasOAuthProvider;
  const canResetPassword = canEditEmail;
  const loginMethod =
    authProviders.length > 0
      ? authProviders.map(getProviderLabel).join(" + ")
      : "Unbekannt";
  const levelEmoji = currentLevel?.emoji ?? "🦊";
  const savingsLabel = transactionBalance >= 0 ? "Gespart" : "Ausgegeben";
  const savingsAmount = formatCurrency(Math.abs(transactionBalance));
  const daysSince = formatDaysSince(user?.created_at);
  const highestStreakValue = userProgress?.longestStreak ?? 0;
  const highestStreak = `${highestStreakValue} ${
    highestStreakValue === 1 ? "Tag" : "Tage"
  }`;
  const accountDeletionSubscriptionHint = hasAccess
    ? "Dein aktives Abonnement wird durch das Löschen deines Accounts nicht automatisch beendet. Bitte kündige es zusätzlich im App Store oder bei Google Play."
    : "Falls du ein aktives Abonnement über den App Store oder Google Play hast, wird es durch das Löschen deines Accounts nicht automatisch beendet. Bitte kündige es dort zusätzlich.";

  const handleOpenCurrencyModal = () => {
    setSelectedCurrency(currency);
    setCurrencyModalVisible(true);
  };

  const handleCloseCurrencyModal = () => {
    setSelectedCurrency(currency);
    setCurrencyModalVisible(false);
  };

  const handleSaveCurrency = () => {
    setCurrency(selectedCurrency);
    setCurrencyModalVisible(false);
  };

  useEffect(() => {
    setProfileNameInput(currentFullName);
    setProfileEmailInput(profileEmail ?? "");
  }, [currentFullName, profileEmail]);

  useEffect(() => {
    if (!currencyModalVisible) {
      setSelectedCurrency(currency);
    }
  }, [currency, currencyModalVisible]);

  useEffect(() => {
    if (activeEditField === "name") {
      profileNameInputRef.current?.focus();
    }

    if (activeEditField === "email") {
      profileEmailInputRef.current?.focus();
    }
  }, [activeEditField]);

  useEffect(() => {
    let isCancelled = false;

    const loadNotificationSettings = async () => {
      try {
        const [nextSettings, permissionSnapshot] = await Promise.all([
          fetchMyNotificationSettings(),
          getPushPermissionSnapshot(),
        ]);

        if (isCancelled) {
          return;
        }

        setPushPermission(permissionSnapshot);
        setNotificationSettings({
          ...nextSettings,
          timezone: nextSettings.timezone ?? getDeviceTimezone(),
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error("Failed to load notification settings:", error);
        Alert.alert(
          "Benachrichtigungen konnten nicht geladen werden",
          "Bitte versuche es erneut.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingNotificationSettings(false);
        }
      }
    };

    void loadNotificationSettings();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        return;
      }

      void getPushPermissionSnapshot()
        .then((nextSnapshot) => {
          setPushPermission(nextSnapshot);
        })
        .catch((error) => {
          console.error("Failed to refresh push permission snapshot:", error);
        });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const startEditingField = (field: EditableProfileFieldT) => {
    if (isSavingProfile || isLoggingOut) return;

    if (field === "email" && !canEditEmail) {
      return;
    }

    setProfileNameInput(currentFullName);
    setProfileEmailInput(profileEmail ?? "");
    setProfileNameError(null);
    setProfileEmailError(null);
    setActiveEditField(field);
  };

  const stopEditingField = () => {
    setProfileNameInput(currentFullName);
    setProfileEmailInput(profileEmail ?? "");
    setProfileNameError(null);
    setProfileEmailError(null);
    setActiveEditField(null);
  };

  const handleLogout = async () => {
    if (isLoggingOut || isSavingProfile) return;
    setIsLoggingOut(true);
    try {
      try {
        await deactivateStoredPushToken();
      } catch (error) {
        console.error(
          "Failed to deactivate stored push token on logout:",
          error,
        );
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout failed:", error);
        Alert.alert("Logout fehlgeschlagen", "Bitte versuche es erneut.");
        return;
      }
      setManageModalVisible(false);
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Logout fehlgeschlagen", "Bitte versuche es erneut.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!profileEmail || !canResetPassword || isSavingProfile || isLoggingOut) {
      return;
    }

    navigation.navigate("RequestPassword", { email: profileEmail });
  };

  const handleSaveProfile = async (field: EditableProfileFieldT) => {
    if (!user?.id || isSavingProfile || isLoggingOut) return;

    const currentEmail = profileEmail?.trim().toLowerCase() ?? "";
    let nextName = currentFullName;
    let nextEmail = currentEmail;

    if (field === "name") {
      const parsedName = profileNameSchema.safeParse(profileNameInput);
      nextName = parsedName.success ? parsedName.data : "";
      setProfileNameError(
        parsedName.success
          ? null
          : (parsedName.error.issues[0]?.message ?? null),
      );
      setProfileEmailError(null);
    }

    if (field === "email") {
      if (!canEditEmail) {
        return;
      }

      setProfileNameError(null);
      const parsedEmail = profileEmailSchema.safeParse(profileEmailInput);
      setProfileEmailError(
        parsedEmail.success
          ? null
          : (parsedEmail.error.issues[0]?.message ?? null),
      );
      if (parsedEmail.success) {
        nextEmail = parsedEmail.data.toLowerCase();
      }
    } else {
      setProfileEmailError(null);
    }

    if ((field === "name" && !nextName) || (field === "email" && !nextEmail)) {
      return;
    }

    const shouldUpdateName = field === "name" && nextName !== currentFullName;
    const shouldUpdateEmail =
      field === "email" && canEditEmail && nextEmail !== currentEmail;

    if (!shouldUpdateName && !shouldUpdateEmail) {
      setActiveEditField(null);
      return;
    }

    setIsSavingProfile(true);
    let didUpdateName = false;

    try {
      if (shouldUpdateName) {
        await upsertUserName(user.id, nextName);
        setUserName(nextName);
        didUpdateName = true;

        const metadataResult = await updateUserFullName(
          nextName,
          user.user_metadata,
        );

        if (metadataResult.status === "error") {
          console.warn(
            "Failed to sync full_name metadata:",
            metadataResult.message,
          );
        }
      }

      if (shouldUpdateEmail) {
        const emailResult = await updateUserEmail(nextEmail);

        if (emailResult.status === "error") {
          throw new Error(emailResult.message);
        }
      }

      setActiveEditField(null);

      Alert.alert(
        "Profil aktualisiert",
        shouldUpdateEmail
          ? "Die E-Mail-Änderung wurde gestartet. Bitte prüfe dein Postfach, um sie abzuschließen."
          : "Dein Name wurde aktualisiert.",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Bitte versuche es erneut.";

      Alert.alert(
        didUpdateName
          ? "Profil teilweise aktualisiert"
          : "Aktualisierung fehlgeschlagen",
        didUpdateName
          ? `Dein Name wurde gespeichert, aber die E-Mail konnte nicht geändert werden. ${errorMessage}`
          : errorMessage,
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount || isLoggingOut || isSavingProfile) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      try {
        await deactivateStoredPushToken();
      } catch (error) {
        console.error(
          "Failed to deactivate stored push token before account deletion:",
          error,
        );
      }

      await deleteMyAccount();

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          "Sign out after account deletion returned an error:",
          signOutError,
        );
      }

      setDeleteAccountModalVisible(false);

      Alert.alert("Account gelöscht", "Dein Account wurde dauerhaft gelöscht.");
    } catch (error) {
      console.error("Account deletion failed:", error);
      Alert.alert(
        "Account konnte nicht gelöscht werden",
        error instanceof Error ? error.message : "Bitte versuche es erneut.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleOpenNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Failed to open system settings:", error);
      Alert.alert(
        "Einstellungen konnten nicht geöffnet werden",
        "Bitte öffne die App-Einstellungen manuell.",
      );
    }
  };

  const updateNotificationSettingsValue = async (
    updater: (current: NotificationSettingsT) => NotificationSettingsT,
  ) => {
    if (isLoadingNotificationSettings || isSavingNotificationSettings) {
      return;
    }

    const previousSettings = notificationSettings;
    const nextSettings = {
      ...updater(previousSettings),
      timezone: getDeviceTimezone() ?? previousSettings.timezone,
    };

    setNotificationSettings(nextSettings);
    setIsSavingNotificationSettings(true);

    try {
      const savedSettings = await updateMyNotificationSettings(nextSettings);
      setNotificationSettings(savedSettings);
    } catch (error) {
      setNotificationSettings(previousSettings);
      console.error("Failed to update notification settings:", error);
      Alert.alert(
        "Benachrichtigungen konnten nicht gespeichert werden",
        "Bitte versuche es erneut.",
      );
    } finally {
      setIsSavingNotificationSettings(false);
    }
  };

  const notificationsDisabled =
    isLoadingNotificationSettings || isSavingNotificationSettings;
  const reminderTogglesDisabled =
    notificationsDisabled || !notificationSettings.pushNotificationsEnabled;
  const isNotificationPermissionGranted = pushPermission.granted;
  const notificationPermissionLabel = pushPermission.granted
    ? "Erlaubt"
    : pushPermission.status === "denied"
      ? "In Einstellungen aktivieren"
      : pushPermission.status === "unsupported"
        ? "Nicht unterstützt"
        : "Berechtigung anfragen";
  const notificationPermissionHint = pushPermission.granted
    ? "Push-Berechtigung ist aktiv."
    : pushPermission.status === "denied"
      ? "Push ist im Betriebssystem deaktiviert. Öffne die App-Einstellungen, um die Berechtigung zu aktivieren."
      : pushPermission.status === "unsupported"
        ? "Push-Benachrichtigungen werden auf dieser Plattform nicht unterstützt."
        : "Beim Aktivieren von Push wird die Betriebssystem-Berechtigung angefragt.";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={HeaderGradient.colors}
        start={HeaderGradient.start}
        end={HeaderGradient.end}
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: profileCardOverlap + Spacing.lg,
          },
        ]}
      >
        <ThemedText style={styles.headerTitle} lightColor="#FFFFFF">
          Profil
        </ThemedText>
        <ThemedText
          style={styles.headerSubtitle}
          lightColor="rgba(255,255,255,0.8)"
        >
          Einstellungen & mehr
        </ThemedText>
      </LinearGradient>

      {/* User Profile Card - positioned over header */}
      <Pressable
        style={[styles.profileCard, { marginTop: -profileCardOverlap }]}
        onPress={() => {
          if (currentLevel?.id) {
            navigation.navigate("LevelUp", { levelId: currentLevel.id });
            return;
          }
          navigation.navigate("LevelUp", {});
        }}
        accessibilityRole="button"
        accessibilityLabel="Level Up anzeigen"
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatarButton}>
            <ThemedText style={styles.profileAvatar}>{levelEmoji}</ThemedText>
          </View>
          <ThemedText style={styles.profileName}>{profileName}</ThemedText>
        </View>
        <View style={styles.profileStats}>
          <View style={styles.statColumn}>
            <ThemedText
              type="small"
              style={styles.statLabel}
              lightColor="#9CA3AF"
              darkColor="#9BA1A6"
            >
              {savingsLabel}
            </ThemedText>
            <ThemedText type="body" style={styles.statValue}>
              {savingsAmount}
            </ThemedText>
          </View>
          <View style={styles.statColumn}>
            <ThemedText
              type="small"
              style={styles.statLabel}
              lightColor="#9CA3AF"
              darkColor="#9BA1A6"
            >
              seit
            </ThemedText>
            <ThemedText type="body" style={styles.statValue}>
              {daysSince}
            </ThemedText>
          </View>
          <View style={styles.statColumn}>
            <ThemedText
              type="small"
              style={styles.statLabel}
              lightColor="#9CA3AF"
              darkColor="#9BA1A6"
            >
              Höchste Streak
            </ThemedText>
            <ThemedText type="body" style={styles.statValue}>
              {highestStreak}
            </ThemedText>
          </View>
        </View>
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing["5xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.sectionTitleWithIcon}>
          <Feather
            name="settings"
            size={20}
            color="#000000"
            style={styles.sectionTitleIcon}
          />
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
        </View>
        <View style={styles.sectionCard}>
          <View style={styles.loginMethodRow}>
            <View style={styles.loginMethodContent}>
              <ThemedText type="body" style={styles.loginMethodLabel}>
                Login Methode
              </ThemedText>
              <ThemedText type="small" style={styles.loginMethodValue}>
                {loginMethod}
              </ThemedText>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.loginMethodButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => {
                stopEditingField();
                setManageModalVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Accountoptionen öffnen"
            >
              <ThemedText type="small" style={styles.loginMethodButtonText}>
                Mehr
              </ThemedText>
            </Pressable>
          </View>
          {activeEditField === "name" ? (
            <View style={styles.accountInfoRow}>
              <View style={styles.accountInfoEditContainer}>
                <ThemedText type="body" style={styles.accountInfoLabel}>
                  Name
                </ThemedText>
                <TextInput
                  ref={profileNameInputRef}
                  style={[
                    styles.accountInfoInput,
                    profileNameError ? styles.accountInfoInputError : null,
                  ]}
                  value={profileNameInput}
                  onChangeText={(text) => {
                    setProfileNameInput(text);
                    if (profileNameError) {
                      setProfileNameError(null);
                    }
                  }}
                  placeholder="Dein Name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSavingProfile}
                  accessibilityLabel="Name bearbeiten"
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSaveProfile("name")}
                />
                {profileNameError ? (
                  <ThemedText type="small" style={styles.profileFormErrorText}>
                    {profileNameError}
                  </ThemedText>
                ) : null}
                <View style={styles.accountInfoEditActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.accountInfoActionButton,
                      styles.accountInfoSecondaryButton,
                      { opacity: pressed || isSavingProfile ? 0.7 : 1 },
                    ]}
                    onPress={stopEditingField}
                    disabled={isSavingProfile}
                  >
                    <ThemedText
                      type="small"
                      style={styles.accountInfoSecondaryButtonText}
                    >
                      Abbrechen
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.accountInfoActionButton,
                      styles.accountInfoPrimaryButton,
                      { opacity: pressed || isSavingProfile ? 0.7 : 1 },
                    ]}
                    onPress={() => void handleSaveProfile("name")}
                    disabled={isSavingProfile}
                  >
                    <ThemedText
                      type="small"
                      style={styles.accountInfoPrimaryButtonText}
                    >
                      {isSavingProfile ? "Speichern..." : "Speichern"}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.accountInfoRow,
                styles.accountInfoRowPressable,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => startEditingField("name")}
              accessibilityRole="button"
              accessibilityLabel="Name bearbeiten"
            >
              <View style={styles.accountInfoContent}>
                <ThemedText type="body" style={styles.accountInfoLabel}>
                  Name
                </ThemedText>
                <ThemedText type="small" style={styles.accountInfoValue}>
                  {currentFullName || "Nicht hinterlegt"}
                </ThemedText>
              </View>
              <Feather name="edit-2" size={16} color="#6B7280" />
            </Pressable>
          )}
          {activeEditField === "email" ? (
            <View style={styles.accountInfoRow}>
              <View style={styles.accountInfoEditContainer}>
                <ThemedText type="body" style={styles.accountInfoLabel}>
                  E-Mail
                </ThemedText>
                <TextInput
                  ref={profileEmailInputRef}
                  style={[
                    styles.accountInfoInput,
                    !canEditEmail ? styles.profileFormInputDisabled : null,
                    profileEmailError ? styles.accountInfoInputError : null,
                  ]}
                  value={profileEmailInput}
                  onChangeText={(text) => {
                    setProfileEmailInput(text);
                    if (profileEmailError) {
                      setProfileEmailError(null);
                    }
                  }}
                  placeholder="name@beispiel.de"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={canEditEmail && !isSavingProfile}
                  accessibilityLabel="E-Mail bearbeiten"
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSaveProfile("email")}
                />
                {profileEmailError ? (
                  <ThemedText type="small" style={styles.profileFormErrorText}>
                    {profileEmailError}
                  </ThemedText>
                ) : null}
                <View style={styles.accountInfoEditActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.accountInfoActionButton,
                      styles.accountInfoSecondaryButton,
                      { opacity: pressed || isSavingProfile ? 0.7 : 1 },
                    ]}
                    onPress={stopEditingField}
                    disabled={isSavingProfile}
                  >
                    <ThemedText
                      type="small"
                      style={styles.accountInfoSecondaryButtonText}
                    >
                      Abbrechen
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.accountInfoActionButton,
                      styles.accountInfoPrimaryButton,
                      { opacity: pressed || isSavingProfile ? 0.7 : 1 },
                    ]}
                    onPress={() => void handleSaveProfile("email")}
                    disabled={isSavingProfile}
                  >
                    <ThemedText
                      type="small"
                      style={styles.accountInfoPrimaryButtonText}
                    >
                      {isSavingProfile ? "Speichern..." : "Speichern"}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.accountInfoRow,
                styles.accountInfoRowPressable,
                !canEditEmail ? styles.accountInfoRowDisabled : null,
                { opacity: pressed && canEditEmail ? 0.75 : 1 },
              ]}
              onPress={() => startEditingField("email")}
              disabled={!canEditEmail}
              accessibilityRole="button"
              accessibilityLabel={
                canEditEmail
                  ? "E-Mail bearbeiten"
                  : "E-Mail kann bei OAuth nicht bearbeitet werden"
              }
            >
              <View style={styles.accountInfoContent}>
                <ThemedText type="body" style={styles.accountInfoLabel}>
                  E-Mail
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[
                    styles.accountInfoValue,
                    !canEditEmail ? styles.accountInfoValueDisabled : null,
                  ]}
                >
                  {profileEmail ?? "Nicht hinterlegt"}
                </ThemedText>
              </View>
              <Feather
                name={canEditEmail ? "edit-2" : "lock"}
                size={16}
                color="#6B7280"
              />
            </Pressable>
          )}
          <ThemedText type="small" style={styles.accountInfoHint}>
            {canEditEmail
              ? "Tippe auf Name oder E-Mail, um den Wert direkt zu bearbeiten."
              : "Tippe auf den Namen, um ihn zu bearbeiten. Die E-Mail ist bei OAuth-Accounts gesperrt."}
          </ThemedText>
          <View style={styles.bankConnectRow}>
            <View style={styles.bankConnectContent}>
              <ThemedText
                type="body"
                style={styles.bankConnectLabel}
                lightColor="#9CA3AF"
                darkColor="#9BA1A6"
              >
                Bank verbinden
              </ThemedText>
              <ThemedText
                type="small"
                style={styles.bankConnectSubtext}
                lightColor="#9CA3AF"
                darkColor="#9BA1A6"
              >
                Bald verfügbar
              </ThemedText>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.bankConnectIconButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="link" size={16} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* Benachrichtigungen Section */}
        <View style={styles.sectionTitleWithIcon}>
          <Feather
            name="bell"
            size={20}
            color="#000000"
            style={styles.sectionTitleIcon}
          />
          <ThemedText style={styles.sectionTitle}>
            Benachrichtigungen
          </ThemedText>
        </View>
        <View style={styles.sectionCard}>
          <SettingsRow
            label="Push-Benachrichtigungen"
            action={{
              type: "toggle",
              value: notificationSettings.pushNotificationsEnabled,
              disabled: notificationsDisabled,
              onValueChange: (value) => {
                void (async () => {
                  await updateNotificationSettingsValue((current) => ({
                    ...current,
                    pushNotificationsEnabled: value,
                  }));

                  if (value) {
                    try {
                      const permissionSnapshot =
                        await requestPushPermissionsAndRegisterToken();
                      setPushPermission(permissionSnapshot);

                      if (!permissionSnapshot.granted) {
                        Alert.alert(
                          "Push-Berechtigung fehlt",
                          permissionSnapshot.status === "denied"
                            ? "Bitte aktiviere Mitteilungen in den App-Einstellungen."
                            : "Bitte erteile die Push-Berechtigung, damit Erinnerungen zugestellt werden können.",
                        );
                      }
                    } catch (error) {
                      console.error(
                        "Failed to request push permission and register token:",
                        error,
                      );
                      Alert.alert(
                        "Push konnte nicht aktiviert werden",
                        "Die Berechtigung oder Token-Registrierung ist fehlgeschlagen. Bitte versuche es erneut.",
                      );
                    }
                    return;
                  }

                  try {
                    await deactivateStoredPushToken();
                  } catch (error) {
                    console.error(
                      "Failed to deactivate stored push token:",
                      error,
                    );
                  }
                })();
              },
            }}
            showDivider={true}
          />
          <SettingsRow
            label="Täglicher Reminder"
            action={{
              type: "toggle",
              value: notificationSettings.dailyReminderEnabled,
              disabled: reminderTogglesDisabled,
              onValueChange: (value) => {
                void updateNotificationSettingsValue((current) => ({
                  ...current,
                  dailyReminderEnabled: value,
                }));
              },
            }}
            showDivider={true}
          />
          <SettingsRow
            label="Wochen Report"
            action={{
              type: "toggle",
              value: notificationSettings.weeklyReportEnabled,
              disabled: reminderTogglesDisabled,
              onValueChange: (value) => {
                void updateNotificationSettingsValue((current) => ({
                  ...current,
                  weeklyReportEnabled: value,
                }));
              },
            }}
            showDivider={true}
          />
          <SettingsRow
            label="Monatlicher Reminder"
            action={{
              type: "toggle",
              value: notificationSettings.monthlyReminderEnabled,
              disabled: reminderTogglesDisabled,
              onValueChange: (value) => {
                void updateNotificationSettingsValue((current) => ({
                  ...current,
                  monthlyReminderEnabled: value,
                }));
              },
            }}
            showDivider={true}
          />
          <SettingsRow
            label="Trial-Ende Erinnerung"
            action={{
              type: "toggle",
              value: notificationSettings.trialEndingPushEnabled,
              disabled: reminderTogglesDisabled,
              onValueChange: (value) => {
                void updateNotificationSettingsValue((current) => ({
                  ...current,
                  trialEndingPushEnabled: value,
                }));
              },
            }}
            showDivider={true}
          />
          <SettingsRow
            label="Mitteilungen im Betriebssystem"
            action={{
              type: "button",
              label: notificationPermissionLabel,
              buttonStyle: isNotificationPermissionGranted
                ? styles.loginMethodButton
                : styles.notificationPermissionButton,
              textStyle: isNotificationPermissionGranted
                ? styles.loginMethodButtonText
                : styles.notificationPermissionButtonText,
              textLightColor: "#111827",
              textDarkColor: "#111827",
              onPress: () => {
                if (
                  pushPermission.status === "undetermined" &&
                  notificationSettings.pushNotificationsEnabled
                ) {
                  void requestPushPermissionsAndRegisterToken()
                    .then((permissionSnapshot) => {
                      setPushPermission(permissionSnapshot);
                    })
                    .catch((error) => {
                      console.error(
                        "Failed to request push permission from profile screen:",
                        error,
                      );
                      Alert.alert(
                        "Push-Berechtigung fehlgeschlagen",
                        "Bitte versuche es erneut.",
                      );
                    });
                  return;
                }

                void handleOpenNotificationSettings();
              },
            }}
            showDivider={false}
          />
        </View>
        <ThemedText type="small" style={styles.sectionHint}>
          {isLoadingNotificationSettings
            ? "Benachrichtigungen werden geladen."
            : isSavingNotificationSettings
              ? "Benachrichtigungen werden gespeichert."
              : notificationPermissionHint}
        </ThemedText>

        {/* Support & Rechtliches Section */}
        <View style={styles.sectionTitleWithIcon}>
          <Feather
            name="file-text"
            size={20}
            color="#000000"
            style={styles.sectionTitleIcon}
          />
          <ThemedText style={styles.sectionTitle}>
            Support & Rechtliches
          </ThemedText>
        </View>
        <View style={styles.sectionCard}>
          <SettingsRow
            label="Hilfecenter"
            action={{ type: "text", value: "" }}
            showDivider={true}
            style={styles.preferenceRowDisabled}
          />
          <SettingsRow
            label="Abo verwalten"
            onPress={() => void openSubscriptionManagement()}
            showDivider={true}
          />
          <SettingsRow
            label="Datenschutz"
            onPress={() => void openExternalUrl(PRIVACY_URL)}
            showDivider={true}
          />
          <SettingsRow
            label="Allgemeine Geschäftsbedingungen"
            onPress={() => void openExternalUrl(TERMS_URL)}
            showDivider={false}
          />
        </View>

        {/* Präferenzen Section */}
        <ThemedText style={styles.sectionTitle}>Präferenzen</ThemedText>
        <View style={styles.sectionCard}>
          <SettingsRow
            label="Theme"
            action={{ type: "text", value: "" }}
            showDivider={true}
            style={styles.preferenceRowDisabled}
          />
          <SettingsRow
            label="Währung"
            action={{ type: "text", value: currency }}
            onPress={handleOpenCurrencyModal}
            showDivider={true}
          />
          <SettingsRow
            label="Sprache"
            action={{ type: "text", value: "" }}
            showDivider={false}
            style={styles.preferenceRowDisabled}
          />
        </View>

        {/* Über Luke Section */}
        <ThemedText style={styles.sectionTitle}>Über Luke</ThemedText>
        <View style={styles.sectionCard}>
          <SettingsRow
            label="App Version"
            action={{
              type: "text",
              value: appVersion,
            }}
            showDivider={true}
          />
          <SettingsRow
            label="Feedback geben"
            action={{
              type: "icon",
              iconName: "message-circle",
              onPress: () => setReviewModalVisible(true),
            }}
            showDivider={false}
          />
        </View>

        {/* Account löschen Button */}
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => setDeleteAccountModalVisible(true)}
        >
          <Feather
            name="trash-2"
            size={20}
            color="#EF4444"
            style={styles.deleteButtonIcon}
          />
          <ThemedText style={styles.deleteButtonText} lightColor="#EF4444">
            Account löschen
          </ThemedText>
        </Pressable>

        {/* Development Tools Section */}
        {__DEV__ && (
          <>
            <ThemedText style={styles.sectionTitle}>
              Development Tools
            </ThemedText>
            <View style={styles.devToolsCard}>
              <ThemedText style={styles.devToolsTitle}>
                Test Level Up Screen
              </ThemedText>
              {levels.map((level) => (
                <PurpleGradientButton
                  key={level.id}
                  style={styles.devToolsButton}
                  onPress={() => {
                    navigation.navigate("LevelUp", {
                      levelId: level.id,
                      xpGained: 100,
                    });
                  }}
                >
                  <ThemedText
                    type="small"
                    style={styles.devToolsButtonText}
                    lightColor="#FFFFFF"
                  >
                    Level {level.levelNumber} ({level.name} {level.emoji}) - 100
                    XP
                  </ThemedText>
                </PurpleGradientButton>
              ))}
              <ThemedText style={styles.devToolsTitle}>
                Test Streak Screen
              </ThemedText>
              <PurpleGradientButton
                style={styles.devToolsButton}
                onPress={() => {
                  navigation.navigate("Streak", {
                    variant: "ongoing",
                    xpGained: 50,
                  });
                }}
              >
                <ThemedText
                  type="small"
                  style={styles.devToolsButtonText}
                  lightColor="#FFFFFF"
                >
                  Streak Ongoing (3 Tage) - 50 XP
                </ThemedText>
              </PurpleGradientButton>
              <PurpleGradientButton
                style={styles.devToolsButton}
                onPress={() => {
                  navigation.navigate("Streak", {
                    variant: "completed",
                    xpGained: 150,
                  });
                }}
              >
                <ThemedText
                  type="small"
                  style={styles.devToolsButtonText}
                  lightColor="#FFFFFF"
                >
                  Streak Completed (7 Tage) - 150 XP
                </ThemedText>
              </PurpleGradientButton>
              <ThemedText style={styles.devToolsTitle}>
                Test Review Modal
              </ThemedText>
              <PurpleGradientButton
                style={styles.devToolsButton}
                onPress={() => setReviewModalVisible(true)}
              >
                <ThemedText
                  type="small"
                  style={styles.devToolsButtonText}
                  lightColor="#FFFFFF"
                >
                  Review Modal öffnen
                </ThemedText>
              </PurpleGradientButton>
              <ThemedText style={styles.devToolsTitle}>
                Test Paywall Screen
              </ThemedText>
              <PurpleGradientButton
                style={styles.devToolsButton}
                onPress={() => navigation.navigate("Paywall")}
              >
                <ThemedText
                  type="small"
                  style={styles.devToolsButtonText}
                  lightColor="#FFFFFF"
                >
                  Paywall Screen öffnen
                </ThemedText>
              </PurpleGradientButton>
              <ThemedText style={styles.devToolsTitle}>
                Test Cat Screen
              </ThemedText>
              <PurpleGradientButton
                style={styles.devToolsButton}
                onPress={() => navigation.navigate("Cat")}
              >
                <ThemedText
                  type="small"
                  style={styles.devToolsButtonText}
                  lightColor="#FFFFFF"
                >
                  Cat Screen öffnen
                </ThemedText>
              </PurpleGradientButton>
            </View>
          </>
        )}
      </ScrollView>

      {/* Manage Account Modal */}
      <AppModal
        visible={manageModalVisible}
        onClose={() => setManageModalVisible(false)}
        maxHeightPercent={70}
        keyboardAvoidingEnabled={true}
        contentStyle={[
          styles.modalContent,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>Accountoptionen</ThemedText>
          <Pressable onPress={() => setManageModalVisible(false)}>
            <Feather name="x" size={24} color="#6B7280" />
          </Pressable>
        </View>
        <ThemedText type="small" style={styles.profileFormHint}>
          Passwort-Reset ist nur bei Accounts mit E-Mail-Passwort-Login
          verfügbar.
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryActionButton,
            !canResetPassword ? styles.secondaryActionButtonDisabled : null,
            {
              opacity: pressed || isSavingProfile || isLoggingOut ? 0.7 : 1,
            },
          ]}
          onPress={handlePasswordReset}
          disabled={!canResetPassword || isSavingProfile || isLoggingOut}
        >
          <ThemedText style={styles.secondaryActionButtonText}>
            Passwort zurücksetzen
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            {
              opacity: pressed || isLoggingOut || isSavingProfile ? 0.7 : 1,
            },
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut || isSavingProfile}
        >
          <Feather name="log-out" size={20} color="#EF4444" />
          <ThemedText style={styles.logoutButtonText}>Ausloggen</ThemedText>
        </Pressable>
      </AppModal>

      {/* Delete Account Modal */}
      <AppModal
        visible={deleteAccountModalVisible}
        onClose={() => setDeleteAccountModalVisible(false)}
        maxHeightPercent={70}
        contentStyle={[
          styles.modalContent,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>Account löschen</ThemedText>
          <Pressable onPress={() => setDeleteAccountModalVisible(false)}>
            <Feather name="x" size={24} color="#6B7280" />
          </Pressable>
        </View>

        <ThemedText style={styles.deleteModalDescription}>
          Möchtest du wirklich deinen Account löschen? Diese Aktion kann nicht
          rückgängig gemacht werden.
        </ThemedText>

        <ThemedText type="small" style={styles.deleteModalHint}>
          {accountDeletionSubscriptionHint}
        </ThemedText>

        <View style={styles.deleteModalButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.deleteModalCancelButton,
              {
                opacity: pressed || isDeletingAccount ? 0.7 : 1,
              },
            ]}
            onPress={() => setDeleteAccountModalVisible(false)}
            disabled={isDeletingAccount}
          >
            <ThemedText style={styles.deleteModalCancelText}>
              Abbrechen
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.deleteModalConfirmButton,
              {
                opacity: pressed || isDeletingAccount ? 0.7 : 1,
              },
            ]}
            onPress={() => void handleDeleteAccount()}
            disabled={isDeletingAccount}
          >
            <ThemedText style={styles.deleteModalConfirmText}>
              {isDeletingAccount ? "Wird gelöscht..." : "Löschen"}
            </ThemedText>
          </Pressable>
        </View>
      </AppModal>

      <AppModal
        visible={currencyModalVisible}
        onClose={handleCloseCurrencyModal}
        maxHeightPercent={70}
        contentStyle={[
          styles.modalContent,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>Währung ändern</ThemedText>
          <Pressable onPress={handleCloseCurrencyModal}>
            <Feather name="x" size={24} color="#6B7280" />
          </Pressable>
        </View>

        <ThemedText type="small" style={styles.profileFormHint}>
          Wähle die Standardwährung für Beträge, Budgets und Auswertungen.
        </ThemedText>

        <View style={styles.currencyOptionsList}>
          {CURRENCY_OPTIONS.map((option) => {
            const isSelected = selectedCurrency === option.code;

            return (
              <Pressable
                key={option.code}
                onPress={() => setSelectedCurrency(option.code)}
                style={({ pressed }) => [
                  styles.currencyOptionCard,
                  isSelected ? styles.currencyOptionCardSelected : null,
                  pressed ? styles.currencyOptionCardPressed : null,
                ]}
              >
                <View style={styles.currencyOptionTextContainer}>
                  <ThemedText style={styles.currencyOptionLabel}>
                    {option.label}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={styles.currencyOptionDescription}
                  >
                    {option.description}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.currencyOptionIndicator,
                    isSelected ? styles.currencyOptionIndicatorSelected : null,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.currencyModalActions}>
          <Pressable
            style={({ pressed }) => [
              styles.currencyModalSecondaryButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleCloseCurrencyModal}
          >
            <ThemedText style={styles.currencyModalSecondaryButtonText}>
              Abbrechen
            </ThemedText>
          </Pressable>

          <PurpleGradientButton
            style={styles.currencyModalPrimaryButton}
            onPress={handleSaveCurrency}
            disabled={selectedCurrency === currency}
          >
            <ThemedText style={styles.currencyModalPrimaryButtonText}>
              Speichern
            </ThemedText>
          </PurpleGradientButton>
        </View>
      </AppModal>

      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
      />
    </View>
  );
}
