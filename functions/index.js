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
  if (userSnap.exists && (userSnap.data().blockedUsers || []).includes(message.senderId)) {
    console.log('Sender blocked by recipient, no push');
    return;
  }
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
    for (const c of (await db.collection('conversations').where('participants', 'array-contains', uid).get()).docs) await db.recursiveDelete(c.ref);

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


// Cloud Function: صفحة ويب لكل إعلان (مع معاينة WhatsApp)
const { onRequest } = require('firebase-functions/v2/https');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.jotia.app';

exports.listingPage = onRequest({ region: 'europe-west1' }, async (req, res) => {
  const id = ((req.path.split('/l/')[1] || '').split('/')[0] || '').trim();
  let l = null;
  if (/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    const snap = await db.collection('listings').doc(id).get();
    if (snap.exists && !snap.data().deleted) l = snap.data();
  }
  const title = l ? `${l.title} — ${l.price} DH` : 'Jotia – جوطية';
  const desc = l ? `${l.city ? '📍 ' + l.city + ' · ' : ''}${String(l.desc || '').slice(0, 150)}` : 'بيع، شري وتبادل قريب منك';
  const img = l ? ((l.imageUrls && l.imageUrls[0]) || l.imageUrl || '') : '';
  const url = `https://jotia-app.web.app/l/${id}`;
  const intent = `intent://l/${id}#Intent;scheme=jotia;package=com.jotia.app;S.browser_fallback_url=${encodeURIComponent(PLAY_URL)};end`;

  res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  res.status(l ? 200 : 404).send(`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Jotia – جوطية">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
${img ? `<meta property="og:image" content="${esc(img)}">` : ''}
<link rel="stylesheet" href="/style.css">
<style>.photo{width:100%;border-radius:14px;max-height:420px;object-fit:cover}.price{color:#d9a441;font-size:26px;font-weight:900;margin:6px 0}.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.btn2{display:inline-block;border:1.5px solid #d9a441;color:#d9a441;padding:10px 18px;border-radius:12px;text-decoration:none;font-weight:700}</style>
</head><body><main>
${l ? `
${img ? `<img class="photo" src="${esc(img)}" alt="">` : ''}
<h1>${esc(l.title)}</h1>
<div class="price">${esc(l.price)} DH</div>
${l.city ? `<p>📍 ${esc(l.city)}</p>` : ''}
${l.desc ? `<p>${esc(l.desc)}</p>` : ''}
` : `<h1>هذا الإعلان لم يعد متوفراً</h1><p>Cette annonce n'existe plus.</p>`}
<div class="row">
<a class="btn" href="${esc(intent)}">📱 فتح في التطبيق · Ouvrir</a>
<a class="btn2" href="${PLAY_URL}">⬇️ Google Play</a>
</div>
<p class="muted" style="margin-top:28px">Jotia – جوطية · <a href="/privacy">Confidentialité</a></p>
</main></body></html>`);
});
