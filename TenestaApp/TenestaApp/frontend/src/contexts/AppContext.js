import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const initialState = {
  properties: [],
  tenancies: [],
  payments: [],
  documents: [],
  disputes: [],
  notifications: [],
  loading: {
    dashboard: false,
    properties: false,
    payments: false,
  },
  cache: {},
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.key]: action.value },
      };
    case 'SET_PROPERTIES':
      return { ...state, properties: action.payload };
    case 'SET_TENANCIES':
      return { ...state, tenancies: action.payload };
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload };
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    case 'SET_DISPUTES':
      return { ...state, disputes: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_PROPERTY':
      return { ...state, properties: [...state.properties, action.payload] };
    case 'UPDATE_PROPERTY':
      return {
        ...state,
        properties: state.properties.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'CACHE_SET':
      return {
        ...state,
        cache: { ...state.cache, [action.key]: action.value },
      };
    default:
      return state;
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value = {
    ...state,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
