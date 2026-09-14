import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

const badgeMap = {
  sale: { bg: '#e6efe8', color: colors.green, label: 'للبيع' },
  trade: { bg: '#f6e9d6', color: '#8a5a17', label: 'مقايضة' },
  both: { bg: '#efe3e3', color: colors.marker, label: 'بيع/مقايضة' },
};

export default function ListingCard({ item, onPress, onToggleFav, isFav }) {
  const badge = badgeMap[item.type] || badgeMap.sale;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageBox}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
        )}
        <TouchableOpacity style={[styles.favBtn, isFav && styles.favBtnOn]} onPress={onToggleFav}>
          <Text>{isFav ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.loc}>📍 {item.city}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{item.price}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={{ color: badge.color, fontSize: 10.5, fontWeight: '700' }}>{badge.label}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.paper, borderRadius: 16, overflow: 'hidden', marginBottom: 14, elevation: 3, height: 130 },
  imageBox: { width: 110, height: 130, backgroundColor: '#cbb98c', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  favBtn: { position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,.35)', alignItems: 'center', justifyContent: 'center' },
  favBtnOn: { backgroundColor: 'rgba(193,59,47,.85)' },
  body: { flex: 1, padding: 12, justifyContent: 'space-between' },
  title: { fontWeight: '700', fontSize: 14, color: colors.ink, textAlign: 'right' },
  loc: { fontSize: 11.5, color: colors.muted, textAlign: 'right', marginTop: 4 },
  bottomRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { fontSize: 16, color: colors.marker, fontWeight: '900' },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
});
