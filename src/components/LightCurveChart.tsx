import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  Tooltip as RechartsTooltip, ReferenceArea, CartesianGrid, Brush,
} from 'recharts';
import { useSolar } from '@/context/SolarContext';
import { BURST_COLORS, formatFlux, BurstEvent } from '@/lib/solarData';

interface Props {
  compact?: boolean;
  onBurstClick?: (burst: BurstEvent) => void;
}

export function LightCurveChart({ compact, onBurstClick }: Props) {
  const { data, bursts, selectedBurstId } = useSolar();
  const [hoveredBurst, setHoveredBurst] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!data.length) return [];
    const step = compact ? 10 : 3;
    return data.filter((_, i) => i % step === 0).map(d => ({
      time: d.time / 3600,
      flux: d.flux,
      logFlux: Math.log10(d.flux),
      label: d.timestamp.slice(11, 19),
    }));
  }, [data, compact]);

  if (!chartData.length) return <div className="h-64 flex items-center justify-center text-muted-foreground">Loading data...</div>;

  return (
    <div className={compact ? '' : 'glow-border-teal rounded-xl p-3'}>
      <ResponsiveContainer width="100%" height={compact ? 250 : 400}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
          <XAxis
            dataKey="time"
            tickFormatter={v => `${v.toFixed(0)}h`}
            stroke="hsl(215 15% 40%)"
            fontSize={11}
            fontFamily="JetBrains Mono"
          />
          <YAxis
            dataKey="logFlux"
            tickFormatter={v => `10^${v.toFixed(0)}`}
            stroke="hsl(215 15% 40%)"
            fontSize={11}
            fontFamily="JetBrains Mono"
            domain={['auto', 'auto']}
          />
          {bursts.map(burst => (
            <ReferenceArea
              key={burst.id}
              x1={burst.startTime / 3600}
              x2={burst.endTime / 3600}
              fill={BURST_COLORS[burst.burstClass]}
              fillOpacity={burst.id === selectedBurstId ? 0.3 : burst.id === hoveredBurst ? 0.2 : 0.08}
              stroke={BURST_COLORS[burst.burstClass]}
              strokeOpacity={burst.id === selectedBurstId ? 0.8 : 0.3}
              onClick={() => onBurstClick?.(burst)}
              onMouseEnter={() => setHoveredBurst(burst.id)}
              onMouseLeave={() => setHoveredBurst(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}
          <Area
            type="monotone"
            dataKey="logFlux"
            stroke="hsl(168 100% 45%)"
            strokeWidth={1.5}
            fill="url(#tealGradient)"
            dot={false}
            isAnimationActive={false}
          />
          <defs>
            <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(168 100% 45%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(168 100% 45%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <RechartsTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload;
              const burst = bursts.find(b => d.time >= b.startTime / 3600 && d.time <= b.endTime / 3600);
              return (
                <div className="glass-card p-3 text-xs font-mono shadow-xl">
                  <p className="text-foreground">{d.label}</p>
                  <p className="text-primary">{formatFlux(d.flux)} W/m²</p>
                  {burst && (
                    <p style={{ color: BURST_COLORS[burst.burstClass] }}>
                      {burst.subClass} — {(burst.confidence * 100).toFixed(0)}% conf.
                    </p>
                  )}
                </div>
              );
            }}
          />
          {!compact && <Brush dataKey="time" height={25} stroke="hsl(168 100% 45% / 0.3)" fill="hsl(220 25% 8%)" tickFormatter={v => `${v.toFixed(0)}h`} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
