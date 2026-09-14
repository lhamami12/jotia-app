import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../theme/theme';
import { regions } from '../data/regions';
import { useTranslation } from 'react-i18next';

export default function RegionScreen({ navigation }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>{t('regionScreen.title')}</Text>
        <Text style={styles.subtitle}>{t('regionScreen.subtitle')}</Text>
      </View>
      <FlatList
        data={regions}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.regionItem}
            onPress={() => navigation.navigate('City', { region: item })}
          >
            <Text style={styles.regionName}>{t('regions.' + item.name, item.name)}</Text>
            <Text style={styles.regionCount}>{t('regionScreen.citiesCount', { count: item.cities.length })}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  hero: { padding: 24, paddingTop: 36 },
  title: { fontSize: 34, fontWeight: '900', color: colors.mustard, textAlign: 'right' },
  subtitle: { fontSize: 14, color: colors.paper, opacity: 0.75, marginTop: 8, textAlign: 'right' },
  regionItem: {
    backgroundColor: colors.kraft, padding: 16, borderRadius: 14, marginBottom: 10,
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    borderRightWidth: 5, borderRightColor: colors.marker,
  },
  regionName: { fontWeight: '700', fontSize: 15, color: colors.ink },
  regionCount: { fontSize: 12, opacity: 0.6, color: colors.ink },
});
