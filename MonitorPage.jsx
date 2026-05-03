import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdaptive } from '../context/AdaptiveContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Download, Trash2, RefreshCcw, LayoutGrid, List } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MonitorPage = () => {
  const { interval, mode } = useAdaptive();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('GRID'); // GRID or LIST

  const fetchLogs = async () => {
    // Skip if engine is paused (interval 0)
    if (interval === 0) return;
    
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    if (interval > 0) {
      const timer = setInterval(fetchLogs, interval);
      return () => clearInterval(timer);
    }
  }, [interval]);

  const clearLogs = async () => {
    try {
      await axios.delete('http://localhost:8080/api/logs');
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const downloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "experiment_logs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const totalRequests = logs.reduce((sum, log) => sum + (log.requests || 0), 0);
  const totalSyncs = logs.reduce((sum, log) => sum + (log.syncEvents || 0), 0);
  const avgLatency = logs.length > 0 
    ? (logs.reduce((sum, log) => sum + (log.avgLatency || 0), 0) / logs.length).toFixed(2) 
    : 0;

  const requestsVsTimeData = {
    labels: logs.map(l => new Date(l.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Latency (ms)',
      data: logs.map(l => l.latency),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const batteryVsRequestsData = {
    labels: logs.map(l => l.battery + '%'),
    datasets: [{
      label: 'Battery vs Latency',
      data: logs.map(l => l.latency),
      backgroundColor: logs.map(l => l.battery > 50 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
      borderColor: logs.map(l => l.battery > 50 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'),
      borderWidth: 1
    }]
  };

  const modeComparisonData = {
    labels: ['AGGRESSIVE', 'BALANCED', 'CONSERVATIVE', 'ULTRA'],
    datasets: [{
      label: 'Avg Latency by Mode',
      data: ['AGGRESSIVE', 'BALANCED', 'CONSERVATIVE', 'ULTRA'].map(m => {
        const modeLogs = logs.filter(l => l.mode === m);
        return modeLogs.length > 0 
          ? modeLogs.reduce((s, l) => s + l.latency, 0) / modeLogs.length 
          : 0;
      }),
      backgroundColor: [
        'rgba(59, 130, 246, 0.5)',
        'rgba(34, 197, 94, 0.5)',
        'rgba(234, 179, 8, 0.5)',
        'rgba(239, 68, 68, 0.5)'
      ],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: 'rgb(148, 163, 184)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgb(148, 163, 184)' }
      }
    }
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Monitoring Dashboard</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-dark-muted">Real-time system metrics</p>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
              interval === 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${interval === 0 ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`}></span>
              Polling: {interval > 0 ? `${(interval/1000).toFixed(1)}s` : 'OFF'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={fetchLogs} className="p-2 bg-dark-card border border-dark-border rounded-lg text-dark-muted hover:text-white transition-colors">
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={downloadData} className="btn-secondary flex items-center gap-2">
            <Download size={18} /> Download JSON
          </button>
          <button onClick={clearLogs} className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-2">
            <Trash2 size={18} /> Reset
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: totalRequests, color: 'text-blue-400' },
          { label: 'Sync Count', value: totalSyncs, color: 'text-purple-400' },
          { label: 'Avg Latency', value: avgLatency + 'ms', color: 'text-green-400' },
          { label: 'Data Points', value: logs.length, color: 'text-orange-400' }
        ].map((m, i) => (
          <div key={i} className="card p-6 border-l-4 border-l-blue-500">
            <p className="text-xs font-bold uppercase tracking-wider text-dark-muted mb-2">{m.label}</p>
            <p className={`text-3xl font-black ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6 space-y-4 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold">Latency vs Time</h3>
          <div className="flex-1">
            <Line data={requestsVsTimeData} options={chartOptions} />
          </div>
        </div>
        
        <div className="card p-6 space-y-4 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold">Latency by Battery Level</h3>
          <div className="flex-1">
            <Bar data={batteryVsRequestsData} options={chartOptions} />
          </div>
        </div>

        <div className="card p-6 space-y-4 h-[400px] flex flex-col lg:col-span-2">
          <h3 className="text-lg font-bold">Mode Performance Comparison</h3>
          <div className="flex-1">
            <Bar data={modeComparisonData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-dark-border flex justify-between items-center">
          <h3 className="font-bold">Raw Logs</h3>
          <div className="flex p-1 bg-dark-bg rounded-lg border border-dark-border">
            <button onClick={() => setView('GRID')} className={`p-1 rounded ${view === 'GRID' ? 'bg-dark-border text-white' : 'text-dark-muted'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('LIST')} className={`p-1 rounded ${view === 'LIST' ? 'bg-dark-border text-white' : 'text-dark-muted'}`}>
              <List size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-bg text-dark-muted text-xs uppercase font-bold border-b border-dark-border">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Battery</th>
                <th className="px-6 py-4">Latency</th>
                <th className="px-6 py-4">Requests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {logs.slice().reverse().map((log, i) => (
                <tr key={i} className="hover:bg-dark-border/30 transition-colors text-sm">
                  <td className="px-6 py-4 text-dark-muted">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      log.mode === 'AGGRESSIVE' ? 'bg-blue-600/20 text-blue-400' :
                      log.mode === 'BALANCED' ? 'bg-green-600/20 text-green-400' :
                      log.mode === 'CONSERVATIVE' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-red-600/20 text-red-400'
                    }`}>
                      {log.mode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-dark-bg rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${log.battery > 50 ? 'bg-green-500' : log.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${log.battery}%` }}
                        />
                      </div>
                      <span>{log.battery}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">{log.latency.toFixed(2)}ms</td>
                  <td className="px-6 py-4">{log.requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonitorPage;
