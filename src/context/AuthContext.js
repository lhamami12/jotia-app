import React, { createContext, useContext, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import { registerForPushNotifications } from '../services/notifications';
import { getUserProfile } from '../services/users';
import { Alert } from 'react-native';

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
          getUserProfile(firebaseUser.uid).then((profile) => {
            if (profile?.isBlocked) {
              Alert.alert('حساب موقف', 'تم توقيف حسابك. تواصل معنا للمزيد من المعلومات.');
              auth().signOut();
            }
          }).catch(() => {});
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
