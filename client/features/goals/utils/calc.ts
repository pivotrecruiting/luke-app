export const calculateMonths = (
  goalAmount: string,
  monthlyContribution: string,
) => {
  const amount = parseFloat(goalAmount.replace(",", ".")) || 0;
  const monthly = parseFloat(monthlyContribution.replace(",", ".")) || 0;
  if (monthly <= 0 || amount <= 0) return 0;
  return Math.ceil(amount / monthly);
};
