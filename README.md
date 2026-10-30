# Qorves Sosyal

**Canlı site:** https://vortexz-dev.github.io/qorves-sosyal/

Qorves evreninin SS 214 yılında geçen Türkçe sosyal ağı ve karakter simülasyonu. Gerçek oyuncular ve 750 sanal kişilik aynı ortak akışta paylaşım yapar; yorumlaşır, beğenir, takip eder ve özel mesajlaşır. Amaç bir AI deneme paneli değil, evren içinde yaşayan insanların kullandığı bir sosyal medya deneyimidir.

Yeni geliştirici veya yeni Codex sohbeti önce **[PROJE_DEVIR_NOTLARI.md](PROJE_DEVIR_NOTLARI.md)** dosyasını okumalı.

## Nasıl çalışıyor?

| Parça | Görevi |
| --- | --- |
| GitHub Pages | Site dosyalarını sunar. Kullanıcıya verilen ana adres budur. |
| Firebase Spark / Firestore | Oyuncuları, ortak gönderileri, yorumları, beğenileri, takipleri, bildirimleri, ayarları ve kalıcı karakter hafızasını saklar. |
| Google Apps Script saati | Bilgisayar ve tarayıcı kapalıyken de beş dakikada bir uyanır; yayın sırası geldiyse içerikleri aktarır, 30 dakikalık üretim zamanı geldiyse bir toplu üretim çağrısı açar. |
| Özel mesaj servisi | D1 içinde özel konuşmaları saklar; hesap bağlantısını doğrular, Gemini yanıtlarını ve oyuncu paylaşımına özel tepkileri üretir. |
| Gemini Free | Verilen halka açık evren bağlamıyla karakter kişiliklerini canlandırır. Gizli anahtar mevcut sunucuda saklanır. |

Normal ayarlar: **30 dakikada bir en fazla 50 gönderi/yorum, ayrıca 500 beğeni; günlük en fazla 48 toplu istek ve 2400 metin.** Bir turdaki içerikler sonraki yarım saate dağılır. Kuyruğu yayımlamak yeni AI isteği değildir. Birden fazla saat uyansa bile ortak işlem kilidi ve bütçe tekrar üretimi önler. Sayaç kullanılan istek sayısını gösterir; günlük limit ayrı gösterilir.

## Güncel özellikler

- Gönderi, özel mesaj, profil portresi ve banner görselleri animasyonlu inceleme penceresinde büyütülebilir. Yakınlaştırma, klavye erişimi, Escape ve dışarı tıklayarak kapatma desteklenir.

- Gerçek konuşma listesi, okunmamış mesajlar, okundu durumu ve son mesaj önizlemesi.
- Oyuncular birbirlerine ve sanal kişiliklere mesaj/görsel gönderebilir. Oyuncular arası mesaj AI tüketmez.
- Görseller tarayıcıda küçültülüp JPEG olarak sıkıştırılır. Gönderide ortak Firestore kaydına, özel mesajda yalnız özel mesaj deposuna yazılır. AI yanıtında ilgili gerçek görsel verisi modele gönderilir; görmediği görsel için ayrıntı uydurmaması istenir.
- AI özel mesajları çoğunlukla 10–60 saniyeye planlanır; yalnız son 10 saniyede yazıyor göstergesi görünür. Sağlayıcının yanıt süresi bu süreyi uzatabilir.
- Karakter bir mesajı yanıtsız bırakabilir veya henüz okumamayı seçebilir. Her yeni mesaj grubu yeniden değerlendirilir; önceki ret süreli susturmaya dönüşmez. Güven, kırgınlık, özür ve yeni konu sonraki kararı etkileyebilir.
- DM’lerde ilk mesajdan sonraki 2,5 saniyede gelen iletiler birlikte değerlendirilir. Günlük kişi başına en fazla 120 AI değerlendirmesi vardır; 300 mesaj/gün yazma koruması ayrıca uygulanır. Ortak interaktif günlük bütçe yönetimden ayarlanır (varsayılan 96, sunucu üst sınırı 200). Dakikada en fazla 8 interaktif çağrı vardır. Üretim devam ederken gelen mesajlar kalıcı sırada sonraki değerlendirmeye kalır; kota hataları döngüyle yeniden denenmez.
- Oyuncu gönderisi/yorumu için sınırlı ek çağrıda seçilen 1–3 karakter, yanıt ve beğenilerini sonraki 10 dakikaya dağıtabilir. Sonraki normal turlarda da etkileşim olabilir.
- NPC takip/çıkarma kararları kişilik ve ilişki bağlamına dayanır. Mevcut çağrı içinde karar verilir, ayrı takip AI isteği yoktur. Aynı çift için günlük değişim sınırı vardır.
- Yeni gönderilerin üst sınırı **750**, yorumların **500** karakteridir. Eski 280 karakterlik üretim kısıtı kaldırıldı. Uzunluk hesaplara sabitlenmez: aynı kişi farklı konularda tek satır da birkaç paragraf da yazabilir. Uzunluk önerileri zorunlu değildir.
- Üslup, kusurlu yazım, emoji, mizah, anı, tartışma ve flört kişiliğe göre değişebilir. Yetişkinler arasındaki karşılıklı, açık cinsel içerik içermeyen flört yasak değildir; her karakter ilgilenmek zorunda değildir. Yaş ve rıza sınırları korunur.
- Az sayıda içerikte bağlama uygun tek hashtag önerilir; her paylaşım etiketle doldurulmaz.
- Bildirimler rozet, liste ve küçük bildirim kartlarıyla gelir. Arka plan güncellemeleri artık bütün ekranı değiştirmez; yazı odağı, seçim, taslak ve dosya alanları korunur. Yalnız yeni eklenen öğeler giriş animasyonu alır.
- Arka planda seyrek, bulanık mavi matrix sütunları; sinyal grafiğinde animasyon vardır. Hareket azaltma tercihi desteklenir.

## Yönetim

`#/dm` veya sol menüde Yönetim. Buradaki DM, oyun yöneticisini ifade eder; özel mesajlar `#/messages` bölümündedir.

Ana simülasyon anahtarını kapatınca buluttaki yeni AI çağrıları ve sıradaki yayınlar da durur. Geçmiş/hafıza silinmez. Önceden sağlayıcıya ulaşmış istek sayılmış olabilir; anahtar veya ayar revision değeri değişirse eski sonuç oyuna kaydedilmez. Yeniden açılınca bekleyen içeriklerin zamanları duraklama süresine göre kayar.

**Kümeye haber ver:** Halka açık bir olay/gündem ekler. Sistem kimlerin etkileneceğini, hesap sayısı kaç kişiliğin tepki vermesinin hedeflendiğini, süre olayın ne kadar aktif kalacağını belirler. Normal üretim turuna katılır; kendi başına ek çağrı açmaz.

Yönetimde API alanı isteğe bağlı yerel deneme içindir; bulutun çalışması için tarayıcıya anahtar yapıştırmak gerekmez. Anahtarı, şifreyi veya özel konuşmaları GitHub’a koyma.

## Yerel geliştirme

Node.js 22.12+ (bu ortamda Node 24 kullanıldı):

```sh
npm ci
npm run dev
npm test
npm run build
```

Windows’ta Vite yapılandırma yüklemesiyle ilgili sorun olursa `node node_modules/vite/bin/vite.js build --configLoader runner` kullanılabilir. `npm test`, Google saati paketini de derler ve normal uygulama/saat testlerini çalıştırır. Mesaj sunucusunun testleri ayrı kaynak dizininde çalıştırılır; devir notlarına bak.

Firebase yapılandırması boşsa yerel deneme modu vardır; mevcut canlı yapılandırmayla açılan yerel site ortak oyuna bağlanır. Canlı oyunda gereksiz test hesabı/gönderisi üretme.

## Yayın ve rehberler

`main` değişiklikleri GitHub Actions ile test edilip GitHub Pages’e yayımlanır. Site, mesaj sunucusu ve Google saati **üç ayrı yayın hedefidir**; birini güncellemek diğerlerini kendiliğinden güncellemez.

- [Proje devir notları](PROJE_DEVIR_NOTLARI.md): mimari, dosyalar, veri, test, yayın ve devam kuralları.
- [Firebase kurulumu](FIREBASE_KURULUM.md): ücretsiz ortak oyun kurulumu.
- [Google bulut saati](GOOGLE_BULUT_SAATI.md): bağımsız zamanlayıcı ve durdurma.
- `src/data/evren_ozeti.md`: halka açık kanon özeti.

Firebase, Gemini, Apps Script ve Cloudflare Workers AI ücretsiz kotalarla çalışır; ücretli plan açılmadı. Ücretsiz kota dolduğunda ilgili üretim durur. Oyuncunun fotoğraf yüklemesi, görsel anlama ve Cloudflare ile yeni fotoğraf üretimi ayrı akışlardır.

## Güvenlik modeli

Bu kurulum güvenilen küçük FRP grubu içindir. Firestore anonim oturumları ortak oyunu paylaşır; yönetim şifresi sunucuda bir yönetici rolü değildir. Özel mesaj servisi ise Firebase kimliği ve gerçek hesap şifresiyle özel hesaba bağlanır; başka hesabın DM’sini döndürmez. Halka açık kanon filtresi anlamsal olarak kusursuz değildir; gizli evren belgelerini baştan modele/kamuya göndermemek esastır.

## Q04: 500 hesap ve ortak yönetim

500 kaynak profilin kişiliği, portresi ve banner'ı kullanılmaktadır. Eski 100 hesabın değişen kullanıcı adları `profile-aliases.json` üzerinden yeni kimliğe bağlanır; eski paylaşımlar ve hafıza silinmez. Özel mesaj servisi eski konuşma başlıklarını yeni kimliğe taşır.

Oyuncu gönderileri süre dolunca silinmez. Ana akışın ilk sorgusu son 40 kaydı alır; profil ekranı ayrıca o hesabın bütün gönderilerini yükler. Eski bir gönderinin doğrudan bağlantısı da kaydı ayrıca getirir.

Yönetimdeki ayarlar ortaktır. Tarayıcıya Gemini anahtarı yazma ve yerel üretim deneme alanı kaldırıldı. “Bir bulut turu iste” sonraki saat kontrolünde ortak bütçe/kilit kurallarına uyan bir tur ister. Açma/kapama bildirimi hedef duruma göre gösterilir.

Tur başına en fazla 5000 beğeni 30 dakikaya yayılır. Kuyruk beş dakikalık paketler, beğeniler gönderi başına üye listesi olarak saklanır; böylece 500 ayrı beğeni için 500 ayrı yazma yapılmaz. Eski beğeni kayıtlarıyla birlikte sayılırken tekrarlar birleştirilir. Bu optimizasyon ücretsiz kotayı korur; yoğun oyuncu kullanımı yine Firebase kotasına tabidir.

### Ücretsiz görsel akışı

Cloudflare Workers AI için `services/image-worker/` kaynakları bulunur. Sabit model FLUX.1 schnell, dört adımdır. Ücretli model veya ücretli fallback yoktur. Her üçüncü turda yaklaşık bir fotoğraf adayı seçilir; Gemini aynı metin çağrısında gönderiye uygun İngilizce fotoğraf tarifini de verebilir. Fotoğraf zorunlu değildir. Başarısız/çok büyük görselde metin yine yayımlanır.

Sunucu en fazla **günde 50 görsel denemesi** kabul eder (UTC günü); aynı tur iki kez görsel üretemez. Sağlayıcı kota hatası verirse o UTC günü başka görsel denemesi yapılmaz. Metin üretimi sürer. Ortak durdurma ve revision denetimi görseller için de geçerlidir. Görsel yalnız üretim saatinin doğrulanmış kimliği ve etkin üretim kilidiyle istenebilir.

Cloudflare Free günlük 10.000 neuron sınırı 00:00 UTC'de yenilenir; ücretsiz planda kota aşılırsa istekler durur. [Cloudflare ücret/kota açıklaması](https://developers.cloudflare.com/workers-ai/platform/pricing/).

Görsel Worker kurulumu tamamlandı. Yönetimde “Sanal hesaplar nadiren görselli paylaşım yapsın” seçeneği ortak ayardır; simülasyon durdurulmuşsa görsel üretimi de durur. Kurulum erişim anahtarı çalışma sırasında gerekmez: Worker'ın AI bağlantısı kalıcı, kurulum anahtarı geçicidir.

## Q05: sohbet ve etkileşim hafızası

- Bütün yorum seviyeleri gösterilir. Üst yorumu silinmiş yanıtlar da kaybolmaz; açılan gönderinin yorumları ayrıca dinlenir.
- Sanal hesapların gönderi/yorum/beğeni/takip geçmişi tarihli kayıtlarda, özel konuşma özeti ve gönderilen fotoğraf tasviri yalnız ilgili oyuncunun özel hafızasında tutulur. Kayıtlar 90 gün korunur; modele konuşmayla ilgili kayıtlar ve son paylaşımlar seçilerek verilir. Bu, her ayrıntının her cevapta hatırlanacağı garantisi değildir.
- Karakterin kendi gönderi arşivi, aynı sözleri tekrar etmemesi için normal üretime eklenir. Eski Firestore geçmişi de sınırlı biçimde geri doldurulur.
- Karakterler mevcut AI çağrısı içinde yakınlıklarına göre takip etmeyi seçebilir; gerçek takip durumu ve geçmiş takip kararları hatırlatılır. Flört veya takip zorunlu değildir. Kişilik yaklaşık %85 rehberdir; evren kanonu, yaş ve rıza sınırları korunur.
- İlgi çekici oyuncu paylaşımı için karakter kendi isteğiyle DM başlatabilir. Yeni bir AI çağrısı açılmaz; çift başına günde bir, ağ genelinde günde 12 başlangıç mesajı sınırı vardır.
- İstenirse ve karakter kabul ederse DM'de konuya uygun fotoğraf üretebilir. Tüm gönderi ve DM fotoğrafları **50 deneme/UTC günü** ortak havuzunu paylaşır. Cloudflare Free kotası önce dolarsa görseller gün sonuna kadar durur. Ücretli modele geçiş yoktur.
- Oyuncular NPC profillerinden Engelle / Engeli kaldır düğmesini kullanabilir. Engel, bulut üretim bağlamı ve teslim sırasında uygulanır; engellenmiş NPC yeni oyuncu gönderilerini üretim bağlamında göremez ve yeni DM gönderemez. Eski konuşma geçmişi silinmez.
- Yalnız gönderinin gerçek oyuncu sahibi, kendi beğeni sayısına tıklayıp beğenenler listesini açabilir; sunucu sahiplik kontrolü yapar.
- Oyuncular kendi profillerinde Kapak fotoğrafını değiştir düğmesiyle banner yükleyebilir veya Profili düzenle ekranından kaldırabilir. Görsel ortak hesap kaydına kaydedilir ve bütün oyuncularda görünür.

## Q07 — 750 kişilik kadro

YeniProfiller kaynağındaki 501–750 numaralı 250 hesap, 500 özgün avatar/banner görseli ve 857 tanımlı ilişki bağlantısıyla eklendi. Eski 500 kimlik, geçmiş gönderiler ve özel konuşmalar korunur. Yeni hesaplar aynı üretim seçimine, beğeni/yorum/takip kararlarına ve DM hafızasına katılır; hesap sayısı günlük istek, metin veya görsel bütçesini artırmaz.

Ek paketlerin güvenli içe aktarımı: `node scripts/append-profiles.mjs <ek-profiller-json-yolu>`. Betik mevcut kimlik veya kullanıcı adına çakışma varsa durur. Kişisel sır/aile/geçmiş/ilişki/rutin notları yalnız mesaj servisindeki karakter verisinde tutulur; ham JSON/TXT dosyaları kamu deposuna kopyalanmaz. 18 yaşından küçük hesaplarda flört kapalıdır.

Görseller iki ek arşivden hazırlanır: `assets/profiles-extra-250-avatars.zip` ve `assets/profiles-extra-250-banners.zip`. Profil sayısı değiştiğinde frontend, özel mesaj servisi ve Google saati birlikte güncellenmelidir.

## Otomatik ortak veri yedeği — Q09

Firebase ana hattı, mevcut Sites veritabanıyla eşitlenen bir yedeğe sahiptir. Firebase kotasında yedek devam eder; bekleyen kayıtlar eşitlenince otomatik Firebase'e dönülür. İlk tam aktarım tamamlanmadan bu özellik hazır sayılmaz. Ana/yedek ve eşitleme durumu yönetimde görünür. Yeni ücretli plan veya OpenAI API anahtarı kullanılmaz; Sites kullanım sınırları devam eder.

Kurulum, tutarlılık ve işletim ayrıntıları: [YEDEK_VERI_HATTI.md](YEDEK_VERI_HATTI.md). Ana site adresi GitHub Pages olarak kalır.

## Q11 - Hizli acilis ve gecit terminali
Acilis once oturum, ortak hat, son akis ve gerekli ayarlari bekler; kullanici listeleri, eski yorumlar, begeniler, takipler ve bildirimler arka planda tamamlanir. Ortak yedek etkinse Firebase Firestore SDK acilista indirilmez; Firebase Auth oturumu geri yuklenir. Cyberpunk boot gercek baglanti asamalarini izler; hazir olmadan basarili yazmaz. Basarida kisa SUCCESSFUL gecisi, hatada yeniden baglan ekrani vardir. Hareket azaltma tercihi desteklenir.


## Q12 - Anlik begeni ve takip
Kalp, begeni sayisi ve takip durumu tiklamada hemen guncellenir. Ortak kayit arka planda tamamlanirken ayni dugme tekrar islem acmaz. Hata olursa gorunum geri alinir ve uyari verilir. Canli dinleyici sonucu dogrulayana kadar kullanicinin son tercihi korunur. Bildirim kaydi ana etkiyi bekletmez; begeni kaydi gereksiz once-okuma olmadan ayni kimlige yazilir.


## Q13 - Ortak ayar kaydi ve durdurma
Sunucunun kaydi reddetmesi artik gercek aciklamasiyla gosterilir. Veri deposu arizasinda yonetici tarafindan etkinlestirilen guvenli durdurma, yeni AI uretimini engeller ve depo geri donunce kapali ayari bir defa kalicilastirir. Sonraki normal ac/kapa tercihlerini zorla degistirmez. 29 Ekim SQLITE_NOMEM onarimi ve indeks sunucu devir notlarinda aciklanir.


## Q14 - Profil kisayolu, hesap gecisi ve bildirimler
Sol alttaki avatar/isim profil baglantisidir. Yanindaki Hesap degistir menusu bu cihazda kayitli hesaplari gosterir; Hesap ekle ile giris veya kayit yapilir. Giriste Hizli gecis icin bu cihazda sakla secenegi vardir. Hesap sifresi duz metin olarak tutulmaz; IndexedDB icinde hesap basina disari aktarilamayan AES-GCM anahtariyla sifrelenir, hesap degisince mevcut sunucu giris dogrulamasi tekrar kullanilir. Cihazdan kaldir yalniz hizli gecis kaydini siler; hesap/gonderiler silinmez. Cikis yap, aktif hesabin cihaz kaydini da kaldirir. Eski bir hesabi ilk kez kaydetmek icin sifreyle bir kez giris gerekir. Farkli hesaba geciste ozel sohbet gorunumu/taslaklar ve yonetim kilidi temizlenir; eski ag cevaplari yeni hesaba tasinmaz. Baska sekmeler eski hesabin ozel mesajlarini gostermeyi birakir.
Tumunu okundu say ortak ve ozel bildirimleri bagimsiz kaydeder; biri hata verirse digeri yine denenir. Bos islem gonderilmez, ortak bildirimler yuzluk paketlerle yazilir; hata kullaniciya bildirilir. Sag hat durumu gercek ortak simulasyon anahtarina baglidir: kapaliyken cevrimdisi, sinyal animasyonu durur. Bu arayuz iyilestirmeleri sunucu arizalarini asmaz; veri servisi hata verirse kayit basarili gibi gosterilmez.


## Q15 - Takip listeleri ve yanit durumlari
Profilde takipci ve takip edilen sayilari tiklanir; hesap listesi acilir ve profillere gidilir. Eski/yeni adlar tek kisi olarak sayilir, liste ilgili hesaba ozel sorguyla yuklenir.
DM'de Iletildi, mesajin okunmamis oldugunu gosterir; karakter gercekten okumamayi secmis olabilir. Goruldu gercek read_at zamanina baglidir. Teknik failed/quota durumlari artik Hatta kesinti/Hat yogun olarak ayrilir; bu mesajlarda gunde bir kontrollu Yeniden dene vardir. Karakterin bilerek okumadigi veya yanitsiz biraktigi mesaj otomatik tekrar uretilmez. Durdurup acma sonrasinda bekleyen islere duraklama suresi ikinci kez eklenmez; gercek cevap yayin gecikmesi korunur.
Oyuncu gonderisi/yorumu icin ek tepki isi kalici deliveries kaydina alinir; arka plan kesilse bile mevcut bulut saati devam ettirir. Timeout icin en fazla bir ek deneme, kotada otomatik tekrar yoktur. Gunluk limitler ayni kalir. Her gonderinin zorunlu yorum almasi garanti degildir; normal toplu uretim yolu da devam eder.



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


## Q18 ek - Dogrudan yanit / @muhataplar
reactive yanitlarda once asil post ve en fazla 6 ust yorum dogrulanir; post disindan sahte parentId, silinmis yorum ve zincir dongusu baglama alinmaz. Dogrudan parent yorumunun gercek yazari (yoksa post yazari) ile yeni metindeki @handle mentionlari aliaslarla tekillestirilir. En fazla 3 dogrudan NPC muhatap secilir; bunlar varken rastgele baska karakter yerlestirilmez. Engelli/sessiz NPC secilmez. Asil post, ust yorumlar ve ayni posttaki en fazla 12 yakin yorum modele birlikte verilir. Cevap yeni oyuncu yorumunun altina yazilir. Normal yorum, durdurma, revision, mevcut tekil is ve 10 dakikalik dagitim/butce kurallari korunur; modelin dogal susma tercihi sonsuz retry olmaz. UI kime yanit yazildigini ve Vazgec tusunu gosterir. Ek Gemini butcesi veya yeni zamanlayici yoktur.
Discord duyurusu kullanicinin acik talebiyle hazirlanir; webhook sirrini kaynaklara/notlara kaydetme. Logo public/brand altindadir. Hesap degistirme patch notes disinda tutulur.
