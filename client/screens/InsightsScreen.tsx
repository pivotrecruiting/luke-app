import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle, G } from "react-native-svg";
import { Spacing } from "@/constants/theme";

const screenWidth = Dimensions.get("window").width;

const MOCK_DATA = {
  gesamtAusgaben: 1308.41,
  kategorien: [
    { name: "Lebensmittel", betrag: 410.12, color: "#3B5BDB" },
    { name: "Hygiene", betrag: 160.48, color: "#B8C4E9" },
    { name: "Wohnen", betrag: 600.23, color: "#C77DFF" },
    { name: "Abonnements", betrag: 160.48, color: "#7B8CDE" },
    { name: "Shopping", betrag: 160.48, color: "#9D4EDD" },
  ],
};

const formatCurrency = (value: number) => {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function DonutChart() {
  const size = 215;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gap = 4;

  const total = MOCK_DATA.kategorien.reduce((sum, k) => sum + k.betrag, 0);
  let currentAngle = -90;

  const segments = MOCK_DATA.kategorien.map((kategorie) => {
    const percentage = kategorie.betrag / total;
    const segmentLength = circumference * percentage - gap;
    const strokeDasharray = `${segmentLength} ${circumference - segmentLength}`;
    const rotation = currentAngle;
    currentAngle += percentage * 360;

    return {
      ...kategorie,
      strokeDasharray,
      rotation,
    };
  });

  return (
    <View style={styles.chartWrapper}>
      <Svg width={size} height={size}>
        <G rotation={0} origin={`${center}, ${center}`}>
          {segments.map((segment, index) => (
            <Circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={0}
              rotation={segment.rotation}
              origin={`${center}, ${center}`}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={styles.chartAmount}>€ {formatCurrency(MOCK_DATA.gesamtAusgaben)}</Text>
        <Text style={styles.chartLabel}>Gesamt</Text>
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"ausgaben" | "einnahmen">("ausgaben");
  const [activeFilter, setActiveFilter] = useState<"kategorien" | "income" | "trend">("kategorien");

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
          <Pressable style={styles.filterButton}>
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
          <DonutChart />

          <View style={styles.kategorienGrid}>
            {MOCK_DATA.kategorien.map((kategorie, index) => (
              <View key={index} style={styles.kategorieItem}>
                <View
                  style={[styles.kategorieDot, { backgroundColor: kategorie.color }]}
                />
                <View>
                  <Text style={styles.kategorieName}>{kategorie.name}</Text>
                  <Text style={styles.kategorieBetrag}>
                    € {formatCurrency(kategorie.betrag)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.pageIndicator}>
            <View style={[styles.pageDot, styles.pageDotActive]} />
            <View style={styles.pageDot} />
            <View style={styles.pageDot} />
          </View>
        </View>
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
});
