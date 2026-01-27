import React, { useMemo, useState } from "react";
import { Alert, View, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { SettingsRow } from "@/components/SettingsRow";
import { Spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { resolveLevelByXp } from "@/features/xp/utils/levels";
import { formatDaysSince } from "@/utils/dates";
import { getUserFirstName } from "@/utils/user";
import { styles } from "./styles/profile-screen.styles";
import { AppModal } from "@/components/ui/app-modal";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Profile screen displaying user information, settings, and account options.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { levels, userProgress, transactionBalance, currency, userName } =
    useApp();
  const { user } = useAuth();
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileCardOverlap = Spacing["4xl"];

  const loginMethod = "Google Account";
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
  const firstName = getUserFirstName(userName ?? metadataName);
  const fallbackLevel = currentLevel?.levelNumber ?? 1;
  const profileName = firstName ?? `Level ${fallbackLevel}`;
  const levelEmoji = currentLevel?.emoji ?? "🦊";
  const savingsLabel = transactionBalance >= 0 ? "Gespart" : "Ausgegeben";
  const savingsAmount = formatCurrency(Math.abs(transactionBalance));
  const daysSince = formatDaysSince(user?.created_at);
  const highestStreakValue = userProgress?.longestStreak ?? 0;
  const highestStreak = `${highestStreakValue} ${
    highestStreakValue === 1 ? "Tag" : "Tage"
  }`;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
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

  const handleDeleteAccount = () => {
    // TODO: Implement delete account functionality
    setDeleteAccountModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(115, 64, 253, 0.9)", "rgba(115, 64, 253, 0.7)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
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
      <View style={[styles.profileCard, { marginTop: -profileCardOverlap }]}>
        <View style={styles.profileHeader}>
          <Pressable
            style={({ pressed }) => [
              styles.profileAvatarButton,
              pressed ? styles.profileAvatarButtonPressed : null,
            ]}
            onPress={() => {
              if (currentLevel?.id) {
                navigation.navigate("LevelUp", { levelId: currentLevel.id });
                return;
              }
              navigation.navigate("LevelUp", {});
            }}
            accessibilityRole="button"
            accessibilityLabel="Level Up anzeigen"
            hitSlop={8}
          >
            <ThemedText style={styles.profileAvatar}>{levelEmoji}</ThemedText>
          </Pressable>
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
      </View>

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
              onPress={() => setManageModalVisible(true)}
            >
              <ThemedText type="small" style={styles.loginMethodButtonText}>
                Manage
              </ThemedText>
            </Pressable>
          </View>
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
            label="Täglicher Reminder"
            action={{
              type: "toggle",
              value: false,
            }}
            showDivider={true}
          />
          <SettingsRow
            label="Wochen Report"
            action={{
              type: "toggle",
              value: false,
            }}
            showDivider={true}
          />
          <SettingsRow
            label="Monatlicher Reminder"
            action={{
              type: "toggle",
              value: false,
            }}
            showDivider={false}
          />
        </View>

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
          <SettingsRow label="Hilfecenter" showDivider={true} />
          <SettingsRow label="Datenschutz" showDivider={true} />
          <SettingsRow
            label="Allgemeine Geschäftsbedingungen"
            showDivider={false}
          />
        </View>

        {/* Präferenzen Section */}
        <ThemedText style={styles.sectionTitle}>Präferenzen</ThemedText>
        <View style={styles.sectionCard}>
          <SettingsRow label="Theme" showDivider={true} />
          <SettingsRow label="Währung" showDivider={true} />
          <SettingsRow label="Monatlicher Reminder" showDivider={false} />
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
                <Pressable
                  key={level.id}
                  style={({ pressed }) => [
                    styles.devToolsButton,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
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
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Manage Account Modal */}
      <AppModal
        visible={manageModalVisible}
        onClose={() => setManageModalVisible(false)}
        maxHeightPercent={70}
        contentStyle={[
          styles.modalContent,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>Account verwalten</ThemedText>
          <Pressable onPress={() => setManageModalVisible(false)}>
            <Feather name="x" size={24} color="#6B7280" />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            { opacity: pressed || isLoggingOut ? 0.7 : 1 },
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
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

        <View style={styles.deleteModalButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.deleteModalCancelButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setDeleteAccountModalVisible(false)}
          >
            <ThemedText style={styles.deleteModalCancelText}>
              Abbrechen
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.deleteModalConfirmButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleDeleteAccount}
          >
            <ThemedText style={styles.deleteModalConfirmText}>
              Löschen
            </ThemedText>
          </Pressable>
        </View>
      </AppModal>
    </View>
  );
}
