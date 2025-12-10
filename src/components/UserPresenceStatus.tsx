import React from 'react';
import { Chip, Box, Tooltip, Typography } from '@mui/material';
import { User } from '../types';
import CircleIcon from '@mui/icons-material/Circle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

interface UserPresenceStatusProps {
  user: User;
}

const UserPresenceStatus: React.FC<UserPresenceStatusProps> = ({ user }) => {
  const getStatusText = () => {
    if (user.isOnline) {
      return 'Online';
    }
    
    if (!user.lastSeen) {
      return 'Never Active';
    }
    
    const now = new Date();
    const lastSeen = new Date(user.lastSeen);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just Now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const getStatusColor = () => {
    if (user.isOnline) return '#10B981';
    
    if (!user.lastSeen) return '#6B7280';
    
    const now = new Date();
    const lastSeen = new Date(user.lastSeen);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 5) return '#F59E0B'; // Away (yellow)
    if (diffMins < 60) return '#EF4444'; // Recently offline (red)
    
    return '#6B7280'; // Long time offline (gray)
  };

  const getStatusIcon = () => {
    if (user.isOnline) {
      return <WifiIcon sx={{ fontSize: 14 }} />;
    }
    
    if (!user.lastSeen) {
      return <WifiOffIcon sx={{ fontSize: 14 }} />;
    }
    
    const now = new Date();
    const lastSeen = new Date(user.lastSeen);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 5) {
      return <AccessTimeIcon sx={{ fontSize: 14 }} />;
    }
    
    return <WifiOffIcon sx={{ fontSize: 14 }} />;
  };

  const getTooltipTitle = () => {
    if (user.isOnline) {
      return 'Currently online and active';
    }
    
    if (!user.lastSeen) {
      return 'User has never been active';
    }
    
    const lastSeenDate = new Date(user.lastSeen);
    return `Last active: ${lastSeenDate.toLocaleString()}`;
  };

  return (
    <Tooltip title={getTooltipTitle()}>
      <Chip
        icon={getStatusIcon()}
        label={getStatusText()}
        size="small"
        sx={{
          backgroundColor: `${getStatusColor()}20`,
          color: getStatusColor(),
          fontWeight: 600,
          border: `1px solid ${getStatusColor()}40`,
          '& .MuiChip-icon': {
            color: getStatusColor(),
          },
        }}
      />
    </Tooltip>
  );
};

export default UserPresenceStatus;