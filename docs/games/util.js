// 共用小工具：跨小遊戲（battle / stations / fishing）原本各抄一份的純函式集中於此，避免複製走樣。
// 這裡只放「與 Three.js 場景無關」的純邏輯；場景/材質相關的仍留在 main.js。

// 將使用者可見字串轉義後再放進 innerHTML（含單引號，連帶擋住注入到 '…' 屬性值的情況）。
// 註：先前 battle.js 自帶的版本漏了單引號，已統一到這份較嚴格的規則。
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Fisher–Yates 原地洗牌（回傳同一陣列）。要保留原陣列時，呼叫端自行先淺拷貝：shuffle([...arr])。
export const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// 常見弱密碼（教育用預設清單）；密碼鍛造爐（stations forge）與弱密碼史萊姆（battle）共用。
export const COMMON_PASSWORDS = ['12345678', 'password', 'qwerty', '111111', 'abc123', 'iloveyou', '000000', 'letmein', 'admin', '123456'];

// 密碼強度啟發式評分（教育用，非真正密碼學強度估算）。
// 回傳 level 鍵（empty/common/short/mid/variety/ok）；對應提示文字由 ui 的 pwMsg 提供（多語系）。
// common 省略時退回 COMMON_PASSWORDS。
export function scorePw(pw, common = COMMON_PASSWORDS) {
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
