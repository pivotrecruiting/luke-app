import React from "react";
import { View, Text, Pressable, Platform, Linking } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppModal } from "@/components/ui/app-modal";
import { styles } from "./review-modal.styles";

const reviewFoxImage = require("@assets/images/review-fox.png");

const APP_STORE_URL = "https://apps.apple.com/app/id123456789";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.deni.luke";

type ReviewModalPropsT = {
  visible: boolean;
  onClose: () => void;
  onRate?: () => void;
};

/**
 * Modal that prompts the user to rate the app. Shows a friendly fox illustration,
 * call-to-action text, and options to rate or dismiss.
 */
export const ReviewModal = ({
  visible,
  onClose,
  onRate,
}: ReviewModalPropsT) => {
  const insets = useSafeAreaInsets();

  const handleRate = () => {
    const url = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    void Linking.openURL(url);
    onRate?.();
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      maxHeightPercent={95}
      contentStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 12 },
      ]}
    >
      <View style={styles.contentInner}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Hi, ich bin Deni, der Entwickler der App 😊
          </Text>
          <Text style={styles.subtitle}>Hilf mir Luke zu verbessern!</Text>
        </View>

        <View style={styles.illustrationContainer}>
          <Image
            source={reviewFoxImage}
            style={styles.illustration}
            contentFit="contain"
          />
        </View>

        <Text style={styles.ctaText}>
          Gefällt dir die App? Gib uns ein paar Sterne! ✨
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable
            onPress={handleRate}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Ich bin zufrieden ⭐</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.laterButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.laterButtonText}>Später</Text>
          </Pressable>
        </View>
      </View>
    </AppModal>
  );
};
