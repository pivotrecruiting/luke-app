import type { XpLevelT } from "@/types/xp-types";

export const resolveLevelByXp = (
  levels: XpLevelT[],
  xpTotal: number,
): XpLevelT | null => {
  if (levels.length === 0) return null;
  const sorted = [...levels].sort((a, b) => a.xpRequired - b.xpRequired);
  let current = sorted[0];
  for (const level of sorted) {
    if (xpTotal >= level.xpRequired) {
      current = level;
    } else {
      break;
    }
  }
  return current;
};
