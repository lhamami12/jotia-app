import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('privacy.title')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.updated}>{t('privacy.updated')}</Text>

        <Text style={styles.sectionTitle}>{t('privacy.introTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacy.introText')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacy.dataTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacy.dataText')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacy.whyTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacy.whyText')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacy.sharingTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacy.sharingText')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacy.securityTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacy.securityText')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacy.rightsTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacy.rightsText')}
        </Text>

        <Text style={styles.sectionTitle}>{t('privacy.contactTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('privacy.contactText')}
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:app.jotia.maroc@gmail.com')}>
          <Text style={styles.link}>app.jotia.maroc@gmail.com</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  closeBtn: { color: colors.paper, fontSize: 20, fontWeight: '700' },
  headerTitle: { color: colors.mustard, fontSize: 17, fontWeight: '900' },
  updated: { color: colors.muted, fontSize: 12, textAlign: 'right', marginBottom: 16 },
  sectionTitle: { color: colors.mustard, fontSize: 15, fontWeight: '900', textAlign: 'right', marginTop: 18, marginBottom: 6 },
  paragraph: { color: colors.paper, fontSize: 14, lineHeight: 24, textAlign: 'right' },
  link: { color: colors.mustard, fontSize: 14, textAlign: 'right', marginTop: 4, fontWeight: '700' },
});
