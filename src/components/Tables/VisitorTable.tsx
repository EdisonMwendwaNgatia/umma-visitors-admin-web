import React from 'react';
import {
  Paper,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Visitor } from '../../types';

interface VisitorTableProps {
  visitors: Visitor[];
  loading: boolean;
  onRefresh: () => void;
}

const VisitorTable: React.FC<VisitorTableProps> = ({ visitors, loading, onRefresh }) => {
  const columns: GridColDef[] = [
    {
      field: 'visitorName',
      headerName: 'Visitor Name',
      width: 200,
      flex: 1,
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: 150,
    },
    {
      field: 'idNumber',
      headerName: 'ID Number',
      width: 150,
    },
    {
      field: 'visitorType',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <Chip
          label={params.value}
          color={params.value === 'vehicle' ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'refNumber',
      headerName: 'Vehicle Plate',
      width: 150,
      renderCell: (params: GridRenderCellParams<any, string>) => params.value || '-',
    },
    {
      field: 'purposeOfVisit',
      headerName: 'Purpose',
      width: 200,
      flex: 1,
    },
    {
      field: 'timeIn',
      headerName: 'Check In',
      width: 180,
      type: 'dateTime',
      valueFormatter: (params: any) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleString();
      },
    },
    {
      field: 'timeOut',
      headerName: 'Check Out',
      width: 180,
      type: 'dateTime',
      valueFormatter: (params: any) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleString();
      },
    },
    {
      field: 'isCheckedOut',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams<any, boolean>) => (
        <Chip
          label={params.value ? 'Checked Out' : 'Active'}
          color={params.value ? 'default' : 'success'}
          variant={params.value ? 'outlined' : 'filled'}
          size="small"
        />
      ),
    },
    {
      field: 'checkedInBy',
      headerName: 'Checked In By',
      width: 180,
    },
  ];

  return (
    <Paper sx={{ width: '100%' }}>
      <DataGrid
        rows={visitors}
        columns={columns}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25, page: 0 },
          },
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f0f0f0',
          },
        }}
      />
    </Paper>
  );
};

export default VisitorTable;