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

export const SFX = {
  unlock() { ensure(); },
  isMuted() { return muted; },
  toggle() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : VOL;
    try { localStorage.setItem('ssd-village-mute', muted ? '1' : '0'); } catch (e) { /* ignore */ }
    return muted;
  },

  // 探索
  step() { noise({ dur: 0.09, peak: 0.12 + Math.random() * 0.03, type: 'lowpass', freq: 320 + Math.random() * 120 }); },
  jump() { tone({ freq: 300, type: 'sine', dur: 0.16, peak: 0.3, slideTo: 620 }); }, // 起跳「hop」
  discover() { tone({ freq: 660, type: 'triangle', dur: 0.2, peak: 0.36 }); tone({ freq: 990, type: 'triangle', dur: 0.2, peak: 0.36, at: 0.09 }); tone({ freq: 1320, type: 'triangle', dur: 0.26, peak: 0.36, at: 0.18 }); },
  complete() { tone({ freq: 880, type: 'triangle', dur: 0.18, peak: 0.34 }); tone({ freq: 1320, type: 'triangle', dur: 0.28, peak: 0.34, at: 0.1 }); },

  // 戰鬥
  battleStart() { tone({ freq: 140, type: 'sawtooth', dur: 0.5, peak: 0.42, slideTo: 90 }); noise({ dur: 0.4, peak: 0.28, type: 'lowpass', freq: 240 }); },
  attack() { tone({ freq: 320, type: 'square', dur: 0.13, peak: 0.46, slideTo: 140 }); noise({ dur: 0.07, peak: 0.26, type: 'highpass', freq: 2200 }); }, // 答對出招
  hurt() { tone({ freq: 200, type: 'sawtooth', dur: 0.3, peak: 0.46, slideTo: 70 }); noise({ dur: 0.18, peak: 0.26, type: 'lowpass', freq: 500 }); }, // 答錯受擊
  win() { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.26, peak: 0.4, at: i * 0.11 })); },
  lose() { [392, 330, 262].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.32, peak: 0.38, at: i * 0.14 })); },
};
