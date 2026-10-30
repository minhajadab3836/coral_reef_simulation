import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { WorldMap } from './components/WorldMap';
import { ControlPanel } from './components/ControlPanel';
import { runSimulation } from './simulation/dtmcEngine';

const DEFAULT_CONTROLS = {
  temperatureDHW: 3.2,
  turbidity: 0.048,
  depthCategory: 'medium',
  exposure: 'Sheltered',
  mpaCoverage: 0.25,
  scenario: 'moderate'
};

export default function App() {
  const [controls, setControls] = useState(DEFAULT_CONTROLS);
  const [currentYear, setCurrentYear] = useState(0);

  const [reefs, setReefs] = useState([]);
  const [modelParams, setModelParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load empirical dataset JSON
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [reefsRes, modelRes] = await Promise.all([
          fetch('/data/reef_simulation_data.json'),
          fetch('/data/statistical_model.json')
        ]);

        if (!reefsRes.ok || !modelRes.ok) {
          throw new Error('Failed to load empirical data files');
        }

        const reefsData = await reefsRes.json();
        const modelData = await modelRes.json();

        setReefs(reefsData);
        setModelParams(modelData);
      } catch (err) {
        console.error('Error loading simulation assets:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handler for control changes
  const handleControlChange = useCallback((key, value) => {
    setControls(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Reset to default baseline parameters
  const handleReset = useCallback(() => {
    setControls(DEFAULT_CONTROLS);
    setCurrentYear(0);
  }, []);

  // Compute stochastic DTMC & Monte Carlo projection instantly (<2ms)
  const simulationData = useMemo(() => {
    if (!reefs.length || !modelParams) return null;

    return runSimulation({
      reefs,
      controls,
      modelParams,
      numMonteCarloRuns: 150,
      horizonYears: 50
    });
  }, [reefs, controls, modelParams]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fbfbfa] text-neutral-800">
        <div className="w-10 h-10 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold tracking-tight">Initializing Coral Reef Stochastic Simulation...</h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">Parsing 34,393 records and 1,000 global monitoring nodes</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fbfbfa] text-neutral-800 p-6">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg max-w-md text-center">
          <h2 className="text-sm font-semibold text-rose-800">Data Loading Error</h2>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#fbfbfa] text-neutral-900 overflow-hidden">
      {/* Top Header */}
      <Header
        currentYear={currentYear}
        scenario={controls.scenario}
        onReset={handleReset}
        totalSites={reefs.length}
        horizonYears={50}
      />

      {/* 50/50 Split Screen Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Half: Geographic World Heatmap (50%) */}
        <section className="w-full lg:w-1/2 h-1/2 lg:h-full relative border-r border-neutral-200">
          <WorldMap
            reefs={reefs}
            simulationData={simulationData}
            currentYear={currentYear}
            onYearChange={setCurrentYear}
            horizonYears={50}
          />
        </section>

        {/* Right Half: Control Panel & Stochastic Inference Dashboard (50%) */}
        <section className="w-full lg:w-1/2 h-1/2 lg:h-full relative overflow-hidden bg-white">
          <ControlPanel
            controls={controls}
            onChangeControl={handleControlChange}
            modelParams={modelParams}
            simulationData={simulationData}
            currentYear={currentYear}
          />
        </section>
      </main>
    </div>
  );
}
