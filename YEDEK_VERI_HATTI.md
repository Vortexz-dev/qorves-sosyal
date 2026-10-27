# Ortak veri hattı ve otomatik yedek — Q09

Ana site https://vortexz-dev.github.io/qorves-sosyal/ adresinde kalır. Mevcut Sites mesaj servisinin DB veritabanı kullanılır; yeni ücretli plan, veritabanı aboneliği veya OpenAI API tüketimi açılmaz. Sites abonelik/kullanım sınırları geçerlidir; iki sağlayıcı aynı anda erişilemezse kesinti yine mümkündür.

## Oyuncuya nasıl yansır?

Firebase sağlıklıyken ana okuma hattı Firebase'dir. Kota/bağlantı hatasında hazırlanmış Sites kopyasından devam edilir. Yazılar tek ortak işlem sırasından geçer; iki bağımsız yazıcı açılmaz. Firebase geri gelince bekleyen kayıtlar aynı kimlikleriyle eşitlenir; kuyruk tamamen temizlenip erişim doğrulandıktan sonra otomatik Firebase'e dönülür. Elle geçiş gerekmez. Yönetim paneli ana/yedek durumunu ve bekleyen kayıt sayısını gösterir.

İlk kurulum farklıdır: önce mevcut Firebase kayıtlarının eksiksiz kopyası oluşturulmalıdır. 27 Ekim akşamı Firebase kotası zaten dolu olduğundan ilk aktarım bekleyebilir. Saat her beş dakikada sınırlı bir sayfa grubunu dener; 429'da 15 dakika bekler. İlk aktarım tamamlanmadan yedek hazır gösterilmez. Kota yenilendikten sonra verinin boyutuna göre birkaç otomatik kontrol daha gerekebilir.

## Tutarlılık

- D1 common_documents ortak belgenin kimliğini, mantıksal sürümünü, son gövdesini, silinme izini ve dirty işaretini tutar. common_changes artan sıra numarasıyla istemci güncellemelerini taşır.
- Atomik commit önce bütün okuma sürümlerini doğrular. common_guards NOT NULL koşulu başarısızsa D1 batch bütünüyle geri alınır. Aynı requestId yeniden geldiğinde önceki sonuç döner; sayaçlar iki kez artmaz.
- Firebase kopyasına gönderilen eski sürüm onaylandığında, o sırada daha yeni düzenleme yapılmışsa dirty işareti temizlenmez. Fiziksel silmeler de kopyaya aktarılır; silinen kayıt ilk aktarım veya geç yanıt yüzünden geri gelmez.
- İstemci cache'i commonSequence ile eski gelen yanıtı ayıklar. Yorum sayfaları ve eski gönderiler sayfalı yüklenir. Beş saniyelik delta kontrolü yalnız izlenen ortak koleksiyonları indirir.
- Firebase'e dönüş, dirty=0 ve gerçek Firebase kontrolü başarılı olduğunda olur. Sites işlem günlüğü geçişler boyunca korunur. Firebase konsolundan elle veri yazmak bu protokolün dışındadır; oyundaki kayıt ekranlarını kullan.

## İlk aktarım ve eski sürümleri kilitleme

Firestore kurallarındaki writer(), settings/simulation.commonStore='sites-d1' olduktan sonra yalnız mevcut bulut saati UID'sinin kopyaya yazmasına izin verir. Okuma kapsamı mevcut kimliği doğrulanmış oyuncular olarak kalır. Böylece eski tarayıcı sürümleri ayrı bir veri dalı yaratamaz.

Bulut saati önce işareti koyar, sonra settings/control/users/posts/comments/likes/follows/events/memories/queue/notifications koleksiyonlarını 25 kayıtlık sayfalarda kopyalar. İlerleme her sayfada saklanır; bir uyanmada en fazla 20 sayfa alınır. Bütün koleksiyonlar bitince active olur. Yönetim anahtarı için sınırlı ön ısıtma yalnız settings/control belgesini taşır; bu tam yedek olarak sayılmaz. İlk aktarım sırasında da yönetim ayarı D1'de korunabilir; güncel kayıt eski kopyayla ezilmez.

Kopyalama tamamlandıktan sonra saat her uyanmada en çok 10 adet 60'lık/2MB'lık paketle Firebase kopyasını günceller. Oyuncu yazılarında arka plan aktarımı da çalışır. Aynı eşitleme için tek süreli kilit vardır.

## Gizlilik ve işletim

Ortak API yalnız 11 ortak koleksiyonu kabul eder. messages/accounts/bindings/private_memory/social_activity bu API'den okunamaz; özel konuşmalar ortak Firebase kopyasına taşınmaz. Mevcut özel D1 tabloları ve 90 günlük hafıza korunur.

Yalnız CLOCK_FIREBASE_UID ile doğrulanmış saat ilk aktarımı/eşitlemeyi başlatabilir. Kısa ömürlü saat oturumu mevcut IMAGE_RELAY_SECRET'tan amaç ayrımlı türetilmiş anahtarla AES-GCM şifreli tutulur; değerini kaynak, log veya durum ekranına yazma. Ortak meta tablolarını ham olarak döken debug uçları ekleme.

Cloudflare görsel Worker'ının imzalı yolu, ortak anahtar/sürüm/tek kullanımlık izni mevcut sunucudan doğrular; Firebase okuma kotasına ikinci kez bağımlı kalmaz. Günde ortak 50 görsel denemesi, 48 normal metin isteği ve simülasyon durdurma anahtarı değişmez.

## Kaynak ve kontrol

- Backend: lib/common-store.mjs, commonContext ile istek bazlı ortam; yeni drizzle/0003_narrow_the_fury.sql yalnız dört tablo ve indeks ekler.
- Frontend: src/common-firestore.js mevcut storage SDK sözleşmesini uygular. İlk aktarım bitene kadar eski Firestore yolu korunur; tamamlanınca açık sayfa da ortak katmana geçer. Firebase ana/yedek seçimi sunucudan yönetilir.
- Google: scripts/google-clock-storage.js init aşamasında /common/sync çağırır. active olunca REST belge istekleri aynı sunucudaki /common/documents yoluna gider. Eski tetikleyici ve Script Properties silinmez.
- Yayın sırası: Firestore writer kuralları -> mevcut backend migration/kod -> frontend -> Google Q09 paketi. İlk tam aktarımı zorla hazır işaretleme; kota beklemesini hata diye veri silerek çözme.
- Testler: backend node --test tests/social.test.mjs tests/generated-image.test.mjs tests/common-store.test.mjs; frontend npm test. Anahtarları ve sırları çıktıya yazma.

Firebase kuralları için rehberin zorunlu prototip notu: I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for preventing stale clients from writing a separate copy after the shared write fence is activated. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
