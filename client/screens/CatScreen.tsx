import React from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PurpleGradientButton } from "@/components/ui/purple-gradient-button";
import { Spacing } from "@/constants/theme";
import { styles } from "@/screens/styles/cat-screen.styles";

const catImage = require("@assets/images/katze_luke_compressed.png");
const ornamentImage = require("@assets/images/lvlup-ornament.svg");

/**
 * Promotional celebration screen with Luke cat artwork and retention messaging.
 */
export default function CatScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
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
              Du hast im letzten Monat {/* TODO: Replace with actual amount */}
              <Text style={styles.subtitleStrong}>150 €</Text> mehr in der
              Tasche behalten!
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
            {/* TODO: Replace with actual amount */}
            <Text style={styles.amount}>+ 150 Euro</Text>
            <Text style={styles.description}>
              Für nur 2,99 € (weniger als ein Snack){"\n"}
              bleibt Luke als Coach an deiner Seite.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <PurpleGradientButton
              onPress={handleContinue}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Weiterhin sparen!</Text>
            </PurpleGradientButton>
          </View>
        </View>
      </View>
    </View>
  );
}
