/* SekizSpeed - puhutv oynaticisini hizlandir/yavaslat + kesit indir (ekran kaydi) */
(() => {
  const RATES = [0.5, 0.75, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5, 1.75, 2, 2.5, 3, 4, 6, 8];
  const uid = "sekizspeed-box";
  if (document.getElementById(uid)) return;

  let rate = 1;
  let box = null;
  let rateLabel = null;

  function getVideo() {
    return (
      document.querySelector("video") ||
      document.getElementById("dyg-player-new-player_html5_api")
    );
  }
  function apply() {
    const v = getVideo();
    if (v) v.playbackRate = rate;
    if (rateLabel) rateLabel.textContent = rate + "x";
  }
  function setRate(r) {
    rate = Math.min(8, Math.max(0.5, r));
    apply();
    try { chrome.storage.local.set({ sekizspeedRate: rate }); } catch (e) {}
  }

  // ---------- Kesit indir (ekran kaydi) ----------
  function parseTime(s) {
    s = (s || "").trim();
    if (!s) return null;
    if (s.includes(":")) {
      const p = s.split(":").map(Number);
      if (p.some(isNaN)) return null;
      if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
      return p[0] * 60 + p[1];
    }
    const n = Number(s);
    return isNaN(n) ? null : n;
  }
  function fmt(t) {
    t = Math.floor(t);
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0");
  }

  function buildRecPanel() {
    const rec = document.createElement("div");
    rec.id = "sekizspeed-rec";

    const start = document.createElement("input");
    start.placeholder = "0:00"; start.value = "0:00";
    const end = document.createElement("input");
    end.placeholder = "0:30"; end.value = "0:30";
    const btn = document.createElement("button");
    btn.textContent = "Kes ve İndir";
    const status = document.createElement("div");
    status.id = "sekizspeed-status";

    btn.addEventListener("click", async () => {
      const v = getVideo();
      if (!v) { status.textContent = "Video bulunamadı"; return; }
      const s = parseTime(start.value), e = parseTime(end.value);
      if (s == null || e == null) { status.textContent = "Süreleri girin (örn. 1:30)"; return; }
      if (e <= s) { status.textContent = "Bitiş, baştan büyük olmalı"; return; }
      if (e > (v.duration || Infinity)) { status.textContent = "Bitiş, video süresini aşıyor"; return; }

      status.textContent = "Kayıt başlıyor…";
      btn.disabled = true;
      try { await startRecording(v, status); }
      catch (err) { status.textContent = "Hata: " + err.message; }
      btn.disabled = false;
    });

    start.addEventListener("input", () => status.textContent = "");
    end.addEventListener("input", () => status.textContent = "");
    rec.append(start, label("ile"), end, btn, status);
    return rec;
  }
  function label(t) { const l = document.createElement("label"); l.textContent = t; return l; }

  function startRecording(v, status) {
    return new Promise((resolve, reject) => {
      if (!document.pictureInPictureEnabled) { /* yine de dene */ }
      if (!(v.captureStream || v.mozCaptureStream)) {
        return reject(new Error("Bu tarayıcı kesit kaydı desteklemiyor — Chrome kullan"));
      }

      const stream = (v.captureStream || v.mozCaptureStream).call(v);
      const chunks = [];
      let rec;
      try {
        rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
      } catch (e) {
        try { rec = new MediaRecorder(stream, { mimeType: "video/webm" }); }
        catch (e2) { return reject(new Error("MediaRecorder başlatılamadı")); }
      }

      rec.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
      rec.onstop = debounce(() => {
        const blob = new Blob(chunks, { type: "video/webm" });
        downloadBlob(blob);
        status.textContent = "Kesit indirildi ✓";
      }, 100);

      const onError = () => { try { rec.stop(); } catch (e) {} reject(new Error("kayıt başlatılamadı")); };

      // Oynatmayı başlat ve seek et
      v.play().catch(() => {});
      v.addEventListener("seeked", () => {
        v.removeEventListener("seeked", onSeeked);
        setTimeout(() => {
          try { rec.start(); } catch (e) { onError(); return; }
          status.textContent = "Kaydediliyor " + fmt(stateStart) + " → " + fmt(stateEnd) + " …";
        }, 150);
      }, { once: true });
      const onSeeked = () => {};

      let stateStart = parseTime(document.getElementById("sekizspeed-rec").querySelector("input").value) || 0;
      let stateEnd = parseTime(document.getElementById("sekizspeed-rec").querySelectorAll("input")[1].value) || 30;

      try { v.currentTime = stateStart; } catch (e) { onError(); return; }

      const timer = setInterval(() => {
        if (rec && rec.state === "inactive") { clearInterval(timer); return; }
        if (v.currentTime >= stateEnd) {
          clearInterval(timer);
          try { rec.stop(); } catch (e) {}
        }
      }, 50);

      setTimeout(() => {
        clearInterval(timer);
        if (rec && rec.state !== "inactive") { try { rec.stop(); } catch (e) {} }
      }, (stateEnd - stateStart) * 1200 + 5000);

      resolve();
    });
  }
  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  function downloadBlob(blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sekizspeed-kesit.webm";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function buildUI() {
    box = document.createElement("div");
    box.id = uid;

    const minus = document.createElement("button");
    minus.textContent = "−"; minus.title = "Yavaslat";
    const plus = document.createElement("button");
    plus.textContent = "+"; plus.title = "Hizlandir";
    const reset = document.createElement("button");
    reset.className = "sec-reset"; reset.textContent = "1x"; reset.title = "Normal hiz";
    const clip = document.createElement("button");
    clip.className = "sec-reset"; clip.textContent = "✂ Kesit"; clip.title = "Kesit indir";
    rateLabel = document.createElement("span");
    rateLabel.id = "sekizspeed-rate";

    minus.addEventListener("click", () => {
      const cur = RATES.reduce((best, r) => r < rate && (best === null || r > best) ? r : best, null);
      setRate(cur !== null ? cur : rate);
    });
    plus.addEventListener("click", () => {
      const cur = RATES.reduce((best, r) => r > rate && r <= 8 && (best === null || r < best) ? r : best, null);
      setRate(cur !== null ? cur : rate);
    });
    reset.addEventListener("click", () => setRate(1));

    const panel = buildRecPanel();
    clip.addEventListener("click", () => {
      const p = document.getElementById("sekizspeed-rec");
      p.style.display = p.style.display === "none" ? "block" : "none";
    });

    box.append(minus, rateLabel, plus, reset, clip, panel);
    document.body.appendChild(box);
    apply();
  }

  // Yeni video/yeni sayfa gecislerinde uygula (mutlaka UI'yi engellemeyen observer)
  new MutationObserver(() => {
    const v = getVideo();
    if (v && v.playbackRate !== rate) apply();
  }).observe(document.body, { childList: true, subtree: true });

  const v = getVideo();
  if (v) {
    ["loadedmetadata", "playing", "ratechange"].forEach((ev) =>
      v.addEventListener(ev, () => { if (v.playbackRate !== rate) apply(); })
    );
  }

  chrome.storage.local.get("sekizspeedRate", (res) => {
    if (res.sekizspeedRate) rate = res.sekizspeedRate;
    buildUI();
  });
})();
