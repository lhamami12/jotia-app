import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors } from '../theme/theme';
import { categories } from '../data/regions';
import ListingCard from '../components/ListingCard';
import { subscribeToListings, subscribeToAllListings } from '../services/listings';
import { toggleFavorite, subscribeToFavoriteIds } from '../services/favorites';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function HomeScreen({ route, navigation }) {
  const city = route.params?.city || '--';
  const { t } = useTranslation();
  const [activeCat, setActiveCat] = useState('الكل');
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [listings, setListings] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchStarted, setSearchStarted] = useState(false);

  // القائمة العادية المفلترة بالمدينة والفئة
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToListings(city, activeCat, (items) => {
      setListings(items);
      setLoading(false);
    });
    return unsubscribe;
  }, [city, activeCat]);

  // كنبداو البحث الشامل غير أول مرة يكتب المستخدم شي حاجة (باش ما نزيدوش قراءات بلا داعي)
  useEffect(() => {
    if (search.trim() && !searchStarted) {
      setSearchStarted(true);
    }
  }, [search]);

  useEffect(() => {
    if (!searchStarted) return;
    const unsubscribe = subscribeToAllListings((items) => {
      setAllListings(items);
    });
    return unsubscribe;
  }, [searchStarted]);

  const searchTerm = search.trim().toLowerCase();
  const isSearching = searchTerm.length > 0;

  const filtered = isSearching
    ? allListings.filter((l) => {
        const haystack = `${l.title || ''} ${l.desc || ''} ${l.cat || ''} ${l.city || ''}`.toLowerCase();
        return haystack.includes(searchTerm);
      })
    : listings;

  const toggleFav = async (id) => {
    if (!user) return;
    const isFav = favoriteIds.includes(id);
    try {
      await toggleFavorite(user.uid, id, isFav);
    } catch (error) {
      console.log('خطأ فالمفضلة:', error.message);
    }
  };

  useEffect(() => {
    const unsub = subscribeToFavoriteIds(user?.uid, (ids) => setFavoriteIds(ids));
    return unsub;
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>{t('home.brand')}</Text>
        </View>
        <TextInput
          style={styles.search}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
      </View>

      {!isSearching && (
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(c) => c}
          style={{ flexGrow: 0, marginTop: 12 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          showsHorizontalScrollIndicator={false}
          ListHeaderComponent={() => (
            <TouchableOpacity style={styles.locPill} onPress={() => navigation.getParent()?.navigate('Region')}>
              <Text style={styles.locPillText}>📍 {city} ↻</Text>
            </TouchableOpacity>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, activeCat === item && styles.chipActive]}
              onPress={() => setActiveCat(item)}
            >
              <Text style={[styles.chipText, activeCat === item && styles.chipTextActive]}>{t('categories.' + item, item)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {loading && !isSearching ? (
        <ActivityIndicator color={colors.mustard} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isSearching ? t('home.noResults', { term: search.trim() }) : t('home.emptyState')}
            </Text>
          }
          renderItem={({ item }) => (
            <ListingCard
              item={item}
              isFav={favoriteIds.includes(item.id)}
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
  header: { backgroundColor: colors.tarpDark, padding: 18 },
  topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 24, fontWeight: '900', color: colors.mustard },
  locPill: { backgroundColor: 'rgba(247,243,232,.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  locPillText: { color: colors.paper, fontSize: 12, fontWeight: '700' },
  search: { marginTop: 14, backgroundColor: colors.paper, borderRadius: 12, padding: 12, fontSize: 13, color: colors.ink },
  chip: { backgroundColor: colors.kraft, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  chipActive: { backgroundColor: colors.marker },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  chipTextActive: { color: colors.paper },
  empty: { color: colors.paper, textAlign: 'center', marginTop: 40, opacity: 0.7 },
});
