import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, Alert } from 'react-native';
import { colors } from '../theme/theme';
import { subscribeToPendingReports, resolveReport } from '../services/reports';
import { softDeleteListing, getListingById } from '../services/listings';
import { setUserBlocked } from '../services/users';
import { useTranslation } from 'react-i18next';

const REASON_LABELS = {
  duplicate: 'إعلان مكرر',
  wrong_category: 'فئة خاطئة',
  bad_photo: 'صورة غير لائقة',
  wrong_price: 'ثمن غير صحيح',
  fake_number: 'رقم هاتف خاطئ',
  already_sold: 'الإعلان متباع',
};

export default function AdminReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { t } = useTranslation();

  useEffect(() => {
    const unsub = subscribeToPendingReports((items) => {
      setReports(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDeleteListing = (report) => {
    Alert.alert(
      t('adminReports.deleteListingTitle'),
      t('adminReports.deleteListingMsg', { title: report.listingTitle }),
      [
        { text: t('adminReports.cancel'), style: 'cancel' },
        {
          text: t('adminReports.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteListing(report.listingId);
              await resolveReport(report.id);
            } catch (error) {
              Alert.alert(t('adminReports.errorTitle'), error.message);
            }
          },
        },
      ]
    );
  };

  const handleDismiss = async (report) => {
    try {
      await resolveReport(report.id);
    } catch (error) {
      Alert.alert(t('adminReports.errorTitle'), error.message);
    }

  };

  const handleViewListing = async (report) => {
    try {
      const listing = await getListingById(report.listingId);
      if (!listing) {
        Alert.alert(t('adminReports.notFoundTitle'), t('adminReports.notFoundMsg'));
        return;
      }
      navigation.navigate('ListingDetail', { listing });
    } catch (error) {
      Alert.alert(t('adminReports.errorTitle'), error.message);
    }
  };

  const handleBlockSeller = (report) => {
    Alert.alert(
      t('adminReports.blockTitle'),
      t('adminReports.blockMsg'),
      [
        { text: t('adminReports.cancel'), style: 'cancel' },
        {
          text: t('adminReports.block'),
          style: 'destructive',
          onPress: async () => {
            try {
              const listing = await getListingById(report.listingId);
              if (!listing?.userId) {
                Alert.alert(t('adminReports.errorTitle'), t('adminReports.noOwnerMsg'));
                return;
              }
              await setUserBlocked(listing.userId, true);
              Alert.alert(t('adminReports.blockedTitle'), t('adminReports.blockedMsg'));
            } catch (error) {
              Alert.alert(t('adminReports.errorTitle'), error.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.listingTitle}</Text>
      <Text style={styles.reason}>🚩 {t('report.reasons.' + item.reason, item.reason)}</Text>
      {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
      {item.reporterEmail ? <Text style={styles.email}>{item.reporterEmail}</Text> : null}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteListing(item)}>
          <Text style={styles.actionText}>{t('adminReports.deleteListingBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.dismissBtn]} onPress={() => handleDismiss(item)}>
          <Text style={styles.actionText}>{t('adminReports.dismissBtn')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => handleViewListing(item)}>
          <Text style={styles.actionText}>{t('adminReports.viewBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.blockBtn]} onPress={() => handleBlockSeller(item)}>
          <Text style={styles.actionText}>{t('adminReports.blockBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t('adminReports.header', { count: reports.length })}</Text>
      {loading ? (
        <View style={styles.center}><Text style={{ color: colors.paper }}>{t('adminReports.loading')}</Text></View>
      ) : reports.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Text style={styles.emptyText}>{t('adminReports.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  header: {
    color: colors.mustard,
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 20,
    paddingBottom: 10,
    textAlign: 'right',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: colors.paper, opacity: 0.7 },
  card: { backgroundColor: colors.paper, borderRadius: 16, padding: 14, marginBottom: 12 },
  title: { fontWeight: '900', fontSize: 14, color: colors.ink, textAlign: 'right' },
  reason: { fontSize: 12.5, color: colors.marker, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  message: { fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 4 },
  email: { fontSize: 11, color: colors.muted, textAlign: 'right', marginTop: 4 },
  actionsRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  deleteBtn: { backgroundColor: '#f8d7da' },
  dismissBtn: { backgroundColor: colors.kraft },
  viewBtn: { backgroundColor: '#cfe8f3' },
  blockBtn: { backgroundColor: '#3a2a2a' },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.ink },
});
