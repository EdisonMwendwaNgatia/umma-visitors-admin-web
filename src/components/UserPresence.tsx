import React from 'react';
import { Box, Avatar, Badge, Tooltip, Typography } from '@mui/material';
import { User } from '../types';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

interface UserPresenceProps {
  user: User;
  size?: 'small' | 'medium' | 'large';
}

const UserPresence: React.FC<UserPresenceProps> = ({ user, size = 'medium' }) => {
  const getAvatarSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 56;
      default: return 40;
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'small': return 10;
      case 'large': return 16;
      default: return 12;
    }
  };

  const getPlatformIcon = () => {
    if (user.platform === 'mobile') {
      return <PhoneIphoneIcon sx={{ fontSize: 14 }} />;
    }
    return <ComputerIcon sx={{ fontSize: 14 }} />;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: user.isOnline ? '#10B981' : '#9CA3AF',
            color: user.isOnline ? '#10B981' : '#9CA3AF',
            boxShadow: `0 0 0 2px white`,
            '&::after': {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              animation: user.isOnline ? 'ripple 1.2s infinite ease-in-out' : 'none',
              border: '1px solid currentColor',
              content: '""',
            },
          },
          '@keyframes ripple': {
            '0%': {
              transform: 'scale(.8)',
              opacity: 1,
            },
            '100%': {
              transform: 'scale(2.4)',
              opacity: 0,
            },
          },
        }}
      >
        <Avatar
          sx={{
            width: getAvatarSize(),
            height: getAvatarSize(),
            bgcolor: user.isOnline ? '#D1FAE5' : '#E5E7EB',
            color: user.isOnline ? '#059669' : '#6B7280',
          }}
        >
          {user.displayName ? (
            user.displayName.charAt(0).toUpperCase()
          ) : (
            user.email.charAt(0).toUpperCase()
          )}
        </Avatar>
      </Badge>
      {user.platform && (
        <Tooltip title={user.platform === 'mobile' ? 'Mobile App' : 'Web'}>
          <Box
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              backgroundColor: 'white',
              borderRadius: '50%',
              padding: 0.5,
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: getBadgeSize() * 2,
              height: getBadgeSize() * 2,
            }}
          >
            {getPlatformIcon()}
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

export default UserPresence;