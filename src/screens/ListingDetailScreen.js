import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Share, ActivityIndicator, Image, Linking, Alert, Dimensions } from 'react-native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { getOrCreateConversation } from '../services/chat';
import { getUserProfile } from '../services/users';
import { subscribeToListings } from '../services/listings';
import { subscribeToSellerReviews, hasUserRatedSeller } from '../services/reviews';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen({ route, navigation }) {
  const { listing } = route.params;
  const { user } = useAuth();
  const { t } = useTranslation();
  const [connecting, setConnecting] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [sellerName, setSellerName] = useState(t('detail.defaultSeller'));
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [alreadyRated, setAlreadyRated] = useState(false);

  const images = listing.imageUrls && listing.imageUrls.length ? listing.imageUrls : [];

  useEffect(() => {
    if (!listing.userId) return;
    getUserProfile(listing.userId).then((profile) => {
      if (profile?.displayName) setSellerName(profile.displayName);
    });
  }, [listing.userId]);

  useEffect(() => {
    const unsub = subscribeToListings(listing.city, listing.cat, (items) => {
      setSimilar(items.filter((it) => it.id !== listing.id).slice(0, 6));
    });
    return unsub;
  }, [listing.city, listing.cat]);

  useEffect(() => {
    if (!listing.userId) return;
    const unsub = subscribeToSellerReviews(listing.userId, setReviews);
    return unsub;
  }, [listing.userId]);

  useEffect(() => {
    if (!listing.userId || !user || user.uid === listing.userId) return;
    hasUserRatedSeller(listing.userId, user.uid).then(setAlreadyRated).catch(() => {});
  }, [listing.userId, user]);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const shareListing = async () => {
    try {
      const locLine = listing.city ? `📍 ${listing.city}\n` : '';
      await Share.share({
        message: t('detail.shareMessage', { emoji: listing.emoji, title: listing.title, price: listing.price, locLine }),
      });
    } catch (e) {}
  };

  const callSeller = () => {
    if (!listing.userPhone) {
      Alert.alert(t('detail.phoneUnavailableTitle'), t('detail.phoneUnavailableMsg'));
      return;
    }
    Linking.openURL(`tel:${listing.userPhone}`);
  };

  const openChat = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (listing.userId === user.uid) return;
    setConnecting(true);
    try {
      const [sellerProfile, buyerProfile] = await Promise.all([
        getUserProfile(listing.userId),
        getUserProfile(user.uid),
      ]);
      const sellerName = sellerProfile?.displayName || null;
      const buyerName = buyerProfile?.displayName || user.displayName || null;
      const conversationId = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: listing.title,
        listingEmoji: listing.emoji,
        sellerId: listing.userId,
        sellerPhone: listing.userPhone,
        sellerName,
        buyerId: user.uid,
        buyerPhone: user.phoneNumber,
        buyerName,
      });
      setConnecting(false);
      navigation.navigate('Chat', { conversationId, otherPhone: listing.userPhone, otherName: sellerName, listing });
    } catch (e) {
      setConnecting(false);
      Alert.alert(t('detail.chatErrorTitle'), t('detail.chatErrorMsg', { error: e.message }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageHeader}>
        {images.length > 0 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveImg(idx);
              }}
            >
              {images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={[styles.headerImage, { width }]} />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.dotsRow}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={{ fontSize: 64 }}>{listing.emoji}</Text>
        )}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff' }}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={shareListing}>
          <Text style={{ color: '#fff' }}>↗️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>{listing.price}</Text>
        {listing.city ? <Text style={styles.loc}>📍 {listing.city}</Text> : null}

        <View style={styles.sellerRow}>
          <View style={styles.avatar}><Text style={{ color: colors.mustard, fontWeight: '900' }}>ن</Text></View>
          <View>
            <Text style={styles.sellerName}>{sellerName}</Text>
            <Text style={styles.sellerSub}>
              {avgRating ? `⭐ ${t('rating.sellerRating', { avg: avgRating, count: reviews.length })}` : t('rating.noRatingsYet')}
            </Text>
          </View>
        </View>

        <Text style={styles.desc}>{listing.desc}</Text>

        {listing.trade ? (
          <View style={styles.tradeBox}>
            <Text style={styles.tradeTitle}>{t('detail.tradeTitle')}</Text>
            <Text style={styles.tradeText}>{listing.trade}</Text>
          </View>
        ) : null}
        {user && listing.userId !== user.uid && !alreadyRated ? (
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => navigation.navigate('RateSeller', { sellerId: listing.userId, sellerName, listingId: listing.id })}
          >
            <Text style={styles.rateBtnText}>{t('rating.rateSellerBtn')}</Text>
          </TouchableOpacity>
        ) : null}

        {user && listing.userId !== user.uid && alreadyRated ? (
          <Text style={styles.alreadyRatedText}>{t('rating.alreadyRated')}</Text>
        ) : null}

        {reviews.length > 0 ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.similarTitle}>{t('rating.recentReviewsTitle')}</Text>
            {reviews.slice(0, 2).map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                  <Text style={styles.reviewAuthor}>{r.buyerName || '—'}</Text>
                </View>
                {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate("ReportListing", { listing })}>
          <Text style={styles.reportBtnText}>{t('detail.reportBtn')}</Text>
        </TouchableOpacity>

        {similar.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.similarTitle}>{t('detail.similarTitle')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {similar.map((item) => (
                <TouchableOpacity key={item.id} style={styles.similarCard} onPress={() => navigation.push("ListingDetail", { listing: item })}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.similarImg} />
                  ) : (
                    <View style={[styles.similarImg, { alignItems: "center", justifyContent: "center" }]}><Text style={{ fontSize: 28 }}>{item.emoji}</Text></View>
                  )}
                  <Text style={styles.similarTitleText} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.similarPrice}>{item.price} DH</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={openChat} disabled={connecting}>
          {connecting ? <ActivityIndicator color={colors.mustard} /> : <Text style={{ color: colors.mustard, fontWeight: '700' }}>{t('detail.chatBtn')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={callSeller}>
          <Text style={{ color: colors.paper, fontWeight: '700' }}>{t('detail.callBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnWhatsapp} onPress={shareListing}>
          <Text style={{ fontSize: 18 }}>📤</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  imageHeader: { height: 260, backgroundColor: '#cbb98c', alignItems: 'center', justifyContent: 'center' },
  headerImage: { height: 260 },
  dotsRow: { position: 'absolute', bottom: 10, flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center' },
  shareBtn: { position: 'absolute', top: 16, left: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontSize: 19, fontWeight: '900', color: colors.ink, textAlign: 'right' },
  price: { fontSize: 28, fontWeight: '900', color: colors.marker, textAlign: 'right', marginTop: 6 },
  loc: { fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 4 },
  sellerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginTop: 20, backgroundColor: '#efe8d8', padding: 12, borderRadius: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.tarp, alignItems: 'center', justifyContent: 'center' },
  sellerName: { fontWeight: '700', fontSize: 14, color: colors.ink, textAlign: 'right' },
  verified: { fontSize: 9.5, color: colors.green },
  sellerSub: { fontSize: 11.5, color: colors.muted, textAlign: 'right', marginTop: 3 },
  desc: { marginTop: 16, fontSize: 13.5, lineHeight: 22, color: '#4a4238', textAlign: 'right' },
  tradeBox: { marginTop: 16, backgroundColor: '#f6e9d6', borderRadius: 14, padding: 14, borderWidth: 2, borderColor: '#c9a35a', borderStyle: 'dashed' },
  tradeTitle: { fontWeight: '700', color: '#8a5a17', fontSize: 15, textAlign: 'right' },
  tradeText: { fontSize: 13, color: '#6b4e17', textAlign: 'right', marginTop: 4 },
  actionBar: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: colors.paper, elevation: 10 },
  reportBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 10 },
  reportBtnText: { color: colors.muted, fontSize: 12.5, fontWeight: '700' },
  similarTitle: { fontSize: 15, fontWeight: '900', color: colors.ink, textAlign: 'right', marginBottom: 10 },
  similarCard: { width: 120, backgroundColor: '#efe8d8', borderRadius: 12, padding: 8 },
  similarImg: { width: 104, height: 90, borderRadius: 10, backgroundColor: colors.tarp },
  similarTitleText: { fontSize: 12, fontWeight: '700', color: colors.ink, textAlign: 'right', marginTop: 6 },
  similarPrice: { fontSize: 12.5, fontWeight: '900', color: colors.marker, textAlign: 'right', marginTop: 2 },
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.marker },
  btnSecondary: { backgroundColor: colors.tarp },
  btnWhatsapp: { width: 52, backgroundColor: '#25D366', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rateBtn: { marginTop: 18, backgroundColor: colors.mustard, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  rateBtnText: { color: colors.ink, fontWeight: '900', fontSize: 14 },
  alreadyRatedText: { marginTop: 18, textAlign: 'center', color: colors.muted, fontSize: 12.5, fontWeight: '700' },
  reviewCard: { backgroundColor: '#efe8d8', borderRadius: 12, padding: 12, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  reviewStars: { color: colors.mustard, fontSize: 13 },
  reviewAuthor: { fontWeight: '700', fontSize: 12.5, color: colors.ink },
  reviewComment: { fontSize: 12.5, color: '#4a4238', textAlign: 'right', marginTop: 6, lineHeight: 18 },
});
