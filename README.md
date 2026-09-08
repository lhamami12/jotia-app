# جوطية — تطبيق React Native (Expo)

## كيفاش تشغل المشروع عندك

1. **حمل Node.js** (نسخة LTS) من https://nodejs.org
2. حل Terminal فبلاصة الملفات وكتب:
   ```
   npm install
   npx expo start
   ```
3. حمل تطبيق **Expo Go** على هاتفك (Android/iOS من المتجر)
4. سكان الـ QR code اللي غيبان فالـ Terminal — التطبيق غيبان مباشرة فهاتفك

## بنية المشروع
```
jotia-app/
├── App.js                      ← نقطة الدخول + التنقل الرئيسي
├── src/
│   ├── screens/                ← كل شاشة (Region, City, Home, ListingDetail...)
│   ├── navigation/              ← تنظيم الـ Tabs
│   ├── components/              ← عناصر معاد استعمالها (ListingCard)
│   ├── theme/                   ← ألوان وستايل موحّد
│   └── data/                    ← بيانات تجريبية (جهات، مدن، إعلانات)
```

## شنو مبني دابا (أساس حقيقي شغال)
- اختيار الجهة → المدينة (بنفس اللائحة الكاملة ديال النموذج)
- الصفحة الرئيسية: فئات، بحث، فيد إعلانات
- تفاصيل الإعلان (بيع/مقايضة، البائع، تزكية الجيران)
- Navigation كامل (Stack + Bottom Tabs)
- نفس الهوية البصرية (الألوان، الشكل) ديال النموذج التجريبي

## الخطوة الجاية (ماشي مبنية بعد)
- ~~ربط Firebase: Authentication (SMS)~~ ✅
- ~~ربط Firestore (الإعلانات الحقيقية)~~ ✅
- ~~الشات الحقيقي بين المستخدمين~~ ✅
- ~~رفع صور حقيقية لـ Firebase Storage~~ ✅
- ~~الإشعارات (Push Notifications)~~ ✅ **مبنية دابا، شوف تحت — آخر ميزة تقنية كبيرة!**
- خطوط Lalezar وTajawal (تحسين بصري، ماشي أساسي)

## 📸 الصور — شنو مبني

- `src/services/storage.js` — رفع الصورة لـ Firebase Storage ورجوع الرابط النهائي
- صفحة "نشر إعلان" فيها زر حقيقي لاختيار صورة من معرض الهاتف (`expo-image-picker`)، معاينة قبل النشر، وإمكانية شيلها
- البطاقات وصفحة التفاصيل كيبينو الصورة الحقيقية إيلا كانت موجودة، وإلا كيرجعو للإيموجي حسب الفئة

### قواعد الأمان لـ Firebase Storage
Firebase Console → Storage → **Règles**، بدلها بهاد الشكل:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /listings/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

## 🔔 الإشعارات — شنو مبني دابا

هادي الميزة الوحيدة اللي محتاجة **جزء فالسيرفر** (Cloud Function)، ماشي غير كود فالتطبيق:

- `src/services/notifications.js` — كيطلب الإذن، كيسجل الجهاز، وكيخزن "التوكن" ديالو فـ Firestore (`users/{uid}`)
- `AuthContext.js` — كيسجل الجهاز أوتوماتيك ملي يدخل المستخدم
- `functions/index.js` — **Cloud Function** كتخدم فالسيرفر ديال Firebase: كل مرة كيتصيفط رسالة جديدة فالشات، هادي كتلقا التوكن ديال الطرف الآخر وتصيفط ليه إشعار حقيقي (حتى والتطبيق مسدود)

### خاصك تدير هادشي مرة وحدة (من الكمبيوتر، ماشي من الهاتف):

1. حمل Firebase CLI:
   ```
   npm install -g firebase-tools
   ```
2. سجل الدخول:
   ```
   firebase login
   ```
3. من داخل فولدر المشروع (`jotia-app/`)، نشر القواعد والدالة:
   ```
   firebase deploy --only firestore:rules,functions
   ```

### ⚠️ ملاحظات مهمة
- **Cloud Functions محتاجة خطة Blaze** (نفس بحال Phone Auth) — عندها Free Tier سخي (2 مليون استدعاء بالمجان فالشهر)
- الإشعارات **ماخدامينش فالمحاكي (Simulator/Emulator)** — خاصك جهاز Android/iOS حقيقي باش تجربها
- `firestore.rules` دابا فيها القواعد الكاملة (الإعلانات + الشات + المستخدمين) جاهزة للنشر

---

## 🎉 التطبيق دابا كامل من الناحية التقنية
تسجيل دخول → إعلانات حقيقية بصور → شات حي → إشعارات Push. الخطوة الجاية هي **الاختبار على هاتف حقيقي**، بعدها **eas build** للنشر فPlay Store.



## 💬 الشات — شنو مبني دابا

- `src/services/chat.js` — خلق المحادثات وصيفط/جيب الرسائل فالوقت الحقيقي
- `src/screens/ChatScreen.js` — واجهة الشات كاملة: رسائل حية + أزرار العرض السريع (-10%/-20%) + نقطة اللقاء الآمنة
- `src/screens/MessagesScreen.js` — لائحة المحادثات (تبويب "الرسائل")
- دوس "راسله" فأي إعلان ← كيخلق محادثة أوتوماتيك (أو يفتح القديمة إيلا كانت موجودة) ← شات حقيقي

### قواعد الأمان لل Firestore (كاملة، الإعلانات + الشات)
بدّل قواعد Firestore بهاد الشكل الكامل قبل النشر:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /listings/{listingId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      match /messages/{messageId} {
        allow read, create: if request.auth != null;
      }
    }
  }
}
```



## 🔥 كيفاش تربط Firebase (خطوة بخطوة)

1. **أنشئ مشروع** فـ https://console.firebase.google.com → "Add project"
2. **زيد تطبيق ويب** (Web app، حتى إذا التطبيق ديالك mobile — Firebase JS SDK محتاج ليها): Project Settings → General → "Add app" → 🌐
3. **انسخ القيم** (`apiKey`, `authDomain`, `projectId`...) والصقهم فـ `src/services/firebase.js` بلاصة `ضع_..._هنا`
4. **فعّل Phone Authentication**: Authentication → Sign-in method → Phone → Enable
5. **⚠️ مهم:** Firebase Phone Auth محتاج **خطة Blaze** (الدفع حسب الاستعمال) باش تصيفط SMS حقيقية للمستخدمين — الخطة المجانية (Spark) كتخدم غير برقم هاتف تجريبي وحيد. Blaze فيها Free Tier سخي بزاف (10 آلاف تحقق فالشهر مجانا تقريباً)، خاصك غير تزيد بطاقة بنكية.
6. **رقم تجريبي للتجربة بلا فلوس:** Authentication → Sign-in method → Phone → "Phone numbers for testing" → زيد رقم وكود ثابت (مثلاً `+212600000000` وكود `123456`) باش تجرب بلا ماتخلص SMS حقيقية

## بنية الدخول اللي مبنية
```
ProfileScreen (زائر) → LoginScreen (رقم الهاتف) → reCAPTCHA (تلقائي)
→ Firebase يصيفط SMS → VerifyScreen (الكود) → دخول ✓ → ProfileScreen (مستخدم حقيقي)
```
AuthContext كيراقب حالة الدخول فكل التطبيق تلقائياً (`useAuth()` فأي component).


## قبل النشر فPlay Store
1. حساب Google Play Developer (25$ رسم وحيد، لمرة وحدة)
2. `eas build` (أداة Expo) باش تبني ملف APK/AAB جاهز للنشر
3. سياسة الخصوصية (خاصك واحدة، إجبارية لكل تطبيق كيجمع بيانات)
4. لقطات شاشة + وصف التطبيق بالعربية والفرنسية
