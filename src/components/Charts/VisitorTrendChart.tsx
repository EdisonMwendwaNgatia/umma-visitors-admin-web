// components/Charts/VisitorTrendChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VisitorTrendChartProps {
  data: { date: string; count: number }[];
}

const VisitorTrendChart: React.FC<VisitorTrendChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis />
        <Tooltip 
          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="#8884d8" 
          strokeWidth={2}
          dot={{ fill: '#8884d8' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default VisitorTrendChart;