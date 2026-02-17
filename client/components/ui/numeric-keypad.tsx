import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

type NumericKeypadPropsT = {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
};

/**
 * Custom numeric keypad for amount input. Renders a 4x3 grid with digits,
 * decimal separator (comma), and backspace.
 */
export const NumericKeypad = ({
  onDigit,
  onDecimal,
  onBackspace,
}: NumericKeypadPropsT) => {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {digits.slice(0, 3).map((d) => (
          <Pressable
            key={d}
            style={({ pressed }) => [
              styles.key,
              pressed && styles.keyPressed,
            ]}
            onPress={() => onDigit(d)}
            accessibilityLabel={`Digit ${d}`}
            accessibilityRole="button"
          >
            <Text style={styles.keyText}>{d}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        {digits.slice(3, 6).map((d) => (
          <Pressable
            key={d}
            style={({ pressed }) => [
              styles.key,
              pressed && styles.keyPressed,
            ]}
            onPress={() => onDigit(d)}
            accessibilityLabel={`Digit ${d}`}
            accessibilityRole="button"
          >
            <Text style={styles.keyText}>{d}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        {digits.slice(6, 9).map((d) => (
          <Pressable
            key={d}
            style={({ pressed }) => [
              styles.key,
              pressed && styles.keyPressed,
            ]}
            onPress={() => onDigit(d)}
            accessibilityLabel={`Digit ${d}`}
            accessibilityRole="button"
          >
            <Text style={styles.keyText}>{d}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [
            styles.key,
            pressed && styles.keyPressed,
          ]}
          onPress={onDecimal}
          accessibilityLabel="Decimal separator"
          accessibilityRole="button"
        >
          <Text style={styles.keyText}>,</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.key,
            pressed && styles.keyPressed,
          ]}
          onPress={() => onDigit("0")}
          accessibilityLabel="Digit 0"
          accessibilityRole="button"
        >
          <Text style={styles.keyText}>0</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.key,
            pressed && styles.keyPressed,
          ]}
          onPress={onBackspace}
          accessibilityLabel="Delete"
          accessibilityRole="button"
        >
          <Feather name="delete" size={24} color="#374151" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  key: {
    flex: 1,
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  keyPressed: {
    opacity: 0.7,
    backgroundColor: "#F3F4F6",
  },
  keyText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#374151",
  },
});
