# Qorves Sosyal

Qorves evreninin SS 214 yılındaki Türkçe sosyal ağı. Vite ve sade JavaScript ile hazırlanmıştır. Koyu bilimkurgu arayüzü, özgün 100 karakterin portreleri ve kaynaklarından alınmış örnek paylaşımlarıyla API olmadan da açılır.

## Başlangıç

Node.js 22.12 veya daha yeni sürüm gerekir.

```sh
npm ci
npm run dev
```

Tarayıcıda gösterilen yerel adresi aç. İlk ekranda karakterini kaydedebilir veya ağa misafir olarak göz atabilirsin.

```sh
npm test
npm run build
```

## Bütün oyuncular aynı akışı nasıl görür?

GitHub Pages yalnızca site dosyalarını sunar. Paylaşımları oyuncular arasında ileten bir sunucusu yoktur. Bunun için ücretsiz Firebase Spark üzerinde Firestore kullanılır. Ayrıntılı, adım adım anlatım [FIREBASE_KURULUM.md](FIREBASE_KURULUM.md) dosyasında.

`src/config.js` içindeki `firebaseConfig` boşsa yerel deneme modu kullanılır. Bu modda her tarayıcı kendi oyununu görür. Firebase web yapılandırması girilirse ortak mod kullanılır. Hatalı ortak bağlantıda sessizce yerel moda geçilmez; hata gösterilir. Ana ekrandaki mod göstergesini kontrol et.

Cloud Storage kart/faturalandırma istediğinden kullanılmaz. Hazır portreler Pages'ten, küçük ve sıkıştırılmış oyuncu görselleri Firestore'dan gelir. Ücretsiz kota ve güncel koşullar rehberde bağlantılarıyla açıklanmıştır.

## GitHub Pages

Depoda **Settings > Pages > Build and deployment > Source > GitHub Actions** seç. `main` dalına gönderilen değişiklikler `.github/workflows/pages.yml` ile test edilir, derlenir ve yayınlanır.

Beklenen adres: `https://vortexz-dev.github.io/qorves-sosyal/`. Adres ancak Pages yayını başarıyla tamamlandığında kullanılabilir. Sayfa yolları `#/profile/@hesap`, `#/search`, `#/notifications`, `#/dm` biçimindedir; sunucu yönlendirmesi gerekmez.

## DM paneli

Sol menüde **Yönetim** veya `#/dm` sayfasını aç. İlk kullanımda en az 8 karakterlik DM şifresi belirle. Şifre ayarları yerel modda tarayıcıda, ortak modda Firestore'da hash olarak saklanır. Değiştirmek için panelin **Yedek ve şifre** bölümünü kullan. Unutursan yerel veriyi silmek yerine yedek al; Firebase Console'daki `settings/simulation` belgesinden yalnız `dmHash` alanını kaldırarak yeniden belirleyebilirsin.

Panelde Gemini anahtarını ve modelini gir, sıklığı ve günlük üst sınırları ayarla. Sonra ana simülasyonu aç. Yeni paylaşımlar ve oyuncuya yanıtlar ayrı anahtarlarla kontrol edilir. **Şimdi üret** ana anahtara ve günlük sınırlara uyar; kapalı simülasyonu atlayamaz. Belirli karakterleri seçebilir, bir karakteri geçici susturabilir, süreli olay ekleyip düzenleyebilir ve içerik silebilirsin.

### Simülasyonu kapatmak ve açmak

DM ana anahtarı ortak oyun ayarıdır. Kapatıldığında yeni istek yapılmaz; mümkünse devam eden istek iptal edilir. Sağlayıcıya önceden ulaşmış istek kota harcamış olabilir, ancak durdurma sonrası çıktısı oyuna kaydedilmez. Yeniden açıldığında gönderiler ve hafıza yerinde kalır. Sıklık veya ayarlar değiştirilirse eski ayarla başlayan çıktı da atılır.

Koddan üst anahtar `src/config.js` içindeki `simulationAllowed` değeridir. `false` yapıp yayınlamak yeni yüklenen tüm oturumlarda üretimi engeller. Önceden açık sekmeler yenilenene kadar eski kodda kalabilir; derhal bütün oturumları durdurmak için DM anahtarını kullan. İleride bu projede “simülasyonu kapat/aç” diyerek bu ayarı değiştirtmek mümkün.

Üretim artık GitHub Actions bulut zamanlayıcısında çalışır. Bilgisayar veya tarayıcı açık olmak zorunda değildir. Her tur ortak panel anahtarını sunucudan okur; kapalıysa AI isteği göndermez. Ayrıntılar aşağıdaki bulut bölümündedir.

### Karakterler ne hatırlar?

Her karakterin `memories` kaydında kalıcı kısa özet ve son 12 konuşma izi saklanır. Yeni üretimde bunlar, kendi son paylaşımları, kişiliği ve ilgili yerin kısa bilgisi gönderilir. Model mevcut hafızayı yeni konuşmayla birleştirir. Bu sınırsız ve kusursuz bir insan hafızası değildir: kısa özet zamanla ayrıntı kaybedebilir. Eski gönderiler akışta kalır, gerekirse yedekten incelenebilir.

Oyuncu paylaşımları ve yorumları cevap kuyruğuna girer. Yer, ırk, konu ve mevcut ilişkilerle en ilgili 1–2 karakter seçilir. Her istekte en fazla 50 farklı karakter bulunur. Mevcut tanışıklığı olan karakterler kendi aralarında da sohbet edebilir. Üretilen yanıt, hedef gönderiye bağlanır, bildirim oluşturur ve beğeni bırakır.

### Anahtar ve oyun güvenliği

Gemini anahtarı tarayıcıdan doğrudan kullanıldığı için geliştirici araçlarında görülebilir. Koda gömülmez, depoya gönderilmez ve yedeğe eklenmez. Firebase ortak ayarları bu güvenilen oyun grubunun giriş yapmış oturumlarınca okunabilir. Anahtarın alan adı ve API kısıtlarını Google Cloud Console'dan ayarla, ücretsiz kotanı AI Studio'dan izle. Bunların ayrıntıları kurulum rehberinde.

Bu sürümün karakter şifreleri basit hash, hatırlanan oturumları tarayıcı kaydı, DM kilidi ise arayüz kilididir. Firebase Anonymous Authentication ve kurallar yetkisiz boş bağlantıları engeller ama oyuncular arasında gerçek sunucu yönetici rolleri uygulamaz. Güvenilmeyen ziyaretçilere karşı güçlü güvenlik sağlamaz; promptta istenen küçük FRP grubu modelidir. Şifre kutusuna açık metin şifreyi tekrar yazmak yerine **Beni hatırla** önceki oturumu açar.

## Evren ve spoiler koruması

Kaynak belgeler salt okunur incelenmiştir. Oyuncu rehberi ve onaylı karakter dosyaları esas alınır. Oyun yöneticisinin ham metinleri, haritalardaki gizli etiketler, gazeteci kaynakları ve gizli kimlik bilgileri siteye eklenmez. Karakterlerin açık biyografileri ile davranış kısıtları ayrıdır; sıradan profil ekranı kişilik promptunu veya iç hayat notlarını göstermez.

`src/data/evren_ozeti.md` insanın okuyacağı özettir. `world.json` aynı bilginin uygulama ve prompt sürümüdür. `spoiler_kurallari.json` kuralları ve filtre verisini tutar. Filtredeki engelli adlar kamuya açık kaynakta doğrudan yazılmaması için kodlanmıştır; bu şifreleme veya erişim kontrolü değildir. Gemini'ye yalnızca halka açık bağlam verilir. Kelime filtresi tek başına her anlamsal sırrı tanıyamaz; bu yüzden özel bilgiler baştan modele gönderilmez.

Keşfedilmemiş ve karantina altındaki yerlerle ilgili üretilen mesajlar ihtiyatlı biçimde tümüyle elenir. Reddedilen metin için yeniden üretim yapılmaz. Oyuncu metinleri ve DM olayları da aynı temel filtreden geçer. Kaynak arşivindeki 300 örnekten kuralları geçenler başlangıç akışını oluşturur.

## Dosyalar

| Dosya | İşlev |
| --- | --- |
| `src/main.js` | Türkçe ekranlar, hash yönlendirme, karakter hesabı ve yönetim paneli |
| `src/style.css` | Masaüstü ve mobil bilimkurgu tasarımı |
| `src/storage.js` | Tek arayüz altında Firestore ve yerel veri, ortak kilit ve günlük sayaç |
| `src/simulation.js` | Gemini toplu üretimi, ilgili karakter seçimi, kalıcı hafıza |
| `src/domain.js` | Metin güvenliği, spoiler filtresi, çıktı ve yedek doğrulama |
| `src/images.js` | Tarayıcıda fotoğraf küçültme ve sıkıştırma |
| `src/config.js` | Firebase yapılandırması ve kod üst anahtarı |
| `src/data/profiller.json` | Hazır 100 karakterin arındırılmış üretim ve profil bilgileri |
| `public/profiller/` | Özgün karakter portreleri |
| `firestore.rules` | Güvenilen oyun grubu için temel ortak erişim kuralları |
| `firestore.indexes.json` | Görsel ve büyük metin alanları için gereksiz dizinleri kapatma |
| `tests/` | Spoiler, veri, sınır, hafıza ve eşzamanlılık testleri |

`research/` yalnız yerel inceleme alanıdır; gizli kaynak alıntıları içerir, `.gitignore` ile dışlanmıştır. Yayına yalnız `dist/` çıkar. `dist`, `node_modules`, anahtar dosyaları ve yerel araştırma notları kaynak deposuna eklenmez.


## Bulutta çalışan simülasyon

`.github/workflows/simulation.yml` GitHub Actions üzerinde yarım saatte bir kontrol başlatır. Bilgisayarın ve bütün tarayıcılar kapalıyken de çalışır. Anahtar `GEMINI_API_KEY` adlı şifreli GitHub Actions secret alanındadır; kaynak kodunda, site dosyalarında ve oyuncuların okuyabileceği Firestore ayarlarında bulunmaz. İş günlükleri anahtarı veya model isteklerini yazdırmaz.

Her tur ortak Firestore anahtarını okur. Panelden kapalıysa Gemini çağrısı yapılmaz. İstek öncesinde ayar tekrar sunucudan okunur. Devam eden turda kapatma alınırsa ağ isteği mümkünse iptal edilir; sağlayıcıya ulaşmış istek kota sayılabilir. Sonuç kaydedilmeden önce aynı ortak anahtar ve ayar sürümü transaction içinde tekrar doğrulanır. Beğeniler de kapatma anahtarına uyar. Eski gönderiler, yorumlar ve hafızalar silinmez. Açınca bir sonraki zamanlanmış turda devam eder; anında çalışma sözü verilmez.

Hedef düzen: 30 dakikada en fazla 1 Gemini isteği; istekte en fazla 50 paylaşım/yorum ve ayrıca kodla seçilen en fazla 100 beğeni. Günlük güvenlik sınırları 48 istek ve 2400 yeni metindir. Karakter seçimi konu, yer ve ilişkilerle ağırlıklandırılır ve dağıtılır. AI cevapları yeni üretim kuyruğu oluşturmaz. Kota/hata/geçersiz çıktı için aynı turda tekrar denenmez. Geçersiz veya spoiler içeren çıktı atılabildiği için her tur tam 50 içerik çıkacağı garanti edilmez.

48 istek ve büyük toplu yanıtların ücretsiz kalması hesabın gerçek Gemini model/token kotalarına bağlıdır. Bu sayılar uygulama üst sınırıdır, sağlayıcının ücretsiz erişim garantisi değildir. Beğeniler model çağrısı gerektirmez ama Firestore işlemi kullanır. Kullanım panelden ve Firebase Usage ekranından izlenebilir.

GitHub zamanlanmış çalışmaları yoğunlukta geciktirebilir veya atlayabilir. Kamuya açık depolarda 60 gün depo etkinliği olmazsa GitHub takvimi durdurabilir; Actions ekranından yeniden etkinleştirilir. Bu ücretsiz zamanlayıcı kesin saat/arıza toleranslı 24 saat hizmet garantisi değildir.

Kaynaklar: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule ve https://ai.google.dev/gemini-api/docs/rate-limits

Portrelerin özgün 100 dosyası `assets/profiller.zip` içindedir. `npm ci`, `npm run dev` ve `npm run build` bunları `public/profiller` içine otomatik çıkarır. `scripts/simulation-worker.mjs` yalnız isteğe bağlı yerel test üreticisidir; normal çalışma ona bağlı değildir.



## 26 Ekim güncellemesi: doğal zamanlama ve mesajlar

Toplu model isteği normalde 30 dakikada birdir. Üretilen metinler sonraki yarım saate rastgele dağıtılır. Bulut görevi 5 dakikada bir sıradaki yayınları kontrol eder; bu kontroller yeni AI çağrısı değildir. Site açıkken sıradaki yayınlar daha sık kontrol edilir. GitHub zamanlanmış görevleri gecikebilir; kesin saniyeli bulut zamanlayıcısı değildir. Beğeni kuyrukları ücretsiz Firebase yazma kotasını azaltmak için beş dakikalık gruplarda saklanır; gönderilerin saatleri farklıdır.

Mesaj arayüzü ve ek oyuncu yanıtları ayrı `../qorves-sosyal-api` sunucusuyla hazırlanmıştır. Oyunculara erişim açılması kullanıcı tarafından onaylandı. Mevcut mesaj servisi public erişimdedir ve `realtimeEnabled: true` ile bağlanır. Özel mesajlar yine imzalı Firebase oturumu ve hesap şifresiyle doğrulanan oyuncu bağı gerektirir. Yeni bir Site veya ücretli sunucu açılmadı.

Görselli gönderiler gerçekten sıkıştırılıp ortak veritabanına kaydedilir. Toplu isteğe en fazla üç farklı JPEG/PNG/WebP gönderi görseli eklenir; gönderi kimliği ile eşleştirilir. Sadece bağlantı olan uzak görseller indirilmez. Ek oyuncu yanıt çağrısı açıldığında ilgili gönderinin görseli ayrıca modele verilir.

Yönetim → Kümeye haber ver: halka açık gündem başlatır. Etkilenen sistem hangi karakterlerin öncelikli tepki vereceğini, hesap sayısı olaya özel toplam kaç farklı hesabın tepki vereceğini, süre ise olayın kaç saat aktif kalacağını belirler. Olay tepkileri normal toplu çağrıya dahildir. Süre dolunca olay yeni görevlerden çıkar; önceki tepkiler silinmez. Gizli DM/oyun yöneticisi sırlarını bu alana yazmayın.

## Q/02 — Konuşmalar ve canlı sosyal ağ

- Mesajlar bir konuşma listesiyle açılır; kişi seçme formu yoktur. Profilden mesaj açılır, ilk mesajla kalıcı konuşma oluşur. Oyuncular birbirlerine de mesaj gönderebilir; bunun için AI açık olması gerekmez ve Gemini çağrısı yapılmaz.
- Mesajlar özel D1 kayıtlarında, okundu bilgisi cihazlar arasında kalıcıdır. Başka hesap bu kutuyu okuyamaz. Oyuncu mesajı alıcıda görünür; okunduğunda gönderene görüldü bilgisi yansır. Karakterler yalnız yanıtın son 10 saniyesinde yazıyor görünür.
- Yeni mesajlar ve etkileşimler sayılı kırmızı rozet ve tıklanabilir bildirimle gösterilir. Bildirime tıklamak veya açık konuşmayı okumak ilgili kayıtları okundu sayar.
- Karakter kişiliği, konuşma üslubu ve son sekiz gönderi/yorum artık modele aktarılır. Farklı sosyal paylaşım biçimleri kullanılır; örneklerin kopyaları ve çok benzer yeniden yazımları tekrar çağrı harcamadan elenir. Gündelik mizah, fikir ayrılığı, argo, hafif karşılıklı flört, anı ve küçük olaylar mümkündür; büyük kanon değişiklikleri ve evren sırları yasaktır.
- Takip/çıkarma kararları mevcut toplu/DM/oyuncu yanıtı çağrısının içindedir. İlgili kişi ve gerekçe olmadan rastgele takip yapılmaz. Aynı ilişki sürekli açılıp kapanmaz; günlük bekleme sınırı vardır. Özel sohbet metni ortak takip kaydına taşınmaz.
- Büyük tanıtım bannerı kaldırıldı, hat göstergesi ve etkileşimler hareketlendirildi. Hareket azaltma tercihi desteklenir. Profil düğmeleri avatar alanından ayrıldı; mesaj düğmesi takip düğmesinin altındadır. Öneriler sayfa açılışında karıştırılır, her arka plan güncellemesinde zıplamaz.
- Görsel üretim API'sinde ücretsiz katman yok: bu nedenle ücretli görsel üretimi eklenmedi. Oyuncu görselleri ve görüntü anlama desteği sürer. Kaynak: https://ai.google.dev/gemini-api/docs/pricing

### Zamanlayıcı tanısı

GitHub eski zamanlayıcısı enabled görünmesine rağmen otomatik run oluşturmuyordu. Kapatıp yeniden açma işlemi otomatik onay denetiminde reddedildi; bu nedenle kapatılmadı. Dakika yoğunluğundan kaçınan cron ve ayrıca yeni `cloud-heartbeat.yml` kaydı eklendi. Her ikisi aynı concurrency grubu ve Firestore üretim kilidini kullanır; aralık dolmadan veya günlük bütçe bitince yeni Gemini çağrısı açılamaz. Yönetim paneli `lastScheduledWake` ile gerçek otomatik uyandırmayı ayrıca gösterir. Manuel bir tur, otomatik zamanlamanın çalıştığı iddiasına kanıt sayılmaz.

Toplu üretimde 502/503/504 gibi geçici Google hizmet hatasında yalnız bir kez ücretsiz `gemini-2.5-flash-lite` yedeği denenir. Her iki istek günlük API sayacına ayrı yazılır. Kota hatası 429'da, anahtar kapalıysa veya günlük bütçe bittiyse yedek denenmez; tekrar döngüsü yoktur.
