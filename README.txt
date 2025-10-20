
Grand Filo Fatura Panel v3
--------------------------
Tam otomatik, çift tıkla çalışan fatura paneli (yerel kullanım).

Nasıl çalıştırılır (Windows):
1) ZIP içeriğini bir klasöre çıkar.
2) Çift tıkla "ÇALIŞTIR.bat". (Windows otomatik olarak npm install çalıştırır, tarayıcı açar ve sunucuyu başlatır)
3) Tarayıcıda açılır: http://localhost:3000
   Kullanıcı: grand
   Şifre: test
4) Yeni fatura oluştur, listele, göster, yazdır.
5) Yedekleme: sunucu her 12 saatte bir otomatik yedek alır (backups/ klasörü). Ayrıca elle yedek almak için "Yedek İndir" butonunu kullan.

Notlar:
- Bu uygulama resmi e-fatura değildir. Sadece kayıt/görsel amaçlıdır.
- Veriler local/invoices.db içinde saklanır.
- Eğer Windows dışı bir sistemde kullanacaksanız terminalde klasöre gidip "npm install" ardından "npm start" çalıştır.

Destek: Herhangi bir hata olursa bana söyle; dosyaları elle düzenleyebilirsin (public/style.css, public/index.html gibi).
