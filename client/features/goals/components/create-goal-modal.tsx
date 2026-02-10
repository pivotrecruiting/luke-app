import { Pressable, Text, TextInput, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/goals-screen.styles";
import { EMOJI_LIST } from "../constants/goals-constants";
import { AppModal } from "@/components/ui/app-modal";

type CreateGoalModalPropsT = {
  visible: boolean;
  bottomInset: number;
  goalName: string;
  goalAmount: string;
  monthlyContribution: string;
  selectedEmoji: string;
  showEmojiPicker: boolean;
  monthsToGoal: number;
  onChangeName: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onChangeMonthlyContribution: (value: string) => void;
  onToggleEmojiPicker: () => void;
  onSelectEmoji: (value: string) => void;
  onCancel: () => void;
  onCreate: () => void;
};

/**
 * Modal for creating a new goal.
 */
export const CreateGoalModal = ({
  visible,
  bottomInset,
  goalName,
  goalAmount,
  monthlyContribution,
  selectedEmoji,
  showEmojiPicker,
  monthsToGoal,
  onChangeName,
  onChangeAmount,
  onChangeMonthlyContribution,
  onToggleEmojiPicker,
  onSelectEmoji,
  onCancel,
  onCreate,
}: CreateGoalModalPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  const amountPlaceholder = `${currencySymbol} 1000,00`;
  const contributionPlaceholder = `${currencySymbol} 200,00`;
  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      contentStyle={[styles.modalContent, { paddingBottom: bottomInset + 24 }]}
      keyboardAvoidingEnabled
    >
      <View style={styles.modalHandle} />
      <Text style={styles.modalTitle}>Ziel erstellen</Text>

      <Text style={styles.modalLabel}>Name</Text>
      <View style={styles.nameInputRow}>
        <Pressable style={styles.emojiButton} onPress={onToggleEmojiPicker}>
          <Text style={styles.emojiButtonText}>{selectedEmoji}</Text>
        </Pressable>
        <TextInput
          style={styles.nameInput}
          value={goalName}
          onChangeText={onChangeName}
          placeholder="z.B. neues IPhone"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {showEmojiPicker ? (
        <View style={styles.emojiPicker}>
          {EMOJI_LIST.map((emoji) => (
            <Pressable
              key={emoji}
              style={styles.emojiOption}
              onPress={() => onSelectEmoji(emoji)}
            >
              <Text style={styles.emojiOptionText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.modalLabel}>Summe</Text>
      <TextInput
        style={styles.modalInput}
        value={goalAmount}
        onChangeText={onChangeAmount}
        placeholder={amountPlaceholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <Text style={styles.modalLabel}>Monatlicher Beitrag</Text>
      <TextInput
        style={styles.modalInput}
        value={monthlyContribution}
        onChangeText={onChangeMonthlyContribution}
        placeholder={contributionPlaceholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <Text style={styles.calculationText}>
        Erreichbar in:{" "}
        <Text style={styles.calculationBold}>{monthsToGoal} Monaten</Text>
      </Text>

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
