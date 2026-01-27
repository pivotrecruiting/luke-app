import React, { useState, useLayoutEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useApp } from "@/context/AppContext";
import { Spacing } from "@/constants/theme";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { styles } from "./styles/income-screen.styles";
import { AppModal } from "@/components/ui/app-modal";

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
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const {
    incomeEntries,
    totalIncome,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
  } = useApp();

  // Check if native header with Liquid Glass is available
  const useNativeHeader = isLiquidGlassAvailable() && Platform.OS === "ios";

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [customType, setCustomType] = useState("");
  const [amount, setAmount] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openAddModal = useCallback(() => {
    setEditingId(null);
    setSelectedType(null);
    setCustomType("");
    setAmount("");
    setModalVisible(true);
  }, []);

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

  // Set header right button for adding income (only if native header is used)
  useLayoutEffect(() => {
    if (useNativeHeader) {
      navigation.setOptions({
        headerRight: () => (
          <Pressable
            onPress={openAddModal}
            style={{ marginRight: 16 }}
            hitSlop={8}
          >
            <Feather name="plus" size={24} color="#7340fd" />
          </Pressable>
        ),
      });
    }
  }, [navigation, openAddModal, useNativeHeader]);

  return (
    <View style={styles.container}>
      {/* Custom header for non-iOS 18 devices */}
      {!useNativeHeader && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.header, { paddingTop: insets.top }]}
        >
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
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingTop: useNativeHeader ? headerHeight + Spacing.md : Spacing.md,
          paddingBottom: insets.bottom + Spacing.xl,
        }}
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

      <AppModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        maxHeightPercent={80}
        contentStyle={[
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
                    selectedType === type.id && styles.typeButtonTextSelected,
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
      </AppModal>
    </View>
  );
}
