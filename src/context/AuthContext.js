import React, { createContext, useContext, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import { registerForPushNotifications } from '../services/notifications';

const AuthContext = createContext({ user: null, loading: true, logout: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // تسجيل مستمع للتغييرات على حالة تسجيل الدخول (دخول جديد، خروج، تجديد الدخول)
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        // ملء خدي المستخدم الجديد بأرقام تسجيل إشعاراته
        registerForPushNotifications(firebaseUser.uid).catch(() => {});
      }
    });
    return unsubscribe;
  }, []);

  const logout = () => auth().signOut();

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
