import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

// Types
export interface Tenant {
  id: string;
  name: string;
  email: string;
  unit: string;
  property: string;
  rentAmount: number;
  leaseEndDate: string;
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'unknown';
  lastPaymentDate: string | null;
  daysUntilLeaseEnd: number;
  phone?: string;
  moveInDate?: string;
  securityDeposit?: number;
  notes?: string;
  status: 'active' | 'pending' | 'former';
}

export interface TenantState {
  tenants: Tenant[];
  filteredTenants: Tenant[];
  selectedTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterBy: 'all' | 'active' | 'pending' | 'former' | 'overdue';
  sortBy: 'name' | 'unit' | 'leaseEnd' | 'paymentStatus';
  sortOrder: 'asc' | 'desc';
}

const initialState: TenantState = {
  tenants: [],
  filteredTenants: [],
  selectedTenant: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filterBy: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};

// Async thunks
export const fetchTenants = createAsyncThunk(
  'tenant/fetchTenants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getTenantSummaries();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      
      // Calculate days until lease end and determine status
      const tenantsWithStatus = (response.data || []).map((tenant: any) => {
        const leaseEndDate = new Date(tenant.leaseEndDate);
        const today = new Date();
        const daysUntilLeaseEnd = Math.ceil((leaseEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        let status: 'active' | 'pending' | 'former' = 'active';
        if (daysUntilLeaseEnd < 0) {
          status = 'former';
        } else if (daysUntilLeaseEnd <= 30) {
          status = 'pending'; // Lease ending soon
        }
        
        return {
          ...tenant,
          daysUntilLeaseEnd,
          status,
        };
      });
      
      return tenantsWithStatus;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch tenants');
    }
  }
);

export const updateTenantNotes = createAsyncThunk(
  'tenant/updateNotes',
  async ({ tenantId, notes }: { tenantId: string; notes: string }, { rejectWithValue }) => {
    try {
      // For now, we'll just update locally since there's no specific tenant update endpoint
      // In the future, this would call a backend API
      return { tenantId, notes };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update tenant notes');
    }
  }
);

export const sendTenantMessage = createAsyncThunk(
  'tenant/sendMessage',
  async ({ tenantId, message }: { tenantId: string; message: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.sendMessage(tenantId, message);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send message');
    }
  }
);

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      tenantSlice.caseReducers.applyFilters(state);
    },
    setFilterBy: (state, action: PayloadAction<TenantState['filterBy']>) => {
      state.filterBy = action.payload;
      tenantSlice.caseReducers.applyFilters(state);
    },
    setSortBy: (state, action: PayloadAction<{ sortBy: TenantState['sortBy']; sortOrder?: TenantState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy;
      if (action.payload.sortOrder) {
        state.sortOrder = action.payload.sortOrder;
      } else {
        // Toggle sort order if same field
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
      }
      tenantSlice.caseReducers.applyFilters(state);
    },
    selectTenant: (state, action: PayloadAction<Tenant | null>) => {
      state.selectedTenant = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    applyFilters: (state) => {
      let filtered = [...state.tenants];

      // Apply search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(
          tenant =>
            tenant.name.toLowerCase().includes(query) ||
            tenant.email.toLowerCase().includes(query) ||
            tenant.unit.toLowerCase().includes(query) ||
            tenant.property.toLowerCase().includes(query)
        );
      }

      // Apply status filter
      if (state.filterBy !== 'all') {
        if (state.filterBy === 'overdue') {
          filtered = filtered.filter(tenant => tenant.paymentStatus === 'overdue');
        } else {
          filtered = filtered.filter(tenant => tenant.status === state.filterBy);
        }
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (state.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'unit':
            aValue = a.unit.toLowerCase();
            bValue = b.unit.toLowerCase();
            break;
          case 'leaseEnd':
            aValue = new Date(a.leaseEndDate).getTime();
            bValue = new Date(b.leaseEndDate).getTime();
            break;
          case 'paymentStatus':
            // Order: paid, pending, overdue, unknown
            const statusOrder = { paid: 0, pending: 1, overdue: 2, unknown: 3 };
            aValue = statusOrder[a.paymentStatus] || 3;
            bValue = statusOrder[b.paymentStatus] || 3;
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      state.filteredTenants = filtered;
    },
    updateTenantLocal: (state, action: PayloadAction<Partial<Tenant> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const tenantIndex = state.tenants.findIndex(tenant => tenant.id === id);
      if (tenantIndex !== -1) {
        state.tenants[tenantIndex] = { ...state.tenants[tenantIndex], ...updates };
        tenantSlice.caseReducers.applyFilters(state);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tenants
      .addCase(fetchTenants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenants = action.payload;
        tenantSlice.caseReducers.applyFilters(state);
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update tenant notes
      .addCase(updateTenantNotes.fulfilled, (state, action) => {
        const { tenantId, notes } = action.payload;
        const tenantIndex = state.tenants.findIndex(tenant => tenant.id === tenantId);
        if (tenantIndex !== -1) {
          state.tenants[tenantIndex].notes = notes;
          tenantSlice.caseReducers.applyFilters(state);
        }
      })
      // Send message
      .addCase(sendTenantMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendTenantMessage.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setSearchQuery,
  setFilterBy,
  setSortBy,
  selectTenant,
  clearError,
  updateTenantLocal,
} = tenantSlice.actions;

export default tenantSlice.reducer;