import { useState, useEffect, useCallback } from 'react';
import { WeatherInfo } from '../types';
import { fetchLiveOpenMeteoWeather } from '../services/weatherService';

interface UseOpenMeteoWeatherOptions {
  /** Polling interval in milliseconds. Defaults to 60,000ms (1 minute). */
  refreshIntervalMs?: number;
  /** Whether auto-refresh is enabled. Defaults to true. */
  enabled?: boolean;
}

export function useOpenMeteoWeather(options: UseOpenMeteoWeatherOptions = {}) {
  const { refreshIntervalMs = 60000, enabled = true } = options;

  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    }
    try {
      const data = await fetchLiveOpenMeteoWeather();
      setWeather(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || '날씨 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // Periodic polling directly from Open-Meteo on the client
  useEffect(() => {
    if (!enabled || refreshIntervalMs <= 0) return;

    const intervalId = setInterval(() => {
      loadWeather(false);
    }, refreshIntervalMs);

    return () => clearInterval(intervalId);
  }, [enabled, refreshIntervalMs, loadWeather]);

  const refetch = useCallback(() => {
    return loadWeather(true);
  }, [loadWeather]);

  return {
    weather,
    loading,
    refreshing,
    error,
    refetch
  };
}
