import { Pressable, ScrollView, Text, View } from "react-native";
import { useApp } from "@/context/AppContext";
import CurrencyInput from "@/components/CurrencyInput";
import {
  CategoryPickerGrid,
  type CategoryPickerOptionT,
} from "@/components/ui/category-picker-grid";
import { styles } from "@/screens/styles/goals-screen.styles";
import { AppModal } from "@/components/ui/app-modal";
import { PurpleGradientButton } from "@/components/ui/purple-gradient-button";

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
  const { budgetCategories } = useApp();
  const categoryOptions: CategoryPickerOptionT[] = budgetCategories.map(
    (category) => ({
      id: category.key ?? category.id,
      name: category.name,
      icon: category.icon ?? "circle",
    }),
  );

  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      maxHeightPercent={82}
      contentStyle={styles.modalContent}
      keyboardAvoidingEnabled
      keyboardShiftFactor={0.95}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Budget erstellen</Text>

        <Text style={styles.categoryLabel}>Kategorie auswählen</Text>
        <View style={styles.categoryGrid}>
          <CategoryPickerGrid
            categories={categoryOptions}
            selectedCategoryId={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        </View>

        <Text style={styles.modalLabel}>Limit</Text>
        <CurrencyInput
          value={budgetLimit}
          onChangeText={onChangeBudgetLimit}
          placeholder="200,00"
          variant="modal"
          containerStyle={styles.modalInput}
        />

        <View style={styles.modalButtons}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>abbrechen</Text>
          </Pressable>
          <PurpleGradientButton style={styles.createButton} onPress={onCreate}>
            <Text style={styles.createButtonText}>Hinzufügen</Text>
          </PurpleGradientButton>
        </View>
      </ScrollView>
    </AppModal>
  );
};
