import { Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/insights-screen.styles";
import { EXPENSE_TYPES } from "../constants/insights-constants";
import { AppModal } from "@/components/ui/app-modal";

type ExpenseModalPropsT = {
  visible: boolean;
  bottomInset: number;
  editingExpenseId: string | null;
  selectedExpenseType: string | null;
  customExpenseType: string;
  expenseAmount: string;
  onClose: () => void;
  onSelectExpenseType: (value: string) => void;
  onChangeCustomExpenseType: (value: string) => void;
  onChangeExpenseAmount: (value: string) => void;
  onSave: () => void;
};

/**
 * Modal for creating or editing an expense entry.
 */
export const ExpenseModal = ({
  visible,
  bottomInset,
  editingExpenseId,
  selectedExpenseType,
  customExpenseType,
  expenseAmount,
  onClose,
  onSelectExpenseType,
  onChangeCustomExpenseType,
  onChangeExpenseAmount,
  onSave,
}: ExpenseModalPropsT) => {
  const isDisabled = !selectedExpenseType || !expenseAmount;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      maxHeightPercent={90}
      contentStyle={[styles.incomeModalContent, { paddingBottom: bottomInset }]}
    >
      <View style={styles.incomeModalHeader}>
        <Text style={styles.incomeModalTitle}>
          {editingExpenseId ? "Ausgabe bearbeiten" : "Neue Ausgabe"}
        </Text>
        <Pressable onPress={onClose}>
          <Feather name="x" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <Text style={styles.incomeModalLabel}>Art der Ausgabe</Text>
      <View style={styles.incomeTypeGrid}>
        {EXPENSE_TYPES.map((type) => (
          <Pressable
            key={type.id}
            style={[
              styles.incomeTypeButton,
              selectedExpenseType === type.id &&
                styles.expenseTypeButtonSelected,
            ]}
            onPress={() => onSelectExpenseType(type.id)}
          >
            <Feather
              name={type.icon as any}
              size={20}
              color={selectedExpenseType === type.id ? "#EF4444" : "#6B7280"}
            />
            <Text
              style={[
                styles.incomeTypeButtonText,
                selectedExpenseType === type.id &&
                  styles.expenseTypeButtonTextSelected,
              ]}
            >
              {type.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedExpenseType === "sonstiges" && (
        <View style={styles.customTypeContainer}>
          <Text style={styles.incomeModalLabel}>Bezeichnung</Text>
          <TextInput
            style={styles.incomeTextInput}
            value={customExpenseType}
            onChangeText={onChangeCustomExpenseType}
            placeholder="z.B. Strom"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}

      <Text style={styles.incomeModalLabel}>Betrag (monatlich)</Text>
      <View style={styles.incomeAmountInputContainer}>
        <Text style={styles.incomeCurrencySymbol}>€</Text>
        <TextInput
          style={styles.incomeAmountInput}
          value={expenseAmount}
          onChangeText={onChangeExpenseAmount}
          placeholder="0,00"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />
      </View>

      <Pressable
        style={[
          styles.expenseSaveButton,
          isDisabled && styles.incomeSaveButtonDisabled,
        ]}
        onPress={onSave}
        disabled={isDisabled}
      >
        <Text style={styles.incomeSaveButtonText}>
          {editingExpenseId ? "Speichern" : "Hinzufügen"}
        </Text>
      </Pressable>
    </AppModal>
  );
};
