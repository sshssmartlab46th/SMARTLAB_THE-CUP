import React, { useEffect, useRef } from 'react';
import { WeatherInfo } from '../../types';

export type WeatherEffectType = 'auto' | 'snow' | 'rain' | 'fog' | 'sun' | 'clouds' | 'none';

export interface WeatherAtmosphereOverlayProps {
  weather?: WeatherInfo | null;
  manualEffect?: WeatherEffectType;
  enabled?: boolean;
}

export const WeatherAtmosphereOverlay: React.FC<WeatherAtmosphereOverlayProps> = ({
  weather,
  manualEffect = 'auto',
  enabled = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine active visual weather effect automatically from live weather
  const activeEffect: 'snow' | 'rain' | 'fog' | 'sun' | 'clouds' | 'none' = React.useMemo(() => {
    if (!enabled) return 'none';
    if (manualEffect && manualEffect !== 'auto') return manualEffect;
    if (!weather) return 'none';

    const code = weather.weatherCode ?? 0;
    const cond = weather.condition || '';

    // Snow check: WMO 71~77, 85~86 or condition text
    if ([71, 73, 75, 77, 85, 86].includes(code) || cond.includes('눈') || cond.includes('진눈깨비') || cond.includes('우박')) {
      return 'snow';
    }

    // Rain check: WMO 51~67, 80~82, 95~99 or condition text
    if (
      [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code) ||
      cond.includes('비') ||
      cond.includes('소나기') ||
      cond.includes('뇌우') ||
      cond.includes('이슬비')
    ) {
      return 'rain';
    }

    // Fog check: WMO 45, 48 or condition text
    if ([45, 48].includes(code) || cond.includes('안개') || cond.includes('박무') || cond.includes('연무')) {
      return 'fog';
    }

    // Sun / Clear check: WMO 0, 1 or condition text
    if ([0, 1].includes(code) || cond.includes('맑음') || cond.includes('화창')) {
      return 'sun';
    }

    // Clouds / Overcast: WMO 2, 3 or condition text
    if ([2, 3].includes(code) || cond.includes('구름') || cond.includes('흐림')) {
      return 'clouds';
    }

    return 'none';
  }, [weather, manualEffect, enabled]);

  // Compute live weather intensity for proportional particle physics
  const weatherIntensity = React.useMemo(() => {
    if (!weather) return { rain: 0.6, snow: 0.6, wind: 8, isDay: true };

    const precipVal = typeof weather.precipitation === 'number'
      ? weather.precipitation
      : parseFloat(String(weather.precipitation || '0').replace(/[^0-9.]/g, '')) || 0;

    const rainProb = weather.rainProb ?? 0;
    const windSpeed = weather.windSpeed ?? 8;
    const code = weather.weatherCode ?? 0;
    const isDay = weather.isDay !== false;

    // Rain intensity scale (0.25 = light drizzle, 1.0 = moderate rain, 2.0 = heavy downpour)
    let rain = 0.6;
    if (precipVal > 0) {
      rain = Math.max(0.25, Math.min(2.2, precipVal * 0.45 + 0.2));
    } else if ([65, 82, 95, 96, 99].includes(code)) {
      rain = 1.6;
    } else if ([63, 81].includes(code)) {
      rain = 1.1;
    } else if ([61, 80].includes(code)) {
      rain = 0.75;
    } else if ([51, 53, 55, 56, 57].includes(code)) {
      rain = 0.35;
    } else if (rainProb > 0) {
      rain = Math.max(0.3, Math.min(1.3, rainProb / 75));
    }

    // Snow intensity scale (0.3 = light flurries, 0.8 = moderate snow, 1.8 = heavy snow)
    let snow = 0.6;
    if (precipVal > 0) {
      snow = Math.max(0.3, Math.min(2.0, precipVal * 0.5 + 0.3));
    } else if ([75, 86].includes(code)) {
      snow = 1.6;
    } else if ([73].includes(code)) {
      snow = 0.95;
    } else if ([71, 77, 85].includes(code)) {
      snow = 0.4;
    }

    return { rain, snow, wind: windSpeed, isDay };
  }, [weather]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeEffect === 'none') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // PARTICLE POOLS & SIMULATION STATE
    // -------------------------------------------------------------

    // 1. Rain drops & ground splashes
    interface RainDrop {
      x: number;
      y: number;
      length: number;
      speedY: number;
      speedX: number;
      opacity: number;
      width: number;
    }
    interface RainSplash {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      opacity: number;
    }
    const rainDrops: RainDrop[] = [];
    const rainSplashes: RainSplash[] = [];

    // 2. Snow particles
    interface SnowFlake {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      opacity: number;
      sway: number;
      swaySpeed: number;
    }
    const snowFlakes: SnowFlake[] = [];

    // 3. Sunbeams & shimmering sunlight motes (Style 1: Natural Warm Sunlight & Cinematic Lens Flares)
    interface SunFlareCircle {
      distRatio: number; // along sun-to-center axis (0 = sun, 1 = center, 1.5 = opposite)
      radius: number;
      r: number;
      g: number;
      b: number;
      baseAlpha: number;
      isRing?: boolean;
    }
    const sunFlares: SunFlareCircle[] = [
      { distRatio: 0.22, radius: 24, r: 254, g: 240, b: 138, baseAlpha: 0.14, isRing: false },
      { distRatio: 0.38, radius: 42, r: 251, g: 191, b: 36, baseAlpha: 0.08, isRing: true },
      { distRatio: 0.58, radius: 18, r: 253, g: 230, b: 138, baseAlpha: 0.16, isRing: false },
      { distRatio: 0.78, radius: 65, r: 254, g: 215, b: 170, baseAlpha: 0.06, isRing: false },
      { distRatio: 1.05, radius: 32, r: 252, g: 211, b: 77, baseAlpha: 0.09, isRing: false },
      { distRatio: 1.25, radius: 88, r: 254, g: 243, b: 199, baseAlpha: 0.04, isRing: true }
    ];

    interface SunMote {
      x: number;
      y: number;
      radius: number;
      speedX: number;
      speedY: number;
      alpha: number;
      phase: number;
    }
    const sunMotes: SunMote[] = [];

    // 4. Fog horizontal wave layers & creeping mist
    interface FogMistBlob {
      x: number;
      y: number;
      radiusX: number;
      radiusY: number;
      speedX: number;
      opacity: number;
    }
    const fogBlobs: FogMistBlob[] = [];

    // 5. Distinct Cumulus Cloud clusters
    interface CloudPuff {
      offsetX: number;
      offsetY: number;
      radius: number;
    }
    interface CloudCluster {
      x: number;
      y: number;
      speedX: number;
      scale: number;
      opacity: number;
      puffs: CloudPuff[];
    }
    const cloudClusters: CloudCluster[] = [];

    // -------------------------------------------------------------
    // INITIALIZATION ACCORDING TO REAL-TIME INTENSITY
    // -------------------------------------------------------------
    const { rain: rIntensity, snow: sIntensity, wind, isDay } = weatherIntensity;

    if (activeEffect === 'rain') {
      // Drop count proportional to live rain intensity
      const baseDropCount = Math.floor(Math.min(220, Math.max(35, (width / 14) * rIntensity)));
      for (let i = 0; i < baseDropCount; i++) {
        const fallSpeed = (9 + rIntensity * 12) * (0.8 + Math.random() * 0.4);
        const windSlant = -(wind * 0.14 + 1.2);
        const dropLength = (12 + rIntensity * 18) * (0.75 + Math.random() * 0.5);
        rainDrops.push({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * height,
          length: dropLength,
          speedY: fallSpeed,
          speedX: windSlant,
          opacity: Math.random() * 0.35 + (0.3 + Math.min(0.35, rIntensity * 0.2)),
          width: rIntensity > 1.2 ? 1.5 : 1.1
        });
      }
    } else if (activeEffect === 'snow') {
      // Flake count proportional to live snow intensity
      const baseFlakeCount = Math.floor(Math.min(180, Math.max(35, (width / 18) * sIntensity)));
      for (let i = 0; i < baseFlakeCount; i++) {
        const sizeRand = Math.random();
        // Varied snowflake sizes: fine crystal (1.2~2.2px) vs large fluffy flake (3~5.5px)
        const radius = sizeRand > 0.85 ? Math.random() * 2.2 + 3.2 : Math.random() * 1.5 + 1.2;
        const fallSpeed = (0.7 + sIntensity * 1.4) * (0.65 + Math.random() * 0.7);
        const windDrift = (wind * 0.04 + 0.1) * (Math.random() * 0.8 + 0.6);
        snowFlakes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          speedY: fallSpeed,
          speedX: windDrift,
          opacity: Math.random() * 0.45 + 0.4,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.02 + 0.015
        });
      }
    } else if (activeEffect === 'sun') {
      // 24 soft golden sparkling sunlight motes floating gently in the sunlit air
      for (let i = 0; i < 24; i++) {
        sunMotes.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.75),
          radius: Math.random() * 1.5 + 0.8,
          speedX: -(Math.random() * 0.25 + 0.05),
          speedY: Math.random() * 0.35 + 0.1,
          alpha: Math.random() * 0.4 + 0.2,
          phase: Math.random() * Math.PI * 2
        });
      }
    } else if (activeEffect === 'fog') {
      // 18 layered mist blobs drifting at various heights
      const blobCount = 18;
      for (let i = 0; i < blobCount; i++) {
        fogBlobs.push({
          x: (i / blobCount) * (width + 300) - 150,
          y: height * 0.35 + Math.random() * (height * 0.65),
          radiusX: Math.random() * 220 + 160,
          radiusY: Math.random() * 90 + 60,
          speedX: Math.random() * 0.35 + 0.12,
          opacity: Math.random() * 0.07 + 0.04
        });
      }
    } else if (activeEffect === 'clouds') {
      // 5 distinct cumulus cloud clusters drifting across the upper 35% of the screen
      const clusterCount = Math.max(4, Math.min(6, Math.floor(width / 320)));
      for (let i = 0; i < clusterCount; i++) {
        const puffs: CloudPuff[] = [];
        // Generate realistic cumulus puff clusters
        const puffCount = Math.floor(Math.random() * 3) + 5;
        puffs.push({ offsetX: 0, offsetY: 0, radius: 45 + Math.random() * 15 });
        for (let p = 1; p < puffCount; p++) {
          puffs.push({
            offsetX: (Math.random() * 120 - 60),
            offsetY: (Math.random() * 30 - 15),
            radius: 30 + Math.random() * 28
          });
        }
        cloudClusters.push({
          x: (i / clusterCount) * (width + 400) - 200,
          y: Math.random() * (height * 0.28) + 40,
          speedX: Math.random() * 0.22 + 0.1,
          scale: Math.random() * 0.4 + 0.85,
          opacity: Math.random() * 0.12 + 0.12,
          puffs
        });
      }
    }

    let tick = 0;

    // -------------------------------------------------------------
    // RENDER LOOP
    // -------------------------------------------------------------
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick++;

      // ===========================================================
      // 1. RAIN RENDERING (Proportional to precipitation & wind)
      // ===========================================================
      if (activeEffect === 'rain') {
        // Draw rain streaks
        for (const drop of rainDrops) {
          drop.y += drop.speedY;
          drop.x += drop.speedX;

          // When drop hits ground
          if (drop.y > height - 10) {
            // Spawn subtle splash ripple on ground
            if (rainSplashes.length < 35 && Math.random() < 0.45) {
              rainSplashes.push({
                x: drop.x,
                y: height - Math.random() * 15,
                radius: 1,
                maxRadius: Math.random() * 6 + (3 + rIntensity * 3),
                opacity: 0.5
              });
            }
            drop.y = -drop.length - Math.random() * 30;
            drop.x = Math.random() * (width + 200) - 100;
          }

          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + drop.speedX * 1.8, drop.y + drop.length);
          ctx.strokeStyle = `rgba(175, 215, 255, ${drop.opacity})`;
          ctx.lineWidth = drop.width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Draw ground splashes & ripples
        for (let s = rainSplashes.length - 1; s >= 0; s--) {
          const splash = rainSplashes[s];
          splash.radius += 0.4 + rIntensity * 0.2;
          splash.opacity -= 0.035;

          if (splash.opacity <= 0 || splash.radius >= splash.maxRadius) {
            rainSplashes.splice(s, 1);
            continue;
          }

          ctx.beginPath();
          ctx.ellipse(splash.x, splash.y, splash.radius * 1.8, splash.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(190, 225, 255, ${splash.opacity * 0.6})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }

        // Ambient mist wash for heavy rain
        if (rIntensity > 0.8) {
          const mistGrad = ctx.createLinearGradient(0, height - 120, 0, height);
          mistGrad.addColorStop(0, 'rgba(180, 205, 230, 0)');
          mistGrad.addColorStop(1, `rgba(180, 205, 230, ${Math.min(0.12, (rIntensity - 0.7) * 0.1)})`);
          ctx.fillStyle = mistGrad;
          ctx.fillRect(0, height - 120, width, 120);
        }
      }

      // ===========================================================
      // 2. SNOW RENDERING (Proportional to snowfall & wind)
      // ===========================================================
      else if (activeEffect === 'snow') {
        for (const flake of snowFlakes) {
          flake.y += flake.speedY;
          flake.sway += flake.swaySpeed;
          flake.x += flake.speedX + Math.sin(flake.sway) * (0.6 + sIntensity * 0.4);

          // Wrap-around boundaries
          if (flake.y > height + 10) {
            flake.y = -10;
            flake.x = Math.random() * width;
          }
          if (flake.x > width + 20) flake.x = -15;
          if (flake.x < -20) flake.x = width + 15;

          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);

          // Soft frosted radial gradient for large flakes
          if (flake.radius > 2.5) {
            const radGrad = ctx.createRadialGradient(flake.x, flake.y, 0, flake.x, flake.y, flake.radius);
            radGrad.addColorStop(0, `rgba(255, 255, 255, ${flake.opacity})`);
            radGrad.addColorStop(0.7, `rgba(240, 248, 255, ${flake.opacity * 0.8})`);
            radGrad.addColorStop(1, 'rgba(235, 245, 255, 0)');
            ctx.fillStyle = radGrad;
          } else {
            ctx.fillStyle = `rgba(245, 250, 255, ${flake.opacity})`;
          }
          ctx.fill();
        }
      }

      // ===========================================================
      // 3. SUN / CLEAR RENDERING (Style 1: Natural Warm Sunlight & Cinematic Lens Flares)
      // ===========================================================
      else if (activeEffect === 'sun') {
        if (isDay) {
          // Sun positioned naturally near top-right corner
          const sunX = Math.min(width - 50, width * 0.88);
          const sunY = 45;
          const pulse = Math.sin(tick * 0.015) * 0.03;

          // A. Soft, Expansive Atmospheric Warm Sky Bloom
          const skyGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, Math.min(width, 520));
          skyGlow.addColorStop(0, `rgba(255, 248, 220, ${0.32 + pulse})`);
          skyGlow.addColorStop(0.2, `rgba(254, 230, 138, ${0.18 + pulse})`);
          skyGlow.addColorStop(0.5, `rgba(251, 191, 36, ${0.06 + pulse * 0.5})`);
          skyGlow.addColorStop(0.8, 'rgba(253, 230, 138, 0.015)');
          skyGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = skyGlow;
          ctx.beginPath();
          ctx.arc(sunX, sunY, Math.min(width, 520), 0, Math.PI * 2);
          ctx.fill();

          // B. Silky Soft Sun Corona (Natural, feather-soft sun center without harsh edge lines)
          const coronaGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 110);
          coronaGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
          coronaGrad.addColorStop(0.2, 'rgba(255, 250, 210, 0.75)');
          coronaGrad.addColorStop(0.55, 'rgba(254, 225, 105, 0.28)');
          coronaGrad.addColorStop(0.85, 'rgba(251, 191, 36, 0.08)');
          coronaGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = coronaGrad;
          ctx.beginPath();
          ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
          ctx.fill();

          // C. Cinematic Lens Flare Discs & Bokeh Rings along the optical axis
          // Optical vector from sun towards viewport center
          const screenCenterX = width * 0.45;
          const screenCenterY = height * 0.55;
          const vecX = screenCenterX - sunX;
          const vecY = screenCenterY - sunY;

          for (const flare of sunFlares) {
            const fx = sunX + vecX * flare.distRatio;
            const fy = sunY + vecY * flare.distRatio;
            const flarePulse = flare.baseAlpha + Math.sin(tick * 0.02 + flare.distRatio * 3) * (flare.baseAlpha * 0.25);

            ctx.beginPath();
            ctx.arc(fx, fy, flare.radius, 0, Math.PI * 2);

            if (flare.isRing) {
              ctx.strokeStyle = `rgba(${flare.r}, ${flare.g}, ${flare.b}, ${flarePulse})`;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            } else {
              const fGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, flare.radius);
              fGrad.addColorStop(0, `rgba(${flare.r}, ${flare.g}, ${flare.b}, ${flarePulse * 1.5})`);
              fGrad.addColorStop(0.7, `rgba(${flare.r}, ${flare.g}, ${flare.b}, ${flarePulse * 0.7})`);
              fGrad.addColorStop(1, `rgba(${flare.r}, ${flare.g}, ${flare.b}, 0)`);
              ctx.fillStyle = fGrad;
              ctx.fill();
            }
          }

          // D. Floating Golden Sunlight Motes / Ambient Shimmering Dust
          for (const mote of sunMotes) {
            mote.y += mote.speedY;
            mote.x += mote.speedX;
            mote.phase += 0.035;

            if (mote.y > height * 0.85) {
              mote.y = 0;
              mote.x = Math.random() * width;
            }
            if (mote.x < 0) mote.x = width;

            const twinkle = Math.sin(mote.phase) * 0.35 + 0.65;
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(252, 211, 77, ${mote.alpha * twinkle})`;
            ctx.fill();
          }
        }
      }

      // ===========================================================
      // 4. FOG RENDERING (Dense Horizontal Billowing Mist & Ground Fog)
      // ===========================================================
      else if (activeEffect === 'fog') {
        // A. Full-screen Atmospheric Soft Contrast Hazing
        ctx.fillStyle = 'rgba(226, 232, 240, 0.16)';
        ctx.fillRect(0, 0, width, height);

        // B. 4 Continuous Undulating Horizontal Fog Waves at different heights
        const waveLevels = [
          { y: height * 0.35, amp: 22, freq: 0.003, speed: 0.015, alpha: 0.09 },
          { y: height * 0.55, amp: 28, freq: 0.0025, speed: 0.018, alpha: 0.12 },
          { y: height * 0.75, amp: 35, freq: 0.002, speed: 0.012, alpha: 0.15 },
          { y: height * 0.90, amp: 40, freq: 0.0018, speed: 0.01, alpha: 0.22 } // Deep ground fog
        ];

        for (const w of waveLevels) {
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 15) {
            const waveY = w.y + Math.sin(x * w.freq + tick * w.speed) * w.amp;
            ctx.lineTo(x, waveY);
          }
          ctx.lineTo(width, height);
          ctx.closePath();

          const waveGrad = ctx.createLinearGradient(0, w.y - w.amp, 0, height);
          waveGrad.addColorStop(0, `rgba(220, 230, 242, ${w.alpha * 0.2})`);
          waveGrad.addColorStop(0.5, `rgba(225, 235, 245, ${w.alpha * 0.8})`);
          waveGrad.addColorStop(1, `rgba(230, 238, 248, ${w.alpha})`);
          ctx.fillStyle = waveGrad;
          ctx.fill();
        }

        // C. Drifting Elliptical Mist Blobs
        for (const blob of fogBlobs) {
          blob.x += blob.speedX;
          if (blob.x - blob.radiusX > width) {
            blob.x = -blob.radiusX;
          }

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(blob.x, blob.y, blob.radiusX, blob.radiusY, 0, 0, Math.PI * 2);
          const blobGrad = ctx.createRadialGradient(blob.x, blob.y, 10, blob.x, blob.y, blob.radiusX);
          blobGrad.addColorStop(0, `rgba(220, 230, 242, ${blob.opacity * 1.6})`);
          blobGrad.addColorStop(0.6, `rgba(220, 230, 242, ${blob.opacity * 0.8})`);
          blobGrad.addColorStop(1, 'rgba(220, 230, 242, 0)');
          ctx.fillStyle = blobGrad;
          ctx.fill();
          ctx.restore();
        }
      }

      // ===========================================================
      // 5. CLOUDS RENDERING (Fluffy Sculpted Cumulus Formations in Sky)
      // ===========================================================
      else if (activeEffect === 'clouds') {
        // A. Subtle top overcast sky tint
        const topSkyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.4);
        topSkyGrad.addColorStop(0, 'rgba(203, 213, 225, 0.20)');
        topSkyGrad.addColorStop(0.6, 'rgba(226, 232, 240, 0.08)');
        topSkyGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = topSkyGrad;
        ctx.fillRect(0, 0, width, height * 0.4);

        // B. Realistic Cumulus Cloud Clusters Drifting Horizontally
        for (const cloud of cloudClusters) {
          cloud.x += cloud.speedX;
          // Loop seamless
          if (cloud.x - 250 > width) {
            cloud.x = -250;
            cloud.y = Math.random() * (height * 0.28) + 35;
          }

          ctx.save();
          ctx.translate(cloud.x, cloud.y);
          ctx.scale(cloud.scale, cloud.scale);

          // Draw each puff in the cloud cluster with volume shading
          for (const puff of cloud.puffs) {
            ctx.beginPath();
            ctx.arc(puff.offsetX, puff.offsetY, puff.radius, 0, Math.PI * 2);

            // Volume gradient: brighter silvery white at top, shaded slate-gray at bottom underside
            const puffGrad = ctx.createLinearGradient(
              puff.offsetX,
              puff.offsetY - puff.radius,
              puff.offsetX,
              puff.offsetY + puff.radius
            );
            puffGrad.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity * 1.6})`);
            puffGrad.addColorStop(0.6, `rgba(241, 245, 249, ${cloud.opacity * 1.2})`);
            puffGrad.addColorStop(1, `rgba(148, 163, 184, ${cloud.opacity * 0.6})`); // Shaded base
            ctx.fillStyle = puffGrad;
            ctx.fill();
          }

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeEffect, weatherIntensity]);

  if (!enabled || activeEffect === 'none') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-20 transition-opacity duration-700"
      style={{
        width: '100vw',
        height: '100vh'
      }}
    />
  );
};
