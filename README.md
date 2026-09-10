# SekizSpeed

puhutv videolarını hızlandırıp yavaşlatan + kesit (clip) indiren Chrome eklentisi.

## Özellikler

- ⏩ Video oynatma hızı kontrolü (hızlandır / yavaşlat)
- ✂️ Kesit indirme — videonun istediğin bölümünü MP4 olarak indir
- 🎬 ffmpeg.wasm ile tarayıcı içinde birleştirme (sunucu yok)

## Kurulum (geliştirici modu)

1. Chrome → `chrome://extensions`
2. Sağ üstte **Geliştirici modu**'nu aç
3. **Paketlenmemiş öğe yükle** → bu klasörü seç

## Dosyalar

- `manifest.json` — Manifest V3, puhutv.com host izni
- `content.js` — hız kontrolü + kesit indirme mantığı
- `style.css` — arayüz

## Not

- ffmpeg.wasm (~31MB) worker'da tembel yüklenir (sadece indirme butonuna basınca), UI'ı kırmamak için.
- Sadece `*.puhutv.com` üzerinde çalışır.
