import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getListingById } from '../services/listings';
import { colors } from '../theme/theme';

export default function ListingLinkScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [notFound, setNotFound] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const listing = id ? await getListingById(id) : null;
        if (!alive) return;
        if (listing && !listing.deleted) {
          navigation.reset({ index: 1, routes: [{ name: 'MainTabs' }, { name: 'ListingDetail', params: { listing } }] });
        } else setNotFound(true);
      } catch (e) { if (alive) setNotFound(true); }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <View style={styles.c}>
      {notFound ? (
        <>
          <Text style={styles.t}>{t('link.notFound')}</Text>
          <TouchableOpacity style={styles.b} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}>
            <Text style={styles.bt}>{t('link.home')}</Text>
          </TouchableOpacity>
        </>
      ) : <ActivityIndicator size="large" color={colors.mustard} />}
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.tarp, alignItems: 'center', justifyContent: 'center', padding: 24 },
  t: { color: colors.paper, fontSize: 16, textAlign: 'center', marginBottom: 16 },
  b: { backgroundColor: colors.marker, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  bt: { color: colors.paper, fontWeight: '800' },
});
