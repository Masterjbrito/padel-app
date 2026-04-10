import React, { createContext, useContext, useEffect, useState } from 'react';
import { ouvirAuthState, obterPerfil } from '../services/authService';
import { registarNotificacoes } from '../services/notificationService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = ouvirAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        console.log('🔑 UID do utilizador:', firebaseUser.uid);
        const p = await obterPerfil(firebaseUser.uid);
        console.log('👤 Perfil carregado:', JSON.stringify(p));
        setPerfil(p);
        registarNotificacoes(firebaseUser.uid).catch(() => {});
      } else {
        setUser(null);
        setPerfil(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isEditor = perfil?.role === 'editor' || perfil?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, perfil, loading, isEditor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
