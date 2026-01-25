import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/goals-screen.styles";
import type { SuccessToastT } from "../types/goals-types";

type GoalsHeaderPropsT = {
  topInset: number;
  successToast: SuccessToastT;
};

/**
 * Renders the goals header with optional success toast.
 */
export const GoalsHeader = ({ topInset, successToast }: GoalsHeaderPropsT) => {
  return (
    <LinearGradient
      colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.header, { paddingTop: topInset }]}
    >
      <Text style={styles.headerTitle}>Goals</Text>
      <Text style={styles.headerSubtitle}>bleib dran!</Text>
      {successToast ? (
        <View style={styles.toastContainer}>
          <View style={styles.successToast}>
            <View style={styles.checkCircle}>
              <Feather name="check" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.successToastText}>
              {successToast === "goal" ? "Goal created!" : "Budget set!"}
            </Text>
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
};
