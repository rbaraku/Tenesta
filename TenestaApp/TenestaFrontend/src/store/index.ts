import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import propertySlice from './slices/propertySlice';
import paymentSlice from './slices/paymentSlice';
import landlordSlice from './slices/landlordSlice';
import tenantSlice from './slices/tenantSlice';
import reportsSlice from './slices/reportsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    property: propertySlice,
    payment: paymentSlice,
    landlord: landlordSlice,
    tenant: tenantSlice,
    reports: reportsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;