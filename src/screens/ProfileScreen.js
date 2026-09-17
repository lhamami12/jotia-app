import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserDisplayName } from '../services/users';
import { subscribeToMyListings } from '../services/listings';
import { subscribeToFavoriteIds } from '../services/favorites';

const APP_VERSION = '1.0.0';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [listingsCount, setListingsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      const name = profile?.displayName || user.displayName || '';
      setDisplayName(name);
      setNameInput(name);
      setIsAdmin(profile?.isAdmin === true);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMyListings(user.uid, (items) => setListingsCount(items.length));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFavoriteIds(user.uid, (ids) => setFavoritesCount(ids.length));
    return unsub;
  }, [user]);

  const saveName = async () => {
    if (!nameInput.trim()) {
      Alert.alert(t('profile.nameEmptyTitle'), t('profile.nameEmptyMessage'));
      return;
    }
    setSaving(true);
    try {
      await updateUserDisplayName(user.uid, nameInput.trim());
      setDisplayName(nameInput.trim());
      setEditing(false);
    } catch (error) {
      Alert.alert(t('profile.errorTitle'), t('profile.saveNameError') + '\n' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.sectionTitle}>{t('profile.title')}</Text>
        <View style={styles.center}>
          <View style={styles.avatar}><Text style={{ fontSize: 28 }}>👤</Text></View>
          <Text style={styles.guestName}>{t('profile.guestName')}</Text>
          <Text style={styles.guestSub}>{t('profile.guestSub')}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.getParent()?.navigate('Login')}>
            <Text style={styles.loginBtnText}>{t('profile.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>{t('profile.title')}</Text>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: colors.mustard }]}>
            <Text style={{ fontSize: 20, color: colors.paper, fontWeight: '900' }}>
              {(displayName || user.phoneNumber || '?').slice(0, 1)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder={t('profile.namePlaceholder')}
                  placeholderTextColor={colors.muted}
                  textAlign="right"
                  autoFocus
                />
                <TouchableOpacity onPress={saveName} disabled={saving} style={styles.saveNameBtn}>
                  <Text style={styles.saveNameBtnText}>{saving ? t('profile.saving') : t('profile.save')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.phoneText}>{displayName || t('profile.addNameHint')}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.newBadge}>{user.phoneNumber || user.email || t('profile.newUser')}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.card} onPress={() => navigation.getParent()?.navigate('MyListings')}>
          <Text style={styles.chevron}>‹</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('profile.myListings', { count: listingsCount })}</Text>
            <Text style={styles.cardSub}>{listingsCount === 0 ? t('profile.myListingsEmpty') : t('profile.myListingsCount', { count: listingsCount })}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Favorites')}>
          <Text style={styles.chevron}>‹</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('profile.favorites', { count: favoritesCount })}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.groupLabel}>{t('profile.settingsLabel')}</Text>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.chevron}>‹</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('profile.settingsItem')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Privacy')}>
          <Text style={styles.chevron}>‹</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('profile.privacy')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('About')}>
          <Text style={styles.chevron}>‹</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('profile.about')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Contact')}>
          <Text style={styles.chevron}>‹</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('profile.contact')}</Text>
          </View>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdminReports')}>
            <Text style={styles.chevron}>‹</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{t('profile.adminPanel')}</Text>
            </View>
          </TouchableOpacity>
        )}

        {isAdmin && (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdminUsers')}>
            <Text style={styles.chevron}>‹</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{t('profile.adminUsers')}</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.card} onPress={logout}>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.marker }]}> {t('profile.logout')}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.versionText}>{t('profile.version', { version: APP_VERSION })}</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.kraft, alignItems: 'center', justifyContent: 'center' },
  guestName: { color: colors.paper, fontWeight: '900', fontSize: 17 },
  guestSub: { color: colors.paper, fontSize: 13, opacity: 0.7, textAlign: 'center' },
  loginBtn: { backgroundColor: colors.marker, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
  loginBtnText: { color: colors.paper, fontWeight: '700' },
  userCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, backgroundColor: colors.kraft, borderRadius: 16, padding: 16 },
  phoneText: { fontWeight: '900', fontSize: 16, color: colors.ink, textAlign: 'right' },
  newBadge: { fontSize: 11.5, color: colors.muted, textAlign: 'right', marginTop: 2 },
  editRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  nameInput: { flex: 1, backgroundColor: colors.paper, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: colors.ink },
  saveNameBtn: { backgroundColor: colors.marker, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  saveNameBtnText: { color: colors.paper, fontWeight: '700', fontSize: 12 },
  groupLabel: { color: colors.paper, opacity: 0.6, fontSize: 12.5, fontWeight: '700', marginTop: 20, marginBottom: 6, textAlign: 'right' },
  card: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: colors.paper, borderRadius: 16, padding: 14, marginTop: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontWeight: '700', fontSize: 13.5, color: colors.ink, textAlign: 'right' },
  cardSub: { fontSize: 11.5, color: colors.muted, textAlign: 'right', marginTop: 2 },
  chevron: { fontSize: 18, color: colors.muted, marginLeft: 8 },
  versionText: { textAlign: 'center', color: colors.paper, opacity: 0.4, fontSize: 11, marginTop: 24, marginBottom: 12 },
});
