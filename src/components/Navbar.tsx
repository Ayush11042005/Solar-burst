import { Link, useLocation } from 'react-router-dom';
import { Activity, BarChart3, Upload, Clock, Settings, Sun } from 'lucide-react';
import { useSolar } from '@/context/SolarContext';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', label: 'Dashboard', icon: Activity },
  { to: '/ingestion', label: 'Data Ingestion', icon: Upload },
  { to: '/analysis', label: 'Analysis', icon: BarChart3 },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const { pathname } = useLocation();
  const { status, alertMessage } = useSolar();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center px-4 gap-6">
        <Link to="/" className="flex items-center gap-2 mr-4">
          <Sun className="h-6 w-6 text-primary" />
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            SolarBurst <span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200',
                pathname === l.to
                  ? 'bg-primary/10 text-primary font-medium shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <l.icon className="h-4 w-4" />
              <span className="hidden md:inline">{l.label}</span>
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <StatusIndicator status={status} message={alertMessage} />
        </div>
      </div>
    </nav>
  );
}

function StatusIndicator({ status, message }: { status: string; message: string }) {
  const colorMap: Record<string, string> = {
    idle: 'text-primary',
    processing: 'text-accent',
    alert: 'text-destructive',
  };
  const labelMap: Record<string, string> = {
    idle: 'Connected',
    processing: 'Processing...',
    alert: message || 'Alert',
  };
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className={cn('h-2 w-2 rounded-full pulse-dot', colorMap[status], status === 'idle' ? 'bg-primary' : status === 'processing' ? 'bg-accent' : 'bg-destructive')} />
      <span className={cn('hidden sm:inline', colorMap[status])}>{labelMap[status]}</span>
    </div>
  );
}
