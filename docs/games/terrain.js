// 程序化地形：高度函式由整個世界共用（地形網格、角色行走、物件擺放都呼叫它，確保一致）
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export const WORLD = {
  half: 280,        // 世界半徑（地形邊長 = half*2）；C 放大：150→280（村莊不變，只擴張外圍荒野）
  villageR: 34,     // 村莊半徑（此範圍內地形壓平）
  water: -2.6,      // 水面高度（低於此即成湖）
  maxR: 190,        // 角色可行走的最大半徑（外圍是當背景的山脈）；C 放大：114→190，邊界＝迷霧緩坡丘陵
};

const noise = new ImprovedNoise();

export function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function fbm(x, z) {
  let h = 0, amp = 1, freq = 0.012, sum = 0;
  for (let i = 0; i < 4; i++) {
    h += noise.noise(x * freq, z * freq, i * 10.7) * amp;
    sum += amp; amp *= 0.5; freq *= 2.1;
  }
  return h / sum; // ~[-1, 1]
}

// 世界開放度：0＝夜（外圍山牆夾住）｜1＝日（全清後群山沉降、外緣降到海＝沒有牆的大陸）。由 main.js 在全清/載入已完成存檔時切換。
let openness = 0;
export function setTerrainOpenness(v) { openness = v; }
export function terrainHeight(x, z) {
  const d = Math.hypot(x, z);
  let h = fbm(x, z) * 11;                          // 起伏丘陵（可為負 → 湖）
  h *= smoothstep(WORLD.villageR * 0.6, WORLD.villageR * 1.5, d); // 村莊壓平
  const ring = smoothstep(175, 260, d);            // 夜：外圍山牆（內圈 d<175 夜/日相同）
  const hNight = h * (1 - ring) + ring * 48;
  const coast = smoothstep(220, 272, d);           // 日：外緣降到海平面以下＝海岸／海
  const hDay = h * (1 - coast) + coast * (-8);
  return hNight * (1 - openness) + hDay * openness;
}

// 取得地表上方的安全擺放高度（避免沉到水裡）
export function groundY(x, z) {
  return Math.max(terrainHeight(x, z), WORLD.water + 0.2);
}
