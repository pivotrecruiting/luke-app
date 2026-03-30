import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { HeaderGradient } from "@/constants/theme";
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
      colors={HeaderGradient.colors}
      start={HeaderGradient.start}
      end={HeaderGradient.end}
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
