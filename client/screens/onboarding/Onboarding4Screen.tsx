import React, { useCallback, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ProgressDots from "@/components/ProgressDots";
import Chip from "@/components/Chip";
import CurrencyInput from "@/components/CurrencyInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import {
  useOnboardingStore,
  type OnboardingStoreT,
} from "@/stores/onboarding-store";

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

const emojiKeywords: { keywords: string[]; emoji: string }[] = [
  {
    keywords: [
      "iphone",
      "handy",
      "smartphone",
      "telefon",
      "phone",
      "samsung",
      "pixel",
      "xiaomi",
    ],
    emoji: "📱",
  },
  {
    keywords: [
      "laptop",
      "macbook",
      "notebook",
      "computer",
      "pc",
      "imac",
      "mac",
    ],
    emoji: "💻",
  },
  {
    keywords: ["bildschirm", "monitor", "tv", "fernseher", "display", "screen"],
    emoji: "🖥️",
  },
  {
    keywords: [
      "auto",
      "car",
      "fahrzeug",
      "wagen",
      "tesla",
      "bmw",
      "mercedes",
      "audi",
      "vw",
    ],
    emoji: "🚗",
  },
  {
    keywords: [
      "vespa",
      "roller",
      "motorrad",
      "moped",
      "bike",
      "fahrrad",
      "ebike",
      "e-bike",
    ],
    emoji: "🛵",
  },
  {
    keywords: [
      "urlaub",
      "reise",
      "ferien",
      "travel",
      "trip",
      "strand",
      "meer",
      "vacation",
    ],
    emoji: "🏖️",
  },
  { keywords: ["führerschein", "lizenz", "license", "prüfung"], emoji: "🎓" },
  {
    keywords: [
      "wohnung",
      "haus",
      "home",
      "apartment",
      "immobilie",
      "miete",
      "eigentum",
      "zimmer",
    ],
    emoji: "🏠",
  },
  {
    keywords: ["hochzeit", "heirat", "wedding", "ring", "verlobung", "ehe"],
    emoji: "💍",
  },
  {
    keywords: [
      "schulden",
      "kredit",
      "loan",
      "abbezahlen",
      "tilgung",
      "raten",
      "klarna",
    ],
    emoji: "💳",
  },
  {
    keywords: ["notgroschen", "reserve", "emergency", "rücklage", "sicherheit"],
    emoji: "🛡️",
  },
  {
    keywords: [
      "uhr",
      "watch",
      "armbanduhr",
      "rolex",
      "smartwatch",
      "apple watch",
    ],
    emoji: "⌚",
  },
  {
    keywords: [
      "weihnachten",
      "christmas",
      "geschenk",
      "gift",
      "geburtstag",
      "birthday",
      "present",
    ],
    emoji: "🎁",
  },
  {
    keywords: ["paypal", "zahlung", "payment", "rechnung", "bill"],
    emoji: "💵",
  },
  {
    keywords: ["kamera", "camera", "foto", "photo", "gopro", "dslr"],
    emoji: "📷",
  },
  {
    keywords: [
      "musik",
      "music",
      "kopfhörer",
      "headphones",
      "airpods",
      "spotify",
      "instrument",
      "gitarre",
    ],
    emoji: "🎧",
  },
  {
    keywords: [
      "fitness",
      "gym",
      "sport",
      "training",
      "workout",
      "mitgliedschaft",
    ],
    emoji: "💪",
  },
  {
    keywords: ["buch", "book", "bücher", "kindle", "lesen", "reading"],
    emoji: "📚",
  },
  {
    keywords: [
      "kurs",
      "course",
      "ausbildung",
      "studium",
      "uni",
      "schule",
      "lernen",
      "education",
    ],
    emoji: "🎓",
  },
  {
    keywords: ["flug", "flight", "flugzeug", "plane", "airline", "fliegen"],
    emoji: "✈️",
  },
  {
    keywords: [
      "möbel",
      "furniture",
      "sofa",
      "couch",
      "tisch",
      "stuhl",
      "bett",
      "schrank",
    ],
    emoji: "🛋️",
  },
  {
    keywords: [
      "kleidung",
      "clothes",
      "mode",
      "fashion",
      "schuhe",
      "shoes",
      "jacke",
      "anzug",
    ],
    emoji: "👗",
  },
  {
    keywords: [
      "spiel",
      "game",
      "playstation",
      "xbox",
      "nintendo",
      "switch",
      "ps5",
      "gaming",
      "konsole",
    ],
    emoji: "🎮",
  },
  { keywords: ["tablet", "ipad", "surface"], emoji: "📱" },
  {
    keywords: [
      "schmuck",
      "jewelry",
      "kette",
      "armband",
      "ohrringe",
      "gold",
      "silber",
    ],
    emoji: "💎",
  },
  { keywords: ["baby", "kind", "child", "familie", "family"], emoji: "👶" },
  {
    keywords: ["hund", "katze", "haustier", "pet", "tier", "animal"],
    emoji: "🐕",
  },
  {
    keywords: ["garten", "garden", "pflanzen", "plants", "balkon"],
    emoji: "🌱",
  },
  {
    keywords: [
      "küche",
      "kitchen",
      "kochen",
      "cooking",
      "thermomix",
      "kaffeemaschine",
    ],
    emoji: "☕",
  },
];

function getEmojiForText(text: string): string {
  const lowerText = text.toLowerCase();
  for (const entry of emojiKeywords) {
    for (const keyword of entry.keywords) {
      if (lowerText.includes(keyword)) {
        return entry.emoji;
      }
    }
  }
  return "🎯";
}

export default function Onboarding4Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const setGoalDraft = useOnboardingStore(
    (state: OnboardingStoreT) => state.setGoalDraft,
  );
  const resetGoalDraft = useOnboardingStore(
    (state: OnboardingStoreT) => state.resetGoalDraft,
  );
  const [selectedGoal, setSelectedGoal] = useState("Wohnung");
  const [amount, setAmount] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");

  const handleContinue = () => {
    if (selectedGoal && amount) {
      const parsedAmount = Number.parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        const emoji = getEmojiForText(selectedGoal);
        const parsedMonthly = Number.parseFloat(
          monthlyAmount.replace(",", "."),
        );
        const normalizedMonthly =
          !isNaN(parsedMonthly) && parsedMonthly > 0 ? parsedMonthly : null;
        setGoalDraft({
          name: selectedGoal,
          icon: emoji,
          target: parsedAmount,
          monthlyContribution: normalizedMonthly,
        });
      } else {
        setGoalDraft(null);
      }
    } else {
      setGoalDraft(null);
    }
    navigation.navigate("Onboarding5");
  };

  useFocusEffect(
    useCallback(() => {
      setSelectedGoal("");
      setAmount("");
      setMonthlyAmount("");
      resetGoalDraft();
    }, [resetGoalDraft]),
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <ProgressDots total={8} current={3} />

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
              <Text style={styles.inputEmoji}>
                {getEmojiForText(selectedGoal)}
              </Text>
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
          onPress={handleContinue}
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
  inputEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  nameInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
    padding: 0,
    outlineStyle: "none",
  } as any,
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
