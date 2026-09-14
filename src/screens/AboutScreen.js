import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';

export default function AboutScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('about.title')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
        </View>
        <Text style={styles.paragraph}>
          {t('about.p1')}
        </Text>
        <Text style={styles.paragraph}>
          {t('about.p2')}
        </Text>
        <Text style={styles.paragraph}>
          {t('about.p3')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  closeBtn: { color: colors.paper, fontSize: 20, fontWeight: '700' },
  headerTitle: { color: colors.mustard, fontSize: 17, fontWeight: '900' },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 90, height: 90, borderRadius: 22 },
  paragraph: { color: colors.paper, fontSize: 14, lineHeight: 24, textAlign: 'right', marginBottom: 16 },
});
