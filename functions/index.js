// Cloud Function: كل مرة كيتزاد رسالة جديدة فمحادثة، كنصيفطو إشعار Push للشخص الآخر
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const vision = require('@google-cloud/vision');
const visionClient = new vision.ImageAnnotatorClient();

initializeApp();
const db = getFirestore();

exports.onNewMessage = onDocumentCreated('conversations/{conversationId}/messages/{messageId}', async (event) => {
  const message = event.data.data();
  const { conversationId } = event.params;
  console.log('New message in', conversationId, 'from', message.senderId);

  const convoSnap = await db.collection('conversations').doc(conversationId).get();
  if (!convoSnap.exists) return;
  const convo = convoSnap.data();

  // كنحددو شكون الطرف الآخر (اللي خاصو يستقبل الإشعار، ماشي اللي صيفط)
  const recipientId = convo.sellerId === message.senderId ? convo.buyerId : convo.sellerId;
  if (!recipientId) { console.log('No recipientId found'); return; }
  console.log('Recipient:', recipientId);

  const userSnap = await db.collection('users').doc(recipientId).get();
  const pushToken = userSnap.exists ? userSnap.data().pushToken : null;
  if (!pushToken) { console.log('No pushToken for recipient', recipientId); return; }
  console.log('Sending push to token:', pushToken);

  const resp = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: pushToken,
      title: `💬 ${convo.listingTitle || 'رسالة جديدة'}`,
      body: message.text,
      sound: 'default',
      data: { conversationId, screen: 'Chat' },
    }),
  });
  const respJson = await resp.json();
  console.log('Expo push response:', JSON.stringify(respJson));
});


// Cloud Function: فحص تلقائي لصور الإعلانات الجديدة (محتوى إباحي/عنيف)
exports.onListingCreated = onDocumentCreated('listings/{listingId}', async (event) => {
  const listing = event.data.data();
  const { listingId } = event.params;

  if (!listing.imageUrl) return;

  try {
    const [result] = await visionClient.safeSearchDetection(listing.imageUrl);
    const detections = result.safeSearchAnnotation;

    const unsafe = ['LIKELY', 'VERY_LIKELY'];
    const isAdult = unsafe.includes(detections.adult);
    const isViolence = unsafe.includes(detections.violence);
    const isRacy = detections.racy === 'VERY_LIKELY';

    console.log('SafeSearch result for', listingId, ':', JSON.stringify(detections));

    if (isAdult || isViolence || isRacy) {
      console.log('Unsafe content detected, deleting listing', listingId);
      await db.collection('listings').doc(listingId).update({ deleted: true, flaggedReason: 'auto_moderation' });

      if (listing.userId) {
        const userRef = db.collection('users').doc(listing.userId);
        const userSnap = await userRef.get();
        const prevViolations = userSnap.exists ? (userSnap.data().violationCount || 0) : 0;
        const newViolations = prevViolations + 1;

        await userRef.set({ violationCount: newViolations }, { merge: true });

        if (newViolations >= 2) {
          console.log('Blocking user after repeated violations:', listing.userId);
          await userRef.set({ isBlocked: true }, { merge: true });
        }
      }
    }
  } catch (error) {
    console.log('Vision API error for listing', listingId, ':', error.message);
  }
});


// Cloud Function: حذف الحساب وجميع البيانات ديالو (متطلب Google Play)
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

async function deleteFileByUrl(url) {
  try {
    const m = /\/o\/([^?]+)/.exec(url || '');
    if (!m) return;
    await getStorage().bucket().file(decodeURIComponent(m[1])).delete({ ignoreNotFound: true });
  } catch (e) { console.log('Storage delete error:', url, e.message); }
}

function storageUrlsIn(data) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string' && v.includes('firebasestorage')) out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(data);
  return out;
}

async function deleteQuery(q) {
  const snap = await q.get();
  for (const d of snap.docs) await db.recursiveDelete(d.ref);
  return snap.size;
}

exports.onDeletionRequest = onDocumentCreated(
  { document: 'deletionRequests/{uid}', timeoutSeconds: 300 },
  async (event) => {
    const { uid } = event.params;
    console.log('Account deletion requested:', uid);

    // 1. Annonces + images
    const listings = await db.collection('listings').where('userId', '==', uid).get();
    const listingIds = [];
    for (const d of listings.docs) {
      listingIds.push(d.id);
      await Promise.all(storageUrlsIn(d.data()).map(deleteFileByUrl));
      await db.recursiveDelete(d.ref);
    }

    // 2. Favoris de l'utilisateur + favoris qui pointent vers ses annonces
    await deleteQuery(db.collection('favorites').where('userId', '==', uid));
    for (let i = 0; i < listingIds.length; i += 30) {
      await deleteQuery(db.collection('favorites').where('listingId', 'in', listingIds.slice(i, i + 30)));
    }

    // 3. Conversations (avec messages)
    await deleteQuery(db.collection('conversations').where('participants', 'array-contains', uid));

    // 4. Avis
    await deleteQuery(db.collection('reviews').where('buyerId', '==', uid));
    await deleteQuery(db.collection('reviews').where('sellerId', '==', uid));

    // 5. Signalements : anonymisés (conservés pour la modération)
    const reps = await db.collection('reports').where('reporterId', '==', uid).get();
    for (const d of reps.docs) await d.ref.update({ reporterId: null, reporterEmail: null });

    // 6. Profil (+ photo éventuelle)
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (userSnap.exists) await Promise.all(storageUrlsIn(userSnap.data()).map(deleteFileByUrl));
    await db.recursiveDelete(userRef);

    // 7. Compte Auth
    try { await getAuth().deleteUser(uid); }
    catch (e) { if (e.code !== 'auth/user-not-found') throw e; }

    await event.data.ref.set({ status: 'done', doneAt: new Date() }, { merge: true });
    console.log('Account deleted:', uid, '- listings:', listingIds.length);
  }
);
