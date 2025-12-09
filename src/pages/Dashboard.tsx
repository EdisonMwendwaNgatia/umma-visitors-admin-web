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
  Tooltip,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import WalkIcon from '@mui/icons-material/DirectionsWalk';
import CarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import TransgenderIcon from '@mui/icons-material/Transgender';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TodayIcon from '@mui/icons-material/Today';
import { collection, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Stats, Visitor } from '../types';
import VisitorStats from '../components/Charts/VisitorStats';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalVisitors: 0,
    todayVisitors: 0,
    activeVisitors: 0,
    overdueVisitors: 0,
    vehicleVisitors: 0,
    footVisitors: 0,
    checkedOutVisitors: 0,
    maleVisitors: 0,
    femaleVisitors: 0,
    otherGenderVisitors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [allVisitors, setAllVisitors] = useState<Visitor[]>([]);
  const [todayVisitors, setTodayVisitors] = useState<Visitor[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

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

    const todayVisitorsList = visitors.filter(visitor => {
      const timeIn = visitor.timeIn instanceof Timestamp ? 
        visitor.timeIn.toDate() : new Date(visitor.timeIn);
      return timeIn >= today;
    });
    setTodayVisitors(todayVisitorsList);

    const activeVisitorsList = visitors.filter(visitor => !visitor.isCheckedOut);
    setActiveVisitors(activeVisitorsList);

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
    
    // Gender stats
    const maleVisitors = visitors.filter(v => v.gender?.toLowerCase() === 'male').length;
    const femaleVisitors = visitors.filter(v => v.gender?.toLowerCase() === 'female').length;
    const otherGenderVisitors = visitors.filter(v => 
      v.gender && 
      v.gender.toLowerCase() !== 'male' && 
      v.gender.toLowerCase() !== 'female' && 
      v.gender !== 'N/A'
    ).length;

    setStats({
      totalVisitors: visitors.length,
      todayVisitors: todayVisitorsList.length,
      activeVisitors: activeVisitorsList.length,
      overdueVisitors: overdueVisitors.length,
      vehicleVisitors,
      footVisitors,
      checkedOutVisitors,
      maleVisitors,
      femaleVisitors,
      otherGenderVisitors,
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
    onClick?: () => void;
    tooltipContent?: React.ReactNode;
  }> = ({ title, value, subtitle, icon, color, trend, onClick, tooltipContent }) => {
    const cardContent = (
      <Card 
        onClick={onClick}
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
          border: `1px solid ${color}20`,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': {
            transform: onClick ? 'translateY(-4px)' : 'none',
            boxShadow: onClick ? '0 8px 30px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.08)',
            border: onClick ? `1px solid ${color}40` : `1px solid ${color}20`,
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
    );

    if (tooltipContent) {
      return (
        <Tooltip 
          title={tooltipContent}
          placement="top"
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={3000}
          componentsProps={{
            tooltip: {
              sx: {
                backgroundColor: 'white',
                color: 'text.primary',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                maxWidth: 400,
                border: '1px solid',
                borderColor: 'divider',
                p: 2,
              }
            },
            arrow: {
              sx: {
                color: 'white',
              }
            }
          }}
        >
          <div>
            <Fade in={!loading} timeout={500}>
              {cardContent}
            </Fade>
          </div>
        </Tooltip>
      );
    }

    return <Fade in={!loading} timeout={500}>{cardContent}</Fade>;
  };

  // Tooltip content components
  const TotalVisitorsTooltip = () => (
    <Paper elevation={0} sx={{ p: 2, minWidth: 280 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#007AFF' }}>
        Visitor Demographics
      </Typography>
      <Stack spacing={1} divider={<Divider flexItem />}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MaleIcon sx={{ color: '#007AFF', fontSize: 20 }} />
            <Typography variant="body2">Male</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {stats.maleVisitors} ({stats.totalVisitors > 0 ? Math.round((stats.maleVisitors / stats.totalVisitors) * 100) : 0}%)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FemaleIcon sx={{ color: '#FF2D55', fontSize: 20 }} />
            <Typography variant="body2">Female</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {stats.femaleVisitors} ({stats.totalVisitors > 0 ? Math.round((stats.femaleVisitors / stats.totalVisitors) * 100) : 0}%)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TransgenderIcon sx={{ color: '#34C759', fontSize: 20 }} />
            <Typography variant="body2">Other</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {stats.otherGenderVisitors} ({stats.totalVisitors > 0 ? Math.round((stats.otherGenderVisitors / stats.totalVisitors) * 100) : 0}%)
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WalkIcon sx={{ color: '#5856D6', fontSize: 20 }} />
            <Typography variant="body2">On Foot</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {stats.footVisitors} ({stats.totalVisitors > 0 ? Math.round((stats.footVisitors / stats.totalVisitors) * 100) : 0}%)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CarIcon sx={{ color: '#FF9500', fontSize: 20 }} />
            <Typography variant="body2">Vehicle</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {stats.vehicleVisitors} ({stats.totalVisitors > 0 ? Math.round((stats.vehicleVisitors / stats.totalVisitors) * 100) : 0}%)
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  const ActiveNowTooltip = () => (
    <Paper elevation={0} sx={{ p: 2, minWidth: 280 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#34C759' }}>
        Active Visitors Breakdown
      </Typography>
      <Stack spacing={1} divider={<Divider flexItem />}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Total Active</Typography>
          <Typography variant="body2" fontWeight={600}>
            {stats.activeVisitors}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WalkIcon sx={{ color: '#34C759', fontSize: 18 }} />
            <Typography variant="body2">On Foot</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {activeVisitors.filter(v => v.visitorType === 'foot').length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CarIcon sx={{ color: '#34C759', fontSize: 18 }} />
            <Typography variant="body2">Vehicle</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {activeVisitors.filter(v => v.visitorType === 'vehicle').length}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Checked in today</Typography>
          <Typography variant="body2" fontWeight={600}>
            {activeVisitors.filter(v => {
              const timeIn = v.timeIn instanceof Timestamp ? v.timeIn.toDate() : new Date(v.timeIn);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return timeIn >= today;
            }).length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Checked in yesterday</Typography>
          <Typography variant="body2" fontWeight={600}>
            {activeVisitors.filter(v => {
              const timeIn = v.timeIn instanceof Timestamp ? v.timeIn.toDate() : new Date(v.timeIn);
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              yesterday.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return timeIn >= yesterday && timeIn < today;
            }).length}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  const TodayTooltip = () => (
    <Paper elevation={0} sx={{ p: 2, minWidth: 280 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#FF9500' }}>
        Today's Check-ins Breakdown
      </Typography>
      <Stack spacing={1} divider={<Divider flexItem />}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Total Today</Typography>
          <Typography variant="body2" fontWeight={600}>
            {stats.todayVisitors}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MaleIcon sx={{ color: '#007AFF', fontSize: 18 }} />
            <Typography variant="body2">Male</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {todayVisitors.filter(v => v.gender?.toLowerCase() === 'male').length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FemaleIcon sx={{ color: '#FF2D55', fontSize: 18 }} />
            <Typography variant="body2">Female</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {todayVisitors.filter(v => v.gender?.toLowerCase() === 'female').length}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WalkIcon sx={{ color: '#5856D6', fontSize: 18 }} />
            <Typography variant="body2">On Foot</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {todayVisitors.filter(v => v.visitorType === 'foot').length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CarIcon sx={{ color: '#FF9500', fontSize: 18 }} />
            <Typography variant="body2">Vehicle</Typography>
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {todayVisitors.filter(v => v.visitorType === 'vehicle').length}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Still Active</Typography>
          <Typography variant="body2" fontWeight={600}>
            {todayVisitors.filter(v => !v.isCheckedOut).length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Checked Out</Typography>
          <Typography variant="body2" fontWeight={600}>
            {todayVisitors.filter(v => v.isCheckedOut).length}
          </Typography>
        </Box>
      </Stack>
    </Paper>
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
        <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr 1fr 1fr' }} gap={3}>
          <Tooltip title={`${stats.maleVisitors} male visitors`} arrow>
            <Box>
              <MaleIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.maleVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Male
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`${stats.femaleVisitors} female visitors`} arrow>
            <Box>
              <FemaleIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.femaleVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Female
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`${stats.footVisitors} visitors on foot`} arrow>
            <Box>
              <WalkIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.footVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                On Foot
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`${stats.vehicleVisitors} vehicle visitors`} arrow>
            <Box>
              <CarIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.vehicleVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Vehicle
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`${stats.totalVisitors} total visitors`} arrow>
            <Box>
              <GroupIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.totalVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                All Visitors
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`${stats.checkedOutVisitors} checked out visitors`} arrow>
            <Box>
              <CheckCircleIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.checkedOutVisitors}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Checked Out
              </Typography>
            </Box>
          </Tooltip>
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
            onClick={() => navigate('/visitors')}
            tooltipContent={<TotalVisitorsTooltip />}
          />
        </Box>
        <Box>
          <StatCard
            title="Active Now"
            value={stats.activeVisitors}
            subtitle="Currently checked in"
            icon={<AccessTimeIcon />}
            color="#34C759"
            onClick={() => navigate('/visitors')}
            tooltipContent={<ActiveNowTooltip />}
          />
        </Box>
        <Box>
          <StatCard
            title="Today"
            value={stats.todayVisitors}
            subtitle="Check-ins today"
            icon={<TodayIcon />}
            color="#FF9500"
            trend={8}
            onClick={() => navigate('/visitors')}
            tooltipContent={<TodayTooltip />}
          />
        </Box>
        <Box>
          <StatCard
            title="Overdue Alerts"
            value={stats.overdueVisitors}
            subtitle="12+ hours checked in"
            icon={<WarningIcon />}
            color="#FF3B30"
            onClick={() => navigate('/alerts')}
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