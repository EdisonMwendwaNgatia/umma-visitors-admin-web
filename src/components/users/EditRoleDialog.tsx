import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { User } from '../../types';

interface EditRoleDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUpdateRole: (user: User, newRole: string) => void;
}

const EditRoleDialog: React.FC<EditRoleDialogProps> = ({
  open,
  user,
  onClose,
  onUpdateRole,
}) => {
  const [selectedRole, setSelectedRole] = React.useState(user?.role || 'user');

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role || 'user');
    }
  }, [user]);

  const handleUpdate = () => {
    if (user) {
      onUpdateRole(user, selectedRole);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#F0F9FF',
        borderBottom: '1px solid',
        borderColor: 'divider',
        fontWeight: 700
      }}>
        Change User Role
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {user && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Change role for <strong>{user.displayName || user.email}</strong>
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>New Role</InputLabel>
              <Select
                value={selectedRole}
                label="New Role"
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                Administrators have full access to all system features.
              </Typography>
            </Alert>
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
          onClick={handleUpdate}
          variant="contained"
          disabled={!user}
          sx={{
            backgroundColor: '#3B82F6',
            '&:hover': {
              backgroundColor: '#2563EB',
            }
          }}
          startIcon={<CheckCircleIcon />}
        >
          Update Role
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditRoleDialog;