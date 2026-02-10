import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppModal } from "@/components/ui/app-modal";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { useApp } from "@/context/AppContext";
import {
  formatCurrencyValue,
  getCurrencySymbol,
} from "@/utils/currency-format";
import { styles } from "@/screens/styles/goal-detail-screen.styles";
import { formatCurrency } from "../utils/format";

type AddDepositModalPropsT = {
  visible: boolean;
  bottomInset: number;
  depositTitle: string;
  goalName: string;
  goalIcon: string;
  goalCurrent: number;
  goalTarget: number;
  depositAmount: string;
  selectedDate: Date;
  showDatePicker: boolean;
  onChangeAmount: (value: string) => void;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onDateChange: (event: unknown, date?: Date) => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Modal for adding a new deposit to a goal. Shows goal header, amount input
 * with live progress calculation, custom numeric keypad, and action buttons.
 */
export const AddDepositModal = ({
  visible,
  bottomInset,
  goalName,
  goalIcon,
  goalCurrent,
  goalTarget,
  depositAmount,
  onChangeAmount,
  onSave,
  onCancel,
}: AddDepositModalPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);

  const parsedAmount = useMemo(() => {
    const num = parseFloat(depositAmount.replace(",", "."));
    return isNaN(num) || num < 0 ? 0 : num;
  }, [depositAmount]);

  const currentPercent = useMemo(() => {
    if (goalTarget <= 0) return 0;
    return (goalCurrent / goalTarget) * 100;
  }, [goalCurrent, goalTarget]);

  const newStand = goalCurrent + parsedAmount;
  const newPercent = goalTarget > 0 ? (newStand / goalTarget) * 100 : 0;

  const handleDigit = useCallback(
    (digit: string) => {
      const hasComma = depositAmount.includes(",");
      if (hasComma) {
        const [, decPart] = depositAmount.split(",");
        if (decPart && decPart.length >= 2) return;
      } else {
        if (depositAmount === "0" && digit !== "0") {
          onChangeAmount(digit);
          return;
        }
        if (depositAmount === "0" && digit === "0") return;
      }
      onChangeAmount(depositAmount + digit);
    },
    [depositAmount, onChangeAmount],
  );

  const handleDecimal = useCallback(() => {
    if (!depositAmount.includes(",")) {
      onChangeAmount(depositAmount ? depositAmount + "," : "0,");
    }
  }, [depositAmount, onChangeAmount]);

  const handleBackspace = useCallback(() => {
    onChangeAmount(depositAmount.slice(0, -1));
  }, [depositAmount, onChangeAmount]);

  const displayAmount = useMemo(
    () =>
      formatCurrencyValue(depositAmount || "0", currency) || "0,00",
    [depositAmount, currency],
  );
  const formattedNewStand = formatCurrency(newStand, currency);
  const formattedCurrent = formatCurrency(goalCurrent, currency);
  const formattedTarget = formatCurrency(goalTarget, currency);

  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      maxHeightPercent={80}
      contentStyle={styles.modalContent}
      keyboardAvoidingEnabled={false}
    >
      <ScrollView
        style={styles.modalScrollView}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.modalHandle} />

        <View style={styles.depositModalGoalHeader}>
          <Text style={styles.depositModalGoalIcon}>{goalIcon}</Text>
          <View style={styles.depositModalGoalInfo}>
            <Text style={styles.depositModalGoalName}>{goalName}</Text>
            <Text style={styles.depositModalGoalProgress}>
              {currencySymbol} {formattedCurrent} von {currencySymbol}{" "}
              {formattedTarget}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={["#67e8dc", "#14b8a6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.35, y: 0.35 }}
          style={styles.depositAmountBox}
        >
          <Text style={styles.depositAmountLabel}>Einzahlungsbetrag</Text>
          <Text style={styles.depositAmountValue}>
            {currencySymbol} {displayAmount}
          </Text>
          <View style={styles.depositMetaRow}>
            <Text style={styles.depositMetaLabel}>Neuer Stand</Text>
            <Text style={styles.depositMetaValue}>
              {currencySymbol} {formattedNewStand}
            </Text>
          </View>
          <View style={styles.depositMetaRow}>
            <Text style={styles.depositMetaLabel}>Fortschritt</Text>
            <Text style={styles.depositMetaValue}>
              {currentPercent.toFixed(1).replace(".", ",")}% → {newPercent.toFixed(1).replace(".", ",")}%
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.numericKeypadContainer}>
          <NumericKeypad
            onDigit={handleDigit}
            onDecimal={handleDecimal}
            onBackspace={handleBackspace}
          />
        </View>

        <View style={styles.depositButtonRow}>
          <Pressable style={styles.depositCancelButton} onPress={onCancel}>
            <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
          </Pressable>
          <Pressable style={styles.depositConfirmButton} onPress={onSave}>
            <Text style={styles.depositConfirmButtonText}>Bestätigen</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppModal>
  );
};
