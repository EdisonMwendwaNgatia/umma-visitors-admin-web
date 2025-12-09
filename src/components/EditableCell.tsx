// components/EditableCell.tsx
import React, { useState, KeyboardEvent } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  Box,
  IconButton,
  Tooltip,
  ClickAwayListener,
  SelectChangeEvent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface EditableCellProps {
  value: any;
  field: string;
  visitorId: string;
  visitorData: any;
  onSave: (field: string, newValue: any, visitorData: any) => Promise<boolean>;
  type?: 'text' | 'select' | 'number';
  options?: Array<{ value: string; label: string }>;
  multiline?: boolean;
  readOnly?: boolean;
  currentUserUid: string;
  userRole?: string;
  placeholder?: string;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  field,
  visitorId,
  visitorData,
  onSave,
  type = 'text',
  options = [],
  multiline = false,
  readOnly = false,
  currentUserUid,
  userRole = '',
  placeholder = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [loading, setLoading] = useState(false);

  const canEdit = !readOnly && userRole === 'admin';

  const handleEdit = () => {
    if (canEdit) {
      setIsEditing(true);
      setEditValue(value);
    }
  };

  const handleSave = async () => {
    if (editValue !== value && canEdit) {
      setLoading(true);
      try {
        const success = await onSave(field, editValue, visitorData);
        if (success) {
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error saving:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleClickAway = () => {
    if (isEditing) {
      handleCancel();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !multiline && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    setEditValue(event.target.value);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(event.target.value);
  };

  if (!isEditing) {
    const displayValue = type === 'select' && options.length > 0
      ? options.find(opt => opt.value === value)?.label || value
      : value;

    return (
      <Box display="flex" alignItems="center" gap={1}>
        <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
          {displayValue || '-'}
        </span>
        {canEdit && (
          <Tooltip title="Edit">
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <Select
              value={editValue}
              onChange={handleSelectChange}
              onKeyDown={handleKeyDown}
              autoFocus
              size="small"
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{ color: '#aaa' }}>{placeholder}</span>;
                }
                return options.find(opt => opt.value === selected)?.label || selected;
              }}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'number':
        return (
          <TextField
            fullWidth
            size="small"
            value={editValue}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            type="number"
            autoFocus
            placeholder={placeholder}
          />
        );
      default:
        return (
          <TextField
            fullWidth
            size="small"
            value={editValue}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            multiline={multiline}
            rows={multiline ? 3 : 1}
            autoFocus
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box>
        {renderInput()}
        <Box display="flex" gap={0.5} mt={0.5}>
          <Tooltip title="Save">
            <IconButton
              size="small"
              onClick={handleSave}
              disabled={loading}
              color="success"
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel">
            <IconButton size="small" onClick={handleCancel} disabled={loading}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </ClickAwayListener>
  );
};