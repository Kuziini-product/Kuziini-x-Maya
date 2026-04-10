/**
 * Admin theme system - 3 themes: dark, light, gold
 * Uses CSS class overrides on the root container
 */

export type AdminTheme = "dark" | "light" | "gold";

export const THEME_KEY = "kuziini_admin_theme";

export function getSavedTheme(): AdminTheme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as AdminTheme) || "dark";
}

export function saveTheme(theme: AdminTheme) {
  localStorage.setItem(THEME_KEY, theme);
}

export const THEME_LABELS: Record<AdminTheme, string> = {
  dark: "Intunecat",
  light: "Luminos",
  gold: "Gold",
};

// Theme CSS classes - applied to components
export interface ThemeClasses {
  // Page
  pageBg: string;
  pageText: string;
  // Header
  headerBg: string;
  headerBorder: string;
  // Cards
  cardBg: string;
  cardBorder: string;
  // Inputs
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  // Text hierarchy
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  // Tab inactive
  tabInactiveBg: string;
  tabInactiveText: string;
  // Misc
  dividerBorder: string;
  popupBg: string;
  sectionLabel: string;
}

export const THEMES: Record<AdminTheme, ThemeClasses> = {
  dark: {
    pageBg: "bg-[#0A0A0A]",
    pageText: "text-white",
    headerBg: "bg-[#0A0A0A]",
    headerBorder: "border-white/[0.08]",
    cardBg: "bg-white/[0.04]",
    cardBorder: "border-white/[0.08]",
    inputBg: "bg-white/[0.06]",
    inputBorder: "border-white/[0.1]",
    inputText: "text-white",
    inputPlaceholder: "placeholder:text-white/30",
    textPrimary: "text-white",
    textSecondary: "text-white/70",
    textMuted: "text-white/50",
    textFaint: "text-white/30",
    tabInactiveBg: "bg-white/[0.06]",
    tabInactiveText: "text-white/50",
    dividerBorder: "border-white/[0.08]",
    popupBg: "bg-[#141414]",
    sectionLabel: "text-white/30",
  },
  light: {
    pageBg: "bg-white",
    pageText: "text-gray-900",
    headerBg: "bg-white",
    headerBorder: "border-gray-200",
    cardBg: "bg-gray-100/80",
    cardBorder: "border-gray-200",
    inputBg: "bg-gray-100/80",
    inputBorder: "border-gray-200",
    inputText: "text-gray-900",
    inputPlaceholder: "placeholder:text-gray-400",
    textPrimary: "text-gray-900",
    textSecondary: "text-gray-700",
    textMuted: "text-gray-600",
    textFaint: "text-gray-500",
    tabInactiveBg: "bg-gray-100",
    tabInactiveText: "text-gray-600",
    dividerBorder: "border-gray-200",
    popupBg: "bg-white",
    sectionLabel: "text-gray-500",
  },
  gold: {
    pageBg: "bg-[#1a1510]",
    pageText: "text-[#f5e6d0]",
    headerBg: "bg-[#1a1510]",
    headerBorder: "border-[#C9AB81]/20",
    cardBg: "bg-[#C9AB81]/[0.06]",
    cardBorder: "border-[#C9AB81]/15",
    inputBg: "bg-[#C9AB81]/[0.08]",
    inputBorder: "border-[#C9AB81]/20",
    inputText: "text-[#f5e6d0]",
    inputPlaceholder: "placeholder:text-[#C9AB81]/30",
    textPrimary: "text-[#f5e6d0]",
    textSecondary: "text-[#C9AB81]/80",
    textMuted: "text-[#C9AB81]/60",
    textFaint: "text-[#C9AB81]/40",
    tabInactiveBg: "bg-[#C9AB81]/[0.08]",
    tabInactiveText: "text-[#C9AB81]/50",
    dividerBorder: "border-[#C9AB81]/15",
    popupBg: "bg-[#1a1510]",
    sectionLabel: "text-[#C9AB81]/40",
  },
};
