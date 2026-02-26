// EdLight Brand + Design Constants
// Source: EdLight brand guidelines + build specification

export const colors = {
  // Brand
  purple: '#7477B8',
  purpleLight: '#9395CC',
  purpleDark: '#5C5F9A',
  pink: '#F05B94',
  navy: '#33385C',
  gray: '#4D4D4D',
  white: '#FFFFFF',
  background: '#F5F5F5',

  // Heat map cells
  green: '#4CAF50',
  yellow: '#FFC107',
  red: '#F44336',
  grayCell: '#E0E0E0',

  // Cell text
  textOnGreenRed: '#FFFFFF',
  textOnYellowGray: '#33385C',

  // UI
  border: '#E0E0E0',
  cardShadow: '0 1px 3px rgba(0,0,0,0.12)',
};

export const fonts = {
  heading: "'Roboto', sans-serif",
  body: "'Archivo', sans-serif",
};

export const sizing = {
  sidebarWidth: 240,
  headerHeight: 64,
  headerPadding: '16px 24px',
  cellMinWidth: 80,
  cellHeight: 60,
  cellBorderRadius: 4,
  cellPadding: 8,
  cellGap: 4,
  cardBorderRadius: 8,
  cardPadding: 20,
};

// Heat map color thresholds
export function getCellColor(percent, hasEnoughData) {
  if (!hasEnoughData) return colors.grayCell;
  if (percent >= 75) return colors.green;
  if (percent >= 50) return colors.yellow;
  return colors.red;
}

export function getCellTextColor(percent, hasEnoughData) {
  if (!hasEnoughData) return colors.textOnYellowGray;
  if (percent >= 75) return colors.textOnGreenRed; // green
  if (percent >= 50) return colors.textOnYellowGray; // yellow
  return colors.textOnGreenRed; // red
}
