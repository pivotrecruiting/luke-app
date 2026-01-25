import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/goal-detail-screen.styles";
import { formatCurrency } from "../utils/format";

type GoalDetailHeaderPropsT = {
  topInset: number;
  goalName: string;
  goalIcon: string;
  goalCurrent: number;
  goalTarget: number;
  percentage: number;
  remaining: number;
  isCompleted: boolean;
  onEditName: () => void;
  onDeleteGoal: () => void;
  onClose: () => void;
};

/**
 * Renders the goal detail header and progress card.
 */
export const GoalDetailHeader = ({
  topInset,
  goalName,
  goalIcon,
  goalCurrent,
  goalTarget,
  percentage,
  remaining,
  isCompleted,
  onEditName,
  onDeleteGoal,
  onClose,
}: GoalDetailHeaderPropsT) => {
  return (
    <LinearGradient
      colors={["#7340fd", "#3B5BDB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: topInset }]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Goals</Text>
          <Text style={styles.headerSubtitle}>
            {isCompleted ? "Geschafft!" : "bleib dran!"}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable style={styles.deleteHeaderButton} onPress={onDeleteGoal}>
            <Feather name="trash-2" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color="#000000" />
          </Pressable>
        </View>
      </View>

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalLeft}>
            <Text style={styles.goalIcon}>{goalIcon}</Text>
            <View>
              <View style={styles.goalNameRow}>
                <Text style={styles.goalName}>{goalName}</Text>
                <Pressable onPress={onEditName}>
                  <Feather
                    name="edit-2"
                    size={14}
                    color="#7340FE"
                    style={styles.editIcon}
                  />
                </Pressable>
              </View>
              <Text style={styles.goalProgress}>
                € {formatCurrency(goalCurrent)} / € {formatCurrency(goalTarget)}
              </Text>
            </View>
          </View>
          <Text style={styles.goalPercentage}>
            {percentage.toFixed(2).replace(".", ",")}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(percentage, 100)}%` },
            ]}
          />
        </View>
        <View style={styles.goalFooter}>
          <Text style={styles.remainingLabel}>Übrig</Text>
          <Text style={styles.remainingValue}>
            € {formatCurrency(Math.max(0, remaining))}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};
