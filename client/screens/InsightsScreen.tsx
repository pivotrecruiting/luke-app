import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle, G } from "react-native-svg";
import { Spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

const screenWidth = Dimensions.get("window").width;

const formatCurrency = (value: number) => {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface DonutChartProps {
  categories: { name: string; amount: number; color: string }[];
  total: number;
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
}

function DonutChart({ categories, total, selectedCategory, onSelectCategory }: DonutChartProps) {
  const size = 215;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gap = 4;

  let currentAngle = -90;

  const segments = categories.map((kategorie) => {
    const percentage = kategorie.amount / total;
    const segmentLength = circumference * percentage - gap;
    const strokeDasharray = `${segmentLength} ${circumference - segmentLength}`;
    const rotation = currentAngle;
    currentAngle += percentage * 360;

    return {
      ...kategorie,
      strokeDasharray,
      rotation,
      percentage,
    };
  });

  const selectedCategoryData = selectedCategory
    ? categories.find((c) => c.name === selectedCategory)
    : null;

  const displayAmount = selectedCategoryData ? selectedCategoryData.amount : total;
  const displayLabel = selectedCategoryData ? selectedCategoryData.name : "Gesamt";

  return (
    <Pressable 
      style={styles.chartWrapper}
      onPress={() => onSelectCategory(null)}
    >
      <Svg width={size} height={size}>
        <G rotation={0} origin={`${center}, ${center}`}>
          {segments.map((segment, index) => {
            const isSelected = selectedCategory === segment.name;
            const hasSelection = selectedCategory !== null;
            const segmentOpacity = hasSelection ? (isSelected ? 1 : 0.4) : 1;
            const segmentStrokeWidth = isSelected ? strokeWidth + 4 : strokeWidth;
            
            return (
              <Circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={segment.color}
                strokeWidth={segmentStrokeWidth}
                fill="transparent"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={0}
                rotation={segment.rotation}
                origin={`${center}, ${center}`}
                strokeLinecap="butt"
                opacity={segmentOpacity}
              />
            );
          })}
        </G>
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={styles.chartAmount}>€ {formatCurrency(displayAmount)}</Text>
        <Text style={styles.chartLabel}>{displayLabel}</Text>
        {selectedCategoryData ? (
          <Text style={styles.chartPercentage}>
            {((selectedCategoryData.amount / total) * 100).toFixed(1)}%
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { insightCategories } = useApp();
  const [activeTab, setActiveTab] = useState<"ausgaben" | "einnahmen">("ausgaben");
  const [activeFilter, setActiveFilter] = useState<"kategorien" | "income" | "trend">("kategorien");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const gesamtAusgaben = useMemo(() => {
    return insightCategories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [insightCategories]);

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory((prev) => (prev === categoryName ? null : categoryName));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <Text style={styles.headerTitle}>Insights</Text>
        <Text style={styles.headerSubtitle}>alles auf einen Blick.</Text>

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
      >
        <View style={styles.filterRow}>
          <Pressable style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
            <Feather name="sliders" size={16} color="#6B7280" />
            <Text style={styles.filterButtonText}>Filter</Text>
            <Feather name="chevron-down" size={16} color="#6B7280" />
          </Pressable>
        </View>

        <View style={styles.tabsRow}>
          <Pressable
            style={[
              styles.tabButton,
              activeFilter === "kategorien" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveFilter("kategorien")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeFilter === "kategorien" && styles.tabButtonTextActive,
              ]}
            >
              Kategorien
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabButton,
              activeFilter === "income" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveFilter("income")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeFilter === "income" && styles.tabButtonTextActive,
              ]}
            >
              Income vs Expenses
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabButton,
              activeFilter === "trend" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveFilter("trend")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeFilter === "trend" && styles.tabButtonTextActive,
              ]}
            >
              Trend
            </Text>
          </Pressable>
        </View>

        <View style={styles.chartCard}>
          <DonutChart
            categories={insightCategories}
            total={gesamtAusgaben}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <View style={styles.kategorienGrid}>
            {insightCategories.map((kategorie, index) => {
              const isSelected = selectedCategory === kategorie.name;
              return (
                <Pressable
                  key={index}
                  style={[
                    styles.kategorieItem,
                    isSelected && styles.kategorieItemSelected,
                  ]}
                  onPress={() => handleCategoryPress(kategorie.name)}
                >
                  <View
                    style={[styles.kategorieDot, { backgroundColor: kategorie.color }]}
                  />
                  <View>
                    <Text style={styles.kategorieName}>{kategorie.name}</Text>
                    <Text style={styles.kategorieBetrag}>
                      € {formatCurrency(kategorie.amount)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.pageIndicator}>
            <View style={[styles.pageDot, styles.pageDotActive]} />
            <View style={styles.pageDot} />
            <View style={styles.pageDot} />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filter</Text>

            <Text style={styles.modalSectionTitle}>Zeitspanne</Text>

            <Text style={styles.modalSectionTitle}>Kosten</Text>

            <Pressable
              style={styles.modalDoneButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 22,
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  toggleButtonText: {
    fontSize: 14,
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#6B7280",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabButtonActive: {
    backgroundColor: "#3B5BDB",
    borderColor: "#3B5BDB",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartWrapper: {
    width: 220,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  chartCenter: {
    position: "absolute",
    alignItems: "center",
  },
  chartAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  chartLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  chartPercentage: {
    fontSize: 12,
    color: "#3B5BDB",
    fontWeight: "600",
    marginTop: 2,
  },
  kategorienGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
    width: "100%",
  },
  kategorieItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 16,
    gap: 10,
    padding: 8,
    margin: -8,
    borderRadius: 8,
  },
  kategorieItemSelected: {
    backgroundColor: "rgba(59, 91, 219, 0.1)",
    margin: 0,
    marginBottom: 8,
    width: "50%",
  },
  kategorieDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  kategorieName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  kategorieBetrag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B5BDB",
    marginTop: 2,
  },
  pageIndicator: {
    flexDirection: "row",
    gap: 6,
    marginTop: 20,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  pageDotActive: {
    backgroundColor: "#3B5BDB",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    minHeight: 350,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 32,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 40,
  },
  modalDoneButton: {
    backgroundColor: "#7340fd",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: "auto",
  },
  modalDoneButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
