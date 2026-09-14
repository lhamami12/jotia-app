import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, ScrollView, Alert, Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { submitReport } from '../services/reports';
import { useTranslation } from 'react-i18next';

const REASONS = [
  { key: 'duplicate', label: 'إعلان مكرر' },
  { key: 'wrong_category', label: 'فئة خاطئة' },
  { key: 'bad_photo', label: 'صورة غير لائقة' },
  { key: 'wrong_price', label: 'ثمن غير صحيح' },
  { key: 'fake_number', label: 'رقم هاتف خاطئ' },
  { key: 'already_sold', label: 'الإعلان متباع' },
];

export default function ReportListingScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const route = useRoute();
  const { listing } = route.params;
  const { user } = useAuth();

  const [reason, setReason] = useState(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert(t('report.missingTitle'), t('report.missingMsg'));
      return;
    }
    setSending(true);
    try {
      await submitReport({
        listingId: listing.id,
        listingTitle: listing.title,
        reason,
        message,
        reporterEmail: email,
        reporterId: user?.uid,
      });
      Alert.alert(t('report.sentTitle'), t('report.sentMsg'), [
        { text: t('report.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t('report.errorTitle'), t('report.errorMsg', { error: error.message }));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>{t('report.header')}</Text>
        <Text style={styles.sub}>{listing?.title}</Text>

        <Text style={styles.label}>{t('report.question')}</Text>
        <View style={styles.reasonsGrid}>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.reasonChip, reason === r.key && styles.reasonChipActive]}
              onPress={() => setReason(r.key)}
            >
              <Text style={[styles.reasonText, reason === r.key && styles.reasonTextActive]}>{t('report.reasons.' + r.key)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('report.messageLabel')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder={t('report.messagePlaceholder')}
          placeholderTextColor={colors.muted}
          textAlign="right"
        />

        <Text style={styles.label}>{t('report.emailLabel')}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          textAlign="right"
        />

        <TouchableOpacity style={styles.sendBtn} onPress={handleSubmit} disabled={sending}>
          <Text style={styles.sendBtnText}>{sending ? t('report.sending') : t('report.send')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  header: { color: colors.mustard, fontSize: 18, fontWeight: '900', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0, textAlign: 'right' },
  sub: { color: colors.paper, fontSize: 13, opacity: 0.7, marginTop: 4, marginBottom: 20, textAlign: 'right' },
  label: { color: colors.paper, fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  reasonsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  reasonChip: { backgroundColor: colors.paper, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  reasonChipActive: { backgroundColor: colors.marker },
  reasonText: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  reasonTextActive: { color: colors.paper },
  input: { backgroundColor: colors.paper, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.ink, marginBottom: 18 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  sendBtn: { backgroundColor: colors.marker, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sendBtnText: { color: colors.paper, fontWeight: '900', fontSize: 15 },
});
