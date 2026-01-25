import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/insights-screen.styles";
import { TIME_FILTER_OPTIONS } from "../constants/insights-constants";
import type { TimeFilterT } from "../types/insights-types";

type FilterModalPropsT = {
  visible: boolean;
  bottomInset: number;
  selectedTimeFilter: TimeFilterT;
  selectedCostFilters: string[];
  budgets: { id: string; name: string; iconColor: string }[];
  onClose: () => void;
  onSelectTimeFilter: (value: TimeFilterT) => void;
  onToggleCostFilter: (value: string) => void;
  onClearCostFilters: () => void;
};

/**
 * Shows the filter modal for time range and category selection.
 */
export const FilterModal = ({
  visible,
  bottomInset,
  selectedTimeFilter,
  selectedCostFilters,
  budgets,
  onClose,
  onSelectTimeFilter,
  onToggleCostFilter,
  onClearCostFilters,
}: FilterModalPropsT) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <ScrollView
          style={[
            styles.modalContent,
            { paddingBottom: bottomInset + 24, maxHeight: "80%" },
          ]}
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

          <Text style={styles.modalSectionTitle}>Kategorien</Text>
          <View style={styles.filterOptionsGrid}>
            {budgets.map((budget) => {
              const isSelected = selectedCostFilters.includes(budget.name);
              return (
                <Pressable
                  key={budget.id}
                  style={[
                    styles.filterOption,
                    isSelected && styles.filterOptionSelected,
                  ]}
                  onPress={() => onToggleCostFilter(budget.name)}
                >
                  <View
                    style={[
                      styles.filterOptionDot,
                      { backgroundColor: budget.iconColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      isSelected && styles.filterOptionTextSelected,
                    ]}
                  >
                    {budget.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedCostFilters.length > 0 ? (
            <Pressable
              style={styles.clearFiltersButton}
              onPress={onClearCostFilters}
            >
              <Feather name="x" size={14} color="#6B7280" />
              <Text style={styles.clearFiltersText}>Filter zurücksetzen</Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.modalDoneButton} onPress={onClose}>
            <Text style={styles.modalDoneButtonText}>Fertig</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};
