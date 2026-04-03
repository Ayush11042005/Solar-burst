import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  glowClass?: string;
  tooltip?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, glowClass = 'glow-teal', tooltip }: StatCardProps) {
  return (
    <div className={cn('glass-card p-4 lg:p-5', glowClass)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{title}</span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <Icon className="h-5 w-5 text-primary/60" />
      </div>
      <p className="stat-value text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
