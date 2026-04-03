import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Trash2, Loader2, Eye, EyeOff, Settings } from 'lucide-react';
import { getSettings, updateSettings, deleteAllData, type AppSettings } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Local editable state
  const [theme, setTheme] = useState('dark');
  const [chartType, setChartType] = useState('bar');
  const [retention, setRetention] = useState(90);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getSettings();
        if (cancelled) return;
        setSettings(data);
        setTheme(data.theme);
        setChartType(data.defaultChartType);
        setRetention(data.dataRetentionDays);
        setNotifications(data.notifications);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSettings({
        theme,
        defaultChartType: chartType,
        dataRetentionDays: retention,
        notifications,
      });
      setSettings(updated);
      toast.success('Settings saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const result = await deleteAllData();
      toast.success(result.message);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete data');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>

      {/* Appearance */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          Appearance & Preferences
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-foreground">Theme</span>
            <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={v => setTheme(v ? 'dark' : 'light')}
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-foreground block mb-2">Default Chart Type</label>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="bg-surface border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-foreground block mb-2">
            Data Retention Period: <span className="text-primary font-mono">{retention} days</span>
          </label>
          <Slider
            value={[retention]}
            onValueChange={([v]) => setRetention(v)}
            min={7}
            max={365}
            step={7}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>7 days</span>
            <span>365 days</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-foreground">Email Notifications</span>
            <p className="text-xs text-muted-foreground">Receive alerts for new analyses</p>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>
      </div>

      {/* API Key */}
      {settings?.apiKey && (
        <div className="glass-card p-6 space-y-3">
          <h2 className="font-heading text-sm font-semibold text-foreground">API Key</h2>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surface px-3 py-2 rounded-lg font-mono text-xs text-foreground/70">
              {showApiKey ? settings.apiKey : '•'.repeat(32)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Settings
      </Button>

      {/* Danger Zone */}
      <div className="glass-card p-6 border-destructive/20">
        <h2 className="font-heading text-sm font-semibold text-destructive mb-3">Danger Zone</h2>
        <p className="text-xs text-muted-foreground mb-4">
          This will permanently delete all uploads, analyses, and history. This action cannot be undone.
        </p>
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>all uploads, analyses, and history</strong> from the database.
                All uploaded files will also be removed from the server. This action is <strong>irreversible</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAll}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground"
              >
                {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Yes, Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}
