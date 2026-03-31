import type {
  XpStreakPayloadT,
  UserProgressT,
  XpEventRuleT,
  XpEventTypeT,
  XpLevelT,
  XpLevelUpPayloadT,
} from "@/types/xp-types";
import type { BudgetCategoryRow, IncomeCategoryRow } from "@/services/types";
import type { AccessStateT } from "@/services/access-service";

export type CurrencyCode = "EUR" | "USD" | "CHF";

export type IncomeEntry = {
  id: string;
  type: string;
  amount: number;
};

export type ExpenseEntry = {
  id: string;
  type: string;
  amount: number;
};

export type GoalDeposit = {
  id: string;
  date: string;
  amount: number;
  type: "Einzahlung" | "Rückzahlung";
  /** Links to transaction for home screen balance; used when deleting deposit */
  transactionId?: string;
};

export type Goal = {
  id: string;
  name: string;
  icon: string;
  target: number;
  monthlyContribution: number | null;
  current: number;
  remaining: number;
  deposits: GoalDeposit[];
};

export type BudgetExpense = {
  id: string;
  name: string;
  date: string;
  amount: number;
  timestamp?: number;
};

export type Budget = {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  limit: number;
  current: number;
  expenses: BudgetExpense[];
};

export type TransactionSourceT = "manual" | "recurring" | "onboarding";

export type VaultEntryTypeT =
  | "monthly_rollover"
  | "manual_deposit"
  | "goal_deposit";

export type VaultTransactionT = {
  id: string;
  amount: number;
  entryType: VaultEntryTypeT;
  note: string | null;
  goalId: string | null;
  rolloverMonth: string | null;
  transactionAt: string;
};

export type MonthlyBalanceSnapshotT = {
  id: string;
  monthStart: string;
  amount: number;
  currency: CurrencyCode;
  snapshotAt: string;
};

export type WeeklySpending = {
  day: string;
  amount: number;
  maxAmount: number;
};

export type Transaction = {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  icon: string;
  timestamp?: number;
  source?: TransactionSourceT;
};

export type InsightCategory = {
  name: string;
  amount: number;
  color: string;
};

export type MonthlyTrendData = {
  month: string;
  monthIndex: number;
  monthStart: string;
  amount: number;
  isSnapshot: boolean;
  isCurrentMonth: boolean;
};

export type AppState = {
  isOnboardingComplete: boolean;
  isAppLoading: boolean;
  isBillingStateLoading: boolean;
  hasAccess: boolean;
  accessKey: string | null;
  accessSourceType: string | null;
  accessActiveUntil: string | null;
  paywallRequired: boolean;
  paywallVisible: boolean;
  trialEndsAt: string | null;
  paywallVisibleFrom: string | null;
  daysUntilTrialExpiry: number | null;
  userName: string | null;
  currency: CurrencyCode;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  goals: Goal[];
  budgets: Budget[];
  budgetCategories: BudgetCategoryRow[];
  weeklySpending: WeeklySpending[];
  transactions: Transaction[];
  vaultTransactions: VaultTransactionT[];
  monthlyBalanceSnapshots: MonthlyBalanceSnapshotT[];
  vaultBalance: number;
  incomeCategories: IncomeCategoryRow[];
  insightCategories: InsightCategory[];
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalExpenses: number;
  monthlyBudget: number;
  balance: number;
  monthlyBalance: number;
  transactionIncomeTotal: number;
  transactionExpenseTotal: number;
  transactionBalance: number;
  savingsRate: number;
  monthlyTrendData: MonthlyTrendData[];
  selectedWeekOffset: number;
  currentWeekLabel: string;
  balanceAnchorMonth: string | null;
  levels: XpLevelT[];
  xpEventTypes: XpEventTypeT[];
  xpEventRules: XpEventRuleT[];
  userProgress: UserProgressT | null;
  pendingLevelUps: XpLevelUpPayloadT[];
  pendingStreaks: XpStreakPayloadT[];
};

export type AppContextType = AppState & {
  setUserName: (userName: string | null) => void;
  addIncomeEntry: (type: string, amount: number) => void;
  addExpenseEntry: (type: string, amount: number) => void;
  setIncomeEntries: (entries: { type: string; amount: number }[]) => void;
  setExpenseEntries: (entries: { type: string; amount: number }[]) => void;
  setCurrency: (currency: CurrencyCode) => void;
  addGoalDeposit: (goalId: string, amount: number, customDate?: Date) => void;
  updateGoalDeposit: (
    goalId: string,
    depositId: string,
    amount: number,
    date?: Date,
  ) => void;
  deleteGoalDeposit: (goalId: string, depositId: string) => void;
  addBudgetExpense: (
    budgetId: string,
    amount: number,
    name: string,
    customDate?: Date,
  ) => void;
  updateBudgetExpense: (
    budgetId: string,
    expenseId: string,
    amount: number,
    name: string,
    date?: Date,
  ) => void;
  deleteBudgetExpense: (budgetId: string, expenseId: string) => void;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  addVaultDeposit: (amount: number, note?: string) => void;
  updateTransaction: (
    transactionId: string,
    updates: Partial<Omit<Transaction, "id">>,
  ) => void;
  deleteTransaction: (transactionId: string) => void;
  completeOnboarding: () => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => void;
  deleteBudget: (budgetId: string) => void;
  addGoal: (
    name: string,
    icon: string,
    target: number,
    monthlyContribution?: number | null,
  ) => void;
  addBudget: (
    name: string,
    icon: string,
    iconColor: string,
    limit: number,
  ) => void;
  addExpenseWithAutobudget: (
    categoryName: string,
    icon: string,
    amount: number,
    name: string,
    date: Date,
  ) => void;
  updateIncomeEntry: (id: string, type: string, amount: number) => void;
  deleteIncomeEntry: (id: string) => void;
  updateExpenseEntry: (id: string, type: string, amount: number) => void;
  deleteExpenseEntry: (id: string) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  resetMonthlyBudgets: () => void;
  lastBudgetResetMonth: number;
  enqueueLevelUp: (payload: XpLevelUpPayloadT) => void;
  consumeNextLevelUp: () => void;
  enqueueStreak: (payload: XpStreakPayloadT) => void;
  consumeNextStreak: () => void;
  submitOnboarding: () => void;
  refreshAccessState: () => Promise<AccessStateT>;
};

export type PersistedData = {
  isOnboardingComplete: boolean;
  currency: CurrencyCode;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  goals: Goal[];
  budgets: Budget[];
  transactions: Transaction[];
  vaultTransactions: VaultTransactionT[];
  monthlyBalanceSnapshots: MonthlyBalanceSnapshotT[];
  lastBudgetResetMonth: number;
  balanceAnchorMonth: string | null;
};
