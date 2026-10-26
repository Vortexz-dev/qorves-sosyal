# Qorves Sosyal için ücretsiz Firebase kurulumu

Bu rehber, oyuncularının aynı paylaşımları görmesi içindir. Site GitHub Pages'te açılır; Firebase ise ortak defter gibi paylaşımları, karakter hesaplarını, yorumları ve beğenileri tutar. GitHub Pages tek başına bu bilgileri oyuncular arasında paylaşamaz.

## 1. Ücret çıkmayan planı seç

[Firebase Console](https://console.firebase.google.com/) adresini aç. Google hesabınla giriş yap, **Create a project / Proje oluştur** seç. Proje adına `qorves-sosyal` yazabilirsin. Google Analytics bu oyun için gerekli değil; kapatabilirsin. Plan **Spark** olarak kalsın. Kart ekleme, Blaze'e yükseltme.

26 Ekim 2026 tarihinde kontrol edilen resmî belgelere göre Cloud Storage artık Blaze gerektiriyor. Bu proje Cloud Storage kullanmaz. Hazır 100 portrenin dosyaları GitHub Pages'ten gelir. Oyuncuların fotoğrafları tarayıcıda sıkıştırılır ve Firestore belgelerine küçük görseller olarak eklenir. Büyük veya çok sayıda görsel için uygun bir yöntem değildir; küçük FRP grupları içindir.

Kaynak: [Cloud Storage plan koşulu](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

## 2. Web uygulamasını ekle

Projenin ana sayfasında **</> Web** simgesine bas. Uygulama adı `Qorves Sosyal` olsun. Firebase Hosting seçeneğini işaretlemen gerekmiyor; yayın GitHub Pages'te olacak.

Firebase sana `firebaseConfig` başlıklı bir bölüm gösterecek. İçindeki `apiKey`, `authDomain`, `projectId`, `messagingSenderId`, `appId` değerlerini kopyala. Bu Firebase yapılandırması Gemini anahtarı değildir. Web uygulamasında bulunması normaldir; erişimi güvenlik kuralları belirler.

Projede `src/config.js` dosyasını aç ve boş `firebaseConfig: {}` nesnesini verilen nesneyle doldur. Değişikliği kaydedip GitHub'a gönderdiğinde Pages yeniden yayınlanır.

## 3. Authentication hizmetini aç

Soldan **Build / Authentication** bölümüne gir. **Get started** seç. **Sign-in method** altında **Anonymous / Anonim** sağlayıcısını etkinleştir ve kaydet. Uygulama ortak veritabanına bağlanırken bu hizmeti kullanır. Oyuncunun gördüğü karakter adı ve şifre oyunun kendi hesap sistemidir.

**Settings / Authorized domains** bölümüne GitHub Pages alan adını ekle: `vortexz-dev.github.io`. Buraya `https://` veya `/qorves-sosyal/` yazma. Yerel deneme yapacaksan `localhost` da ekle.

## 4. Firestore veritabanını oluştur

Soldan **Build / Firestore Database** aç. **Create database** seç. **Standard edition**, `(default)` veritabanı ve sana uygun bir Avrupa bölgesi seç. Bölgeyi sonradan kolayca değiştiremezsin. **Production mode** ile başla.

**Rules / Kurallar** sekmesine gir. Projedeki `firestore.rules` dosyasının tamamını kopyalayıp yapıştır ve **Publish / Yayınla** düğmesine bas. Herhangi bir geniş açık test kuralı ekleme.

Kurallar giriş yapmış oyun oturumlarına ortak verileri kullanma izni verir. Bu küçük, güvenilen FRP grubu için basit bir oyun sistemidir. DM ekranının şifre koruması sunucu tarafında bir yönetici yetkisi değildir. Firebase yapılandırmasını bilen ve anonim giriş yapan biri teknik olarak ortak oyun verilerini değiştirebilir. Güvenilmeyen kalabalık bir topluluğa açmak istersen önce gerçek yönetici yetkileri eklenmelidir.

## 5. Bağlantıyı kontrol et

Siteyi yenile. Kenarda **Mod: Ortak (Firebase)** yazmalı. Firebase dolu ama yanlış yapılandırıldıysa hata gösterilir; uygulama sessizce yerel moda geçmez. Böylece oyuncular ortak sandıkları ayrı akışlara yazmazlar.

İlk karakterini kaydet. Bir paylaşım yap. Sonra farklı tarayıcıda veya gizli pencerede siteyi açıp ikinci bir karakter oluştur. İlk paylaşımın orada göründüğünü, beğeninin iki tarafta güncellendiğini kontrol et. Bu test tamamlanmadan oyunculara ortak kurulumun bittiğini söyleme.

`firebaseConfig` boşsa site **Mod: Yerel** gösterir. Bu yalnızca deneme ve yedek modudur: her tarayıcı kendi verisini tutar. Yerel paylaşımlar Firebase'e kendiliğinden taşınmaz. DM panelinden yedek alıp ortak modda içe aktarabilirsin; bu işlem aynı kimlikteki kayıtların üzerine yazar.

## 6. DM paneli ve Gemini

Adresin sonuna `#/dm` ekle veya sol menüden **Yönetim** seç. İlk kurulumda DM şifreni belirle. Bu bir oyun kilididir; tarayıcı kodunu inceleyen birine karşı gerçek bir güvenlik sınırı değildir.

Gemini API anahtarını paneldeki parola alanına yapıştır. `GoogleAIStudio_API_KEY.txt` içeriğini GitHub'a, `src/config.js` içine veya bir paylaşıma koyma. Anahtar yalnız girdiğin tarayıcıda saklanır; ortak Firebase ayarlarına gönderilmez. Diğer oyuncular anahtarı almaz. Anahtarı bulunan açık oturum veya bilgisayarındaki yerel üretici simülasyonu çalıştırır.

Model adını panelden değiştirebilirsin. Başlangıç modeli `gemini-3.7-flash`; kullanılabilirliği hesabının AI Studio ekranından kontrol et. Ücretsiz erişim ve kotalar zamanla değişebilir. [Resmî fiyatlandırma](https://ai.google.dev/gemini-api/docs/pricing) ve [aktif kota bilgisi](https://ai.google.dev/gemini-api/docs/rate-limits) esas alınır. Ücretsiz anahtar sınırsız kullanım anlamına gelmez.

Google Cloud Console > APIs & Services > Credentials bölümünden anahtarını seç. **API restrictions** ile Generative Language API'ye sınırla. **Application restrictions / Websites (HTTP referrers)** altında `https://vortexz-dev.github.io/*` ekle. Testte `http://localhost:5173/*` ekleyebilirsin. Kısıtlama sonrasında site üzerinden bir üretim denemesi yap. AI Studio hesabın destekliyorsa düşük kota ayarla; uygulama panelindeki günlük sınır buna ek bir oyun sınırıdır.

Başlangıç için 15 dakika aralık, günlük 10 API isteği ve 50 paylaşım uygundur. Bir üretimde en fazla 5 karakter kullanılır. Önce tek **Şimdi üret** denemesi yap. Kota veya cevap biçimi hatasında anında tekrar denenmez; panelde son durum görünür.

## 7. Simülasyonu durdurmak

DM panelindeki ana simülasyon anahtarını kapat. Oyun verisindeki ortak ayar anında güncellenir; açık oturumlar üretimi durdurur. Başlamış ağ isteği mümkünse iptal edilir; sağlayıcıya ulaşmış bir istek yine kota sayılabilir. Kapatıldıktan sonra tamamlanan çıktı kaydedilmez. Önceki gönderiler, yorumlar ve hafızalar silinmez.

Koddan acil kapatma için `src/config.js` içindeki `simulationAllowed` değerini `false` yapıp yeniden yayınla. Bu üst anahtar açık olsa bile DM panelindeki ortak ayar kapalıysa üretim yapılmaz. İleride bu sohbette 'simülasyonu kapat' dediğinde mevcut proje üzerinden bu anahtarı değiştirebiliriz. Önceden açılmış ve eski kodu çalıştıran bir sekme, yeni kodu sayfa yenilenene kadar almaz; anında ortak durdurma için DM anahtarını kullan.

Paylaşım ve cevap üretimi ayrı ayrı da kapatılabilir. Bütün sekmeler kapalıysa üretim çalışmaz. Bu sürümde sürekli çalışan ücretli bir sunucu veya otomatik zamanlayıcı yoktur.

## 8. Ücretsiz sınırları anlamak

Firestore Standard ücretsiz kotası bir veritabanı için 1 GiB depolama, günde 50.000 belge okuma, 20.000 yazma ve 20.000 silme; ayda 10 GiB dışarı veri aktarımıdır. Kotalar Pasifik gece yarısı çevresinde yenilenir. Spark üzerinde kota dolarsa işlemler durabilir; kart eklemediğin sürece kendiliğinden ücretli plana geçmezsin.

Site son paylaşımları sınırlı sayıda dinler; eski paylaşımlar **Daha fazla yükle** ile alınır. Küçük fotoğraflar kullan, gereksiz açık sekmeleri kapat. Firestore > Usage ekranını ara sıra kontrol et. Yedekler DM panelinden bilgisayarına JSON olarak indirilir; bu Firestore'un ücretli otomatik yedek hizmeti değildir.

Kaynak: [Firestore ücretsiz kota ve ücretlendirme](https://firebase.google.com/docs/firestore/pricing).

## 9. Sık karşılaşılan sorunlar

| Ekrandaki durum | Yapılacak işlem |
| --- | --- |
| Mod: Yerel | `src/config.js` boş. Firebase web uygulaması değerlerini ekle ve yeniden yayınla. |
| Yetki yetersiz / permission-denied | Anonim giriş açık mı, `firestore.rules` yayınlandı mı kontrol et. |
| operation-not-allowed | Authentication içinde Anonymous sağlayıcısını aç. |
| unauthorized-domain | Authentication yetkili alanlarına Pages alan adını ekle. |
| API anahtarı/model hatası | Gemini anahtarı ile Firebase apiKey alanını karıştırma; model erişimini ve referrer kısıtını kontrol et. |
| Kota doldu | Simülasyonu kapat, sağlayıcının kota yenilenmesini bekle. |
| Oyuncular farklı paylaşım görüyor | İki tarafta da Ortak modu ve aynı `projectId` kullanılmalı. |
| GitHub Pages 404 | Settings > Pages > Source: GitHub Actions seç; Actions çalışmasının tamamlanmasını bekle. |

## 10. Birlikte kurulum için gereken son bilgiler

Firebase projesini kendi Google hesabında oluşturman ve web yapılandırmasını `src/config.js` içine eklemen gerekir. Bu proje için şu anda bir Firebase hesabına bağlı yönetim aracı yok; boş yapılandırmayla gerçek ortak veritabanı oluşturulmuş sayılmaz. Yapılandırma tamamlandığında yukarıdaki iki tarayıcı testiyle ortak akışı doğrula.

