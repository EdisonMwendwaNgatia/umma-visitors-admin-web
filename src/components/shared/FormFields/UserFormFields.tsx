import React from 'react';
import {
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface UserFormFieldsProps {
  email: string;
  password: string;
  displayName: string;
  role: string;
  showPassword: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
}

const UserFormFields: React.FC<UserFormFieldsProps> = ({
  email,
  password,
  displayName,
  role,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onDisplayNameChange,
  onRoleChange,
  onTogglePasswordVisibility,
}) => (
  <>
    <TextField
      label="Email Address"
      type="email"
      value={email}
      onChange={(e) => onEmailChange(e.target.value)}
      fullWidth
      required
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <EmailIcon sx={{ color: '#6B7280' }} />
          </InputAdornment>
        ),
      }}
    />
    <TextField
      label="Password"
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={(e) => onPasswordChange(e.target.value)}
      fullWidth
      required
      helperText="Password should be at least 6 characters"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SecurityIcon sx={{ color: '#6B7280' }} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={onTogglePasswordVisibility}
              edge="end"
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
    <TextField
      label="Display Name (Optional)"
      value={displayName}
      onChange={(e) => onDisplayNameChange(e.target.value)}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <PersonIcon sx={{ color: '#6B7280' }} />
          </InputAdornment>
        ),
      }}
    />
    <TextField
      label="Role"
      select
      value={role}
      onChange={(e) => onRoleChange(e.target.value)}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <BadgeIcon sx={{ color: '#6B7280' }} />
          </InputAdornment>
        ),
      }}
    >
      <MenuItem value="user">User</MenuItem>
      <MenuItem value="admin">Administrator</MenuItem>
    </TextField>
  </>
);

export default UserFormFields;