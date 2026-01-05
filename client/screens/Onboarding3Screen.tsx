import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import ProgressDots from "@/components/ProgressDots";
import Chip from "@/components/Chip";
import CurrencyInput from "@/components/CurrencyInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

const savingsGoals = [
  "Urlaub",
  "Führerschein",
  "Wohnung",
  "Hochzeit",
  "Schuldenfrei",
  "Notgroschen",
  "Uhr",
  "Auto",
  "Weihnachten",
  "Vespa",
  "Handy",
  "Bildschirm",
  "Laptop",
  "Klarna",
];

const iconKeywords: Array<{ keywords: string[]; icon: string }> = [
  { keywords: ["iphone", "handy", "smartphone", "telefon", "phone", "samsung", "pixel", "xiaomi"], icon: "smartphone" },
  { keywords: ["laptop", "macbook", "notebook", "computer", "pc", "imac", "mac"], icon: "monitor" },
  { keywords: ["bildschirm", "monitor", "tv", "fernseher", "display", "screen"], icon: "monitor" },
  { keywords: ["auto", "car", "fahrzeug", "wagen", "tesla", "bmw", "mercedes", "audi", "vw"], icon: "truck" },
  { keywords: ["vespa", "roller", "motorrad", "moped", "bike", "fahrrad", "ebike", "e-bike"], icon: "compass" },
  { keywords: ["urlaub", "reise", "ferien", "travel", "trip", "strand", "meer", "vacation"], icon: "sun" },
  { keywords: ["führerschein", "lizenz", "license", "prüfung"], icon: "award" },
  { keywords: ["wohnung", "haus", "home", "apartment", "immobilie", "miete", "eigentum", "zimmer"], icon: "home" },
  { keywords: ["hochzeit", "heirat", "wedding", "ring", "verlobung", "ehe"], icon: "heart" },
  { keywords: ["schulden", "kredit", "loan", "abbezahlen", "tilgung", "raten"], icon: "credit-card" },
  { keywords: ["notgroschen", "reserve", "emergency", "rücklage", "sicherheit"], icon: "shield" },
  { keywords: ["uhr", "watch", "armbanduhr", "rolex", "smartwatch", "apple watch"], icon: "watch" },
  { keywords: ["weihnachten", "christmas", "geschenk", "gift", "geburtstag", "birthday", "present"], icon: "gift" },
  { keywords: ["klarna", "paypal", "zahlung", "payment", "rechnung", "bill"], icon: "dollar-sign" },
  { keywords: ["kamera", "camera", "foto", "photo", "gopro", "dslr"], icon: "camera" },
  { keywords: ["musik", "music", "kopfhörer", "headphones", "airpods", "spotify", "instrument", "gitarre"], icon: "headphones" },
  { keywords: ["fitness", "gym", "sport", "training", "workout", "mitgliedschaft"], icon: "activity" },
  { keywords: ["buch", "book", "bücher", "kindle", "lesen", "reading"], icon: "book" },
  { keywords: ["kurs", "course", "ausbildung", "studium", "uni", "schule", "lernen", "education"], icon: "book-open" },
  { keywords: ["flug", "flight", "flugzeug", "plane", "airline", "fliegen"], icon: "send" },
  { keywords: ["möbel", "furniture", "sofa", "couch", "tisch", "stuhl", "bett", "schrank"], icon: "box" },
  { keywords: ["kleidung", "clothes", "mode", "fashion", "schuhe", "shoes", "jacke", "anzug"], icon: "shopping-bag" },
  { keywords: ["spiel", "game", "playstation", "xbox", "nintendo", "switch", "ps5", "gaming", "konsole"], icon: "play" },
  { keywords: ["tablet", "ipad", "surface"], icon: "tablet" },
  { keywords: ["schmuck", "jewelry", "kette", "armband", "ohrringe", "gold", "silber"], icon: "star" },
  { keywords: ["baby", "kind", "child", "familie", "family"], icon: "users" },
  { keywords: ["hund", "katze", "haustier", "pet", "tier", "animal"], icon: "heart" },
  { keywords: ["garten", "garden", "pflanzen", "plants", "balkon"], icon: "sun" },
  { keywords: ["küche", "kitchen", "kochen", "cooking", "thermomix", "kaffeemaschine"], icon: "coffee" },
];

function getIconForText(text: string): string {
  const lowerText = text.toLowerCase();
  for (const entry of iconKeywords) {
    for (const keyword of entry.keywords) {
      if (lowerText.includes(keyword)) {
        return entry.icon;
      }
    }
  }
  return "target";
}

export default function Onboarding3Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [selectedGoal, setSelectedGoal] = useState("Wohnung");
  const [amount, setAmount] = useState("1000,00");
  const [monthlyAmount, setMonthlyAmount] = useState("200,00");

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <ProgressDots total={5} current={2} />

        <View style={styles.headerContainer}>
          <Text style={styles.titleBold}>Worauf sparst du?</Text>
          <Text style={styles.subtitle}>
            Dein erstes Ziel gibt deiner Reise eine{"\n"}Richtung
          </Text>
        </View>

        <View style={styles.chipsContainer}>
          {savingsGoals.map((goal) => (
            <Chip
              key={goal}
              label={goal}
              selected={selectedGoal === goal}
              onPress={() => setSelectedGoal(goal)}
            />
          ))}
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.nameInputContainer}>
              <Feather
                name={getIconForText(selectedGoal) as any}
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.nameInput}
                value={selectedGoal}
                onChangeText={setSelectedGoal}
                placeholder="Zielname"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Summe</Text>
            <CurrencyInput
              value={amount}
              onChangeText={setAmount}
              highlighted={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monatlicher Beitrag</Text>
            <CurrencyInput
              value={monthlyAmount}
              onChangeText={setMonthlyAmount}
              highlighted={false}
            />
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate("Onboarding4")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>WEITER</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
    paddingHorizontal: Spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    marginTop: Spacing["2xl"],
  },
  titleBold: {
    ...Typography.h1,
    color: Colors.light.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing["3xl"],
  },
  formContainer: {
    marginTop: Spacing["4xl"],
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.small,
    color: "#6B7280",
  },
  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.inputBorderLight,
    paddingHorizontal: Spacing.lg,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  nameInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
    padding: 0,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.light.backgroundRoot,
    paddingTop: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.light.buttonPrimary,
    borderRadius: BorderRadius.md,
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
  },
});
