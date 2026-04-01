import React, { useEffect, useMemo, useState } from "react";
import { BackHandler, Text, View } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PurpleGradientButton } from "@/components/ui/purple-gradient-button";
import { Spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { styles } from "@/screens/styles/cat-screen.styles";
import {
  formatCurrencyAmount,
  getCurrencySymbol,
} from "@/utils/currency-format";

const catImage = require("@assets/images/katze_luke_compressed.png");
const ornamentImage = require("@assets/images/lvlup-ornament.svg");

/**
 * Promotional celebration screen with Luke cat artwork and retention messaging.
 */
export default function CatScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {
    currency,
    transactionBalance,
    hasAccess,
    paywallVisible,
    hadWorkshopAccess,
    paywallRequired,
  } = useApp();
  const shouldForcePaywallAfterCat =
    !hasAccess && paywallRequired && hadWorkshopAccess;
  const isTrialWarningActive = hasAccess && paywallVisible;
  const [isNavigatingToPaywall, setIsNavigatingToPaywall] = useState(false);

  const positiveSavingsAmount = Math.max(transactionBalance, 0);
  const formattedSavings = useMemo(() => {
    const symbol = getCurrencySymbol(currency);
    const amount = formatCurrencyAmount(positiveSavingsAmount, currency);

    return `${symbol} ${amount}`;
  }, [currency, positiveSavingsAmount]);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !shouldForcePaywallAfterCat,
      fullScreenGestureEnabled: !shouldForcePaywallAfterCat,
    });
  }, [navigation, shouldForcePaywallAfterCat]);

  usePreventRemove(shouldForcePaywallAfterCat && !isNavigatingToPaywall, () => {
    if (!shouldForcePaywallAfterCat || isNavigatingToPaywall) {
      return;
    }
  });

  useEffect(() => {
    if (!shouldForcePaywallAfterCat || isNavigatingToPaywall) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );

    return () => {
      subscription.remove();
    };
  }, [isNavigatingToPaywall, shouldForcePaywallAfterCat]);

  const handleContinue = () => {
    if (isTrialWarningActive || shouldForcePaywallAfterCat) {
      setIsNavigatingToPaywall(true);
      navigation.replace("Paywall");
      return;
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.contentWrapper,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + Spacing["5xl"],
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.textSection}>
            <Text style={styles.title}>Die Zeit vergeht so schnell..</Text>
            <Text style={styles.subtitle}>
              {positiveSavingsAmount > 0 ? (
                <>
                  Du hast bisher{" "}
                  <Text style={styles.subtitleStrong}>{formattedSavings}</Text>{" "}
                  mehr in der Tasche behalten!
                </>
              ) : (
                <>
                  Du hast in deinem Testzeitraum schon echte Fortschritte
                  gemacht.
                </>
              )}
            </Text>
          </View>

          <View style={styles.heroSection}>
            <Image
              source={ornamentImage}
              style={[styles.ornament, styles.ornamentLeft]}
              contentFit="contain"
            />
            <Image
              source={catImage}
              style={styles.catImage}
              contentFit="contain"
            />
            <Image
              source={ornamentImage}
              style={[styles.ornament, styles.ornamentRight]}
              contentFit="contain"
            />
          </View>

          <View style={styles.bottomSection}>
            {positiveSavingsAmount > 0 ? (
              <Text style={styles.amount}>+ {formattedSavings}</Text>
            ) : null}
            <Text style={styles.description}>
              Für nur 2,99 € (weniger als ein Snack){"\n"}
              bleibt Luke als Coach an deiner Seite.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <PurpleGradientButton
              onPress={handleContinue}
              style={styles.button}
              pressedOpacity={0.9}
            >
              <Text style={styles.buttonText}>Weiterhin sparen!</Text>
            </PurpleGradientButton>
          </View>
        </View>
      </View>
    </View>
  );
}
