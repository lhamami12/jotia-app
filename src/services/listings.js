// Listing functions using Firestore
import firestore from '@react-native-firebase/firestore';
import { db } from './firebase';
import { getRegionByCity } from '../data/regions';

const listingsRef = db.collection('listings');

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

// Live listener for listings: combines city listings + region listings from other cities in the same region
export function subscribeToListings(city, category, callback) {
  const region = getRegionByCity(city);
  let cityItems = [];
  let regionItems = [];

  const emit = () => callback(dedupeAndSort(cityItems, regionItems));

  let qCity = listingsRef.where('city', '==', city).where('deleted', '==', false);
  if (category && category !== 'الكل') qCity = qCity.where('cat', '==', category);
  qCity = qCity.orderBy('createdAt', 'desc');

  const unsubCity = qCity.onSnapshot((snapshot) => {
    cityItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    emit();
  }, (error) => {
    console.log('City listings error: ', error.message);
    cityItems = [];
    emit();
  });

  let unsubRegion = () => {};
  if (region) {
    let qRegion = listingsRef.where('region', '==', region).where('scope', '==', 'region').where('deleted', '==', false);
    if (category && category !== 'الكل') qRegion = qRegion.where('cat', '==', category);
    qRegion = qRegion.orderBy('createdAt', 'desc');

    unsubRegion = qRegion.onSnapshot((snapshot) => {
      regionItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    }, (error) => {
      console.log('Region listings error: ', error.message);
      regionItems = [];
      emit();
    });
  }

  return () => {
    unsubCity();
    unsubRegion();
  };
}

// Update a listing
export async function updateListing(listingId, changes) {
  return listingsRef.doc(listingId).update(changes);
}

// Soft delete — mark listing as deleted instead of removing it
export async function softDeleteListing(listingId) {
  return listingsRef.doc(listingId).update({ deleted: true });
}

// Watch the current user's own listings
export function subscribeToMyListings(userId, callback) {
  const q = listingsRef.where('userId', '==', userId).where('deleted', '==', false).orderBy('createdAt', 'desc');
  return q.onSnapshot((snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => { console.log("MY_LISTINGS_ERROR:", error.message); });
}

// Create a new listing
// scope: 'city' (default, local) or 'region' (visible across the whole region)
// imageUrls: array of image URLs (can be empty)
export async function createListing({ title, price, cat, city, type, desc, trade, emoji, imageUrls, userId, userPhone, scope, region }) {
  const urls = imageUrls && imageUrls.length ? imageUrls : [];
  return listingsRef.add({
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
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
}

// Global search: all non-deleted listings, no city or category filter
export function subscribeToAllListings(callback) {
  const q = listingsRef.where('deleted', '==', false).orderBy('createdAt', 'desc');
  return q.onSnapshot((snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    console.log('Global search error: ', error.message);
    callback([]);
  });
}

export async function getListingById(listingId) {
  const snap = await listingsRef.doc(listingId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}
