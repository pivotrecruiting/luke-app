import { Pressable, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { CategoryT } from "../types/insights-types";

type DonutChartPropsT = {
  categories: CategoryT[];
  total: number;
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
};

/**
 * Renders a selectable donut chart with category segments and a summary label.
 */
export const DonutChart = ({
  categories,
  total,
  selectedCategory,
  onSelectCategory,
}: DonutChartPropsT) => {
  const size = 215;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gap = 4;

  let currentAngle = -90;

  const hasTotal = total > 0;

  const segments = hasTotal
    ? categories.map((category) => {
        const percentage = category.amount / total;
        const segmentLength = circumference * percentage - gap;
        const strokeDasharray = `${segmentLength} ${circumference - segmentLength}`;
        const rotation = currentAngle;
        currentAngle += percentage * 360;

        return {
          ...category,
          strokeDasharray,
          rotation,
          percentage,
        };
      })
    : [];

  const selectedCategoryData = selectedCategory
    ? categories.find((c) => c.name === selectedCategory)
    : null;

  const displayAmount = selectedCategoryData
    ? selectedCategoryData.amount
    : total;
  const displayLabel = selectedCategoryData
    ? selectedCategoryData.name
    : "Gesamt";

  return (
    <Pressable
      style={styles.chartWrapper}
      onPress={() => onSelectCategory(null)}
    >
      <Svg width={size} height={size}>
        <G rotation={0} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {segments.map((segment, index) => {
            const isSelected = selectedCategory === segment.name;
            const hasSelection = selectedCategory !== null;
            const segmentOpacity = hasSelection ? (isSelected ? 1 : 0.4) : 1;
            const segmentStrokeWidth = isSelected
              ? strokeWidth + 4
              : strokeWidth;

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
        <Text style={styles.chartAmount}>
          € {formatCurrency(displayAmount)}
        </Text>
        <Text style={styles.chartLabel}>{displayLabel}</Text>
        {selectedCategoryData && hasTotal ? (
          <Text style={styles.chartPercentage}>
            {((selectedCategoryData.amount / total) * 100).toFixed(1)}%
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};
