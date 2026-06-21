// 彩蛋小遊戲「揮刀求生」（Vampire Survivors 風）：純 2D canvas、自成一格，由創世之核對話選單啟動。
// 玩家可走位（WASD／方向鍵／觸控拖曳），刀自動有節奏地揮砍，三滴血用完即結束。
// 全離線、無外部資源；音效走 audio.js 的 SFX 即時合成。仿 battle.js：start()→Promise、active 旗標、update(dt) 由主迴圈每幀呼叫。
import { SFX } from './audio.js';

const HI_KEY = 'ssd-village-egg-hi';   // 最佳分數（隔離鍵，不碰主存檔 ssd-village-v1）

export class EggGame {
  constructor({ ui }) {
    this.ui = ui;
    this.active = false;
    this.root = document.getElementById('egg');
    this.canvas = this.root.querySelector('canvas');
    this.cx = this.canvas.getContext('2d');
    this.overEl = this.root.querySelector('.egg-over');
    this.quitBtn = this.root.querySelector('.egg-quit');
    this.keys = new Set();
    this.ptr = { active: false, x: 0, y: 0 };   // 觸控／滑鼠拖曳目標（畫面座標）
    try { this.hi = parseInt(localStorage.getItem(HI_KEY) || '0', 10) || 0; } catch (e) { this.hi = 0; }
    const g = ui.eggGame;
    this.overEl.querySelector('[data-replay]').textContent = g.replay;
    this.overEl.querySelector('[data-exit]').textContent = g.exit;
    this._bind();
  }

  _bind() {
    this._onKeyDown = (e) => { if (!this.active) return; this.keys.add(e.code); if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); };
    this._onKeyUp = (e) => { this.keys.delete(e.code); };
    this._onResize = () => this._resize();
    const c = this.canvas;
    this._onDown = (e) => { this.ptr.active = true; this._ptrAt(e); try { c.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } };
    this._onMove = (e) => { if (this.ptr.active) this._ptrAt(e); };
    this._onUp = () => { this.ptr.active = false; };
    c.addEventListener('pointerdown', this._onDown);
    c.addEventListener('pointermove', this._onMove);
    c.addEventListener('pointerup', this._onUp);
    c.addEventListener('pointercancel', this._onUp);
    this.quitBtn.addEventListener('click', () => this._end());
    this.overEl.querySelector('[data-replay]').addEventListener('click', () => this._reset());
    this.overEl.querySelector('[data-exit]').addEventListener('click', () => this._end());
  }

  _ptrAt(e) { const r = this.canvas.getBoundingClientRect(); this.ptr.x = e.clientX - r.left; this.ptr.y = e.clientY - r.top; }

  _resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
    this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px';
    this.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this.active = true;
      this.root.classList.add('show');
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
      window.addEventListener('resize', this._onResize);
      this._resize();
      SFX.unlock();
      this._reset();
    });
  }

  _reset() {
    this.overEl.classList.remove('show');
    this.hp = 3; this.kills = 0; this.time = 0; this.over = false;
    this.player = { x: this.w / 2, y: this.h / 2, r: 14, face: -Math.PI / 2, inv: 0 };
    this.monsters = []; this.particles = [];
    this.spawnT = 0.8; this.swingT = 0.3; this.swing = null;
    this.keys.clear(); this.ptr.active = false;
  }

  _end() {
    if (!this.active) return;
    this.active = false;
    this.root.classList.remove('show');
    this.overEl.classList.remove('show');
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('resize', this._onResize);
    const r = this._resolve; this._resolve = null; if (r) r({ kills: this.kills });
  }

  _nearest() { let best = null, bd = Infinity; for (const m of this.monsters) { const d = (m.x - this.player.x) ** 2 + (m.y - this.player.y) ** 2; if (d < bd) { bd = d; best = m; } } return best; }

  _spawn() {
    const W = this.w, H = this.h, off = 18, edge = (Math.random() * 4) | 0;
    let x, y;
    if (edge === 0) { x = Math.random() * W; y = -off; }
    else if (edge === 1) { x = W + off; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H + off; }
    else { x = -off; y = Math.random() * H; }
    const types = [{ r: 12, spd: 56, color: '#e0556b' }, { r: 9, spd: 86, color: '#e8a23a' }, { r: 16, spd: 42, color: '#8c6bd8' }];
    const ty = types[(Math.random() * types.length) | 0];
    this.monsters.push({ x, y, r: ty.r, spd: ty.spd + this.time * 1.2, color: ty.color, dead: false });
  }

  _burst(x, y, color) {
    for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 130; this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4, max: 0.4, color }); }
  }

  _gameOver() {
    this.over = true; SFX.eggOver();
    if (this.kills > this.hi) { this.hi = this.kills; try { localStorage.setItem(HI_KEY, String(this.hi)); } catch (e) { /* ignore */ } }
    const g = this.ui.eggGame;
    this.overEl.querySelector('.egg-title').textContent = g.over;
    this.overEl.querySelector('.egg-score').textContent = `${g.kills} ${this.kills}　·　${g.best} ${this.hi}`;
    this.overEl.classList.add('show');
  }

  update(dt) { if (!this.active) return; if (!this.over) this._step(dt); this._draw(); }

  _step(dt) {
    this.time += dt;
    const W = this.w, H = this.h, p = this.player;
    // 移動：鍵盤 ＋ 觸控拖曳（拖曳方向＝朝指標）
    let mx = 0, my = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) my -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) my += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    if (this.ptr.active) { const dx = this.ptr.x - p.x, dy = this.ptr.y - p.y, d = Math.hypot(dx, dy); if (d > 6) { mx = dx / d; my = dy / d; } }
    const ml = Math.hypot(mx, my), SPEED = 215;
    if (ml > 0) { mx /= ml; my /= ml; p.x += mx * SPEED * dt; p.y += my * SPEED * dt; p.face = Math.atan2(my, mx); }
    p.x = Math.max(p.r, Math.min(W - p.r, p.x)); p.y = Math.max(p.r, Math.min(H - p.r, p.y));
    if (p.inv > 0) p.inv -= dt;

    // 生怪：速率隨時間遞減（變難）、同屏上限；後期一次兩隻
    this.spawnT -= dt;
    const cap = 44;
    if (this.spawnT <= 0 && this.monsters.length < cap) {
      this.spawnT = Math.max(0.26, 1.05 - this.time * 0.018);
      this._spawn();
      if (this.time > 14 && this.monsters.length < cap) this._spawn();
    }
    // 怪朝玩家
    for (const m of this.monsters) { const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1; m.x += dx / d * m.spd * dt; m.y += dy / d * m.spd * dt; }

    // 揮刀節奏
    this.swingT -= dt;
    if (this.swingT <= 0) {
      this.swingT = 0.5;
      let dir = p.face;
      if (ml === 0) { const nm = this._nearest(); if (nm) dir = Math.atan2(nm.y - p.y, nm.x - p.x); }
      this.swing = { t: 0, dur: 0.22, dir };
      SFX.eggSwing();
    }
    if (this.swing) {
      this.swing.t += dt;
      if (this.swing.t <= this.swing.dur) {
        const RANGE = 92, HALF = 1.05; let hit = false;
        for (const m of this.monsters) {
          if (m.dead) continue;
          const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy);
          if (d > RANGE + m.r) continue;
          let da = Math.atan2(dy, dx) - this.swing.dir; da = Math.atan2(Math.sin(da), Math.cos(da));
          if (Math.abs(da) <= HALF) { m.dead = true; m.byBlade = true; hit = true; }
        }
        if (hit) SFX.eggHit();
      } else { this.swing = null; }
    }

    // 死亡結算 ＋ 玩家碰撞
    for (const m of this.monsters) {
      if (m.dead) { this._burst(m.x, m.y, m.color); if (m.byBlade) this.kills++; continue; }
      const dx = p.x - m.x, dy = p.y - m.y;
      if (Math.hypot(dx, dy) < p.r + m.r && p.inv <= 0) { this.hp--; p.inv = 0.95; m.dead = true; SFX.eggHurt(); if (this.hp <= 0) this._gameOver(); }
    }
    this.monsters = this.monsters.filter((m) => !m.dead);
    for (const q of this.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  _draw() {
    const cx = this.cx, W = this.w, H = this.h, p = this.player, g = this.ui.eggGame;
    cx.fillStyle = '#10131c'; cx.fillRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(255,255,255,.04)'; cx.lineWidth = 1; cx.beginPath();
    const gs = 48;
    for (let x = (W / 2) % gs; x < W; x += gs) { cx.moveTo(x, 0); cx.lineTo(x, H); }
    for (let y = (H / 2) % gs; y < H; y += gs) { cx.moveTo(0, y); cx.lineTo(W, y); }
    cx.stroke();
    // 怪
    for (const m of this.monsters) {
      cx.beginPath(); cx.arc(m.x, m.y, m.r, 0, Math.PI * 2); cx.fillStyle = m.color; cx.fill();
      cx.lineWidth = 2; cx.strokeStyle = 'rgba(0,0,0,.35)'; cx.stroke();
      cx.fillStyle = 'rgba(255,255,255,.92)';
      cx.beginPath(); cx.arc(m.x - m.r * 0.3, m.y - m.r * 0.12, m.r * 0.18, 0, Math.PI * 2); cx.arc(m.x + m.r * 0.3, m.y - m.r * 0.12, m.r * 0.18, 0, Math.PI * 2); cx.fill();
    }
    // 粒子
    for (const q of this.particles) { cx.globalAlpha = Math.max(0, q.life / q.max); cx.fillStyle = q.color; cx.fillRect(q.x - 2, q.y - 2, 4, 4); }
    cx.globalAlpha = 1;
    // 刀弧
    if (this.swing) {
      const prog = Math.min(1, this.swing.t / this.swing.dur), RANGE = 92, HALF = 1.05;
      const sweep = (this.swing.dir - HALF) + 2 * HALF * prog;
      cx.beginPath(); cx.moveTo(p.x, p.y); cx.arc(p.x, p.y, RANGE, this.swing.dir - HALF, this.swing.dir + HALF); cx.closePath();
      cx.fillStyle = 'rgba(180,225,255,.14)'; cx.fill();
      cx.strokeStyle = 'rgba(225,242,255,.95)'; cx.lineWidth = 3;
      cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x + Math.cos(sweep) * RANGE, p.y + Math.sin(sweep) * RANGE); cx.stroke();
    }
    // 玩家（受傷無敵時閃白）
    const flash = p.inv > 0 && Math.floor(p.inv * 16) % 2 === 0;
    cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fillStyle = flash ? '#ffffff' : '#ffd24b'; cx.fill();
    cx.lineWidth = 2.5; cx.strokeStyle = '#7e5630'; cx.stroke();
    cx.fillStyle = '#7e5630'; cx.beginPath();
    cx.moveTo(p.x + Math.cos(p.face) * (p.r + 6), p.y + Math.sin(p.face) * (p.r + 6));
    cx.lineTo(p.x + Math.cos(p.face + 2.5) * p.r, p.y + Math.sin(p.face + 2.5) * p.r);
    cx.lineTo(p.x + Math.cos(p.face - 2.5) * p.r, p.y + Math.sin(p.face - 2.5) * p.r);
    cx.closePath(); cx.fill();
    // HUD
    cx.textBaseline = 'top'; cx.textAlign = 'left'; cx.font = '700 22px sans-serif';
    cx.fillText('❤️'.repeat(Math.max(0, this.hp)) + '🖤'.repeat(Math.max(0, 3 - this.hp)), 16, 14);
    cx.textAlign = 'center'; cx.fillStyle = 'rgba(255,255,255,.5)'; cx.font = '700 13px sans-serif'; cx.fillText(g.title, W / 2, 16);
    cx.textAlign = 'right'; cx.fillStyle = '#fff'; cx.font = '700 16px sans-serif'; cx.fillText(`${g.kills} ${this.kills}`, W - 16, 60); // 在 ✕ 鈕（高 ~52px）下方，避免重疊
    if (this.time < 4 && !this.over) { cx.textAlign = 'left'; cx.fillStyle = 'rgba(255,255,255,.7)'; cx.font = '600 14px sans-serif'; cx.fillText(g.howto, 16, 52); }
  }
}
