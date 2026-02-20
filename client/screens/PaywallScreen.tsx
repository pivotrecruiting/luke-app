import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { Spacing, Colors } from "@/constants/theme";
import { styles } from "./styles/paywall-screen.styles";

type PlanT = "monthly" | "yearly" | "lifetime";

const FEATURES: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
  { icon: "eye", text: "Behalte stets den Überblick" },
  { icon: "credit-card", text: "Nie wieder Mahngebühren zahlen" },
  { icon: "bar-chart-2", text: "Einfacher als jede Excel-Liste" },
];

/**
 * Paywall screen displayed during onboarding. Offers subscription plans
 * and calls completeOnboarding on CTA press.
 */
export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { completeOnboarding } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<PlanT>("yearly");

  const headerMinHeight = Math.max(height * 0.27, 140);
  const studyCardOverlap = Spacing["5xl"];

  const handleCtaPress = () => {
    completeOnboarding();
  };

  const handleRestorePurchases = () => {
    Alert.alert("Käufe wiederherstellen", "Funktion wird noch implementiert.");
  };

  const handleTermsAndPrivacy = () => {
    Alert.alert(
      "Nutzungsbedingungen & Datenschutz",
      "Funktion wird noch implementiert.",
    );
  };

  const PlanCard = ({
    plan,
    title,
    price,
    description,
    badge,
  }: {
    plan: PlanT;
    title: string;
    price: string;
    description: string;
    badge?: string;
  }) => {
    const isSelected = selectedPlan === plan;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.planCard,
          isSelected && styles.planCardSelected,
          { opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() => setSelectedPlan(plan)}
      >
        {badge && (
          <View style={styles.planCardBadge}>
            <Text style={styles.planCardBadgeText}>{badge}</Text>
          </View>
        )}
        <Text style={styles.planCardTitle}>{title}</Text>
        <Text style={styles.planCardPrice}>{price}</Text>
        <Text style={styles.planCardDescription}>{description}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - full width, CI gradient (like LevelUp/Streak) */}
        <LinearGradient
          colors={[
            "rgba(115, 64, 253, 0.9)",
            "rgba(115, 64, 253, 0.7)",
            "rgba(115, 64, 253, 0.5)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.header,
            {
              paddingTop: insets.top + Spacing.xl,
              minHeight: headerMinHeight,
            },
          ]}
        >
          <Text style={styles.headerTitle}>
            Sparen - diesmal ohne Ausreden.
          </Text>
          <Text style={styles.headerSubtitle}>
            Starte jetzt deine Testphase und mach den ersten echten Schritt zu
            deinem Sparziel.
          </Text>
        </LinearGradient>

        {/* Study card - white, overlapping */}
        <View style={[styles.studyCard, { marginTop: -studyCardOverlap }]}>
          <Text style={styles.studyCardTitle}>Studien zeigen:</Text>
          <Text style={styles.studyCardBody}>
            Wer Ausgaben aktiv visualisiert, reduziert Impulskäufe um bis zu
            30%.
          </Text>
        </View>

        {/* Content - light gray background */}
        <View style={styles.contentSection}>
          <Text style={styles.headline}>
            Starte jetzt deine Reise für mehr Geld am Monatsende.
          </Text>

          {FEATURES.map(({ icon, text }) => (
            <View key={text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={icon} size={22} color={Colors.light.primary} />
              </View>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}

          {/* Plan cards */}
          <View style={styles.plansContainer}>
            <PlanCard
              plan="monthly"
              title="Monthly"
              price="€ 2,99/mo"
              description="monatliche Abrechnung"
            />
            <PlanCard
              plan="yearly"
              title="Yearly"
              price="€ 29,99/an"
              description="jährliche Abrechnung"
              badge="2 Monate gratis"
            />
            <PlanCard
              plan="lifetime"
              title="Lifetime"
              price="€ 89,99"
              description="einmalige Abrechnung"
            />
          </View>

          <Text style={styles.preCtaText}>
            7 Tage kostenlos testen, danach nur €29,99/Jahr
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={handleCtaPress}
          >
            <Text style={styles.ctaButtonText}>Jetzt Testphase starten</Text>
          </Pressable>

          <View style={styles.footerLinks}>
            <Pressable onPress={handleRestorePurchases}>
              <Text style={styles.footerLink}>Käufe wiederherstellen</Text>
            </Pressable>
            <Text style={styles.footerSeparator}>•</Text>
            <Pressable onPress={handleTermsAndPrivacy}>
              <Text style={styles.footerLink}>
                Nutzungsbedingungen & Datenschutz
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
