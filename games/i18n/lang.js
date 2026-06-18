// 語言設定與解析。
// 偵測順序：localStorage 偏好 → 瀏覽器語言 → 預設正體中文。
// 實際偵測在 index.html 的 inline pre-script（首屏就定 <html lang> 與標題），
// 結果寫到 window.__LANG；此處優先沿用，避免兩處邏輯分歧（pre-script 的偵測須與 detectLang() 一致）。
export const DEFAULT_LANG = 'zh-Hant';
export const LANG_KEY = 'ssd-village-lang';
// 切換器顯示用：各語言以自身文字標示（與當前介面語言無關）。
export const LANGS = [
  { id: 'zh-Hant', label: '正體' },
  { id: 'zh-Hans', label: '简体' },
  { id: 'en', label: 'EN' },
];
const LANG_IDS = LANGS.map((l) => l.id);

// 由瀏覽器語言推測（須與 index.html pre-script 內的判斷一致）
export function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && LANG_IDS.includes(saved)) return saved;
  } catch (e) { /* ignore */ }
  const n = (((navigator.languages && navigator.languages.join(',')) || navigator.language || '')).toLowerCase();
  if (/zh[-_]?(hans|cn|sg|chs)/.test(n)) return 'zh-Hans';
  if (/zh/.test(n)) return 'zh-Hant';
  if (/(^|[,_-])en/.test(n)) return 'en';
  return DEFAULT_LANG;
}

// 解析最終語言：優先沿用 pre-script 寫入的 window.__LANG
export function resolveLang() {
  const w = (typeof window !== 'undefined') && window.__LANG;
  if (w && LANG_IDS.includes(w)) return w;
  return detectLang();
}

// 記住偏好（切換器用）；切換後由呼叫端 reload 以重建場景文字
export function setLang(id) {
  try { localStorage.setItem(LANG_KEY, id); } catch (e) { /* ignore */ }
}
