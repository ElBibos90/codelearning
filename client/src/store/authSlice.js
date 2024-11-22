import { createSlice } from '@reduxjs/toolkit';

// Verifica se c'è un token salvato
const token = localStorage.getItem('token');
const userString = localStorage.getItem('user');

const initialState = {
  user: userString ? JSON.parse(userString) : null,
  token: token,
  isLoading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      // Salva sia il token che l'utente
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      // Rimuovi entrambi
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;