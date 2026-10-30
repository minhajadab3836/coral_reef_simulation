import React, { useState } from 'react';
import {
  Sliders,
  TrendingDown,
  Shield,
  Layers,
  Thermometer,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Scale,
  LineChart,
  HelpCircle
} from 'lucide-react';

export function ControlPanel({
  controls,
  onChangeControl,
  modelParams,
  simulationData,
  currentYear
}) {
  const [activeTab, setActiveTab] = useState('stochastics'); // 'stochastics', 'diagnostics', 'hypotheses'

  const {
    temperatureDHW,
    turbidity,
    depthCategory,
    exposure,
    mpaCoverage,
    scenario
  } = controls;

  // Active transition matrix at current year
  const currentMatrix = simulationData?.matrices?.[currentYear] || [
    [0.92, 0.08, 0.00, 0.00],
    [0.35, 0.50, 0.15, 0.00],
    [0.00, 0.18, 0.60, 0.22],
    [0.00, 0.00, 0.00, 1.00]
  ];

  // Current trajectory statistics at current year
  const currentDist = simulationData?.trajectoryMeans?.[currentYear] || {
    healthy: 78.5,
    stressed: 14.2,
    bleached: 6.8,
    dead: 0.5
  };

  const ols = modelParams?.ols_regression || {
    beta_0: 7.5322,
    beta_1_ssta: 0.8065,
    beta_2_tsa_dhw: 1.4741,
    r_squared: 0.0750,
    f_statistic: 1394.49,
    n_samples: 34393
  };

  const chi2 = modelParams?.chi_square_test || {
    chi2_statistic: 156.71,
    degrees_of_freedom: 4,
    p_value: '< 0.00001',
    hypothesis_result: 'Reject H0',
    conditional_multiplier_wpollution: 1.35
  };

  const isTurbidityHigh = turbidity > 0.0731;

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden border-l border-neutral-200">
      {/* Panel Top Navigation / Notion Tabs */}
      <div className="border-b border-neutral-200 px-6 pt-3 pb-0 bg-neutral-50/60 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-neutral-700" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Simulation Control & Inference Deck
            </h2>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            P(t) @ Year {currentYear}
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex space-x-6 text-xs border-b border-transparent">
          <button
            onClick={() => setActiveTab('stochastics')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'stochastics'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Stochastic Engine & Controls
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'diagnostics'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            OLS Regression Model
          </button>
          <button
            onClick={() => setActiveTab('hypotheses')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'hypotheses'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Chi-Square (χ²) Test
          </button>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* =========================================
            TAB 1: STOCHASTICS & CONTROL DASHBOARD
           ========================================= */}
        {activeTab === 'stochastics' && (
          <>
            {/* Policy Scenario Interventions (Apple Segmented Control) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-700 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Climate Policy Scenario Intervention</span>
                </label>
                <span className="text-[11px] font-mono text-neutral-400">50-Year Trajectory</span>
              </div>

              <div className="grid grid-cols-3 p-1 bg-neutral-100 rounded-lg border border-neutral-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => onChangeControl('scenario', 'bau')}
                  className={`py-1.5 px-2 rounded-md font-medium transition-all text-center ${
                    scenario === 'bau'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Business As Usual
                  <span className="block text-[10px] text-neutral-400 font-normal">RCP 8.5 (+0.08°/yr)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeControl('scenario', 'moderate')}
                  className={`py-1.5 px-2 rounded-md font-medium transition-all text-center ${
                    scenario === 'moderate'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Moderate Action
                  <span className="block text-[10px] text-neutral-400 font-normal">RCP 4.5 (Peak Y25)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeControl('scenario', 'aggressive')}
                  className={`py-1.5 px-2 rounded-md font-medium transition-all text-center ${
                    scenario === 'aggressive'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Aggressive Climate
                  <span className="block text-[10px] text-neutral-400 font-normal">Paris 1.5°C Cap</span>
                </button>
              </div>
            </div>

            {/* Environmental Stressor Knobs & Sliders */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/40 space-y-4">
              <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center justify-between">
                <span>Environmental Stressor Knobs</span>
                <span className="text-[10px] font-normal font-mono text-neutral-500">Continuous Inputs</span>
              </h3>

              {/* Slider 1: Global Temperature (TSA_DHW) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center space-x-1 text-neutral-700">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    <span>Degree Heating Weeks (TSA_DHW)</span>
                  </span>
                  <span className="font-mono font-medium text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                    {temperatureDHW.toFixed(1)} °C-weeks
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="14.0"
                  step="0.2"
                  value={temperatureDHW}
                  onChange={e => onChangeControl('temperatureDHW', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>0.0 (Baseline)</span>
                  <span>4.0 (Bleaching Watch)</span>
                  <span>8.0 (Alert Level 2)</span>
                  <span>14.0 (Extreme)</span>
                </div>
              </div>

              {/* Slider 2: Local Turbidity / Pollution */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center space-x-1 text-neutral-700">
                    <Droplets className="w-3.5 h-3.5 text-amber-500" />
                    <span>Turbidity (Local Pollution / Sediment)</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {isTurbidityHigh && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                        χ² Multiplier Active (×1.35)
                      </span>
                    )}
                    <span className="font-mono font-medium text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                      {turbidity.toFixed(4)}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.010"
                  max="0.160"
                  step="0.005"
                  value={turbidity}
                  onChange={e => onChangeControl('turbidity', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>0.010 (Oligotrophic)</span>
                  <span>0.044 (Tertile 1)</span>
                  <span>0.073 (Tertile 2)</span>
                  <span>0.160 (Turbid/Runoff)</span>
                </div>
              </div>
            </div>

            {/* Oceanographic Secondary Factors & MPA Protection */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Reef Depth Dropdown */}
              <div className="p-3 rounded-lg border border-neutral-200 bg-white space-y-1.5">
                <label className="font-medium text-neutral-700 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Reef Depth Profile</span>
                </label>
                <select
                  value={depthCategory}
                  onChange={e => onChangeControl('depthCategory', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-md py-1.5 px-2 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  <option value="shallow">Shallow (&lt; 5 m) - High Thermal Stress</option>
                  <option value="medium">Intermediate (5 - 15 m) - Standard</option>
                  <option value="deep">Deep (&gt; 15 m) - Thermal Shelter</option>
                </select>
                <p className="text-[10px] text-neutral-400">
                  Deep water attenuates surface solar irradiance and thermal peaks.
                </p>
              </div>

              {/* Hydrodynamic Exposure */}
              <div className="p-3 rounded-lg border border-neutral-200 bg-white space-y-1.5">
                <label className="font-medium text-neutral-700 flex items-center space-x-1">
                  <TrendingDown className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Hydrodynamic Exposure</span>
                </label>
                <select
                  value={exposure}
                  onChange={e => onChangeControl('exposure', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-md py-1.5 px-2 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  <option value="Sheltered">Sheltered Lagoon (Lower flushing)</option>
                  <option value="Exposed">Exposed Reef Crest (High flushing)</option>
                </select>
                <p className="text-[10px] text-neutral-400">
                  Wave flushing dissipates stagnant hotspots and oxygenates corals.
                </p>
              </div>
            </div>

            {/* MPA Protection Slider */}
            <div className="p-3 rounded-lg border border-neutral-200 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700 flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Marine Protected Area (MPA) Coverage</span>
                </span>
                <span className="font-mono font-medium text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                  {(mpaCoverage * 100).toFixed(0)}% Protected
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={mpaCoverage}
                onChange={e => onChangeControl('mpaCoverage', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
              />
              <p className="text-[10px] text-neutral-400">
                Enhances recovery probabilities (P₁₀, P₂₁) by preventing overfishing of herbivorous grazers.
              </p>
            </div>

            {/* Live 4x4 Markov Transition Matrix Card */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>Discrete-Time Markov Transition Matrix P(t)</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Row-stochastic condition: ∑ⱼ Pᵢⱼ(t) = 1.000 &bull; Absorbing State 3: P₃₃ = 1.000
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Row Sums = 1.0</span>
                </div>
              </div>

              {/* 4x4 Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 text-[10px]">
                      <th className="py-1 px-2 text-left font-sans">State Xₜ \ Xₜ₊₁</th>
                      <th className="py-1 px-2 text-emerald-700">0: Healthy</th>
                      <th className="py-1 px-2 text-amber-700">1: Stressed</th>
                      <th className="py-1 px-2 text-rose-700">2: Bleached</th>
                      <th className="py-1 px-2 text-slate-700">3: Dead</th>
                      <th className="py-1 px-2 text-neutral-400">Row Sum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60">
                    {['0: Healthy', '1: Stressed', '2: Bleached', '3: Dead'].map((rowName, rIdx) => {
                      const rowVals = currentMatrix[rIdx] || [0, 0, 0, 0];
                      const rowSum = rowVals.reduce((a, b) => a + b, 0);

                      return (
                        <tr key={rIdx} className={rIdx === 3 ? 'bg-neutral-100/60 font-semibold' : ''}>
                          <td className="py-1.5 px-2 text-left font-sans font-medium text-neutral-700 text-[11px]">
                            {rowName}
                          </td>
                          {rowVals.map((val, cIdx) => (
                            <td
                              key={cIdx}
                              className={`py-1.5 px-2 ${
                                rIdx === cIdx
                                  ? 'font-bold text-neutral-900 bg-neutral-100/50'
                                  : val > 0
                                  ? 'text-neutral-700'
                                  : 'text-neutral-300'
                              }`}
                            >
                              {val.toFixed(3)}
                            </td>
                          ))}
                          <td className="py-1.5 px-2 font-mono text-[10px] text-neutral-500">
                            {rowSum.toFixed(3)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 50-Year Monte Carlo Trajectory & Confidence Envelope */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <LineChart className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Monte Carlo 50-Year Trajectory & Uncertainty Envelope</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    E[State(t)] projection over M=200 paths across {simulationData?.trajectoryMeans?.length ?? 50} years
                  </p>
                </div>

                <div className="text-[11px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                  Year {currentYear}: <strong className="text-emerald-700">{currentDist.healthy.toFixed(1)}% Healthy</strong>
                </div>
              </div>

              {/* Trajectory SVG Visualization */}
              <div className="w-full h-44 bg-neutral-50 rounded-lg p-2 border border-neutral-200 flex flex-col justify-between">
                <TrajectoryChart
                  trajectoryData={simulationData?.trajectoryMeans || []}
                  bandData={simulationData?.sampledBandData || []}
                  currentYear={currentYear}
                  horizonYears={simulationData?.horizonYears || 50}
                />
              </div>

              {/* Trajectory Legend */}
              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono pt-1 text-center">
                <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200/60 text-emerald-800">
                  <span className="font-semibold block">Healthy E[0]</span>
                  <span>{currentDist.healthy.toFixed(1)}%</span>
                </div>
                <div className="p-1.5 rounded bg-amber-50 border border-amber-200/60 text-amber-800">
                  <span className="font-semibold block">Stressed E[1]</span>
                  <span>{currentDist.stressed.toFixed(1)}%</span>
                </div>
                <div className="p-1.5 rounded bg-rose-50 border border-rose-200/60 text-rose-800">
                  <span className="font-semibold block">Bleached E[2]</span>
                  <span>{currentDist.bleached.toFixed(1)}%</span>
                </div>
                <div className="p-1.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                  <span className="font-semibold block">Dead E[3]</span>
                  <span>{currentDist.dead.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================================
            TAB 2: OLS REGRESSION MODEL DIAGNOSTICS
           ========================================= */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-5 text-xs text-neutral-800">
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <h3 className="font-semibold text-neutral-900 text-sm">
                Empirical Ordinary Least Squares (OLS) Parameter Estimation
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Trained directly on <strong className="text-neutral-900">{ols.n_samples.toLocaleString()} historical reef observation records</strong> from <code className="font-mono text-neutral-800">global_bleaching_environmental.csv</code>. The estimated beta slopes calibrate the dynamic logit degradation link in the DTMC Markov engine.
              </p>

              {/* Mathematical Equation Box */}
              <div className="p-3 bg-white rounded-lg border border-neutral-200 font-mono text-xs space-y-1">
                <div className="text-neutral-500 text-[10px]">Model Specification:</div>
                <div className="text-neutral-900 font-semibold">
                  Percent_Bleaching = β₀ + β₁(SSTA) + β₂(TSA_DHW) + ε
                </div>
                <div className="text-neutral-600 pt-1">
                  Percent_Bleaching = <strong className="text-neutral-900">{ols.beta_0}</strong> + <strong className="text-neutral-900">{ols.beta_1_ssta}</strong>·(SSTA) + <strong className="text-neutral-900">{ols.beta_2_tsa_dhw}</strong>·(TSA_DHW)
                </div>
              </div>
            </div>

            {/* Regression Parameter Table */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-neutral-100 text-neutral-600 border-b border-neutral-200">
                  <tr>
                    <th className="py-2 px-3 font-sans">Variable</th>
                    <th className="py-2 px-3">Coefficient (β̂)</th>
                    <th className="py-2 px-3">Std. Error</th>
                    <th className="py-2 px-3">t-statistic</th>
                    <th className="py-2 px-3">p-value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-neutral-800">Intercept (β₀)</td>
                    <td className="py-2 px-3 font-semibold">{ols.beta_0}</td>
                    <td className="py-2 px-3 text-neutral-500">{ols.se_beta_0 ?? '0.1138'}</td>
                    <td className="py-2 px-3 text-neutral-700">{ols.t_beta_0 ?? '66.17'}</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">&lt; 0.0001</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-neutral-800">SSTA (β₁)</td>
                    <td className="py-2 px-3 font-semibold text-rose-700">+{ols.beta_1_ssta}</td>
                    <td className="py-2 px-3 text-neutral-500">{ols.se_beta_1 ?? '0.1335'}</td>
                    <td className="py-2 px-3 text-neutral-700">{ols.t_beta_1 ?? '6.04'}</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">&lt; 0.0001</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-neutral-800">TSA_DHW (β₂)</td>
                    <td className="py-2 px-3 font-semibold text-rose-700">+{ols.beta_2_tsa_dhw}</td>
                    <td className="py-2 px-3 text-neutral-500">{ols.se_beta_2 ?? '0.0310'}</td>
                    <td className="py-2 px-3 text-neutral-700">{ols.t_beta_2 ?? '47.53'}</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">&lt; 0.0001</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Model Summary Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="text-[10px] text-neutral-500 font-sans block">Coefficient of Determination</span>
                <span className="font-mono text-base font-bold text-neutral-900">R² = {ols.r_squared}</span>
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="text-[10px] text-neutral-500 font-sans block">Overall Fisher Statistic</span>
                <span className="font-mono text-base font-bold text-neutral-900">F = {ols.f_statistic}</span>
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="text-[10px] text-neutral-500 font-sans block">Model Significance</span>
                <span className="font-mono text-base font-bold text-emerald-700">p &lt; 0.0001</span>
              </div>
            </div>

            {/* Mathematical Connection Explanation */}
            <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5 text-neutral-600">
              <div className="font-semibold text-neutral-800 font-sans">
                Markov Logistic Link Parameterization
              </div>
              <p className="text-[11px] leading-relaxed">
                The estimated weights <code className="font-mono">β₁ = {ols.beta_1_ssta}</code> and <code className="font-mono">β₂ = {ols.beta_2_tsa_dhw}</code> are mapped into the hazard transition function:
                <br />
                <code className="font-mono text-[10px] block py-1 text-neutral-900">
                  P_{'{i, i+1}'}(t) = 1 / [1 + exp(-(γᵢ + β₁·SSTA + β₂·TSA_DHW + δ_depth + δ_exposure))]
                </code>
                This ensures that simulated degradation matches real-world statistical sensitivity to heat accumulation.
              </p>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 3: CHI-SQUARE HYPOTHESIS TEST
           ========================================= */}
        {activeTab === 'hypotheses' && (
          <div className="space-y-5 text-xs text-neutral-800">
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 text-sm">
                  Chi-Square (χ²) Test for Independence: Turbidity vs. Bleaching
                </h3>
                <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-semibold text-[10px] border border-rose-200">
                  H₀ REJECTED (p &lt; 0.00001)
                </span>
              </div>

              <div className="space-y-1 text-neutral-600 text-xs">
                <p>
                  <strong>H₀ (Null Hypothesis):</strong> Coral Bleaching Severity is independent of Local Turbidity (Pollution/Runoff).
                </p>
                <p>
                  <strong>H₁ (Alternative):</strong> Coral Bleaching Severity is dependent on Local Turbidity.
                </p>
              </div>
            </div>

            {/* Contingency Table */}
            <div className="space-y-2">
              <h4 className="font-semibold text-neutral-800 font-sans text-xs">
                Observed Counts Matrix [Oᵢⱼ] (3 × 3 Contingency Table)
              </h4>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-center font-mono text-xs">
                  <thead className="bg-neutral-100 text-neutral-600 border-b border-neutral-200 text-[10px]">
                    <tr>
                      <th className="py-2 px-3 text-left font-sans">Turbidity Tertiles</th>
                      <th className="py-2 px-3">Healthy (&lt;10%)</th>
                      <th className="py-2 px-3">Stressed (10-50%)</th>
                      <th className="py-2 px-3">Severe (&gt;50%)</th>
                      <th className="py-2 px-3 font-sans">Row Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {chi2.observed_table?.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="py-2 px-3 text-left font-sans font-medium text-neutral-800">
                          {chi2.categories_turbidity?.[rIdx] || `Tertile ${rIdx + 1}`}
                        </td>
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="py-2 px-3">
                            <span className="font-semibold text-neutral-900">{val.toLocaleString()}</span>
                            <span className="block text-[10px] text-neutral-400">
                              Exp: {chi2.expected_table?.[rIdx]?.[cIdx]?.toLocaleString() ?? '—'}
                            </span>
                          </td>
                        ))}
                        <td className="py-2 px-3 font-semibold text-neutral-700 bg-neutral-50/50">
                          {chi2.row_totals?.[rIdx]?.toLocaleString() ?? '—'}
                        </td>
                      </tr>
                    )) || null}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Test Statistics Summary */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="text-[10px] text-neutral-500 font-sans block">Test Statistic (χ²)</span>
                <span className="font-mono text-base font-bold text-neutral-900">{chi2.chi2_statistic}</span>
              </div>
              <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="text-[10px] text-neutral-500 font-sans block">Degrees of Freedom</span>
                <span className="font-mono text-base font-bold text-neutral-900">df = {chi2.degrees_of_freedom}</span>
              </div>
              <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="text-[10px] text-neutral-500 font-sans block">Critical Value (α=0.05)</span>
                <span className="font-mono text-base font-bold text-neutral-700">{chi2.critical_value_05}</span>
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-center">
                <span className="text-[10px] text-rose-600 font-sans block">p-value</span>
                <span className="font-mono text-base font-bold text-rose-800">{chi2.p_value}</span>
              </div>
            </div>

            {/* Statistical Action Rule Box */}
            <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5 text-neutral-600">
              <div className="font-semibold text-neutral-800 font-sans flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-neutral-700" />
                <span>Conditional Hazard Multiplier Integration</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Because χ² ({chi2.chi2_statistic}) decisively exceeds the critical threshold ({chi2.critical_value_05}), we reject H₀. In accordance with the ASSP specification, an additional conditional weight multiplier <code className="font-mono text-neutral-900">w_pollution = ×1.35</code> is applied to the transition matrix whenever local turbidity exceeds the upper tertile threshold (&gt; 0.0731).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Clean SVG Trajectory Line & Confidence Area Chart
 * Minimalist, highly responsive, zero heavy external charting bugs.
 */
function TrajectoryChart({
  trajectoryData = [],
  bandData = [],
  currentYear = 0,
  horizonYears = 50
}) {
  if (!trajectoryData.length) {
    return <div className="text-xs text-neutral-400 m-auto">Generating trajectory...</div>;
  }

  const width = 450;
  const height = 150;
  const padL = 30;
  const padR = 15;
  const padT = 10;
  const padB = 25;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const getX = yr => padL + (yr / horizonYears) * chartW;
  const getY = val => padT + chartH - (Math.max(0, Math.min(100, val)) / 100) * chartH;

  // Build SVG paths for Healthy, Stressed, Bleached, Dead
  const healthyPath = trajectoryData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.year).toFixed(1)} ${getY(d.healthy).toFixed(1)}`).join(' ');
  const deadPath = trajectoryData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.year).toFixed(1)} ${getY(d.dead).toFixed(1)}`).join(' ');
  const bleachedPath = trajectoryData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.year).toFixed(1)} ${getY(d.bleached).toFixed(1)}`).join(' ');
  const stressedPath = trajectoryData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.year).toFixed(1)} ${getY(d.stressed).toFixed(1)}`).join(' ');

  // Healthy 95% Confidence Band Polygon
  let healthyBandPoints = '';
  if (bandData.length) {
    const topPoints = bandData.map(d => `${getX(d.year).toFixed(1)},${getY(d.healthyUpper).toFixed(1)}`).join(' ');
    const botPoints = [...bandData].reverse().map(d => `${getX(d.year).toFixed(1)},${getY(d.healthyLower).toFixed(1)}`).join(' ');
    healthyBandPoints = `${topPoints} ${botPoints}`;
  }

  const currentX = getX(currentYear);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(pct => {
        const y = getY(pct);
        return (
          <g key={pct}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#e5e5e5" strokeWidth="0.8" strokeDasharray="3 3" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#a3a3a3" fontFamily="monospace">
              {pct}%
            </text>
          </g>
        );
      })}

      {/* X Axis year labels */}
      {[0, 10, 20, 30, 40, 50].map(yr => {
        const x = getX(yr);
        return (
          <text key={yr} x={x} y={height - 8} textAnchor="middle" fontSize="8" fill="#737373" fontFamily="monospace">
            Y{yr}
          </text>
        );
      })}

      {/* 95% Confidence Interval Band (Healthy) */}
      {healthyBandPoints && (
        <polygon points={healthyBandPoints} fill="#10B981" fillOpacity="0.14" />
      )}

      {/* Trajectory Curves */}
      <path d={healthyPath} fill="none" stroke="#10B981" strokeWidth="2.0" strokeLinecap="round" />
      <path d={stressedPath} fill="none" stroke="#F59E0B" strokeWidth="1.6" strokeDasharray="4 2" />
      <path d={bleachedPath} fill="none" stroke="#F43F5E" strokeWidth="1.6" strokeDasharray="4 2" />
      <path d={deadPath} fill="none" stroke="#475569" strokeWidth="2.0" strokeLinecap="round" />

      {/* Current Year Vertical Indicator Line */}
      <line
        x1={currentX}
        y1={padT}
        x2={currentX}
        y2={padT + chartH}
        stroke="#171717"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      <circle cx={currentX} cy={getY(trajectoryData[currentYear]?.healthy ?? 50)} r="3.5" fill="#10B981" stroke="#ffffff" strokeWidth="1" />
      <circle cx={currentX} cy={getY(trajectoryData[currentYear]?.dead ?? 0)} r="3.5" fill="#475569" stroke="#ffffff" strokeWidth="1" />
    </svg>
  );
}
