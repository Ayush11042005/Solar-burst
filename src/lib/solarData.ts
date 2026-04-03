// Solar X-ray burst synthetic data generation and detection engine

export interface DataPoint {
  time: number; // seconds from start
  flux: number; // W/m²
  timestamp: string;
}

export interface BurstEvent {
  id: number;
  startTime: number;
  peakTime: number;
  endTime: number;
  startTimestamp: string;
  peakTimestamp: string;
  endTimestamp: string;
  riseTime: number;
  decayTime: number;
  duration: number;
  peakFlux: number;
  baselineFlux: number;
  burstClass: 'A' | 'B' | 'C' | 'M' | 'X';
  subClass: string;
  confidence: number;
  fluence: number;
  halfPowerDuration: number;
}

export type BurstClass = 'A' | 'B' | 'C' | 'M' | 'X';

export const BURST_COLORS: Record<BurstClass, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#00e5c3',
  M: '#f59e0b',
  X: '#ef4444',
};

export const GOES_CLASSES: { class: BurstClass; min: number; max: number; label: string }[] = [
  { class: 'A', min: 0, max: 1e-7, label: '< 10⁻⁷' },
  { class: 'B', min: 1e-7, max: 1e-6, label: '10⁻⁷ – 10⁻⁶' },
  { class: 'C', min: 1e-6, max: 1e-5, label: '10⁻⁶ – 10⁻⁵' },
  { class: 'M', min: 1e-5, max: 1e-4, label: '10⁻⁵ – 10⁻⁴' },
  { class: 'X', min: 1e-4, max: Infinity, label: '> 10⁻⁴' },
];

function classifyFlux(peakFlux: number): { burstClass: BurstClass; subClass: string } {
  if (peakFlux >= 1e-4) {
    const sub = (peakFlux / 1e-4).toFixed(1);
    return { burstClass: 'X', subClass: `X${sub}` };
  }
  if (peakFlux >= 1e-5) {
    const sub = (peakFlux / 1e-5).toFixed(1);
    return { burstClass: 'M', subClass: `M${sub}` };
  }
  if (peakFlux >= 1e-6) {
    const sub = (peakFlux / 1e-6).toFixed(1);
    return { burstClass: 'C', subClass: `C${sub}` };
  }
  if (peakFlux >= 1e-7) {
    const sub = (peakFlux / 1e-7).toFixed(1);
    return { burstClass: 'B', subClass: `B${sub}` };
  }
  const sub = (peakFlux / 1e-8).toFixed(1);
  return { burstClass: 'A', subClass: `A${sub}` };
}

function formatTime(seconds: number, baseDate: Date): string {
  const d = new Date(baseDate.getTime() + seconds * 1000);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export function generateSyntheticData(durationHours = 24, intervalSeconds = 10): {
  data: DataPoint[];
  injectedBursts: { peakTime: number; peakFlux: number; riseTime: number; decayTime: number }[];
} {
  const totalPoints = Math.floor((durationHours * 3600) / intervalSeconds);
  const baseDate = new Date('2024-10-15T00:00:00Z');
  const baselineFlux = 5e-8;
  const data: DataPoint[] = [];
  const injectedBursts: { peakTime: number; peakFlux: number; riseTime: number; decayTime: number }[] = [];

  // Generate burst parameters
  const numBursts = 8 + Math.floor(Math.random() * 7);
  for (let i = 0; i < numBursts; i++) {
    const peakTime = (0.05 + Math.random() * 0.9) * durationHours * 3600;
    const classRoll = Math.random();
    let peakFlux: number;
    if (classRoll < 0.25) peakFlux = baselineFlux * (1.5 + Math.random() * 0.5); // A class
    else if (classRoll < 0.5) peakFlux = 2e-7 + Math.random() * 7e-7; // B
    else if (classRoll < 0.75) peakFlux = 2e-6 + Math.random() * 7e-6; // C
    else if (classRoll < 0.92) peakFlux = 2e-5 + Math.random() * 7e-5; // M
    else peakFlux = 1.5e-4 + Math.random() * 3e-4; // X

    const riseTime = 60 + Math.random() * 300;
    const decayTime = riseTime * (1.5 + Math.random() * 3);
    injectedBursts.push({ peakTime, peakFlux, riseTime, decayTime });
  }

  for (let i = 0; i < totalPoints; i++) {
    const t = i * intervalSeconds;
    let flux = baselineFlux + (Math.random() - 0.5) * baselineFlux * 0.3; // Poisson-like noise

    for (const burst of injectedBursts) {
      const dt = t - burst.peakTime;
      if (dt < -burst.riseTime * 3 || dt > burst.decayTime * 3) continue;
      let burstContrib = 0;
      if (dt <= 0) {
        burstContrib = burst.peakFlux * Math.exp(-0.5 * (dt / burst.riseTime) ** 2);
      } else {
        burstContrib = burst.peakFlux * Math.exp(-0.5 * (dt / burst.decayTime) ** 2);
      }
      flux += burstContrib;
    }

    flux = Math.max(flux, 1e-9);
    data.push({ time: t, flux, timestamp: formatTime(t, baseDate) });
  }

  return { data, injectedBursts };
}

export function detectBursts(
  data: DataPoint[],
  options: {
    threshold: number;
    windowSize: number;
    minDuration: number;
    algorithm: string;
  }
): BurstEvent[] {
  const { threshold, windowSize, minDuration } = options;
  const baseDate = new Date('2024-10-15T00:00:00Z');
  const bursts: BurstEvent[] = [];

  // Compute rolling baseline
  const baseline: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(data.length, i + windowSize);
    let sum = 0, count = 0;
    for (let j = start; j < end; j++) {
      // Use median-like approach: exclude top 20% values
      sum += data[j].flux;
      count++;
    }
    const mean = sum / count;
    // Use 25th percentile approximation
    baseline.push(mean * 0.7);
  }

  let inBurst = false;
  let burstStart = 0;
  let peakIdx = 0;
  let peakFlux = 0;
  let id = 1;

  for (let i = 0; i < data.length; i++) {
    const aboveThreshold = data[i].flux > baseline[i] * threshold;

    if (!inBurst && aboveThreshold) {
      inBurst = true;
      burstStart = i;
      peakIdx = i;
      peakFlux = data[i].flux;
    } else if (inBurst && aboveThreshold) {
      if (data[i].flux > peakFlux) {
        peakFlux = data[i].flux;
        peakIdx = i;
      }
    } else if (inBurst && !aboveThreshold) {
      inBurst = false;
      const duration = data[i].time - data[burstStart].time;
      if (duration >= minDuration) {
        const riseTime = data[peakIdx].time - data[burstStart].time;
        const decayTime = data[i].time - data[peakIdx].time;
        const { burstClass, subClass } = classifyFlux(peakFlux);
        const snr = peakFlux / baseline[peakIdx];
        const confidence = Math.min(0.99, 0.5 + 0.5 * (1 - 1 / snr));
        const fluence = peakFlux * duration * 0.5;

        // Half-power duration
        const halfPower = peakFlux * 0.5;
        let hp1 = burstStart, hp2 = i;
        for (let j = burstStart; j <= peakIdx; j++) {
          if (data[j].flux >= halfPower) { hp1 = j; break; }
        }
        for (let j = i; j >= peakIdx; j--) {
          if (data[j].flux >= halfPower) { hp2 = j; break; }
        }

        bursts.push({
          id: id++,
          startTime: data[burstStart].time,
          peakTime: data[peakIdx].time,
          endTime: data[i].time,
          startTimestamp: formatTime(data[burstStart].time, baseDate),
          peakTimestamp: formatTime(data[peakIdx].time, baseDate),
          endTimestamp: formatTime(data[i].time, baseDate),
          riseTime,
          decayTime,
          duration,
          peakFlux,
          baselineFlux: baseline[peakIdx],
          burstClass,
          subClass,
          confidence,
          fluence,
          halfPowerDuration: data[hp2].time - data[hp1].time,
        });
      }
    }
  }

  return bursts.sort((a, b) => a.startTime - b.startTime);
}

export function getClassDistribution(bursts: BurstEvent[]): Record<BurstClass, number> {
  const dist: Record<BurstClass, number> = { A: 0, B: 0, C: 0, M: 0, X: 0 };
  bursts.forEach(b => dist[b.burstClass]++);
  return dist;
}

export function getPhysicalInterpretation(burst: BurstEvent): string {
  const texts: Record<BurstClass, string> = {
    A: `This ${burst.subClass} flare represents minimal solar activity. A-class flares are the weakest and typically have no significant impact on Earth's ionosphere or communications.`,
    B: `This ${burst.subClass} flare indicates low-level solar activity. B-class flares may cause minor ionospheric disturbances but rarely affect communications or navigation systems.`,
    C: `This ${burst.subClass} flare represents moderate solar activity. C-class flares can cause minor radio signal degradation at polar latitudes and slight ionospheric perturbations.`,
    M: `This ${burst.subClass} flare indicates significant solar activity. M-class flares can cause brief radio blackouts at polar regions, minor radiation storms, and may affect satellite operations and HF communications.`,
    X: `This ${burst.subClass} flare represents extreme solar activity. X-class flares can cause planet-wide radio blackouts, significant radiation storms, and pose risks to astronaut safety, satellite electronics, and power grid infrastructure.`,
  };
  return texts[burst.burstClass];
}

export function formatFlux(flux: number): string {
  if (flux >= 1e-4) return (flux * 1e4).toFixed(2) + '×10⁻⁴';
  if (flux >= 1e-5) return (flux * 1e5).toFixed(2) + '×10⁻⁵';
  if (flux >= 1e-6) return (flux * 1e6).toFixed(2) + '×10⁻⁶';
  if (flux >= 1e-7) return (flux * 1e7).toFixed(2) + '×10⁻⁷';
  return (flux * 1e8).toFixed(2) + '×10⁻⁸';
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}
