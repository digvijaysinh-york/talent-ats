import { colors, fontWeight, layout, space } from './designTokens.js';

/**
 * Shared app chrome (header, main content shell) built from design tokens.
 */

/** @param {{ isMdUp?: boolean }} opts */
export function appHeaderStyle({ isMdUp = true } = {}) {
  return {
    display: 'flex',
    alignItems: 'center',
    paddingInline: isMdUp ? space[6] : space[4],
    flexWrap: 'wrap',
    height: 'auto',
    minHeight: layout.headerMinHeight,
    gap: space[2],
    paddingBlock: space[3],
  };
}

/**
 * @param {{ isMdUp?: boolean; maxWidth?: number }} opts
 */
export function appContentStyle({ isMdUp = true, maxWidth = layout.contentMaxLg } = {}) {
  if (isMdUp) {
    return {
      padding: space[6],
      maxWidth,
      margin: '0 auto',
      width: '100%',
    };
  }
  return {
    padding: `${space[3]}px ${space[4]}px ${space[6]}px`,
    maxWidth,
    margin: '0 auto',
    width: '100%',
  };
}

/**
 * Detail page main column — slightly tighter horizontal padding on small viewports.
 * @param {{ isMdUp?: boolean; maxWidth?: number }} opts
 */
export function detailContentStyle({ isMdUp = true, maxWidth = layout.contentMaxMd } = {}) {
  const top = space[4];
  const sides = isMdUp ? space[6] : space[3];
  const bottom = space[7];
  return {
    padding: `${top}px ${sides}px ${bottom}px`,
    maxWidth,
    margin: '0 auto',
    width: '100%',
  };
}

export const pageFillStyle = {
  minHeight: '100vh',
};

/** @param {{ withMutedBackground?: boolean }} opts */
export function pageLayoutStyle({ withMutedBackground = false } = {}) {
  return {
    ...pageFillStyle,
    ...(withMutedBackground ? { background: colors.pageBackground } : {}),
  };
}

export const headerTitleStyle = {
  color: colors.headerInk,
  margin: 0,
  flex: 1,
  minWidth: 0,
};

export const headerLinkStyle = {
  color: colors.headerMutedLink,
};

export const descriptionsLabelStyle = {
  fontWeight: fontWeight.semibold,
  width: layout.descriptionLabelWidth,
};
