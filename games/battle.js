// 戰鬥系統：守關怪物 + 課程小測驗回合制
// 答對 → 出招扣怪血；答錯 → 失去一顆防護心、揭曉正解與解說，再點正解學起來反擊。
// 怪血歸零 = 勝（淨化遺跡）；防護心歸零 = 敗（先去讀章節再來，可重來）。
import * as THREE from 'three';
import { groundY } from './terrain.js?v=442d3a9b';
import { SFX } from './audio.js?v=442d3a9b';

const TAU = Math.PI * 2;
const sm = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: false, ...o });

function buildMonster(data) {
  const g = new THREE.Group();
  const mats = [];
  const reg = (m) => { mats.push(m); return m; };
  const white = () => reg(sm(0xffffff, { roughness: 0.4 }));
  const dark = () => reg(sm(0x12151c));
  const bodyMat = reg(sm(data.color));
  const accentMat = reg(new THREE.MeshStandardMaterial({ color: data.accent, emissive: data.accent, emissiveIntensity: 1.1, roughness: 0.5, flatShading: false }));
  // 一對瞪人的眼睛（含發光瞳孔）
  const eyes = (x, y, z, r, glow) => { for (const sx of [-x, x]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), white()); e.position.set(sx, y, z); g.add(e);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 10, 8), reg(sm(0x10131a, { emissive: glow || 0xff3b30, emissiveIntensity: 0.6 }))); pu.position.set(sx, y, z + r * 0.7); g.add(pu);
  } };
  let body, glowMat = accentMat;
  const style = data.style || 'angler';

  if (style === 'angler') { // 釣魚巨怪
    body = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), bodyMat); g.add(body);
    const belly = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), reg(sm(0x2c3a4a))); belly.position.set(0, -0.5, 1.3); belly.scale.set(1, 0.8, 0.6); g.add(belly);
    eyes(0.8, 0.7, 1.7, 0.5);
    for (const sx of [-0.8, 0.8]) { const brow = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.2), dark()); brow.position.set(sx, 1.2, 1.9); brow.rotation.z = sx > 0 ? 0.5 : -0.5; g.add(brow); }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.3), dark()); mouth.position.set(0, -0.6, 2.0); g.add(mouth);
    for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), white()); t.position.set(-0.8 + i * 0.4, -0.4, 2.1); t.rotation.x = Math.PI; g.add(t); }
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.4, 10), dark()); arm.position.set(0, 3.2, 0.6); arm.rotation.x = 0.5; g.add(arm);
    const lure = new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 0.18), accentMat); lure.position.set(0, 4.4, 1.7); g.add(lure);
    const fold = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.5, 8), reg(sm(0xfff4cf))); fold.position.set(0, 4.5, 1.8); fold.rotation.x = Math.PI / 2; fold.scale.set(1, 0.6, 1); g.add(fold);
    for (const fx of [-2.1, 2.1]) { const fin = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 8), reg(sm(data.color))); fin.position.set(fx, 0, 0); fin.rotation.z = fx > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(fin); }
  } else if (style === 'slime') { // 弱密碼史萊姆
    body = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 1), bodyMat); body.scale.set(1, 0.78, 1); g.add(body);
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), bodyMat); blob.position.set(0.4, 1.2, 0.2); blob.scale.set(1, 0.7, 1); g.add(blob);
    eyes(0.75, 0.5, 1.95, 0.55);
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.13, 10, 14, Math.PI), dark()); mouth.position.set(0, -0.3, 2.05); g.add(mouth);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 1), accentMat); core.position.set(0, 0.2, 0.1); g.add(core);
  } else if (style === 'golem') { // 勒索魔像
    body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.6, 2.6), bodyMat); body.position.y = 0.3; g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.4, 1.6), bodyMat); head.position.set(0, 2.6, 0); g.add(head);
    const eyeBar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.1), accentMat); eyeBar.position.set(0, 2.7, 0.82); g.add(eyeBar);
    const core = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.3), accentMat); core.position.set(0, 0.5, 1.35); g.add(core);
    for (const sx of [-2.4, 2.4]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.8, 1.0), bodyMat); arm.position.set(sx, 0.3, 0); g.add(arm); }
    for (const sx of [-0.9, 0.9]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 1.2), reg(sm(0x3a63b8))); leg.position.set(sx, -2.4, 0); g.add(leg); }
  } else if (style === 'ghost') { // 迷霧幽靈
    const ghostMat = reg(new THREE.MeshStandardMaterial({ color: data.color, transparent: true, opacity: 0.8, roughness: 0.6, flatShading: false }));
    body = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), ghostMat); body.scale.set(1, 1.2, 1); g.add(body);
    for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 8), ghostMat); t.position.set(-1.7 + i * 0.85, -2.2, 0); t.rotation.x = Math.PI; g.add(t); }
    eyes(0.7, 0.6, 1.7, 0.5, data.accent);
    const wisp = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 1), accentMat); wisp.position.set(0, 1.6, 0.6); g.add(wisp);
  } else { // bug：資料蠹蟲
    for (let i = 0; i < 3; i++) { const seg = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 - i * 0.28, 1), bodyMat); seg.position.set(0, 0.2 - i * 0.1, -i * 1.7); g.add(seg); }
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), bodyMat); head.position.set(0, 0.35, 1.9); g.add(head);
    eyes(0.6, 0.7, 2.9, 0.45, data.accent);
    for (const sx of [-0.7, 0.7]) { const mand = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.1, 6), dark()); mand.position.set(sx, -0.3, 3.0); mand.rotation.x = -1.3; g.add(mand); }
    for (const sx of [-0.5, 0.5]) { const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 1.7, 8), accentMat); ant.position.set(sx, 1.5, 2.5); ant.rotation.x = -0.5; ant.rotation.z = sx > 0 ? -0.2 : 0.2; g.add(ant); }
    body = head;
  }

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, body, bodyMat: body.material, glowMat, mats };
}

// 將使用者可見字串轉義後再放進 innerHTML（避免信件內容中的 < > 被當成 HTML 標籤）
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 密碼強度啟發式評分（教育用，非真正的密碼學強度估算）
// 回傳 level 鍵（empty/common/short/mid/variety/ok）；對應的提示文字由 ui.battle.pwMsg 提供（多語系）。
function scorePw(pw, common) {
  const len = pw.length;
  if (!len) return { pct: 6, color: '#9aa1b0', ok: false, level: 'empty' };
  const lc = pw.toLowerCase();
  const isCommon = common.some((c) => lc.includes(c)) || /^(.)\1+$/.test(pw) || /^(0123|1234|2345|3456|4567|5678|6789|abcd|qwer)/.test(lc);
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (isCommon) return { pct: 28, color: '#d0433a', ok: false, level: 'common' };
  if (len < 8) return { pct: 30, color: '#d0433a', ok: false, level: 'short' };
  if (len < 12) return { pct: 58, color: '#f0a500', ok: false, level: 'mid' };
  if (variety < 2 && len < 16) return { pct: 72, color: '#f0a500', ok: false, level: 'variety' };
  return { pct: 100, color: '#3aa45b', ok: true, level: 'ok' };
}

export class BattleSystem {
  constructor({ scene, camera, hero, ui }) {
    this.scene = scene; this.camera = camera; this.hero = hero;
    this.ui = ui;   // 多語系介面字串（由 main.js 注入；含 battle 子物件）
    this.active = false; this.mon = null; this.state = 'idle'; this.stateT = 0; this.locked = false;
    this.monPos = new THREE.Vector3(); this.dir = new THREE.Vector3(); this.right = new THREE.Vector3();
    this._camPos = new THREE.Vector3(); this._look = new THREE.Vector3();
    this.bursts = [];
    const $ = (s) => document.querySelector('#battle ' + s);
    this.el = { root: document.getElementById('battle'), name: $('.mon-name'), emoji: $('.mon-emoji'), hp: $('.mon-hp i'), hearts: $('.hearts'), q: $('.q'), opts: $('.opts'), fb: $('.fb'), fbIcon: $('.fb .ic'), fbWhy: $('.fb .why'), fbLink: $('.fb .lnk'), fbNext: $('.fb .next'), flash: $('.hit-flash'), flee: $('.flee') };
    this.el.flee.addEventListener('click', () => this._finish(false));
  }

  start(poi, data, opts = {}) {                                     // opts：試煉模式用（hearts=起始血量、shuffle=題目洗牌）
    return new Promise((resolve) => {
      let d = data;
      if (opts.shuffle) {                                           // Fisher–Yates 淺拷貝洗牌（四種題型皆自足物件，安全）
        const qs = [...data.questions];
        for (let i = qs.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [qs[i], qs[j]] = [qs[j], qs[i]]; }
        d = { ...data, questions: qs };
      }
      this._resolve = resolve; this.poi = poi; this.data = d;
      this.qi = 0; this.hearts = this.maxHearts = opts.hearts ?? 3; this.monHP = d.questions.length; this.monMax = this.monHP;
      // 怪物位置：在玩家與遺跡之間，面向玩家
      // 戰鬥方向：從遺跡往「外」佈陣，讓遺跡退到鏡頭後方，不擋到怪物
      this.dir.set(this.hero.position.x - poi.pos.x, 0, this.hero.position.z - poi.pos.z);
      if (this.dir.lengthSq() < 0.01) this.dir.set(0, 0, 1);
      this.dir.normalize();
      this.right.crossVectors(this.dir, new THREE.Vector3(0, 1, 0)).normalize();
      // 玩家站遺跡外側、面向外；怪物在更外側面向玩家
      this.heroStand = new THREE.Vector3(poi.pos.x + this.dir.x * 9, 0, poi.pos.z + this.dir.z * 9);
      this.heroStand.y = groundY(this.heroStand.x, this.heroStand.z);
      this.monPos.set(poi.pos.x + this.dir.x * 18, 0, poi.pos.z + this.dir.z * 18);
      this.monPos.y = groundY(this.monPos.x, this.monPos.z) + 2.6;
      this.hero.rotation.y = Math.atan2(this.dir.x, this.dir.z);
      const m = buildMonster(data.monster); this.mon = m;
      m.group.position.copy(this.monPos);
      m.group.rotation.y = Math.atan2(-this.dir.x, -this.dir.z);
      this.scene.add(m.group);
      // 戰鬥場地：發光法陣
      const mx = (this.heroStand.x + this.monPos.x) / 2, mz = (this.heroStand.z + this.monPos.z) / 2;
      this.arena = new THREE.Mesh(
        new THREE.RingGeometry(7.5, 12.5, 56),
        new THREE.MeshBasicMaterial({ color: data.monster.accent, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      );
      this.arena.rotation.x = -Math.PI / 2; this.arena.position.set(mx, groundY(mx, mz) + 0.07, mz);
      this.scene.add(this.arena);
      // 戰鬥時直接隱藏守關遺跡（連同光束、水晶、標籤），避免擋住主角與怪物
      this._ruin = poi.group; this._ruin.visible = false;
      this.state = 'enter'; this.stateT = 0; this.active = true; this.locked = false;
      SFX.battleStart();
      // UI
      this.el.emoji.textContent = data.monster.emoji; this.el.name.textContent = data.monster.name;
      this.el.root.classList.add('show');
      this._renderHP(); this._renderHearts(); this._renderQuestion();
    });
  }

  _renderHP() { this.el.hp.style.width = `${Math.max(0, this.monHP / this.monMax) * 100}%`; }
  _renderHearts() { this.el.hearts.innerHTML = ''; for (let i = 0; i < this.maxHearts; i++) { const s = document.createElement('span'); s.textContent = i < this.hearts ? '🛡️' : '🤍'; this.el.hearts.appendChild(s); } }
  _renderQuestion() {
    const q = this.data.questions[this.qi]; this.locked = false;
    this.el.fb.classList.remove('show'); this.el.q.textContent = this.ui.battle.qCounter(this.qi + 1, this.data.questions.length, q.q);
    this.el.opts.innerHTML = '';
    const type = q.type || 'mcq';
    if (type === 'phish') return this._renderPhish(q);
    if (type === 'url') return this._renderUrl(q);
    if (type === 'password') return this._renderPassword(q);
    q.options.forEach((opt, i) => { const b = document.createElement('button'); b.className = 'opt'; b.textContent = opt; b.addEventListener('click', () => this._answer(i)); this.el.opts.appendChild(b); });
  }

  // 情境互動題（phish/url/password）共用判定：沿用怪血、護盾、解說與勝負流程
  // 注意：方法名避開既有的 this._resolve（戰鬥 Promise 的 resolve 回呼）
  _judge(correct, q, onWrongRetry) {
    if (correct) {
      this.locked = true;
      this.monHP--; this._renderHP(); this._hit();
      const won = this.monHP <= 0;
      const b = this.ui.battle;
      this._feedback(true, q, won ? b.win : b.correct, won ? b.retreat : b.next, () => (won ? this._finish(true) : this._next()));
    } else {
      this.locked = true;
      this.hearts--; this._renderHearts(); this._monsterAttack();
      const b = this.ui.battle;
      if (this.hearts <= 0) {
        this._feedback(false, q, b.defeated, b.goRead, () => this._finish(false));
      } else {
        this._feedback(false, q, b.wrongRetry, b.tryAgain, () => { this.el.fb.classList.remove('show'); this.locked = false; onWrongRetry && onWrongRetry(); });
      }
    }
  }

  // 擬真釣魚卡：先讀信，再決策「這是釣魚／這是正常」
  _renderPhish(q) {
    this.locked = false;
    const m = q.mail || {};
    const b = this.ui.battle;
    const wrap = document.createElement('div'); wrap.className = 'interactive phish';
    wrap.innerHTML =
      '<div class="phish-card">' +
      `<div class="ph-row"><span class="ph-k">${esc(b.phFrom)}</span><span class="ph-v">${esc(m.from)}</span></div>` +
      `<div class="ph-row"><span class="ph-k">${esc(b.phSubject)}</span><span class="ph-v">${esc(m.subject)}</span></div>` +
      `<div class="ph-body">${esc(m.body)}</div>` +
      (m.link ? `<div class="ph-link">🔗 ${esc(m.link)}</div>` : '') +
      '</div>' +
      `<div class="phish-btns"><button class="opt ph-yes">${esc(b.phYes)}</button><button class="opt ph-no">${esc(b.phNo)}</button></div>`;
    this.el.opts.appendChild(wrap);
    const decide = (saysPhish) => {
      if (this.locked) return; this.locked = true;
      wrap.querySelectorAll('.opt').forEach((b) => { b.disabled = true; });
      this._judge(saysPhish === !!q.isPhish, q, () => this._renderQuestion());
    };
    wrap.querySelector('.ph-yes').addEventListener('click', () => decide(true));
    wrap.querySelector('.ph-no').addEventListener('click', () => decide(false));
  }

  // 真假網址：挑出真正屬於官方的那一個（看主網域）
  _renderUrl(q) {
    this.locked = false;
    const urls = q.urls || [];
    const realIdx = urls.findIndex((u) => u.real);
    const wrap = document.createElement('div'); wrap.className = 'interactive urlpick';
    const list = document.createElement('div'); list.className = 'url-list';
    urls.forEach((u) => {
      const b = document.createElement('button'); b.className = 'opt url-opt'; b.textContent = u.url;
      b.addEventListener('click', () => {
        if (this.locked) return; this.locked = true;
        const btns = [...list.querySelectorAll('.url-opt')];
        btns.forEach((x) => { x.disabled = true; });
        b.classList.add(u.real ? 'right' : 'wrong');
        if (!u.real && realIdx >= 0 && btns[realIdx]) btns[realIdx].classList.add('right');
        this._judge(!!u.real, q, () => this._renderQuestion());
      });
      list.appendChild(b);
    });
    wrap.appendChild(list);
    this.el.opts.appendChild(wrap);
  }

  // 密碼強度即時條：打造一組夠強的密碼才能出招（做中學）
  _renderPassword(q) {
    this.locked = false;
    const b = this.ui.battle;
    const wrap = document.createElement('div'); wrap.className = 'interactive pw';
    wrap.innerHTML =
      `<input class="pw-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(b.pwPlaceholder)}" />` +
      '<div class="pw-meter"><i></i></div>' +
      '<div class="pw-tip"></div>' +
      `<button class="opt pw-go" disabled>${esc(b.pwGo)}</button>`;
    this.el.opts.appendChild(wrap);
    const input = wrap.querySelector('.pw-input');
    const bar = wrap.querySelector('.pw-meter i');
    const tip = wrap.querySelector('.pw-tip');
    const go = wrap.querySelector('.pw-go');
    const common = q.common || ['12345678', 'password', 'qwerty', '111111', 'abc123', 'iloveyou', '000000', 'letmein', 'admin', '123456'];
    const refresh = () => { const r = scorePw(input.value, common); bar.style.width = r.pct + '%'; bar.style.background = r.color; tip.textContent = b.pwMsg[r.level]; tip.style.color = r.color; go.disabled = !r.ok; };
    input.addEventListener('input', refresh); refresh();
    go.addEventListener('click', () => { if (this.locked || go.disabled) return; this.locked = true; input.disabled = true; go.disabled = true; this._judge(true, q, () => this._renderQuestion()); });
  }

  _answer(idx) {
    if (this.locked) return;
    const q = this.data.questions[this.qi];
    const btns = [...this.el.opts.querySelectorAll('.opt')];
    const small = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches; // 僅手機小螢幕收選項，平板/桌面保留四選項
    if (idx === q.correct) {
      this.locked = true;
      btns.forEach((b, i) => { b.disabled = true; if (i === idx) b.classList.add('right'); else if (small) b.style.display = 'none'; });
      this.monHP--; this._renderHP(); this._hit();
      const won = this.monHP <= 0;
      const bt = this.ui.battle;
      this._feedback(true, q, won ? bt.win : bt.correct, won ? bt.retreat : bt.next, () => (won ? this._finish(true) : this._next()));
    } else {
      this.hearts--; this._renderHearts(); this._monsterAttack();
      btns.forEach((b, i) => { b.disabled = true; if (i === idx) b.classList.add('wrong'); if (i === q.correct) b.classList.add('right'); });
      const bt = this.ui.battle;
      if (this.hearts <= 0) {
        this.locked = true;
        if (small) btns.forEach((b, i) => { if (i !== q.correct) b.style.display = 'none'; }); // 小螢幕只留正解
        this._feedback(false, q, bt.defeated, bt.goRead, () => this._finish(false));
      } else {
        // 揭曉正解：小螢幕收掉其他選項只留正解；平板/桌面四選項都留著
        this.locked = true;
        if (small) btns.forEach((b, i) => { if (i !== q.correct) b.style.display = 'none'; });
        const cor = btns[q.correct];
        cor.disabled = false; cor.classList.add('learn');
        cor.onclick = () => { this.locked = false; this._answer(q.correct); };
        this._feedback(false, q, bt.wrongLearn, null, null);
      }
    }
  }

  _feedback(ok, q, icon, nextLabel, nextFn) {
    this.el.fb.classList.toggle('ok', ok); this.el.fb.classList.toggle('bad', !ok);
    this.el.fbIcon.textContent = icon; this.el.fbWhy.textContent = q.why;
    this.el.fbLink.href = q.link; this.el.fbLink.style.display = q.link ? '' : 'none';
    if (nextLabel) { this.el.fbNext.style.display = ''; this.el.fbNext.textContent = nextLabel; this.el.fbNext.onclick = nextFn; }
    else { this.el.fbNext.style.display = 'none'; }
    this.el.fb.classList.add('show');
  }

  _next() { this.qi++; this._renderQuestion(); }

  _hit() { this.state = 'hurt'; this.stateT = 0; this._burst(this.data.monster.accent); SFX.attack(); }
  _monsterAttack() { this.state = 'attack'; this.stateT = 0; this.el.flash.classList.remove('go'); void this.el.flash.offsetWidth; this.el.flash.classList.add('go'); SFX.hurt(); }

  _burst(color) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.22, 8, 24), new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.position.copy(this.monPos); ring.lookAt(this.camera.position); this.scene.add(ring); this.bursts.push({ ring, t: 0 });
  }

  _finish(won) {
    this.state = won ? 'defeat' : 'retreat'; this.stateT = 0; this.locked = true;
    this.el.root.classList.remove('show');
    SFX[won ? 'win' : 'lose']();
    this._endAt = 1.1; this._endWon = won;
  }

  update(dt) {
    const t = (this._t = (this._t || 0) + dt);
    this.stateT += dt;
    const m = this.mon; if (!m) return;
    // 怪物動畫
    const baseY = this.monPos.y;
    if (this.state === 'enter') { const k = Math.min(1, this.stateT / 0.5); m.group.scale.setScalar(0.2 + 0.8 * k); m.group.position.y = baseY + Math.sin(t * 2) * 0.2; if (k >= 1) this.state = 'idle'; }
    else if (this.state === 'idle') { m.group.position.y = baseY + Math.sin(t * 2) * 0.25; m.group.rotation.z = Math.sin(t * 1.3) * 0.05; m.bodyMat.emissive.setHex(0x000000); }
    else if (this.state === 'hurt') { const k = this.stateT / 0.4; m.group.position.x = this.monPos.x + Math.sin(this.stateT * 60) * 0.25 * (1 - k); m.bodyMat.emissive.setHex(0x661111); m.bodyMat.emissiveIntensity = 0.8 * (1 - k); if (k >= 1) { m.group.position.x = this.monPos.x; this.state = 'idle'; } }
    else if (this.state === 'attack') { const k = this.stateT / 0.5; const lunge = Math.sin(k * Math.PI); m.group.position.x = this.monPos.x - this.dir.x * lunge * 3; m.group.position.z = this.monPos.z - this.dir.z * lunge * 3; if (k >= 1) this.state = 'idle'; }
    else if (this.state === 'defeat' || this.state === 'retreat') {
      const k = Math.min(1, this.stateT / 1.0);
      if (this.state === 'defeat') { m.group.rotation.y += dt * 8; m.group.scale.setScalar(Math.max(0.001, 1 - k)); m.group.position.y = baseY + k * 2; }
      else { m.group.position.x = this.monPos.x + this.dir.x * k * 10; m.group.position.z = this.monPos.z + this.dir.z * k * 10; m.group.scale.setScalar(Math.max(0.001, 1 - k * 0.7)); }
      m.mats.forEach((mt) => { mt.transparent = true; mt.opacity = 1 - k; });
    }
    if (m.glowMat) m.glowMat.emissiveIntensity = 0.9 + Math.sin(t * 5) * 0.4;

    // 玩家緩動就位
    this.hero.position.lerp(this.heroStand, 1 - Math.exp(-6 * dt));
    // 戰鬥運鏡：過肩、低角度仰看怪物，主角與怪物抬升至畫面上半（避開底部選項）
    this._camPos.set(this.heroStand.x - this.dir.x * 8 + this.right.x * 2.4, this.heroStand.y + 2.0, this.heroStand.z - this.dir.z * 8 + this.right.z * 2.4);
    this.camera.position.lerp(this._camPos, 1 - Math.exp(-5 * dt));
    this._look.set(this.monPos.x, this.monPos.y + 1.0, this.monPos.z);
    this.camera.lookAt(this._look);
    // 法陣旋轉與呼吸
    if (this.arena) { this.arena.rotation.z += dt * 0.35; this.arena.material.opacity = 0.18 + Math.sin(t * 3) * 0.06; }

    // 特效
    for (let i = this.bursts.length - 1; i >= 0; i--) { const b = this.bursts[i]; b.t += dt; const k = b.t / 0.7; b.ring.scale.setScalar(1 + k * 5); b.ring.material.opacity = Math.max(0, 0.85 - k); if (k >= 1) { this.scene.remove(b.ring); b.ring.geometry.dispose(); b.ring.material.dispose(); this.bursts.splice(i, 1); } }

    // 結束收尾
    if (this._endAt != null) { this._endAt -= dt; if (this._endAt <= 0) { this._endAt = null; this.scene.remove(m.group); m.mats.forEach((mt) => mt.dispose()); m.group.traverse((o) => o.geometry && o.geometry.dispose()); if (this.arena) { this.scene.remove(this.arena); this.arena.geometry.dispose(); this.arena.material.dispose(); this.arena = null; } if (this._ruin) { this._ruin.visible = true; this._ruin = null; } this.mon = null; this.active = false; const r = this._resolve; this._resolve = null; r && r({ won: this._endWon }); } }
  }
}
