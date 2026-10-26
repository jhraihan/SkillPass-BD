import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

/**
 * const { user, isAuthenticated, status, signIn, signOut } = useAuth();
 * status: 'loading' while the saved session is checked, then 'ready'.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
