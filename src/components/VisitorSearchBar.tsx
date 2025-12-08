// components/VisitorSearchBar.tsx
import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  LocalOffer as TagIcon,
} from '@mui/icons-material';
import { Visitor } from '../types';

interface VisitorSearchBarProps {
  visitors: Visitor[];
  onSearchResults: (filteredVisitors: Visitor[]) => void;
  onClearSearch: () => void;
}

const VisitorSearchBar: React.FC<VisitorSearchBarProps> = ({
  visitors,
  onSearchResults,
  onClearSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'phone' | 'id' | 'tag'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSearch = (term: string, field: typeof searchField = searchField) => {
    if (!term.trim()) {
      onClearSearch();
      return;
    }

    const searchTermLower = term.toLowerCase().trim();
    
    const filtered = visitors.filter(visitor => {
      switch (field) {
        case 'name':
          return visitor.visitorName?.toLowerCase().includes(searchTermLower);
        case 'phone':
          return visitor.phoneNumber?.toLowerCase().includes(searchTermLower);
        case 'id':
          return visitor.idNumber?.toLowerCase().includes(searchTermLower);
        case 'tag':
          return visitor.tagNumber?.toLowerCase().includes(searchTermLower);
        case 'all':
        default:
          return (
            visitor.visitorName?.toLowerCase().includes(searchTermLower) ||
            visitor.phoneNumber?.toLowerCase().includes(searchTermLower) ||
            visitor.idNumber?.toLowerCase().includes(searchTermLower) ||
            visitor.tagNumber?.toLowerCase().includes(searchTermLower)
          );
      }
    });

    onSearchResults(filtered);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    onClearSearch();
  };

  const handleSearchFieldChange = (field: typeof searchField) => {
    setSearchField(field);
    setAnchorEl(null);
    if (searchTerm) {
      handleSearch(searchTerm, field);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getSearchFieldLabel = () => {
    switch (searchField) {
      case 'name': return 'Name';
      case 'phone': return 'Phone';
      case 'id': return 'ID Number';
      case 'tag': return 'Tag Number';
      case 'all': return 'All Fields';
      default: return 'Search';
    }
  };

  const getSearchFieldIcon = () => {
    switch (searchField) {
      case 'name': return <PersonIcon fontSize="small" />;
      case 'phone': return <PhoneIcon fontSize="small" />;
      case 'id': return <BadgeIcon fontSize="small" />;
      case 'tag': return <TagIcon fontSize="small" />;
      case 'all': return <SearchIcon fontSize="small" />;
      default: return <SearchIcon fontSize="small" />;
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Box display="flex" alignItems="center" gap={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={`Search by ${getSearchFieldLabel().toLowerCase()}...`}
          value={searchTerm}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {getSearchFieldIcon()}
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        
        <Tooltip title="Search Options">
          <IconButton
            onClick={handleMenuOpen}
            color="primary"
            sx={{ 
              border: 1, 
              borderColor: 'primary.main',
              borderRadius: 2,
              minWidth: 120
            }}
          >
            <FilterListIcon sx={{ mr: 1 }} />
            <Chip 
              label={getSearchFieldLabel()} 
              size="small" 
              color="primary"
              variant="filled"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
          }
        }}
      >
        <MenuItem 
          onClick={() => handleSearchFieldChange('all')}
          selected={searchField === 'all'}
        >
          <SearchIcon fontSize="small" sx={{ mr: 2 }} />
          All Fields
          {searchField === 'all' && <Chip label="Active" size="small" color="primary" sx={{ ml: 'auto' }} />}
        </MenuItem>
        <MenuItem 
          onClick={() => handleSearchFieldChange('name')}
          selected={searchField === 'name'}
        >
          <PersonIcon fontSize="small" sx={{ mr: 2 }} />
          Visitor Name
          {searchField === 'name' && <Chip label="Active" size="small" color="primary" sx={{ ml: 'auto' }} />}
        </MenuItem>
        <MenuItem 
          onClick={() => handleSearchFieldChange('phone')}
          selected={searchField === 'phone'}
        >
          <PhoneIcon fontSize="small" sx={{ mr: 2 }} />
          Phone Number
          {searchField === 'phone' && <Chip label="Active" size="small" color="primary" sx={{ ml: 'auto' }} />}
        </MenuItem>
        <MenuItem 
          onClick={() => handleSearchFieldChange('id')}
          selected={searchField === 'id'}
        >
          <BadgeIcon fontSize="small" sx={{ mr: 2 }} />
          ID Number
          {searchField === 'id' && <Chip label="Active" size="small" color="primary" sx={{ ml: 'auto' }} />}
        </MenuItem>
        <MenuItem 
          onClick={() => handleSearchFieldChange('tag')}
          selected={searchField === 'tag'}
        >
          <TagIcon fontSize="small" sx={{ mr: 2 }} />
          Tag Number
          {searchField === 'tag' && <Chip label="Active" size="small" color="primary" sx={{ ml: 'auto' }} />}
        </MenuItem>
      </Menu>

      {searchTerm && (
        <Box mt={1}>
          <Chip 
            label="Search active" 
            color="info" 
            size="small" 
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`Field: ${getSearchFieldLabel()}`} 
            color="primary" 
            size="small" 
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`Search: "${searchTerm}"`} 
            color="secondary" 
            size="small" 
            variant="outlined"
          />
        </Box>
      )}
    </Paper>
  );
};

export default VisitorSearchBar;