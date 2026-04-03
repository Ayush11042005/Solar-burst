import { useState, useEffect, useCallback } from 'react';
import { Search, Clock, Trash2, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getHistory, clearHistory, type HistoryResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function History() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getHistory({
        page,
        limit: 10,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        search: search || undefined,
      });
      setData(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      toast.success('History cleared');
      setPage(1);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear history');
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const actionColors: Record<string, string> = {
    upload: 'bg-primary/10 text-primary',
    analysis: 'bg-blue-500/10 text-blue-400',
    settings_change: 'bg-amber-500/10 text-amber-400',
    delete: 'bg-red-500/10 text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">History</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3 w-3 mr-1" />
              Clear History
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all history entries. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground">
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9 bg-surface border-border/50"
          />
        </div>
        <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-surface border-border/50">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="upload">Uploads</SelectItem>
            <SelectItem value="analysis">Analyses</SelectItem>
            <SelectItem value="settings_change">Settings</SelectItem>
            <SelectItem value="delete">Deletions</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleSearch} className="border-border/50">
          Search
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-muted-foreground text-xs">
                {['Action', 'Description', 'Timestamp'].map(h => (
                  <th key={h} className="py-3 px-4 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.entries.map((entry, idx) => (
                <motion.tr
                  key={entry._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className={cn('px-2 py-1 rounded text-xs font-mono uppercase', actionColors[entry.action] || 'bg-muted text-muted-foreground')}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground/80 max-w-md truncate">{entry.description}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs font-mono">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {data?.entries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Clock className="h-8 w-8 mx-auto mb-3 opacity-40" />
              No history entries found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {data.page} of {data.totalPages} ({data.total} total entries)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-border/50">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={!data.hasMore} onClick={() => setPage(p => p + 1)} className="border-border/50">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
