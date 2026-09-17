// Functions for handling listing reports (flags for inappropriate content)
import firestore from '@react-native-firebase/firestore';
import { db } from './firebase';

export async function submitReport({ listingId, listingTitle, reason, message, reporterEmail, reporterId }) {
  return db.collection('reports').add({
    listingId,
    listingTitle: listingTitle || '',
    reason,
    message: message || '',
    reporterEmail: reporterEmail || null,
    reporterId: reporterId || null,
    status: 'pending',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
}

// Live listener for pending reports (admin only)
export function subscribeToPendingReports(callback) {
  const q = db.collection('reports').where('status', '==', 'pending');
  return q.onSnapshot((snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(items);
  }, (error) => {
    console.log('Error fetching reports:', error.message);
    callback([]);
  });
}

// Mark a report as resolved (after the admin deletes the listing or decides to ignore the report)
export async function resolveReport(reportId) {
  return db.collection('reports').doc(reportId).update({ status: 'resolved' });
}
