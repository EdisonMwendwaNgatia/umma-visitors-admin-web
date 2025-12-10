import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import StatCard from '../shared/StatCard';

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  adminCount: number;
  userCount: number;
  webUsers: number;
  mobileUsers: number;
  offlineUsers: number;
  activeToday: number;
}

interface RealTimeStats {
  connections: number;
  peakToday: number;
  avgSession: number;
}

interface UserStatsDashboardProps {
  stats: Stats;
  realTimeStats: RealTimeStats;
  loading: boolean;
}

const UserStatsDashboard: React.FC<UserStatsDashboardProps> = ({
  stats,
  realTimeStats,
  loading,
}) => (
  <>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
      <Box>
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered users"
          icon={<PersonIcon />}
          color="#007AFF"
        />
      </Box>
      <Box>
        <StatCard
          title="Online Now"
          value={stats.onlineUsers}
          subtitle="Active connections"
          icon={<CheckCircleIcon />}
          color="#10B981"
          progress={stats.totalUsers > 0 ? (stats.onlineUsers / stats.totalUsers) * 100 : 0}
        />
      </Box>
      <Box>
        <StatCard
          title="Active Today"
          value={stats.activeToday}
          subtitle="Users logged in today"
          icon={<CalendarTodayIcon />}
          color="#8B5CF6"
        />
      </Box>
      <Box>
        <StatCard
          title="Real-time"
          value={realTimeStats.connections}
          subtitle={`Peak: ${realTimeStats.peakToday}`}
          icon={<DeviceHubIcon />}
          color="#3B82F6"
        />
      </Box>
    </Box>

    <Card sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Platform Distribution
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ComputerIcon sx={{ color: '#3B82F6', mr: 1 }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                Web Users
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {stats.webUsers} ({stats.totalUsers > 0 ? Math.round((stats.webUsers / stats.totalUsers) * 100) : 0}%)
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.totalUsers > 0 ? (stats.webUsers / stats.totalUsers) * 100 : 0}
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: '#3B82F620',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#3B82F6',
                }
              }}
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhoneIphoneIcon sx={{ color: '#8B5CF6', mr: 1 }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                Mobile Users
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {stats.mobileUsers} ({stats.totalUsers > 0 ? Math.round((stats.mobileUsers / stats.totalUsers) * 100) : 0}%)
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.totalUsers > 0 ? (stats.mobileUsers / stats.totalUsers) * 100 : 0}
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: '#8B5CF620',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#8B5CF6',
                }
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  </>
);

export default UserStatsDashboard;