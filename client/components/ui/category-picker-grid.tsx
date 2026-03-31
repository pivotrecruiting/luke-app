import type { ComponentProps } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

export type CategoryPickerOptionT = {
  id: string;
  name: string;
  icon: string;
};

type CategoryPickerGridPropsT = {
  categories: CategoryPickerOptionT[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
};

type FeatherIconNameT = ComponentProps<typeof Feather>["name"];

/**
 * Reusable category picker grid used across transaction and budget flows.
 */
export const CategoryPickerGrid = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryPickerGridPropsT) => {
  return (
    <View style={styles.categoriesGrid}>
      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id;

        return (
          <Pressable
            key={category.id}
            style={[
              styles.categoryItem,
              isSelected && styles.categoryItemActive,
            ]}
            onPress={() => {
              Keyboard.dismiss();
              onSelectCategory(category.id);
            }}
          >
            <View
              style={[
                styles.categoryIcon,
                isSelected && styles.categoryIconActive,
              ]}
            >
              <Feather
                name={category.icon as FeatherIconNameT}
                size={20}
                color={isSelected ? "#FFFFFF" : "#6B7280"}
              />
            </View>
            <Text
              style={[
                styles.categoryName,
                isSelected && styles.categoryNameActive,
              ]}
            >
              {category.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryItem: {
    alignItems: "center",
    width: "25%",
    marginBottom: 12,
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
    backgroundColor: Colors.light.primary,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  categoryNameActive: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
});
