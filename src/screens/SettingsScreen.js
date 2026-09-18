import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing, radius } from '../theme/theme';
import { registerForPushNotifications, disablePushNotifications } from '../services/notifications';

export default function SettingsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) return;
      try {
        const snap = await db.collection('users').doc(user.uid).get();
        if (snap.exists) {
          const data = snap.data();
          if (data.notificationsEnabled !== undefined) {
            setNotificationsEnabled(data.notificationsEnabled);
          }
          if (data.language && data.language !== i18n.language) {
            i18n.changeLanguage(data.language);
          }
        }
      } catch (e) {
        console.log('Erreur chargement paramètres:', e);
      }
    };
    loadSettings();
  }, [user]);

  const toggleNotifications = async (value) => {
    if (!user?.uid) return;
    if (value) {
      const result = await registerForPushNotifications(user.uid);
      if (result === 'denied' || result === null) {
        Alert.alert(t('settings.permissionAlertTitle'), t('settings.permissionAlertMessage'));
        return;
      }
    } else {
      await disablePushNotifications(user.uid);
    }

    setNotificationsEnabled(value);
    try {
      await db.collection('users').doc(user.uid).update({ notificationsEnabled: value });
    } catch (e) {
      Alert.alert(t('settings.errorAlertTitle'), t('settings.errorAlertMessage'));
      setNotificationsEnabled(!value);
    }
  };

  const changeLanguage = async (lang) => {
    i18n.changeLanguage(lang);
    if (user?.uid) {
      try {
        await db.collection('users').doc(user.uid).update({ language: lang });
      } catch (e) {
        console.log('Erreur sauvegarde langue:', e);
      }
    }
  };

  const LanguageSelector = () => (
    <View style={styles.card}>
      <View style={styles.langRow}>
        <TouchableOpacity
          style={[styles.langBtn, i18n.language === 'ar' && styles.langBtnActive]}
          onPress={() => changeLanguage('ar')}
        >
          <Text style={[styles.langBtnText, i18n.language === 'ar' && styles.langBtnTextActive]}>
            {t('settings.arabic')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, i18n.language === 'fr' && styles.langBtnActive]}
          onPress={() => changeLanguage('fr')}
        >
          <Text style={[styles.langBtnText, i18n.language === 'fr' && styles.langBtnTextActive]}>
            {t('settings.french')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={styles.groupLabel}>{t('settings.language')}</Text>
          <LanguageSelector />
        </ScrollView>
        <View style={styles.guestBox}>
          <Text style={styles.guestText}>{t('settings.guestMessage')}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.getParent()?.navigate('Login')}>
            <Text style={styles.loginBtnText}>{t('settings.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.groupLabel}>{t('settings.accountInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.value}>{user?.email || t('settings.notSet')}</Text>
            <Text style={styles.label}>{t('settings.email')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.value}>{user?.phoneNumber || t('settings.notSet')}</Text>
            <Text style={styles.label}>{t('settings.phone')}</Text>
          </View>
        </View>

        <Text style={styles.groupLabel}>{t('settings.notifications')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#ccc', true: colors.mustard }}
              thumbColor={colors.tarp}
            />
            <Text style={styles.label}>{t('settings.enableNotifications')}</Text>
          </View>
        </View>

        <Text style={styles.groupLabel}>{t('settings.language')}</Text>
        <LanguageSelector />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  sectionTitle: {
    color: colors.mustard,
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 20,
    paddingBottom: 4,
  },
  groupLabel: { color: colors.paper, opacity: 0.6, fontSize: 12.5, fontWeight: '700', marginTop: 20, marginBottom: 6, textAlign: 'right' },
  card: { backgroundColor: colors.paper, borderRadius: radius.lg, padding: 4 },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, gap: 10 },
  label: { fontSize: 15, color: colors.ink, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  value: { fontSize: 14, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.kraftDark, marginHorizontal: 12 },
  guestBox: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  guestText: { color: colors.paper, fontSize: 15, textAlign: 'center' },
  loginBtn: { backgroundColor: colors.marker, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  loginBtnText: { color: colors.paper, fontWeight: '700' },
  langRow: { flexDirection: 'row', gap: 4, padding: 4 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.lg - 4, alignItems: 'center' },
  langBtnActive: { backgroundColor: colors.mustard },
  langBtnText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  langBtnTextActive: { color: colors.ink },
});
