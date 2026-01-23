import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const INCOME_TYPES = [
  { id: "gehalt", name: "Gehalt", icon: "briefcase" },
  { id: "nebenjob", name: "Nebenjob", icon: "clock" },
  { id: "freelance", name: "Freelance", icon: "code" },
  { id: "mieteinnahmen", name: "Mieteinnahmen", icon: "home" },
  { id: "dividenden", name: "Dividenden", icon: "trending-up" },
  { id: "kindergeld", name: "Kindergeld", icon: "users" },
  { id: "rente", name: "Rente", icon: "award" },
  { id: "sonstiges", name: "Sonstiges", icon: "plus-circle" },
];

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function IncomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    incomeEntries,
    totalIncome,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [customType, setCustomType] = useState("");
  const [amount, setAmount] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setSelectedType(null);
    setCustomType("");
    setAmount("");
    setModalVisible(true);
  };

  const openEditModal = (entry: {
    id: string;
    type: string;
    amount: number;
  }) => {
    setEditingId(entry.id);
    const matchingType = INCOME_TYPES.find((t) => t.name === entry.type);
    if (matchingType) {
      setSelectedType(matchingType.id);
      setCustomType("");
    } else {
      setSelectedType("sonstiges");
      setCustomType(entry.type);
    }
    setAmount(entry.amount.toString().replace(".", ","));
    setModalVisible(true);
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;
    if (parsedAmount <= 0) return;

    let typeName = "";
    if (selectedType === "sonstiges" && customType.trim()) {
      typeName = customType.trim();
    } else {
      const typeObj = INCOME_TYPES.find((t) => t.id === selectedType);
      if (!typeObj) return;
      typeName = typeObj.name;
    }

    if (editingId) {
      updateIncomeEntry(editingId, typeName, parsedAmount);
    } else {
      addIncomeEntry(typeName, parsedAmount);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteIncomeEntry(id);
    setDeleteConfirmId(null);
  };

  const resetForm = () => {
    setSelectedType(null);
    setCustomType("");
    setAmount("");
    setEditingId(null);
  };

  const getIconForType = (typeName: string): string => {
    const matchingType = INCOME_TYPES.find((t) => t.name === typeName);
    return matchingType?.icon || "plus-circle";
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Einnahmen</Text>
        <Pressable onPress={openAddModal} style={styles.addButton}>
          <Feather name="plus" size={24} color="#7340fd" />
        </Pressable>
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={styles.summaryCard}
        >
          <View style={styles.summaryIcon}>
            <Feather name="trending-up" size={28} color="#10B981" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Monatliche Einnahmen</Text>
            <Text style={styles.summaryAmount}>
              € {formatCurrency(totalIncome)}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text style={styles.sectionTitle}>Einnahmequellen</Text>

          {incomeEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                Noch keine Einnahmen hinzugefügt
              </Text>
              <Pressable style={styles.emptyButton} onPress={openAddModal}>
                <Text style={styles.emptyButtonText}>Einnahme hinzufügen</Text>
              </Pressable>
            </View>
          ) : (
            incomeEntries.map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.delay(250 + index * 50).duration(300)}
              >
                <Pressable
                  style={styles.incomeItem}
                  onPress={() => openEditModal(entry)}
                >
                  <View style={styles.incomeLeft}>
                    <View style={styles.incomeIconContainer}>
                      <Feather
                        name={getIconForType(entry.type) as any}
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
                    <Pressable
                      onPress={() => setDeleteConfirmId(entry.id)}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={18} color="#9CA3AF" />
                    </Pressable>
                  </View>
                </Pressable>

                {deleteConfirmId === entry.id && (
                  <View style={styles.deleteConfirm}>
                    <Text style={styles.deleteConfirmText}>
                      Wirklich löschen?
                    </Text>
                    <View style={styles.deleteActions}>
                      <Pressable
                        style={styles.cancelDeleteBtn}
                        onPress={() => setDeleteConfirmId(null)}
                      >
                        <Text style={styles.cancelDeleteText}>Abbrechen</Text>
                      </Pressable>
                      <Pressable
                        style={styles.confirmDeleteBtn}
                        onPress={() => handleDelete(entry.id)}
                      >
                        <Text style={styles.confirmDeleteText}>Löschen</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Animated.View>
            ))
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(300)}
          style={styles.tipCard}
        >
          <View style={styles.tipHeader}>
            <Feather name="info" size={18} color="#7340fd" />
            <Text style={styles.tipTitle}>Tipp</Text>
          </View>
          <Text style={styles.tipText}>
            Füge alle regelmäßigen Einnahmen hinzu, um dein verfügbares Budget
            genauer zu berechnen.
          </Text>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Einnahme bearbeiten" : "Neue Einnahme"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <KeyboardAwareScrollViewCompat
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <Text style={styles.modalLabel}>Art der Einnahme</Text>
              <View style={styles.typeGrid}>
                {INCOME_TYPES.map((type) => (
                  <Pressable
                    key={type.id}
                    style={[
                      styles.typeButton,
                      selectedType === type.id && styles.typeButtonSelected,
                    ]}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <Feather
                      name={type.icon as any}
                      size={20}
                      color={selectedType === type.id ? "#7340fd" : "#6B7280"}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === type.id &&
                          styles.typeButtonTextSelected,
                      ]}
                    >
                      {type.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {selectedType === "sonstiges" && (
                <View style={styles.customTypeContainer}>
                  <Text style={styles.modalLabel}>Bezeichnung</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customType}
                    onChangeText={setCustomType}
                    placeholder="z.B. Unterhalt"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}

              <Text style={styles.modalLabel}>Betrag (monatlich)</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>€</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0,00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>

              <Pressable
                style={[
                  styles.saveButton,
                  (!selectedType || !amount) && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!selectedType || !amount}
              >
                <Text style={styles.saveButtonText}>
                  {editingId ? "Speichern" : "Hinzufügen"}
                </Text>
              </Pressable>
            </KeyboardAwareScrollViewCompat>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  addButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10B981",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: "#7340fd",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  incomeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  incomeLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  incomeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  incomeType: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  incomeFrequency: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  incomeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  deleteConfirm: {
    backgroundColor: "#FEF2F2",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: -Spacing.sm + 4,
    marginBottom: Spacing.sm,
  },
  deleteConfirmText: {
    fontSize: 14,
    color: "#991B1B",
    marginBottom: Spacing.sm,
  },
  deleteActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  cancelDeleteBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  cancelDeleteText: {
    fontSize: 14,
    color: "#6B7280",
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  tipCard: {
    backgroundColor: "#F3F0FF",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7340fd",
  },
  tipText: {
    fontSize: 13,
    color: "#4C1D95",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeButtonSelected: {
    backgroundColor: "#F3F0FF",
    borderColor: "#7340fd",
  },
  typeButtonText: {
    fontSize: 13,
    color: "#6B7280",
  },
  typeButtonTextSelected: {
    color: "#7340fd",
    fontWeight: "500",
  },
  customTypeContainer: {
    marginTop: Spacing.sm,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    outlineStyle: "none",
  } as any,
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: 18,
    color: "#6B7280",
    marginRight: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 18,
    color: "#111827",
    outlineStyle: "none",
  } as any,
  saveButton: {
    backgroundColor: "#7340fd",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
