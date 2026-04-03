import { useSolar } from '@/context/SolarContext';
import { BurstBadge } from './BurstBadge';
import { formatFlux } from '@/lib/solarData';
import { cn } from '@/lib/utils';

export function RecentDetections() {
  const { bursts, selectedBurstId, selectBurst } = useSolar();
  const sorted = [...bursts].sort((a, b) => b.peakFlux - a.peakFlux).slice(0, 15);

  return (
    <div className="glass-card p-4 h-full overflow-hidden">
      <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Recent Detections</h3>
      <div className="space-y-2 overflow-y-auto max-h-[calc(100%-2rem)]">
        {sorted.map(b => (
          <button
            key={b.id}
            onClick={() => selectBurst(b.id === selectedBurstId ? null : b.id)}
            className={cn(
              'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all',
              b.id === selectedBurstId ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30'
            )}
          >
            <BurstBadge burstClass={b.burstClass} subClass={b.subClass} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-foreground truncate">{formatFlux(b.peakFlux)} W/m²</p>
              <p className="text-xs text-muted-foreground truncate">{b.peakTimestamp.slice(11, 19)}</p>
            </div>
          </button>
        ))}
        {sorted.length === 0 && <p className="text-xs text-muted-foreground">No bursts detected</p>}
      </div>
    </div>
  );
}
