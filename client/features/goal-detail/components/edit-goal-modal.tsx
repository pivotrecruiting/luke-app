import { Pressable, Text, TextInput, View } from "react-native";
import CurrencyInput from "@/components/CurrencyInput";
import { styles } from "@/screens/styles/goal-detail-screen.styles";
import { EMOJI_LIST } from "@/features/goals/constants/goals-constants";
import { AppModal } from "@/components/ui/app-modal";

type EditGoalModalPropsT = {
  visible: boolean;
  bottomInset: number;
  tempName: string;
  tempAmount: string;
  tempMonthlyContribution: string;
  tempEmoji: string;
  showEmojiPicker: boolean;
  monthsToGoal: number;
  onChangeName: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onChangeMonthlyContribution: (value: string) => void;
  onToggleEmojiPicker: () => void;
  onSelectEmoji: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Modal for editing a goal.
 */
export const EditGoalModal = ({
  visible,
  bottomInset,
  tempName,
  tempAmount,
  tempMonthlyContribution,
  tempEmoji,
  showEmojiPicker,
  monthsToGoal,
  onChangeName,
  onChangeAmount,
  onChangeMonthlyContribution,
  onToggleEmojiPicker,
  onSelectEmoji,
  onSave,
  onCancel,
}: EditGoalModalPropsT) => {
  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      contentStyle={[styles.modalContent, { paddingBottom: bottomInset + 24 }]}
      keyboardAvoidingEnabled
    >
      <View style={styles.modalHandle} />
      <Text style={styles.modalTitle}>Ziel bearbeiten</Text>

      <Text style={styles.modalLabel}>Name</Text>
      <View style={styles.nameInputRow}>
        <Pressable style={styles.emojiButton} onPress={onToggleEmojiPicker}>
          <Text style={styles.emojiButtonText}>{tempEmoji}</Text>
        </Pressable>
        <TextInput
          style={styles.nameInput}
          value={tempName}
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
      <CurrencyInput
        value={tempAmount}
        onChangeText={onChangeAmount}
        placeholder="1000,00"
        variant="modal"
        containerStyle={styles.modalInput}
      />

      <Text style={styles.modalLabel}>Monatlicher Beitrag</Text>
      <CurrencyInput
        value={tempMonthlyContribution}
        onChangeText={onChangeMonthlyContribution}
        placeholder="200,00"
        variant="modal"
        containerStyle={styles.modalInput}
      />

      <Text style={styles.calculationText}>
        Erreichbar in:{" "}
        <Text style={styles.calculationBold}>{monthsToGoal} Monaten</Text>
      </Text>

      <View style={styles.modalButtons}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>abbrechen</Text>
        </Pressable>
        <Pressable style={styles.createButton} onPress={onSave}>
          <Text style={styles.createButtonText}>Speichern</Text>
        </Pressable>
      </View>
    </AppModal>
  );
};
