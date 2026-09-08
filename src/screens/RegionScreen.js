import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../theme/theme';
import { regions } from '../data/regions';

export default function RegionScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>جوطية</Text>
        <Text style={styles.subtitle}>سوق الجوطية الرقمي لكل المغرب. اختر جهتك باش نوروك اللي قريب منك.</Text>
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
            <Text style={styles.regionName}>{item.name}</Text>
            <Text style={styles.regionCount}>{item.cities.length} مدن ›</Text>
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
