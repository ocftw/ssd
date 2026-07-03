// 釣魚小遊戲「湖畔釣魚信」：站上湖畔碼頭拋竿，把「信件」一封封釣上來，判斷是釣魚信還是正常信。
// 一局 10 封不重複、計分；全對 9/10 以上由 main.js 頒發「識詐釣手」成就。
// 全 DOM 覆蓋層（版型沿用 battle 的 .phish-card）、無外部資源；音效走 audio.js 即時合成。
// 仿 egg.js 合約：start()→Promise、active 旗標、update(dt) 由主迴圈每幀呼叫（凍結 3D 世界）。
import { SFX } from './audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ROUND_N = 10;   // 每局釣 10 封

export class FishingGame {
  constructor({ ui, bank }) {
    this.ui = ui; this.bank = bank || [];
    this.active = false;
    this.root = document.getElementById('fishing');
    this.body = this.root.querySelector('.fish-body');
    this.root.querySelector('.fish-quit').addEventListener('click', () => this._end());
    this.state = 'idle'; this.t = 0;
  }

  start() {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this.active = true; this.best = 0;                          // best＝本次進場「完整一局」的最佳成績
      this.root.classList.add('show');
      SFX.unlock();
      this._reset();
    });
  }

  _reset() {
    this.round = 0; this.correct = 0; this.finished = false;
    this.deck = [...this.bank];                                   // 洗牌取前 10 → 一局內不重複
    for (let i = this.deck.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]; }
    this.deck = this.deck.slice(0, Math.min(ROUND_N, this.deck.length));
    this._ready();
  }

  _end() {
    if (!this.active) return;
    this.active = false; this.state = 'idle';
    this.root.classList.remove('show');
    const r = this._resolve; this._resolve = null;
    if (r) r({ best: this.best || 0, total: this.deck.length });  // 只算完整打完的局（中途退出不計）
  }

  _scene(bobberCls, status, btnHtml) {                            // 共用場景版型：水面＋浮標＋狀態列＋按鈕
    const u = this.ui;
    this.body.innerHTML = `<div class="fish-hd">🎣 ${esc(u.title)}</div>
      <div class="fish-scene"><span class="bobber ${bobberCls}">🎣</span></div>
      <div class="fish-status">${status}</div>${btnHtml || ''}
      <div class="fish-score">${esc(u.score(this.correct, this.deck.length))}・${Math.min(this.round + 1, this.deck.length)}/${this.deck.length}</div>`;
  }

  _ready() {
    this.state = 'ready';
    this._scene('', '&nbsp;', `<button class="fish-btn" data-a>${esc(this.ui.cast)}</button>`);
    this.body.querySelector('[data-a]').addEventListener('click', () => this._cast());
  }

  _cast() {
    this.state = 'waiting'; this.t = 0.8 + Math.random() * 1.8;   // 等魚上鉤 0.8–2.6s（update(dt) 倒數）
    SFX.cast();
    this._scene('waiting', esc(this.ui.waiting));
  }

  update(dt) {                                                    // 主迴圈每幀呼叫（只有等待咬餌需要計時）
    if (!this.active) return;
    if (this.state === 'waiting') { this.t -= dt; if (this.t <= 0) this._hooked(); }
  }

  _hooked() {
    this.state = 'hooked';
    SFX.splash();
    this._scene('hooked', `<b>${esc(this.ui.hooked)}</b>`, `<button class="fish-btn alt" data-a>${esc(this.ui.reel)}</button>`);
    this.body.querySelector('[data-a]').addEventListener('click', () => { SFX.reel(); this._mail(); });
  }

  _mail() {
    this.state = 'mail';
    const u = this.ui, m = this.deck[this.round];
    this.body.innerHTML = `<div class="fish-hd">🎣 ${esc(u.title)}</div>
      <div class="fish-mail"><div class="phish-card">
        <div class="ph-row"><span class="ph-k">${esc(u.phFrom)}</span><span class="ph-v">${esc(m.from)}</span></div>
        <div class="ph-row"><span class="ph-k">${esc(u.phSubject)}</span><span class="ph-v">${esc(m.subject)}</span></div>
        <div class="ph-body">${esc(m.body)}</div>
        ${m.link ? `<div class="ph-link">🔗 ${esc(m.link)}</div>` : ''}
      </div></div>
      <div class="fish-btns2"><button class="fish-btn no" data-phish>${esc(u.isPhish)}</button><button class="fish-btn ok" data-legit>${esc(u.isLegit)}</button></div>
      <div class="fish-score">${esc(u.score(this.correct, this.deck.length))}・${this.round + 1}/${this.deck.length}</div>`;
    const decide = (saysPhish) => this._verdict(saysPhish === !!m.isPhish, m);
    this.body.querySelector('[data-phish]').addEventListener('click', () => decide(true));
    this.body.querySelector('[data-legit]').addEventListener('click', () => decide(false));
  }

  _verdict(ok, m) {
    if (this.state !== 'mail') return;
    this.state = 'verdict';
    if (ok) { this.correct++; SFX.collect(); } else { SFX.hurt(); }
    const u = this.ui, last = this.round + 1 >= this.deck.length;
    this.body.querySelector('.fish-btns2').outerHTML =
      `<div class="fish-verdict ${ok ? 'ok' : 'no'}">${esc(ok ? u.right : u.wrong)}　${m.isPhish ? '🎣' : '✉️'}</div>
       <div class="fish-why">${esc(m.why)}</div>
       <button class="fish-btn" data-a>${esc(last ? u.over : u.next)}</button>`;
    this.body.querySelector('.fish-score').textContent = `${u.score(this.correct, this.deck.length)}・${this.round + 1}/${this.deck.length}`;
    this.body.querySelector('[data-a]').addEventListener('click', () => {
      this.round++;
      if (this.round >= this.deck.length) this._finish(); else this._ready();
    });
  }

  _finish() {
    this.state = 'over'; this.finished = true;
    this.best = Math.max(this.best || 0, this.correct);
    const u = this.ui, full = this.correct >= this.deck.length;
    SFX.complete();
    this.body.innerHTML = `<div class="fish-hd">🎣 ${esc(u.title)}</div>
      <div class="fish-scene"><span class="bobber">${full ? '🏆' : '🎣'}</span></div>
      <div class="fish-status"><b>${esc(u.over)}</b></div>
      <div class="fish-verdict ${this.correct >= 9 ? 'ok' : ''}">${esc(u.score(this.correct, this.deck.length))}</div>
      <div class="fish-btns2"><button class="fish-btn" data-replay>${esc(u.replay)}</button><button class="fish-btn alt" data-exit>${esc(u.exit)}</button></div>`;
    this.body.querySelector('[data-replay]').addEventListener('click', () => { this.finished = false; this._reset(); });
    this.body.querySelector('[data-exit]').addEventListener('click', () => this._end());
  }
}
