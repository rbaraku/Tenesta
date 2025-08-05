import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { Property } from '../../types';

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PropertyState = {
  properties: [],
  selectedProperty: null,
  isLoading: false,
  error: null,
};

export const fetchProperties = createAsyncThunk(
  'property/fetchProperties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getProperties();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch properties');
    }
  }
);

export const createProperty = createAsyncThunk(
  'property/createProperty',
  async (propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const response = await apiService.createProperty(propertyData);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to create property');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'property/updateProperty',
  async ({ id, updates }: { id: string; updates: Partial<Property> }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateProperty(id, updates);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to update property');
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'property/deleteProperty',
  async (propertyId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.deleteProperty(propertyId);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return propertyId;
    } catch (error) {
      return rejectWithValue('Failed to delete property');
    }
  }
);

export const fetchPropertyDetails = createAsyncThunk(
  'property/fetchPropertyDetails',
  async (propertyId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getPropertyDetails(propertyId);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch property details');
    }
  }
);

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedProperty: (state, action: PayloadAction<Property | null>) => {
      state.selectedProperty = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Properties
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle Edge Function response format
        if (action.payload && action.payload.properties) {
          state.properties = action.payload.properties;
        } else if (Array.isArray(action.payload)) {
          state.properties = action.payload;
        } else {
          state.properties = [];
        }
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Property
    builder
      .addCase(createProperty.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle Edge Function response format
        if (action.payload && action.payload.property) {
          state.properties.push(action.payload.property);
        } else if (action.payload && !action.payload.property) {
          // If no property in response, assume the payload is the property
          state.properties.push(action.payload);
        }
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Property
    builder
      .addCase(updateProperty.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle Edge Function response format
        const property = action.payload?.property || action.payload;
        if (property && property.id) {
          const index = state.properties.findIndex(p => p.id === property.id);
          if (index !== -1) {
            state.properties[index] = property;
          }
          if (state.selectedProperty?.id === property.id) {
            state.selectedProperty = property;
          }
        }
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Property
    builder
      .addCase(deleteProperty.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.isLoading = false;
        state.properties = state.properties.filter(p => p.id !== action.payload);
        if (state.selectedProperty?.id === action.payload) {
          state.selectedProperty = null;
        }
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Property Details
    builder
      .addCase(fetchPropertyDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertyDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle Edge Function response format
        const property = action.payload?.property || action.payload;
        if (property) {
          state.selectedProperty = property;
          // Update in properties list if it exists
          const index = state.properties.findIndex(p => p.id === property.id);
          if (index !== -1) {
            state.properties[index] = property;
          }
        }
      })
      .addCase(fetchPropertyDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedProperty } = propertySlice.actions;
export default propertySlice.reducer;