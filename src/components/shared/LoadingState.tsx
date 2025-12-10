import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
    <CircularProgress size={60} sx={{ color: '#10B981' }} />
    <Typography variant="h6" sx={{ ml: 2 }}>
      {message}
    </Typography>
  </Box>
);

export default LoadingState;