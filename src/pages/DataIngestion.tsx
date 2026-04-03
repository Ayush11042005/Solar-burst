import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, Loader2, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { uploadFile, type UploadResponse } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Stage = 'idle' | 'uploading' | 'parsing' | 'ready' | 'error';

export default function DataIngestion() {
  const nav = useNavigate();
  const [stage, setStage] = useState<Stage>('idle');
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setFileType(ext.toUpperCase());
    setStage('uploading');
    setErrorMsg('');

    try {
      setStage('parsing');
      const result = await uploadFile(file);
      setUploadResult(result);
      setPreview(result.preview || []);
      setStage('ready');
      toast.success(`File "${result.originalName}" uploaded successfully! (${result.rowCount} rows)`);
    } catch (err: any) {
      setStage('error');
      const msg = err.message || 'Upload failed';
      setErrorMsg(msg);
      toast.error(msg);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleAnalyse = () => {
    if (uploadResult?._id) {
      nav(`/analysis?uploadId=${uploadResult._id}`);
    }
  };

  const stages: { key: Stage; label: string }[] = [
    { key: 'uploading', label: 'Upload' },
    { key: 'parsing', label: 'Parse' },
    { key: 'ready', label: 'Ready' },
  ];
  const stageIdx = stages.findIndex(s => s.key === stage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <h1 className="font-heading text-2xl font-bold text-foreground">Data Ingestion</h1>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50',
          'focus:outline-none'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto text-primary/60 mb-4" />
        <p className="text-foreground font-medium">
          {isDragActive ? 'Drop your file here...' : 'Drag & drop a CSV/Excel file, or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Supports CSV, TXT, XLS, XLSX — Max 10MB</p>
      </div>

      <AnimatePresence>
        {fileName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 space-y-4"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  Format: {fileType}
                  {uploadResult && ` • ${uploadResult.rowCount} rows • ${uploadResult.columnNames.length} columns`}
                </p>
              </div>
            </div>

            {/* Progress stages */}
            <div className="flex items-center gap-2">
              {stages.map((s, i) => {
                const isActive = i <= stageIdx && stage !== 'error';
                const isCurrent = s.key === stage;
                return (
                  <div key={s.key} className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      'flex items-center gap-1.5 text-xs font-mono',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {isCurrent && stage !== 'ready' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isActive ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                      )}
                      {s.label}
                    </div>
                    {i < stages.length - 1 && (
                      <div className={cn('flex-1 h-px', isActive ? 'bg-primary/40' : 'bg-border/30')} />
                    )}
                  </div>
                );
              })}
            </div>

            {stage === 'error' && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {preview.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 overflow-x-auto"
        >
          <h3 className="text-sm font-heading font-semibold text-foreground mb-3">
            Data Preview (first {Math.min(10, preview.length)} rows)
          </h3>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border/30">
                {Object.keys(preview[0]).map(k => (
                  <th key={k} className="py-2 px-3 text-left text-muted-foreground">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 10).map((row, i) => (
                <tr key={i} className="border-b border-border/10 hover:bg-muted/20">
                  {Object.values(row).map((v, j) => (
                    <td key={j} className="py-1.5 px-3 text-foreground/80">{String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {stage === 'ready' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Button
            onClick={handleAnalyse}
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-teal text-lg font-heading font-semibold py-6"
          >
            <Play className="h-5 w-5 mr-2" />
            Analyse Data
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
