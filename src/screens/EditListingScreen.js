import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/theme';
import { updateListing } from '../services/listings';
import { useTranslation } from 'react-i18next';

export default function EditListingScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const route = useRoute();
  const listing = route.params?.listing;

  const [price, setPrice] = useState(String(listing?.price || ''));
  const [desc, setDesc] = useState(listing?.desc || '');
  const [sold, setSold] = useState(listing?.sold || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!price.trim()) {
      Alert.alert(t('editListing.missingTitle'), t('editListing.missingMsg'));
      return;
    }
    setSaving(true);
    try {
      await updateListing(listing.id, {
        price: price.trim(),
        desc: desc.trim(),
        sold,
      });
      Alert.alert(t('editListing.savedTitle'), t('editListing.savedMsg'), [
        { text: t('editListing.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t('editListing.errorTitle'), t('editListing.errorMsg', { error: error.message }));
    } finally {
      setSaving(false);
    }
  };

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: colors.paper, padding: 20 }}>{t('editListing.noListing')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>{t('editListing.header')}</Text>
        <Text style={styles.title}>{listing.title}</Text>

        <Text style={styles.label}>{t('editListing.priceLabel')}</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          textAlign="right"
        />

        <Text style={styles.label}>{t('editListing.descLabel')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={desc}
          onChangeText={setDesc}
          multiline
          textAlign="right"
        />

        <TouchableOpacity
          style={[styles.soldToggle, sold && styles.soldToggleActive]}
          onPress={() => setSold(!sold)}
        >
          <Text style={[styles.soldToggleText, sold && styles.soldToggleTextActive]}>
            {sold ? t('editListing.soldOn') : t('editListing.soldOff')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? t('editListing.saving') : t('editListing.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  header: {
    color: colors.mustard,
    fontSize: 18,
    fontWeight: '900',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
    marginBottom: 4,
    textAlign: 'right',
  },
  title: { color: colors.paper, fontSize: 14, opacity: 0.7, marginBottom: 20, textAlign: 'right' },
  label: { color: colors.paper, fontSize: 13, fontWeight: '700', marginBottom: 6, textAlign: 'right' },
  input: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 18,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  soldToggle: {
    backgroundColor: colors.kraft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  soldToggleActive: { backgroundColor: colors.marker },
  soldToggleText: { fontWeight: '700', color: colors.ink },
  soldToggleTextActive: { color: colors.paper },
  saveBtn: {
    backgroundColor: colors.marker,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.paper, fontWeight: '900', fontSize: 15 },
});
