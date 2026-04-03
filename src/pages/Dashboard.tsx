import { useState, useEffect, useRef } from 'react';
import { Activity, Database, BarChart3, Clock, Loader2, Upload as UploadIcon, TrendingUp } from 'lucide-react';
import { getDashboardStats, type DashboardStats } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#00e5c3', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];

// Count-up animation hook
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setValue(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

function AnimatedStatCard({
  title, value, subtitle, icon: Icon, glowClass = 'glow-teal', delay = 0,
}: {
  title: string; value: number | string; subtitle: string; icon: React.ComponentType<any>; glowClass?: string; delay?: number;
}) {
  const numVal = typeof value === 'number' ? value : 0;
  const displayNum = useCountUp(numVal);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
      className={cn('glass-card p-4 lg:p-5', glowClass)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{title}</span>
        <Icon className="h-5 w-5 text-primary/60" />
      </div>
      <p className="stat-value text-foreground">
        {typeof value === 'number' ? displayNum.toLocaleString() : value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </motion.div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card h-72 rounded-xl" />
        <div className="glass-card h-72 rounded-xl" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getDashboardStats();
        if (!cancelled) setStats(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Activity className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStatCard
          title="Total Uploads"
          value={stats.totalUploads}
          subtitle="Files processed"
          icon={UploadIcon}
          delay={0}
        />
        <AnimatedStatCard
          title="Analyses Run"
          value={stats.totalAnalyses}
          subtitle="Datasets analysed"
          icon={BarChart3}
          delay={0.1}
        />
        <AnimatedStatCard
          title="Storage Used"
          value={formatBytes(stats.storageUsed)}
          subtitle="Across all uploads"
          icon={Database}
          glowClass="glow-amber"
          delay={0.2}
        />
        <AnimatedStatCard
          title="Last Upload"
          value={stats.mostRecentUpload ? new Date(stats.mostRecentUpload.uploadedAt).toLocaleDateString() : '—'}
          subtitle={stats.mostRecentUpload?.originalName || 'No uploads yet'}
          icon={Clock}
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Uploads Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Uploads Over Time
          </h3>
          {stats.uploadsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.uploadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }} allowDecimals={false} />
                <RTooltip
                  contentStyle={{ background: 'hsl(220 25% 10%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#00e5c3" strokeWidth={2} dot={{ r: 4, fill: '#00e5c3' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
              No upload data yet
            </div>
          )}
        </motion.div>

        {/* Analysis Types Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4"
        >
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Analysis Types
          </h3>
          {stats.analysisTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stats.analysisTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" paddingAngle={3} stroke="none">
                  {stats.analysisTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RTooltip
                  contentStyle={{ background: 'hsl(220 25% 10%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
              No analyses run yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-4"
      >
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Recent Activity
        </h3>
        {stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((entry) => (
              <div key={entry._id} className="flex items-start gap-3 text-sm">
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-mono uppercase',
                  entry.action === 'upload' ? 'bg-primary/10 text-primary' :
                  entry.action === 'analysis' ? 'bg-blue-500/10 text-blue-400' :
                  entry.action === 'settings_change' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                )}>
                  {entry.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground/80 truncate">{entry.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">No activity yet</p>
        )}
      </motion.div>
    </motion.div>
  );
}
