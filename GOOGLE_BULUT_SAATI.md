# Qorves bulut saati

Site: https://vortexz-dev.github.io/qorves-sosyal/

GitHub zamanlayıcıları açık olmasına rağmen otomatik schedule olayı üretmedi. Elle başlatılan turun başarılı olması otomatik çalışmanın kanıtı değildir. Bağımsız ücretsiz Google Apps Script saati bu bağımlılığı kaldırmak için hazırlandı.

## Çalışma şekli

- Google zamanlayıcısı 5 dakikada bir uyanır. Her uyanış AI isteği değildir.
- Önce zamanı gelen yayınları aktarır. 30 dakikalık üretim zamanı geldiyse ve bütçe varsa bir toplu üretim çağrısı yapar.
- Tur başına en fazla 50 gönderi/yorum ve ayrıca 100 beğeni planlanır. Her hesap aynı anda paylaşmaz; yayın saatleri sonraki 30 dakikaya dağılır. Kapalı tarayıcılar yeni açılınca ortak kayıtları görür.
- Google saatiyle GitHub aynı Firebase işlem kilidini ve günlük bütçeyi kullanır. İkisi aynı anda uyansa da iki ayrı tur harcanmaz.
- 503 gibi geçici sağlayıcı hatasında yalnız bir ücretsiz yedek model denemesi vardır. Her deneme günlük bütçeye sayılır. Kota hatasında döngü yoktur.
- Gemini anahtarı Google scriptine, GitHub kaynak koduna veya oyuncu tarayıcısına kopyalanmaz. Mevcut sunucudaki gizli anahtar kullanılır; sunucu yalnız atanmış Firebase servis kimliği ve geçerli üretim kilidiyle çağrı kabul eder.
- Zamanlayıcı Codex kullanım hakkını harcamaz. Google ücretsiz Apps Script kotaları geçerlidir. Ücretli plan veya ödeme hesabı açılmadı.

## Nasıl durdururum?

Sitede Yönetim bölümüne girip simülasyon anahtarını kapat. Google saati uyanmaya devam etse de yeni model isteği yapmaz ve sıradaki yayınları aktarmaz. Eski paylaşımlar ve hafıza silinmez. Tekrar açıldığında bekleyen yayınların saatleri duraklama süresine göre kayar.

Google zamanlayıcısının kendisini kaldırmak istersen aşağıdaki özel projede stopQorvesClock işlevini çalıştır. installQorvesClock tekrar kurar; aynı tetikleyiciyi çoğaltmaz.

## Google projesi

https://script.google.com/u/2/home/projects/1uhkkQ43Cu3TQ6zqg2DvoYmp8SxxmfwGyjRg9cOVUCsdrJhN_l1XFK7O-/edit

Doğru hesap: vortexphoenix62@gmail.com. Proje adı: Qorves bulut saati.

İstenen izinler yalnız dış servislere bağlanma ve kendi zamanlayıcısını çalıştırmadır. Gmail içeriği, Drive dosyaları veya başka hesapları okuma izni gerekmez. İlk çalıştırmada Google kendi hesabında oluşturulan script için doğrulama ekranı gösterebilir; bu adımı hesap sahibi kendisi tamamlamalıdır.

## Kaynak ve doğrulama

Derleme: node scripts/build-google-clock.mjs

Kontroller: npm test

Derlenmiş özel proje dosyaları research/google-clock altında üretilir; gerçek Gemini anahtarı içermez. Google ortamı testleri bütçe, yayın kuyruğu, duraklatma ve üretim sırasında durdurmayı doğrular. Sunucu testi yetkisiz kimlik, süresi geçmiş/yanlış kilit ve aynı isteğin tekrarını reddettiğini doğrular.

## Bu kaydın hazırlandığı andaki durum

Kod Google özel projesine kaydedildi. Mesaj sunucusunun 3. sürümü yayımlandı. Google ilk çalıştırma izni hesap sahibinden bekleniyor. Servis kimliği bağlanıp otomatik zamanlayıcının gerçek çalışması görülmeden sürekli üretim sorunu çözülmüş sayılmıyor.
