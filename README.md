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

Tarayıcı üretimi yalnız görünür ve açık oturumlarda çalışır. Yerel üretici ayrıca başlatılmışsa tarayıcı kapalıyken de bilgisayarda çalışır. Firestore işlemiyle alınan süreli kilit, iki tarayıcının aynı turu başlatmasını önler. İstek başlamadan günlük kullanım ayrılır. Kota hatası, ağ sorunu veya geçersiz JSON'da anlık yeniden deneme yapılmaz; sonraki normal zaman aralığı beklenir. Panel son sonucu gösterir.

### Karakterler ne hatırlar?

Her karakterin `memories` kaydında kalıcı kısa özet ve son 12 konuşma izi saklanır. Yeni üretimde bunlar, kendi son paylaşımları, kişiliği ve ilgili yerin kısa bilgisi gönderilir. Model mevcut hafızayı yeni konuşmayla birleştirir. Bu sınırsız ve kusursuz bir insan hafızası değildir: kısa özet zamanla ayrıntı kaybedebilir. Eski gönderiler akışta kalır, gerekirse yedekten incelenebilir.

Oyuncu paylaşımları ve yorumları cevap kuyruğuna girer. Yer, ırk, konu ve mevcut ilişkilerle en ilgili 1–2 karakter seçilir. Her istekte en fazla 5 karakter bulunur. Mevcut tanışıklığı olan karakterler kendi aralarında da sohbet edebilir. Üretilen yanıt, hedef gönderiye bağlanır, bildirim oluşturur ve beğeni bırakır.

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

## Yayınlanan sürüm ve üretici

Firebase bağlantısı kuruludur. İki bağımsız anonim oturum arasında ortak paylaşım okuma/yazma doğrulanmıştır. Başlangıç akışında her 100 karakter için 5, toplam 500 geçmiş paylaşım vardır. Geçmiş, kaynak örnekleri ve halka açık biyografi parçalarıyla, ayrıca başarılı toplu üretim sonuçlarıyla hazırlanmıştır; tamamının yeni AI üretimi olduğu iddia edilmez.

Gemini anahtarı artık ortak Firestore ayarlarına kaydedilmez. DM panelinden girildiğinde yalnız o tarayıcıda saklanır. Yalnız anahtarı bulunan oturum üretim yapabilir. Birden fazla üretici olsa da ortak kilit ve günlük bütçe tek kalır. Normal oyuncuların her sayfa açışı yeni AI isteği oluşturmaz.

İsteğe bağlı yerel üretici `scripts/simulation-worker.mjs` bilgisayar açıkken çalışır; anahtar yolu `QORVES_GEMINI_KEY_FILE` ortam değişkeninden alınır, anahtar dosyasını depoya eklemez. Bu üretici tarayıcı kapalıyken de çalışabilir. DM ortak anahtarını kapatmak yerel üreticiyi de durdurur. İşlem kapanırsa tekrar başlatılması gerekir; otomatik zamanlayıcı kurulmamıştır.

Portrelerin özgün 100 dosyası `assets/profiller.zip` içinde tutulur. `npm ci`, `npm run dev` ve `npm run build` gerekli dosyaları `public/profiller` içine otomatik çıkarır. Böylece yayınlanan portreler kaynak fotoğraflarla aynıdır.

