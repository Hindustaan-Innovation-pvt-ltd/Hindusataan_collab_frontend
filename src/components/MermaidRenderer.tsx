import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

interface MermaidRendererProps {
  chart: string;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        setError("");
        // Generate a unique ID for the SVG
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to render chart");
        }
      }
    };

    if (chart) {
      renderChart();
    }

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return <div className="text-red-500 text-xs p-2 bg-red-50 rounded border border-red-200">Error: {error}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="mermaid-wrapper w-full overflow-x-auto flex justify-center py-2 bg-white rounded-lg shadow-sm border border-gray-100 my-2"
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
};
