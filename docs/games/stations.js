// 白天支線站台（5 種）：把戰鬥裡練過的資安小技能抽出來，做成村外白天可玩的獨立小站。
//   forge     密碼鍛造爐 —— 打造夠強的通行密語（重用密碼強度即時條）
//   urlhunt   網址獵人擂台 —— 一排相似網域裡挑出真正的官方網址
//   twolock   雙鎖封印儀式 —— 挑兩道「不同種類」的鎖（MFA/passkey 的核心觀念）
//   backup    備份聖泉 3-2-1 —— 湊齊 3 份備份／2 種媒介／1 份異地
//   deepfake  深偽擂台 —— 一通視訊/語音來電，判斷真人還是 AI 假冒
// 全 DOM 覆蓋層（版型沿用 battle 的 .phish-card / .pw-* / .url-*）、無外部資源；音效走 audio.js 即時合成。
// 仿 fishing.js/egg.js 合約：start(id)→Promise、active 旗標、update(dt) 由主迴圈每幀呼叫（凍結 3D 世界）。
// ⚠️ 各站題目與解說屬資安教育素材，正式採用前請審閱正確性（內容集中在 i18n/stations.js）。
import { SFX } from './audio.js';
import { esc, shuffle, scorePw } from './util.js';

const TAKE = { forge: 3, urlhunt: 6, twolock: 4, backup: 3, deepfake: 5 };   // 每局題數（不足則取全部）

export class Stations {
  constructor({ ui, banks }) {
    this.ui = ui || {};                 // UI.stations（介面字串）
    this.banks = banks || {};           // STATIONS_ALL[lang]：{ forge:[…], urlhunt:[…], … }
    this.active = false;
    this.root = document.getElementById('station');
    this.body = this.root.querySelector('.st-body');
    this.root.querySelector('.st-quit').addEventListener('click', () => this._end());
    this.game = null; this.t = 0;
  }

  start(id) {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this.game = id; this.active = true; this.best = 0;
      this.root.classList.add('show');
      SFX.unlock();
      this._reset();
    });
  }

  update() { /* 這些站皆為回合互動、無需逐幀計時；保留合約供主迴圈呼叫 */ }

  _reset() {
    this.round = 0; this.correct = 0;
    const bank = this.banks[this.game] || [];
    this.deck = shuffle([...bank]).slice(0, Math.min(TAKE[this.game] || 99, bank.length));
    this._render();
  }

  _end() {
    if (!this.active) return;
    this.active = false;
    this.root.classList.remove('show');
    const r = this._resolve; this._resolve = null;
    if (r) r({ game: this.game, best: this.best || 0, total: this.deck ? this.deck.length : 0 });   // 只算完整打完的局（中途退出＝best 0）
  }

  _g() { return (this.ui[this.game]) || {}; }                          // 目前站的介面字串
  _scoreLine() { const u = this.ui; return `<div class="st-score">${esc((u.score ? u.score(this.correct, this.deck.length) : `${this.correct}/${this.deck.length}`))}・${Math.min(this.round + 1, this.deck.length)}/${this.deck.length}</div>`; }
  _head(extra) { const g = this._g(); return `<div class="st-hd">${esc(g.icon || '')} ${esc(g.title || '')}</div>${extra || ''}`; }

  _render() {
    const fn = { forge: '_renderForge', urlhunt: '_renderUrl', twolock: '_renderTwoLock', backup: '_renderBackup', deepfake: '_renderDeepfake' }[this.game];
    this[fn](this.deck[this.round]);
  }

  // 共用結算：ok→correct+1；顯示解說＋下一題/完成
  _verdict(ok, why) {
    if (ok) { this.correct++; SFX.collect(); } else { SFX.hurt(); }
    const u = this.ui, last = this.round + 1 >= this.deck.length;
    const v = document.createElement('div'); v.className = 'st-after';
    v.innerHTML = `<div class="st-verdict ${ok ? 'ok' : 'no'}">${esc(ok ? u.right : u.wrong)}</div>
      <div class="st-why">${esc(why)}</div>
      <button class="st-btn" data-next>${esc(last ? u.over : u.next)}</button>`;
    this.body.appendChild(v);
    v.querySelector('[data-next]').addEventListener('click', () => { this.round++; if (this.round >= this.deck.length) this._finish(); else this._render(); });
    v.scrollIntoView({ block: 'nearest' });
  }

  _finish() {
    this.best = Math.max(this.best || 0, this.correct);
    const u = this.ui, g = this._g();
    const full = this.correct >= this.deck.length;
    SFX.complete();
    this.body.innerHTML = `${this._head()}
      <div class="st-scene big">${full ? '🏆' : (g.icon || '🎯')}</div>
      <div class="st-status"><b>${esc(u.over)}</b></div>
      <div class="st-verdict ${full ? 'ok' : ''}">${esc(u.score ? u.score(this.correct, this.deck.length) : `${this.correct}/${this.deck.length}`)}</div>
      <div class="st-btns2"><button class="st-btn" data-replay>${esc(u.replay)}</button><button class="st-btn alt" data-exit>${esc(u.exit)}</button></div>`;
    this.body.querySelector('[data-replay]').addEventListener('click', () => this._reset());
    this.body.querySelector('[data-exit]').addEventListener('click', () => this._end());
  }

  // ── 密碼鍛造爐：打造一組夠強的通行密語才能「鍛造」（做中學，無錯誤懲罰） ──
  _renderForge(item) {
    const g = this._g();
    this.body.innerHTML = `${this._head()}
      <div class="st-prompt"><b>${esc(g.forFor || '')}</b>${esc(item.purpose || '')}</div>
      <div class="st-hint">${esc(g.hint || '')}</div>
      <div class="interactive pw">
        <input class="pw-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(g.placeholder || '')}" />
        <div class="pw-meter"><i></i></div><div class="pw-tip"></div>
        <button class="st-btn pw-go" disabled>${esc(g.go || '')}</button>
      </div>${this._scoreLine()}`;
    const input = this.body.querySelector('.pw-input'), bar = this.body.querySelector('.pw-meter i'), tip = this.body.querySelector('.pw-tip'), go = this.body.querySelector('.pw-go');
    const pm = g.pwMsg || {};
    const refresh = () => { const r = scorePw(input.value, item.common); bar.style.width = r.pct + '%'; bar.style.background = r.color; tip.textContent = pm[r.level] || ''; tip.style.color = r.color; go.disabled = !r.ok; };
    input.addEventListener('input', refresh); refresh();
    go.addEventListener('click', () => { if (go.disabled) return; input.disabled = true; go.disabled = true; SFX.reel(); this._verdict(true, item.tip || ''); });
  }

  // ── 網址獵人：一排相似網域，挑出真正屬於官方的那一個 ──
  _renderUrl(item) {
    const g = this._g();
    this.body.innerHTML = `${this._head()}<div class="st-prompt">${esc(g.prompt || '')}</div>
      <div class="interactive urlpick"><div class="url-list"></div></div>${this._scoreLine()}`;
    const list = this.body.querySelector('.url-list');
    const urls = item.urls || [], realIdx = urls.findIndex((u) => u.real);
    urls.forEach((u) => {
      const b = document.createElement('button'); b.className = 'opt url-opt'; b.textContent = u.url;
      b.addEventListener('click', () => {
        const btns = [...list.querySelectorAll('.url-opt')]; if (btns.some((x) => x.disabled)) return;
        btns.forEach((x) => { x.disabled = true; });
        b.classList.add(u.real ? 'right' : 'wrong');
        if (!u.real && realIdx >= 0 && btns[realIdx]) btns[realIdx].classList.add('right');
        this._verdict(!!u.real, item.why || '');
      });
      list.appendChild(b);
    });
  }

  // ── 雙鎖封印：挑兩道「不同種類」的鎖（know/have/are），且不可選到不安全的選項 ──
  _renderTwoLock(item) {
    const g = this._g(), picks = new Set();
    this.body.innerHTML = `${this._head()}<div class="st-prompt">${item.scene ? `<b>${esc(g.scene || '')}</b>${esc(item.scene)}<br>` : ''}${esc(g.prompt || '')}</div>
      <div class="interactive chips"><div class="chip-list"></div>
      <button class="st-btn confirm" disabled>${esc(g.confirm || '')}</button></div>${this._scoreLine()}`;
    const list = this.body.querySelector('.chip-list'), go = this.body.querySelector('.confirm');
    item.chips.forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'opt chip-opt'; b.dataset.i = i;
      b.innerHTML = `${esc(c.label)}<i class="chip-cat">${esc((g.cat && g.cat[c.cat]) || '')}</i>`;
      b.addEventListener('click', () => {
        if (b.classList.contains('sel')) { b.classList.remove('sel'); picks.delete(i); }
        else { if (picks.size >= 2) return; b.classList.add('sel'); picks.add(i); SFX.discover(); }
        go.disabled = picks.size !== 2;
      });
      list.appendChild(b);
    });
    go.addEventListener('click', () => {
      if (picks.size !== 2) return;
      const idx = [...picks], chosen = idx.map((i) => item.chips[i]);
      const cats = new Set(chosen.map((c) => c.cat));
      const bad = chosen.some((c) => c.cat === 'bad');
      const ok = !bad && cats.size === 2;                 // 兩道、種類相異、皆為有效因子
      list.querySelectorAll('.chip-opt').forEach((x) => { x.disabled = true; }); go.disabled = true;
      idx.forEach((i) => { const el = list.querySelector(`[data-i="${i}"]`); if (el) el.classList.add(ok ? 'right' : 'wrong'); });
      this._verdict(ok, item.why || '');
    });
  }

  // ── 備份聖泉 3-2-1：從可用去處挑組合，湊齊 3 份備份／2 種媒介／1 份異地或離線 ──
  _renderBackup(item) {
    const g = this._g(), picks = new Set();
    this.body.innerHTML = `${this._head()}<div class="st-prompt"><b>${esc(g.dataFor || '')}</b>${esc(item.data || '')}<br>${esc(g.prompt || '')}</div>
      <div class="interactive chips"><div class="chip-list"></div>
      <div class="st-tally"></div>
      <button class="st-btn confirm">${esc(g.confirm || '')}</button></div>${this._scoreLine()}`;
    const list = this.body.querySelector('.chip-list'), go = this.body.querySelector('.confirm'), tally = this.body.querySelector('.st-tally');
    const stat = () => {
      const chosen = [...picks].map((i) => item.dests[i]);
      return { copies: chosen.length, media: new Set(chosen.map((d) => d.media)).size, off: chosen.filter((d) => d.offsite).length };
    };
    const refresh = () => { const s = stat(); tally.innerHTML = (g.tally ? g.tally(s.copies, s.media, s.off) : `${s.copies}/${s.media}/${s.off}`); };
    item.dests.forEach((d, i) => {
      const b = document.createElement('button'); b.className = 'opt chip-opt'; b.dataset.i = i;
      b.innerHTML = `${esc(d.label)}<i class="chip-cat">${esc((g.media && g.media[d.media]) || '')}${d.offsite ? ' · ' + esc(g.offsite || '') : ''}</i>`;
      b.addEventListener('click', () => { if (b.classList.contains('sel')) { b.classList.remove('sel'); picks.delete(i); } else { b.classList.add('sel'); picks.add(i); SFX.discover(); } refresh(); });
      list.appendChild(b);
    });
    refresh();
    go.addEventListener('click', () => {
      const s = stat(), ok = s.copies >= 3 && s.media >= 2 && s.off >= 1;
      list.querySelectorAll('.chip-opt').forEach((x) => { x.disabled = true; }); go.disabled = true;
      this._verdict(ok, item.why || '');
    });
  }

  // ── 深偽擂台：一通視訊/語音來電，判斷是真人還是 AI 假冒 ──
  _renderDeepfake(item) {
    const g = this._g();
    this.body.innerHTML = `${this._head()}
      <div class="st-call">${item.channel === 'voice' ? '📞' : '📹'}<span>${esc(item.who || '')}</span></div>
      ${item.scene ? `<div class="ph-scene">📌 ${esc(item.scene)}</div>` : ''}
      <div class="st-quote">${esc(item.quote || '')}</div>
      <div class="st-btns2"><button class="st-btn no" data-fake>${esc(g.fake || '')}</button><button class="st-btn ok" data-human>${esc(g.human || '')}</button></div>${this._scoreLine()}`;
    const btns = [...this.body.querySelectorAll('.st-btns2 .st-btn')];
    const decide = (saysFake) => {
      if (btns.some((b) => b.disabled)) return;             // 已答過就不再受理（避免重複計分）
      btns.forEach((b) => { b.disabled = true; });
      this._verdict(saysFake === !!item.isFake, item.why || '');
    };
    this.body.querySelector('[data-fake]').addEventListener('click', () => decide(true));
    this.body.querySelector('[data-human]').addEventListener('click', () => decide(false));
  }
}
