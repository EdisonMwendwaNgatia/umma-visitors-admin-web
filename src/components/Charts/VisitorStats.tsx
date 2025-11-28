import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Visitor } from '../../types';

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FFCC00'];

const VisitorStats: React.FC = () => {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const visitorsSnapshot = await getDocs(collection(db, 'visitors'));
      const visitors = visitorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Visitor[];

      // Process daily data
      const dailyStats: { [key: string]: number } = {};
      visitors.forEach(visitor => {
        const timeIn = visitor.timeIn instanceof Timestamp ? 
          visitor.timeIn.toDate() : new Date(visitor.timeIn);
        const dateKey = timeIn.toISOString().split('T')[0];
        
        dailyStats[dateKey] = (dailyStats[dateKey] || 0) + 1;
      });

      const dailyChartData = Object.entries(dailyStats)
        .map(([date, count]) => ({ date, visitors: count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7); // Last 7 days

      // Process type data
      const typeStats: { [key: string]: number } = {};
      visitors.forEach(visitor => {
        typeStats[visitor.visitorType] = (typeStats[visitor.visitorType] || 0) + 1;
      });

      const typeChartData = Object.entries(typeStats).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: count
      }));

      setDailyData(dailyChartData);
      setTypeData(typeChartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading charts...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Visitor Analytics
      </Typography>
      
      <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3}>
        <Paper sx={{ p: 3, flex: 2 }}>
          <Typography variant="h6" gutterBottom>
            Daily Visitors (Last 7 Days)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visitors" fill="#007AFF" name="Visitors" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Visitor Type Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => {
                  const pct = (percent ?? 0) as number;
                  return `${name} ${(pct * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default VisitorStats;