import { WeatherInfo } from '../types';
import { formatKSTTime } from '../utils/kstTime';

/**
 * Open-Meteo Free Weather API Client
 * Sangsan High School Coordinates:
 * Latitude: 35.8034, Longitude: 127.1183 (전북 전주시 완산구 효자동 상산고등학교)
 */
export const SANGSAN_COORDINATES = {
  name: '상산고등학교',
  location: '전북 전주시 완산구 거마평로 130',
  latitude: 35.8034,
  longitude: 127.1183,
  timezone: 'Asia/Seoul'
};

export const OPEN_METEO_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${SANGSAN_COORDINATES.latitude}&longitude=${SANGSAN_COORDINATES.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,apparent_temperature,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=Asia%2FSeoul&forecast_days=7`;

/**
 * WMO Weather interpretation codes (WW)
 * https://open-meteo.com/en/docs
 */
export function getWmoWeatherDescription(code: number, isDay = true): { text: string; iconName: string } {
  switch (code) {
    case 0:
      return { text: '맑음', iconName: isDay ? 'Sun' : 'Moon' };
    case 1:
      return { text: '대체로 맑음', iconName: isDay ? 'SunMedium' : 'MoonStar' };
    case 2:
      return { text: '구름 조금', iconName: 'CloudSun' };
    case 3:
      return { text: '흐림', iconName: 'Cloud' };
    case 45:
    case 48:
      return { text: '안개', iconName: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { text: '이슬비', iconName: 'CloudDrizzle' };
    case 56:
    case 57:
      return { text: '어는 이슬비', iconName: 'CloudSnow' };
    case 61:
      return { text: '약한 비', iconName: 'CloudRain' };
    case 63:
      return { text: '비', iconName: 'CloudRain' };
    case 65:
      return { text: '강한 비', iconName: 'CloudRain' };
    case 66:
    case 67:
      return { text: '진눈깨비', iconName: 'CloudSnow' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { text: '눈', iconName: 'CloudSnow' };
    case 80:
    case 81:
    case 82:
      return { text: '소나기', iconName: 'CloudLightning' };
    case 85:
    case 86:
      return { text: '소낙눈', iconName: 'CloudSnow' };
    case 95:
      return { text: '뇌우', iconName: 'Zap' };
    case 96:
    case 99:
      return { text: '우박 동반 뇌우', iconName: 'Zap' };
    default:
      return { text: '구름', iconName: 'Cloud' };
  }
}

export function evaluateFestivalOutdoorStatus(
  temp: number,
  precipProb: number,
  precipMm: number,
  windSpeedKmH: number
): { status: 'optimal' | 'warning' | 'alert'; message: string } {
  if (precipMm > 2 || precipProb >= 70) {
    return {
      status: 'alert',
      message: '우천 예상: 야외 종목(축구/계주) 실내 체육관 전환 또는 우천 대기 필요'
    };
  }
  if (precipProb >= 40 || precipMm > 0) {
    return {
      status: 'warning',
      message: '강수 확률 주의: 우천 가능성이 있으니 경기 진행 요원은 천막 및 비품을 점검하세요'
    };
  }
  if (temp >= 32) {
    return {
      status: 'warning',
      message: '고온 주의: 학생 및 선수들은 충분한 수분 섭취와 그늘 휴식을 취하세요'
    };
  }
  if (windSpeedKmH >= 25) {
    return {
      status: 'warning',
      message: '강풍 주의: 학급 응원 천막 및 깃발 지지대를 견고히 고정해주세요'
    };
  }
  return {
    status: 'optimal',
    message: '야외 체육활동 최적: 대운동장 및 농구장 경기 진행에 완벽한 날씨입니다'
  };
}

/**
 * Direct client-side fetcher for Open-Meteo
 */
export async function fetchLiveOpenMeteoWeather(): Promise<WeatherInfo> {
  try {
    const response = await fetch(OPEN_METEO_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Weather HTTP error ${response.status}`);
    }

    const data = await response.json();
    const current = data.current || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    const temp = Math.round(Number(current.temperature_2m || 0));
    const apparentTemp = Math.round(Number(current.apparent_temperature || temp));
    const humidity = Math.round(Number(current.relative_humidity_2m || 0));
    const windSpeed = Math.round(Number(current.wind_speed_10m || 0));
    const windDirection = Math.round(Number(current.wind_direction_10m || 0));
    const uvIndexValue = typeof current.uv_index === 'number' ? Math.round(current.uv_index * 10) / 10 : 0;
    const weatherCode = Number(current.weather_code ?? 0);
    const isDay = current.is_day === 1;
    const precipMm = Number(current.precipitation || 0);

    // Calculate precipitation probability from hourly forecast for current time
    let rainProb = 0;
    let currentHourIndex = 0;
    if (hourly && Array.isArray(hourly.time)) {
      const nowIso = new Date().toISOString();
      // Format to match "YYYY-MM-DDTHH"
      const nowHourPrefix = `${nowIso.slice(0, 10)}T${nowIso.slice(11, 13)}`;
      const idx = hourly.time.findIndex((t: string) => t.startsWith(nowHourPrefix));
      if (idx !== -1) {
        currentHourIndex = idx;
        if (Array.isArray(hourly.precipitation_probability)) {
          rainProb = Math.round(Number(hourly.precipitation_probability[idx] || 0));
        }
      } else if (Array.isArray(hourly.precipitation_probability)) {
        rainProb = Math.round(Number(hourly.precipitation_probability[0] || 0));
      }
    }

    const desc = getWmoWeatherDescription(weatherCode, isDay);
    const assessment = evaluateFestivalOutdoorStatus(temp, rainProb, precipMm, windSpeed);

    // Parse Hourly Forecast (Next 24 hours from current index)
    const hourlyForecast = [];
    if (hourly && Array.isArray(hourly.time)) {
      const startIdx = Math.max(0, currentHourIndex);
      const endIdx = Math.min(hourly.time.length, startIdx + 24);
      for (let i = startIdx; i < endIdx; i++) {
        const timeStr = hourly.time[i];
        const hourPart = timeStr.split('T')[1] || '';
        const hourNum = parseInt(hourPart.split(':')[0], 10) || 0;
        const hCode = Number(hourly.weather_code?.[i] ?? 0);
        const hIsDay = hourNum >= 6 && hourNum < 19;
        const hDesc = getWmoWeatherDescription(hCode, hIsDay);

        hourlyForecast.push({
          time: timeStr,
          hourLabel: `${hourNum}시`,
          temp: Math.round(Number(hourly.temperature_2m?.[i] || 0)),
          apparentTemp: Math.round(Number(hourly.apparent_temperature?.[i] || hourly.temperature_2m?.[i] || 0)),
          rainProb: Math.round(Number(hourly.precipitation_probability?.[i] || 0)),
          precipMm: Math.round(Number(hourly.precipitation?.[i] || 0) * 10) / 10,
          weatherCode: hCode,
          condition: hDesc.text,
          isDay: hIsDay,
          windSpeed: Math.round(Number(hourly.wind_speed_10m?.[i] || 0)),
          uvIndex: typeof hourly.uv_index?.[i] === 'number' ? Math.round(hourly.uv_index[i] * 10) / 10 : 0
        });
      }
    }

    // Parse Daily Forecast (7 days)
    const dailyForecast = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    if (daily && Array.isArray(daily.time)) {
      for (let i = 0; i < daily.time.length; i++) {
        const dDate = daily.time[i];
        const dateObj = new Date(dDate);
        let dayName = dayNames[dateObj.getDay()];
        if (i === 0) dayName = '오늘';
        else if (i === 1) dayName = '내일';

        const dCode = Number(daily.weather_code?.[i] ?? 0);
        const dDesc = getWmoWeatherDescription(dCode, true);

        const sunriseStr = daily.sunrise?.[i]?.split('T')[1] || '';
        const sunsetStr = daily.sunset?.[i]?.split('T')[1] || '';

        dailyForecast.push({
          date: dDate,
          dayName,
          tempMax: Math.round(Number(daily.temperature_2m_max?.[i] || 0)),
          tempMin: Math.round(Number(daily.temperature_2m_min?.[i] || 0)),
          apparentTempMax: Math.round(Number(daily.apparent_temperature_max?.[i] || 0)),
          rainProbMax: Math.round(Number(daily.precipitation_probability_max?.[i] || 0)),
          precipSum: Math.round(Number(daily.precipitation_sum?.[i] || 0) * 10) / 10,
          weatherCode: dCode,
          condition: dDesc.text,
          windSpeedMax: Math.round(Number(daily.wind_speed_10m_max?.[i] || 0)),
          uvIndexMax: typeof daily.uv_index_max?.[i] === 'number' ? Math.round(daily.uv_index_max[i] * 10) / 10 : 0,
          sunrise: sunriseStr,
          sunset: sunsetStr
        });
      }
    }

    const now = new Date();
    const lastUpdated = formatKSTTime(now);

    let uvText = '낮음';
    if (uvIndexValue >= 8) uvText = '매우 높음';
    else if (uvIndexValue >= 6) uvText = '높음';
    else if (uvIndexValue >= 3) uvText = '보통';
    else if (uvIndexValue > 0) uvText = '낮음';
    else uvText = '없음';

    return {
      temperature: temp,
      temp,
      condition: desc.text,
      precipitation: `${rainProb}%`,
      rainProb,
      apparentTemp,
      humidity,
      windSpeed,
      windDirection,
      weatherCode,
      isDay,
      statusText: assessment.message,
      lastUpdated,
      uvIndex: uvText,
      uvIndexValue,
      sunrise: dailyForecast[0]?.sunrise,
      sunset: dailyForecast[0]?.sunset,
      hourlyForecast,
      dailyForecast
    };
  } catch (error) {
    console.warn('[Weather] Direct fetch failed, using fallback:', error);
    return {
      temperature: 22,
      temp: 22,
      condition: '맑음',
      precipitation: '10%',
      rainProb: 10,
      apparentTemp: 22,
      humidity: 55,
      windSpeed: 8,
      windDirection: 180,
      weatherCode: 0,
      isDay: true,
      statusText: '야외 체육활동 최적: 대운동장 및 농구장 경기 진행에 완벽한 날씨입니다',
      lastUpdated: formatKSTTime(new Date()),
      uvIndex: '보통',
      uvIndexValue: 4.2
    };
  }
}
