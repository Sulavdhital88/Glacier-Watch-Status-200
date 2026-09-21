import React, { createContext, useContext, useState } from 'react';
import { DEMO_PREDICTIONS } from '../data/demoData';

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [activeScenario, setActiveScenario] = useState('DECREASING');

  const scenarioData = DEMO_PREDICTIONS[activeScenario] || DEMO_PREDICTIONS.DECREASING;

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        activeScenario,
        setActiveScenario,
        scenarioData,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return ctx;
}
