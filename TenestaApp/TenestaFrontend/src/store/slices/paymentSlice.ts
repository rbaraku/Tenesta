import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { Payment } from '../../types';

interface PaymentState {
  payments: Payment[];
  selectedPayment: Payment | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  selectedPayment: null,
  isLoading: false,
  error: null,
};

export const fetchPayments = createAsyncThunk(
  'payment/fetchPayments',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getPayments();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch payments');
    }
  }
);

export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (paymentData: {
    tenancy_id: string;
    amount: number;
    payment_method: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.processPayment(paymentData);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to process payment');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedPayment: (state, action: PayloadAction<Payment | null>) => {
      state.selectedPayment = action.payload;
    },
    updatePaymentStatus: (state, action: PayloadAction<{ id: string; status: Payment['status'] }>) => {
      const payment = state.payments.find(p => p.id === action.payload.id);
      if (payment) {
        payment.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Payments
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Process Payment
    builder
      .addCase(processPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update or add the payment
        const existingIndex = state.payments.findIndex(p => p.id === action.payload.payment.id);
        if (existingIndex >= 0) {
          state.payments[existingIndex] = action.payload.payment;
        } else {
          state.payments.push(action.payload.payment);
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedPayment, updatePaymentStatus } = paymentSlice.actions;
export default paymentSlice.reducer;