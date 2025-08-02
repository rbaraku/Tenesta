import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { DashboardData, UserProfile } from '../../types';

interface UserState {
  profile: UserProfile | null;
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  dashboardData: null,
  isLoading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getUserProfile();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch user profile');
    }
  }
);

export const fetchTenantDashboard = createAsyncThunk(
  'user/fetchTenantDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getTenantDashboard();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch tenant dashboard');
    }
  }
);

export const fetchLandlordDashboard = createAsyncThunk(
  'user/fetchLandlordDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getLandlordDashboard();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch landlord dashboard');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch User Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Tenant Dashboard
    builder
      .addCase(fetchTenantDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenantDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchTenantDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Landlord Dashboard
    builder
      .addCase(fetchLandlordDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLandlordDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchLandlordDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateProfile } = userSlice.actions;
export default userSlice.reducer;