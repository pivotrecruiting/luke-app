import { Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/goals-screen.styles";
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
  const { currency, budgetCategories } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  const limitPlaceholder = `${currencySymbol} 200,00`;
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
        {budgetCategories.map((category) => {
          const categoryKey = category.key ?? category.id;
          const isSelected = selectedCategory === categoryKey;
          return (
            <Pressable
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && styles.categoryItemSelected,
              ]}
              onPress={() => onSelectCategory(categoryKey)}
            >
              <View
                style={[
                  styles.categoryIconContainer,
                  { backgroundColor: "#FFFFFF" },
                ]}
              >
                <Feather
                  name={(category.icon ?? "circle") as any}
                  size={24}
                  color={category.color ?? "#6B7280"}
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
        placeholder={limitPlaceholder}
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
