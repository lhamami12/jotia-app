import { dir } from '../i18n';
import React, { useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image, ActivityIndicator, Modal, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute } from '@react-navigation/native';
import { colors } from '../theme/theme';
import { categories, getRegionByCity } from '../data/regions';
import { createListing } from '../services/listings';
import { uploadListingImages } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const emojiMap = {
  'إلكترونيات': '📱', 'ملابس رجالي': '👔', 'ملابس نسائية': '👗', 'ملابس أطفال ورضع': '🧸',
  'أثاث': '🪑', 'مركبات': '🚗', 'قطع غيار سيارات': '🔧', 'كتب وأفلام وموسيقى': '📚',
  'تحف وأنتيكات': '🏺', 'عملات وطوابع': '🪙', 'أدوات منزلية': '🍽️', 'منازل ومطابخ': '🏠',
  'تجديد منازل': '🛠️', 'بيوت للبيع': '🏡', 'وحدات للإيجار': '🔑', 'مجوهرات وساعات يد': '💍',
  'صحة وجمال': '💄', 'فنون وحرف يدوية': '🎨', 'آلات موسيقية': '🎸', 'مستلزمات رياضية': '⚽',
  'ألعاب': '🎮', 'مستلزمات الحيوانات الأليفة': '🐾', 'فناء وحدائق': '🌳', 'أمتعة وحقائب': '🎒',
  'متنوع': '📦',
};

const MAX_IMAGES = 5;

export default function PostAdScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const route = useRoute();
  const city = route.params?.city || t('post.cityUnknown');

  const [title, setTitle] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState(categories[1]); // أول فئة حقيقية (بعد "الكل")
  const [type, setType] = useState('sale'); // sale | trade | both
  const [scope, setScope] = useState('city'); // city | region
  const [price, setPrice] = useState('');
  const [tradeText, setTradeText] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUris, setImageUris] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('post.imagePermissionTitle'), t('post.imagePermissionMsg'));
      return;
    }
    const remaining = MAX_IMAGES - imageUris.length;
    if (remaining <= 0) {
      Alert.alert(t('post.maxImagesTitle'), t('post.maxImagesMsg', { max: MAX_IMAGES }));
      return;
    }
    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    } catch (e) {
      Alert.alert(t('post.imagePermissionTitle'), t('post.imagePermissionMsg'));
      return;
    }
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
          <Text style={styles.centerTitle}>{t('post.needLoginTitle')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert(t('post.titleRequiredTitle'), t('post.titleRequiredMsg'));
      return;
    }
    setSubmitting(true);
    try {
      let imageUrls = [];
      if (imageUris.length) {
        imageUrls = await uploadListingImages(imageUris, user.uid);
      }

      let priceLabel = price.trim() ? `${price.trim()} DH` : (type === 'trade' ? t('post.typeTrade') : t('post.negotiable'));
      if (type === 'both' && price.trim()) priceLabel = `${price.trim()} DH ${t('post.orTrade')}`;

      await createListing({
        title: title.trim(),
        price: priceLabel,
        cat,
        city,
        type,
        scope,
        region: getRegionByCity(city),
        desc: desc.trim() || 'بلا وصف إضافي.',
        trade: type === 'sale' ? null : (tradeText.trim() || 'مفتوح للتبادل'),
        emoji: emojiMap[cat] || '📦',
        imageUrls,
        userId: user.uid,
        userPhone: user.phoneNumber,
      });

      setTitle(''); setPrice(''); setTradeText(''); setDesc(''); setImageUris([]);
      Alert.alert(t('post.successTitle'), t('post.successMsg'));
    } catch (error) {
      setSubmitting(false);
      Alert.alert(t('post.failTitle'), t('post.failMsg', { error: error.message }));
      return;
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.header}>{t('post.header')}</Text>

        <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
          <Text style={styles.uploadText}>{t('post.uploadText', { count: imageUris.length, max: MAX_IMAGES })}</Text>
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

        <Text style={styles.label}>{t('post.scopeLabel')}</Text>
        <View style={styles.scopeRow}>
          <TouchableOpacity style={[styles.scopeBtn, scope === 'city' && styles.scopeBtnActive]} onPress={() => setScope('city')}>
            <Text style={[styles.scopeText, scope === 'city' && styles.scopeTextActive]}>{t('post.scopeCity')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.scopeBtn, scope === 'region' && styles.scopeBtnActive]} onPress={() => setScope('region')}>
            <Text style={[styles.scopeText, scope === 'region' && styles.scopeTextActive]}>{t('post.scopeRegion')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t('post.titleLabel')}</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t('post.titlePlaceholder')} placeholderTextColor={colors.muted} textAlign="right" />

        <Text style={styles.label}>{t('post.categoryLabel')}</Text>
        <TouchableOpacity style={styles.catField} activeOpacity={0.8} onPress={() => setCatOpen(true)}>
          <Text style={styles.catFieldText}>{t('categories.' + cat, cat)}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.ink} />
        </TouchableOpacity>

        <Modal visible={catOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setCatOpen(false)}>
          <View style={styles.sheetRoot}>
          <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setCatOpen(false)} />
          <View style={[styles.sheet, { height: Math.round(winH * 0.75), paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('post.categoryLabel')}</Text>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
              {categories.filter(c => c !== 'الكل').map((c) => (
                <TouchableOpacity key={c} style={styles.sheetRow} onPress={() => { setCat(c); setCatOpen(false); }}>
                  <Text style={[styles.sheetRowText, cat === c && styles.sheetRowTextActive]}>{t('categories.' + c, c)}</Text>
                  {cat === c && <Ionicons name="checkmark" size={22} color={colors.marker} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          </View>
        </Modal>

        <Text style={styles.label}>{t('post.typeLabel')}</Text>
        <View style={styles.toggleRow}>
          {[['sale', t('post.typeSale')], ['trade', t('post.typeTrade')], ['both', t('post.typeBoth')]].map(([val, label]) => (
            <TouchableOpacity key={val} style={[styles.toggleOpt, type === val && styles.toggleOptSel]} onPress={() => setType(val)}>
              <Text style={[styles.toggleText, type === val && styles.toggleTextSel]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('post.priceLabel')}</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="150" placeholderTextColor={colors.muted} keyboardType="number-pad" textAlign="right" />

        {type !== 'sale' && (
          <>
            <Text style={styles.label}>{t('post.tradeLabel')}</Text>
            <TextInput style={styles.input} value={tradeText} onChangeText={setTradeText} placeholder={t('post.tradePlaceholder')} placeholderTextColor={colors.muted} textAlign="right" />
          </>
        )}

        <Text style={styles.label}>{t('post.descLabel')}</Text>
        <TextInput
          style={[styles.input, { minHeight: 90, maxHeight: 200, textAlignVertical: 'top' }]}
          value={desc}
          onChangeText={setDesc}
          placeholder={t('post.descPlaceholder')}
          placeholderTextColor={colors.muted}
          multiline
          textAlign="right"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.submitText}>{t('post.submit')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  catField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.kraft, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginTop: 6 },
  catFieldText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20 },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#CFC4AE', marginTop: 10, marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 6, textAlign: 'center' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8DCC4' },
  sheetRowText: { fontSize: 16, color: colors.ink },
  sheetRowTextActive: { fontWeight: '800', color: colors.marker },
  container: { flex: 1, backgroundColor: colors.tarp },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  centerIcon: { fontSize: 40 },
  centerTitle: { color: colors.paper, fontWeight: '900', fontSize: 16 },
  centerSub: { color: colors.paper, opacity: 0.7, fontSize: 13, textAlign: 'center' },
  header: { fontSize: 22, fontWeight: '900', color: colors.paper, textAlign: dir.align, marginBottom: 16 },
  uploadBox: { height: 90, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(247,243,232,.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scopeRow: { flexDirection: dir.row, gap: 10, marginBottom: 8 },
  scopeBtn: { flex: 1, backgroundColor: colors.tarpDark, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(247,243,232,.2)' },
  scopeBtnActive: { backgroundColor: colors.mustard, borderColor: colors.mustard },
  scopeText: { color: colors.paper, fontSize: 12.5, fontWeight: '700' },
  scopeTextActive: { color: colors.ink },
  uploadText: { color: colors.paper, fontSize: 13, fontWeight: '700' },
  imagesRow: { marginTop: 10 },
  thumbWrap: { width: 90, height: 90, marginRight: 10, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  thumbRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  thumbRemoveText: { color: colors.paper, fontSize: 11, fontWeight: '900' },
  removeImageText: { color: colors.marker, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  label: { color: colors.mustard, fontSize: 12.5, fontWeight: '700', textAlign: dir.align, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: colors.kraft, borderRadius: 12, padding: 13, fontSize: 14, color: colors.ink },
  chipsWrap: { flexDirection: dir.row, flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.kraft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  chipActive: { backgroundColor: colors.marker },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  chipTextActive: { color: colors.paper },
  toggleRow: { flexDirection: dir.row, gap: 8 },
  toggleOpt: { flex: 1, backgroundColor: colors.kraft, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  toggleOptSel: { backgroundColor: colors.marker },
  toggleText: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  toggleTextSel: { color: colors.paper },
  submitBtn: { backgroundColor: colors.marker, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  submitText: { color: colors.paper, fontWeight: '900', fontSize: 15 },
});
