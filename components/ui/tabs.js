"use client";

import { createContext, useContext, useState } from "react";

const TabsContext = createContext({ value: "", onChange: () => {} });

export function Tabs({ defaultValue, value, onValueChange, children, className = "" }) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const active = value ?? internal;
  const onChange = onValueChange ?? setInternal;
  return (
    <TabsContext.Provider value={{ value: active, onChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-2xl p-1 ${className}`}
      style={{ background: "hsl(240 8% 8%)", border: "1px solid hsl(var(--border))" }}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = "" }) {
  const { value: active, onChange } = useContext(TabsContext);
  const isActive = active === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${className}`}
      style={
        isActive
          ? { background: "hsl(var(--card))", color: "hsl(var(--foreground))", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }
          : { color: "#9999aa" }
      }
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }) {
  const { value: active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}
