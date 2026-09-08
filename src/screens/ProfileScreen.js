import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.sectionTitle}>حسابي</Text>
        <View style={styles.center}>
          <View style={styles.avatar}><Text style={{ fontSize: 28 }}>👤</Text></View>
          <Text style={styles.guestName}>زائر جوطية</Text>
          <Text style={styles.guestSub}>سجل الدخول باش تنشر وتتواصل مع البائعين</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.getParent()?.navigate('Login')}>
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>حسابي</Text>
      <View style={{ padding: 20 }}>
        <View style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: colors.marker }]}>
            <Text style={{ fontSize: 20, color: colors.paper, fontWeight: '900' }}>
              {(user.phoneNumber || '?').slice(-1)}
            </Text>
          </View>
          <View>
            <Text style={styles.phoneText}>{user.phoneNumber}</Text>
            <Text style={styles.newBadge}>جديد فالمنصة</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>📦 إعلاناتي (0)</Text>
          <Text style={styles.cardSub}>ماعندكش إعلانات منشورة حاليا</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>❤️ المفضلة (0)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={logout}>
          <Text style={[styles.cardTitle, { color: colors.marker }]}>🚪 تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  sectionTitle: { color: colors.mustard, fontSize: 18, fontWeight: '900', padding: 20, paddingBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.kraft, alignItems: 'center', justifyContent: 'center' },
  guestName: { color: colors.paper, fontWeight: '900', fontSize: 17 },
  guestSub: { color: colors.paper, fontSize: 13, opacity: 0.7, textAlign: 'center' },
  loginBtn: { backgroundColor: colors.marker, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
  loginBtnText: { color: colors.paper, fontWeight: '700' },
  userCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, backgroundColor: colors.kraft, borderRadius: 16, padding: 16 },
  phoneText: { fontWeight: '900', fontSize: 16, color: colors.ink, textAlign: 'right' },
  newBadge: { fontSize: 11.5, color: colors.muted, textAlign: 'right', marginTop: 2 },
  card: { backgroundColor: colors.paper, borderRadius: 16, padding: 14, marginTop: 12 },
  cardTitle: { fontWeight: '700', fontSize: 13.5, color: colors.ink, textAlign: 'right' },
  cardSub: { fontSize: 11.5, color: colors.muted, textAlign: 'right', marginTop: 2 },
});
