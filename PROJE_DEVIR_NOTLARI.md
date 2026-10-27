# Qorves Sosyal — proje devir notları

Bu dosya yeni bir geliştiricinin veya başka bir Codex sohbetinin projeye kaldığı yerden devam etmesi içindir. README ürün davranışını, bu dosya uygulama/yayın ayrıntılarını anlatır. Güncelleme: 27 Ekim 2026, Q05.

## Amaç ve kullanıcı tercihleri

SS 214 Qorves evreni içinde gerçek sosyal ağ hissi. 500 NPC kişiliği ve insan oyuncular ortak akışı kullanır. Yönetim dışındaki UI’da model/API/deney gibi açıklamalarla atmosferi bozma. Yalnız yeni özellik eklemek için bütçeyi yükseltme; önce mevcut çağrıya kat. Kullanıcı kod testlerini tercih ediyor; küçük şeyler için tekrarlanan tarayıcı denetimi yapma. Oyun kaynaklarını baştan yeniden taramak gerekmez; yeni kanon sorusu varsa ilgili belgeyi oku.

750 karakter kullanıcı tarafından seçilmiş üst sınırdır. Uzun/kısa yazan sabit hesap grupları oluşturma. Aynı kişi ruh haline ve anlattığı şeye göre farklı uzunlukta yazabilir. Promptta uzunluk önerileri bağlayıcı değildir.

## Konumlar ve kimlikler

- Canlı frontend ve repo: https://vortexz-dev.github.io/qorves-sosyal/ — Vortexz-dev/qorves-sosyal, main.
- Yerel frontend: `C:\Users\Ulaş\Documents\ChatGPT\Qorves\qorves-sosyal`.
- Yerel özel mesaj sunucusu: `C:\Users\Ulaş\Documents\ChatGPT\Qorves\qorves-sosyal-api` (ayrı Git deposu, Sites kaynak deposuna bağlı).
- Ham evren arşivi: `D:\Games\FRP\Qorves` (salt okunur kaynak).
- İlk profil/portre kaynakları: `D:\Games\FRP\Qorves\SocialMediaWebsiteProject`.
- Firebase proje kimliği: `qorves-sosyal`; ücretsiz Spark. Web config `src/config.js` içindedir; bu istemci tanımlayıcısı Gemini gizli anahtarı değildir.
- Özel mesaj API: `https://qorves-sosyal-api.stormypoppy17.chatgpt.site` (ana site adresi olarak kullanıcıya bunu verme).
- Mevcut Sites project_id: `appgprj_6adf5afc4cd88191b691d805c9c66bc6`. Yeni Site oluşturma; var olanı güncelle.
- Q03 sunucu kaynak commit’i: `2acd0230be3692a78a256ba7f563610fdf738011`, saved version 4: `appgprj_6adf5afc4cd88191b691d805c9c66bc6~appgver_c39c6a259ea08191899a6be1fe009440`. Ortam revision 2 ile yayımlandı.
- Google Apps Script proje: `https://script.google.com/home/projects/1uhkkQ43Cu3TQ6zqg2DvoYmp8SxxmfwGyjRg9cOVUCsdrJhN_l1XFK7O-/edit`, adı Qorves bulut saati.

Hesap e-postaları ve şifreler kamuya açık belgelere eklenmez. Gerekirse kullanıcıdan yalnız ilgili hizmetin hesabını sor. Sites runtime’da `GEMINI_API_KEY` ve `CLOCK_FIREBASE_UID` gizli ortam değişkenleridir. Değerlerini loglama, komut satırı argümanına koyma veya GitHub’a yazma.

## Frontend dosyaları

| Dosya | Sorumluluk |
| --- | --- |
| src/main.js | Ekranlar, form/etkileşimler, bildirim ve özel mesaj yenileme. Hash yolları. |
| src/dom.js | DOM uzlaştırma; mevcut form, textarea, dosya alanı, odak ve seçimi korur. Arka plan verisinde root.innerHTML ile tekrar oluşturmayı geri getirme. |
| src/storage.js | Firestore ve yerel mod; ortak kayıt, yönetim ayarı, kilit, bütçe, hafıza, kuyruk. |
| src/simulation.js | Toplu Gemini üretimi, ilgili hesap seçimi, tek ücretsiz fallback, çıktı doğrulama. |
| src/social-life.js | Paylaşılan karakter üslubu, dönen konu/uzunluk/etiket esintileri ve tekrar filtresi. |
| src/publication.js | Zamanlara dağıtma, duraklatma kaydırması, beğeni kuyruğu sıkıştırma, tur zamanı. |
| src/realtime.js | Hesap bağlama ve özel API istemcisi; Firebase ID token ile çağırır. |
| src/inbox.js | Bildirimleri birleştirme ve öneri/typing yardımcıları. |
| src/images.js | Resmi 850px’e (avatar 384px) sığdırır; JPEG sıkıştırır, 240000 karakter üstünü reddeder. |
| src/domain.js | Güvenli metin/HTML, kanon filtresi, model çıktıları ve yedek doğrulama. |
| src/matrix.js + style.css | Seyrek mavi, bulanık matrix arka planı ve arayüz animasyonları. Reduced motion destekli. |
| src/data/ | Halka açık evren özeti, 500 profil, başlangıç paylaşımları ve spoiler politikası. |
| scripts/google-clock-*.js | Aynı üretim motorunun Apps Script depolama/çalıştırma uyarlaması. |
| scripts/build-google-clock.mjs | esbuild IIFE: research/google-clock/Code.gs ve appsscript.json üretir. Sır içermez. |
| scripts/cloud-simulation.mjs | GitHub Actions için alternatif bulut üretim girişi. |

## Ortak veri ve üretim

Firestore koleksiyonları: users, posts, comments, likes, follows, notifications, events, memories, queue, settings, control.

`settings/simulation`: enabled, revision, pauseStartedAt, totalPausedMs, intervalMinutes, maxRequests, maxPosts, batchSize, likesPerTurn, muted, postsEnabled, repliesEnabled, interactiveMaxRequests, dmHash, model.

`control/simulation`: İstanbul günü, requests/posts/likes, owner/token/until üretim kilidi, lastAttempt/lastSuccess, pending, lastPublication, lastScheduledWake, clockTrigger/clockProvider, status. Günlük reset yeni üretim rezervasyonunda yapılır. Sayaç 1 ise limit 1 anlamına gelmez.

`memories`: karakter özetleri ve son 12 iz yanında `kind=publication` olan geçici yayın kayıtlarını da barındırır. Bunları karıştırma. Beğeniler ~6 paket halinde saklanarak ücretsiz yazma kotası korunur. Üretim turu yalnız planlar; zamanı gelen yayınlar ayrı uyanışta aktarılır. Yayın zamanı alanları farklıdır; bir kontrol çalışması birden çok zamanı gelmiş kaydı aktarabilir.

Anahtar kapanınca yeni çağrı ve kuyruk yayını durur. revision değişince eski sonuç atılır. Sağlayıcıya ulaşmış istek geri alınamaz. Önceden kayıtlı içerik/hafıza silinmez. Yayın saatleri toplam duraklama farkına göre kayar.

Normal ayarlar 30 dakika / 48 toplu istek / 50 metin ve 500 beğeni / 2400 günlük metindir. Başarısız sağlayıcı denemesi de istek sayılır. Yalnız 502/503/504 durumunda bir kez gemini-2.5-flash-lite ücretsiz fallback; 429’da tekrar yok. Kilit 360 saniyedir. Metin tekrarları ek AI isteği açmadan elenir.

## Apps Script: kritik farklar

Google V8 ortamında fetch/crypto/window/timers yoktur. Derleme banner’ı Utilities ve UrlFetchApp uyarlamalarını sağlar. Microtask tabanlı async/await çalışır, zamanlayıcıya güvenen async I/O yoktur. Model çağrısı mevcut sunucudaki `/api/v1/clock/model` bağlantısından geçer; Gemini anahtarı scriptte tutulmaz.

Script Properties içindeki Firebase refresh token ve servis UID özeldir; cache ID tokenı yeniler. Sunucu yalnız atanmış UID + geçerli ortak token/revision/until ile çağrı kabul eder. Aynı claim/model ikinci kez harcanamaz.

**beginTransaction kullanma:** Firebase ID token ile 403 verdi. Apps Script uyarlaması normal okumaların updateTime değerlerini toplar; aynı atomik commit içinde değişen belgelerde currentDocument ve diğer okumalarda verify ile hepsini doğrular. 409/412’de en fazla üç kayıt tekrar denemesi vardır; bunlar AI çağrısı değildir. Anahtar arada kapanırsa eski claim yazılamaz.

`installQorvesClock` yalnız kendi qorvesCloudTick handler’ı için beş dakikalık tetikleyici kurar. Çoğaltmaz. `stopQorvesClock` yalnız onu kaldırır. `checkQorvesClock` bağlantı bilgisi okur, model çağırmaz. `testQorvesClock` elle çalışır, otomatik kanıt sayılmaz. Gerçek event.triggerUid varsa lastScheduledWake ve google_time_trigger yazılır.

GitHub’daki iki cron aktif tutuldu ama ilk kurulumda hiç schedule olayı üretmediler; bu yüzden Google saati eklendi. İkisi de çalışsa ortak kilit/bütçe korur. Yeni Codex otomasyonu ekleme; bu oyun için kullanıcı Codex hakkını harcamamalı.

## Özel mesaj sunucusu

Kanonik kaynak ayrı yerel dizindedir. Yeni sohbet o dizini okuyabilir. Yerel kaynak yoksa Sites get_site + aynı projeye create_source_repository_write_credential ve source helper ile kaynak deposunu aç. Bu repo tek başına özel mesaj sunucusunun tam kaynak checkout’u değildir.

- lib/social-api.mjs: JWT doğrulama, hesap bağlama, DM, özel tepki, clock model geçidi ve yayın tick’i.
- lib/inbox.mjs: yalnız sahibinin görünür konuşmaları, okunmamışlar, son 10 saniyelik typing.
- lib/media.mjs: inline image doğrulama, eski düz metinlerle uyumlu private mesaj paketleme.
- lib/social-life.js: frontend ile aynı üslup kaynağı; değiştirince iki yerde eşitle.
- db/schema.ts + drizzle/: accounts, bindings, messages, counters, deliveries. Son Q03 değişikliği şema migration’ı gerektirmedi.
- tests/social.test.mjs: Node sqlite içinde özel hesap ayrımı, görselin gerçek bytes ile modele ulaşması, yanıtsız bırakma ve bütçe testleri.

Mesajlar D1’de owner/peer bazlı iki yönlü kayıttır. Görsel varsa body JSON içinde qorvesMedia=1/text/image olarak saklanır; eski body düz metinler çalışır. UI yalnız API’den kendi mesajlarını alır. Özel görsel/metin Firestore ortak hafızasına taşınmaz.

AI yanıtında reply=false ise cevap mesajı yaratılmaz. silenceMinutes (0–1440) özel karşılık vermeme süresidir; süre boyunca mesaj alınır, yeni model çağrılmaz. Kontak tercihi aynı çağrıda follow/unfollow seçebilir. İçerik sıradan flörte otomatik ret vermez; kişilik, yaş ve rıza geçerlidir.

DM günlük kişi sınırı 120, aralık 2 saniye; ortak günlük interaktif bütçe yönetim ayarıyla sınırlı ve sunucuda en çok 200. Dakika başına 8 çağrı. İnsan mesajları/sessiz hatta iletiler ayrı yazma hız sınırına tabidir. Sağlayıcı 24 saniyede sınırlandırılır; arka plan işi özel cevap kaydını sıraya alır. Same-peer pending kontrolü gereksiz paralel üretimi önler.

## Kurallar, güvenlik ve sınırlar

Firestore mevcut güvenilen FRP grubu modelidir: anonim oturumlar ortak oyun belgelerine erişir. Yönetim şifresi yalnız UI kilidi; gerçek sunucu admin yetkisi değildir. Q03 değişikliği yalnız post validator: text <=750, opsiyonel JPEG/PNG/WebP data URL <=240000; comments <=500. Geniş yetki modeli değiştirilmedi. Bu temel kurallar geniş halka açık/hasım kullanıcılar için kapsamlı yetkilendirme değildir. Gizli kanon arşivini veya sırları modele/kamuya göndermemek temel korumadır.

AI yeni görsel üretimi Cloudflare Free FLUX.1 schnell ile bağlandı; en fazla elli deneme/UTC günü. Ortak simülasyon anahtarı kapalıysa görsel de üretilmez. Oyuncu görsellerini anlama ayrı akıştır. Spark/AI/Apps Script ücretsiz kotaları duraklama yapabilir. Billing veya planı kendiliğinden değiştirme.

## Test ve yayın sırası

1. Frontend: npm ci (gerekiyorsa), npm test, npm run build. Son Q04: 45 uygulama/saat testi geçti; ek tanı işlevinden sonra ilgili dört saat testi yeniden geçti.
2. Backend: Node 24 ile node --test tests/social.test.mjs. Son Q04: 15 test geçti.
3. Kritik UI kontrolü: research/q03-ui-check.html yerel fixture, 25 güncellemede odak/seçim/file-input korunması ve gerçek PNG -> JPEG önizleme decode doğrulandı. Bu dosya araştırma alanında, yayına girmemeli. Aynı büyük tarayıcı turunu tekrar yapma.
4. Yeni kaynak main’e gönderilince Pages workflow test/build/deploy; başarılı sonucu görmeden frontend yayında deme.
5. Backend değişirse Sites skill akışı: mevcut projeyi aç, helper ile exact pushed commit’ten paketle, save_site_version ve mevcut public deploy_site_version; ortam değiştiyse yeniden deploy et. Mevcut DB ve audience korunmalı. Tokenları yalnız helper stdin’ine ver.
6. Prompt/domain/publication değişirse npm test’in ürettiği Code.gs’yi özel Google projesinin Kod.gs dosyasına kaydet. Bu güncelleme tetikleyiciyi veya Script Properties’i silmemeli. Otomatik turu sırf test için zorlayıp bütçe harcama.
7. Firestore text/media kuralları değişirse gerçek projede kuralları yayımla; bu dosyayı GitHub’a göndermek Firebase’e otomatik deploy etmez.

Yerel Windows Node 24: `C:\Users\Ulaş\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`. Vite için gerekirse --configLoader runner. Esbuild üst dizin okumaları nedeniyle ortam izin sorunu yaşanabilir; bunu kod hatası sanma.

## Son yapılanlar

Q02: gerçek inbox, okunmamış/okundu, bildirimler, sosyal takip kararları, 100 karakter kişiliğinin prompta aktarılması, banner kaldırılması. Bağımsız Google saatiyle 27 Ekim 00:16 gerçek otomatik üretim doğrulandı; ilk gün 49 geçerli metin/100 beğeni tek istekte planlandı.

Q03: DM kısa hız sınırı gevşetildi; görsel post/DM, özel görsel anlama, gerçek yanıtsız bırakma; odak kaybettiren root render kaldırıldı; 280 AI sınırı kaldırılıp 750 post sınırı ve esnek uzunluk yönergeleri eklendi; az hashtag, seyrek bulanık mavi matrix; README ve bu dosya yenilendi. Eski Q02/kurulum notlarındaki güncel davranışla çelişen tarihsel anlatım yerine README ve bu dosyayı esas al.

## Q04 uygulama ve yayın notları

- Kaynak profiller 500'e çıktı. İçe aktarım `scripts/import-profiles.mjs`; avatar/banner JPEG arşivleri `assets/profiles-500-avatars.zip` ve `assets/profiles-500-banners.zip`; hazırlama betiği ikisini açar. Ham özel kaynak dosyalarını yayımlama. Frontend verisinde özel DM notu yok; backend profil verisinde kişiliğin güvenli DM tavrı bulunur.
- `src/profiles.js` ve backend `lib/profiles.js`: 69 eski/yeni ad eşleştirmesi. 65 eski hesabın adı değişti, dört Türkçe handle ASCII'ye çevrildi. Eski kayıtları topluca silme/yeniden seed etme. Profil geçmişi yazar sorgusuyla, eski post bağlantısı tek kayıt sorgusuyla yüklenir.
- `src/likes.js`: eski bireysel beğeni + yeni gönderi başına bucket birleştirme. Firestore kayıt kimliği bucket-encodedPostId, üyeler canonical handle -> timestamp. Yeni AI kuyruğu en fazla 5000 beğeni; gönderi hedefleri en fazla 12. Google saati ve tarayıcı teslimatı aynı biçimi kullanmalı.
- Normal metin turu 50 içerik/30 dakika, 48 istek/gün olarak kalır. lastActors ortak kontrol alanı yeni 500 hesabın sırayla seçilmesini destekler.
- Yönetim tarayıcı üreticisini çalıştırmaz. requestedTurnAt ortak ayar alanı saat kontrolünde bütçe/kilit üzerinden işlenir. Kaydetmek revision artırır.
- Görsel yolu: Gemini aynı toplu istekte yalnız allowImage işaretli görev için imagePrompt önerir -> Google storage.attachImage -> mevcut serviste POST /api/v1/clock/image -> kullanıcının Cloudflare Worker'ı (AI binding). IMAGE_WORKER_URL Sites ortamında, GEMINI_API_KEY sunucuda kalır.
- Görsel denemesi UTC gününde en fazla 50; D1 image-day / image-claim / image-stop sayaçları. Kota hatasında gün sonuna kadar dur; metni iptal etme veya başka ücretli modele geçme. Etkin ortak enabled/imageEnabled/revision/token/until iki tarafta kontrol edilir.
- Backend Q04 kaynak: 696fead54e48957ebbc0de12ed4b24cb7c727531; saved version 5. Ortam revision 3.
- Cloudflare Worker adı: frosty-art-583aqorves-images; adresi https://frosty-art-583aqorves-images.vortexseniseviyor.workers.dev . AI binding oluşturuldu. Custom Worker kodunun yayınını ve canlı imageEnabled durumunu iş bitimindeki yayın notundan doğrula; hazırlanan kodu canlı çalışıyor sanma.
- Google saati her frontend değişiminde otomatik güncellenmez: scripts/build-google-clock.mjs ile research/google-clock/Code.gs üretip mevcut projeye aktar. Anahtar veya özel mesajları bu pakete koyma.

### Q04 canlı görsel kurulumu (27 Ekim)

Cloudflare Worker custom kodu resmi API ile başarıyla yayımlandı; /health 200, kimliksiz POST 403 doğrulandı. Varsayılan Python istemci tanımı Cloudflare 1010 verdiği için sağlık kontrollerinde Qorves-Health/1.0 kullanıldı. Workers AI binding adı AI. Ücretli plan açılmadı. Geçici Individual Workers Editor anahtarı yalnız bu Worker'a kapsamlandı, bitişi 28 Ekim 2026 23:59 İstanbul; değeri GitHub/siteye konmadı, geçici dosya silindi.

Ortak ayarlarda imageEnabled=true, likesPerTurn=500 ve revision=11 ayarlandı; enabled değiştirilmedi. Oyuncu durdurma tercihini koru. Görsel denemeleri yalnız enabled açıkken çalışır.

Google Apps Script kodu yeni 500 hesaplı paketle yenilendi. Büyük dosyayı tek seferde panoya göndermek tarayıcı bağlantısını kesebiliyor: en fazla 90000 karakterlik parçaları sırayla yapıştır, son kaydın tamamlanmasını ve işlevin gerçekten seçildiğini kontrol et. checkQorvesClock profiller, beğeni ayarı ve görsel anahtarını gösterir, AI harcamaz. verifyQorvesImage tek görsel denemesi yapar, herkese açık test postu oluşturmaz; Gemini sayacını artırmaz. Bu tanı testini döngüye alma.

Son canlı checkQorvesClock sonucu (27 Ekim 09:12 İstanbul): profiles=500, likesPerTurn=500, imageEnabled=true, enabled=false. Kullanıcının ortak durdurma durumu korunmuştur. Yerel derleme veya health yanıtını gerçek otomatik görsel üretimi kanıtı sayma: simülasyon kapalı olduğundan canlı fotoğraf üretimi henüz denenmedi. Eski Q03 sürüm bilgileri tarihçedir; güncel backend saved version 5 ve ortam revision 3'tür.

## Görsel inceleme penceresi

src/lightbox.js, main.js içinden bir kez başlatılır. Native dialog #app dışında durur; canlı DOM güncellemeleri açık görseli veya yakınlaştırmayı sıfırlamaz. data-image-viewer işaretli profil portresi/banner, .post-image ve .dm-image açılır. Akıştaki küçük profil bağlantıları normal profil gezinmesini korur. Klavye odağı, Escape, dışarı tıklama, 2x yakınlaştırma ve reduced-motion desteği vardır. Bu değişiklik yalnız GitHub Pages frontend yayını gerektirir; Google saati veya mesaj servisine yeniden dağıtım gerekmez.

## Q05 devir notları

- threads.js: flattenThread ile çok seviyeli, yetim ve döngüsel eski yorumların her biri tam bir kez gösterilir. storage.openComments(postId) tek alan sorgulu dinleyicidir; ek Firestore indeksi gerekmez.
- Kullanıcı banner'ı users.bannerImage içinde sıkıştırılmış JPEG olarak saklanır. NPC banner'ı kaynak dosya yolunu kullanmaya devam eder. Profil kaydı blockedAccounts alanını taze sunucu kaydından korur.
- Engelleme: özel serviste account_blocks ve ortak users.blockedAccounts aynası. social-visibility.js eski/yeni NPC adlarını eşler. Üretim hedefi, akış bağlamı, beğeni seçimi ve gerçek yayın anı filtrelenir. Kuyruktaki DM, fotoğraf ve takip teslimlerinde sunucu da kontrol eder. Eski konuşma silinmez.
- D1 migration 0002_slimy_chat.sql: yalnız account_blocks, private_memory, social_activity tablolarını ve indekslerini ekler. Eski mesaj tablosunu değiştirmez. Özel olaylar scope=private ve other=oyuncu ile ayrılır; kamuya açık /social/context ve /clock/context özel olay döndürmez.
- Kamusal yayınlar /clock/record veya Firestore'dan doğrulayan /social/record ile idempotent kaydedilir. Normal üretimde actorContexts kendi eski postlarını getirir; özel bilgiler normal üretim istemine konmaz. Geçmiş beğeni, yorum ve takip DM'de hatırlatılır. 90 günden eski olaylar günlük temizlikte silinir; eski mesajların kendisi silinmez.
- DM private-image işi önce D1'de bekler; /tick bir görsel işi işler. Başarıdan sonra fotoğraf+tasvir özel hafızaya girer. Henüz teslim edilmeyen, engellenen veya duraklatmada bekleyen yanıt olmuş gibi hatırlatılmaz. Görsel üretim hatası metin yanıtını kaybettirmez.
- Cloudflare ve Sites IMAGE_RELAY_SECRET gizlisini paylaşır; değerini hiçbir not/kaynak/loga koyma. Worker HMAC imzasını, ortak anahtarı ve /image/consume üzerinden tek kullanımlık D1 iznini kontrol eder. Bütün görseller image-day:UTC sayaçlarında **50 deneme** paylaşır. Sağlayıcı 429'da image-stop:UTC gün sonuna kadar keser.
- Büyük FLUX JPEG çıktısı backend generated-image.mjs ve jpeg-js ile 512px'e sıkıştırılır. Worker Free'de ağır görüntü işleme yapılmaz.
- NPC'nin DM başlatma kararı, var olan oyuncu yanıt çağrısında veya Google toplu çağrısında outreach alanından gelir. Ek Gemini isteği yoktur. Günde çift başına 1 / toplam 12 başlangıç mesajı ile NPC-NPC DM döngüsü yoktur.
- /likers sunucuda bağlı oyuncu kimliğiyle gönderi sahipliğini doğrular, eski/bucket beğenileri tekilleştirir. UI düğmesi yalnız kendi gerçek oyuncu gönderilerinde görünür.
- Kişilik %85 ifadesi bir olasılık motoru değildir; istemde esneklik yönlendirmesidir. Rıza, yaş ve kanon katı kalır.
- Backend açıklamaları BACKEND_NOTES.md içindedir. Bu sürüm frontend + mevcut Sites backend + Cloudflare Worker + Google saati yayını gerektirir. Firebase kuralları ve indekslerine yeni koleksiyon eklenmedi.

Q05 backend kaynak commit: 104234a8f7287bd6efd4d98736ac811cb0aadead; saved version 6, ortam revision 4. Cloudflare Worker HMAC izinli yeni sürüm yayımlandı. Günlük görsel tavanı kullanıcının son seçimiyle 50 deneme oldu; eski Q04 beş deneme notları tarihçedir. Q05 kontrolleri: 50 frontend/saat/Worker testi, 22 backend/görsel testi.
