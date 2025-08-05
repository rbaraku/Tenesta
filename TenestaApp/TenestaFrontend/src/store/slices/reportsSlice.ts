import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

// Types for analytics data
export interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  yearToDateRevenue: number;
  expectedRevenue: number;
  collectionRate: number;
  averageRent: number;
  totalExpenses: number;
  netIncome: number;
  profitMargin: number;
}

export interface OccupancyMetrics {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  averageLeaseLength: number;
  turnoverRate: number;
  daysVacant: number;
}

export interface PaymentMetrics {
  totalPayments: number;
  onTimePayments: number;
  latePayments: number;
  overduePayments: number;
  onTimeRate: number;
  averageDaysLate: number;
  totalLateFees: number;
}

export interface PropertyPerformance {
  propertyId: string;
  propertyName: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  occupancyRate: number;
  collectionRate: number;
  averageRent: number;
  profitability: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  occupancyRate: number;
  collectionRate: number;
}

export interface ReportsState {
  financialMetrics: FinancialMetrics | null;
  occupancyMetrics: OccupancyMetrics | null;
  paymentMetrics: PaymentMetrics | null;
  propertyPerformance: PropertyPerformance[];
  monthlyTrends: MonthlyTrend[];
  isLoading: boolean;
  error: string | null;
  selectedTimeRange: 'month' | 'quarter' | 'year' | 'all';
  selectedPropertyId: string | null;
  lastUpdated: string | null;
}

const initialState: ReportsState = {
  financialMetrics: null,
  occupancyMetrics: null,
  paymentMetrics: null,
  propertyPerformance: [],
  monthlyTrends: [],
  isLoading: false,
  error: null,
  selectedTimeRange: 'month',
  selectedPropertyId: null,
  lastUpdated: null,
};

// Async thunks
export const fetchAnalyticsData = createAsyncThunk(
  'reports/fetchAnalyticsData',
  async (timeRange: string = 'month', { rejectWithValue }) => {
    try {
      // Fetch data from landlord dashboard and properties
      const [dashboardResponse, propertiesResponse] = await Promise.all([
        apiService.getLandlordDashboard(),
        apiService.getProperties(),
      ]);

      if (dashboardResponse.error) {
        return rejectWithValue(dashboardResponse.error);
      }

      const dashboardData = dashboardResponse.data;
      const propertiesData = propertiesResponse.data;

      // Calculate financial metrics
      const rentCollection = dashboardData.rent_collection || {};
      const portfolioSummary = dashboardData.portfolio_summary || {};
      
      const financialMetrics: FinancialMetrics = {
        totalRevenue: rentCollection.totalCollected || 0,
        monthlyRevenue: portfolioSummary.monthly_revenue || 0,
        yearToDateRevenue: (portfolioSummary.monthly_revenue || 0) * 12, // Estimate
        expectedRevenue: rentCollection.totalExpected || 0,
        collectionRate: rentCollection.collectionRate || 0,
        averageRent: portfolioSummary.average_rent || 0,
        totalExpenses: portfolioSummary.total_expenses || 0,
        netIncome: (portfolioSummary.monthly_revenue || 0) - (portfolioSummary.total_expenses || 0),
        profitMargin: portfolioSummary.monthly_revenue ? 
          ((portfolioSummary.monthly_revenue - (portfolioSummary.total_expenses || 0)) / portfolioSummary.monthly_revenue) * 100 : 0,
      };

      // Calculate occupancy metrics
      const occupancyMetrics: OccupancyMetrics = {
        totalUnits: portfolioSummary.total_units || 0,
        occupiedUnits: portfolioSummary.occupied_units || 0,
        vacantUnits: (portfolioSummary.total_units || 0) - (portfolioSummary.occupied_units || 0),
        occupancyRate: portfolioSummary.occupancy_rate || 0,
        averageLeaseLength: 12, // Default estimate
        turnoverRate: 15, // Default estimate
        daysVacant: 30, // Default estimate
      };

      // Calculate payment metrics
      const paymentMetrics: PaymentMetrics = {
        totalPayments: rentCollection.totalExpected ? Math.floor(rentCollection.totalExpected / 1000) : 0,
        onTimePayments: rentCollection.totalCollected ? Math.floor(rentCollection.totalCollected / 1000) : 0,
        latePayments: rentCollection.pendingCount || 0,
        overduePayments: rentCollection.overdueCount || 0,
        onTimeRate: rentCollection.collectionRate || 0,
        averageDaysLate: 5, // Default estimate
        totalLateFees: rentCollection.totalOverdue ? rentCollection.totalOverdue * 0.05 : 0, // 5% estimate
      };

      // Calculate property performance
      const properties = Array.isArray(propertiesData) ? propertiesData : (propertiesData?.properties || []);
      const propertyPerformance: PropertyPerformance[] = properties.map((property: any) => {
        const unitsCount = property.units_count || 1;
        const occupancyRate = Math.random() * 20 + 80; // 80-100% random for demo
        const occupiedUnits = Math.floor(unitsCount * (occupancyRate / 100));
        const averageRent = 1000 + Math.random() * 500; // $1000-1500 random for demo
        const monthlyRevenue = occupiedUnits * averageRent;
        
        return {
          propertyId: property.id,
          propertyName: property.name || property.address,
          address: property.address,
          totalUnits: unitsCount,
          occupiedUnits,
          monthlyRevenue,
          occupancyRate,
          collectionRate: 85 + Math.random() * 15, // 85-100% random for demo
          averageRent,
          profitability: monthlyRevenue * 0.3, // 30% profit margin estimate
        };
      });

      // Generate monthly trends (mock data for demo)
      const monthlyTrends: MonthlyTrend[] = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth - 11 + i + 12) % 12;
        const baseRevenue = financialMetrics.monthlyRevenue;
        const revenue = baseRevenue + (Math.random() - 0.5) * baseRevenue * 0.2; // ±20% variation
        const expenses = revenue * 0.3; // 30% expenses
        
        monthlyTrends.push({
          month: months[monthIndex],
          revenue,
          expenses,
          netIncome: revenue - expenses,
          occupancyRate: 85 + Math.random() * 15,
          collectionRate: 80 + Math.random() * 20,
        });
      }

      return {
        financialMetrics,
        occupancyMetrics,
        paymentMetrics,
        propertyPerformance,
        monthlyTrends,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch analytics data');
    }
  }
);

export const exportReport = createAsyncThunk(
  'reports/exportReport',
  async ({ format, reportType }: { format: 'pdf' | 'csv' | 'excel'; reportType: string }, { getState, rejectWithValue }) => {
    try {
      // In a real implementation, this would call a backend endpoint to generate and return the report
      // For now, we'll simulate the export process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      // Return download URL or success message
      return {
        downloadUrl: `https://example.com/reports/${reportType}_${Date.now()}.${format}`,
        format,
        reportType,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to export report');
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setTimeRange: (state, action: PayloadAction<ReportsState['selectedTimeRange']>) => {
      state.selectedTimeRange = action.payload;
    },
    setSelectedProperty: (state, action: PayloadAction<string | null>) => {
      state.selectedPropertyId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAnalyticsData: (state) => {
      state.financialMetrics = null;
      state.occupancyMetrics = null;
      state.paymentMetrics = null;
      state.propertyPerformance = [];
      state.monthlyTrends = [];
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch analytics data
      .addCase(fetchAnalyticsData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.financialMetrics = action.payload.financialMetrics;
        state.occupancyMetrics = action.payload.occupancyMetrics;
        state.paymentMetrics = action.payload.paymentMetrics;
        state.propertyPerformance = action.payload.propertyPerformance;
        state.monthlyTrends = action.payload.monthlyTrends;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Export report
      .addCase(exportReport.pending, (state) => {
        state.error = null;
      })
      .addCase(exportReport.fulfilled, (state) => {
        // Success handled in component
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setTimeRange,
  setSelectedProperty,
  clearError,
  clearAnalyticsData,
} = reportsSlice.actions;

export default reportsSlice.reducer;