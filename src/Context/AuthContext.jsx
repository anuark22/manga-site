import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getStoredUser, getToken, getRefreshToken, refreshSession, setAuthData, clearAuthData } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sincroniza estado al iniciar y renueva silenciosamente si el JWT expiró pero hay Refresh Token
    const syncAuth = async () => {
      let storedToken = getToken();
      if (!storedToken && getRefreshToken()) {
        const renewed = await refreshSession();
        storedToken = renewed?.token || null;
      }
      const storedUser = storedToken ? getStoredUser() : null;
      setToken(storedToken);
      setUser(storedUser);
    };

    const syncFromStorage = () => {
      const storedToken = getToken();
      const storedUser = storedToken ? getStoredUser() : null;
      setToken(storedToken);
      setUser(storedUser);
    };

    syncAuth().finally(() => setLoading(false));

    window.addEventListener('oms:auth-expired', syncFromStorage);
    window.addEventListener('oms:auth-refreshed', syncFromStorage);
    window.addEventListener('focus', syncAuth);
    return () => {
      window.removeEventListener('oms:auth-expired', syncFromStorage);
      window.removeEventListener('oms:auth-refreshed', syncFromStorage);
      window.removeEventListener('focus', syncAuth);
    };
  }, []);

  const login = async ({ email, password, honeypot = '', recaptchaToken = '' }) => {
    const loggedUser = await authApi.login({ email, password, honeypot, recaptchaToken });
    setUser(loggedUser);
    setToken(loggedUser.token);
    return loggedUser;
  };

  const googleLogin = async ({ idToken, honeypot = '' }) => {
    const loggedUser = await authApi.googleAuth({ idToken, honeypot });
    setUser(loggedUser);
    setToken(loggedUser.token);
    return loggedUser;
  };

  const register = async ({ username, email, password, honeypot = '', recaptchaToken = '' }) => {
    const res = await authApi.register({ username, email, password, aceptTerms: true, honeypot, recaptchaToken });
    // Tras registrarse con éxito, intentamos inicio de sesión automático
    try {
      const loggedUser = await authApi.login({ email, password, honeypot, recaptchaToken });
      setUser(loggedUser);
      setToken(loggedUser.token);
      return loggedUser;
    } catch {
      return res;
    }
  };

  const logout = () => {
    const activeToken = getToken();
    if (activeToken) {
      fetch('/api/Users/Logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` }
      }).catch(() => {});
    }
    clearAuthData();
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const next = { ...prev, ...updatedFields };
      setAuthData(token, next);
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        loading,
        login,
        googleLogin,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
