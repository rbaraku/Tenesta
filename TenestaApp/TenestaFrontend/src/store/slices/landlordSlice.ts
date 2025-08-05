import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { 
  LandlordDashboardData, 
  RentCollectionData, 
  LandlordPortfolioData,
  TenantSummary,
  MaintenanceSummary,
  FinancialSummary,
  LandlordActivity,
  PropertyMetrics
} from '../../types';

interface LandlordState {
  dashboardData: LandlordDashboardData | null;
  rentCollection: RentCollectionData | null;
  portfolio: LandlordPortfolioData | null;
  tenantSummaries: TenantSummary[];
  maintenanceSummary: MaintenanceSummary | null;
  financialSummary: FinancialSummary | null;
  recentActivity: LandlordActivity[];
  propertyMetrics: PropertyMetrics[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LandlordState = {
  dashboardData: null,
  rentCollection: {
    totalExpected: 8500,
    totalCollected: 6200,
    totalPending: 1800,
    totalOverdue: 500,
    collectionRate: 85.3,
    overdueCount: 2,
    pendingCount: 5,
  },
  portfolio: null,
  tenantSummaries: [],
  maintenanceSummary: null,
  financialSummary: null,
  recentActivity: [],
  propertyMetrics: [],
  isLoading: false,
  error: null,
};

export const fetchLandlordDashboard = createAsyncThunk(
  'landlord/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getLandlordDashboard();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch landlord dashboard data');
    }
  }
);

export const fetchRentCollection = createAsyncThunk(
  'landlord/fetchRentCollection',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getRentCollectionData();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch rent collection data');
    }
  }
);

export const fetchPortfolioData = createAsyncThunk(
  'landlord/fetchPortfolio',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getPortfolioData();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch portfolio data');
    }
  }
);

export const fetchTenantSummaries = createAsyncThunk(
  'landlord/fetchTenantSummaries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getTenantSummaries();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch tenant summaries');
    }
  }
);

export const updatePaymentStatus = createAsyncThunk(
  'landlord/updatePaymentStatus',
  async ({ paymentId, status }: { paymentId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.updatePaymentStatus(paymentId, status);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to update payment status');
    }
  }
);

export const sendPaymentReminder = createAsyncThunk(
  'landlord/sendPaymentReminder',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.sendPaymentReminder(paymentId);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to send payment reminder');
    }
  }
);

const landlordSlice = createSlice({
  name: 'landlord',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateRentCollectionData: (state, action: PayloadAction<Partial<RentCollectionData>>) => {
      if (state.rentCollection) {
        state.rentCollection = { ...state.rentCollection, ...action.payload };
      }
    },
    addRecentActivity: (state, action: PayloadAction<LandlordActivity>) => {
      state.recentActivity.unshift(action.payload);
      // Keep only the most recent 20 activities
      if (state.recentActivity.length > 20) {
        state.recentActivity = state.recentActivity.slice(0, 20);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Landlord Dashboard
    builder
      .addCase(fetchLandlordDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLandlordDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardData = action.payload;
        if (action.payload.rentCollection) {
          state.rentCollection = action.payload.rentCollection;
        }
        if (action.payload.portfolio) {
          state.portfolio = action.payload.portfolio;
        }
        if (action.payload.tenantSummaries) {
          state.tenantSummaries = action.payload.tenantSummaries;
        }
        if (action.payload.maintenanceSummary) {
          state.maintenanceSummary = action.payload.maintenanceSummary;
        }
        if (action.payload.financialSummary) {
          state.financialSummary = action.payload.financialSummary;
        }
        if (action.payload.recentActivity) {
          state.recentActivity = action.payload.recentActivity;
        }
        if (action.payload.propertyMetrics) {
          state.propertyMetrics = action.payload.propertyMetrics;
        }
      })
      .addCase(fetchLandlordDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Rent Collection
    builder
      .addCase(fetchRentCollection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRentCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rentCollection = action.payload;
      })
      .addCase(fetchRentCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Portfolio Data
    builder
      .addCase(fetchPortfolioData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload;
      })
      .addCase(fetchPortfolioData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Tenant Summaries
    builder
      .addCase(fetchTenantSummaries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenantSummaries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenantSummaries = action.payload;
      })
      .addCase(fetchTenantSummaries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Payment Status
    builder
      .addCase(updatePaymentStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add activity for payment status update
        state.recentActivity.unshift({
          id: Date.now().toString(),
          type: 'payment',
          title: 'Payment Status Updated',
          description: `Payment marked as ${action.payload.status}`,
          timestamp: new Date().toISOString(),
          amount: action.payload.amount,
          status: action.payload.status,
          priority: 'medium',
        });
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send Payment Reminder
    builder
      .addCase(sendPaymentReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendPaymentReminder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add activity for payment reminder
        state.recentActivity.unshift({
          id: Date.now().toString(),
          type: 'payment',
          title: 'Payment Reminder Sent',
          description: 'Payment reminder sent to tenant',
          timestamp: new Date().toISOString(),
          priority: 'low',
        });
      })
      .addCase(sendPaymentReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateRentCollectionData, addRecentActivity } = landlordSlice.actions;
export default landlordSlice.reducer;