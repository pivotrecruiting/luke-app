import { useRef, useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { IncomeEntry } from "@/context/AppContext";
import { SwipeableIncomeItem } from "./swipeable-income-item";

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
  onAddIncome,
  onEditIncome,
  onConfirmDelete,
  getIconForIncomeType,
}: IncomeTabPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

  const handleSwipeOpen = useCallback((id: string) => {
    Object.entries(swipeableRefs.current).forEach(([entryId, ref]) => {
      if (entryId !== id && ref?.close) {
        ref.close();
      }
    });
  }, []);
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
            {currencySymbol} {formatCurrency(totalIncome, currency)}
          </Text>
        </View>
        <Pressable style={styles.addIncomeButton} onPress={onAddIncome}>
          <Feather name="plus" size={20} color="#7340fd" />
        </Pressable>
      </View>

      <Text style={styles.incomeSectionTitle}>Einnahmequellen</Text>
      <Text style={styles.incomeSwipeHint}>
        Wischen zum Löschen, tippen zum Bearbeiten
      </Text>

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
            <SwipeableIncomeItem
              ref={(r) => {
                if (r) {
                  swipeableRefs.current[entry.id] = r;
                } else {
                  delete swipeableRefs.current[entry.id];
                }
              }}
              entry={entry}
              getIconForIncomeType={getIconForIncomeType}
              onEdit={() => onEditIncome(entry)}
              onDelete={() => onConfirmDelete(entry.id)}
              onSwipeOpen={handleSwipeOpen}
            />
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
