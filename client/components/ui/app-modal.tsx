import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type AppModalPropsT = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeightPercent?: number;
  animation?: "slide" | "fade";
  contentStyle?: StyleProp<ViewStyle>;
  keyboardAvoidingEnabled?: boolean;
  keyboardVerticalOffset?: number;
  keyboardShiftFactor?: number;
};

/**
 * Reusable app modal with gradient overlay and configurable height/animation.
 */
export const AppModal = ({
  visible,
  onClose,
  children,
  maxHeightPercent = 90,
  animation = "slide",
  contentStyle,
  keyboardAvoidingEnabled = false,
  keyboardVerticalOffset = 0,
  keyboardShiftFactor = 0.5,
}: AppModalPropsT) => {
  const { height } = useWindowDimensions();
  const keyboardTranslateY = useRef(new Animated.Value(0)).current;
  const maxHeightValue = Math.min(Math.max(maxHeightPercent, 0), 100);
  const maxHeightStyle = {
    maxHeight: (height * maxHeightValue) / 100,
  };

  useEffect(() => {
    if (!keyboardAvoidingEnabled) {
      keyboardTranslateY.setValue(0);
      return;
    }

    const animateTo = (keyboardHeight: number, duration?: number) => {
      const adjustedShift = Math.max(
        (keyboardHeight - keyboardVerticalOffset) * keyboardShiftFactor,
        0,
      );

      Animated.timing(keyboardTranslateY, {
        toValue: -adjustedShift,
        duration: duration ?? 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(
      keyboardShowEvent,
      (event) => {
        animateTo(event.endCoordinates.height, event.duration);
      },
    );

    const hideSubscription = Keyboard.addListener(
      keyboardHideEvent,
      (event) => {
        animateTo(0, event.duration);
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      keyboardTranslateY.stopAnimation();
      keyboardTranslateY.setValue(0);
    };
  }, [
    keyboardAvoidingEnabled,
    keyboardShiftFactor,
    keyboardTranslateY,
    keyboardVerticalOffset,
  ]);

  const content = (
    <View style={[styles.content, maxHeightStyle, contentStyle]}>
      {children}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animation}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.6)"]}
            locations={[0, 0.8, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </Pressable>
        {keyboardAvoidingEnabled ? (
          <Animated.View
            style={[
              styles.contentWrapper,
              { transform: [{ translateY: keyboardTranslateY }] },
            ]}
            pointerEvents="box-none"
          >
            {content}
          </Animated.View>
        ) : (
          <View style={styles.contentWrapper} pointerEvents="box-none">
            {content}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    width: "100%",
  },
});
