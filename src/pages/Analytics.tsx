import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
// Using Box-based layout instead of MUI Grid to avoid typing conflicts
import VisitorStats from '../components/Charts/VisitorStats';

const Analytics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics & Reports
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flexBasis: '100%' }}>
          <VisitorStats />
        </Box>

        <Box sx={{ flexBasis: { xs: '100%', md: '50%' } }}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Peak Hours
            </Typography>
            <Typography color="textSecondary">
              Peak hours analytics will be displayed here...
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ flexBasis: { xs: '100%', md: '50%' } }}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Purpose Analysis
            </Typography>
            <Typography color="textSecondary">
              Visit purpose analytics will be displayed here...
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Analytics;




