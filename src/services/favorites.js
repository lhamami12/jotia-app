// Favorite listings functions
import firestore from '@react-native-firebase/firestore';
import { db } from './firebase';

function favId(userId, listingId) {
  return `${userId}_${listingId}`;
}

// Add or remove a listing from favorites
export async function toggleFavorite(userId, listingId, isCurrentlyFav) {
  const ref = db.collection('favorites').doc(favId(userId, listingId));
  if (isCurrentlyFav) {
    await ref.delete();
  } else {
    await ref.set({ userId, listingId, createdAt: firestore.FieldValue.serverTimestamp() });
  }
}

// Live listener for the user's favorite listing ids
export function subscribeToFavoriteIds(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }
  const q = db.collection('favorites').where('userId', '==', userId);
  return q.onSnapshot((snapshot) => {
    callback(snapshot.docs.map((d) => d.data().listingId));
  }, (error) => {
    console.log('Error fetching favorites:', error.message);
    callback([]);
  });
}
