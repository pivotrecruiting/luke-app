import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/goals-screen.styles";
import { formatCurrency } from "../utils/format";
import { LockIcon } from "@/components/ui/lock-icon";

const localStyles = StyleSheet.create({
  lockIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
  },
});

type VaultCardPropsT = {
  vaultBalance: number;
  monthlyBalance: number;
  onPress: () => void;
};

/**
 * Displays vault summary information and opens the vault screen when tapped.
 */
export const VaultCard = ({
  vaultBalance,
  monthlyBalance,
  onPress,
}: VaultCardPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <Pressable style={styles.vaultCard} onPress={onPress}>
      <View style={localStyles.lockIcon}>
        <LockIcon size={38} />
      </View>
      <View style={styles.vaultHeaderRow}>
        <View style={styles.vaultTitleRow}>
          <Text style={styles.vaultTitle}>Dein Tresor</Text>
        </View>
      </View>

      <Text style={styles.vaultAmount}>
        {currencySymbol} {formatCurrency(vaultBalance, currency)}
      </Text>

      <Text style={styles.vaultHint}>verfügbar für Deine Ziele</Text>
    </Pressable>
  );
};
