import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import { User } from '../../types';

interface DeleteUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onDeleteUser: (user: User) => void;
  currentUserUid?: string;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  open,
  user,
  onClose,
  onDeleteUser,
  currentUserUid,
}) => {
  const handleDelete = () => {
    if (user) {
      onDeleteUser(user);
    }
  };

  const isCurrentUser = currentUserUid === user?.uid;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#FEF2F2',
        borderBottom: '1px solid',
        borderColor: 'divider',
        fontWeight: 700,
        color: '#DC2626'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <WarningIcon color="error" />
          Delete User
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 3 }}>
        {user && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete <strong>{user.displayName || user.email}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Email: {user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Role: {user.role}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Platform: {user.platform === 'mobile' ? 'Mobile App' : 'Web'}
            </Typography>
            <Alert 
              severity="warning" 
              sx={{ mt: 2, borderRadius: 2 }}
              icon={<WarningIcon />}
            >
              <Typography variant="body2" fontWeight={600}>
                This action cannot be undone. The user will lose all access to the system.
              </Typography>
            </Alert>
            {isCurrentUser && (
              <Alert 
                severity="error" 
                sx={{ mt: 2, borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Warning: You cannot delete your own account while logged in.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={isCurrentUser}
          startIcon={<DeleteIcon />}
          sx={{
            backgroundColor: '#DC2626',
            '&:hover': {
              backgroundColor: '#B91C1C',
            }
          }}
        >
          Delete User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;