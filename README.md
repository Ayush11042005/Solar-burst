# ☀️ SolarBurst AI

SolarBurst AI is an advanced, full-stack web application designed for the automated detection, classification, and analysis of solar X-ray bursts from satellite light curve data. It leverages smart data parsing, statistical analysis engines, and a sleek, interactive frontend.

## 🚀 Key Features

* **Instant Data Ingestion**: Drag and drop CSV, TXT, or Excel files containing solar light curve data.
* **Serverless Architecture**: Fully powered by an Express.js backend running natively inside Netlify Serverless Functions utilizing in-memory streaming bounds.
* **Advanced Statistics Engine**: Runs comprehensive numeric analysis computing multi-dimensional anomalies, scientific standard deviations, and noise floors.
* **Live Dashboarding**: View historical ingestion events and real-time anomaly telemetry tracking.

## 🖼️ Application Showcase

### Data Ingestion Interface
Easily upload structured solar datasets with direct tabular preview validation.
![Data Ingestion Interface](public/screenshots/ingestion.png)

### Live Data Preview
Validate incoming rows, parsing schemas, and structural integrity directly in the UI.
![Data Preview](public/screenshots/data_preview.png)

### Summary Statistics
Analyze precision numeric metrics such as Watts/m², background fluxes, and anomalies down to extreme scientific precisions.
![Summary Statistics](public/screenshots/analysis_summary.png)

### Visual Data Distributions
Utilize automatically generated charts and distributions to visually map active burst categories without needing Python notebooks.
![Distribution Analysis](public/screenshots/analysis_distributions.png)

## 🛠️ Technology Stack

* **Frontend**: React, TypeScript, Vite, Tailwind CSS
* **Backend**: Node.js, Express.js, `serverless-http`
* **Database**: MongoDB Atlas (Mongoose)
* **Hosting**: Netlify (Frontend + Serverless API Functions)

## 💻 Running the App Locally

To run the application locally on your machine:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://<your_username>:<your_password_url_encoded>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   PORT=5000
   JWT_SECRET=your_secret_key
   ```

3. **Start the Development Servers**
   You need two terminals for local development because the React frontend lives separately from the Express backend locally.
   
   **Terminal 1 (Backend API)**:
   ```bash
   cd server
   node index.js
   ```

   **Terminal 2 (Frontend Client)**:
   ```bash
   npm run dev
   ```

## 🚢 Deploying to Production (Netlify)

The project is completely optimized for Netlify Serverless Functions.
1. Connect your repository to Netlify.
2. In the Netlify dashboard, navigate to **Site Configuration -> Environment variables**.
3. Add `MONGODB_URI`, making sure your MongoDB IP Access List includes `0.0.0.0/0`.
4. Trigger the deploy! The `netlify.toml` file handles the rest, automatically securely compiling your Express backend into a stateless lambda function.
