// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccessibility } from './useAccessibility';

describe('useAccessibility hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';
  });

  it('should initialize with default values when localStorage is empty', () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.fontScale).toBe('normal');
    expect(result.current.colorblindMode).toBe('off');
    expect(document.documentElement.classList.contains('font-scale-normal')).toBe(true);
    expect(document.documentElement.classList.contains('cb-off')).toBe(true);
  });

  it('should restore saved values from localStorage on mount including deuteranopia', () => {
    localStorage.setItem('sangsan_font_scale', 'large');
    localStorage.setItem('sangsan_colorblind_mode', 'deuteranopia');

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.fontScale).toBe('large');
    expect(result.current.colorblindMode).toBe('deuteranopia');
    expect(document.documentElement.classList.contains('font-scale-large')).toBe(true);
    expect(document.documentElement.classList.contains('cb-deuteranopia')).toBe(true);
    expect(document.documentElement.style.fontSize).toBe('17.5px');
  });

  it('should update font scale and document root classes/styles when setFontScale is called', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.setFontScale('xlarge');
    });

    expect(result.current.fontScale).toBe('xlarge');
    expect(localStorage.getItem('sangsan_font_scale')).toBe('xlarge');
    expect(document.documentElement.classList.contains('font-scale-xlarge')).toBe(true);
    expect(document.documentElement.style.fontSize).toBe('19px');

    act(() => {
      result.current.setFontScale('normal');
    });

    expect(result.current.fontScale).toBe('normal');
    expect(document.documentElement.classList.contains('font-scale-normal')).toBe(true);
    expect(document.documentElement.style.fontSize).toBe('');
  });

  it('should update colorblind mode and document root classes when setColorblindMode is called', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.setColorblindMode('deuteranopia');
    });

    expect(result.current.colorblindMode).toBe('deuteranopia');
    expect(localStorage.getItem('sangsan_colorblind_mode')).toBe('deuteranopia');
    expect(document.documentElement.classList.contains('cb-deuteranopia')).toBe(true);

    act(() => {
      result.current.setColorblindMode('tritanopia');
    });

    expect(result.current.colorblindMode).toBe('tritanopia');
    expect(localStorage.getItem('sangsan_colorblind_mode')).toBe('tritanopia');
    expect(document.documentElement.classList.contains('cb-tritanopia')).toBe(true);

    act(() => {
      result.current.setColorblindMode('high-contrast');
    });

    expect(result.current.colorblindMode).toBe('high-contrast');
    expect(document.documentElement.classList.contains('cb-high-contrast')).toBe(true);
  });

  it('should reset accessibility settings when resetAccessibility is called', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.setFontScale('xlarge');
      result.current.setColorblindMode('protanopia');
    });

    expect(result.current.fontScale).toBe('xlarge');
    expect(result.current.colorblindMode).toBe('protanopia');

    act(() => {
      result.current.resetAccessibility();
    });

    expect(result.current.fontScale).toBe('normal');
    expect(result.current.colorblindMode).toBe('off');
    expect(document.documentElement.classList.contains('font-scale-normal')).toBe(true);
    expect(document.documentElement.classList.contains('cb-off')).toBe(true);
  });
});
