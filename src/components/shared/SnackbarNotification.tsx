import React from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface SnackbarNotificationProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  onClose: () => void;
  autoHideDuration?: number;
}

const SnackbarNotification: React.FC<SnackbarNotificationProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
}) => (
  <Snackbar
    open={open}
    autoHideDuration={autoHideDuration}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
  >
    <Alert 
      onClose={onClose} 
      severity={severity}
      sx={{
        borderRadius: 2,
        fontWeight: 500,
      }}
    >
      {message}
    </Alert>
  </Snackbar>
);

export default SnackbarNotification;