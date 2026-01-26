import React, { useState } from "react";
import { View, ScrollView, Pressable, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { SettingsRow } from "@/components/SettingsRow";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { styles } from "./styles/profile-screen.styles";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Profile screen displaying user information, settings, and account options.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { levels } = useApp();
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);

  // Mock data - no functionality
  const userName = "Deni";
  const savedAmount = "€ 2.478,23";
  const daysSince = "83 Tagen";
  const highestStreak = "26 Tage";
  const loginMethod = "Google Account";
  const appVersion = "1.0.0";

  const handleLogout = () => {
    // TODO: Implement logout functionality
    setManageModalVisible(false);
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
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
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
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <ThemedText style={styles.profileAvatar}>🦊</ThemedText>
          <ThemedText style={styles.profileName}>{userName}</ThemedText>
        </View>
        <View style={styles.profileStats}>
          <View style={styles.statColumn}>
            <ThemedText
              type="small"
              style={styles.statLabel}
              lightColor="#9CA3AF"
              darkColor="#9BA1A6"
            >
              Gespart
            </ThemedText>
            <ThemedText type="body" style={styles.statValue}>
              {savedAmount}
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
      <Modal
        visible={manageModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setManageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setManageModalVisible(false)}
          />
          <View
            style={[
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
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={20} color="#EF4444" />
              <ThemedText style={styles.logoutButtonText}>
                Ausloggen
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteAccountModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDeleteAccountModalVisible(false)}
          />
          <View
            style={[
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
          </View>
        </View>
      </Modal>
    </View>
  );
}
