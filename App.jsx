import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Settings, BarChart3, WifiOff, Battery, Zap, Activity, ShieldAlert, Cpu } from 'lucide-react';
import FeedPage from './pages/FeedPage';
import ControllerPage from './pages/ControllerPage';
import MonitorPage from './pages/MonitorPage';
import { useEffect, useState } from 'react';
import { useAdaptive } from './context/AdaptiveContext';

function App() {
  const { mode, strategy, interval } = useAdaptive();
  console.log('App rendering, current path:', window.location.pathname);
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleClick = (e) => {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        console.log('Link clicked:', (e.target.href || e.target.closest('a').href));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  const navItems = [
    { path: '/', label: 'Feed', icon: <Home size={20} /> },
    { path: '/controller', label: 'Controller', icon: <Settings size={20} /> },
    { path: '/monitor', label: 'Monitor', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-dark-bg text-dark-text overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass flex flex-col border-r border-dark-border">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            SmartHub
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'hover:bg-dark-border text-dark-muted hover:text-dark-text'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto space-y-3">
          {/* Adaptive Mode Indicator */}
          <div className={`px-4 py-3 rounded-xl border transition-all duration-500 ${
            mode === 'AGGRESSIVE' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            mode === 'BALANCED' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
            mode === 'CONSERVATIVE' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
            'bg-purple-500/10 border-purple-500/30 text-purple-400'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Engine: {mode}</span>
            </div>
            <div className="text-[10px] opacity-70 flex flex-col gap-0.5">
              <span>Strategy: {strategy}</span>
              <span>Interval: {interval > 0 ? `${(interval/1000).toFixed(1)}s` : 'Paused'}</span>
            </div>
          </div>

          {isOffline && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl mb-4">
              <WifiOff size={18} />
              <span className="text-sm font-medium">Offline Mode</span>
            </div>
          )}
          
          <div className="px-4 py-3 bg-dark-border/50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-green-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-dark-muted">System Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#020617] relative">
        <div className="max-w-7xl mx-auto p-8">
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/controller" element={<ControllerPage />} />
            <Route path="/monitor" element={<MonitorPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
