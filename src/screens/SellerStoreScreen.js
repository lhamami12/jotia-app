import { dir, isRTL } from '../i18n';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';
import { subscribeToMyListings } from '../services/listings';
import { subscribeToSellerReviews } from '../services/reviews';

const AVATAR_COLORS = ['#1F3A47', '#C0392B', '#D9A441', '#2E7D5B', '#6C4A8B', '#B5651D', '#2C6E91', '#8E3B46'];
function avatarColor(id) {
  const str = String(id || '');
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initialOf(name) {
  const first = Array.from(String(name || '').trim())[0];
  return first ? first.toUpperCase() : '👤';
}

export default function SellerStoreScreen({ route, navigation }) {
  const { sellerId, sellerName } = route.params || {};
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!sellerId) return;
    const unsubL = subscribeToMyListings(sellerId, (items) => { setListings(items); setLoading(false); });
    const unsubR = subscribeToSellerReviews(sellerId, setReviews);
    const timer = setTimeout(() => setLoading(false), 8000);
    return () => { unsubL && unsubL(); unsubR && unsubR(); clearTimeout(timer); };
  }, [sellerId]);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : null;

  const header = (
    <View style={styles.header}>
      <View style={[styles.bigAvatar, { backgroundColor: avatarColor(sellerId) }]}>
        <Text style={styles.bigInitial}>{initialOf(sellerName)}</Text>
      </View>
      <Text style={styles.name}>{sellerName || t('detail.defaultSeller')}</Text>
      <Text style={styles.rating}>
        {avg ? `⭐ ${avg} (${reviews.length})` : t('rating.noRatingsYet')}
      </Text>
      <Text style={[styles.section, { textAlign: dir.align }]}>
        {t('store.listings', { count: listings.length })}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}
      onPress={() => navigation.push('ListingDetail', { listing: item })}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={{ fontSize: 34 }}>{item.emoji || '📦'}</Text>
        </View>
      )}
      <View style={{ padding: 10 }}>
        <Text style={[styles.title, { textAlign: dir.align }]} numberOfLines={2}>{item.title}</Text>
        {!!item.price && <Text style={[styles.price, { textAlign: dir.align }]}>{item.price} DH</Text>}
        {!!item.city && <Text style={[styles.city, { textAlign: dir.align }]}>📍 {item.city}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Text style={styles.back}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t('store.title')}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.mustard} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(i) => i.id}
          numColumns={2}
          ListHeaderComponent={header}
          renderItem={renderItem}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 30 }}
          ListEmptyComponent={<Text style={styles.empty}>{t('store.empty')}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  back: { color: colors.mustard, fontSize: 26, fontWeight: '800' },
  topTitle: { color: '#F5EFE3', fontSize: 20, fontWeight: '800' },
  header: { alignItems: 'center', paddingTop: 12, paddingBottom: 4, paddingHorizontal: 16 },
  bigAvatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.mustard },
  bigInitial: { color: '#FFFFFF', fontSize: 38, fontWeight: '900' },
  name: { color: '#F5EFE3', fontSize: 22, fontWeight: '800', marginTop: 10 },
  rating: { color: '#E8DCC4', fontSize: 15, marginTop: 4 },
  section: { alignSelf: 'stretch', color: colors.mustard, fontSize: 17, fontWeight: '800', marginTop: 22, marginBottom: 4 },
  card: { flex: 1, maxWidth: '48%', backgroundColor: '#F7F1E6', borderRadius: 16, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: '#E8DCC4' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  title: { color: '#1F2A30', fontSize: 14, fontWeight: '700' },
  price: { color: '#C0392B', fontSize: 16, fontWeight: '900', marginTop: 4 },
  city: { color: '#7A7468', fontSize: 12, marginTop: 2 },
  empty: { color: '#E8DCC4', textAlign: 'center', marginTop: 40, fontSize: 15 },
});
