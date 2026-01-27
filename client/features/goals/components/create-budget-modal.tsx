import { Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/goals-screen.styles";
import { BUDGET_CATEGORIES } from "@/constants/budgetCategories";
import { AppModal } from "@/components/ui/app-modal";

type CreateBudgetModalPropsT = {
  visible: boolean;
  bottomInset: number;
  selectedCategory: string | null;
  budgetLimit: string;
  onSelectCategory: (value: string) => void;
  onChangeBudgetLimit: (value: string) => void;
  onCancel: () => void;
  onCreate: () => void;
};

/**
 * Modal for creating a new budget.
 */
export const CreateBudgetModal = ({
  visible,
  bottomInset,
  selectedCategory,
  budgetLimit,
  onSelectCategory,
  onChangeBudgetLimit,
  onCancel,
  onCreate,
}: CreateBudgetModalPropsT) => {
  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      contentStyle={[styles.modalContent, { paddingBottom: bottomInset + 24 }]}
      keyboardAvoidingEnabled
    >
      <View style={styles.modalHandle} />
      <Text style={styles.modalTitle}>Budget erstellen</Text>

      <Text style={styles.categoryLabel}>Kategorie auswählen</Text>
      <View style={styles.categoryGrid}>
        {BUDGET_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <Pressable
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && styles.categoryItemSelected,
              ]}
              onPress={() => onSelectCategory(category.id)}
            >
              <View
                style={[
                  styles.categoryIconContainer,
                  { backgroundColor: "#FFFFFF" },
                ]}
              >
                <Feather
                  name={category.icon as any}
                  size={24}
                  color={category.color}
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.modalLabel}>Limit</Text>
      <TextInput
        style={styles.modalInput}
        value={budgetLimit}
        onChangeText={onChangeBudgetLimit}
        placeholder="€ 200,00"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <View style={styles.modalButtons}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>abbrechen</Text>
        </Pressable>
        <Pressable style={styles.createButton} onPress={onCreate}>
          <Text style={styles.createButtonText}>Hinzufügen</Text>
        </Pressable>
      </View>
    </AppModal>
  );
};
