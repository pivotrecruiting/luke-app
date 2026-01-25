import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { styles } from "@/screens/styles/budget-detail-screen.styles";

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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={onCancel} />
        <View style={[styles.modalContent, { paddingBottom: bottomInset + 24 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Budget bearbeiten</Text>

          <Text style={styles.modalLabel}>Monatliches Limit</Text>
          <View style={styles.currencyInputContainer}>
            <Text style={styles.currencyPrefix}>€</Text>
            <TextInput
              style={styles.currencyInput}
              value={budgetLimit}
              onChangeText={onChangeLimit}
              placeholder="0,00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          <Pressable style={styles.modalSaveButton} onPress={onSave}>
            <Text style={styles.modalSaveButtonText}>Speichern</Text>
          </Pressable>

          <Pressable style={styles.modalCancelButton} onPress={onCancel}>
            <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
