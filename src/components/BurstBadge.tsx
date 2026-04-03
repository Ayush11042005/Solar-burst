import { BurstClass, BURST_COLORS } from '@/lib/solarData';
import { cn } from '@/lib/utils';

export function BurstBadge({ burstClass, subClass, size = 'sm' }: { burstClass: BurstClass; subClass?: string; size?: 'sm' | 'lg' }) {
  const color = BURST_COLORS[burstClass];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-mono font-bold border',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-4 py-1.5 text-lg'
      )}
      style={{
        color,
        borderColor: color + '40',
        backgroundColor: color + '15',
        boxShadow: size === 'lg' ? `0 0 20px ${color}30` : undefined,
      }}
    >
      {subClass || burstClass}
    </span>
  );
}
