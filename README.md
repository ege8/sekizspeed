# SekizSpeed

puhutv videolarını hızlandırıp yavaşlatan + kesit (clip) indiren Chrome eklentisi.

## Özellikler

- ⏩ Video oynatma hızı kontrolü (hızlandır / yavaşlat)
- ✂️ Kesit indirme — videonun istediğin bölümünü WebM olarak indir
- 🎬 MediaRecorder ile tarayıcı içinde kayıt (sunucu yok, ek bağımlılık yok)

## Kurulum (geliştirici modu)

1. Chrome → `chrome://extensions`
2. Sağ üstte **Geliştirici modu**'nu aç
3. **Paketlenmemiş öğe yükle** → bu klasörü seç

## Dosyalar

- `manifest.json` — Manifest V3, puhutv.com host izni
- `content.js` — hız kontrolü + kesit indirme mantığı
- `style.css` — arayüz

## Not

- Kesit indirme `MediaRecorder` + `captureStream` ile yapılır, çıktı WebM formatındadır.
- Sadece `*.puhutv.com` üzerinde çalışır.
