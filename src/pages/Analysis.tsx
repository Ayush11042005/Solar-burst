import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Loader2, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { runAnalysis, getUploadData, getUploads, type AnalysisResponse } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['#00e5c3', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#22c55e', '#ec4899', '#06b6d4'];

export default function Analysis() {
  const [searchParams] = useSearchParams();
  const uploadId = searchParams.get('uploadId');

  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'distributions' | 'correlation' | 'categorical' | 'timeseries'>('summary');

  useEffect(() => {
    let cancelled = false;

    async function resolveUploadIdAndAnalyse() {
      try {
        let currentUploadId = uploadId;

        // If no explicit uploadId in URL, fetch the most recent one
        if (!currentUploadId) {
          const uploads = await getUploads();
          if (cancelled) return;
          if (uploads.length === 0) {
            setError('No data found. Please upload a file first.');
            setLoading(false);
            return;
          }
          currentUploadId = uploads[0]._id;
        }

        // Fetch upload info
        const uploadData = await getUploadData(currentUploadId!);
        if (cancelled) return;
        setUploadName(uploadData.originalName);

        // Run analysis
        setAnalysing(true);
        const result = await runAnalysis(currentUploadId!);
        if (cancelled) return;
        setAnalysis(result);
        toast.success('Analysis completed!');
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Analysis failed');
          toast.error(err.message || 'Analysis failed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setAnalysing(false);
        }
      }
    }

    resolveUploadIdAndAnalyse();
    return () => { cancelled = true; };
  }, [uploadId]);

  const exportReport = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis.results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${uploadName || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  if (loading || analysing) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-mono text-sm">
          {analysing ? 'Running analysis...' : 'Loading data...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-destructive text-sm">{error}</p>
        <Button onClick={() => window.location.href = '/ingestion'} variant="outline">
          Upload a File First
        </Button>
      </div>
    );
  }

  if (!analysis) return null;

  const { results } = analysis;
  const tabs = [
    { key: 'summary' as const, label: 'Summary Stats', show: true },
    { key: 'distributions' as const, label: 'Distributions', show: results.numericColumns.length > 0 },
    { key: 'correlation' as const, label: 'Correlation', show: results.numericColumns.length > 1 },
    { key: 'categorical' as const, label: 'Categorical', show: results.categoricalColumns.length > 0 },
    { key: 'timeseries' as const, label: 'Time Series', show: Object.keys(results.timeSeriesData).length > 0 },
  ].filter(t => t.show);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {uploadName} — {results.totalRows} rows × {results.totalColumns} columns
          </p>
        </div>
        <Button onClick={exportReport} variant="outline" className="border-border/50">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      {activeTab === 'summary' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 overflow-x-auto">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Summary Statistics</h3>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border/30 text-muted-foreground">
                {['Column', 'Count', 'Mean', 'Median', 'Mode', 'Std Dev', 'Min', 'Max'].map(h => (
                  <th key={h} className="py-2 px-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(results.summaryStats).map(([col, stats]) => (
                <tr key={col} className="border-b border-border/10 hover:bg-muted/20">
                  <td className="py-1.5 px-3 font-medium text-primary">{col}</td>
                  <td className="py-1.5 px-3">{stats.count}</td>
                  <td className="py-1.5 px-3">{stats.mean}</td>
                  <td className="py-1.5 px-3">{stats.median}</td>
                  <td className="py-1.5 px-3">{stats.mode}</td>
                  <td className="py-1.5 px-3">{stats.stdDev}</td>
                  <td className="py-1.5 px-3">{stats.min}</td>
                  <td className="py-1.5 px-3">{stats.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Distribution Histograms */}
      {activeTab === 'distributions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.numericColumns.map((col, idx) => (
            <div key={col} className="glass-card p-4">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3">{col}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={results.distributions[col]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
                  <XAxis
                    dataKey="binStart"
                    tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }}
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }} />
                  <RTooltip
                    contentStyle={{ background: 'hsl(220 25% 10%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px', fontSize: '11px' }}
                    labelFormatter={(v: number) => `Range: ${v.toFixed(2)}`}
                  />
                  <Bar dataKey="count" fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </motion.div>
      )}

      {/* Correlation Matrix */}
      {activeTab === 'correlation' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 overflow-x-auto">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Correlation Matrix</h3>
          <table className="text-xs font-mono">
            <thead>
              <tr>
                <th className="py-2 px-3" />
                {results.numericColumns.map(c => (
                  <th key={c} className="py-2 px-3 text-muted-foreground" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.numericColumns.map(rowCol => (
                <tr key={rowCol}>
                  <td className="py-1.5 px-3 text-muted-foreground font-medium">{rowCol}</td>
                  {results.numericColumns.map(colCol => {
                    const val = results.correlationMatrix[rowCol]?.[colCol] ?? 0;
                    const absVal = Math.abs(val);
                    const hue = val >= 0 ? 168 : 0;
                    return (
                      <td
                        key={colCol}
                        className="py-1.5 px-3 text-center"
                        style={{
                          backgroundColor: `hsl(${hue} 80% 45% / ${absVal * 0.6})`,
                          color: absVal > 0.5 ? 'white' : 'hsl(215 15% 55%)',
                        }}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Categorical Charts */}
      {activeTab === 'categorical' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.categoricalColumns.map((col, idx) => {
            const data = results.categoricalDist[col] || [];
            return (
              <div key={col} className="glass-card p-4">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-3">{col}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  {data.length <= 6 ? (
                    <PieChart>
                      <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" paddingAngle={3} stroke="none">
                        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <RTooltip
                        contentStyle={{ background: 'hsl(220 25% 10%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  ) : (
                    <BarChart data={data} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }} width={100} />
                      <RTooltip
                        contentStyle={{ background: 'hsl(220 25% 10%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Bar dataKey="value" fill={COLORS[idx % COLORS.length]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Time Series */}
      {activeTab === 'timeseries' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {Object.entries(results.timeSeriesData).map(([key, data], idx) => (
            <div key={key} className="glass-card p-4">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {key.replace('_vs_', ' → ')}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(215 15% 55%)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }} />
                  <RTooltip
                    contentStyle={{ background: 'hsl(220 25% 10%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="value" stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
