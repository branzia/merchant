import React, { createContext, useContext, useEffect, useState } from 'react';
import * as api from '@/services/api';

type Merchant = Record<string, any>;

interface AuthContextType {
  merchant: Merchant | null;
  token: string | null;
  isLoading: boolean;
  signIn: (token: string, merchant: Merchant) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMerchant: (merchant: Merchant) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await api.getToken();
      if (!t) {
        setIsLoading(false);
        return;
      }

      // 1. Restore from SecureStore instantly — no network needed
      const cached = await api.getCachedMerchant();
      if (cached) {
        setToken(t);
        setMerchant(cached);
        setIsLoading(false); // UI unblocks immediately
      }

      // 2. Refresh merchant profile in the background
      const res = await api.getMe();
      if (res.status === 200) {
        const fresh = res.data.merchant;
        setToken(t);
        setMerchant(fresh);
        await api.saveMerchant(fresh);
        if (!cached) setIsLoading(false); // first-ever launch still waits
      } else {
        // Token expired or invalid
        await api.clearToken();
        setToken(null);
        setMerchant(null);
        if (!cached) setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async (t: string, m: Merchant) => {
    await api.setToken(t);
    await api.saveMerchant(m);
    setToken(t);
    setMerchant(m);
  };

  const signOut = async () => {
    await api.logout();
    await api.clearToken(); // also wipes saveMerchant + in-memory cache
    setToken(null);
    setMerchant(null);
  };

  const refreshMerchant = (m: Merchant) => {
    setMerchant(m);
    api.saveMerchant(m); // keep SecureStore in sync, fire-and-forget
  };

  return (
    <AuthContext.Provider
      value={{ merchant, token, isLoading, signIn, signOut, refreshMerchant }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
