// components/Layout/Layout.tsx
import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Use the AppDataContext to get real-time data
  const { overdueCount } = useAppData();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getCurrentPageTitle = () => {
    const path = window.location.pathname;
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/visitors':
        return 'Visitors';
      case '/checkin':
        return 'Check In';
      case '/checkout':
        return 'Check Out';
      case '/alerts':
        return 'Alerts';
      case '/users':
        return 'Users';
      case '/analytics':
        return 'Analytics';
      default:
        return 'Dashboard';
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header
        onMenuToggle={handleDrawerToggle}
        title={getCurrentPageTitle()}
        userEmail={user?.email}
        sidebarCollapsed={sidebarCollapsed}
        onLogout={handleLogout}
      />

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        userEmail={user?.email || 'admin@umma.com'}
      />

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${sidebarCollapsed ? 80 : 280}px)` },
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: '#F8FAFC',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;