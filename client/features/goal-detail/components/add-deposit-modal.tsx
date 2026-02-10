import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/goal-detail-screen.styles";
import { formatDisplayDate } from "../utils/date";
import { AppModal } from "@/components/ui/app-modal";

type AddDepositModalPropsT = {
  visible: boolean;
  bottomInset: number;
  depositTitle: string;
  depositAmount: string;
  selectedDate: Date;
  showDatePicker: boolean;
  onChangeAmount: (value: string) => void;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onDateChange: (event: any, date?: Date) => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Modal for adding a new deposit.
 */
export const AddDepositModal = ({
  visible,
  bottomInset,
  depositTitle,
  depositAmount,
  selectedDate,
  showDatePicker,
  onChangeAmount,
  onOpenDatePicker,
  onCloseDatePicker,
  onDateChange,
  onSave,
  onCancel,
}: AddDepositModalPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      maxHeightPercent={80}
      contentStyle={styles.modalContent}
      keyboardAvoidingEnabled
    >
      <ScrollView
        style={styles.modalScrollView}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>{depositTitle}</Text>

        <Text style={styles.modalLabel}>Betrag</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
          <TextInput
            style={styles.currencyInput}
            value={depositAmount}
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
            {formatDisplayDate(selectedDate)}
          </Text>
        </Pressable>

        {showDatePicker ? (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={selectedDate}
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
          <Text style={styles.modalSaveButtonText}>Hinzufügen</Text>
        </Pressable>

        <Pressable style={styles.modalCancelButton} onPress={onCancel}>
          <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
        </Pressable>
      </ScrollView>
    </AppModal>
  );
};
