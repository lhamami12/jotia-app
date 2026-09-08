import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute } from '@react-navigation/native';
import { colors } from '../theme/theme';
import { categories } from '../data/regions';
import { createListing } from '../services/listings';
import { uploadListingImages } from '../services/storage';
import { useAuth } from '../context/AuthContext';

const emojiMap = {
  'إلكترونيات': '📱', 'ملابس': '👕', 'أثاث': '🪑', 'سيارات': '🚲',
  'كتب': '📚', 'أدوات منزلية': '🍽️', 'تحف وأنتيكات': '🏺', 'عملات وطوابع': '🪙',
};

const MAX_IMAGES = 5;

export default function PostAdScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const city = route.params?.city || 'مدينة غير محددة';

  const [title, setTitle] = useState('');
  const [cat, setCat] = useState(categories[1]); // أول فئة حقيقية (بعد "الكل")
  const [type, setType] = useState('sale'); // sale | trade | both
  const [price, setPrice] = useState('');
  const [tradeText, setTradeText] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUris, setImageUris] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('خطأ', 'نحتاج صلاحية الوصول لصور جهازك باش تزيد صورة ديال السلعة');
      return;
    }
    const remaining = MAX_IMAGES - imageUris.length;
    if (remaining <= 0) {
      Alert.alert('الحد الأقصى', `يمكنك إضافة ${MAX_IMAGES} صور كحد أقصى.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri).slice(0, remaining);
      setImageUris((prev) => [...prev, ...newUris]);
    }
  };

  const removeImage = (uri) => {
    setImageUris((prev) => prev.filter((u) => u !== uri));
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.centerIcon}>🔒</Text>
          <Text style={styles.centerTitle}>خاصك تسجل الدخول أولا</Text>
        </View>
      </SafeAreaView>
    );
  }

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('ناقص', 'الرجاء إدخال عنوان الإعلان');
      return;
    }
    setSubmitting(true);
    try {
      let imageUrls = [];
      if (imageUris.length) {
        imageUrls = await uploadListingImages(imageUris, user.uid);
      }

      let priceLabel = price.trim() ? `${price.trim()} DH` : (type === 'trade' ? 'قابلة للتبادل' : 'تماشي للنقاش');
      if (type === 'both' && price.trim()) priceLabel = `${price.trim()} DH أو تبادل`;

      await createListing({
        title: title.trim(),
        price: priceLabel,
        cat,
        city,
        type,
        desc: desc.trim() || 'بلا وصف إضافي.',
        trade: type === 'sale' ? null : (tradeText.trim() || 'مفتوح للتبادل'),
        emoji: emojiMap[cat] || '📦',
        imageUrls,
        userId: user.uid,
        userPhone: user.phoneNumber,
      });

      setTitle(''); setPrice(''); setTradeText(''); setDesc(''); setImageUris([]);
      Alert.alert('تم ✓', 'الإعلان نشر بنجاح، غادي يبان لكل ديال المدينة.');
    } catch (error) {
      setSubmitting(false);
      Alert.alert('ماقدرناش ننشرو الإعلان', 'حاول مرة أخرى.\n' + error.message);
      return;
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.header}>نشر إعلان جديد</Text>

        <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
          <Text style={styles.uploadText}>📷 اضصط lإضافة صور ({imageUris.length}/{MAX_IMAGES})</Text>
        </TouchableOpacity>

        {imageUris.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {imageUris.map((uri) => (
              <View key={uri} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumbImage} />
                <TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(uri)}>
                  <Text style={styles.thumbRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>نعوان الإعلان</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="مثلا: دراجة هوائية جديدة" placeholderTextColor={colors.muted} textAlign="right" />

        <Text style={styles.label}>الفئة</Text>
        <View style={styles.chipsWrap}>
          {categories.filter(c => c !== 'الكل').map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, cat === c && styles.chipActive]} onPress={() => setCat(c)}>
              <Text style={[styles.chipText, cat === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ٳنو الإعلان</Text>
        <View style={styles.toggleRow}>
          {[['sale', 'للبيع'], ['trade', 'قابلة للتبادل'], ['both', 'الجوج']].map(([val, label]) => (
            <TouchableOpacity key={val} style={[styles.toggleOpt, type === val && styles.toggleOptSel]} onPress={() => setType(val)}>
              <Text style={[styles.toggleText, type === val && styles.toggleTextSel]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>الثمن (اختياري إلا كان بيظ — درهم)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="150" placeholderTextColor={colors.muted} keyboardType="number-pad" textAlign="right" />

        {type !== 'sale' && (
          <>
            <Text style={styles.label}>شنو باغي تبدل بيه؟</Text>
            <TextInput style={styles.input} value={tradeText} onChangeText={setTradeText} placeholder="مثلا: هاتف Android" placeholderTextColor={colors.muted} textAlign="right" />
          </>
        )}

        <Text style={styles.label}>الوصف</Text>
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          value={desc}
          onChangeText={setDesc}
          placeholder="حالة السلعة، تفاصيل إضافية..."
          placeholderTextColor={colors.muted}
          multiline
          textAlign="right"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.submitText}>نشر الإعلان ✓</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tarp },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  centerIcon: { fontSize: 40 },
  centerTitle: { color: colors.paper, fontWeight: '900', fontSize: 16 },
  centerSub: { color: colors.paper, opacity: 0.7, fontSize: 13, textAlign: 'center' },
  header: { fontSize: 22, fontWeight: '900', color: colors.paper, textAlign: 'right', marginBottom: 16 },
  uploadBox: { height: 90, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(247,243,232,.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  uploadText: { color: colors.paper, fontSize: 13, fontWeight: '700' },
  imagesRow: { marginTop: 10 },
  thumbWrap: { width: 90, height: 90, marginRight: 10, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  thumbRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  thumbRemoveText: { color: colors.paper, fontSize: 11, fontWeight: '900' },
  removeImageText: { color: colors.marker, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  label: { color: colors.mustard, fontSize: 12.5, fontWeight: '700', textAlign: 'right', marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: colors.kraft, borderRadius: 12, padding: 13, fontSize: 14, color: colors.ink },
  chipsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.kraft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  chipActive: { backgroundColor: colors.marker },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  chipTextActive: { color: colors.paper },
  toggleRow: { flexDirection: 'row-reverse', gap: 8 },
  toggleOpt: { flex: 1, backgroundColor: colors.kraft, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  toggleOptSel: { backgroundColor: colors.marker },
  toggleText: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  toggleTextSel: { color: colors.paper },
  submitBtn: { backgroundColor: colors.marker, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  submitText: { color: colors.paper, fontWeight: '900', fontSize: 15 },
});
