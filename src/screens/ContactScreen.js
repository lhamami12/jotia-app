import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';

export default function ContactScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('contact.title')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={{ padding: 20 }}>
        <TouchableOpacity style={styles.card} onPress={() => Linking.openURL('mailto:app.jotia.maroc@gmail.com')}>
          <Text style={styles.cardTitle}>{t('contact.emailTitle')}</Text>
          <Text style={styles.cardSub}>app.jotia.maroc@gmail.com</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => Linking.openURL('https://wa.me/212665072161')}>
          <Text style={styles.cardTitle}>{t('contact.whatsappTitle')}</Text>
          <Text style={styles.cardSub}>{t('contact.whatsappSub')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  closeBtn: { color: colors.paper, fontSize: 20, fontWeight: '700' },
  headerTitle: { color: colors.mustard, fontSize: 17, fontWeight: '900' },
  card: { backgroundColor: colors.paper, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { fontWeight: '700', fontSize: 14, color: colors.ink, textAlign: 'right' },
  cardSub: { fontSize: 12.5, color: colors.muted, textAlign: 'right', marginTop: 4 },
});
