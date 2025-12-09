// components/Layout/Header.tsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Chip,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningIcon from '@mui/icons-material/Warning';
import { useAppData } from '../../contexts/AppDataContext';

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
  userEmail?: string | null;
  sidebarCollapsed: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  title, 
  userEmail, 
  sidebarCollapsed,
  onLogout
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { overdueCount } = useAppData();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        width: { sm: `calc(100% - ${sidebarCollapsed ? 80 : 280}px)` },
        ml: { sm: `${sidebarCollapsed ? 80 : 280}px` },
        backgroundColor: 'white',
        color: '#1F2937',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: (theme) => theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        backdropFilter: 'blur(8px)',
        background: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <Toolbar sx={{ minHeight: '80px !important', px: 3 }}>
        {/* Mobile Menu Button */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuToggle}
          sx={{ 
            mr: 2, 
            display: { sm: 'none' },
            color: '#6B7280'
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Page Title */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1F2937 0%, #4B5563 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6B7280',
              fontWeight: 500 
            }}
          >
            Welcome back! Here's what's happening today.
          </Typography>
        </Box>

        {/* Header Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Overdue Alerts Chip */}
          {overdueCount > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${overdueCount} Overdue`}
              color="error"
              variant="filled"
              sx={{
                fontWeight: 600,
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                '& .MuiChip-icon': {
                  color: '#DC2626',
                }
              }}
            />
          )}

          {/* Notifications */}
          <IconButton 
            sx={{ 
              color: '#6B7280',
              backgroundColor: '#F3F4F6',
              '&:hover': {
                backgroundColor: '#E5E7EB',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Badge badgeContent={overdueCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <IconButton
            onClick={handleMenu}
            sx={{
              p: 0.5,
              border: '2px solid',
              borderColor: 'transparent',
              '&:hover': {
                borderColor: '#10B981',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: '#10B981',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              {userEmail?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                overflow: 'visible',
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <AccountIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;