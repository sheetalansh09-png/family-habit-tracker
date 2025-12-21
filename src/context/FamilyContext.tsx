import { createContext, useContext, useState, ReactNode } from 'react';
import { Family } from '../types';

interface FamilyContextType {
  currentFamily: Family | null;
  setCurrentFamily: (family: Family | null) => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);

  return (
    <FamilyContext.Provider value={{ currentFamily, setCurrentFamily }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within FamilyProvider');
  }
  return context;
}
