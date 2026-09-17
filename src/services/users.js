// User profile functions (display name, admin status, etc.)
import { db } from './firebase';

// Update or set the user's display name
export async function updateUserDisplayName(userId, displayName) {
  await db.collection('users').doc(userId).set({ displayName: displayName.trim() }, { merge: true });
}

// Get a user's profile once (no live listener)
export async function getUserProfile(userId) {
  const snap = await db.collection('users').doc(userId).get();
  return snap.exists ? snap.data() : null;
}

// Block / unblock a user account (admin only)
export async function setUserBlocked(userId, blocked) {
  await db.collection('users').doc(userId).set({ isBlocked: blocked }, { merge: true });
}

// Save the user's phone number and email (for admin search)
export async function syncUserContactInfo(userId, phoneNumber, email) {
  const data = {};
  if (phoneNumber) data.phoneNumber = phoneNumber;
  if (email) data.email = email;
  if (Object.keys(data).length === 0) return;
  await db.collection('users').doc(userId).set(data, { merge: true });
}

// Search for a user by phone number or email (admin only)
export async function searchUserByContact(value) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const usersRef = db.collection('users');
  const results = new Map();

  const phoneSnap = await usersRef.where('phoneNumber', '==', trimmed).get();
  phoneSnap.forEach((d) => results.set(d.id, { id: d.id, ...d.data() }));

  const emailSnap = await usersRef.where('email', '==', trimmed).get();
  emailSnap.forEach((d) => results.set(d.id, { id: d.id, ...d.data() }));

  return Array.from(results.values());
}

// Live listener on a user's blocked status (to force logout instantly if blocked)
export function subscribeToUserProfile(userId, callback) {
  return db.collection('users').doc(userId).onSnapshot((snap) => {
    callback(snap.exists ? snap.data() : null);
  });
}
