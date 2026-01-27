import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
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
}: AppModalPropsT) => {
  const maxHeightStyle = {
    maxHeight: `${Math.min(Math.max(maxHeightPercent, 0), 100)}%`,
  };

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
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.45)"]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </Pressable>
        {keyboardAvoidingEnabled ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={keyboardVerticalOffset}
            style={styles.contentWrapper}
            pointerEvents="box-none"
          >
            {content}
          </KeyboardAvoidingView>
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
