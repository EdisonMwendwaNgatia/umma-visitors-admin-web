// components/Layout/Sidebar.tsx
import React from 'react';
import {
  Drawer,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountCircle as UserIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  PersonAdd as CheckInIcon,
  ExitToApp as CheckOutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppData } from '../../contexts/AppDataContext';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  mobileOpen, 
  onClose, 
  onLogout, 
  collapsed, 
  onToggle,
  userEmail = 'admin@umma.com'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { overdueCount } = useAppData();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Visitors', icon: <PeopleIcon />, path: '/visitors' },
    { text: 'Alerts', icon: <WarningIcon />, path: '/alerts', badge: overdueCount },
    { text: 'Users', icon: <UserIcon />, path: '/users' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const drawerWidth = collapsed ? 80 : 280;

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      background: 'linear-gradient(180deg, #1F2937 0%, #374151 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Section */}
      <Box sx={{ p: collapsed ? 2 : 3, pb: collapsed ? 1 : 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          mb: collapsed ? 2 : 3
        }}>
          <Avatar
            sx={{
              width: collapsed ? 40 : 48,
              height: collapsed ? 40 : 48,
              backgroundColor: '#10B981',
              mr: collapsed ? 0 : 2,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <BusinessIcon />
          </Avatar>
          {!collapsed && (
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E5E7EB 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Umma Visitors
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#9CA3AF',
                  fontWeight: 500 
                }}
              >
                Admin Panel
              </Typography>
            </Box>
          )}
        </Box>

        {/* Toggle Button */}
        <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
          <IconButton 
            onClick={onToggle}
            sx={{ 
              color: '#D1D5DB',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />

      {/* Navigation Menu */}
      <List sx={{ flex: 1, px: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 52,
                  borderRadius: 2,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: collapsed ? 2 : 2.5,
                  py: 1.5,
                  margin: '4px 8px',
                  backgroundColor: isSelected ? '#10B981' : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected ? '#059669' : 'rgba(255,255,255,0.08)',
                  },
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': isSelected ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 4,
                    height: 20,
                    backgroundColor: '#10B981',
                    borderRadius: 2,
                  } : {},
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 2.5,
                    justifyContent: 'center',
                    color: isSelected ? 'white' : '#9CA3AF',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: collapsed ? 0 : 1,
                    transition: 'opacity 0.2s',
                    '& .MuiTypography-root': {
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'white' : '#E5E7EB',
                      fontSize: '0.9rem',
                    }
                  }} 
                />
                {!collapsed && item.badge && item.badge > 0 && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      backgroundColor: '#EF4444',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 20,
                      minWidth: 20,
                      ml: 1,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Section & Logout */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {!collapsed && (
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#9CA3AF',
                fontWeight: 500,
                fontSize: '0.8rem',
              }}
            >
              {userEmail}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#6B7280',
                fontWeight: 400,
              }}
            >
              Administrator
            </Typography>
          </Box>
        )}
        
        <ListItemButton 
          onClick={onLogout}
          sx={{
            minHeight: 48,
            borderRadius: 2,
            justifyContent: collapsed ? 'center' : 'initial',
            px: collapsed ? 2 : 2.5,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 2,
              justifyContent: 'center',
              color: '#EF4444',
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            sx={{ 
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 0.2s',
              '& .MuiTypography-root': {
                fontWeight: 500,
                color: '#EF4444',
              }
            }} 
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            border: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;