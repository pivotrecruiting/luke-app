import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/budget-detail-screen.styles";

type BudgetDetailHeaderPropsT = {
  topInset: number;
  title: string;
  onBack: () => void;
  onEditBudget: () => void;
  onDeleteBudget: () => void;
};

/**
 * Renders the header section for the budget detail screen.
 */
export const BudgetDetailHeader = ({
  topInset,
  title,
  onBack,
  onEditBudget,
  onDeleteBudget,
}: BudgetDetailHeaderPropsT) => {
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
          <Pressable style={styles.editHeaderButton} onPress={onEditBudget}>
            <Feather name="edit-2" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.deleteHeaderButton} onPress={onDeleteBudget}>
            <Feather name="trash-2" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>Budget Details</Text>
    </LinearGradient>
  );
};
