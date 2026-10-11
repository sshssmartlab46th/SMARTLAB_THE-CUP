import { useState, useEffect, useCallback } from 'react';

export type FontScale = 'normal' | 'large' | 'xlarge';
export type ColorblindMode = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'high-contrast';

const FONT_SCALE_KEY = 'sangsan_font_scale';
const COLORBLIND_MODE_KEY = 'sangsan_colorblind_mode';

export interface UseAccessibilityReturn {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  colorblindMode: ColorblindMode;
  setColorblindMode: (mode: ColorblindMode) => void;
  resetAccessibility: () => void;
}

export function useAccessibility(): UseAccessibilityReturn {
  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    if (typeof window === 'undefined') return 'normal';
    const saved = localStorage.getItem(FONT_SCALE_KEY) as FontScale | null;
    return saved === 'large' || saved === 'xlarge' ? saved : 'normal';
  });

  const [colorblindMode, setColorblindModeState] = useState<ColorblindMode>(() => {
    if (typeof window === 'undefined') return 'off';
    const saved = localStorage.getItem(COLORBLIND_MODE_KEY) as ColorblindMode | null;
    return saved === 'protanopia' || saved === 'deuteranopia' || saved === 'tritanopia' || saved === 'high-contrast' ? saved : 'off';
  });

  // Apply changes to document element & localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Remove existing font scale & colorblind classes
    root.classList.remove('font-scale-normal', 'font-scale-large', 'font-scale-xlarge');
    root.classList.remove('cb-off', 'cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia', 'cb-high-contrast');

    // Add new classes
    root.classList.add(`font-scale-${fontScale}`);
    root.classList.add(`cb-${colorblindMode}`);

    // Update style root variables if needed
    if (fontScale === 'large') {
      root.style.fontSize = '17.5px';
    } else if (fontScale === 'xlarge') {
      root.style.fontSize = '19px';
    } else {
      root.style.fontSize = '';
    }

    localStorage.setItem(FONT_SCALE_KEY, fontScale);
    localStorage.setItem(COLORBLIND_MODE_KEY, colorblindMode);
  }, [fontScale, colorblindMode]);

  const setFontScale = useCallback((scale: FontScale) => {
    setFontScaleState(scale);
  }, []);

  const setColorblindMode = useCallback((mode: ColorblindMode) => {
    setColorblindModeState(mode);
  }, []);

  const resetAccessibility = useCallback(() => {
    setFontScaleState('normal');
    setColorblindModeState('off');
  }, []);

  return {
    fontScale,
    setFontScale,
    colorblindMode,
    setColorblindMode,
    resetAccessibility,
  };
}
