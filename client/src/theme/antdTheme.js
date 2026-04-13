import { theme as antdTheme } from 'antd';
import { colors, fontFamily, fontSize, lineHeight, radius, space } from './designTokens.js';

/**
 * Maps design tokens to Ant Design v5 theme tokens so components share the same scale.
 */
export function createAppTheme() {
  return {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: colors.colorPrimary,
      borderRadius: radius.sm,

      fontFamily: fontFamily.sans,
      fontSize: fontSize.base,
      fontSizeSM: fontSize.sm,
      fontSizeLG: fontSize.lg,
      fontSizeXL: fontSize.xl,

      fontSizeHeading1: fontSize['4xl'],
      fontSizeHeading2: fontSize['3xl'],
      fontSizeHeading3: fontSize['2xl'],
      fontSizeHeading4: fontSize.xl,
      fontSizeHeading5: fontSize.lg,

      lineHeight: lineHeight.normal,
      lineHeightLG: lineHeight.relaxed,
      lineHeightSM: lineHeight.tight,

      padding: space[4],
      paddingXXS: space[1],
      paddingXS: space[2],
      paddingSM: space[3],
      paddingLG: space[5],
      paddingXL: space[6],

      marginXXS: space[1],
      marginXS: space[2],
      marginSM: space[3],
      margin: space[4],
      marginMD: space[5],
      marginLG: space[6],
      marginXL: space[7],
      marginXXL: space[8],

      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,

      sizeStep: 4,
      sizeUnit: 4,
    },
  };
}
