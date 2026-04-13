/**
 * Design system tokens — single source of truth for spacing, type, layout, and radii.
 * Scale: 4px base (0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
 */

/** @type {Record<number, number>} step → px */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
};

/** Typography scale (px) */
export const fontSize = {
  xs: 12,
  sm: 13,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 30,
};

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.625,
};

export const fontFamily = {
  sans: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
  mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
};

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
};

/** Layout constants (px) */
export const layout = {
  contentMaxLg: 1200,
  contentMaxMd: 960,
  headerMinHeight: 56,
  descriptionLabelWidth: 140,
  tableScrollWide: 960,
  tableScrollCompact: 520,
  candidateCellMaxMd: 200,
  candidateCellMaxSm: 140,
};

export const colors = {
  colorPrimary: '#1677ff',
  pageBackground: '#f5f5f5',
  headerInk: '#ffffff',
  headerMutedLink: 'rgba(255, 255, 255, 0.85)',
};

/** Ant Design Row gutter [h, v] */
export const gridGutter = [space[4], space[4]];

/**
 * Returns the pixel value for a spacing step (alias for `space[step]`).
 * @param {keyof typeof space} step
 * @returns {number}
 */
export function px(step) {
  return space[step];
}
