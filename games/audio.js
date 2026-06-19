// 音效：用 Web Audio API 即時合成，零外部音檔、無授權問題。
// 瀏覽器規定需先有使用者互動才能發聲 → 首次 pointerdown/keydown 時呼叫 unlock()。
let ctx = null, master = null, muted = false;
const VOL = 0.9; // 主音量
try { muted = localStorage.getItem('ssd-village-mute') === '1'; } catch (e) { /* ignore */ }

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOL;
    // 壓縮/限幅器：把音量推大又不破音
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 6; comp.ratio.value = 10; comp.attack.value = 0.003; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    // iOS 解鎖：播一個極短的靜音 buffer 喚醒音訊
    try { const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(ctx.destination); s.start(0); } catch (e) { /* ignore */ }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function envGain(t0, dur, peak, attack = 0.005) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
}

function tone({ freq = 440, type = 'sine', dur = 0.15, peak = 0.3, slideTo = null, at = 0 }) {
  if (!ensure()) return;
  const t0 = ctx.currentTime + at;
  const o = ctx.createOscillator();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  const g = envGain(t0, dur, peak);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + dur + 0.03);
}

function noise({ dur = 0.2, peak = 0.3, type = 'lowpass', freq = 1000, at = 0 }) {
  if (!ensure()) return;
  const t0 = ctx.currentTime + at;
  const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = envGain(t0, dur, peak);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

// ── 環境音景：依機率排程極短、極低音量的音粒；全部走 master（自動受靜音控制）。由主迴圈每幀呼叫 ──
let birdTimer = 2, cricketTimer = 1.5;
function birdChirp() { // 兩三聲快速上揚的小鳥啁啾
  const base = 1700 + Math.random() * 1500, n = 2 + ((Math.random() * 2) | 0);
  for (let i = 0; i < n; i++) { const f = base * (1 + i * 0.1); tone({ freq: f, type: 'triangle', dur: 0.06 + Math.random() * 0.05, peak: 0.05, slideTo: f * (1.25 + Math.random() * 0.4), at: i * 0.09 }); }
}
function cricket() { // 蟋蟀：高頻顫音（數個極短脈衝）
  const f = 4200 + Math.random() * 700;
  for (let i = 0; i < 5; i++) tone({ freq: f, type: 'square', dur: 0.012, peak: 0.02, at: i * 0.03 });
}

export const SFX = {
  unlock() { ensure(); },
  isMuted() { return muted; },
  toggle() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : VOL;
    try { localStorage.setItem('ssd-village-mute', muted ? '1' : '0'); } catch (e) { /* ignore */ }
    return muted;
  },
  // 環境音景：白天稀疏鳥鳴、夜晚蟋蟀（vibrancy 0=夜→1=日）。靜音或音訊尚未解鎖則完全不排程。
  ambient(dt, vibrancy = 0) {
    if (muted || !ctx) return;
    const day = vibrancy > 0.55;
    birdTimer -= dt; cricketTimer -= dt;
    if (birdTimer <= 0) { birdTimer = day ? 2.2 + Math.random() * 4 : 8 + Math.random() * 8; if (day) birdChirp(); }
    if (cricketTimer <= 0) { cricketTimer = day ? 9 + Math.random() * 9 : 1.0 + Math.random() * 2.0; if (!day) cricket(); }
  },

  // 探索
  step() { noise({ dur: 0.09, peak: 0.12 + Math.random() * 0.03, type: 'lowpass', freq: 320 + Math.random() * 120 }); },
  jump() { tone({ freq: 300, type: 'sine', dur: 0.16, peak: 0.3, slideTo: 620 }); }, // 起跳「hop」
  discover() { tone({ freq: 660, type: 'triangle', dur: 0.2, peak: 0.36 }); tone({ freq: 990, type: 'triangle', dur: 0.2, peak: 0.36, at: 0.09 }); tone({ freq: 1320, type: 'triangle', dur: 0.26, peak: 0.36, at: 0.18 }); },
  complete() { tone({ freq: 880, type: 'triangle', dur: 0.18, peak: 0.34 }); tone({ freq: 1320, type: 'triangle', dur: 0.28, peak: 0.34, at: 0.1 }); },
  // 綠色膠囊逃跑消失：上揚的魔法「咻」＋亮晶晶滑音＋細微消散噗，像瞬間閃走
  vanish() {
    tone({ freq: 520, type: 'triangle', dur: 0.22, peak: 0.30, slideTo: 1500 });
    tone({ freq: 1040, type: 'sine', dur: 0.18, peak: 0.20, slideTo: 2200, at: 0.06 });
    tone({ freq: 1760, type: 'triangle', dur: 0.12, peak: 0.15, at: 0.16 });
    noise({ dur: 0.12, peak: 0.10, type: 'highpass', freq: 3000, at: 0.13 });
  },
  // 膽小地鼠鑽地：低沉下滑＋泥土窸窣
  burrow() {
    tone({ freq: 220, type: 'sine', dur: 0.18, peak: 0.22, slideTo: 70 });
    noise({ dur: 0.22, peak: 0.16, type: 'lowpass', freq: 500 });
  },
  // 拾取知識碎片：清脆雙音
  collect() {
    tone({ freq: 1320, type: 'triangle', dur: 0.10, peak: 0.22 });
    tone({ freq: 1760, type: 'triangle', dur: 0.12, peak: 0.20, at: 0.06 });
  },
  // 好奇光蝶急閃：輕快上揚＋細微氣音
  flutter() {
    tone({ freq: 900, type: 'triangle', dur: 0.12, peak: 0.16, slideTo: 1900 });
    noise({ dur: 0.14, peak: 0.08, type: 'highpass', freq: 4000 });
    tone({ freq: 1500, type: 'sine', dur: 0.10, peak: 0.10, slideTo: 2600, at: 0.05 });
  },

  // 戰鬥
  battleStart() { tone({ freq: 140, type: 'sawtooth', dur: 0.5, peak: 0.42, slideTo: 90 }); noise({ dur: 0.4, peak: 0.28, type: 'lowpass', freq: 240 }); },
  attack() { tone({ freq: 320, type: 'square', dur: 0.13, peak: 0.46, slideTo: 140 }); noise({ dur: 0.07, peak: 0.26, type: 'highpass', freq: 2200 }); }, // 答對出招
  hurt() { tone({ freq: 200, type: 'sawtooth', dur: 0.3, peak: 0.46, slideTo: 70 }); noise({ dur: 0.18, peak: 0.26, type: 'lowpass', freq: 500 }); }, // 答錯受擊
  win() { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.26, peak: 0.4, at: i * 0.11 })); },
  lose() { [392, 330, 262].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.32, peak: 0.38, at: i * 0.14 })); },
};
