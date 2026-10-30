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

Q06 sonrası reply=false yalnız o mesaj grubunu yanıtsız bırakır. Eski silence:* sayaçları dikkate alınmaz. read=false ise görüldü verilmez; her yeni mesaj yeniden değerlendirilir. Kontak tercihi aynı çağrıda follow/unfollow seçebilir. İçerik sıradan flörte otomatik ret vermez; kişilik, yaş ve rıza geçerlidir.

DM günlük kişi sınırı 120, aralık 2 saniye; ortak günlük interaktif bütçe yönetim ayarıyla sınırlı ve sunucuda en çok 200. Dakika başına 8 çağrı. İnsan mesajları/sessiz hatta iletiler ayrı yazma hız sınırına tabidir. Sağlayıcı 24 saniyede sınırlandırılır; arka plan işi özel cevap kaydını sıraya alır. Q06: 2,5 saniyelik toplama penceresi ve kalıcı private-dm işi aynı konuşmada gereksiz paralel üretimi önler. Teknik dm-work kilidi karakterin konuşmama tercihi değildir.

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

## Q07 — ek 250 hesap / toplam 750 (27 Ekim 2026)

- Kaynak: D:\Games\FRP\Qorves\SocialMediaWebsiteProject\YeniProfiller. profiller_ek_250.json ve 250 profil TXT'si karşılaştırıldı; 250 avatar ve 250 banner bulundu. Yeni ID'ler 501–750, eski 500 kimlik değişmez. 857 iliskili_hesaplar girdisinin başındaki eksik @ normalleştirildi; tamamı mevcut 750 kimlikte çözülür.
- Yeni kullanıcı adı @dilay.hukukçu -> @dilay.hukukcu; ham ad alias olarak korunur. Toplam alias 70. Eski beğeni, takip, yorum, DM ve hafızaları yeniden seed etme/silme.
- scripts/append-profiles.mjs artırımlı aktarır; scripts/import-profiles.mjs eski 500'lük temel set içindir ve 750'lik verinin üstüne çalıştırılmamalıdır. Ek ham profil dosyaları research dışında depoya alınmaz.
- src/data/profiller.json yalnız kamusal kişilik/üslup, tanıtım, örnek gönderi ve görsel yollarını taşır. Ek aile/gecmis/is/iliski/sir/rutin ve dm_notu yalnız backend lib/data/profiller.json içinde tutulur; özel DM karakter bağlamına eklenir, kamusal üretime/istemciye aktarılmaz. Kişisel sırlara sahip olması onları açıklamak zorunda olduğu anlamına gelmez.
- assets/profiles-extra-250-avatars.zip ve profiles-extra-250-banners.zip tam 250'şer özgün JPEG taşır. prepare-assets.mjs artık hem eski 500 hem ek 250 arşivini açar. Toplam 750 avatar + 750 banner yolu doğrulanmalı.
- Yeni kaynakta 16–17 yaş hesaplar var; sosyal ses yönergesinde 18 yaşından küçüklerle flört edilmemesi açıkça belirtilir, frontend ve backend ses dosyaları eş tutulur.
- Yeni 750 kadro frontend, backend ve Google Code.gs içine dahil olmalı. checkQorvesClock release=Q07 ve profiles=750 gösterir. Google tetikleyici/Script Properties/servis UID değişmez; kurulum işlevini yeniden çalıştırma.
- Bütçeler aynı: 30 dakikalık normal turda 50 metin/500 beğeni, günde 48 normal AI isteği, ortak 50 görsel denemesi/UTC günü. 750 hesap gönderildi diye hepsini aynı isteğe koyma; turda yalnız seçilen hesaplar gider. Kullanıcının ortak enabled durumuna dokunma.
- Q06 backend kaynak: 15511545b25d13268c245bcf6de48b63261271d6; saved version 7 / ortam revision 4. Doğal DM kararları ve kalıcı mesaj gruplama korunmalı. Yeni Q07 backend kaynağı ve canlı doğrulaması yayın kaydından kontrol edilmeli.

## Q08 — Firestore okuma kotası ve yönetim anahtarı

27 Ekim akşamı gerçek REST/SDK resource-exhausted (429) ve Firebase Usage kota uyarısı doğrulandı; 24 saat grafiği yaklaşık 86K okuma, 7.6K yazma gösteriyordu. Bu Gemini kotası değildir. Spark ücretsiz okuma sınırı 50K/gün, yenilenme Pasifik gece yarısıdır; ücretli plan açılmadı.

- shared-settings.js: yönetim ayarını yeniden okumadan updateMask + atomik revision increment ile doğrudan commit eder. Durdurma/başlatmada pauseStartedAt ve totalPausedMs hesapları korunur. Sadece değişen alanlar yazılır. 8 saniyede belirsiz kayıt uyarısı, gerçek kota hatasında açık hata; sessiz sonsuz transaction retry yok. Anahtar işlem boyunca kilitlenir.
- Genel akış yorum dinleyicisi son 200 yoruma sınırlanır; gönderi açılınca bütün yorumlar postId sorgusuyla ayrıca yüklenir. Eski yorumlar silinmez.
- Google saati son 40 gönderi/80 yorumu bağlam olarak alır; sıra boşsa yayın sorgusu yapmaz. Son otomatik uyandırma 15 dakikadan yeniyse tarayıcı aynı yayın kuyruğunu tekrar tekrar sorgulamaz; eski saatte dakikalık yedek teslim devreye girer.
- Özel serviste eski Firestore geçmişini DM'ye geri doldurma aynı NPC/oyuncu için her dakika yerine günde en fazla bir kez yapılır. Canlı etkileşimler zaten D1 social_activity'ye kaydedilir; hafıza silinmez. Eski geçmiş okuma hata verirse 15 dakika bekler.
- Google REST veritabanı 429'unda 15 dakikalık kontrol beklemesi uygular; limit yenilenince yeniden deneyerek devam eder. Dolu sağlayıcı kotası koddan sıfırlanamaz. Eski hatalı SDK transaction bekleyen tarayıcı sekmeleri yeni yayın sonrası yeniden yüklenmelidir.
- checkQorvesClock sürümü Q08; kadro 750, AI ve görsel bütçeleri değişmedi. Frontend + Google saati + mevcut özel servis birlikte yayımlanır.

## Q09 — otomatik yedek ve Firebase'e geri dönüş

Önce YEDEK_VERI_HATTI.md dosyasını oku. D1'de yalnız dört yeni ortak tablo var; özel tablolar korunur. İlk tam aktarım bitmeden active işaretini elle değiştirme. Yeni Google Q09 kodu her uyanmada /common/sync çağırarak aktarımı otomatik sürdürür. Firebase sağlıklıyken provider=firebase, hata/kota veya bekleyen kopya varken provider=sites. Aynı requestId/sürüm korumaları, silme izleri ve yazma çiti iki ayrı veri dalını engeller. Firebase'e yalnız eşitleme bitince otomatik dönülür. İstemci src/common-firestore.js, sunucu lib/common-store.mjs ve Cloudflare imzalı görsel yolu birlikte güncellenmiştir. Yeni ücretli plan/billing yok. Kuralların writer çiti gerçek projeye ayrıca yayımlanmalıdır.

## Q11 - 29 Ekim acilis
src/boot.js + boot.css ve index.html terminali. storage.init onProgress ile kimlik/hat/akis/hazir asamalarini bildirir. Main kendi oturumunu dogruladiktan sonra boot.complete cagirir. Arka plan listelerinin ilk sorgusu ekranin acilmasini engellemez; kritik posts+tombstones+settings+control beklenir. Auth authStateReady ile kalici oturum once geri yuklenir, Firestore modulu yalniz ortak yedek hatti etkin degilse yuklenir. Veriler veya guvenlik kontrolleri atlanmaz; buyuk listeler ayni dinleyicilerde tamamlanir. Ortak ilk esitleme ve Google bulut saati korunur. Q10 sunucu onarimlari backend BACKEND_NOTES.md icindedir.


## Q12 - Etkilesim gecikmesi
src/optimistic.js koleksiyon bazli gecici gorunum, bekleyen islem kilidi, onay gelene kadar tercih koruma ve hatada onceki gorunume donusu yonetir. storage rows projeksiyonu likes/follows icin kullanilir. UI bu islemlerde render'i hemen cagirir ve dugmeler aria-busy/disabled alir. Ayni hedefe ust uste tiklama iki islem baslatmaz. Begenide once sunucudan okuma yoktur; istenen durum belirli belge kimligine yazilir/silinir. Takip alias okumasi paraleldir; bildirimler ayri tamamlanir. Yeni tests/optimistic.test.js gecikme, tek yazma, rollback ve canli diger kayitlarin korunmasini kapsar. Yalniz Pages yayini gerekir; Google saati/sunucu ayni kalir.


Q13: Backend recovery-stop.mjs + ortam RECOVERY_STOP_ID, kullanicinin acik kapatma talebini veri servisi hatasinda da uygular. Su anda kapali birakildi; test icin acma. Sunucu common-store sorgusu once key sayfasi secer sonra buyuk gorselli govdeleri yukler; Ek indeks migrationi canli SQLITE_NOMEM nedeniyle geri cekildi; nihai duzeltme yeni DDL olmadan sorgu bellegini azaltir. Ortak ayar yazma yaniti hata aciklamasi kullanir, emergencyPaused varsa UI enabled=false gosterir. Backend BACKEND_NOTES.md yetkili kaynaktir.


## Q14 - Hesap kasasi ve bildirimler
Yeni account-vault.js: sifreler hesap basina non-extractable AES-GCM CryptoKey+iv+cipher ile IndexedDB qorves-account-vault/entries icinde; listeye yalniz public profil metadatasi gelir. LocalStorage/GitHub/loglarda yeni plaintext parola yok. main.js bindAccount mevcut realtime.bind yolunu kullanir; hesap gecisinde accountEpoch eski fetch/okundu yanitlarini atar, UI mesaj/draft/dm-yonetim kilidi temizlenir. UID sunucuda tek bagli hesaba sahip oldugundan baska sekmeler account-changing olayinda ozel gorunumu kapatir. Kullanici tekrar hesap secerek baglanir. Bu degisiklik yeni backend yetkisi veya simulasyon degisikligi gerektirmez.
read-all.js iki bildirim kanalini Promise.allSettled ile ayri isler. storage.readNotifications anlik gorunum+rollback kullanir, bos paket gondermez ve 100'den fazla anahtari parcalara ayirir. Ozel okundu isaretleri yeni bildirim ID'lerini etkilemez; kanal arizasinda geri alinir. Sag rail online degiskeni storage.settings.enabled + config.simulationAllowed + emergencyPaused'dan hesaplanir. Testler account-vault.test.js icinde sifreli kalicilik, bagimsiz anahtarlar/AAD, ilk giris ve bildirim kanal izolasyonunu kapsar.


## Q15 - Takip listeleri / DM ve oyuncu postu kuyrugu
Frontend relationships.js followAccounts aliaslari tekillestirir ve takip yonunu korur. Profilde connections-followers/connections-following modal acar; storage.loadConnections hedefe ozel kayitlari yukler. messageReceipt gercek readAt ile gorulduyu gosterir; failed/quota icin retry-letter kontrollu istektir. Mesaj etiketi bilerek okunmamis sent/read_at=0 ile teknik arizayi ayirir.
Backend social-api.mjs DM job upsert ve private-dm/reactive-job isleme pause filtresini duzeltir. /dm/retry sahiplik/NPC/engel/ortak anahtar/butce ile korunur; mesaj basina UTC gununde bir manuel deneme. /react reactive-job olusturur; mevcut /tick kalici isi surdurur, lease+state tekrari onler. Provider quota otomatik retry yapmaz; TimeoutError en fazla bir ek butceli deneme. Yeni migration yok. Frontend + mevcut Sites backend yayinlanmali; Google saati ayni /tick'i cagirdigi icin degismez. Anahtar/model/butce ve sim enabled degerini test icin degistirme. Detay BACKEND_NOTES.md.



## Q16 - Repost etkilesimleri
Repostlar posts kaydi ve normal toplu uretim kuyruguna zaten dahildi; main.js repost eyleminde eksik olan realtime.react(posts, sent.id) cagrisi eklendi. Tepki orijinal gonderiye degil yeni repost kimligine yonelir. Q15 kalici /react kuyrugu, on dakikaya dagitim, engel/ortak durdurma ve mevcut interaktif butceler aynen kullanilir; zorunlu yanit veya ek butce yoktur. Yalniz Pages yayini gerekir.


## Q17 - GitHub saatinin ortak veri hatti
GitHub cloud-simulation.mjs ilk kontrol/yazma adiminda da cloud-store.mjs araciligiyla ortak D1/Firebase hattini kullanir. Aktif ortak depoda dogrudan Firestore yazmasi yoktur. Durum sorgusu hata verirse eski yazma yoluna kacmaz; ilk esitleme veya emergencyPaused durumunda uretim yapmaz. Google saati, ortak kilit, revision, butceler ve simulasyon anahtari korunur.


## Q18 - Bes ozellikli sosyal ag paketi (30 Ekim 2026)

1. Iliski/itibar: her NPC-oyuncu cifti icin warmth, trust, respect; ayrica friendship, familiarity, tension ve yetiskin karakterlerde romance/flirt baglari. Tek seviyor/sevmiyor degeri yoktur. Model mevcut cagrida anlamli gelismeye gore en fazla +/-3 degisim ve onceki iliskiyi koruyan ozet verir. DM ozel izlenimi kamuya sizmaz; gorunen public ve private deneyimler ayri tutulur. 16-17 kaynak karakterlerin normal sohbeti/paylasimi degismez, yeni romance/flirt boyutlari eklenmez. Oyunculardan yas/dogum tarihi/kimlik toplanmaz; grup sahibinin tum oyuncularin 20+ oldugu bilgisi esas alinir.
2. Yerel akis: ana sayfadaki Sistem akisi secicisinde Genel veya 29 sistem secilir. Gonderiler, Kesfet hesaplari ve sag hesap onerileri bu secime uyar. Genel tum sistemleri geri getirir. Sistem icin ek 200 kayit arka planda yuklenir.
3. Kisisel siralama: discovery.js gercek oyuncunun begenilerinden konu/meslek/sistem/irk/yas grubu ve kaynakta acikca belirtilen kurgusal karakter sunumu etiketlerini ogrenir. Gercek oyuncunun cinsiyeti veya gorseli tahmin edilmez. Hesap ilgisi, benzer etiketler ve yenilik birlikte puanlanir; her besinci sira kesif icindir. Begeniyi kaldirmak tercihten de cikarir. Ek AI cagrisi yoktur.
4. Gruplar: Mesajlar > Yeni grup; ad ve 2-11 katilimci secilir (oyuncu/NPC karisik). Uye listesi, kim ne yazdi, okunmamis sayisi, grup bildirimi, gorselli oyuncu mesaji ve ayrilma vardir. NPC grubu bilir; tek insan mesaj grubu icin en fazla 3 NPC ayni istekte degerlendirilir, yanit vermemeyi veya ayrilmayi secebilir. Cevaplar 10-60 saniyeye dagilir; son 10 saniyede yaziyor gorunur. NPC cevabi yeni model istegi dogurmaz. Birebir ozel DM gecmisi grup istemine verilmez. Gruplar mevcut interaktif gunluk/dakikalik butceyi paylasir, sinir artmaz.
5. Kaydedilenler: gonderide igneli kaydet dugmesi; kendi profilinde Kaydedilen gonderiler baglantisi. Liste sunucuda hesaba ozel saklanir ve hesaplar/cihazlar arasinda korunur; gonderi silinirse arsiv onu yeniden canlandirmaz.

Yeni backend tablolar: impressions, bookmarks, chat_groups, group_members, group_messages. Ortak Firebase aynasina bu ozel tablolar dahil edilmez. D1 migration 0004_chunky_sway ve 0005_jazzy_mandarin eklemelidir; mevcut veri silinmez. Yeni API /bookmarks ve /groups* bagli hesap kimligi gerektirir. Grup uye denetimi okuma/yazma/okundu/ayrilmada sunucudadir. group-job mevcut /tick ile surdurulur; lease ve kaynak mesaji tekillestirilir, kota/hata otomatik sonsuz deneme yapmaz. Ortak enabled/revision ve engeller korunur.

Yayin: once mevcut Sites backend + migrationlar, ardindan GitHub Pages. Google saatinin kodu degismez; mevcut /tick yeni grup islerini de isler. Kaynak frontend icin qorves-sosyal-publish yayinci klonu yetkilidir; ikinci yerel qorves-sosyal kopyasi bu paketle otomatik ezilmemistir.
