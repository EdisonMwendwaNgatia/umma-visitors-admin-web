// components/GroupingControls.tsx
import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

export type GroupByOption = 'none' | 'gender' | 'type' | 'gender-type';

interface GroupingControlsProps {
  groupBy: GroupByOption;
  onGroupByChange: (value: GroupByOption) => void;
  stats?: {
    total: number;
    groupedCount?: number;
    male?: number;
    female?: number;
    other?: number;
    foot?: number;
    vehicle?: number;
  };
}

const GroupingControls: React.FC<GroupingControlsProps> = ({
  groupBy,
  onGroupByChange,
  stats,
}) => {
  const handleChange = (event: SelectChangeEvent<GroupByOption>) => {
    onGroupByChange(event.target.value as GroupByOption);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="group-by-label">Group By</InputLabel>
        <Select
          labelId="group-by-label"
          value={groupBy}
          label="Group By"
          onChange={handleChange}
          startAdornment={<GroupIcon sx={{ mr: 1, color: 'action.active' }} />}
        >
          <MenuItem value="none">No Grouping</MenuItem>
          <MenuItem value="gender">Gender</MenuItem>
          <MenuItem value="type">Visitor Type</MenuItem>
          <MenuItem value="gender-type">Gender & Type</MenuItem>
        </Select>
      </FormControl>

      {stats && (
        <Stack direction="row" spacing={1} alignItems="center">
          {groupBy === 'gender' && (
            <>
              {stats.male !== undefined && stats.male > 0 && (
                <Tooltip title="Male">
                  <Chip
                    icon={<MaleIcon />}
                    label={stats.male}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Tooltip>
              )}
              {stats.female !== undefined && stats.female > 0 && (
                <Tooltip title="Female">
                  <Chip
                    icon={<FemaleIcon />}
                    label={stats.female}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                </Tooltip>
              )}
              {stats.other !== undefined && stats.other > 0 && (
                <Tooltip title="Other">
                  <Chip
                    label={`Other: ${stats.other}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </>
          )}
          
          {groupBy === 'type' && (
            <>
              {stats.foot !== undefined && stats.foot > 0 && (
                <Tooltip title="Foot">
                  <Chip
                    icon={<DirectionsWalkIcon />}
                    label={stats.foot}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                </Tooltip>
              )}
              {stats.vehicle !== undefined && stats.vehicle > 0 && (
                <Tooltip title="Vehicle">
                  <Chip
                    icon={<DirectionsCarIcon />}
                    label={stats.vehicle}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </>
          )}

          {groupBy === 'gender-type' && (
            <Typography variant="body2" color="text.secondary">
              {stats.groupedCount || 0} groups
            </Typography>
          )}

          {groupBy !== 'none' && (
            <Typography variant="body2" color="text.secondary">
              Total: {stats.total}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default GroupingControls;