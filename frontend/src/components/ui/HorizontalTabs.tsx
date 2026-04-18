import * as React from 'react';
import { cn } from '../../lib/utils';

interface TabsContextProps {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextProps | undefined>(undefined);

export function Tabs({ value, onValueChange, children, className }: { 
  value: string; 
  onValueChange: (value: string) => void; 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex gap-2", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string; key?: string | number }) {
  const context = React.useContext(TabsContext);
  if (!context) return null;

  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={cn(
        "px-4 py-2 text-sm transition-all",
        isActive ? "bg-white text-ns-blue border-ns-blue font-bold" : "text-ns-text-muted hover:text-ns-navy",
        className
      )}
      data-state={isActive ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string; key?: string | number }) {
  const context = React.useContext(TabsContext);
  if (!context) return null;

  if (context.value !== value) return null;

  return (
    <div className={cn("w-full animate-in fade-in duration-300", className)}>
      {children}
    </div>
  );
}
