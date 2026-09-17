import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, Alert, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';
import { searchUserByContact, setUserBlocked } from '../services/users';

export default function AdminUsersScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const found = await searchUserByContact(query);
      setResults(found);
    } catch (error) {
      Alert.alert(t('adminUsers.errorTitle'), error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleBlock = (item) => {
    const willBlock = !item.isBlocked;
    Alert.alert(
      willBlock ? t('adminUsers.blockConfirmTitle') : t('adminUsers.unblockConfirmTitle'),
      willBlock ? t('adminUsers.blockConfirmMsg') : t('adminUsers.unblockConfirmMsg'),
      [
        { text: t('adminUsers.cancel'), style: 'cancel' },
        {
          text: t('adminUsers.confirm'),
          style: willBlock ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await setUserBlocked(item.id, willBlock);
              setResults((prev) => prev.map((u) => (u.id === item.id ? { ...u, isBlocked: willBlock } : u)));
              Alert.alert('', willBlock ? t('adminUsers.blockedDone') : t('adminUsers.unblockedDone'));
            } catch (error) {
              Alert.alert(t('adminUsers.errorTitle'), error.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{t('adminUsers.resultName', { name: item.displayName || '—' })}</Text>
      {item.phoneNumber ? <Text style={styles.detail}>{t('adminUsers.resultPhone', { phone: item.phoneNumber })}</Text> : null}
      {item.email ? <Text style={styles.detail}>{t('adminUsers.resultEmail', { email: item.email })}</Text> : null}
      <Text style={[styles.status, item.isBlocked ? styles.statusBlocked : styles.statusActive]}>
        {item.isBlocked ? t('adminUsers.statusBlocked') : t('adminUsers.statusActive')}
      </Text>
      <TouchableOpacity
        style={[styles.actionBtn, item.isBlocked ? styles.unblockBtn : styles.blockBtn]}
        onPress={() => handleToggleBlock(item)}
      >
        <Text style={styles.actionText}>{item.isBlocked ? t('adminUsers.unblockBtn') : t('adminUsers.blockBtn')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t('adminUsers.header')}</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('adminUsers.searchPlaceholder')}
          placeholderTextColor={colors.muted}
          textAlign="right"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
          <Text style={styles.searchBtnText}>{searching ? t('adminUsers.searching') : t('adminUsers.searchBtn')}</Text>
        </TouchableOpacity>
      </View>

      {searched && !searching && results.length === 0 ? (
        <Text style={styles.noResults}>{t('adminUsers.noResults')}</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  header: {
    color: colors.mustard,
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 20,
    paddingBottom: 10,
    textAlign: 'right',
  },
  searchRow: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  input: { flex: 1, backgroundColor: colors.paper, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.ink },
  searchBtn: { backgroundColor: colors.marker, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: colors.paper, fontWeight: '900', fontSize: 13 },
  noResults: { color: colors.paper, opacity: 0.7, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: colors.paper, borderRadius: 16, padding: 14, marginBottom: 12 },
  name: { fontWeight: '900', fontSize: 14, color: colors.ink, textAlign: 'right' },
  detail: { fontSize: 12.5, color: colors.muted, textAlign: 'right', marginTop: 4 },
  status: { fontSize: 12.5, fontWeight: '700', textAlign: 'right', marginTop: 8 },
  statusBlocked: { color: '#c0392b' },
  statusActive: { color: '#2e7d32' },
  actionBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  blockBtn: { backgroundColor: '#f8d7da' },
  unblockBtn: { backgroundColor: '#d4edda' },
  actionText: { fontSize: 13, fontWeight: '700', color: colors.ink },
});
