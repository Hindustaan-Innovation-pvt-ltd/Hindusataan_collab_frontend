import React from "react";
import type { GraphEl } from "../types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GraphNodeProps {
  el: GraphEl;
  selected: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const GraphNode = React.memo(({ el, selected }: GraphNodeProps) => {
  const { w, h, graphData } = el;
  const sel = selected ? "#3742FA" : "transparent";

  const renderChart = () => {
    if (!graphData) return null;
    
    // Very basic dynamic rendering based on chartType
    const { chartType, labels = [], datasets = [] } = graphData;
    
    // Convert Chart.js style data to Recharts format
    const data = labels.map((label: string, index: number) => {
      const point: any = { name: label };
      datasets.forEach((ds: any, dsIndex: number) => {
        point[`Series${dsIndex}`] = ds.data[index] || 0;
      });
      return point;
    });

    if (chartType === "pie" || chartType === "doughnut") {
        const pieData = labels.map((label: string, index: number) => ({
            name: label,
            value: datasets[0]?.data[index] || 0
        }));
        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={h/3} dataKey="value" label>
                        {pieData.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    if (chartType === "line") {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {datasets.map((ds: any, index: number) => (
                        <Line key={index} type="monotone" dataKey={`Series${index}`} stroke={COLORS[index % COLORS.length]} name={ds.label} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    }

    // Default to Bar Chart
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {datasets.map((ds: any, index: number) => (
                    <Bar key={index} dataKey={`Series${index}`} fill={COLORS[index % COLORS.length]} name={ds.label} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
  };

  return (
    <div data-el-id={el.id} className="absolute group bg-white rounded-lg shadow-sm border border-gray-200" style={{ left: el.x, top: el.y, width: w, height: h, cursor: "grab" }}>
      {selected && (
        <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ border: `2px dashed ${sel}`, margin: "-2px" }} />
      )}
      
      {/* Title Bar */}
      <div className="h-8 border-b border-gray-100 flex items-center justify-center bg-gray-50 rounded-t-lg font-semibold text-gray-700 text-sm">
         {graphData?.title || "Generated Graph"}
      </div>

      {/* Chart Area */}
      <div style={{ width: '100%', height: 'calc(100% - 32px)' }} className="p-2">
          {renderChart()}
      </div>
    </div>
  );
});

export default GraphNode;
