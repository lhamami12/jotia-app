// دوال التعامل مع الإعلانات عبر قاعدة بيانات Firestore
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getRegionByCity } from '../data/regions';

const listingsRef = collection(db, 'listings');

function dedupeAndSort(a, b) {
  const merged = [...a, ...b];
  const seen = new Set();
  const deduped = merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  deduped.sort((x, y) => (y.createdAt?.seconds || 0) - (x.createdAt?.seconds || 0));
  return deduped;
}

// الاستمعاع الحي لقائمة الإعلانات: كنجمعو إعلانات المدينة + الإعلانات الجهوية ديال باقي مدن نفس الجهة
export function subscribeToListings(city, category, callback) {
  const region = getRegionByCity(city);
  let cityItems = [];
  let regionItems = [];

  const emit = () => callback(dedupeAndSort(cityItems, regionItems));

  const catFilter = category && category !== 'الكل' ? [where('cat', '==', category)] : [];

  const qCity = query(
    listingsRef,
    where('city', '==', city),
    where('deleted', '==', false),
    ...catFilter,
    orderBy('createdAt', 'desc')
  );
  const unsubCity = onSnapshot(qCity, (snapshot) => {
    cityItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    emit();
  }, (error) => {
    console.log('خطأ في جلب إعلانات المدينة: ', error.message);
    cityItems = [];
    emit();
  });

  let unsubRegion = () => {};
  if (region) {
    const qRegion = query(
      listingsRef,
      where('region', '==', region),
      where('scope', '==', 'region'),
      where('deleted', '==', false),
      ...catFilter,
      orderBy('createdAt', 'desc')
    );
    unsubRegion = onSnapshot(qRegion, (snapshot) => {
      regionItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    }, (error) => {
      console.log('خطأ في جلب الإعلانات الجهوية: ', error.message);
      regionItems = [];
      emit();
    });
  }

  return () => {
    unsubCity();
    unsubRegion();
  };
}

// تعديل إعلان
export async function updateListing(listingId, changes) {
  return updateDoc(doc(db, 'listings', listingId), changes);
}

// حذف ناعم (Soft delete) — نعلم الإعلان محذوف بدل حذفه من قاعدة البيانات
export async function softDeleteListing(listingId) {
  return updateDoc(doc(db, 'listings', listingId), { deleted: true });
}

// معاينة إعلانات المستخدم
export function subscribeToMyListings(userId, callback) {
  const q = query(listingsRef, where('userId', '==', userId), where('deleted', '==', false), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// إنشاء إعلان جديد
// scope: 'city' (افتراضي، محلي) أو 'region' (يبان فكل مدن الجهة)
// imageUrls: array من روابط الصور (يمكن أن تكون فارغة)
export async function createListing({ title, price, cat, city, type, desc, trade, emoji, imageUrls, userId, userPhone, scope, region }) {
  const urls = imageUrls && imageUrls.length ? imageUrls : [];
  return addDoc(listingsRef, {
    title, price, cat, city, type, desc,
    scope: scope || 'city',
    region: region || getRegionByCity(city) || null,
    trade: trade || null,
    emoji: emoji || '📦',
    imageUrl: urls[0] || null,
    imageUrls: urls,
    userId,
    userPhone,
    deleted: false,
    createdAt: serverTimestamp(),
  });
}

// بحث شامل: كنجيبو كل الإعلانات الغير محذوفة، بلا فلترة مدينة أو فئة
export function subscribeToAllListings(callback) {
  const q = query(listingsRef, where('deleted', '==', false), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    console.log('خطأ فالبحث الشامل: ', error.message);
    callback([]);
  });
}

export async function getListingById(listingId) {
  const snap = await getDoc(doc(db, 'listings', listingId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
