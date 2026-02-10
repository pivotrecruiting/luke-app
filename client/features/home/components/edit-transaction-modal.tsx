import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import CurrencyInput from "@/components/CurrencyInput";
import { styles } from "@/screens/styles/home-screen.styles";
import { formatDisplayDate } from "@/features/budget-detail/utils/date";
import { AppModal } from "@/components/ui/app-modal";

type CategoryOptionT = {
  id: string;
  name: string;
  icon: string;
};

type EditTransactionModalPropsT = {
  visible: boolean;
  bottomInset: number;
  editName: string;
  editAmount: string;
  selectedCategoryId: string | null;
  categories: CategoryOptionT[];
  editDate: Date;
  showDatePicker: boolean;
  isExpense: boolean;
  isAppLoading?: boolean;
  onChangeName: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onSelectCategory: (id: string) => void;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onDateChange: (event: unknown, date?: Date) => void;
  onToggleType: () => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Modal for editing an existing transaction (income or expense) from the HomeScreen.
 */
export const EditTransactionModal = ({
  visible,
  bottomInset,
  editName,
  editAmount,
  selectedCategoryId,
  categories,
  editDate,
  showDatePicker,
  isExpense,
  isAppLoading = false,
  onChangeName,
  onChangeAmount,
  onSelectCategory,
  onOpenDatePicker,
  onCloseDatePicker,
  onDateChange,
  onToggleType,
  onSave,
  onCancel,
}: EditTransactionModalPropsT) => {
  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      maxHeightPercent={80}
      contentStyle={styles.modalContent}
      keyboardAvoidingEnabled
    >
      <ScrollView
        style={styles.editTransactionModalScrollView}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.modalHandle} />
        <Text style={styles.editTransactionModalTitle}>
          Transaktion bearbeiten
        </Text>

        <Text style={styles.editTransactionModalLabel}>Name</Text>
        <TextInput
          style={styles.editTransactionModalInput}
          value={editName}
          onChangeText={onChangeName}
          placeholder="Beschreibung"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.editTransactionModalLabel}>Kategorie</Text>
        <View style={styles.editTransactionCategoriesGrid}>
          {categories.length === 0 ? (
            <View style={styles.editTransactionCategoriesEmpty}>
              <Feather name="inbox" size={20} color="#9CA3AF" />
              <Text style={styles.editTransactionCategoriesEmptyTitle}>
                {isAppLoading
                  ? "Kategorien werden geladen"
                  : "Keine Kategorien verfügbar"}
              </Text>
              <Text style={styles.editTransactionCategoriesEmptySubtitle}>
                {isAppLoading
                  ? "Bitte kurz warten."
                  : "Bitte prüfe deine Datenbank."}
              </Text>
            </View>
          ) : (
            categories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.editTransactionCategoryItem,
                  selectedCategoryId === category.id &&
                    styles.editTransactionCategoryItemActive,
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  onSelectCategory(category.id);
                }}
              >
                <View
                  style={[
                    styles.editTransactionCategoryIcon,
                    selectedCategoryId === category.id &&
                      styles.editTransactionCategoryIconActive,
                  ]}
                >
                  <Feather
                    name={category.icon as any}
                    size={20}
                    color={
                      selectedCategoryId === category.id ? "#FFFFFF" : "#6B7280"
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.editTransactionCategoryName,
                    selectedCategoryId === category.id &&
                      styles.editTransactionCategoryNameActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <Text style={styles.editTransactionModalLabel}>Typ</Text>
        <Pressable
          style={styles.editTransactionTypeToggle}
          onPress={onToggleType}
        >
          <Feather
            name={isExpense ? "arrow-down" : "arrow-up"}
            size={20}
            color={isExpense ? "#EF4444" : "#22C55E"}
          />
          <Text style={styles.editTransactionTypeText}>
            {isExpense ? "Ausgabe" : "Einnahme"}
          </Text>
        </Pressable>

        <Text style={styles.editTransactionModalLabel}>Betrag</Text>
        <CurrencyInput
          value={editAmount}
          onChangeText={onChangeAmount}
          placeholder="0,00"
          variant="modal"
          containerStyle={styles.editTransactionCurrencyContainer}
        />

        <Text style={styles.editTransactionModalLabel}>Datum</Text>
        <Pressable style={styles.editTransactionDateButton} onPress={onOpenDatePicker}>
          <Feather name="calendar" size={20} color="#7340FE" />
          <Text style={styles.editTransactionDateText}>
            {formatDisplayDate(editDate)}
          </Text>
        </Pressable>

        {showDatePicker ? (
          <View style={styles.editTransactionDateContainer}>
            <DateTimePicker
              value={editDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()}
              locale="de-DE"
              textColor="#000000"
              themeVariant="light"
            />
            <Pressable
              style={styles.editTransactionDateDoneButton}
              onPress={onCloseDatePicker}
            >
              <Text style={styles.editTransactionDateDoneText}>Fertig</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable style={styles.editTransactionSaveButton} onPress={onSave}>
          <Text style={styles.editTransactionSaveButtonText}>Speichern</Text>
        </Pressable>

        <Pressable style={styles.editTransactionCancelButton} onPress={onCancel}>
          <Text style={styles.editTransactionCancelButtonText}>Abbrechen</Text>
        </Pressable>
      </ScrollView>
    </AppModal>
  );
};
