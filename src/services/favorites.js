// دوال التعامل مع الإعلانات المفضلة
import { collection, doc, setDoc, deleteDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

function favId(userId, listingId) {
  return `${userId}_${listingId}`;
}

// إضافة أو حذف إعلان من المفضلة
export async function toggleFavorite(userId, listingId, isCurrentlyFav) {
  const ref = doc(db, 'favorites', favId(userId, listingId));
  if (isCurrentlyFav) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { userId, listingId, createdAt: serverTimestamp() });
  }
}

// الاستماع الحي لمعرفات الإعلانات المفضلة ديال المستخدم
export function subscribeToFavoriteIds(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'favorites'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => d.data().listingId));
  }, (error) => {
    console.log('خطأ فجلب المفضلة:', error.message);
    callback([]);
  });
}
