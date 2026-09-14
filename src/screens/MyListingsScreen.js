import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { subscribeToMyListings, softDeleteListing } from '../services/listings';
import { useTranslation } from 'react-i18next';

export default function MyListingsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMyListings(user.uid, (items) => {
      setListings(items);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleDelete = (item) => {
    Alert.alert(
      t('myListings.deleteTitle'),
      t('myListings.deleteMsg', { title: item.title }),
      [
        { text: t('myListings.cancel'), style: 'cancel' },
        {
          text: t('myListings.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteListing(item.id);
            } catch (error) {
              Alert.alert(t('myListings.errorTitle'), t('myListings.errorMsg', { error: error.message }));
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ fontSize: 28 }}>{item.emoji || '📦'}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.price}>{item.price} DH</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate('EditListing', { listing: item })}
          >
            <Text style={styles.actionText}>{t('myListings.editBtn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.actionText}>{t('myListings.deleteBtn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t('myListings.header')}</Text>
      {loading ? (
        <View style={styles.center}><Text style={{ color: colors.paper }}>{t('myListings.loading')}</Text></View>
      ) : listings.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>📦</Text>
          <Text style={styles.emptyText}>{t('myListings.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: colors.paper, opacity: 0.7 },
  card: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  image: { width: 70, height: 70, borderRadius: 12 },
  imagePlaceholder: { backgroundColor: colors.kraft, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontWeight: '900', fontSize: 14, color: colors.ink, textAlign: 'right' },
  price: { fontSize: 13, color: colors.muted, textAlign: 'right', marginTop: 2, marginBottom: 8 },
  actionsRow: { flexDirection: 'row-reverse', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editBtn: { backgroundColor: colors.kraft },
  deleteBtn: { backgroundColor: '#f8d7da' },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.ink },
});

