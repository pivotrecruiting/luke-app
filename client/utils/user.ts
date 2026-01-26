/**
 * Extracts the first name from a full user name.
 * Returns null if the name is invalid or empty.
 *
 * @param userName - The full user name (can be null or undefined)
 * @returns The first name or null if not available
 */
export const getUserFirstName = (userName: string | null | undefined): string | null => {
  if (typeof userName !== "string") {
    return null;
  }
  const trimmed = userName.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.split(" ")[0] ?? null;
};
