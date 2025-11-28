import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Fade,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  DirectionsWalk as WalkIcon,
  DirectionsCar as CarIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { collection, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Stats, Visitor } from '../types';
import VisitorStats from '../components/Charts/VisitorStats';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalVisitors: 0,
    todayVisitors: 0,
    activeVisitors: 0,
    overdueVisitors: 0,
    vehicleVisitors: 0,
    footVisitors: 0,
    checkedOutVisitors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [allVisitors, setAllVisitors] = useState<Visitor[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'visitors'), (snapshot) => {
      const visitors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Visitor[];
      
      setAllVisitors(visitors);
      calculateStats(visitors);
    });

    return unsubscribe;
  }, []);

  const calculateStats = (visitors: Visitor[]) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisitors = visitors.filter(visitor => {
      const timeIn = visitor.timeIn instanceof Timestamp ? 
        visitor.timeIn.toDate() : new Date(visitor.timeIn);
      return timeIn >= today;
    });

    const activeVisitors = visitors.filter(visitor => !visitor.isCheckedOut);

    // UPDATED: 12-hour overdue logic (same as mobile app)
    const overdueVisitors = visitors.filter(visitor => {
      if (visitor.isCheckedOut) return false;
      
      const timeIn = visitor.timeIn instanceof Timestamp ? 
        visitor.timeIn.toDate() : new Date(visitor.timeIn);
      
      const hoursSinceCheckIn = (now.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
      return hoursSinceCheckIn > 12; // More than 12 hours
    });

    const vehicleVisitors = visitors.filter(v => v.visitorType === 'vehicle').length;
    const footVisitors = visitors.filter(v => v.visitorType === 'foot').length;
    const checkedOutVisitors = visitors.filter(v => v.isCheckedOut).length;

    setStats({
      totalVisitors: visitors.length,
      todayVisitors: todayVisitors.length,
      activeVisitors: activeVisitors.length,
      overdueVisitors: overdueVisitors.length,
      vehicleVisitors,
      footVisitors,
      checkedOutVisitors,
    });
    setLoading(false);
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: number;
  }> = ({ title, value, subtitle, icon, color, trend }) => (
    <Fade in={!loading} timeout={500}>
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
          border: `1px solid ${color}20`,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between">
            <Box flex={1}>
              <Typography 
                color="text.secondary" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h3" 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  color: color,
                  mb: 1
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  {subtitle}
                </Typography>
              )}
              {trend !== undefined && (
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`+${trend}%`}
                  size="small"
                  sx={{
                    mt: 1,
                    backgroundColor: `${color}15`,
                    color: color,
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: color,
                    }
                  }}
                />
              )}
            </Box>
            <Box 
              sx={{ 
                color: color,
                fontSize: 48,
                ml: 2,
                opacity: 0.8
              }}
            >
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  const QuickStatsCard: React.FC = () => (
    <Fade in={!loading} timeout={700}>
      <Card 
        sx={{ 
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ fontWeight: 700, mb: 3 }}
          >
            Quick Overview
          </Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }} gap={3}>
            <Box>
              <CarIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.vehicleVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Vehicle
              </Typography>
            </Box>
            <Box>
              <WalkIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.footVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                On Foot
              </Typography>
            </Box>
            <Box>
              <CheckCircleIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.checkedOutVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Checked Out
              </Typography>
            </Box>
            <Box>
              <ScheduleIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.todayVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Today
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#10B981' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #1F2937 0%, #4B5563 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dashboard Overview
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Welcome back! Here's what's happening with your visitors today.
        </Typography>
      </Box>

      {/* Main Stats Grid */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={3} sx={{ mb: 4 }}>
        <Box>
          <StatCard
            title="Total Visitors"
            value={stats.totalVisitors}
            subtitle="All time visitors"
            icon={<PeopleIcon />}
            color="#007AFF"
            trend={12}
          />
        </Box>
        <Box>
          <StatCard
            title="Active Now"
            value={stats.activeVisitors}
            subtitle="Currently checked in"
            icon={<WalkIcon />}
            color="#34C759"
          />
        </Box>
        <Box>
          <StatCard
            title="Today"
            value={stats.todayVisitors}
            subtitle="Check-ins today"
            icon={<ScheduleIcon />}
            color="#FF9500"
            trend={8}
          />
        </Box>
        <Box>
          <StatCard
            title="Overdue Alerts"
            value={stats.overdueVisitors}
            subtitle="12+ hours checked in"
            icon={<WarningIcon />}
            color="#FF3B30"
          />
        </Box>
      </Box>

      {/* Quick Stats Card */}
      <Box sx={{ mb: 4 }}>
        <QuickStatsCard />
      </Box>

      {/* Charts Section */}
      <Box sx={{ mb: 4 }}>
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Visitor Analytics
            </Typography>
            <VisitorStats />
          </CardContent>
        </Card>
      </Box>

      {/* Recent Activity Preview */}
      <Fade in={!loading} timeout={900}>
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Recent Activity
              </Typography>
              <Chip 
                label={`${allVisitors.filter(v => !v.isCheckedOut).length} Active`}
                color="primary"
                variant="outlined"
              />
            </Box>
            
            {allVisitors
              .filter(visitor => !visitor.isCheckedOut)
              .sort((a, b) => {
                const timeA = a.timeIn instanceof Timestamp ? a.timeIn.toDate() : new Date(a.timeIn);
                const timeB = b.timeIn instanceof Timestamp ? b.timeIn.toDate() : new Date(b.timeIn);
                return timeB.getTime() - timeA.getTime();
              })
              .slice(0, 5)
              .map((visitor, index) => {
                const timeIn = visitor.timeIn instanceof Timestamp ? 
                  visitor.timeIn.toDate() : new Date(visitor.timeIn);
                const hoursSinceCheckIn = (new Date().getTime() - timeIn.getTime()) / (1000 * 60 * 60);
                
                return (
                  <Box
                    key={visitor.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 2,
                      borderBottom: index < 4 ? '1px solid' : 'none',
                      borderColor: 'divider'
                    }}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {visitor.visitorName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {visitor.visitorType === 'vehicle' ? '🚗 Vehicle' : '🚶 On Foot'} • 
                        Checked in at {timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    {hoursSinceCheckIn > 12 && (
                      <Chip
                        icon={<WarningIcon />}
                        label="Overdue"
                        color="error"
                        size="small"
                        variant="filled"
                      />
                    )}
                  </Box>
                );
              })}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default Dashboard;