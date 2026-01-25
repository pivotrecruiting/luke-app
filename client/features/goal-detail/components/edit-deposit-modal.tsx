import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { styles } from "@/screens/styles/goal-detail-screen.styles";
import { formatDisplayDate } from "../utils/date";

type EditDepositModalPropsT = {
  visible: boolean;
  bottomInset: number;
  depositTitle: string;
  editDepositAmount: string;
  editDepositDate: Date;
  showDatePicker: boolean;
  onChangeAmount: (value: string) => void;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onDateChange: (event: any, date?: Date) => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Modal for editing an existing deposit.
 */
export const EditDepositModal = ({
  visible,
  bottomInset,
  depositTitle,
  editDepositAmount,
  editDepositDate,
  showDatePicker,
  onChangeAmount,
  onOpenDatePicker,
  onCloseDatePicker,
  onDateChange,
  onSave,
  onCancel,
}: EditDepositModalPropsT) => {
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
        <ScrollView
          style={[styles.modalContent, { maxHeight: "80%" }]}
          contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{depositTitle} bearbeiten</Text>

          <Text style={styles.modalLabel}>Betrag</Text>
          <View style={styles.currencyInputContainer}>
            <Text style={styles.currencyPrefix}>€</Text>
            <TextInput
              style={styles.currencyInput}
              value={editDepositAmount}
              onChangeText={onChangeAmount}
              placeholder="0,00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={styles.modalLabel}>Datum</Text>
          <Pressable style={styles.datePickerButton} onPress={onOpenDatePicker}>
            <Feather name="calendar" size={20} color="#7340FE" />
            <Text style={styles.datePickerText}>
              {formatDisplayDate(editDepositDate)}
            </Text>
          </Pressable>

          {showDatePicker ? (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={editDepositDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                maximumDate={new Date()}
                locale="de-DE"
                textColor="#000000"
                themeVariant="light"
              />
              <Pressable
                style={styles.datePickerDoneButton}
                onPress={onCloseDatePicker}
              >
                <Text style={styles.datePickerDoneText}>Fertig</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable style={styles.modalSaveButton} onPress={onSave}>
            <Text style={styles.modalSaveButtonText}>Speichern</Text>
          </Pressable>

          <Pressable style={styles.modalCancelButton} onPress={onCancel}>
            <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
