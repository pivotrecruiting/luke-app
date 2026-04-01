import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { Colors, HeaderGradient, Spacing } from "@/constants/theme";
import { PurpleGradientButton } from "@/components/ui/purple-gradient-button";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  listActiveBillingProducts,
  type BillingProductT,
} from "@/services/billing-products-service";
import {
  getRevenueCatAvailability,
  getRevenueCatPackageOptions,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  type RevenueCatPackageOptionT,
} from "@/services/revenuecat-service";
import {
  openExternalUrl,
  PRIVACY_URL,
  TERMS_URL,
} from "@/utils/external-links";
import { styles } from "./styles/paywall-screen.styles";

type PlanT = "monthly" | "yearly" | "lifetime";

const FEATURES: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
  semibold?: boolean;
}[] = [
  { icon: "eye", text: "Behalte stets den Überblick", semibold: true },
  { icon: "bank-check", text: "Nie wieder Mahngebühren zahlen" },
  { icon: "chart-bar", text: "Einfacher als jede Excel-Liste" },
];

/**
 * Paywall screen that surfaces server-driven trial urgency and billing products.
 */
export default function PaywallScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const {
    hasAccess,
    paywallRequired,
    paywallVisible,
    trialEndsAt,
    daysUntilTrialExpiry,
    refreshAccessState,
  } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<PlanT>("yearly");
  const [fallbackProducts, setFallbackProducts] = useState<BillingProductT[]>(
    [],
  );
  const [revenueCatPackages, setRevenueCatPackages] = useState<
    RevenueCatPackageOptionT[]
  >([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [revenueCatErrorMessage, setRevenueCatErrorMessage] = useState<
    string | null
  >(null);

  const headerMinHeight = Math.max(height * 0.27, 140);
  const studyCardOverlap = Spacing["5xl"];

  usePreventRemove(paywallRequired, () => {
    if (!paywallRequired) {
      return;
    }
  });

  useEffect(() => {
    if (!paywallRequired) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );

    return () => {
      subscription.remove();
    };
  }, [paywallRequired]);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setIsProductsLoading(true);

      try {
        const revenueCatAvailability = getRevenueCatAvailability();
        const nextProducts = await listActiveBillingProducts();
        if (!active) {
          return;
        }

        setFallbackProducts(nextProducts);

        if (revenueCatAvailability.status === "ready") {
          const nextPackages = await getRevenueCatPackageOptions();

          if (!active) {
            return;
          }

          setRevenueCatPackages(nextPackages);
          setRevenueCatErrorMessage(
            nextPackages.length === 0
              ? "In RevenueCat ist aktuell kein aktives Offering verfuegbar."
              : null,
          );

          if (nextPackages.some((pkg) => pkg.plan === "yearly")) {
            setSelectedPlan("yearly");
            return;
          }

          if (nextPackages[0]) {
            setSelectedPlan(nextPackages[0].plan);
            return;
          }
        } else {
          setRevenueCatErrorMessage(
            revenueCatAvailability.status === "missing_api_key"
              ? "RevenueCat API-Keys fehlen noch in den `EXPO_PUBLIC_REVENUECAT_*` Variablen."
              : "RevenueCat ist auf dieser Plattform nicht verfuegbar.",
          );
        }

        if (nextProducts.some((product) => product.productKey === "yearly")) {
          setSelectedPlan("yearly");
          return;
        }

        if (nextProducts[0]) {
          setSelectedPlan(nextProducts[0].productKey);
        }
      } catch (error) {
        console.error("Failed to load billing products:", error);
      } finally {
        if (active) {
          setIsProductsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const waitForServerAccessSync = async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const nextAccessState = await refreshAccessState();

      if (!nextAccessState.paywallRequired) {
        return true;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }

    const finalAccessState = await refreshAccessState();
    return !finalAccessState.paywallRequired;
  };

  const handleCtaPress = () => {
    const selectedPackage = revenueCatPackages.find(
      (pkg) => pkg.plan === selectedPlan,
    );

    if (!selectedPackage) {
      Alert.alert(
        "Kauf derzeit nicht verfuegbar",
        revenueCatErrorMessage ??
          "Es konnte kein kaufbares RevenueCat-Paket geladen werden.",
      );
      return;
    }

    void (async () => {
      setIsActionLoading(true);

      try {
        const purchaseResult = await purchaseRevenueCatPackage(
          selectedPackage.packageToPurchase,
        );

        if (purchaseResult.status === "cancelled") {
          return;
        }

        if (purchaseResult.status === "pending") {
          Alert.alert("Kauf ausstehend", purchaseResult.message);
          return;
        }

        const syncedAccess = await waitForServerAccessSync();

        if (syncedAccess) {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
          return;
        }

        Alert.alert(
          "Kauf verarbeitet",
          "Der Store-Kauf war erfolgreich. Der Zugriff wird serverseitig noch synchronisiert. Bitte versuche es gleich erneut oder nutze 'Kaeufe wiederherstellen'.",
        );
      } catch (error) {
        console.error("RevenueCat purchase failed:", error);
        Alert.alert(
          "Kauf fehlgeschlagen",
          "Der Kauf konnte nicht abgeschlossen werden.",
        );
      } finally {
        setIsActionLoading(false);
      }
    })();
  };

  const handleRestorePurchases = async () => {
    try {
      setIsActionLoading(true);
      if (getRevenueCatAvailability().status !== "ready") {
        throw new Error(
          revenueCatErrorMessage ?? "RevenueCat ist nicht bereit.",
        );
      }

      await restoreRevenueCatPurchases();

      const syncedAccess = await waitForServerAccessSync();

      if (syncedAccess) {
        Alert.alert(
          "Kaeufe wiederhergestellt",
          "Dein Zugriff wurde erfolgreich wiederhergestellt.",
        );
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
        return;
      }

      Alert.alert(
        "Restore verarbeitet",
        "Die Wiederherstellung wurde gestartet. Der Zugriff wird serverseitig noch synchronisiert.",
      );
    } catch {
      Alert.alert(
        "Wiederherstellung fehlgeschlagen",
        "Die Kaeufe konnten nicht wiederhergestellt werden.",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const headerSubtitle = !hasAccess
    ? "Dein Testzeitraum ist abgelaufen. Wähle jetzt ein Abo oder Lifetime, um Luke weiter zu nutzen."
    : paywallVisible && typeof daysUntilTrialExpiry === "number"
      ? daysUntilTrialExpiry <= 1
        ? "Dein Testzeitraum endet in weniger als einem Tag. Sichere dir jetzt deinen Zugang."
        : `Dein Testzeitraum endet in ${daysUntilTrialExpiry} Tagen. Sichere dir jetzt deinen Zugang.`
      : "Sichere dir jetzt deinen Zugang zu allen Pro-Funktionen von Luke.";

  const preCtaText = !hasAccess
    ? "Wähle jetzt dein Abo oder Lifetime, um deinen Zugriff fortzusetzen."
    : paywallVisible && trialEndsAt
      ? `Dein Testzugang läuft bis ${new Date(trialEndsAt).toLocaleDateString("de-DE")}.`
      : "Wähle das passende Paket für deinen dauerhaften Zugriff.";

  const ctaLabel = !hasAccess ? "Zugang freischalten" : "Upgrade auswählen";

  const formatPrice = (product: BillingProductT): string => {
    const formattedPrice = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: product.currency,
    }).format(product.priceAmountCents / 100);

    if (product.billingInterval === "monthly") {
      return `${formattedPrice}/Monat`;
    }

    if (product.billingInterval === "yearly") {
      return `${formattedPrice}/Jahr`;
    }

    return formattedPrice;
  };

  const getDescription = (product: BillingProductT): string => {
    if (product.billingInterval === "monthly") {
      return "monatliche Abrechnung";
    }

    if (product.billingInterval === "yearly") {
      return "jährliche Abrechnung";
    }

    return "einmalige Abrechnung";
  };

  const getBadge = (product: BillingProductT): string | undefined => {
    if (product.productKey === "yearly") {
      return "Beliebt";
    }

    return undefined;
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
        <View style={styles.planCardContent}>
          <Text
            style={[
              styles.planCardTitle,
              badge && styles.planCardTitleWithBadge,
            ]}
          >
            {title}
          </Text>
          <Text style={styles.planCardPrice}>{price}</Text>
        </View>
        <Text style={styles.planCardDescription}>{description}</Text>
      </Pressable>
    );
  };

  const displayedProducts =
    revenueCatPackages.length > 0
      ? revenueCatPackages.map((pkg) => ({
          id: pkg.packageToPurchase.identifier,
          productKey: pkg.plan,
          displayName: pkg.title,
          billingInterval:
            pkg.plan === "monthly"
              ? "monthly"
              : pkg.plan === "yearly"
                ? "yearly"
                : "lifetime",
          priceAmountCents: 0,
          currency: "EUR",
          priceText: pkg.priceText,
          description: pkg.description,
          badge: pkg.badge,
        }))
      : fallbackProducts.map((product) => ({
          id: product.id,
          productKey: product.productKey,
          displayName: product.displayName,
          billingInterval: product.billingInterval,
          priceAmountCents: product.priceAmountCents,
          currency: product.currency,
          priceText: formatPrice(product),
          description: getDescription(product),
          badge: getBadge(product),
        }));

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
          colors={HeaderGradient.colors}
          start={HeaderGradient.start}
          end={HeaderGradient.end}
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
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
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

          <View style={styles.featuresWrapper}>
            {FEATURES.map(({ icon, text, semibold }) => (
              <View key={text} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <MaterialCommunityIcons
                    name={icon}
                    size={22}
                    color={Colors.light.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.featureText,
                    semibold && styles.featureTextSemibold,
                  ]}
                >
                  {text}
                </Text>
              </View>
            ))}
          </View>

          {/* Plan cards */}
          <View style={styles.plansContainer}>
            {displayedProducts.map((product) => (
              <PlanCard
                key={product.id}
                plan={product.productKey}
                title={product.displayName}
                price={product.priceText}
                description={product.description}
                badge={product.badge}
              />
            ))}
          </View>

          <Text style={styles.preCtaText}>{preCtaText}</Text>
          {revenueCatErrorMessage ? (
            <Text style={styles.preCtaText}>{revenueCatErrorMessage}</Text>
          ) : null}

          <PurpleGradientButton
            style={styles.ctaButton}
            onPress={handleCtaPress}
          >
            <Text style={styles.ctaButtonText}>
              {isProductsLoading
                ? "Pakete laden..."
                : isActionLoading
                  ? "Wird verarbeitet..."
                  : ctaLabel}
            </Text>
          </PurpleGradientButton>

          <View style={styles.footerLinks}>
            <Pressable onPress={handleRestorePurchases}>
              <Text style={styles.footerLink}>Käufe wiederherstellen</Text>
            </Pressable>
            <Text style={styles.footerSeparator}>•</Text>
            <Pressable onPress={() => void openExternalUrl(TERMS_URL)}>
              <Text style={styles.footerLink}>AGB</Text>
            </Pressable>
            <Text style={styles.footerSeparator}>•</Text>
            <Pressable onPress={() => void openExternalUrl(PRIVACY_URL)}>
              <Text style={styles.footerLink}>Datenschutz</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
