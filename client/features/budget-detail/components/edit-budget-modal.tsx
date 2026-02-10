import { Pressable, Text, View } from "react-native";
import CurrencyInput from "@/components/CurrencyInput";
import { styles } from "@/screens/styles/budget-detail-screen.styles";
import { AppModal } from "@/components/ui/app-modal";

type EditBudgetModalPropsT = {
  visible: boolean;
  bottomInset: number;
  budgetLimit: string;
  onChangeLimit: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Modal for editing the budget limit.
 */
export const EditBudgetModal = ({
  visible,
  bottomInset,
  budgetLimit,
  onChangeLimit,
  onSave,
  onCancel,
}: EditBudgetModalPropsT) => {
  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      contentStyle={[styles.modalContent, { paddingBottom: bottomInset + 24 }]}
      keyboardAvoidingEnabled
    >
      <View style={styles.modalHandle} />
      <Text style={styles.modalTitle}>Budget bearbeiten</Text>

      <Text style={styles.modalLabel}>Monatliches Limit</Text>
      <CurrencyInput
        value={budgetLimit}
        onChangeText={onChangeLimit}
        placeholder="0,00"
        variant="modal"
        containerStyle={styles.currencyInputContainer}
        autoFocus
      />

      <Pressable style={styles.modalSaveButton} onPress={onSave}>
        <Text style={styles.modalSaveButtonText}>Speichern</Text>
      </Pressable>

      <Pressable style={styles.modalCancelButton} onPress={onCancel}>
        <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
      </Pressable>
    </AppModal>
  );
};
