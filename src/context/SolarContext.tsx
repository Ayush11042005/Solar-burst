import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppState {
  status: 'idle' | 'processing' | 'alert';
  alertMessage: string;
}

interface AppContextType extends AppState {
  setStatus: (status: 'idle' | 'processing' | 'alert', message?: string) => void;
}

const SolarContext = createContext<AppContextType | null>(null);

export function SolarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    status: 'idle',
    alertMessage: '',
  });

  const setStatus = useCallback((status: 'idle' | 'processing' | 'alert', message = '') => {
    setState({ status, alertMessage: message });
  }, []);

  return (
    <SolarContext.Provider value={{ ...state, setStatus }}>
      {children}
    </SolarContext.Provider>
  );
}

export function useSolar() {
  const ctx = useContext(SolarContext);
  if (!ctx) throw new Error('useSolar must be used within SolarProvider');
  return ctx;
}
