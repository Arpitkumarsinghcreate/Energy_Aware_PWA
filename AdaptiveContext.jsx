import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdaptiveContext = createContext();

export const useAdaptive = () => {
  const context = useContext(AdaptiveContext);
  if (!context) {
    throw new Error('useAdaptive must be used within an AdaptiveProvider');
  }
  return context;
};

export const AdaptiveProvider = ({ children }) => {
  const [battery, setBattery] = useState(() => {
    const saved = localStorage.getItem('battery');
    return saved ? parseInt(saved) : 100;
  });
  
  const [network, setNetwork] = useState(() => {
    return localStorage.getItem('network') || 'fast';
  });

  const [engineState, setEngineState] = useState({
    mode: 'BALANCED',
    strategy: 'network-first',
    interval: 5000
  });

  const runDecisionEngine = useCallback((bat, net) => {
    let mode = 'BALANCED';
    let strategy = 'network-first';
    let interval = 5000;

    // 1. Battery Logic
    if (bat > 70) {
      mode = 'AGGRESSIVE';
      interval = 1500; // 1-2 sec
    } else if (bat >= 40) {
      mode = 'BALANCED';
      interval = 4000; // 3-5 sec
    } else if (bat >= 15) {
      mode = 'CONSERVATIVE';
      interval = 8000; // 6-10 sec
      strategy = 'cache-first';
    } else {
      mode = 'ULTRA';
      interval = 20000; // 15+ sec
      strategy = 'cache-only';
    }

    // 2. Network Refinement
    if (net === 'slow') {
      interval *= 2; // Reduce frequency
      if (mode === 'AGGRESSIVE') strategy = 'network-first';
      else strategy = 'cache-first';
    } else if (net === 'offline') {
      interval = 0; // Stop requests
      strategy = 'cache-only';
    }

    return { mode, strategy, interval };
  }, []);

  useEffect(() => {
    const newState = runDecisionEngine(battery, network);
    setEngineState(newState);
    
    // Save to localStorage for persistence
    localStorage.setItem('battery', battery.toString());
    localStorage.setItem('network', network);
    localStorage.setItem('engine_mode', newState.mode);
  }, [battery, network, runDecisionEngine]);

  const value = {
    battery,
    setBattery,
    network,
    setNetwork,
    ...engineState
  };

  return (
    <AdaptiveContext.Provider value={value}>
      {children}
    </AdaptiveContext.Provider>
  );
};
