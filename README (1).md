# ☀️ SolarBurst AI

> An AI-powered solar X-ray data analysis platform for ingesting, visualizing, and exploring solar flux datasets.

![Dashboard](https://img.shields.io/badge/status-connected-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-1.0.0-teal)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [File Formats](#file-formats)
- [Analysis Modules](#analysis-modules)
- [Settings & Configuration](#settings--configuration)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**SolarBurst AI** is a web-based dashboard for solar scientists and data analysts to upload, process, and visually explore solar X-ray event data. It supports CSV/Excel ingestion, runs automated statistical analyses, and presents rich visualizations — including time series, distribution histograms, correlation matrices, and categorical breakdowns.

---

## Features

- 📤 **Data Ingestion** — Drag-and-drop CSV/TXT/XLS/XLSX upload (up to 10MB)
- 📊 **Summary Statistics** — Count, mean, median, mode, std dev, min, and max per numeric column
- 📈 **Distribution Histograms** — Per-column histograms for all numeric fields
- 🔗 **Correlation Matrix** — Heatmap showing pairwise Pearson correlations
- 🥧 **Categorical Analysis** — Donut chart + bar chart for categorical columns (e.g. `burst_class`, `notes`)
- 🕐 **Time Series Viewer** — Automatic detection of timestamp columns with multi-panel line charts
- 🕘 **History Log** — Full audit trail of uploads and analyses with search and filter
- ⚙️ **Settings** — Theme toggle, chart type, data retention period, email notifications, API key management
- 🌙 **Dark Mode** — Fully styled dark-first UI

---

## Screenshots

| Dashboard | Data Ingestion |
|-----------|---------------|
| Overview of uploads, analyses, and recent activity | Upload CSV files with live data preview |

| Summary Stats | Distributions |
|---------------|---------------|
| Tabular numeric summary per column | Per-column histogram panels |

| Correlation | Categorical |
|-------------|-------------|
| Heatmap of pairwise correlations | Donut + bar charts for categorical fields |

| Time Series | History |
|-------------|---------|
| Multi-panel time-series line charts | Searchable upload/analysis audit log |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or yarn

### Installation

```bash
git clone https://github.com/your-org/solarburst-ai.git
cd solarburst-ai
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

---

## File Formats

SolarBurst AI accepts the following formats via the **Data Ingestion** page:

| Format | Extensions | Max Size |
|--------|-----------|----------|
| CSV | `.csv` | 10 MB |
| Plain text | `.txt` | 10 MB |
| Excel (legacy) | `.xls` | 10 MB |
| Excel (modern) | `.xlsx` | 10 MB |

### Expected CSV Schema

The platform is optimized for solar X-ray event data with the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `timestamp` | datetime | ISO 8601 UTC timestamp (e.g. `2025-11-02T06:00:00Z`) |
| `time_seconds` | numeric | Elapsed seconds from observation start |
| `flux_watts_per_m2` | numeric | Raw solar X-ray flux (W/m²) |
| `flux_smoothed` | numeric | Smoothed flux value |
| `background_level` | numeric | Background X-ray level |
| `event_flag` | integer | `0` = no event, `1` = event detected |
| `burst_class` | categorical | GOES class: `A`, `B`, `C`, `M`, or `X` |
| `notes` | text | Free-text annotations (e.g. `Quiet sun baseline`, `Peak X-class`) |

> Any additional numeric or categorical columns are automatically detected and included in analysis.

---

## Analysis Modules

Once a file is uploaded and parsed, navigate to **Analysis** to explore:

### Summary Stats
Tabular view of `count`, `mean`, `median`, `mode`, `std dev`, `min`, and `max` for all numeric columns.

### Distributions
Histogram per numeric column, color-coded (teal for flux, blue for smoothed, amber for background).

### Correlation
Pearson correlation heatmap. Values range from `-1.00` (inverse) to `1.00` (perfect). Cells are color-coded by strength.

### Categorical
- **Donut chart** for `burst_class` distribution (A / B / C / M / X classes)
- **Horizontal bar chart** for `notes` field value frequencies

### Time Series
Automatically detects `timestamp` as the x-axis and plots all numeric columns as separate line chart panels.

---

## Settings & Configuration

Access via the **Settings** page in the top navigation.

| Setting | Description | Default |
|---------|-------------|---------|
| Theme | Light or dark mode | Dark |
| Default Chart Type | Bar Chart, Line Chart, etc. | Bar Chart |
| Data Retention Period | How long uploads are stored (7–365 days) | 90 days |
| Email Notifications | Receive alerts after new analyses complete | Enabled |
| API Key | Your SolarBurst API key for external integrations | — |

> ⚠️ **Danger Zone**: The "Delete All Data" button permanently removes all uploads, analyses, and history. This action cannot be undone.

---

## Project Structure

```
solarburst-ai/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── DataIngestion/
│   │   ├── Analysis/
│   │   │   ├── SummaryStats.jsx
│   │   │   ├── Distributions.jsx
│   │   │   ├── Correlation.jsx
│   │   │   ├── Categorical.jsx
│   │   │   └── TimeSeries.jsx
│   │   ├── History/
│   │   └── Settings/
│   ├── hooks/
│   │   ├── useFileUpload.js
│   │   └── useAnalysis.js
│   ├── utils/
│   │   ├── csvParser.js
│   │   └── statistics.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite |
| Charts | Recharts / Chart.js |
| CSV Parsing | PapaParse |
| Styling | Tailwind CSS |
| State Management | React Context + useState |
| Storage | IndexedDB / localStorage |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow the existing code style and include tests where applicable.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">Built with ☀️ for solar physicists and data scientists</p>
