import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UserFormFields from '../shared/FormFields/UserFormFields';

interface NewUser {
  email: string;
  password: string;
  displayName: string;
  role: string;
}

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onAddUser: (newUser: NewUser) => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onClose,
  onAddUser,
}) => {
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    displayName: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    onAddUser(newUser);
    setNewUser({
      email: '',
      password: '',
      displayName: '',
      role: 'user'
    });
    setShowPassword(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid',
        borderColor: 'divider',
        fontWeight: 700
      }}>
        Add New User
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <UserFormFields
            email={newUser.email}
            password={newUser.password}
            displayName={newUser.displayName}
            role={newUser.role}
            showPassword={showPassword}
            onEmailChange={(value) => setNewUser({ ...newUser, email: value })}
            onPasswordChange={(value) => setNewUser({ ...newUser, password: value })}
            onDisplayNameChange={(value) => setNewUser({ ...newUser, displayName: value })}
            onRoleChange={(value) => setNewUser({ ...newUser, role: value })}
            onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!newUser.email || !newUser.password}
          sx={{
            backgroundColor: '#10B981',
            '&:hover': {
              backgroundColor: '#059669',
            }
          }}
          startIcon={<CheckCircleIcon />}
        >
          Create User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserDialog;