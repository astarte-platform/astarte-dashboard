import React, { createContext, useContext, useEffect, useState } from 'react';
import monaco from '@monaco-editor/react';

interface MonacoContextType {
  monaco: typeof monaco | null;
}

const MonacoContext = createContext<MonacoContextType | undefined>(undefined);

export const MonacoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [monacoInstance, setMonacoInstance] = useState<typeof monaco | null>(null);

  useEffect(() => {
    if (!monacoInstance) {
      setMonacoInstance(monaco);
    }
  }, [monacoInstance]);

  return (
    <MonacoContext.Provider value={{ monaco: monacoInstance }}>{children}</MonacoContext.Provider>
  );
};

export const useMonacoContext = (): MonacoContextType => {
  const context = useContext(MonacoContext);
  if (!context) {
    throw new Error('useMonacoContext must be used within a MonacoProvider');
  }
  return context;
};
