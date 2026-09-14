import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { subscribeToFavoriteIds, toggleFavorite } from '../services/favorites';
import { getListingById } from '../services/listings';
import ListingCard from '../components/ListingCard';
import { useTranslation } from 'react-i18next';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToFavoriteIds(user?.uid, (ids) => setFavoriteIds(ids));
    return unsub;
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all(favoriteIds.map((id) => getListingById(id)))
      .then((results) => {
        if (active) {
          setListings(results.filter((l) => l && !l.deleted));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [favoriteIds]);

  const toggleFav = async (id) => {
    if (!user) return;
    try {
      await toggleFavorite(user.uid, id, true);
    } catch (error) {
      console.log('خطأ فالمفضلة:', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t('favorites.header', { count: listings.length })}</Text>
      {loading ? (
        <ActivityIndicator color={colors.mustard} style={{ marginTop: 40 }} />
      ) : listings.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🤍</Text>
          <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <ListingCard
              item={item}
              isFav={true}
              onToggleFav={() => toggleFav(item.id)}
              onPress={() => navigation.navigate('ListingDetail', { listing: item })}
            />
          )}
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
});
