import React from 'react';
import { Activity, RotateCcw, ShieldCheck, Compass, Info } from 'lucide-react';

export function Header({
  currentYear,
  scenario,
  onReset,
  totalSites = 1000,
  horizonYears = 50
}) {
  const scenarioLabel = {
    bau: 'Business As Usual (RCP 8.5)',
    moderate: 'Moderate Action (RCP 4.5)',
    aggressive: 'Aggressive Paris 1.5°C'
  }[scenario] || scenario;

  return (
    <header className="h-14 border-b border-neutral-200 bg-white/90 backdrop-blur-sm px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-xs tracking-wider">
          CR
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-semibold tracking-tight text-neutral-900">
              Interactive Coral Reef Health & Bleaching Simulation
            </h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-neutral-200 bg-neutral-50 text-neutral-600">
              ASSP DTMC Engine
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            A Stochastic and Inferential Approach to Forecasting Climate Impacts • 50-Year Horizon
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Status badges */}
        <div className="hidden md:flex items-center space-x-3 text-xs text-neutral-600">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200/80">
            <span className="text-neutral-400 font-mono">Dataset:</span>
            <span className="font-medium text-neutral-800">34,393 records</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200/80">
            <span className="text-neutral-400 font-mono">Monitored Reefs:</span>
            <span className="font-medium text-neutral-800">{totalSites} nodes</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200/80">
            <span className="text-neutral-400 font-mono">Policy:</span>
            <span className="font-medium text-neutral-800">{scenarioLabel}</span>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-md transition-colors"
          title="Reset sliders to baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}
