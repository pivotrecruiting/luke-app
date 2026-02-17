import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/goal-detail-screen.styles";

type GoalDetailHeaderPropsT = {
  topInset: number;
  title: string;
  subtitle: string;
  onBack: () => void;
  onEditGoal: () => void;
  onDeleteGoal: () => void;
};

/**
 * Renders the goal detail header with back, edit and delete actions.
 * Matches BudgetDetailHeader structure: back left, edit + delete right.
 */
export const GoalDetailHeader = ({
  topInset,
  title,
  subtitle,
  onBack,
  onEditGoal,
  onDeleteGoal,
}: GoalDetailHeaderPropsT) => {
  return (
    <LinearGradient
      colors={["#7340fd", "#3B5BDB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: topInset }]}
    >
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable style={styles.editHeaderButton} onPress={onEditGoal}>
            <Feather name="edit-2" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.deleteHeaderButton} onPress={onDeleteGoal}>
            <Feather name="trash-2" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </LinearGradient>
  );
};
