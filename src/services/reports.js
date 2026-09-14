// دوال التعامل مع بلاغات الإعلانات المخالفة
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export async function submitReport({ listingId, listingTitle, reason, message, reporterEmail, reporterId }) {
  return addDoc(collection(db, 'reports'), {
    listingId,
    listingTitle: listingTitle || '',
    reason,
    message: message || '',
    reporterEmail: reporterEmail || null,
    reporterId: reporterId || null,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

// الاستماع الحي للبلاغات المعلقة (للأدمين)
export function subscribeToPendingReports(callback) {
  const q = query(collection(db, 'reports'), where('status', '==', 'pending'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(items);
  }, (error) => {
    console.log('خطأ فجلب البلاغات:', error.message);
    callback([]);
  });
}

// تعليم البلاغ كمعالج (بعد ما الأدمين يحذف الإعلان أو يقرر تجاهل البلاغ)
export async function resolveReport(reportId) {
  return updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
}
