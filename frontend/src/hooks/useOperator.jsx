import React, { useState, useEffect, createContext, useContext } from 'react';

const OperatorContext = createContext(null);

export function OperatorProvider({ children }) {
  const [operator, setOperatorState] = useState(() => {
    return localStorage.getItem('glacierwatch_operator') || '';
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!operator) {
      setIsDialogOpen(true);
    }
  }, [operator]);

  const setOperator = (name) => {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem('glacierwatch_operator', trimmed);
      setOperatorState(trimmed);
      setIsDialogOpen(false);
    }
  };

  const changeOperator = () => {
    setIsDialogOpen(true);
  };

  return (
    <OperatorContext.Provider value={{ operator, setOperator, changeOperator, isDialogOpen, setIsDialogOpen }}>
      {children}
    </OperatorContext.Provider>
  );
}

export function useOperator() {
  const ctx = useContext(OperatorContext);
  if (!ctx) {
    throw new Error('useOperator must be used within OperatorProvider');
  }
  return ctx;
}
