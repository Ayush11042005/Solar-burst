const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Upload = require('../models/Upload');
const HistoryEntry = require('../models/HistoryEntry');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.csv', '.xls', '.xlsx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV, XLS, XLSX, and TXT files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Parse CSV file into array of row objects
function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
}

// Parse Excel file
function parseExcelFile(filePath) {
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

// POST /api/uploads — upload a file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let parsedData = [];
    let columnNames = [];

    try {
      if (ext === '.csv' || ext === '.txt') {
        parsedData = await parseCSVFile(req.file.path);
      } else if (ext === '.xls' || ext === '.xlsx') {
        parsedData = parseExcelFile(req.file.path);
      }
    } catch (parseErr) {
      return res.status(400).json({ error: 'Failed to parse file: ' + parseErr.message });
    }

    if (parsedData.length > 0) {
      columnNames = Object.keys(parsedData[0]);
    }

    const uploadDoc = await Upload.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      rowCount: parsedData.length,
      columnNames,
      status: 'parsed',
      filePath: req.file.path,
      fileSize: req.file.size,
      parsedData,
    });

    // Log to history
    await HistoryEntry.create({
      action: 'upload',
      description: `Uploaded file "${req.file.originalname}" (${parsedData.length} rows)`,
      uploadId: uploadDoc._id,
      metadata: { filename: req.file.originalname, rowCount: parsedData.length, fileSize: req.file.size },
    });

    res.status(201).json({
      _id: uploadDoc._id,
      originalName: uploadDoc.originalName,
      rowCount: uploadDoc.rowCount,
      columnNames: uploadDoc.columnNames,
      status: uploadDoc.status,
      uploadedAt: uploadDoc.uploadedAt,
      fileSize: uploadDoc.fileSize,
      preview: parsedData.slice(0, 10),
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads — list all uploads
router.get('/', async (req, res) => {
  try {
    const uploads = await Upload.find({}, '-parsedData')
      .sort({ uploadedAt: -1 })
      .lean();
    res.json(uploads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads/:id — single upload metadata
router.get('/:id', async (req, res) => {
  try {
    const doc = await Upload.findById(req.params.id, '-parsedData').lean();
    if (!doc) return res.status(404).json({ error: 'Upload not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads/:id/data — get parsed rows
router.get('/:id/data', async (req, res) => {
  try {
    const doc = await Upload.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Upload not found' });
    res.json({
      _id: doc._id,
      originalName: doc.originalName,
      columnNames: doc.columnNames,
      rowCount: doc.rowCount,
      data: doc.parsedData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
