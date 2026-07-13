import { createContext, useContext, useState } from "react";

export type WorkspaceLayout = "horizontal" | "vertical";

interface WorkspaceThemeContextType {
  layout: WorkspaceLayout;
  setLayout: (layout: WorkspaceLayout) => void;
}

const WorkspaceThemeContext = createContext<WorkspaceThemeContextType | undefined>(undefined);

export function WorkspaceThemeProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayoutState] = useState<WorkspaceLayout>(() => {
    const saved = localStorage.getItem("workspace-layout");
    if (saved) return saved as WorkspaceLayout;
    
    // Default to vertical on mobile
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "vertical";
    }
    
    return "horizontal";
  });

  const setLayout = (newLayout: WorkspaceLayout) => {
    setLayoutState(newLayout);
    localStorage.setItem("workspace-layout", newLayout);
  };

  return (
    <WorkspaceThemeContext.Provider value={{ layout, setLayout }}>
      {children}
    </WorkspaceThemeContext.Provider>
  );
}

export const useWorkspaceTheme = () => {
  const context = useContext(WorkspaceThemeContext);
  if (context === undefined) {
    throw new Error("useWorkspaceTheme must be used within a WorkspaceThemeProvider");
  }
  return context;
};
