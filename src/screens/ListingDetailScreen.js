import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Share, ActivityIndicator, Image } from 'react-native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { getOrCreateConversation } from '../services/chat';

export default function ListingDetailScreen({ route, navigation }) {
  const { listing } = route.params;
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const shareListing = async () => {
    try {
      await Share.share({
        message: `${listing.emoji} ${listing.title}\n💰 ${listing.price}\n📍 ${listing.loc}\nشوف الإعلان على تطبيق جوطية 👇`,
      });
    } catch (e) {}
  };

  const openChat = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (listing.userId === user.uid) return; // مايقدرش يهضر مع نفسو
    setConnecting(true);
    try {
      const conversationId = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: listing.title,
        listingEmoji: listing.emoji,
        sellerId: listing.userId,
        sellerPhone: listing.userPhone,
        buyerId: user.uid,
        buyerPhone: user.phoneNumber,
      });
      setConnecting(false);
      navigation.navigate('Chat', { conversationId, otherPhone: listing.userPhone, listing });
    } catch (e) {
      setConnecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageHeader}>
        {listing.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.headerImage} />
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
        <Text style={styles.loc}>📍 {listing.loc}</Text>

        <View style={styles.sellerRow}>
          <View style={styles.avatar}><Text style={{ color: colors.mustard, fontWeight: '900' }}>ن</Text></View>
          <View>
            <Text style={styles.sellerName}>نور الدين <Text style={styles.verified}> موثّق ✓</Text></Text>
            <Text style={styles.sellerSub}>🏘️ مزكّى من 6 جيران فالحي</Text>
          </View>
        </View>

        <Text style={styles.desc}>{listing.desc}</Text>

        {listing.trade ? (
          <View style={styles.tradeBox}>
            <Text style={styles.tradeTitle}>🔄 مستعد للمقايضة بـ:</Text>
            <Text style={styles.tradeText}>{listing.trade}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={openChat} disabled={connecting}>
          {connecting ? <ActivityIndicator color={colors.mustard} /> : <Text style={{ color: colors.mustard, fontWeight: '700' }}>💬 راسله</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]}>
          <Text style={{ color: colors.paper, fontWeight: '700' }}>📞 اتصل بيه</Text>
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
  headerImage: { width: '100%', height: '100%', position: 'absolute' },
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
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.marker },
  btnSecondary: { backgroundColor: colors.tarp },
  btnWhatsapp: { width: 52, backgroundColor: '#25D366', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
