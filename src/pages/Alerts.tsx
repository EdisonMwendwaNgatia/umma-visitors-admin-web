// pages/Alerts.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Fade,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Avatar,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import CarIcon from '@mui/icons-material/DirectionsCar';
import WalkIcon from '@mui/icons-material/DirectionsWalk';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Visitor } from '../types';

const Alerts: React.FC = () => {
  const [overdueVisitors, setOverdueVisitors] = useState<Visitor[]>([]);
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
      calculateOverdueVisitors(visitors);
    });

    return unsubscribe;
  }, []);

  const calculateOverdueVisitors = (visitors: Visitor[]) => {
    const now = new Date();
    
    // Calculate overdue visitors (12+ hours)
    const overdue = visitors.filter(visitor => {
      if (visitor.isCheckedOut) return false;
      
      const timeIn = visitor.timeIn instanceof Timestamp ? 
        visitor.timeIn.toDate() : new Date(visitor.timeIn);
      
      const hoursSinceCheckIn = (now.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
      return hoursSinceCheckIn > 12;
    });

    // Sort by most overdue first
    const sortedOverdue = overdue.sort((a, b) => {
      const timeA = a.timeIn instanceof Timestamp ? a.timeIn.toDate() : new Date(a.timeIn);
      const timeB = b.timeIn instanceof Timestamp ? b.timeIn.toDate() : new Date(b.timeIn);
      return timeA.getTime() - timeB.getTime(); // Oldest first
    });

    setOverdueVisitors(sortedOverdue);
    setLoading(false);
  };

  const getHoursOverdue = (timeIn: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timeIn.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  };

  const getAlertLevel = (hours: number) => {
    if (hours >= 24) return { level: 'critical', color: '#EF4444', label: 'Critical' };
    if (hours >= 18) return { level: 'high', color: '#F59E0B', label: 'High' };
    return { level: 'medium', color: '#10B981', label: 'Medium' };
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      if (remainingHours === 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
      }
      return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    }
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

  const OverdueVisitorCard: React.FC<{ visitor: Visitor }> = ({ visitor }) => {
    const timeIn = visitor.timeIn instanceof Timestamp ? 
      visitor.timeIn.toDate() : new Date(visitor.timeIn);
    const hoursOverdue = getHoursOverdue(timeIn);
    const alertLevel = getAlertLevel(hoursOverdue);
    const durationText = formatDuration(hoursOverdue);

    return (
      <Fade in={!loading} timeout={600}>
        <Card 
          sx={{ 
            mb: 2,
            borderLeft: `4px solid ${alertLevel.color}`,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="flex-start" justifyContent="space-between">
              {/* Visitor Info */}
              <Box flex={1}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: alertLevel.color,
                      mr: 2,
                    }}
                  >
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {visitor.visitorName}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Chip
                        icon={visitor.visitorType === 'vehicle' ? <CarIcon /> : <WalkIcon />}
                        label={visitor.visitorType === 'vehicle' ? 'Vehicle' : 'On Foot'}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={alertLevel.label}
                        size="small"
                        sx={{
                          backgroundColor: `${alertLevel.color}15`,
                          color: alertLevel.color,
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Visitor Details */}
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }} gap={2}>
                  <Box display="flex" alignItems="center">
                    <PhoneIcon sx={{ color: '#6B7280', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {visitor.phoneNumber}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <BadgeIcon sx={{ color: '#6B7280', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {visitor.idNumber}
                    </Typography>
                  </Box>
                  {visitor.refNumber && (
                    <Box display="flex" alignItems="center">
                      <CarIcon sx={{ color: '#6B7280', mr: 1, fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        {visitor.refNumber}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Additional Info */}
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Purpose:</strong> {visitor.purposeOfVisit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Institution:</strong> {visitor.institutionOccupation}
                  </Typography>
                </Box>

                {/* Time Information */}
                <Box mt={2} display="flex" alignItems="center" gap={2}>
                  <Box display="flex" alignItems="center">
                    <ScheduleIcon sx={{ color: '#6B7280', mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      Checked in: {timeIn.toLocaleDateString()} at {timeIn.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Overdue Info */}
              <Box textAlign="right" ml={2}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800,
                    color: alertLevel.color,
                    mb: 1
                  }}
                >
                  {durationText}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Overdue
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {hoursOverdue} hours
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#10B981' }} />
      </Box>
    );
  }

  const criticalCount = overdueVisitors.filter(v => getHoursOverdue(v.timeIn instanceof Timestamp ? v.timeIn.toDate() : new Date(v.timeIn)) >= 24).length;
  const highCount = overdueVisitors.filter(v => {
    const hours = getHoursOverdue(v.timeIn instanceof Timestamp ? v.timeIn.toDate() : new Date(v.timeIn));
    return hours >= 18 && hours < 24;
  }).length;
  const mediumCount = overdueVisitors.filter(v => {
    const hours = getHoursOverdue(v.timeIn instanceof Timestamp ? v.timeIn.toDate() : new Date(v.timeIn));
    return hours >= 12 && hours < 18;
  }).length;

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
          Overdue Alerts
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Visitors checked in for more than 12 hours requiring attention
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={3} sx={{ mb: 4 }}>
        <Box>
          <StatCard
            title="Total Overdue"
            value={overdueVisitors.length}
            subtitle="12+ hours checked in"
            icon={<WarningIcon />}
            color="#FF3B30"
          />
        </Box>
        <Box>
          <StatCard
            title="Critical"
            value={criticalCount}
            subtitle="24+ hours overdue"
            icon={<NotificationsIcon />}
            color="#EF4444"
          />
        </Box>
        <Box>
          <StatCard
            title="High Priority"
            value={highCount}
            subtitle="18-23 hours overdue"
            icon={<WarningIcon />}
            color="#F59E0B"
          />
        </Box>
        <Box>
          <StatCard
            title="Medium Priority"
            value={mediumCount}
            subtitle="12-17 hours overdue"
            icon={<ScheduleIcon />}
            color="#10B981"
          />
        </Box>
      </Box>

      {/* Alerts List */}
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
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Overdue Visitors
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {overdueVisitors.length} visitor{overdueVisitors.length !== 1 ? 's' : ''} require follow-up
              </Typography>
            </Box>
            <Chip 
              icon={<WarningIcon />}
              label={`${overdueVisitors.length} Active Alerts`}
              color="error"
              variant="filled"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {overdueVisitors.length === 0 ? (
            <Box textAlign="center" py={6}>
              <CheckCircleIcon sx={{ fontSize: 64, color: '#10B981', mb: 2, opacity: 0.7 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Overdue Visitors
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All visitors have been checked out within 12 hours
              </Typography>
            </Box>
          ) : (
            <Box>
              {overdueVisitors.map((visitor, index) => (
                <React.Fragment key={visitor.id}>
                  <OverdueVisitorCard visitor={visitor} />
                  {index < overdueVisitors.length - 1 && <Divider sx={{ my: 2 }} />}
                </React.Fragment>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Empty State Alternative */}
      {overdueVisitors.length === 0 && (
        <Fade in={!loading} timeout={800}>
          <Alert 
            severity="success" 
            sx={{ 
              mt: 3,
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontWeight: 500,
              }
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              🎉 Excellent! All visitors are within acceptable time limits.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Continue monitoring visitor activity to maintain this status.
            </Typography>
          </Alert>
        </Fade>
      )}
    </Box>
  );
};

export default Alerts;