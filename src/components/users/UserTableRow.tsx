import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Badge,
  Button,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import BadgeIcon from '@mui/icons-material/Badge';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ComputerIcon from '@mui/icons-material/Computer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { User } from '../../types';
import UserPresence from '../UserPresence';
import UserPresenceStatus from '../UserPresenceStatus';

interface UserTableRowProps {
  user: User;
  editingUser: User | null;
  setEditingUser: (user: User | null) => void;
  onEditDisplayName: (user: User) => void;
  onOpenRoleDialog: (user: User) => void;
  onOpenDeleteDialog: (user: User) => void;
  onOpenMessageDialog: (user: User) => void;
  onOpenDetailsDialog: (user: User) => void;
  onSaveDisplayName: () => void;
  onCancelEdit: () => void;
  currentUserUid?: string;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  editingUser,
  setEditingUser,
  onEditDisplayName,
  onOpenRoleDialog,
  onOpenDeleteDialog,
  onOpenMessageDialog,
  onOpenDetailsDialog,
  onSaveDisplayName,
  onCancelEdit,
  currentUserUid,
}) => {
  const isEditing = editingUser?.uid === user.uid;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
      <UserPresence user={user} size="medium" />
      <Box sx={{ flex: 1 }}>
        {isEditing ? (
          <TextField
            size="small"
            value={editingUser.displayName || ''}
            onChange={(e) => setEditingUser({
              ...editingUser,
              displayName: e.target.value
            })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSaveDisplayName();
              }
            }}
            autoFocus
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#6B7280' }} />
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {user.displayName || user.email.split('@')[0]}
              {user.isOnline && (
                <Badge
                  color="success"
                  variant="dot"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
            {user.platform && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Tooltip title={user.platform === 'mobile' ? 'Mobile App' : 'Web'}>
                  {user.platform === 'mobile' ? (
                    <PhoneIphoneIcon sx={{ fontSize: 14, color: '#6B7280' }} />
                  ) : (
                    <ComputerIcon sx={{ fontSize: 14, color: '#6B7280' }} />
                  )}
                </Tooltip>
                {user.deviceInfo && (
                  <Typography variant="caption" color="text.secondary">
                    {user.deviceInfo}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
      {!isEditing && (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit Name">
            <IconButton
              size="small"
              onClick={() => onEditDisplayName(user)}
              sx={{ 
                color: '#6B7280',
                '&:hover': {
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Change Role">
            <IconButton
              size="small"
              onClick={() => onOpenRoleDialog(user)}
              sx={{ 
                color: '#6B7280',
                '&:hover': {
                  color: '#3B82F6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }
              }}
            >
              <BadgeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {currentUserUid !== user.uid && (
            <Tooltip title="Delete User">
              <IconButton
                size="small"
                onClick={() => onOpenDeleteDialog(user)}
                sx={{ 
                  color: '#6B7280',
                  '&:hover': {
                    color: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

export default UserTableRow;