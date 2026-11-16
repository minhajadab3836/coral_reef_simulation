# Coral Reef Simulation

Interactive simulation of coral reef bleaching dynamics built with React, Vite, Leaflet, and Tailwind CSS. Uses a Discrete-Time Markov Chain (DTMC) engine driven by real-world bleaching data.

## Features

- World map (Leaflet) showing reef locations with bleaching status
- DTMC-based state transitions: Healthy → Bleached → Dead → Recovering
- Control panel to adjust environmental parameters
- Statistical model derived from `global_bleaching_environmental.csv`

## Tech Stack

| Layer | Library |
|-------|---------|
| UI | React 18, Tailwind CSS |
| Map | Leaflet 1.9 |
| Bundler | Vite 5 |
| Data | Python (scripts/process_coral_data.py) |

## Getting Started

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env

# Start dev server
npm run dev
```

Build for production:

```bash
npm run build
```

## Data

`global_bleaching_environmental.csv` — raw dataset.  
Run `scripts/process_coral_data.py` to regenerate `public/data/`.

## Project Structure

```
coral_reef_simulation/
├── public/data/          # Pre-processed JSON data
├── scripts/              # Python data pipeline
├── src/
│   ├── components/       # React components
│   ├── simulation/       # DTMC engine
│   ├── App.jsx
│   └── main.jsx
├── .env.example
└── vite.config.js
```

## License

MIT
