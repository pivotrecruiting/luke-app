import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { IncomeEntry } from "@/context/AppContext";

type IncomeTabPropsT = {
  bottomInset: number;
  totalIncome: number;
  incomeEntries: IncomeEntry[];
  deleteConfirmId: string | null;
  onAddIncome: () => void;
  onEditIncome: (entry: IncomeEntry) => void;
  onRequestDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
  getIconForIncomeType: (typeName: string) => string;
};

/**
 * Displays the income tab with summary, list, and tips.
 */
export const IncomeTab = ({
  bottomInset,
  totalIncome,
  incomeEntries,
  deleteConfirmId,
  onAddIncome,
  onEditIncome,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  getIconForIncomeType,
}: IncomeTabPropsT) => {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomInset + 100 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.incomeSummaryCard}>
        <View style={styles.incomeSummaryIcon}>
          <Feather name="trending-up" size={28} color="#10B981" />
        </View>
        <View style={styles.incomeSummaryContent}>
          <Text style={styles.incomeSummaryLabel}>Monatliche Einnahmen</Text>
          <Text style={styles.incomeSummaryAmount}>
            € {formatCurrency(totalIncome)}
          </Text>
        </View>
        <Pressable style={styles.addIncomeButton} onPress={onAddIncome}>
          <Feather name="plus" size={20} color="#7340fd" />
        </Pressable>
      </View>

      <Text style={styles.incomeSectionTitle}>Einnahmequellen</Text>

      {incomeEntries.length === 0 ? (
        <View style={styles.incomeEmptyState}>
          <Feather name="inbox" size={48} color="#D1D5DB" />
          <Text style={styles.incomeEmptyText}>
            Noch keine Einnahmen hinzugefügt
          </Text>
          <Pressable style={styles.incomeEmptyButton} onPress={onAddIncome}>
            <Text style={styles.incomeEmptyButtonText}>
              Einnahme hinzufügen
            </Text>
          </Pressable>
        </View>
      ) : (
        incomeEntries.map((entry, index) => (
          <Animated.View
            key={entry.id}
            entering={FadeInDown.delay(index * 50).duration(300)}
          >
            <Pressable
              style={styles.incomeItem}
              onPress={() => onEditIncome(entry)}
            >
              <View style={styles.incomeLeft}>
                <View style={styles.incomeIconContainer}>
                  <Feather
                    name={getIconForIncomeType(entry.type) as any}
                    size={20}
                    color="#10B981"
                  />
                </View>
                <View>
                  <Text style={styles.incomeType}>{entry.type}</Text>
                  <Text style={styles.incomeFrequency}>Monatlich</Text>
                </View>
              </View>
              <View style={styles.incomeRight}>
                <Text style={styles.incomeAmount}>
                  € {formatCurrency(entry.amount)}
                </Text>
                <Pressable onPress={() => onRequestDelete(entry.id)} hitSlop={8}>
                  <Feather name="trash-2" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            </Pressable>

            {deleteConfirmId === entry.id && (
              <View style={styles.deleteConfirm}>
                <Text style={styles.deleteConfirmText}>Wirklich löschen?</Text>
                <View style={styles.deleteActions}>
                  <Pressable
                    style={styles.cancelDeleteBtn}
                    onPress={onCancelDelete}
                  >
                    <Text style={styles.cancelDeleteText}>Abbrechen</Text>
                  </Pressable>
                  <Pressable
                    style={styles.confirmDeleteBtn}
                    onPress={() => onConfirmDelete(entry.id)}
                  >
                    <Text style={styles.confirmDeleteText}>Löschen</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Animated.View>
        ))
      )}

      <View style={styles.incomeTipCard}>
        <View style={styles.incomeTipHeader}>
          <Feather name="info" size={18} color="#7340fd" />
          <Text style={styles.incomeTipTitle}>Tipp</Text>
        </View>
        <Text style={styles.incomeTipText}>
          Füge alle regelmäßigen Einnahmen hinzu, um dein verfügbares Budget
          genauer zu berechnen.
        </Text>
      </View>
    </ScrollView>
  );
};
