// Seller reviews / ratings functions
import firestore from '@react-native-firebase/firestore';
import { db } from './firebase';

const reviewsRef = db.collection('reviews');

// Live listener for all reviews of a given seller, sorted newest first
export function subscribeToSellerReviews(sellerId, callback) {
  const q = reviewsRef.where('sellerId', '==', sellerId).orderBy('createdAt', 'desc');
  return q.onSnapshot((snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    console.log('Error fetching reviews:', error.message);
    callback([]);
  });
}

// Whether this buyer has already rated this seller (to prevent duplicate reviews)
export async function hasUserRatedSeller(sellerId, buyerId) {
  const q = reviewsRef.where('sellerId', '==', sellerId).where('buyerId', '==', buyerId);
  const snap = await q.get();
  return !snap.empty;
}

// Submit a new review
export async function submitReview({ sellerId, buyerId, buyerName, rating, comment, listingId }) {
  const already = await hasUserRatedSeller(sellerId, buyerId);
  if (already) {
    throw new Error('already_rated');
  }
  await reviewsRef.add({
    sellerId, buyerId,
    buyerName: buyerName || null,
    rating,
    comment: comment || null,
    listingId: listingId || null,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
}
