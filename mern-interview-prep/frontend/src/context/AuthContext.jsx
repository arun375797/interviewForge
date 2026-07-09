import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearSession, getStoredToken, getStoredUser, setSession } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  // Only block the UI when we have a token but no cached user to trust yet.
  const [booting, setBooting] = useState(() => {
    const existingToken = getStoredToken();
    const existingUser = getStoredUser();
    return Boolean(existingToken && !existingUser);
  });

  useEffect(() => {
    let alive = true;
    const existing = getStoredToken();
    if (!existing) {
      setBooting(false);
      return undefined;
    }

    // Returning visitors already have token + user in localStorage — paint immediately
    // and revalidate in the background instead of blocking on a cold API.
    if (getStoredUser()) {
      setBooting(false);
    }

    api
      .me()
      .then((me) => {
        if (!alive) return;
        setUser(me);
        setToken(existing);
        setSession(existing, me);
      })
      .catch(() => {
        if (!alive) return;
        clearSession();
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        if (alive) setBooting(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      booting,
      login,
      logout,
    }),
    [user, token, booting, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
