import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors } from '../theme/theme';
import { categories } from '../data/regions';
import ListingCard from '../components/ListingCard';
import { subscribeToListings } from '../services/listings';

export default function HomeScreen({ route, navigation }) {
  const city = route.params?.city || '--';
  const [activeCat, setActiveCat] = useState('الكل');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState({});
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // كنتنصتو على Firestore فالوقت الحقيقي — كل مرة كيتزاد أو يتبدل إعلان، الفيد كيتحدث بروحو
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToListings(city, activeCat, (items) => {
      setListings(items);
      setLoading(false);
    });
    return unsubscribe;
  }, [city, activeCat]);

  const filtered = search.trim()
    ? listings.filter((l) => l.title.includes(search.trim()))
    : listings;

  const toggleFav = (id) => setFavorites(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>جوطية</Text>
          <TouchableOpacity style={styles.locPill} onPress={() => navigation.getParent()?.navigate('Region')}>
            <Text style={styles.locPillText}>📍 {city} ↻</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.search}
          placeholder="قلّب على شي حاجة..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(c) => c}
        style={{ flexGrow: 0, marginTop: 12 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, activeCat === item && styles.chipActive]}
            onPress={() => setActiveCat(item)}
          >
            <Text style={[styles.chipText, activeCat === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={colors.mustard} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.empty}>ماكاينش إعلانات دابا فهاد المدينة، كن أول واحد ينشر 🚀</Text>}
          renderItem={({ item }) => (
            <ListingCard
              item={item}
              isFav={!!favorites[item.id]}
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
