// Design tokens — flat, editorial dashboard look.
// Replaces the old per-component neumorphic inline styles.

export const COLORS = {
  bg: "#F7F5F0",       // page background — paper cream
  surface: "#FFFFFF",  // card background
  surfaceAlt: "#FBF9F5",
  line: "#E7E2D8",     // hairline borders
  ink: "#1C1917",      // primary text
  muted: "#78716C",    // secondary text
  faint: "#B5AFA4",    // tertiary / placeholder text
  accent: "#F97316",   // brand orange — primary data series, live state
  accentSoft: "#FFF1E6",
  teal: "#0D9488",     // secondary data series — used to avoid all-orange charts
  tealSoft: "#E8F6F4",
  danger: "#DC2626",
  dangerSoft: "#FEF2F2",
};

// Flat card — replaces `neuRaised` box-shadow bevels everywhere.
export const cardStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.line}`,
  boxShadow: "0 1px 2px rgba(28,25,23,0.04), 0 10px 30px -14px rgba(28,25,23,0.12)",
};

export const cardStyleAlt = {
  background: COLORS.surfaceAlt,
  border: `1px solid ${COLORS.line}`,
};

export const CATEGORY_COLOR = {
  "Core": { bg: "#EFF6FF", text: "#1D4ED8", chart: "#3B82F6" },
  "Department Elective": { bg: "#F5F3FF", text: "#7C3AED", chart: "#8B5CF6" },
  "Open Elective": { bg: "#ECFDF5", text: "#059669", chart: "#10B981" },
  "Programme Elective": { bg: "#FFFBEB", text: "#B45309", chart: "#F59E0B" },
  "Programme Activity": { bg: "#F5F5F4", text: "#78716C", chart: "#A8A29E" },
  "Specialisation Elective": { bg: "#FDF2F8", text: "#BE185D", chart: "#EC4899" },
};

export const CATEGORY_SHORT = {
  "Programme Elective": "Prog. Elective",
  "Department Elective": "Dept. Elective",
  "Specialisation Elective": "Spec. Elective",
  "Programme Activity": "Activity",
  "Open Elective": "Open Elective",
  "Core": "Core",
};

export function categoryStyle(category) {
  return CATEGORY_COLOR[category] ?? { bg: "#F5F5F4", text: "#78716C", chart: "#A8A29E" };
}