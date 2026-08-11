// 展示模式（attract mode）：沒人操作時自動巡遊五座遺跡，像街機待機的 demo 畫面。擺攤時可以讓螢幕自己跑。
//
// 這裡只放狀態機，不直接碰 main.js 的內部變數——移動、鏡頭、停手都透過建構時傳入的回呼執行。
// 這樣調參或改巡遊邏輯不必牽動場景程式碼，回呼也讓「誰在控制角色」這件事一眼看得出來。
//
// 刻意不做的事：不派發任何合成輸入事件。角色是直接被設定移動目標的，
// 所以 main.js 的 bumpActive()（真人操作偵測）不會被自己觸發，「有人一碰就交還控制權」才不會誤判。

const DEFAULTS = {
  arriveDist: 2.5,      // 距路點多近算抵達
  dwell: 8,             // 抵達後停留幾秒（鏡頭繞著遺跡展示，順便讓課程卡有時間被看見）
  travelTimeout: 30,    // 走不到就放棄換下一站——被地形、碰撞或水域卡住時的保險，沒有這條展示會整晚停在原地
  spinTravel: 0.04,     // 移動中鏡頭自轉速率（rad/s）。刻意很慢：這是給路過的人看的，不是給人操作的，轉快了只會暈
  spinDwell: 0.22,      // 停留時轉快一些，繞看遺跡（約 28 秒一圈）
};

export class Attract {
  // waypoints: [{x, z}]／goto(x,z): 設定自動移動目標／spin(dYaw): 轉鏡頭／stop(): 收掉自動移動
  constructor({ waypoints, goto, spin, stop, ...tune }) {
    this.wp = waypoints || [];
    this._goto = goto; this._spin = spin; this._stop = stop;
    Object.assign(this, DEFAULTS, tune);
    this.active = false; this.i = -1; this.phase = 'travel'; this.t = 0;
  }

  enter() {
    if (this.active || !this.wp.length) return;
    this.active = true; this.i = -1;
    this._next();
  }

  // 交還控制權：一定要收掉自動移動目標，否則玩家接手後角色會繼續自己往路點走
  exit() {
    if (!this.active) return;
    this.active = false;
    this._stop();
  }

  _next() {
    this.i = (this.i + 1) % this.wp.length;   // 繞完一圈自動回到第一站 → 無限循環
    this.phase = 'travel'; this.t = 0;
    const w = this.wp[this.i];
    this._goto(w.x, w.z);
  }

  update(dt, hx, hz) {
    if (!this.active) return;
    this.t += dt;
    const w = this.wp[this.i];
    if (!w) return;
    if (this.phase === 'travel') {
      this._spin(this.spinTravel * dt);
      if (Math.hypot(hx - w.x, hz - w.z) <= this.arriveDist) { this.phase = 'dwell'; this.t = 0; this._stop(); }
      else if (this.t >= this.travelTimeout) this._next();   // 卡住就直接換下一站：停在半路繞鏡頭沒東西可看，不如快點離開
    } else {
      this._spin(this.spinDwell * dt);
      if (this.t >= this.dwell) this._next();
    }
  }
}
