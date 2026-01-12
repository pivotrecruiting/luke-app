import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import ProgressDots from "@/components/ProgressDots";
import Chip from "@/components/Chip";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

const categories = [
  "Essen & Trinken",
  "Feiern",
  "Shoppen",
  "Sprit",
  "Auswärts",
  "Freizeit",
  "Events",
  "Mobilität",
  "Coffee 2 go",
  "Aus",
];

const amounts = [10, 20, 30, 50, 100, 150, 200, 250, 300, 400, 500];

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export default function Onboarding7Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState<string>("Shoppen");
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < amounts.length) {
      setSelectedAmount(amounts[index]);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < amounts.length) {
      scrollViewRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });
      setSelectedAmount(amounts[index]);
    }
  };

  const handleContinue = () => {
    navigation.navigate("Paywall");
  };

  const initialScrollIndex = amounts.indexOf(50);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.content}>
        <ProgressDots total={5} current={4} />

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Wofür gibst du aktuell</Text>
          <Text style={styles.title}>am meisten Geld aus?</Text>
          <Text style={styles.subtitle}>
            Wähle einen Bereich den wir gemeinsam zähmen
          </Text>
        </View>

        <View style={styles.chipsContainer}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </View>

        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>
            Dein monatliches Limit für{" "}
            <Text style={styles.pickerLabelBold}>{selectedCategory}</Text>:
          </Text>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerHighlight} />
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScrollEnd}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
              }}
              contentOffset={{ x: 0, y: initialScrollIndex * ITEM_HEIGHT }}
              keyboardShouldPersistTaps="handled"
            >
              {amounts.map((amount) => (
                <View key={amount} style={styles.pickerItem}>
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedAmount === amount && styles.pickerItemTextSelected,
                    ]}
                  >
                    {selectedAmount === amount ? `€ ${amount}` : amount}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>WEITER</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing["2xl"],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: Spacing.md,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing["2xl"],
  },
  pickerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing["2xl"],
  },
  pickerLabel: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: Spacing.lg,
  },
  pickerLabelBold: {
    fontWeight: "700",
    color: "#000000",
  },
  pickerContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 200,
    overflow: "hidden",
    position: "relative",
  },
  pickerHighlight: {
    position: "absolute",
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 1,
    pointerEvents: "none",
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerItemText: {
    fontSize: 20,
    color: "#D1D5DB",
  },
  pickerItemTextSelected: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: "#FFFFFF",
  },
  continueButton: {
    backgroundColor: "#8E97FD",
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
