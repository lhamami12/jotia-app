import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/theme';
import { useTranslation } from 'react-i18next';

export default function CityScreen({ route, navigation }) {
  const { region } = route.params;
  const { t } = useTranslation();

  const selectCity = async (city) => {
    await AsyncStorage.setItem('selectedCity', city);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { city } }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{t('cityScreen.back')}</Text>
      </TouchableOpacity>
      <View style={styles.hero}>
        <Text style={styles.title}>{t('regions.' + region.name, region.name)}</Text>
        <Text style={styles.subtitle}>{t('cityScreen.subtitle')}</Text>
      </View>
      <FlatList
        data={region.cities}
        keyExtractor={(item) => item}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cityItem} onPress={() => selectCity(item)}>
            <Text style={styles.cityName}>{t('cities.' + item, item)}</Text>
            <Text style={styles.cityGo}>{t('cityScreen.enter')}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  backRow: { paddingHorizontal: 20, paddingTop: 14 },
  backText: { color: colors.mustard, fontWeight: '700', textAlign: 'right' },
  hero: { padding: 24, paddingTop: 10 },
  title: { fontSize: 24, fontWeight: '900', color: colors.mustard, textAlign: 'right' },
  subtitle: { fontSize: 14, color: colors.paper, opacity: 0.75, marginTop: 8, textAlign: 'right' },
  cityItem: {
    backgroundColor: colors.kraft, padding: 16, borderRadius: 14, marginBottom: 10,
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    borderRightWidth: 5, borderRightColor: colors.marker,
  },
  cityName: { fontWeight: '700', fontSize: 15, color: colors.ink },
  cityGo: { fontSize: 12, opacity: 0.6, color: colors.ink },
});
