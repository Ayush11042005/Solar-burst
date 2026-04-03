# ☀️ SolarBurst AI

<div align="center">
  <h3>Automated Detection & Classification of Solar X-Ray Bursts</h3>
  <p>A full-stack serverless application powered by React, Netlify Functions, and MongoDB.</p>
</div>

---

## 📖 Overview

SolarBurst AI is an advanced, high-performance web platform designed to analyze light curve data and autonomously detect solar X-ray bursts. The platform ingests CSV/Excel datasets and utilizes a custom analytical engine to calculate key metrics, correlate background fluxes, and map time-series data accurately, even across extreme X-class planetary events.

The application operates completely **Serverless** on Netlify, using in-memory ephemeral streams to protect user data and ensure hyperscale compute availability without the maintenance of a continuous server.

---

## ✨ Features & Visuals

*(All screenshots below represent the live production environment.)*

### 1. In-Depth Categorical Analysis
The analytical engine autonomously classifies burst peaks into standardized astronomical scales (Quiet, A, B, C, M, X, and Extreme X saturation risk).
![Categorical Analysis](public/screenshots/analysis_categorical.png)

### 2. Time-Series Visualization
Rich, interactive line graphs rendering exact solar progression over time, mapping out burst intensity `flux_watts_per_m2` and noise-reduced smoothing parameters.
![Time Series Analysis](public/screenshots/analysis_timeseries.png)

### 3. Correlation & Statistical Mapping
A customized correlation matrix automatically maps `background_level` variations against recorded smoothing, assisting in identifying data anomalies.
![Correlation Matrix](public/screenshots/analysis_correlation.png)

### 4. Mathematical Distributions
Histogram modeling accurately bins background levels and raw flux signals, providing researchers with instant probability distribution overviews.
![Data Distributions](public/screenshots/analysis_distributions.png)

### 5. Persistent History & Logging
A comprehensive audit trail records every data ingestion event and subsequent mathematical analysis, preserving historical timestamps inside MongoDB Atlas.
![History Log](public/screenshots/history_log.png)

---

## 🛠️ Technology Stack

**Frontend Framework:** React 18, Vite, TailwindCSS, Lucide Icons, Recharts  
**Backend API:** Node.js, Express, `serverless-http`  
**Database:** MongoDB Atlas (Mongoose ORM)  
**File Parsing:** Multer (Memory Storage), `csv-parser`, `xlsx`  
**Deployment Infrastructure:** Netlify (Edge CDN + AWS Lambda Serverless Functions)

---

## 🚀 Deployment Guide

This project is configured natively for Netlify. Pushing to the `main` branch will automatically build both the React frontend and the Serverless API layer.

### Netlify Configuration
1. Connect this repository to your Netlify dashboard.
2. The build settings in `netlify.toml` will handle the compilation naturally (`npm run build`).
3. Set the following **Environment Variables**:
   * `MONGODB_URI`: The exact connection string to your MongoDB Atlas cluster.
   * `JWT_SECRET`: A cryptographic key for secure application hashing.

### MongoDB Configuration
Because Netlify serverless functions execute dynamically across global AWS servers, you **must** allow open internet access (`0.0.0.0/0`) in your MongoDB Atlas Network Access pane. The code utilizes `bufferCommands: false` to ensure fast-failing connections in serverless environments.

---

## 💻 Local Development

If you wish to test the platform locally on your own machine:

1. Clone the repository and install all dependencies in the root:
   ```bash
   npm install
   ```

2. Duplicate the environment variables by creating a `.env` file at the root:
   ```env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
   PORT=5000
   JWT_SECRET=super_secret_key
   ```

3. Open two terminal instances. In the first terminal, start the local Express API:
   ```bash
   cd server
   node index.js
   ```

4. In the second terminal, start the Vite React development server:
   ```bash
   npm run dev
   ```

The application will be accessible at `http://localhost:8080`.

---
*Developed by Ayush11042005*
