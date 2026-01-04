import { Platform } from "react-native";

// Luke App Theme - Finance app colors
const primaryPurple = "#7340fd";
const accentLavender = "#7B8CDE";
const buttonPurple = "#8E97FD";

export const Colors = {
  light: {
    text: "#000000",
    textSecondary: "#9CA3AF",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: primaryPurple,
    link: primaryPurple,
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F2F2F2",
    backgroundSecondary: "#E6E6E6",
    backgroundTertiary: "#D9D9D9",
    primary: primaryPurple,
    accent: accentLavender,
    buttonPrimary: buttonPurple,
    chipBackground: "#E9E1FF",
    chipBorder: "#E5E7EB",
    chipBorderSelected: "#000000",
    inputBorder: accentLavender,
    inputBorderLight: "#E5E7EB",
    cardOverview: "#7B8CDE",
    cardKlarna: "#F07B6E",
    cardSubscriptions: "#F5C5A8",
    cardSavings: "#F5D76E",
    cardGoals: "#7ECBA1",
    cardPeace: "#D4B5C7",
    teal: "#2d9a8c",
    divider: "#E5E7EB",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: primaryPurple,
    link: "#0A84FF",
    backgroundRoot: "#1F2123",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    primary: primaryPurple,
    accent: accentLavender,
    buttonPrimary: buttonPurple,
    chipBackground: "#2A2C2E",
    chipBorder: "#404244",
    chipBorderSelected: "#FFFFFF",
    inputBorder: accentLavender,
    inputBorderLight: "#404244",
    cardOverview: "#7B8CDE",
    cardKlarna: "#F07B6E",
    cardSubscriptions: "#F5C5A8",
    cardSavings: "#F5D76E",
    cardGoals: "#7ECBA1",
    cardPeace: "#D4B5C7",
    teal: "#2d9a8c",
    divider: "#404244",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 56,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 25,
    fontWeight: "800" as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  tiny: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  button: {
    fontSize: 14,
    fontWeight: "800" as const,
  },
  chip: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
