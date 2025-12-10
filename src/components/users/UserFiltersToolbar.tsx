import React from 'react';
import {
  Box,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  InputAdornment,
  IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface UserFiltersToolbarProps {
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterRole: string;
  setFilterRole: (value: string) => void;
  filterPlatform: string;
  setFilterPlatform: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

const UserFiltersToolbar: React.FC<UserFiltersToolbarProps> = ({
  filterStatus,
  setFilterStatus,
  filterRole,
  setFilterRole,
  filterPlatform,
  setFilterPlatform,
  searchQuery,
  setSearchQuery,
}) => {
  const hasActiveFilters = filterStatus !== 'all' || filterRole !== 'all' || filterPlatform !== 'all' || searchQuery;

  const handleClearFilters = () => {
    setFilterStatus('all');
    setFilterRole('all');
    setFilterPlatform('all');
    setSearchQuery('');
  };

  return (
    <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
      <TextField
        placeholder="Search users..."
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchQuery('')}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ flex: 1, minWidth: 250 }}
      />
      
      <Box display="flex" alignItems="center" gap={1}>
        <FilterListIcon color="action" />
        <Typography variant="body2" color="text.secondary">
          Filter by:
        </Typography>
      </Box>
      
      <ToggleButtonGroup
        value={filterStatus}
        exclusive
        onChange={(e, value) => setFilterStatus(value || 'all')}
        size="small"
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="online">Online</ToggleButton>
        <ToggleButton value="offline">Offline</ToggleButton>
      </ToggleButtonGroup>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Role</InputLabel>
        <Select
          value={filterRole}
          label="Role"
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <MenuItem value="all">All Roles</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="user">User</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Platform</InputLabel>
        <Select
          value={filterPlatform}
          label="Platform"
          onChange={(e) => setFilterPlatform(e.target.value)}
        >
          <MenuItem value="all">All Platforms</MenuItem>
          <MenuItem value="web">Web</MenuItem>
          <MenuItem value="mobile">Mobile</MenuItem>
        </Select>
      </FormControl>

      {hasActiveFilters && (
        <Button
          size="small"
          onClick={handleClearFilters}
        >
          Clear All
        </Button>
      )}
    </Box>
  );
};

export default UserFiltersToolbar;