import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { addDays, getLocalDateKey } from "@/features/xp/utils/dates";
import { Spacing } from "@/constants/theme";

const DAY_LABELS = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"] as const;

type StreakProgressBarProps = {
  currentStreak: number;
  lastStreakDate: string | null;
};

/**
 * Displays 7 round purple circles representing the week. Active streak days show a flame icon.
 */
export const StreakProgressBar = ({
  currentStreak,
  lastStreakDate,
}: StreakProgressBarProps) => {
  const dayStates = useMemo(() => {
    const today = new Date();

    if (!lastStreakDate || currentStreak <= 0) {
      const windowStart = addDays(today, -6);
      return Array.from({ length: 7 }, (_, i) => {
        const date = addDays(windowStart, i);
        return {
          label: DAY_LABELS[date.getDay()],
          isActive: false,
          isCurrentDay: getLocalDateKey(date) === getLocalDateKey(today),
        };
      });
    }

    const [year, month, day] = lastStreakDate.split("-").map(Number);
    const lastDate = new Date(year, month - 1, day);
    const cycleDayCount = ((currentStreak - 1) % 7) + 1;
    const cycleStart = addDays(lastDate, -(cycleDayCount - 1));
    const windowStart = addDays(lastDate, -6);
    const cycleStartKey = getLocalDateKey(cycleStart);
    const lastStreakKey = getLocalDateKey(lastDate);
    const todayKey = getLocalDateKey(today);

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(windowStart, i);
      const dateKey = getLocalDateKey(date);
      const isActive = dateKey >= cycleStartKey && dateKey <= lastStreakKey;
      const isCurrentDay = dateKey === todayKey;

      return {
        label: DAY_LABELS[date.getDay()],
        isActive,
        isCurrentDay,
      };
    });
  }, [currentStreak, lastStreakDate]);

  return (
    <View style={styles.container}>
      <View style={styles.labelsRow}>
        {dayStates.map(({ label }, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.label}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.circlesRow}>
        {dayStates.map(({ isActive, isCurrentDay }, i) => (
          <View key={i} style={styles.cell}>
            <View
              style={[
                styles.circle,
                isCurrentDay && isActive && styles.circleCurrent,
              ]}
            >
              {isActive ? <Text style={styles.flame}>🔥</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const CIRCLE_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  labelsRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: Spacing.xs,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  circlesRow: {
    flexDirection: "row",
    width: "100%",
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "rgba(115, 64, 253, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleCurrent: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  flame: {
    fontSize: 18,
  },
});
