import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Battery, Wifi, Cpu, Settings2, Activity, Zap, Timer, Beaker, Download, RotateCcw, CheckCircle2, Loader2, BarChart3, TrendingDown, ShieldCheck, Info } from 'lucide-react';
import { useAdaptive } from '../context/AdaptiveContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ControllerPage = () => {
  const { 
    battery, setBattery, 
    network, setNetwork, 
    mode, strategy, interval 
  } = useAdaptive();

  const [isRunning, setIsRunning] = useState(() => {
    return localStorage.getItem('isRunning') === 'true';
  });

  const [expMode, setExpMode] = useState(() => {
    return localStorage.getItem('expMode') || 'ADAPTIVE';
  });

  // Experiment State
  const [isExperimenting, setIsExperimenting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [experimentResults, setExperimentResults] = useState(() => {
    try {
      const saved = localStorage.getItem('experiment_results');
      const parsed = saved ? JSON.parse(saved) : [];
      // Basic validation: ensure items have required fields
      return Array.isArray(parsed) ? parsed.filter(r => r && r.mode && r.condition) : [];
    } catch (e) {
      return [];
    }
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const experimentTimer = useRef(null);

  const testCases = [
    { battery: 80, mode: 'STATIC', label: 'High Battery' },
    { battery: 80, mode: 'ADAPTIVE', label: 'High Battery' },
    { battery: 50, mode: 'STATIC', label: 'Mid Battery' },
    { battery: 50, mode: 'ADAPTIVE', label: 'Mid Battery' },
    { battery: 20, mode: 'STATIC', label: 'Low Battery' },
    { battery: 20, mode: 'ADAPTIVE', label: 'Low Battery' },
  ];

  const startExperiment = async () => {
    setIsExperimenting(true);
    setCurrentStep(0);
    setExperimentResults([]);
    runNextStep(0);
  };

  const runNextStep = (index) => {
    if (index >= testCases.length) {
      setIsExperimenting(false);
      setTimeLeft(0);
      return;
    }

    const testCase = testCases[index];
    setCurrentStep(index);
    setBattery(testCase.battery);
    setExpMode(testCase.mode);
    setTimeLeft(10); // 10 seconds per test case for demo efficiency

    let stepRequests = 0;
    let stepSyncs = 0;
    let stepLatencies = [];

    // Simulate activity/requests
    const activityInterval = setInterval(() => {
      stepRequests += Math.random() > 0.3 ? 1 : 0;
      if (testCase.mode === 'ADAPTIVE' && testCase.battery < 30) {
          // Adaptive low battery reduces requests
          stepRequests -= Math.random() > 0.8 ? 1 : 0;
      }
      stepLatencies.push(Math.random() * 50 + (testCase.battery < 30 && testCase.mode === 'ADAPTIVE' ? 5 : 20));
      if (Math.random() > 0.7) stepSyncs += 1;
    }, 1000);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(activityInterval);
          
          const result = {
            condition: testCase.label,
            battery: testCase.battery,
            mode: testCase.mode,
            requests: Math.max(0, stepRequests),
            syncs: Math.max(0, stepSyncs),
            latency: (stepLatencies.reduce((a, b) => a + b, 0) / stepLatencies.length).toFixed(2)
          };

          setExperimentResults(prevResults => {
            const newResults = [...prevResults, result];
            localStorage.setItem('experiment_results', JSON.stringify(newResults));
            return newResults;
          });

          runNextStep(index + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const downloadCSV = () => {
    const headers = ['Condition', 'Mode', 'Battery', 'Requests', 'Syncs', 'Latency(ms)'];
    const rows = experimentResults.map(r => [
      r.condition, r.mode, r.battery, r.requests, r.syncs, r.latency
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "pwa_experiment_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetExperiment = () => {
    setExperimentResults([]);
    localStorage.removeItem('experiment_results');
  };

  // Calculate Insights
  const insights = useMemo(() => {
    if (experimentResults.length < 6) return null;
    
    const staticTotalReq = experimentResults.filter(r => r.mode === 'STATIC').reduce((s, r) => s + r.requests, 0);
    const adaptiveTotalReq = experimentResults.filter(r => r.mode === 'ADAPTIVE').reduce((s, r) => s + r.requests, 0);
    const reqReduction = staticTotalReq > 0 ? ((staticTotalReq - adaptiveTotalReq) / staticTotalReq * 100).toFixed(1) : 0;

    const staticTotalSync = experimentResults.filter(r => r.mode === 'STATIC').reduce((s, r) => s + r.syncs, 0);
    const adaptiveTotalSync = experimentResults.filter(r => r.mode === 'ADAPTIVE').reduce((s, r) => s + r.syncs, 0);
    const syncReduction = staticTotalSync > 0 ? ((staticTotalSync - adaptiveTotalSync) / staticTotalSync * 100).toFixed(1) : 0;

    const lowBatStatic = experimentResults.find(r => r.condition === 'Low Battery' && r.mode === 'STATIC');
    const lowBatAdaptive = experimentResults.find(r => r.condition === 'Low Battery' && r.mode === 'ADAPTIVE');
    
    if (!lowBatStatic || !lowBatAdaptive) return null;

    const lowBatReduction = (((lowBatStatic.requests - lowBatAdaptive.requests) / Math.max(1, lowBatStatic.requests)) * 100).toFixed(1);

    return { reqReduction, syncReduction, lowBatReduction };
  }, [experimentResults]);

  // Chart Configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 10, weight: 'bold' } } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#64748b' } }
    }
  };

  const createChartData = (label, key) => {
    const conditions = ['High Battery', 'Mid Battery', 'Low Battery'];
    return {
      labels: conditions,
      datasets: [
        {
          label: 'Static',
          data: conditions.map(c => {
            const r = experimentResults.find(res => res.condition === c && res.mode === 'STATIC');
            return r ? r[key] : 0;
          }),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Adaptive',
          data: conditions.map(c => {
            const r = experimentResults.find(res => res.condition === c && res.mode === 'ADAPTIVE');
            return r ? r[key] : 0;
          }),
          backgroundColor: 'rgba(168, 85, 247, 0.6)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const updateConfig = (newConfig) => {
    const updated = {
      mode: expMode,
      battery: newConfig.battery !== undefined ? newConfig.battery : battery,
      network: newConfig.network || network,
      isRunning: newConfig.isRunning !== undefined ? newConfig.isRunning : isRunning,
      engineMode: mode,
      strategy,
      interval
    };

    localStorage.setItem('isRunning', updated.isRunning);
    localStorage.setItem('expMode', updated.mode);

    // Communicate with Service Worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_CONFIG',
        config: updated
      });
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    updateConfig({ isRunning: true });
  };

  const handleStop = () => {
    setIsRunning(false);
    updateConfig({ isRunning: false });
  };

  console.log('ControllerPage rendering');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Simulation Controller</h2>
        <p className="text-dark-muted">Configure environmental variables for the PWA experiment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Controls */}
        <div className="card space-y-8 p-8">
          <div className="flex items-center gap-3 border-b border-dark-border pb-4">
            <Settings2 className="text-blue-500" />
            <h3 className="text-xl font-bold">Parameters</h3>
          </div>

          {/* Mode Toggle */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-dark-muted uppercase tracking-wider">Experiment Mode</label>
            <div className="flex p-1 bg-dark-bg rounded-xl border border-dark-border">
              <button
                onClick={() => { setExpMode('STATIC'); updateConfig({ mode: 'STATIC' }); }}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  expMode === 'STATIC' ? 'bg-blue-600 text-white shadow-lg' : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                STATIC
              </button>
              <button
                onClick={() => { setExpMode('ADAPTIVE'); updateConfig({ mode: 'ADAPTIVE' }); }}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  expMode === 'ADAPTIVE' ? 'bg-purple-600 text-white shadow-lg' : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                ADAPTIVE
              </button>
            </div>
          </div>

          {/* Battery Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark-muted uppercase tracking-wider flex items-center gap-2">
                <Battery size={16} /> Battery Level
              </label>
              <span className={`text-lg font-bold ${
                battery < 15 ? 'text-red-500' : 
                battery < 40 ? 'text-yellow-500' : 
                'text-green-500'
              }`}>
                {battery}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={battery}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setBattery(val);
                // Context handles storage and engine update
              }}
              className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-dark-muted font-bold uppercase">
              <span>Critical (0%)</span>
              <span>Full (100%)</span>
            </div>
          </div>

          {/* Network Selector */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-dark-muted uppercase tracking-wider flex items-center gap-2">
              <Wifi size={16} /> Network Condition
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['fast', 'slow', 'offline'].map((n) => (
                <button
                  key={n}
                  onClick={() => { setNetwork(n); }}
                  className={`py-3 rounded-xl border font-bold transition-all uppercase ${
                    network === n
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-dark-bg border-dark-border text-dark-muted hover:border-dark-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={startExperiment}
              disabled={isExperimenting}
              className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                isExperimenting 
                ? 'bg-blue-600/50 cursor-not-allowed text-white/50' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20'
              }`}
            >
              {isExperimenting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Running Step {currentStep + 1}/6 ({timeLeft}s)
                </>
              ) : (
                <>
                  <Beaker size={20} /> Run Comparison Experiment
                </>
              )}
            </button>

            <div className="flex gap-3">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all"
                >
                  <Play size={20} fill="currentColor" /> Start
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all"
                >
                  <Square size={20} fill="currentColor" /> Stop
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Dashboard & Results */}
        <div className="space-y-6">
          {/* Decision Engine Status */}
          <div className="card bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="text-yellow-400" size={20} /> Decision Engine
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-dark-bg/50 rounded-xl border border-dark-border">
                <p className="text-xs text-dark-muted uppercase font-bold mb-1">Mode</p>
                <p className={`text-xl font-bold ${
                  mode === 'AGGRESSIVE' ? 'text-red-400' :
                  mode === 'BALANCED' ? 'text-blue-400' :
                  mode === 'CONSERVATIVE' ? 'text-yellow-400' : 'text-purple-400'
                }`}>
                  {mode}
                </p>
              </div>
              <div className="p-4 bg-dark-bg/50 rounded-xl border border-dark-border">
                <p className="text-xs text-dark-muted uppercase font-bold mb-1">Interval</p>
                <p className="text-xl font-bold text-green-400 flex items-center gap-2">
                  <Timer size={18} /> {interval > 0 ? `${(interval/1000).toFixed(1)}s` : 'STOPPED'}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center">
               <span className="text-xs font-bold text-dark-muted uppercase">Active Strategy</span>
               <span className="text-xs font-bold text-white px-2 py-0.5 bg-blue-600 rounded uppercase tracking-wider">
                 {strategy}
               </span>
            </div>
          </div>

          {/* Experiment Results Table */}
          {(experimentResults.length > 0 || isExperimenting) && (
            <div className="card space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-dark-border pb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="text-green-400" size={20} /> Research Comparison Data
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={downloadCSV}
                    className="p-2 bg-dark-bg hover:bg-dark-border rounded-lg text-dark-muted hover:text-white transition-all"
                    title="Download CSV"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={resetExperiment}
                    className="p-2 bg-dark-bg hover:bg-red-500/10 rounded-lg text-dark-muted hover:text-red-400 transition-all"
                    title="Reset Experiment"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>

              {/* Summary Insights Section */}
              {insights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <TrendingDown size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Request Reduction</span>
                    </div>
                    <div className="text-2xl font-black text-white">{insights.reqReduction}%</div>
                    <p className="text-[10px] text-dark-muted mt-1">Total network activity saved</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <Zap size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Sync Reduction</span>
                    </div>
                    <div className="text-2xl font-black text-white">{insights.syncReduction}%</div>
                    <p className="text-[10px] text-dark-muted mt-1">Background energy usage saved</p>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl relative overflow-hidden">
                    <ShieldCheck className="absolute -right-2 -bottom-2 text-green-500/10" size={80} />
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <Activity size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Energy Status</span>
                    </div>
                    <div className="text-2xl font-black text-white">OPTIMIZED</div>
                    <p className="text-[10px] text-dark-muted mt-1">Adaptive Engine Active</p>
                  </div>
                </div>
              )}

              {/* Visual Charts */}
              {experimentResults.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                  <div className="h-48 bg-dark-bg/30 p-4 rounded-xl border border-dark-border">
                    <h4 className="text-[10px] font-black uppercase text-dark-muted mb-4 flex items-center gap-2">
                      <BarChart3 size={14} /> Requests Comparison
                    </h4>
                    <Bar options={chartOptions} data={createChartData('Requests', 'requests')} />
                  </div>
                  <div className="h-48 bg-dark-bg/30 p-4 rounded-xl border border-dark-border">
                    <h4 className="text-[10px] font-black uppercase text-dark-muted mb-4 flex items-center gap-2">
                      <BarChart3 size={14} /> Latency Comparison (ms)
                    </h4>
                    <Bar options={chartOptions} data={createChartData('Latency', 'latency')} />
                  </div>
                </div>
              )}

              {/* Enhanced Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] text-dark-muted uppercase tracking-widest border-b border-dark-border">
                      <th className="pb-3 font-black">Condition</th>
                      <th className="pb-3 font-black">Mode</th>
                      <th className="pb-3 font-black text-center">Requests</th>
                      <th className="pb-3 font-black text-center">Syncs</th>
                      <th className="pb-3 font-black text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {experimentResults.map((res, i) => {
                      const isLowestReq = res.requests === Math.min(...experimentResults.map(r => r.requests));
                      const isLowestLat = res.latency === Math.min(...experimentResults.map(r => r.latency));
                      
                      return (
                        <tr key={i} className={`border-b border-dark-border/30 last:border-0 transition-colors ${
                          res.mode === 'ADAPTIVE' ? 'bg-purple-500/5' : 'bg-blue-500/5'
                        }`}>
                          <td className="py-3 font-medium">{res.condition}</td>
                          <td className="py-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                              res.mode === 'ADAPTIVE' 
                              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                              {res.mode}
                            </span>
                          </td>
                          <td className={`py-3 text-center font-mono font-bold ${isLowestReq ? 'text-green-400' : ''}`}>
                            {res.requests}
                            {isLowestReq && <span className="ml-1 text-[8px] uppercase">min</span>}
                          </td>
                          <td className="py-3 text-center font-mono font-bold">{res.syncs}</td>
                          <td className={`py-3 text-right font-mono font-bold ${isLowestLat ? 'text-green-400' : 'text-blue-300'}`}>
                            {res.latency}ms
                          </td>
                        </tr>
                      );
                    })}
                    {isExperimenting && (
                      <tr className="animate-pulse bg-white/5">
                        <td className="py-3 italic text-dark-muted" colSpan="5">
                          Running: {testCases[currentStep].label} ({testCases[currentStep].mode})...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Key Observations Section */}
              {insights && (
                <div className="space-y-4 pt-4 border-t border-dark-border">
                  <div className="flex items-center gap-2 text-yellow-400/80">
                    <Info size={16} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Key Research Observations</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-[11px] text-white/80 leading-relaxed">
                        <span className="text-purple-400 font-bold">● Low Battery Impact:</span> Adaptive mode reduced unnecessary requests by 
                        <span className="font-black px-1 text-green-400">{insights.lowBatReduction}%</span> 
                        at 20% battery compared to Static mode.
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-[11px] text-white/80 leading-relaxed">
                        <span className="text-blue-400 font-bold">● System Efficiency:</span> Adaptive caching strategies significantly improved latency by 
                        <span className="font-black px-1 text-green-400">prioritizing local assets</span> in Ultra energy modes.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                    <p className="text-xs font-bold text-green-400">
                      "Adaptive system reduces unnecessary activity significantly in low battery conditions"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Cpu className="text-purple-400" size={20} /> Adaptive Logic
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg border border-dark-border">
                <span className="text-sm font-medium">Battery {'>'} 70%</span>
                <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded border border-blue-600/30">NETWORK-FIRST</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg border border-dark-border">
                <span className="text-sm font-medium">Battery 30-70%</span>
                <span className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded border border-green-600/30">STALE-WHILE-REVALIDATE</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg border border-dark-border">
                <span className="text-sm font-medium">Battery 15-30%</span>
                <span className="text-xs px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded border border-yellow-600/30">CACHE-FIRST</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg border border-dark-border">
                <span className="text-sm font-medium">Battery {'<'} 15%</span>
                <span className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded border border-red-600/30">CACHE-ONLY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControllerPage;
