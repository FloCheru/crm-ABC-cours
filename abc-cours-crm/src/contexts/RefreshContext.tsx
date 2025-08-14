import React, { createContext, useContext, useState, ReactNode } from "react";

interface RefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    console.log("🔄 Context: Déclenchement du rafraîchissement");
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
};
