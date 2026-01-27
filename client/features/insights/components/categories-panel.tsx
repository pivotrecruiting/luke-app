import { Pressable, Text, View } from "react-native";
import { styles } from "@/screens/styles/insights-screen.styles";
import { DonutChart } from "./donut-chart";
import { formatCurrency } from "../utils/format";
import type { CategoryT } from "../types/insights-types";

type CategoriesPanelPropsT = {
  categories: CategoryT[];
  total: number;
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
  onToggleCategory: (name: string) => void;
};

/**
 * Combines donut chart and category list for the categories tab.
 */
export const CategoriesPanel = ({
  categories,
  total,
  selectedCategory,
  onSelectCategory,
  onToggleCategory,
}: CategoriesPanelPropsT) => {
  return (
    <View style={styles.chartCard}>
      <DonutChart
        categories={categories}
        total={total}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />

      <View style={styles.kategorienGrid}>
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category.name;
          return (
            <Pressable
              key={index}
              style={[
                styles.kategorieItem,
                isSelected && styles.kategorieItemSelected,
              ]}
              onPress={() => onToggleCategory(category.name)}
            >
              <View
                style={[
                  styles.kategorieDot,
                  { backgroundColor: category.color },
                ]}
              />
              <View>
                <Text style={styles.kategorieName}>{category.name}</Text>
                <Text style={styles.kategorieBetrag}>
                  € {formatCurrency(category.amount)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
