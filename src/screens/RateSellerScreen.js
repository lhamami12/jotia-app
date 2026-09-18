import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, StatusBar, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { submitReview } from '../services/reviews';

export default function RateSellerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sellerId, sellerName, listingId } = route.params;
  const { user } = useAuth();
  const { t } = useTranslation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert(t('rating.missingRatingTitle'), t('rating.missingRatingMsg'));
      return;
    }
    setSending(true);
    try {
      await submitReview({
        sellerId,
        buyerId: user.uid,
        buyerName: user.displayName || null,
        rating,
        comment: comment.trim(),
        listingId,
      });
      Alert.alert(t('rating.successTitle'), t('rating.successMsg'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t('rating.errorTitle'), t('rating.errorMsg', { error: error.message }));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t('rating.screenHeader')}</Text>
      <Text style={styles.sellerName}>{sellerName}</Text>

      <Text style={styles.label}>{t('rating.ratingLabel')}</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, n <= rating && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        value={comment}
        onChangeText={setComment}
        multiline
        placeholder={t('rating.commentPlaceholder')}
        placeholderTextColor={colors.muted}
        textAlign="right"
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={sending}>
        <Text style={styles.submitBtnText}>{sending ? t('rating.submitting') : t('rating.submitBtn')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp, padding: 20 },
  header: {
    color: colors.mustard,
    fontSize: 18,
    fontWeight: '900',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
    marginBottom: 4,
    textAlign: 'right',
  },
  sellerName: { color: colors.paper, fontSize: 14, opacity: 0.75, marginBottom: 24, textAlign: 'right' },
  label: { color: colors.paper, fontSize: 13, fontWeight: '700', marginBottom: 10, textAlign: 'right' },
  starsRow: { flexDirection: 'row-reverse', gap: 6, marginBottom: 24 },
  star: { fontSize: 36, color: colors.muted },
  starActive: { color: colors.mustard },
  input: { backgroundColor: colors.paper, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.ink, marginBottom: 20 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.marker, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: colors.paper, fontWeight: '900', fontSize: 15 },
});
