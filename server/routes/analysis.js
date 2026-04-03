const express = require('express');
const router = express.Router();
const Upload = require('../models/Upload');
const AnalysisResult = require('../models/AnalysisResult');
const HistoryEntry = require('../models/HistoryEntry');

// Smart number formatter — handles scientific notation & tiny values
function fmt(v) {
  if (v === 0) return 0;
  const abs = Math.abs(v);
  // For very small or very large numbers, use toPrecision
  if (abs < 0.0001 || abs >= 1e8) return +v.toPrecision(6);
  // Normal range: 4 decimal places
  return +v.toFixed(4);
}

// Utility: compute statistics for a numeric array
function computeStats(arr) {
  const n = arr.length;
  if (n === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = arr.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[n - 1];

  // Mode
  const freq = {};
  arr.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(freq));
  const mode = parseFloat(Object.keys(freq).find((k) => freq[k] === maxFreq));

  return { mean: fmt(mean), median: fmt(median), mode: fmt(mode), stdDev: fmt(stdDev), min: fmt(min), max: fmt(max), count: n };
}

// Utility: compute correlation between two arrays
function correlation(a, b) {
  const n = a.length;
  if (n === 0) return 0;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const dA = a[i] - meanA;
    const dB = b[i] - meanB;
    num += dA * dB;
    denA += dA * dA;
    denB += dB * dB;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : +(num / den).toFixed(4);
}

// Utility: detect if column is a date
function isDateColumn(values) {
  const sample = values.slice(0, 20).filter(Boolean);
  if (sample.length === 0) return false;
  const parsed = sample.map((v) => Date.parse(v));
  return parsed.filter((d) => !isNaN(d)).length > sample.length * 0.7;
}

// POST /api/analysis — run analysis on an upload (returns cached if exists)
router.post('/', async (req, res) => {
  try {
    const { uploadId } = req.body;
    if (!uploadId) return res.status(400).json({ error: 'uploadId is required' });

    // Check if analysis already exists for this upload — return cached result
    const existing = await AnalysisResult.findOne({ uploadId, status: 'completed' }).lean();
    if (existing) {
      return res.json({
        _id: existing._id,
        uploadId: existing.uploadId,
        results: existing.results,
        status: existing.status,
        createdAt: existing.createdAt,
      });
    }

    const upload = await Upload.findById(uploadId).lean();
    if (!upload) return res.status(404).json({ error: 'Upload not found' });

    const data = upload.parsedData || [];
    if (data.length === 0) return res.status(400).json({ error: 'No data to analyse' });

    const columns = upload.columnNames || Object.keys(data[0]);

    // Classify columns
    const numericCols = [];
    const categoricalCols = [];
    const dateCols = [];

    columns.forEach((col) => {
      const values = data.map((r) => r[col]).filter((v) => v !== undefined && v !== null && v !== '');
      if (values.length === 0) return;

      if (isDateColumn(values)) {
        dateCols.push(col);
      } else {
        const numericValues = values.map(Number).filter((v) => !isNaN(v));
        if (numericValues.length > values.length * 0.7) {
          numericCols.push(col);
        } else {
          categoricalCols.push(col);
        }
      }
    });

    // Summary statistics per numeric column
    const summaryStats = {};
    const numericArrays = {};
    numericCols.forEach((col) => {
      const vals = data.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
      numericArrays[col] = vals;
      summaryStats[col] = computeStats(vals);
    });

    // Correlation matrix
    const correlationMatrix = {};
    numericCols.forEach((colA) => {
      correlationMatrix[colA] = {};
      numericCols.forEach((colB) => {
        if (colA === colB) {
          correlationMatrix[colA][colB] = 1;
        } else {
          const minLen = Math.min(numericArrays[colA].length, numericArrays[colB].length);
          correlationMatrix[colA][colB] = correlation(
            numericArrays[colA].slice(0, minLen),
            numericArrays[colB].slice(0, minLen)
          );
        }
      });
    });

    // Distribution data for histograms (bin data client-side, send raw arrays capped at 1000)
    const distributions = {};
    numericCols.forEach((col) => {
      const vals = numericArrays[col];
      const stats = summaryStats[col];
      const binCount = Math.min(30, Math.ceil(Math.sqrt(vals.length)));
      const range = stats.max - stats.min || 1;
      const binWidth = range / binCount;
      const bins = Array.from({ length: binCount }, (_, i) => ({
        binStart: +(stats.min + i * binWidth).toFixed(4),
        binEnd: +(stats.min + (i + 1) * binWidth).toFixed(4),
        count: 0,
      }));
      vals.forEach((v) => {
        const idx = Math.min(Math.floor((v - stats.min) / binWidth), binCount - 1);
        if (idx >= 0 && idx < binCount) bins[idx].count++;
      });
      distributions[col] = bins;
    });

    // Categorical distributions
    const categoricalDist = {};
    categoricalCols.forEach((col) => {
      const freq = {};
      data.forEach((r) => {
        const v = r[col];
        if (v !== undefined && v !== null && v !== '') {
          freq[v] = (freq[v] || 0) + 1;
        }
      });
      // Top 20 categories
      categoricalDist[col] = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([name, value]) => ({ name, value }));
    });

    // Time-series data
    const timeSeriesData = {};
    dateCols.forEach((dateCol) => {
      numericCols.slice(0, 3).forEach((numCol) => {
        const key = `${dateCol}_vs_${numCol}`;
        const points = data
          .map((r) => ({
            date: r[dateCol],
            value: parseFloat(r[numCol]),
          }))
          .filter((p) => p.date && !isNaN(p.value))
          .slice(0, 500);
        timeSeriesData[key] = points;
      });
    });

    const results = {
      summaryStats,
      correlationMatrix,
      distributions,
      categoricalDist,
      timeSeriesData,
      numericColumns: numericCols,
      categoricalColumns: categoricalCols,
      dateColumns: dateCols,
      totalRows: data.length,
      totalColumns: columns.length,
    };

    const analysisDoc = await AnalysisResult.create({
      uploadId,
      analysisType: 'full',
      results,
      status: 'completed',
    });

    // Update upload status
    await Upload.findByIdAndUpdate(uploadId, { status: 'analyzed' });

    // Log to history
    await HistoryEntry.create({
      action: 'analysis',
      description: `Ran full analysis on "${upload.originalName}" — ${numericCols.length} numeric, ${categoricalCols.length} categorical columns`,
      uploadId,
      analysisId: analysisDoc._id,
      metadata: { numericCols: numericCols.length, categoricalCols: categoricalCols.length, rows: data.length },
    });

    res.status(201).json({
      _id: analysisDoc._id,
      uploadId,
      results,
      status: 'completed',
      createdAt: analysisDoc.createdAt,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await AnalysisResult.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Analysis not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
