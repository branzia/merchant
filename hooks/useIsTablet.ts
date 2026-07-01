import { useWindowDimensions } from 'react-native';

export function useLayout() {
  const { width } = useWindowDimensions();
  return {
    isPhone: width < 600,
    isTablet: width >= 600 && width < 1000,
    isDesktop: width >= 1000,
    width,
  };
}

export function useIsTablet(): boolean {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= 600;
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  return {
    width,
    height,
    isTablet,
    isPhone: !isTablet,
    // Scale font size up modestly on tablet (max 15% increase)
    fs: (size: number) => isTablet ? Math.round(size * 1.15) : size,
    // Centered max-width container for tablet content areas
    container: isTablet
      ? { maxWidth: 860, alignSelf: 'center' as const, width: '100%' as const }
      : {} as object,
    // Column count helper
    numCols: (phone: number, tablet: number) => (isTablet ? tablet : phone),
    // Per-item width for a flex-wrap grid
    colWidth: (cols: number, gap: number, pad: number) =>
      (width - pad * 2 - gap * (cols - 1)) / cols,
  };
}
