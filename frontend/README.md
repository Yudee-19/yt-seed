# Kajkarma AI Pipeline - Frontend

This is the frontend application for the Kajkarma AI YouTube Channel Discovery & Analysis Pipeline.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and build
- **Tailwind CSS** for styling
- **Axios** for API requests

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Features

- **Start Pipeline**: Submit Google Sheets URLs to start the analysis pipeline
- **Progress Tracking**: Real-time monitoring of pipeline runs grouped by status
- **Download Results**: Retrieve all Tier 1 and Tier 2 channels from completed runs
- **Export to CSV**: Download results in CSV format for further analysis

## API Endpoints

The frontend connects to these FastAPI endpoints:

- `POST /start_pipeline` - Start a new pipeline run
- `GET /status/{task_id}` - Check task status
- `GET /progress` - Get all run progress
- `GET /download_tier1_2` - Download Tier 1 & 2 channels

## Configuration

The API base URL is configured in `vite.config.ts` to proxy requests to `http://localhost:8000`. Update this if your backend runs on a different port.

## Project Structure

```
frontend/
├── src/
│   ├── services/
│   │   └── api.ts          # API service layer
│   ├── types/
│   │   └── api.ts          # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles with Tailwind
├── public/                 # Static assets
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json           # Dependencies and scripts
```
