import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Spacing } from "@/constants/theme";
import { useGoalDetailScreen } from "@/features/goal-detail/hooks/use-goal-detail-screen";
import { GoalDetailHeader } from "@/features/goal-detail/components/goal-detail-header";
import { GoalSummaryCard } from "@/features/goal-detail/components/goal-summary-card";
import { DepositsSection } from "@/features/goal-detail/components/deposits-section";
import { EditGoalModal } from "@/features/goal-detail/components/edit-goal-modal";
import { AddDepositModal } from "@/features/goal-detail/components/add-deposit-modal";
import { EditDepositModal } from "@/features/goal-detail/components/edit-deposit-modal";
import { styles } from "./styles/goal-detail-screen.styles";

export default function GoalDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const goalId = route.params?.goalId || route.params?.goal?.id;
  const goalName = route.params?.goal?.name;

  const { goal, groupedDeposits, derived, state, actions } =
    useGoalDetailScreen({
      goalId,
      goalName,
      onNavigateBack: () => navigation.goBack(),
    });

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text>Goal not found</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.5)"]}
        locations={[0, 0.3, 1]}
        style={styles.fadeOverlay}
        pointerEvents="none"
      />
      <View style={styles.modalContentWrapper}>
        <GoalDetailHeader
          topInset={insets.top + Spacing.lg}
          title={goal.name}
          subtitle={derived.isCompleted ? "Geschafft!" : "bleib dran!"}
          onBack={() => navigation.goBack()}
          onEditGoal={actions.openEditNameModal}
          onDeleteGoal={actions.handleDeleteGoal}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 180 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GoalSummaryCard
            name={goal.name}
            icon={goal.icon}
            current={goal.current}
            target={goal.target}
            percentage={derived.percentage}
            remaining={derived.remaining}
          />
          <DepositsSection
            groupedDeposits={groupedDeposits}
            goalIcon={goal.icon}
            depositTitle={derived.depositTitle}
            activeSwipeId={state.activeSwipeId}
            onSwipeOpen={actions.setActiveSwipeId}
            onEditDeposit={actions.handleEditDeposit}
            onDeleteDeposit={actions.handleDeleteDeposit}
          />
        </ScrollView>

        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 100 }]}
          onPress={actions.openDepositModal}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>

        <EditGoalModal
          visible={state.editModalVisible}
          bottomInset={insets.bottom}
          tempName={state.tempName}
          tempAmount={state.tempAmount}
          tempMonthlyContribution={state.tempMonthlyContribution}
          tempEmoji={state.tempEmoji}
          showEmojiPicker={state.showEmojiPicker}
          monthsToGoal={derived.monthsToGoal}
          onChangeName={actions.setTempName}
          onChangeAmount={actions.setTempAmount}
          onChangeMonthlyContribution={actions.setTempMonthlyContribution}
          onToggleEmojiPicker={actions.toggleEmojiPicker}
          onSelectEmoji={actions.selectEmoji}
          onSave={actions.handleEditSave}
          onCancel={actions.handleEditCancel}
        />

        <AddDepositModal
          visible={state.depositModalVisible}
          bottomInset={insets.bottom}
          depositTitle={derived.depositTitle}
          goalName={goal.name}
          goalIcon={goal.icon ?? "🎯"}
          goalCurrent={goal.current}
          goalTarget={goal.target}
          depositAmount={state.depositAmount}
          selectedDate={state.selectedDate}
          showDatePicker={state.showDatePicker}
          onChangeAmount={actions.setDepositAmount}
          onOpenDatePicker={() => actions.setShowDatePicker(true)}
          onCloseDatePicker={() => actions.setShowDatePicker(false)}
          onDateChange={actions.onDateChange}
          onSave={actions.handleDepositSave}
          onCancel={actions.handleDepositCancel}
        />

        <EditDepositModal
          visible={state.editDepositModalVisible}
          bottomInset={insets.bottom}
          depositTitle={derived.depositTitle}
          editDepositAmount={state.editDepositAmount}
          editDepositDate={state.editDepositDate}
          showDatePicker={state.showEditDatePicker}
          onChangeAmount={actions.setEditDepositAmount}
          onOpenDatePicker={() => actions.setShowEditDatePicker(true)}
          onCloseDatePicker={() => actions.setShowEditDatePicker(false)}
          onDateChange={actions.onEditDateChange}
          onSave={actions.handleEditDepositSave}
          onCancel={actions.handleEditDepositCancel}
        />
      </View>
    </GestureHandlerRootView>
  );
}
