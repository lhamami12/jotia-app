// دوال التعامل مع الإعلانات عبر قاعدة بيانات Firestore
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const listingsRef = collection(db, 'listings');

// الاستمعاع الحي لقائمة الإعلانات على أساس المدينة والفئة (اختيارية)
// callback يستقبل array من الإعلانات في كل مرة تتغير فيها البيانات
export function subscribeToListings(city, category, callback) {
  let q;
  if (category && category !== 'الكل') {
    q = query(
      listingsRef,
      where('city', '==', city),
      where('cat', '==', category),
      where('deleted', '==', false),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      listingsRef,
      where('city', '==', city),
      where('deleted', '==', false),
      orderBy('createdAt', 'desc')
    );
  }

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  }, (error) => {
    console.log('خطأ في جلب الإعلانات: ', error.message);
    callback([]);
  });
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
// imageUrls: array من روابط الصور (يمكن أن تكون فارغة)
export async function createListing({ title, price, cat, city, type, desc, trade, emoji, imageUrls, userId, userPhone }) {
  const urls = imageUrls && imageUrls.length ? imageUrls : [];
  return addDoc(listingsRef, {
    title, price, cat, city, type, desc,
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
