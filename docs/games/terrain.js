// 程序化地形：高度函式由整個世界共用（地形網格、角色行走、物件擺放都呼叫它，確保一致）
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export const WORLD = {
  half: 150,        // 世界半徑（地形邊長 = half*2）
  villageR: 34,     // 村莊半徑（此範圍內地形壓平）
  water: -2.6,      // 水面高度（低於此即成湖）
  maxR: 104,        // 角色可行走的最大半徑（外圍是當背景的山脈）
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

export function terrainHeight(x, z) {
  const d = Math.hypot(x, z);
  let h = fbm(x, z) * 11;                          // 起伏丘陵（可為負 → 湖）
  h *= smoothstep(WORLD.villageR * 0.6, WORLD.villageR * 1.5, d); // 村莊壓平
  const ring = smoothstep(95, 138, d);             // 外圍山脈
  h = h * (1 - ring) + ring * 34;
  return h;
}

// 取得地表上方的安全擺放高度（避免沉到水裡）
export function groundY(x, z) {
  return Math.max(terrainHeight(x, z), WORLD.water + 0.2);
}
