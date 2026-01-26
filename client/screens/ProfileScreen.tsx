import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { levels } = useApp();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <Text style={styles.headerTitle}>Profil</Text>
        <Text style={styles.headerSubtitle}>Einstellungen & mehr</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileCard}>
          <Text style={styles.foxEmoji}>🦊</Text>
          <Text style={styles.profileName}>Deni</Text>
        </View>

        <Text style={styles.sectionTitle}>Goals</Text>
        <View style={styles.placeholderBox} />

        <Text style={styles.sectionTitle}>Budgets</Text>
        <View style={styles.placeholderBox} />

        {__DEV__ && (
          <>
            <Text style={styles.sectionTitle}>Development Tools</Text>
            <View style={styles.devSection}>
              <Text style={styles.devSectionSubtitle}>Test Level Up Screen</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.testButton,
                  pressed && styles.testButtonPressed,
                ]}
                onPress={() => {
                  const level = levels.find((l) => l.levelNumber === 1);
                  if (level) {
                    navigation.navigate("LevelUp", {
                      levelId: level.id,
                      xpGained: 100,
                    });
                  }
                }}
              >
                <Text style={styles.testButtonText}>
                  Level 1 (Sparfuchs 🦊) - 100 XP
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.testButton,
                  pressed && styles.testButtonPressed,
                ]}
                onPress={() => {
                  const level = levels.find((l) => l.levelNumber === 2);
                  if (level) {
                    navigation.navigate("LevelUp", {
                      levelId: level.id,
                      xpGained: 200,
                    });
                  }
                }}
              >
                <Text style={styles.testButtonText}>
                  Level 2 (Aktiv ✨) - 200 XP
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.testButton,
                  pressed && styles.testButtonPressed,
                ]}
                onPress={() => {
                  const level = levels.find((l) => l.levelNumber === 3);
                  if (level) {
                    navigation.navigate("LevelUp", {
                      levelId: level.id,
                      xpGained: 150,
                    });
                  }
                }}
              >
                <Text style={styles.testButtonText}>
                  Level 3 (Pro 💎) - 150 XP
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.testButton,
                  pressed && styles.testButtonPressed,
                ]}
                onPress={() => {
                  const level = levels.find((l) => l.levelNumber === 4);
                  if (level) {
                    navigation.navigate("LevelUp", {
                      levelId: level.id,
                      xpGained: 25,
                    });
                  }
                }}
              >
                <Text style={styles.testButtonText}>
                  Level 4 (Elite 🛡️) - 25 XP
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.testButton,
                  pressed && styles.testButtonPressed,
                ]}
                onPress={() => {
                  const level = levels.find((l) => l.levelNumber === 5);
                  if (level) {
                    navigation.navigate("LevelUp", {
                      levelId: level.id,
                      xpGained: 5,
                    });
                  }
                }}
              >
                <Text style={styles.testButtonText}>
                  Level 5 (Icon 👑) - 5 XP
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  foxEmoji: {
    fontSize: 32,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  placeholderBox: {
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    height: 120,
    marginBottom: 24,
  },
  devSection: {
    backgroundColor: "#FFF4E6",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  devSectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E65100",
    marginBottom: Spacing.md,
  },
  testButton: {
    backgroundColor: "#7340fd",
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    alignItems: "center",
  },
  testButtonPressed: {
    opacity: 0.8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
