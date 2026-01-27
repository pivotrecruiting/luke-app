import { Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/insights-screen.styles";
import { INCOME_TYPES } from "../constants/insights-constants";
import { AppModal } from "@/components/ui/app-modal";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

type IncomeModalPropsT = {
  visible: boolean;
  bottomInset: number;
  editingIncomeId: string | null;
  selectedIncomeType: string | null;
  customIncomeType: string;
  incomeAmount: string;
  onClose: () => void;
  onSelectIncomeType: (value: string) => void;
  onChangeCustomIncomeType: (value: string) => void;
  onChangeIncomeAmount: (value: string) => void;
  onSave: () => void;
};

/**
 * Modal for creating or editing an income entry.
 */
export const IncomeModal = ({
  visible,
  bottomInset,
  editingIncomeId,
  selectedIncomeType,
  customIncomeType,
  incomeAmount,
  onClose,
  onSelectIncomeType,
  onChangeCustomIncomeType,
  onChangeIncomeAmount,
  onSave,
}: IncomeModalPropsT) => {
  const isDisabled = !selectedIncomeType || !incomeAmount;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      maxHeightPercent={90}
      contentStyle={[
        styles.incomeModalContent,
        styles.incomeModalContentNoPadding,
      ]}
    >
      <KeyboardAwareScrollViewCompat
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.incomeModalScrollContent,
          { paddingBottom: bottomInset },
        ]}
      >
        <View style={styles.incomeModalHeader}>
          <Text style={styles.incomeModalTitle}>
            {editingIncomeId ? "Einnahme bearbeiten" : "Neue Einnahme"}
          </Text>
          <Pressable onPress={onClose}>
            <Feather name="x" size={24} color="#6B7280" />
          </Pressable>
        </View>

        <Text style={styles.incomeModalLabel}>Art der Einnahme</Text>
        <View style={styles.incomeTypeGrid}>
          {INCOME_TYPES.map((type) => (
            <Pressable
              key={type.id}
              style={[
                styles.incomeTypeButton,
                selectedIncomeType === type.id &&
                  styles.incomeTypeButtonSelected,
              ]}
              onPress={() => onSelectIncomeType(type.id)}
            >
              <Feather
                name={type.icon as any}
                size={20}
                color={selectedIncomeType === type.id ? "#7340fd" : "#6B7280"}
              />
              <Text
                style={[
                  styles.incomeTypeButtonText,
                  selectedIncomeType === type.id &&
                    styles.incomeTypeButtonTextSelected,
                ]}
              >
                {type.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedIncomeType === "sonstiges" && (
          <View style={styles.customTypeContainer}>
            <Text style={styles.incomeModalLabel}>Bezeichnung</Text>
            <TextInput
              style={styles.incomeTextInput}
              value={customIncomeType}
              onChangeText={onChangeCustomIncomeType}
              placeholder="z.B. Unterhalt"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        <Text style={styles.incomeModalLabel}>Betrag (monatlich)</Text>
        <View style={styles.incomeAmountInputContainer}>
          <Text style={styles.incomeCurrencySymbol}>€</Text>
          <TextInput
            style={styles.incomeAmountInput}
            value={incomeAmount}
            onChangeText={onChangeIncomeAmount}
            placeholder="0,00"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
          />
        </View>

        <Pressable
          style={[
            styles.incomeSaveButton,
            isDisabled && styles.incomeSaveButtonDisabled,
          ]}
          onPress={onSave}
          disabled={isDisabled}
        >
          <Text style={styles.incomeSaveButtonText}>
            {editingIncomeId ? "Speichern" : "Hinzufügen"}
          </Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </AppModal>
  );
};
