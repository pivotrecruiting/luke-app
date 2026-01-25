import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { styles } from "@/screens/styles/goal-detail-screen.styles";

type EditGoalModalPropsT = {
  visible: boolean;
  bottomInset: number;
  tempName: string;
  onChangeName: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Modal for editing the goal name.
 */
export const EditGoalModal = ({
  visible,
  bottomInset,
  tempName,
  onChangeName,
  onSave,
  onCancel,
}: EditGoalModalPropsT) => {
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
          <Text style={styles.modalTitle}>Goal bearbeiten</Text>

          <Text style={styles.modalLabel}>Name</Text>
          <TextInput
            style={styles.modalInput}
            value={tempName}
            onChangeText={onChangeName}
            placeholder="Goal Name"
            placeholderTextColor="#9CA3AF"
          />

          <Pressable style={styles.modalSaveButton} onPress={onSave}>
            <Text style={styles.modalSaveButtonText}>Speichern</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
