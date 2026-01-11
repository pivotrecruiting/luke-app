import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";

const CATEGORIES = [
  { id: "lebensmittel", name: "Lebensmittel", icon: "shopping-cart" },
  { id: "wohnen", name: "Wohnen", icon: "home" },
  { id: "transport", name: "Transport", icon: "truck" },
  { id: "hygiene", name: "Hygiene", icon: "heart" },
  { id: "abonnements", name: "Abonnements", icon: "repeat" },
  { id: "shopping", name: "Shopping", icon: "shopping-bag" },
  { id: "sonstiges", name: "Sonstiges", icon: "more-horizontal" },
];

const INCOME_CATEGORIES = [
  { id: "gehalt", name: "Gehalt", icon: "briefcase" },
  { id: "freelance", name: "Freelance", icon: "edit-3" },
  { id: "investitionen", name: "Investitionen", icon: "trending-up" },
  { id: "geschenke", name: "Geschenke", icon: "gift" },
  { id: "sonstiges", name: "Sonstiges", icon: "more-horizontal" },
];

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"ausgaben" | "einnahmen">("ausgaben");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = activeTab === "ausgaben" ? CATEGORIES : INCOME_CATEGORIES;

  const handleSave = () => {
    setAmount("");
    setDescription("");
    setSelectedCategory(null);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <Text style={styles.headerTitle}>Transaktion</Text>
        <Text style={styles.headerSubtitle}>hinzufügen</Text>

        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleButton,
              activeTab === "ausgaben" && styles.toggleButtonActive,
            ]}
            onPress={() => setActiveTab("ausgaben")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeTab === "ausgaben" && styles.toggleButtonTextActive,
              ]}
            >
              Ausgaben
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              activeTab === "einnahmen" && styles.toggleButtonActive,
            ]}
            onPress={() => setActiveTab("einnahmen")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeTab === "einnahmen" && styles.toggleButtonTextActive,
              ]}
            >
              Einnahmen
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Betrag</Text>
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
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Beschreibung</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="z.B. Einkauf bei REWE"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Kategorie</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.categoryItemActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    selectedCategory === category.id && styles.categoryIconActive,
                  ]}
                >
                  <Feather
                    name={category.icon as any}
                    size={20}
                    color={selectedCategory === category.id ? "#FFFFFF" : "#6B7280"}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    selectedCategory === category.id && styles.categoryNameActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[
            styles.saveButton,
            (!amount || !selectedCategory) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!amount || !selectedCategory}
        >
          <Text style={styles.saveButtonText}>
            {activeTab === "ausgaben" ? "Ausgabe speichern" : "Einnahme speichern"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 22,
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#3B5BDB",
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  toggleButtonTextActive: {
    color: "#3B5BDB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    outlineStyle: "none",
  } as any,
  descriptionInput: {
    fontSize: 16,
    color: "#000000",
    paddingVertical: 8,
    outlineStyle: "none",
  } as any,
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryItem: {
    alignItems: "center",
    width: 80,
  },
  categoryItemActive: {},
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIconActive: {
    backgroundColor: "#7340fd",
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  categoryNameActive: {
    color: "#7340fd",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#7340fd",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
