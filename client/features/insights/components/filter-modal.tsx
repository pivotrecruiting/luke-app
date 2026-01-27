import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "@/screens/styles/insights-screen.styles";
import { TIME_FILTER_OPTIONS } from "../constants/insights-constants";
import type { TimeFilterT } from "../types/insights-types";
import { AppModal } from "@/components/ui/app-modal";

type FilterModalPropsT = {
  visible: boolean;
  bottomInset: number;
  selectedTimeFilter: TimeFilterT;
  onClose: () => void;
  onSelectTimeFilter: (value: TimeFilterT) => void;
};

/**
 * Shows the filter modal for time range selection.
 */
export const FilterModal = ({
  visible,
  bottomInset,
  selectedTimeFilter,
  onClose,
  onSelectTimeFilter,
}: FilterModalPropsT) => {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      maxHeightPercent={80}
      contentStyle={styles.modalContent}
    >
      <ScrollView
        style={styles.modalScrollView}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Filter</Text>

        <Text style={styles.modalSectionTitle}>Zeitspanne</Text>
        <View style={styles.filterOptionsGrid}>
          {TIME_FILTER_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.filterOption,
                selectedTimeFilter === option.id &&
                  styles.filterOptionSelected,
              ]}
              onPress={() => onSelectTimeFilter(option.id)}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  selectedTimeFilter === option.id &&
                    styles.filterOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.modalDoneButton} onPress={onClose}>
          <Text style={styles.modalDoneButtonText}>Fertig</Text>
        </Pressable>
      </ScrollView>
    </AppModal>
  );
};
