// 資安防護新手村 · 探險版
// 以村莊為基地，走出村莊尋找散落荒野的「遺跡」（＝資安主題課程）。
// 純前端、自成一體；不讀取也不修改 docs/ 原始文件。進度存於 localStorage。
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'; // 桌機：亮部光暈（電影感）
import { Sky } from 'three/addons/objects/Sky.js';                                 // 桌機：大氣散射天空
import { CONTENT } from './i18n/content.js?v=71295972';
import { BATTLES_ALL } from './i18n/battles.js?v=71295972';
import { UI_ALL } from './i18n/ui.js?v=71295972';
import { LANGS, resolveLang, setLang } from './i18n/lang.js?v=71295972';
import { WORLD, terrainHeight, groundY, setTerrainOpenness } from './terrain.js?v=71295972';
import { BattleSystem } from './battle.js?v=71295972';
import { EggGame } from './egg.js';
import { SFX } from './audio.js?v=71295972';

// ── 多語系：解析語言、取出該語言的內容／測驗／介面字典 ──────────────
// 只認「三個字典都備妥」的語言；尚未翻譯者一律退回正體中文（避免半套）。
const FALLBACK_LANG = 'zh-Hant';
const AVAILABLE_LANGS = LANGS.map((l) => l.id).filter((id) => CONTENT[id] && BATTLES_ALL[id] && UI_ALL[id]);
const LANG = AVAILABLE_LANGS.includes(resolveLang()) ? resolveLang() : FALLBACK_LANG;
const UI = UI_ALL[LANG] || UI_ALL[FALLBACK_LANG];
const BATTLES = BATTLES_ALL[LANG] || BATTLES_ALL[FALLBACK_LANG];
const { VILLAGE_BOARD, RUINS, OCF_STATUE, LEGEND, ARCHIVE_DOCS, WEAPON_CHEST, GUIDE_KIT, MONUMENT, LIGHTHOUSE, PARTNER_WALL } = CONTENT[LANG] || CONTENT[FALLBACK_LANG];

// 套用 index.html 內的靜態介面文字（data-i18n＝textContent、-html＝innerHTML、-aria／-title＝屬性）
function applyStaticI18n() {
  document.documentElement.lang = LANG;
  document.title = UI.docTitle;
  const meta = document.querySelector('meta[name="description"]'); if (meta) meta.setAttribute('content', UI.metaDesc);
  const set = (sel, attr) => document.querySelectorAll('[' + sel + ']').forEach((el) => { const v = UI[el.getAttribute(sel)]; if (typeof v === 'string') { if (attr) el.setAttribute(attr, v); else el.textContent = v; } });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { const v = UI[el.getAttribute('data-i18n-html')]; if (typeof v === 'string') el.innerHTML = v; });
  set('data-i18n');
  set('data-i18n-aria', 'aria-label');
  set('data-i18n-title', 'title');
}
// 語言切換器（右上角）：只列出已備妥的語言；少於 2 種就不顯示。切換後 reload 以重建場景文字。
function buildLangSwitcher() {
  if (AVAILABLE_LANGS.length < 2) return;
  const wrap = document.createElement('div'); wrap.id = 'langsw';
  LANGS.filter((l) => AVAILABLE_LANGS.includes(l.id)).forEach((l) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = l.label;
    if (l.id === LANG) b.classList.add('on');
    b.addEventListener('click', () => { if (l.id === LANG) return; setLang(l.id); location.reload(); });
    wrap.appendChild(b);
  });
  const tr = document.getElementById('topright'); if (tr) tr.appendChild(wrap);
}
applyStaticI18n();
buildLangSwitcher();

// ── 能力偵測：本遊戲需要 WebGL2（Three r163 起不支援 WebGL1）。不支援就在 landing 友善提示、不進場（不黑畫面）。──
function showUnsupported() {
  const root = document.getElementById('landing');
  const btn = document.getElementById('startbtn');
  if (btn) { btn.disabled = true; btn.textContent = UI.cantPlayBtn; }
  if (root) {
    const prep = root.querySelector('.prep'); if (prep) prep.style.display = 'none';   // 收起「世界生成中」轉圈
    root.querySelectorAll('.topics-hd, .topics, .landingquality').forEach((el) => { el.style.display = 'none'; }); // 錯誤頁不顯示空的主題/畫質區塊
    const card = root.querySelector('.card');
    if (card && !card.querySelector('.cantplay')) {
      const p = document.createElement('p'); p.className = 'cantplay';
      p.style.cssText = 'margin:12px 0 0;color:#c0433a;font-weight:700;font-size:13px;line-height:1.6';
      p.textContent = UI.cantPlayMsg;
      card.insertBefore(p, btn);
    }
  }
}
const webgl2ok = (() => { try { return !!(window.WebGL2RenderingContext && document.createElement('canvas').getContext('webgl2')); } catch (e) { return false; } })();
if (!webgl2ok) { showUnsupported(); throw new Error('WebGL2 unsupported — game cannot start'); }

// ── 畫質檔位：依裝置自動分檔，可由 localStorage 手動覆寫（auto 時觸控→精簡、桌機→精緻）──
// 手機／行動裝置以「能順跑、能完成」為目標（省電、低發熱優先）；筆電／桌機效能足，把畫面拉回來。
const QKEY = 'ssd-village-quality';                       // 'auto' | 'low' | 'high'
let qOverride = 'auto';
try { qOverride = localStorage.getItem(QKEY) || 'auto'; } catch (e) {}
const COARSE = matchMedia('(pointer: coarse)').matches;   // 觸控／行動裝置
const TIER = (qOverride === 'low' || qOverride === 'high') ? qOverride : (COARSE ? 'low' : 'high');
const Q = ({
  // low＝手機精簡：低發熱、省電優先；視覺精簡但玩法與功能完整（寫實效果全關，渲染路徑與現狀完全一致）
  low:  { maxPR: 2,   smaa: false, msaa: 4, shadowType: THREE.PCFShadowMap,
          sunShadow: 1024, torchShadow: 512,  waterSeg: 28, waterStep: 0.066, aniso: 2, mageNight: false,
          bloom: false, richSky: false, rich: false, weather: false },
  // high＝桌機精緻：解除為手機而設的限制＋開啟寫實後製（光暈、大氣天空＋星空、電影色調）
  // 註：maxPR 1.5（由 2.0 再降）＝把填充率砍約 44%，緩解 GPU 滿載造成的風扇狂轉與幀距不均（高刷新/高DPI 螢幕上水面等大平面最容易顯出抖動）；SMAA 在 1.5 下仍可接受。弱機可手動切「精簡」走 low 路徑
  high: { maxPR: 1.5, smaa: true,  msaa: 0, shadowType: THREE.PCFSoftShadowMap,
          sunShadow: 4096, torchShadow: 2048, waterSeg: 48, waterStep: 0.033, aniso: 8, mageNight: true,
          bloom: true, richSky: true, rich: true, weather: true },
})[TIER];

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
// 村莊夜燈（路燈/市集提燈/窗戶）：登錄後在主迴圈隨繁榮度淡入淡出——夜晚發光、白天熄滅（避免白天還在反光發光）
const nightGlowMats = [];
const regNightGlow = (mesh) => { nightGlowMats.push({ m: mesh.material, base: mesh.material.emissiveIntensity }); return mesh; };
const nightHalo = []; // 夜燈柔光暈：夜晚淡入、白天淡出（opacity 隨 1-vibrancy）
const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: false, envMapIntensity: 0.5, ...opts });
const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
// 貼圖載入（CC0 / Poly Haven）：albedo 用 sRGB、法線用線性；可平鋪
const _texL = new THREE.TextureLoader();
const tex = (url, rx = 1, ry = 1, srgb = false) => {
  const t = _texL.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = Q.aniso;
  return t;
};
// 結構石材＝水泥/混凝土貼圖（repeat 1；密度由 boxUV 依各物件大小烘進 UV → 大小物件一致）
const stoneMap = tex('./tex/concrete.webp?v=71295972', 1, 1, true), stoneNor = tex('./tex/concrete_n.webp?v=71295972', 1, 1);
// 立方投影 UV：依頂點法線主軸把局部座標投影成 UV，任意大小的網格都得到一致的貼圖密度
function boxUV(geo, tile = 2.6) {
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else if (ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / tile; uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
const applyStone = (m) => { m.map = stoneMap; m.normalMap = stoneNor; m.normalScale = new THREE.Vector2(0.4, 0.4); m.color.set(0xd6d2c8); m.roughness = 0.95; m.needsUpdate = true; return m; }; // 提亮成淺水泥灰，蓋掉原本偏暗的色調
// 木造貼圖（木板）：告示牌/市集/井頂支柱/旗桿等
const woodMap = tex('./tex/wood.webp?v=71295972', 1, 1, true), woodNor = tex('./tex/wood_n.webp?v=71295972', 1, 1);
const applyWood = (m) => { m.map = woodMap; m.normalMap = woodNor; m.normalScale = new THREE.Vector2(0.5, 0.5); m.color.set(0xc9a877); m.roughness = 0.82; m.needsUpdate = true; return m; };

// ── 渲染器 / 場景 / 鏡頭 ─────────────────────────────────────────
const app = document.getElementById('app');
let renderer; // AA 交給 composer（高＝SMAA／低＝render target 硬體 MSAA）；context MSAA 對 composer 離屏目標無效
try { renderer = new THREE.WebGLRenderer({ antialias: false }); } catch (e) { showUnsupported(); throw e; } // 偵測過但建立 context 仍失敗（驅動封鎖/context lost）時的保險
// 裝置像素比上限依畫質檔位：手機精簡 2×（填充率＝GPU 發熱主因，2× 約少 56% 片段運算）、桌機精緻 2.5×
const PR = Math.min(window.devicePixelRatio || 1, Q.maxPR);
renderer.setPixelRatio(PR);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = Q.shadowType; // 桌機 PCFSoft 柔邊／手機 PCF 省效能
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
app.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'fixed';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
app.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfe4f0, 120, 360);
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 1200);

// 後製：桌機＝全域 Bloom（亮部光暈，給水晶/光束/燈籠/法師球等發光物電影感）→ 色彩分級 → SMAA；手機＝直接色彩分級（無 bloom）。
// 採單一 composer 的標準全域 bloom：穩定、各 GPU 一致、不會吃掉或壓暗任何物件。
//   （曾試「選擇性 bloom」雙 composer：會在部分裝置上讓中央水晶／法師手杖球／寶箱發光物消失，故改回全域 bloom。）
//   threshold 偏高（1.05>1）只讓較亮的 emissive/亮部發光，故白底圖（壁畫/Logo/封面，未受光 BasicMaterial＝1.0）與一般受光面都不會過曝。不用 GTAO（會把加法特效當不透明物造成殘影）。
const composer = new EffectComposer(renderer);
composer.setPixelRatio(PR);
composer.addPass(new RenderPass(scene, camera));
let bloomPass = null;
if (Q.bloom) {
  bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.4, 1.05); // strength, radius, threshold(>1：只發較亮處)
  composer.addPass(bloomPass);
}
const gradePass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uVibrancy: { value: 0 }, uNightBr: { value: 0.4 }, uRich: { value: Q.rich ? 1 : 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVibrancy; uniform float uNightBr; uniform float uRich; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      float sat = mix(0.90, 1.0, uVibrancy);                          // 夜晚仍保留原色（不再大幅去飽和）
      vec3 tint = mix(vec3(0.82, 0.88, 1.0), vec3(1.0), uVibrancy);   // 夜晚淡淡冷藍月色
      float br = mix(uNightBr, 1.0, uVibrancy);                        // 夜晚整體亮度（uNightBr，恢復後回到 1.0）
      vec3 col = mix(vec3(l), c.rgb, sat) * tint * br;
      if (uRich > 0.5) {                                              // 桌機：電影色調（HDR-safe；S 曲線交給最後 ACES）
        float l2 = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(vec3(l2), col, mix(0.82, 0.92, uVibrancy));        // 收斂卡通飽和（白天也略降）
        float lum = clamp(l2, 0.0, 1.0);
        col *= mix(vec3(0.96, 0.99, 1.05), vec3(1.05, 1.0, 0.94), lum); // 微 split-tone：陰影偏冷、亮部偏暖
      }
      gl_FragColor = vec4(col, c.a); }`,
});
composer.addPass(gradePass);
if (Q.smaa) composer.addPass(new SMAAPass(innerWidth, innerHeight)); // 桌機：SMAA 邊緣抗鋸齒（多一個全螢幕 pass）
composer.addPass(new OutputPass());
composer.setSize(innerWidth, innerHeight);
// 手機：略過 SMAA shader pass，改對 composer 離屏目標開硬體 MSAA（較省）
if (!Q.smaa && Q.msaa) { composer.renderTarget1.samples = composer.renderTarget2.samples = Q.msaa; }

function renderScene() { composer.render(); }

// ── 天空（顏色隨繁榮度由陰灰漸變到藍天）─────────────────────────
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: { top: { value: new THREE.Color(0x6d7682) }, bottom: { value: new THREE.Color(0x8f8b83) } },
  vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bottom;
    void main(){ float h=clamp(vP.y/560.0*0.5+0.5,0.0,1.0); h=pow(h,0.8); gl_FragColor=vec4(mix(bottom,top,h),1.0); }`,
});
// 繁榮度色盤（破敗 D → 繁榮 A）
const SKY_TOP_D = new THREE.Color(0x6d7682), SKY_TOP_A = new THREE.Color(0x4f9fd6);
const SKY_BOT_D = new THREE.Color(0x8f8b83), SKY_BOT_A = new THREE.Color(0xfae7cf);
const FOG_D = new THREE.Color(0x83878d), FOG_A = new THREE.Color(0xcfe4f0);
const WATER_NIGHT = new THREE.Color(0x1f3a52), WATER_DAY = new THREE.Color(0x4f9fd0); // 平海面日夜色（MeshBasic 不受光，手動 lerp）

// 桌機：大氣散射天空（Sky addon）＋夜空星點；手機：維持原漸層天空球（零變動）
let atmoSky = null, stars = null;
const _skySun = new THREE.Vector3();
if (Q.richSky) {
  atmoSky = new Sky(); atmoSky.scale.setScalar(1200); // 控制在鏡頭 far(1200) 內、又比場景大 → 永遠當背景
  const su = atmoSky.material.uniforms;
  su.turbidity.value = 6; su.rayleigh.value = 2.2; su.mieCoefficient.value = 0.005; su.mieDirectionalG.value = 0.8;
  if ('cloudCoverage' in su) { su.cloudCoverage.value = 0.35; su.cloudDensity.value = 0.35; su.cloudSpeed.value = 0.00006; } // r184 內建微雲
  scene.add(atmoSky);
  // 夜空星點：上半球隨機分布，opacity 由 (1-vibrancy) 驅動 → 夜晚顯現、白天淡出
  const STAR_N = 420, sp = new Float32Array(STAR_N * 3);
  for (let i = 0; i < STAR_N; i++) {
    const y = Math.abs(Math.random() * 2 - 1) * 0.9 + 0.08, r2 = Math.sqrt(Math.max(0, 1 - y * y)), ph = Math.random() * TAU;
    sp[i * 3] = Math.cos(ph) * r2 * 540; sp[i * 3 + 1] = y * 540; sp[i * 3 + 2] = Math.sin(ph) * r2 * 540;
  }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfe0ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  scene.add(stars);
} else {
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(560, 32, 16), skyMat));
}

// ── 環境光（IBL）：用「繁榮天空」漸層產生環境貼圖（LDR、可控）→ 水面映天、水晶/金屬反光、整體更立體 ──
// 兩檔位皆沿用此漸層環境（原本就調校好的亮度）；大氣 Sky 只當桌機「可見背景」，不拿來生 IBL（其 HDR 亮度會淹沒整個場景）。
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  const skyScene = new THREE.Scene();
  const envSkyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: SKY_TOP_A.clone() }, bottom: { value: SKY_BOT_A.clone() } },
    vertexShader: skyMat.vertexShader, fragmentShader: skyMat.fragmentShader,
  });
  skyScene.add(new THREE.Mesh(new THREE.SphereGeometry(560, 32, 16), envSkyMat));
  scene.environment = pmrem.fromScene(skyScene, 0, 1, 1000).texture;
  pmrem.dispose(); envSkyMat.dispose();
}

// ── 燈光（太陽會跟著角色移動，保持大世界陰影清晰）─────────────────
const hemi = new THREE.HemisphereLight(0xdcefff, 0x6b5a44, 0.6); scene.add(hemi);
const ambient = new THREE.AmbientLight(0xffffff, 0.08); scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff1d8, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(Q.sunShadow, Q.sunShadow);   // 依畫質檔位：桌機 4096 更清晰、手機 1024 省填充低發熱
sun.shadow.camera.near = 1; sun.shadow.camera.far = 220;
sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun);
scene.add(sun.target);
// 夜→日燈光：用「光照強度」表現明暗（取代後製壓暗），讓火把照到的地方能顯出原本顏色
function setWorldLight(k) { // k：0＝夜晚（荒蕪）、1＝白天（恢復）
  sun.intensity = 0.25 + (2.2 - 0.25) * k;
  hemi.intensity = 0.12 + (0.6 - 0.12) * k;
  ambient.intensity = 0.03 + (0.08 - 0.03) * k;
  scene.environmentIntensity = 0.16 + (1 - 0.16) * k; // 夜晚同時壓低天空環境光（否則整片仍偏亮）
  // 陰影：全部遺跡點亮（≈vibrancy 1）才有太陽 → 才有太陽陰影；夜晚改由火把投影
  const day = k > 0.9;
  sun.castShadow = day;            // 夜晚沒有太陽：樹/物件不投太陽影
  torchGround.castShadow = !day;   // 夜晚火把即時投影；白天關閉（太陽影接手）以省效能，避免同時兩張陰影圖
}
// 主角隨身火把：照亮周圍一圈暖光（世界越荒蕪越亮、恢復後轉弱），帶輕微火光晃動
const torch = new THREE.PointLight(0xffb061, 0, 24, 2.0);
scene.add(torch);
// 火把投向前方地面的光錐：照亮腳前的路（讓前方地面也亮起來），夜晚由它投出即時陰影
const torchGround = new THREE.SpotLight(0xffc079, 0, 32, Math.PI * 0.32, 0.6, 1.5);
torchGround.shadow.mapSize.set(Q.torchShadow, Q.torchShadow);          // 依畫質檔位：桌機 2048／手機 512
torchGround.shadow.camera.near = 1; torchGround.shadow.camera.far = 55;
torchGround.shadow.bias = -0.0006; torchGround.shadow.normalBias = 0.04;
scene.add(torchGround); scene.add(torchGround.target);

// 螢火蟲：點綴「已完成」的遺跡（自體發光、漂浮閃爍）。完成一座遺跡，28 顆便分布到各已完成遺跡周圍。
const fireflyTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,242,170,0.9)');
  g.addColorStop(0.6, 'rgba(190,255,150,0.22)'); g.addColorStop(1, 'rgba(190,255,150,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const fireflies = [];
const fireflyGroup = new THREE.Group(); scene.add(fireflyGroup);
for (let i = 0; i < 28; i++) {
  const m = new THREE.SpriteMaterial({ map: fireflyTex, color: 0xfff0a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(m); s.scale.setScalar(rand(0.5, 1.0)); fireflyGroup.add(s);
  fireflies.push({ s, m, on: false, cx: 0, cz: 0, cy: 0, ox: rand(-1, 1) * 4.5, oz: rand(-1, 1) * 4.5, h: rand(0.5, 3.2),
    sx: rand(0.12, 0.32), sz: rand(0.12, 0.32), ax: rand(1.0, 2.4), az: rand(1.0, 2.4), ph: rand(0, TAU), bob: rand(0.4, 1.0), tw: rand(1.6, 3.0) });
}
// 把 28 顆螢火蟲分配到「已完成」遺跡的石化維護者周圍（完成數改變時呼叫）；沒有完成的遺跡則全部隱藏
function assignFireflies() {
  const done = ruinAt.filter((r) => isDone(r.id));
  fireflies.forEach((f, i) => {
    if (!done.length) { f.on = false; return; }
    const r = done[i % done.length];
    const c = (keepers.find((kp) => kp.ruin.id === r.id) || {}).pos || r; // 以維護者為中心（找不到才退回遺跡）
    f.cx = c.x; f.cz = c.z; f.cy = c.y; f.on = true;
  });
}

// ── 沉浸感：天氣（桌機限定）＋動態生物（蝴蝶／魚影／飛鳥）。輕量、純裝飾，不影響玩法 ──
// A2 天氣：飄霧（夜濃日淡）＋偶發細雨（僅桌機 Q.weather）
let weather = null;
if (Q.weather) {
  const softTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.5, 'rgba(255,255,255,0.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  })();
  const wg = new THREE.Group(); scene.add(wg);
  const mists = [];
  for (let i = 0; i < 7; i++) {
    const m = new THREE.SpriteMaterial({ map: softTex, color: 0xccd6e2, transparent: true, opacity: 0, depthWrite: false, fog: false });
    const s = new THREE.Sprite(m); s.scale.set(rand(42, 72), rand(20, 34), 1); wg.add(s);
    mists.push({ s, m, ox: rand(-1, 1) * 55, oz: rand(-1, 1) * 55, h: rand(5, 15), ph: rand(0, TAU), sp: rand(0.012, 0.03) });
  }
  const rainTex = (() => { // 垂直短條＝雨絲（非大方塊）
    const c = document.createElement('canvas'); c.width = 16; c.height = 64; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(6, 0, 4, 64);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  })();
  const RN = 800, rpos = new Float32Array(RN * 3);
  for (let i = 0; i < RN; i++) { rpos[i * 3] = rand(-40, 40); rpos[i * 3 + 1] = rand(0, 42); rpos[i * 3 + 2] = rand(-40, 40); }
  const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
  const rmat = new THREE.PointsMaterial({ map: rainTex, color: 0xcdd9e6, size: 9, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }); // 螢幕固定垂直雨絲
  const rain = new THREE.Points(rgeo, rmat); rain.frustumCulled = false; wg.add(rain);
  weather = { mists, rain, rgeo, rmat, amt: 0, target: 0, timer: rand(20, 45) };
}

// A3 蝴蝶：白天於草地飄舞、拍翅（兩檔位、數量少；繫於 vibrancy → 全村甦醒的白天才現身）
const butterflies = [];
{
  const flutterTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#fff';
    const wing = (cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.fill(); };
    wing(23, 25, 11, 14); wing(41, 25, 11, 14); wing(26, 42, 8, 10); wing(38, 42, 8, 10);
    x.fillRect(31, 16, 2, 32);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  })();
  const bg = new THREE.Group(); scene.add(bg);
  const cols = [0xffd36e, 0xff9ec7, 0x9ecbff, 0xfff1a8, 0xc59cff], N = Q.rich ? 8 : 5;
  for (let i = 0; i < N; i++) {
    const m = new THREE.SpriteMaterial({ map: flutterTex, color: cols[i % cols.length], transparent: true, opacity: 0, depthWrite: false, fog: true });
    const s = new THREE.Sprite(m); bg.add(s);
    const a = rand(0, TAU), r = rand(8, WORLD.villageR + 26);
    butterflies.push({ s, m, cx: Math.cos(a) * r, cz: Math.sin(a) * r, ph: rand(0, TAU), sp: rand(0.4, 0.9), rad: rand(3, 8), h: rand(1.0, 2.6), fl: rand(9, 15) });
  }
}

// A3 魚影：在湖區（地形低於水面處）緩繞的小暗影（兩檔位、半透明，透過水面隱約可見）
const fishSchools = [];
{
  const spots = [];
  for (let k = 0; k < 500 && spots.length < 3; k++) {
    const a = rand(0, TAU), r = rand(WORLD.villageR + 8, WORLD.maxR - 6);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (terrainHeight(x, z) < WORLD.water - 0.8) spots.push({ x, z });
  }
  if (spots.length) {
    const fg = new THREE.Group(); scene.add(fg);
    const fishGeo = new THREE.SphereGeometry(0.22, 8, 6); fishGeo.scale(2.7, 0.6, 1.05);
    const fishMat = new THREE.MeshStandardMaterial({ color: 0x8aa6b6, roughness: 0.5, metalness: 0.2, emissive: 0x33474f, emissiveIntensity: 0.8, transparent: true, opacity: 0.88 }); // 淡銀藍＋自發光：暗夜也清楚看見魚影
    for (const sp of spots) for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(fishGeo, fishMat); fg.add(mesh);
      fishSchools.push({ mesh, cx: sp.x, cz: sp.z, ph: rand(0, TAU), rad: rand(1.4, 4), sp: rand(0.5, 1.0) * (Math.random() < 0.5 ? 1 : -1), depth: rand(0.22, 0.55) });
    }
  }
}

// A3 飛鳥：白天偶爾橫越天空的小剪影（桌機限定）
const birds = [];
if (Q.rich) {
  const birdTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.strokeStyle = '#000'; x.lineWidth = 6; x.lineCap = 'round';
    x.beginPath(); x.moveTo(10, 40); x.quadraticCurveTo(32, 20, 32, 36); x.quadraticCurveTo(32, 20, 54, 40); x.stroke();
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  })();
  const bg = new THREE.Group(); scene.add(bg);
  for (let i = 0; i < 5; i++) {
    const m = new THREE.SpriteMaterial({ map: birdTex, color: 0x35424c, transparent: true, opacity: 0, depthWrite: false, fog: false });
    const s = new THREE.Sprite(m); s.scale.setScalar(rand(2.6, 4.2)); bg.add(s);
    birds.push({ s, m, base: s.scale.x, ph: rand(0, TAU), sp: rand(0.012, 0.026) * (Math.random() < 0.5 ? 1 : -1), r: rand(110, 165), h: rand(40, 60), fl: rand(6, 10) });
  }
}

// ── 遠方地標：外環荒野的視覺目的地（純裝飾、低多邊形、兩檔位）——增加方位感與空間層次 ──
{
  const lmStone = mat(0x8d8478, { roughness: 0.95 }), lmWood = mat(0x5a4a3a, { roughness: 1 });
  const place = (deg, r, build) => { const a = deg * Math.PI / 180, x = Math.cos(a) * r, z = Math.sin(a) * r; const g = build(); g.position.set(x, groundY(x, z), z); g.rotation.y = rand(0, TAU); scene.add(g); };
  place(55, 160, () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const h = rand(4, 7), s = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 1.0), lmStone), a = (i / 5) * TAU; s.position.set(Math.cos(a) * 3, h / 2, Math.sin(a) * 3); s.rotation.set(rand(-0.1, 0.1), rand(0, TAU), rand(-0.12, 0.12)); s.castShadow = true; g.add(s); } return g; });                                  // 立石群
  place(146, 120, () => { const g = new THREE.Group(); for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 7, 8), lmStone); c.position.set(sx * 2.4, 3.5, 0); c.castShadow = true; g.add(c); } const top = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 1.6), lmStone); top.position.set(0, 7.2, 0); top.rotation.z = 0.04; top.castShadow = true; g.add(top); return g; });  // 殘破石拱
  place(285, 150, () => { const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 6, 8), lmWood); tr.position.y = 3; tr.castShadow = true; g.add(tr); for (let i = 0; i < 4; i++) { const bl = rand(2, 3.2), b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, bl, 6), lmWood), a = rand(0, TAU); b.position.set(Math.cos(a) * 0.5, rand(4, 5.5), Math.sin(a) * 0.5); b.rotation.set(rand(0.4, 1.0), a, rand(-0.4, 0.4)); g.add(b); } return g; });           // 枯樹立於小丘
}

// ── 地形 ────────────────────────────────────────────────────────
const segs = Q.rich ? 320 : 240;   // 放大後桌機加段數讓近景丘陵平滑；手機維持 240（載入期一次性、無每幀成本）
const tGeo = new THREE.PlaneGeometry(WORLD.half * 2, WORLD.half * 2, segs, segs);
tGeo.rotateX(-Math.PI / 2);
const tp = tGeo.attributes.position;
// 依高度/坡度上色（沙岸 / 草地 / 岩石）
const cSand = lin(0xcdbb8e), cGrass = lin(0x82bd63), cGrass2 = lin(0x6fae57), cRock = lin(0x9a8e7c);
const _tColors = new Float32Array(tp.count * 3); const _cTmp = new THREE.Color();
// 依目前 openness 重算地形頂點高度＋法線＋頂點色；可重複呼叫（夜→日群山沉降時再算一次，被終局運鏡蓋住）
function displaceTerrain() {
  for (let i = 0; i < tp.count; i++) tp.setY(i, terrainHeight(tp.getX(i), tp.getZ(i)));
  tp.needsUpdate = true; tGeo.computeVertexNormals();
  const nrm = tGeo.attributes.normal;
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i), slope = 1 - nrm.getY(i);
    let c;
    if (y < WORLD.water + 1.2) c = cSand;
    else if (y > 15 || slope > 0.5) c = cRock;
    else c = _cTmp.copy(cGrass).lerp(cGrass2, Math.sin(x * 0.12) * Math.sin(z * 0.11) * 0.5 + 0.5); // 平滑色塊，避免格紋
    _tColors[i * 3] = c.r; _tColors[i * 3 + 1] = c.g; _tColors[i * 3 + 2] = c.b;
  }
  if (tGeo.attributes.color) { tGeo.attributes.color.array.set(_tColors); tGeo.attributes.color.needsUpdate = true; }
  else tGeo.setAttribute('color', new THREE.BufferAttribute(_tColors, 3));
}
displaceTerrain();   // 建場：夜
// ── 沒有牆的大陸：全清變白天後群山沉降、可走範圍向海岸敞開（夜＝有界，維持現狀）──
let worldOpen = false;
const DAY_MAXR = 245;                                  // 白天可走到海岸淺灘（再外是海＋海霧）
const worldLim = () => (worldOpen ? DAY_MAXR : WORLD.maxR);
function setWorldOpen(open) { if (open === worldOpen) return; worldOpen = open; setTerrainOpenness(open ? 1 : 0); displaceTerrain(); } // 群山沉降↔回復（重算一次）

// ── 玩家剛體碰撞（kinematic）：實體＝圓 / 有向矩形；移動後把玩家推出重疊（depenetration）→ 撞到會停、沿牆滑，無需物理引擎/尋路 ──
const HERO_R = 0.6;
const circleCols = [], boxCols = [];                       // 圓 {x,z,r,day} ／ 有向矩形 {x,z,hw,hd,c,s,day}（day＝僅白天敞開時生效）
const addCircleCol = (x, z, r, day = false) => circleCols.push({ x, z, r, day });
const addBoxCol = (x, z, hw, hd, ry, day = false) => boxCols.push({ x, z, hw, hd, c: Math.cos(ry), s: Math.sin(ry), day });
function resolveHeroCollision() {
  let px = hero.position.x, pz = hero.position.z;
  for (let it = 0; it < 2; it++) {                         // 2 次迭代：處理夾在兩個碰撞體之間的角落
    for (const o of circleCols) {
      if (o.day && !worldOpen) continue;
      const dx = px - o.x, dz = pz - o.z, rr = HERO_R + o.r, d2 = dx * dx + dz * dz;
      if (d2 < rr * rr && d2 > 1e-9) { const d = Math.sqrt(d2), k = (rr - d) / d; px += dx * k; pz += dz * k; }
    }
    for (const o of boxCols) {
      if (o.day && !worldOpen) continue;
      const rx = px - o.x, rz = pz - o.z;
      let lx = rx * o.c - rz * o.s, lz = rx * o.s + rz * o.c;                                       // 世界→盒局部
      const cx = Math.max(-o.hw, Math.min(o.hw, lx)), cz = Math.max(-o.hd, Math.min(o.hd, lz));      // 盒上離玩家最近的點
      let nx = lx - cx, nz = lz - cz; const d2 = nx * nx + nz * nz;
      if (d2 > HERO_R * HERO_R) continue;
      if (d2 > 1e-9) { const d = Math.sqrt(d2), k = (HERO_R - d) / d; lx += nx * k; lz += nz * k; }   // 邊/角：沿法線推出
      else { const ex = o.hw - Math.abs(lx) + HERO_R, ez = o.hd - Math.abs(lz) + HERO_R;              // 圓心落在盒內：沿最小穿透軸推出
        if (ex < ez) lx = (lx < 0 ? -1 : 1) * (o.hw + HERO_R); else lz = (lz < 0 ? -1 : 1) * (o.hd + HERO_R); }
      px = o.x + lx * o.c + lz * o.s; pz = o.z - lx * o.s + lz * o.c;                                 // 盒局部→世界
    }
  }
  hero.position.x = px; hero.position.z = pz;
}
// 地形材質：保留 vertexColors 分區，草地區（頂點色 g>r）以 shader 混入草皮細節、雙尺度打散重複；沙/岩不受影響
const grassTex = tex('./tex/grass.webp?v=71295972', 1, 1, true);
const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 1, normalMap: tex('./tex/ground_n.webp?v=71295972', 112, 112), normalScale: new THREE.Vector2(0.5, 0.5) });
terrainMat.onBeforeCompile = (sh) => {
  sh.uniforms.grassMap = { value: grassTex };
  sh.vertexShader = 'varying vec2 vTerUv;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vTerUv = uv;');
  sh.fragmentShader = 'uniform sampler2D grassMap;\nvarying vec2 vTerUv;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  {
    float gm = smoothstep(0.04, 0.16, vColor.g - vColor.r);                 // 只在草地（綠>紅）混入
    vec3 grass = mix(texture2D(grassMap, vTerUv * 67.0).rgb, texture2D(grassMap, vTerUv * 17.0).rgb, 0.5); // 雙尺度打散重複（隨地圖放大提高重複數維持密度）
    float gv = dot(grass, vec3(0.299, 0.587, 0.114));
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.72 + gv * 0.62), gm); // 以草皮明暗調變綠地、保留綠色基調
  }`);
};
const terrain = new THREE.Mesh(tGeo, terrainMat);
terrain.receiveShadow = true;
scene.add(terrain);

// 近岸淡入遮罩（載入時烘焙一次）：在世界 ±half 取樣「白天」地形高度，存「水深→不透明度」值。
// 水面 shader 用它在近岸把 alpha 漸隱成柔邊，取代「平面水體 ∩ 斜岸」那條會隨相機掃動而閃爍的硬深度交線。
// 烘焙制＝零每幀額外 GPU（不做深度預渲染）。內陸湖夜/日地形相同、白天海岸正確；夜晚外海被群山遮住不影響。
const SHORE_FADE = 1.6; // 從岸線往深處此距離內 alpha 由 0→1
const shoreTex = (() => {
  const N = 512, data = new Uint8Array(N * N * 4), H = WORLD.half;
  setTerrainOpenness(1);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i / (N - 1) * 2 - 1) * H, z = (j / (N - 1) * 2 - 1) * H;
    const a = Math.max(0, Math.min(1, (WORLD.water - terrainHeight(x, z)) / SHORE_FADE));
    const v = (a * 255) | 0, o = (j * N + i) * 4; data[o] = v; data[o + 1] = v; data[o + 2] = v; data[o + 3] = 255;
  }
  setTerrainOpenness(worldOpen ? 1 : 0); // 還原（載入時為夜晚 0）
  const t = new THREE.DataTexture(data, N, N); t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t;
})();
// 海面（單層・平面・不反光，MeshBasic）：一張大平面(±1600)鋪到霧化海平線，無第二層＝無 z-fighting。
// transparent(0.82)＋depthWrite:false；顏色隨 vibrancy 日夜變化（見 animate）。近岸 alpha 由 shoreTex 漸隱＝柔化海岸線。
const waterMat = new THREE.MeshBasicMaterial({ color: 0x4f9fd0, transparent: true, opacity: 0.82, depthWrite: false, fog: true });
waterMat.onBeforeCompile = (sh) => {
  sh.uniforms.tShore = { value: shoreTex };
  sh.uniforms.uHalf = { value: WORLD.half };
  sh.vertexShader = 'varying vec3 vWorldP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = 'uniform sampler2D tShore;\nuniform float uHalf;\nvarying vec3 vWorldP;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec2 suv = vWorldP.xz / (2.0 * uHalf) + 0.5;                                  // 世界座標→遮罩 UV
    float sa = (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) ? 1.0 : texture2D(tShore, suv).r; // 出地形範圍＝深海全不透明
    diffuseColor.a *= sa;                                                          // 近岸漸隱＝柔邊（消除硬交線的相機掃動閃爍）
  }`);
};
const water = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), waterMat);
water.rotation.x = -Math.PI / 2; water.position.y = WORLD.water; water.renderOrder = -1;
scene.add(water);

// ── 遺跡座標（先算位置，植被才能避開）────────────────────────────
const ruinAt = RUINS.map((r) => {
  const a = r.angle * Math.PI / 180;
  const x = Math.cos(a) * r.radius, z = Math.sin(a) * r.radius;
  return { ...r, x, z, y: groundY(x, z) };
});
// OCF 紀念碑座標（先算好，植被才能避開）
const ocfAt = (() => { const a = OCF_STATUE.angle * Math.PI / 180; const x = Math.cos(a) * OCF_STATUE.radius, z = Math.sin(a) * OCF_STATUE.radius; return { x, z, y: groundY(x, z) }; })();
addCircleCol(ocfAt.x, ocfAt.z, 1.4);   // OCF 紀念碑實體
// 守護者紀念碑 / CSCS 夥伴牆：從村莊出口打散到荒野各方位（dayOnly）；先記座標供植被避開＋擺放＋碰撞共用（同 ocfAt 手法、單一真實來源）
const STELE_AT = { x: -149.5, z: -69.7 }, WALL_AT = { x: 86, z: 122.9 };
function nearAnyRuin(x, z, d) {
  if (Math.hypot(x - ocfAt.x, z - ocfAt.z) < d) return true;
  if (Math.hypot(x - STELE_AT.x, z - STELE_AT.z) < d || Math.hypot(x - WALL_AT.x, z - WALL_AT.z) < d) return true;
  for (const r of ruinAt) if (Math.hypot(x - r.x, z - r.z) < d) return true;
  return false;
}

// ── 植被（InstancedMesh）─────────────────────────────────────────
const dummy = new THREE.Object3D();
function instance(geo, material, placements) {
  const m = new THREE.InstancedMesh(geo, material, placements.length);
  m.castShadow = true;
  placements.forEach((p, i) => {
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(0, p.ry || 0, 0);
    dummy.scale.set(p.s, p.sy || p.s, p.s);
    dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  });
  m.instanceMatrix.needsUpdate = true;
  scene.add(m);
  return m;
}
// 取得散落點
function scatter(n, rMin, rMax, minH, avoidRuin) {
  const out = [];
  let tries = 0;
  while (out.length < n && tries < n * 25) {
    tries++;
    const a = rand(0, TAU), r = rand(rMin, rMax);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (terrainHeight(x, z) < minH) continue;
    if (avoidRuin && nearAnyRuin(x, z, 13)) continue;
    out.push({ x, z, y: terrainHeight(x, z), ry: rand(0, TAU), s: rand(0.7, 1.5) });
  }
  return out;
}
// 樹（針葉）：樹冠 + 樹幹兩個 instanced mesh 共用座標
const foliageGeo = mergeGeometries([0, 1, 2].map((k) => {
  const c = new THREE.ConeGeometry(1.7 - k * 0.42, 1.8, 12); c.translate(0, 2.4 + k * 1.0 + 0.9, 0); return c;
}));
const trunkGeo = new THREE.CylinderGeometry(0.3, 0.42, 2.4, 10); trunkGeo.translate(0, 1.2, 0);
const trees = scatter(Q.rich ? 480 : 300, WORLD.villageR + 8, 172, WORLD.water + 0.8, true); // rMax 172＝夜/日地形相同的內圈，群山沉降時不會浮空
const treeFoliage = instance(foliageGeo, mat(0x4e9d54), trees);
const treeTrunk = instance(trunkGeo, mat(0xc9b79c, { map: tex('./tex/bark.webp?v=71295972', 3, 2, true), normalMap: tex('./tex/bark_n.webp?v=71295972', 3, 2), normalScale: new THREE.Vector2(0.8, 0.8) }), trees);
// 撞樹擺動會每幀更新 instanceMatrix（搖晃 ~2-3 秒才靜止）→ 標記為 DynamicDrawUsage，否則每幀重傳「靜態」緩衝會造成驅動層 stall／卡頓（走過樹叢時水面等大平面上抖動的主因）
treeFoliage.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
treeTrunk.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
// 撞樹擺動（純視覺）：每棵的傾斜彈簧狀態；玩家走進範圍 → 往遠離方向被推、再回擺站直
const treeSway = trees.map(() => ({ ang: 0, vel: 0, dx: 0, dz: 1 }));
const _tQ = new THREE.Quaternion(), _tQy = new THREE.Quaternion(), _tAx = new THREE.Vector3(), _tUp = new THREE.Vector3(0, 1, 0), _tObj = new THREE.Object3D();
// 岩石：3 種抖動石形 + 每顆隨機旋轉/非等比縮放/色調 → 自然多變（避免千篇一律）
const rockMap = tex('./tex/rock.webp?v=71295972', 1, 1, true), rockNor = tex('./tex/rock_n.webp?v=71295972', 1, 1);
const rockMat = new THREE.MeshStandardMaterial({ map: rockMap, normalMap: rockNor, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.95, metalness: 0, envMapIntensity: 0.5, color: 0xd2d0c8 }); // 色調偏中性灰，壓掉貼圖的暖粉
function craggyRockGeo(amp) {
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, 1)); // 先焊接共用頂點，沿頂點方向抖動才不會裂成尖刺
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar((v.length() + rand(-amp, amp)) / v.length()); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); boxUV(g, 1.5); return g;
}
const rockGeos = [craggyRockGeo(0.18), craggyRockGeo(0.22), craggyRockGeo(0.13)];
const rockTints = [0xa9a7a0, 0x9a988f, 0xb4b1a8, 0x8c8a82];
{
  const rockPts = scatter(Q.rich ? 250 : 160, WORLD.villageR + 4, 174, WORLD.water + 0.3, true);
  for (const p of rockPts) addCircleCol(p.x, p.z, 0.55 * p.s);   // 石頭實體（圓，半徑隨大小）
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  rockGeos.forEach((geo, gi) => {
    const pts = rockPts.filter((_, i) => i % rockGeos.length === gi);
    const im = new THREE.InstancedMesh(geo, rockMat, pts.length); im.castShadow = im.receiveShadow = true;
    pts.forEach((pt, i) => {
      dummy.position.set(pt.x, pt.y - 0.1, pt.z);
      dummy.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU));
      const s = pt.s * 0.9; dummy.scale.set(s * rand(0.8, 1.4), s * rand(0.6, 1.1), s * rand(0.8, 1.4));
      dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
      im.setColorAt(i, col.set(rockTints[(Math.random() * rockTints.length) | 0]));
    });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    scene.add(im);
  });
}
// 草叢：交叉貼片 + 草葉 alpha 貼圖（比圓錐像真草）；不投影、量大、每叢隨機朝向/高度/色調
const bladeQuad = new THREE.PlaneGeometry(1, 0.95); bladeQuad.translate(0, 0.475, 0);
const bladeQuad2 = bladeQuad.clone(); bladeQuad2.rotateY(Math.PI / 2);
const tuftGeo = mergeGeometries([bladeQuad, bladeQuad2]);
const tuftMat = new THREE.MeshStandardMaterial({ map: tex('./tex/grass_blade.webp?v=71295972', 1, 1, true), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, metalness: 0, envMapIntensity: 0.4 });
const tufts = scatter(Q.rich ? 1700 : 950, WORLD.villageR + 3, 172, WORLD.water + 0.6, false);
const tuftMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, tufts.length);
const tuftTints = [0x86c45f, 0x6fae57, 0x95cf6c, 0x5f9c49];
{ const col = new THREE.Color(); tufts.forEach((p, i) => { dummy.position.set(p.x, p.y - 0.05, p.z); dummy.rotation.set(0, p.ry, 0); const s = p.s * 0.95; dummy.scale.set(s, s * rand(0.8, 1.25), s); dummy.updateMatrix(); tuftMesh.setMatrixAt(i, dummy.matrix); tuftMesh.setColorAt(i, col.set(tuftTints[(Math.random() * tuftTints.length) | 0])); }); }
tuftMesh.instanceMatrix.needsUpdate = true; if (tuftMesh.instanceColor) tuftMesh.instanceColor.needsUpdate = true; scene.add(tuftMesh);

// ── 村莊 ────────────────────────────────────────────────────────
const village = new THREE.Group();
scene.add(village);
// 開放式自然村莊：地面＝草地（不再用石砌廣場）；泥土小徑用「程序生成貼圖＋柔邊」呈現（離線、貼地）
// 程序泥土貼圖：暖棕底＋多尺度斑塊/小石；RGBA 沿寬度(U)兩側 alpha 漸隱 → 邊緣融入草地（柔邊）
const dirtTex = (() => {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#9b7d52'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 1100; i++) { const t = Math.random();
    x.fillStyle = t < 0.5 ? `rgba(120,96,60,${rand(0.12, 0.38)})` : t < 0.82 ? `rgba(170,142,98,${rand(0.10, 0.32)})` : `rgba(78,60,38,${rand(0.16, 0.44)})`;
    x.beginPath(); x.arc(rand(0, S), rand(0, S), rand(0.6, 3.2), 0, TAU); x.fill(); }
  for (let i = 0; i < 55; i++) { x.fillStyle = `rgba(150,146,138,${rand(0.3, 0.6)})`; x.beginPath(); x.arc(rand(0, S), rand(0, S), rand(1.0, 2.2), 0, TAU); x.fill(); }
  const img = x.getImageData(0, 0, S, S);                                   // 寬度兩側 alpha 漸隱
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) { const u = px / (S - 1); const a = Math.min(1, Math.min(u, 1 - u) / 0.22); img.data[(py * S + px) * 4 + 3] = (a * 255) | 0; }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Q.aniso || 1;
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; return t;
})();
const dirtMat = new THREE.MeshStandardMaterial({ map: dirtTex, normalMap: tex('./tex/ground_n.webp?v=71295972', 1, 1), normalScale: new THREE.Vector2(0.6, 0.6), roughness: 1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
// 小徑＝沿「彎曲曲線」生成的緞帶（非直線），寬度兩側漸隱柔邊＋沿長度平鋪貼圖 → 自然蜿蜒不死板
function dirtPath(ax, az, bx, bz, w = 2.8) {
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L; // 垂直方向
  const o1 = rand(-1, 1) * Math.min(5.5, L * 0.16), o2 = rand(-1, 1) * Math.min(3.5, L * 0.1); // 蜿蜒幅度（隨長度）
  const pts = [
    new THREE.Vector3(ax, 0, az),
    new THREE.Vector3(ax + dx * 0.33 + nx * o2, 0, az + dz * 0.33 + nz * o2),
    new THREE.Vector3(ax + dx * 0.5 + nx * o1, 0, az + dz * 0.5 + nz * o1),
    new THREE.Vector3(ax + dx * 0.68 - nx * o2, 0, az + dz * 0.68 - nz * o2),
    new THREE.Vector3(bx, 0, bz),
  ];
  const curve = new THREE.CatmullRomCurve3(pts), N = Math.max(8, Math.round(L / 2)), s = curve.getPoints(N);
  const pos = [], uv = [], idx = []; let acc = 0;
  for (let i = 0; i <= N; i++) {
    const p = s[i], a = s[Math.max(0, i - 1)], b = s[Math.min(N, i + 1)];
    let tx = b.x - a.x, tz = b.z - a.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl; // 切線
    const px = -tz, pz = tx;                                                                     // 緞帶法向（XZ）
    pos.push(p.x + px * w / 2, 0.05, p.z + pz * w / 2, p.x - px * w / 2, 0.05, p.z - pz * w / 2);
    if (i > 0) acc += Math.hypot(p.x - s[i - 1].x, p.z - s[i - 1].z);
    const v = acc / 3.4; uv.push(0, v, 1, v);                                                    // U:0/1 寬度兩側(柔邊)、V:沿長度平鋪
    if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } // 正面朝上（避免背面被剔除）
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, dirtMat); m.receiveShadow = true; village.add(m);
}

// 中央水井（含屋頂、井圈）
const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 1.2, 12), mat(0xb3a48c));
wellBase.position.set(-10.2, 0.7, -10.8); wellBase.castShadow = wellBase.receiveShadow = true; village.add(wellBase);
const wellRim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.18, 10, 16), mat(0x9a8a70));
wellRim.rotation.x = Math.PI / 2; wellRim.position.set(-10.2, 1.3, -10.8); village.add(wellRim);
const wellWater = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.2, 16), mat(0x6cc5e0, { roughness: 0.2 }));
wellWater.position.set(-10.2, 1.15, -10.8); village.add(wellWater);
const wellRoof = new THREE.Group();
for (const wx of [-1.5, 1.5]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 10), mat(0x7a5230)); p.position.set(wx, 1.3, 0); p.castShadow = true; wellRoof.add(p); applyWood(p.material); boxUV(p.geometry); }
const wrf = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 8), mat(0x9c5b3a)); wrf.position.y = 3.2; wrf.rotation.y = Math.PI / 4; wrf.castShadow = true; wellRoof.add(wrf);
wellRoof.position.set(-10.2, 0, -10.8); village.add(wellRoof);
addCircleCol(-10.2, -10.8, 1.9);   // 水井實體

// （開放式村莊：移除圓形低石牆、柱帽與村口拱門 → 無硬邊界、自然融入草原）

// 小屋（石基 + 屋簷 + 煙囪 + 雙窗）
function cottage(color, roofC) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 4.7), mat(0x9a9080)); base.position.y = 0.25; base.castShadow = base.receiveShadow = true; g.add(base);
  const b = new THREE.Mesh(new THREE.BoxGeometry(5, 3.0, 4.5), mat(color)); b.position.y = 2.0; b.castShadow = b.receiveShadow = true; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(4.1, 2.6, 8), mat(roofC)); r.position.y = 4.7; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  const ch = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), mat(0x8a6a55)); ch.position.set(1.4, 5.1, -1.0); ch.castShadow = true; g.add(ch);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.12), mat(0x4a3526)); door.position.set(0, 1.45, 2.27); g.add(door);
  for (const wx of [-1.6, 1.6]) { const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.12), mat(0xffe9a8, { emissive: 0xffcf6b, emissiveIntensity: 0.9 })); win.position.set(wx, 2.3, 2.27); g.add(win); regNightGlow(win); } // 夜晚窗光更暖
  return g;
}
const cottageColors = [[0x8fb98f, 0x55794f], [0xd9a577, 0x9c6b41], [0x8aa6c9, 0x4f6c92], [0xc98f9b, 0x8a5663], [0xcdb87e, 0x8a6e3a]];
// 民房：環繞中央水晶的有機聚落，放大後分層散佈 r24–35（門面朝水晶；放大後地形 villageR58 → r35 內仍平坦）
const houseSpots = [[24, 6], [30, -10], [34, 2], [14, -26], [-14, -26], [-28, -8], [-26, 12], [-32, 2]];
houseSpots.forEach((s, i) => { const c = cottage(...cottageColors[i % cottageColors.length]); c.position.set(s[0], groundY(s[0], s[1]), s[1]); c.rotation.y = Math.atan2(-s[0], -s[1]); village.add(c); });
houseSpots.forEach((s) => addBoxCol(s[0], s[1], 2.6, 2.35, Math.atan2(-s[0], -s[1])));   // 房子實體（有向矩形）

// 泥土小徑網：中央 hub 往各民房／水井／告示牌／檔案室／出村方向放射（隨村莊放大而加長）
const HUB = [0, 5];
for (const s of houseSpots) { const r = Math.hypot(s[0], s[1]) || 1, e = (r - 2.6) / r; dirtPath(HUB[0], HUB[1], s[0] * e, s[1] * e); } // 延伸到屋前門口
dirtPath(HUB[0], HUB[1], -10.2, -10.8, 2.4);   // 水井
dirtPath(HUB[0], HUB[1], -9.2, 12, 2.4);       // 告示牌
dirtPath(HUB[0], HUB[1], -12, 5.5, 2.4);       // 檔案室
dirtPath(0, 4, 0, 30, 3.0);                    // 出村大道（接白天入口紀念大道方向 z36）

// ── 田園裝點（低多邊形、純裝飾、顧手機；手機檔減量）──────────────
function marketStall(x, z, awn) {
  const g = new THREE.Group();
  for (const px of [-1.3, 1.3]) for (const pz of [-0.9, 0.9]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), mat(0x7a5230)); p.position.set(px, 1.1, pz); p.castShadow = true; g.add(p); applyWood(p.material); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 2.4), mat(awn, { emissive: awn, emissiveIntensity: 0.08 })); top.position.y = 2.3; top.castShadow = true; g.add(top);
  const table = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 1.2), mat(0x8a6a3f)); table.position.set(0, 1.0, 0.5); table.castShadow = true; g.add(table); applyWood(table.material);
  for (let i = 0; i < 3; i++) { const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat(0x9c7a4a)); crate.position.set(-1 + i, 1.3, 0.5); g.add(crate); applyWood(crate.material); }
  g.position.set(x, groundY(x, z), z); g.rotation.y = Math.atan2(-x, -z); village.add(g);
  addBoxCol(x, z, 1.6, 1.0, Math.atan2(-x, -z));   // 市集攤實體
}
function gardenPatch(x, z) {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.2, 2.0), mat(0x5e4630)); soil.position.y = 0.1; soil.receiveShadow = true; g.add(soil);
  for (let r = -1; r <= 1; r++) for (let c = -2; c <= 2; c++) { const crop = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), mat(0x6fae57)); crop.position.set(c * 0.55, 0.45, r * 0.6); g.add(crop); }
  g.position.set(x, groundY(x, z) + 0.02, z); g.rotation.y = rand(0, TAU); village.add(g);
}
function fence(ax, az, bx, bz) {
  const len = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(len / 1.4));
  for (let i = 0; i <= n; i++) { const t = i / n; const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.1, 6), mat(0x6b5a44)); post.position.set(ax + (bx - ax) * t, 0.55, az + (bz - az) * t); post.castShadow = true; village.add(post); applyWood(post.material); }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, len), mat(0x6b5a44)); rail.position.set((ax + bx) / 2, 0.78, (az + bz) / 2); rail.rotation.y = Math.atan2(bx - ax, bz - az); village.add(rail); applyWood(rail.material);
}
function hayPile(x, z) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 1.0, 10), mat(0xd9b65a)); a.rotation.z = Math.PI / 2; a.position.set(x, groundY(x, z) + 0.6, z); a.castShadow = true; village.add(a); }
const dress = TIER !== 'low';
marketStall(8, 11, 0xff7a45); marketStall(-9, 10, 0x5b9cff); if (dress) marketStall(0, 17, 0xffd166); // 中央小市集
gardenPatch(17, -3); gardenPatch(-17, -3); gardenPatch(6, -19); if (dress) { gardenPatch(-6, -19); gardenPatch(20, 13); }
fence(14, -6, 20, -6); fence(-14, -6, -20, -6); if (dress) fence(3, -22, 9, -22);
hayPile(13, 13); hayPile(-13, 13); if (dress) hayPile(-20, -16);

// 提燈路燈：沿主要小徑點亮夜路（隨村莊放大而分散）
for (const lp of [[6, 13], [-6, 13], [12, -5], [-12, -5], [18, -16], [-18, -16], [0, 24]]) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.6, 10), mat(0x55514a)); pole.position.y = 1.8; pole.castShadow = true; g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), mat(0x55514a)); arm.position.set(0.3, 3.5, 0); g.add(arm);
  const lan = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), mat(0xffe6a0, { emissive: 0xffcf6b, emissiveIntensity: 2.2 })); lan.position.set(0.55, 3.3, 0); g.add(lan); regNightGlow(lan); // 提高到 bloom 門檻(1.05)以上 → 夜晚發光暈
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffdf9a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.copy(lan.position); g.add(halo); nightHalo.push({ m: halo.material, base: 0.45 }); // 柔光暈（手機無 bloom 也看得到亮）
  g.position.set(lp[0], 0, lp[1]); g.rotation.y = rand(0, TAU); village.add(g);
}

// 綠化：灌木、花、角落樹、旗幟（放大後加量、擴大範圍、用 groundY 貼地）
for (let i = 0; i < 20; i++) { const a = rand(0, TAU), rr = rand(8, 40), x = Math.cos(a) * rr, z = Math.sin(a) * rr; const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.6, 1.2), 1), mat(0x6fae57)); bush.position.set(x, groundY(x, z) + 0.4, z); bush.scale.y = 0.8; bush.castShadow = true; village.add(bush); }
const flowerC = [0xff6f91, 0xffd166, 0xc792ea, 0xffffff];
for (let i = 0; i < 30; i++) { const a = rand(0, TAU), rr = rand(6, 42), x = Math.cos(a) * rr, z = Math.sin(a) * rr; const f = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), mat(flowerC[(Math.random() * flowerC.length) | 0])); f.position.set(x, groundY(x, z) + 0.25, z); village.add(f); }
// （村內不放大棵點綴樹：保持村莊開闊空間；外圍森林由 InstancedMesh `trees` 提供。先前 7 棵村緣點綴樹已移除——它們是固定座標、且用較簡化的 builder（無樹皮貼圖）故與森林樹外觀不一致）
for (const fp of [[-8, 2, 0x5b9cff], [9, 1, 0xff7a45]]) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 10), mat(0x6b5a44)); pole.position.set(fp[0], 2.5, fp[1]); pole.castShadow = true; village.add(pole); applyWood(pole.material); boxUV(pole.geometry);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.08), mat(fp[2], { emissive: fp[2], emissiveIntensity: 0.12 })); flag.position.set(fp[0] + 0.95, 4.0, fp[1]); village.add(flag);
}

// 村長告示牌（任務起點，造型升級）
const board = new THREE.Group();
for (const bx of [-1.4, 1.4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 3.4, 12), mat(0x7a5230)); p.position.set(bx, 1.7, 0); p.castShadow = true; board.add(p); applyWood(p.material); boxUV(p.geometry); }
const sign = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 0.25), mat(0xe7c884)); sign.position.set(0, 2.9, 0); sign.castShadow = true; board.add(sign); applyWood(sign.material); boxUV(sign.geometry);
const frame = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.25, 0.3), mat(0x9c6b41)); frame.position.set(0, 4.05, 0); board.add(frame); applyWood(frame.material); boxUV(frame.geometry);
const roofb = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.5, 1.2), mat(0x9c5b3a)); roofb.position.set(0, 4.35, 0); roofb.castShadow = true; board.add(roofb);
board.position.set(-9.2, 0, 13.1); board.rotation.y = Math.atan2(-board.position.x, -board.position.z); village.add(board); // 面朝中央水晶（村心）
addBoxCol(-9.2, 13.1, 1.9, 0.35, Math.atan2(9.2, -13.1));   // 告示牌實體（薄盒；POI openDist 4.5 仍可讀）

// 村莊中央大水晶（全部遺跡進化後才啟動）
const greatBase = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 1.2, 12), mat(0x9a9080)); greatBase.position.set(0, 0.6, 0); greatBase.castShadow = greatBase.receiveShadow = true; village.add(greatBase); applyStone(greatBase.material); boxUV(greatBase.geometry);
const greatBase2 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 0.8, 12), mat(0xb0a896)); greatBase2.position.set(0, 1.4, 0); greatBase2.castShadow = true; village.add(greatBase2); applyStone(greatBase2.material); boxUV(greatBase2.geometry);
addCircleCol(0, 0, 3.0);   // 中央水晶石座實體
const greatMat = new THREE.MeshStandardMaterial({ color: 0x8a93a0, emissive: 0x20242b, emissiveIntensity: 0.4, roughness: 0.15, metalness: 0.35, flatShading: false });
const greatCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 1), greatMat); greatCrystal.position.set(0, 5.4, 0); greatCrystal.castShadow = true; village.add(greatCrystal);
const greatBeamMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
const greatBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.85, 90, 18, 1, true), greatBeamMat); greatBeam.position.set(0, 46, 0); village.add(greatBeam); // 細長光柱，避免擋住正前方視野
const GREAT_D = new THREE.Color(0x8a93a0), GREAT_A = new THREE.Color(0xffe6a0);
// 能量碎片：每座遺跡一片，進化後亮起（可見的充能進度）
const shardGroup = new THREE.Group(); shardGroup.position.set(0, 5.4, 0); village.add(shardGroup);
const shards = ruinAt.map((r, i) => {
  const a = i / ruinAt.length * TAU;
  const m = new THREE.MeshStandardMaterial({ color: 0x3a3f48, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.3, metalness: 0.4, flatShading: false });
  const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 1), m);
  s.position.set(Math.cos(a) * 3.0, 0, Math.sin(a) * 3.0); s.castShadow = true; shardGroup.add(s);
  return { mesh: s, mat: m, id: r.id, color: new THREE.Color(r.color), glow: 0, ox: Math.cos(a) * 3.0 };
});

// ── 遺跡 ────────────────────────────────────────────────────────
// 遺跡共用材質與幾何
const RUIN = { stone: mat(0xb0a896), stoneDk: mat(0x827a6d), stoneIn: mat(0x968d7c), moss: mat(0x6f8f4e), wood: mat(0x8a6a3f), woodDk: mat(0x6e5230), dark: mat(0x2c2a28) };
applyStone(RUIN.stone); applyStone(RUIN.stoneDk); applyStone(RUIN.stoneIn);   // 遺跡/紀念碑石材＝水泥
applyWood(RUIN.wood); applyWood(RUIN.woodDk);                                  // 市集等木造
const STONE_MATS = new Set([RUIN.stone, RUIN.stoneDk, RUIN.stoneIn, RUIN.wood, RUIN.woodDk]);
const texturizeStone = (obj) => obj.traverse((o) => { if (o.isMesh && STONE_MATS.has(o.material)) boxUV(o.geometry); }); // 對石材網格烘 boxUV（任意大小密度一致）
const beamGeo = new THREE.CylinderGeometry(0.6, 1.5, 46, 12, 1, true);
const rubbleGeo = new THREE.DodecahedronGeometry(0.5, 0);
function buildRuin(r) {
  const g = new THREE.Group();
  g.position.set(r.x, r.y, r.z);
  const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const add = (geo, m, x, y, z, ry) => { const o = cast(new THREE.Mesh(geo, m)); o.position.set(x, y, z); if (ry) o.rotation.y = ry; g.add(o); return o; };

  // 階梯式八角平台
  add(new THREE.CylinderGeometry(6.4, 6.9, 0.6, 12), RUIN.stoneDk, 0, 0.3, 0, Math.PI / 8);
  add(new THREE.CylinderGeometry(5.4, 5.7, 0.5, 12), RUIN.stone, 0, 0.8, 0, Math.PI / 8);
  add(new THREE.CylinderGeometry(4.6, 4.8, 0.3, 12), RUIN.stoneIn, 0, 1.15, 0, Math.PI / 8);
  // 邊緣破損石塊（部分缺角、偶有苔蘚）
  for (let i = 0; i < 8; i++) {
    if (i === 2 || i === 6) continue;
    const a = i / 8 * TAU, hx = i % 3 ? 0.7 : 0.4;
    add(new THREE.BoxGeometry(1.5, hx, 1.1), i % 2 ? RUIN.stone : RUIN.stoneDk, Math.cos(a) * 5.7, 1.1 + hx / 2, Math.sin(a) * 5.7, a);
    if (i % 3 === 0) add(new THREE.IcosahedronGeometry(0.5, 1), RUIN.moss, Math.cos(a) * 5.7, 1.55, Math.sin(a) * 5.7).scale.set(1, 0.4, 1);
  }
  // 散落碎石
  for (let i = 0; i < 7; i++) { const a = rand(0, TAU), rr = rand(6.6, 8.6), s = rand(0.4, 0.9); const o = add(rubbleGeo, i % 2 ? RUIN.stone : RUIN.stoneDk, Math.cos(a) * rr, s * 0.4, Math.sin(a) * rr); o.scale.setScalar(s); o.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); }

  if (r.style === 'grove') { // 森林石拱
    const col = (x, h) => { add(new THREE.CylinderGeometry(0.5, 0.58, h, 12), RUIN.stone, x, 1.3 + h / 2, -2.8); add(new THREE.IcosahedronGeometry(0.42, 1), RUIN.moss, x, 1.3 + h * 0.78, -2.5).scale.set(1, 0.5, 1); };
    col(-2.4, 4.6); col(2.4, 4.6);
    add(new THREE.BoxGeometry(2.5, 0.7, 1.0), RUIN.stoneDk, -1.35, 6.05, -2.8, 0.12);
    add(new THREE.BoxGeometry(2.5, 0.7, 1.0), RUIN.stoneDk, 1.35, 6.05, -2.8, -0.12);
    for (const s of [[-4.2, 1.6, 2.2], [4.2, 1.4, 1.6], [-3.6, -1.2, 1.2]]) add(new THREE.CylinderGeometry(0.42, 0.5, s[2], 10), RUIN.stone, s[0], 1.3 + s[2] / 2, s[1]);
  } else if (r.style === 'fortress') { // 破城牆 + 雉堞
    const seg = (a, h) => {
      const x = Math.cos(a) * 4.0, z = Math.sin(a) * 4.0;
      add(new THREE.BoxGeometry(2.8, h, 1.2), RUIN.stone, x, 1.3 + h / 2, z, a + Math.PI / 2);
      for (const o of [-0.85, 0, 0.85]) add(new THREE.BoxGeometry(0.6, 0.6, 1.2), RUIN.stoneDk, x + Math.cos(a + Math.PI / 2) * o, 1.3 + h + 0.3, z + Math.sin(a + Math.PI / 2) * o, a + Math.PI / 2);
    };
    seg(Math.PI * 0.5, 3.4); seg(Math.PI * 0.92, 4.0); seg(Math.PI * 1.34, 2.4); seg(Math.PI * 1.72, 3.8);
    for (let i = 0; i < 4; i++) add(rubbleGeo, RUIN.stoneDk, 3.6 + rand(-0.6, 0.6), rand(1.3, 2.3), -0.5 + rand(-0.8, 0.8)).scale.setScalar(rand(0.6, 1.0));
  } else if (r.style === 'tower') { // 崩塌圓塔 + 門洞
    const tg = new THREE.Group(); tg.position.set(0, 0, -3.2);
    let y = 1.0; const rad = [1.9, 1.7, 1.5, 1.2];
    for (let k = 0; k < 4; k++) { const seg = cast(new THREE.Mesh(new THREE.CylinderGeometry(rad[k] - 0.12, rad[k], 1.8, 10), k % 2 ? RUIN.stoneDk : RUIN.stone)); seg.position.y = y + 0.9; tg.add(seg); y += 1.8; }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; const j = cast(new THREE.Mesh(new THREE.BoxGeometry(0.6, rand(0.4, 1.0), 0.6), RUIN.stone)); j.position.set(Math.cos(a) * 1.0, y + 0.1, Math.sin(a) * 1.0); tg.add(j); }
    tg.rotation.z = 0.05; g.add(tg);
    add(new THREE.BoxGeometry(0.95, 1.6, 0.5), RUIN.dark, 0, 2.0, -1.65);
    add(rubbleGeo, RUIN.stone, 2.6, 0.6, -0.2).scale.setScalar(1.0); add(rubbleGeo, RUIN.stoneDk, -2.5, 0.5, 0.4).scale.setScalar(0.8);
  } else if (r.style === 'obelisk') { // 方尖碑 + 符文
    const ob = new THREE.Group(); ob.position.set(0, 0, -3.4);
    const shaft = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.0, 8.4, 4), RUIN.stone)); shaft.position.y = 5.5; shaft.rotation.y = Math.PI / 4; ob.add(shaft);
    const cap = cast(new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.4, 4), RUIN.stoneDk)); cap.position.y = 10.4; cap.rotation.y = Math.PI / 4; ob.add(cap);
    for (const yy of [3.2, 5.4, 7.6]) { const rune = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.34, 1.18), RUIN.dark); rune.position.y = yy; rune.rotation.y = Math.PI / 4; ob.add(rune); }
    g.add(ob);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; add(new THREE.CylinderGeometry(0.3, 0.4, rand(1.0, 1.8), 10), RUIN.stone, Math.cos(a) * 4.0, 2.0, Math.sin(a) * 4.0); }
  } else { // market：市集棚架
    const stall = (sx, rot) => {
      const s = new THREE.Group();
      for (const px of [-1.6, 1.6]) for (const pz of [-0.9, 0.9]) { const p = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3, 10), RUIN.wood)); p.position.set(px, 2.6, pz); s.add(p); }
      const canopy = cast(new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 2.4), mat(r.color, { roughness: 0.85 }))); canopy.position.y = 4.1; canopy.rotation.x = 0.08; s.add(canopy);
      const stripe = cast(new THREE.Mesh(new THREE.BoxGeometry(4, 0.32, 0.5), RUIN.woodDk)); stripe.position.set(0, 4.12, 0); s.add(stripe);
      s.position.set(sx, 0, 0); s.rotation.y = rot; g.add(s);
    };
    stall(-3.3, 0.14); stall(3.3, -0.1);
    add(new THREE.BoxGeometry(1.3, 1.3, 1.3), RUIN.wood, -2.7, 1.95, 1.7, 0.3);
    add(new THREE.BoxGeometry(1.0, 1.0, 1.0), RUIN.woodDk, -1.9, 1.8, 2.3, -0.2);
    add(new THREE.CylinderGeometry(0.65, 0.78, 1.5, 10), RUIN.woodDk, 3.0, 2.05, 1.5);
  }

  // 中央祭壇
  add(new THREE.CylinderGeometry(1.5, 1.75, 0.8, 12), RUIN.stoneDk, 0, 1.55, 0, Math.PI / 8);
  add(new THREE.CylinderGeometry(1.05, 1.3, 0.55, 12), RUIN.stone, 0, 2.05, 0, Math.PI / 8);
  // 浮空水晶 + 光環（光環共用 beamMat → 發現後一起變色變亮）
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, emissive: 0x2a2f38, emissiveIntensity: 0.5, roughness: 0.15, metalness: 0.2, flatShading: false });
  const crystal = cast(new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 1), crystalMat));
  crystal.position.y = 3.4; g.add(crystal);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xbfc6cf, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.12, 8, 22), beamMat); halo.rotation.x = Math.PI / 2; crystal.add(halo);
  const beam = new THREE.Mesh(beamGeo, beamMat); beam.position.y = 23.5; g.add(beam);
  // 發現後才亮起：地面彩色光環 + 環繞光點
  const aura = new THREE.Mesh(new THREE.RingGeometry(1.8, 3.4, 32), beamMat); aura.rotation.x = -Math.PI / 2; aura.position.y = 1.32; g.add(aura);
  const motes = new THREE.Group(); motes.visible = false;
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; const mote = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), crystalMat); mote.position.set(Math.cos(a) * 1.7, Math.sin(i * 1.3) * 0.4, Math.sin(a) * 1.7); motes.add(mote); }
  crystal.add(motes);
  scene.add(g);
  return { group: g, crystal, crystalMat, beamMat, motes };
}

// OCF 紀念碑（金色，與遺跡風格區隔：石基座 + 紀念碑石板 + 發光地球儀）
function buildOcf() {
  const g = new THREE.Group();
  const col = new THREE.Color(OCF_STATUE.color);
  const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const add = (geo, m, x, y, z, ry) => { const o = cast(new THREE.Mesh(geo, m)); o.position.set(x, y, z); if (ry) o.rotation.y = ry; g.add(o); return o; };
  // 分層石基座
  add(new THREE.CylinderGeometry(3.0, 3.4, 0.6, 12), RUIN.stoneDk, 0, 0.3, 0);
  add(new THREE.CylinderGeometry(2.3, 2.6, 0.5, 12), RUIN.stone, 0, 0.75, 0);
  add(new THREE.CylinderGeometry(1.7, 1.9, 0.4, 12), RUIN.stoneIn, 0, 1.1, 0);
  // 直立紀念碑石板 + 頂楣
  add(new THREE.BoxGeometry(2.6, 4.2, 0.7), RUIN.stone, 0, 3.4, 0);
  add(new THREE.BoxGeometry(2.9, 0.45, 0.95), RUIN.stoneDk, 0, 5.5, 0);
  // 金色銘牌框 + OCF 標誌（朝向村莊／玩家）
  const plaqueMat = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.9), emissive: col.clone(), emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.5, flatShading: false });
  add(new THREE.BoxGeometry(2.4, 1.12, 0.12), plaqueMat, 0, 3.6, 0.36);
  const logoTex = new THREE.TextureLoader().load('./ocf_logo.png?v=71295972'); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.anisotropy = 4;
  const signMat = new THREE.MeshBasicMaterial({ map: logoTex });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.94), signMat); sign.position.set(0, 3.6, 0.43); g.add(sign);
  // 頂端發光地球儀 + 經緯環（象徵「開放」）
  const globeMat = new THREE.MeshStandardMaterial({ color: col.clone(), emissive: col.clone(), emissiveIntensity: 1.1, roughness: 0.25, metalness: 0.1, flatShading: false });
  const globe = cast(new THREE.Mesh(new THREE.SphereGeometry(0.95, 18, 14), globeMat)); globe.position.y = 6.6; g.add(globe);
  const ringMat = new THREE.MeshBasicMaterial({ color: col.clone(), transparent: true, opacity: 0.85 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.06, 8, 28), ringMat); ring1.rotation.x = Math.PI / 2; globe.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.06, 8, 28), ringMat); ring2.rotation.y = Math.PI / 2.4; globe.add(ring2);
  // 柔光暈 + 上升光束 + 地面光環（沿用遺跡材質手法）
  const glowMat = new THREE.MeshBasicMaterial({ color: col.clone(), transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.18, 8, 24), glowMat); halo.rotation.x = Math.PI / 2; halo.position.y = 6.6; g.add(halo);
  const beam = new THREE.Mesh(beamGeo, glowMat); beam.position.y = 24; g.add(beam);
  const aura = new THREE.Mesh(new THREE.RingGeometry(1.4, 2.6, 28), glowMat); aura.rotation.x = -Math.PI / 2; aura.position.y = 1.32; g.add(aura);
  scene.add(g);
  return { group: g, globe, globeMat, ringMat, glowMat, plaqueMat, signMat };
}

// ── 興趣點（POI）：村莊告示牌 + 各遺跡 ───────────────────────────
const POIS = [];
function makeLabel(text) { const el = document.createElement('div'); el.className = 'tag'; el.textContent = text; const o = new CSS2DObject(el); return { el, o }; }
// 告示牌 POI
{
  const lab = makeLabel(`${VILLAGE_BOARD.emoji} ${UI.labelBoard}`); lab.o.position.set(0, 5.4, 0); board.add(lab.o);
  POIS.push({ data: VILLAGE_BOARD, isRuin: false, pos: new THREE.Vector3(-9.2, 0, 13.1), el: lab.el, openDist: 4.5 });
}
// 遺跡 POI
ruinAt.forEach((r) => {
  const built = buildRuin(r); texturizeStone(built.group); addCircleCol(r.x, r.z, 4);   // 遺跡中央結構實體（保守半徑：外圈碎片 rr7-9 與 POI openDist 6.5 仍可達）
  const lab = makeLabel(UI.ruinUnknownLabel); lab.o.position.set(0, 9, 0); built.group.add(lab.o);
  POIS.push({ data: r, isRuin: true, pos: new THREE.Vector3(r.x, r.y, r.z), el: lab.el, openDist: 6.5, discoverDist: 8, ...built, lift: 0 });
});
// OCF 紀念碑 POI（非課程：無戰鬥、不計進度、不影響繁榮度與終局）
// 每次遊戲載入都從「未點亮」開始，玩家靠近才點燃（本次遊玩內保持點亮）＝給 OCF 添柴火的儀式感
const ocfMon = (() => {
  const built = buildOcf(); texturizeStone(built.group);
  built.group.position.set(ocfAt.x, ocfAt.y, ocfAt.z);
  built.group.rotation.y = Math.atan2(-ocfAt.x, -ocfAt.z);
  const lab = makeLabel(`${OCF_STATUE.emoji} ${UI.labelOcf}`); lab.o.position.set(0, 8, 0); built.group.add(lab.o);
  POIS.push({ data: OCF_STATUE, isRuin: false, pos: new THREE.Vector3(ocfAt.x, ocfAt.y, ocfAt.z), el: lab.el, openDist: 6 });
  return { ...built, pos: new THREE.Vector3(ocfAt.x, ocfAt.y, ocfAt.z), el: lab.el, lit: 0, ignited: false };
})();
const OCF_GOLD = new THREE.Color(OCF_STATUE.color);

// ── 通關後白天世界（worldOpen）三建物：守護者紀念碑、守護燈塔、OCF×CSCS 夥伴牆 ──
// 皆只在白天（全清）現身；用 POI 面板（dayOnly）顯示內容。沿用 buildOcf 的石材＋加成光暈手法。
function buildLessonStele() {
  const g = new THREE.Group();
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  add(new THREE.CylinderGeometry(2.6, 3.0, 0.6, 12), RUIN.stoneDk, 0, 0.3, 0);
  add(new THREE.CylinderGeometry(2.0, 2.3, 0.5, 12), RUIN.stone, 0, 0.75, 0);
  add(new THREE.BoxGeometry(2.4, 3.8, 0.6), RUIN.stone, 0, 2.9, 0);          // 直立石板
  add(new THREE.BoxGeometry(2.7, 0.4, 0.85), RUIN.stoneDk, 0, 4.9, 0);       // 頂楣
  const gemMat = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x4aa9ff, emissiveIntensity: 1.4, roughness: 0.25, metalness: 0.2 });
  const gem = add(new THREE.OctahedronGeometry(0.7, 0), gemMat, 0, 5.8, 0);  // 發光守護徽記
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0x6cc4ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.position.y = 5.8; g.add(halo);
  return { group: g, gem, gemMat };
}
function buildLighthouse() {
  const g = new THREE.Group();
  const white = mat(0xede7da), red = mat(0xc0433a);
  const add = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; o.castShadow = true; g.add(o); return o; };
  add(new THREE.CylinderGeometry(2.4, 3.0, 1.2, 16), RUIN.stone, 0.6);       // 岩石基座
  add(new THREE.CylinderGeometry(1.5, 1.9, 3.0, 16), white, 2.7);
  add(new THREE.CylinderGeometry(1.25, 1.5, 3.0, 16), red, 5.7);
  add(new THREE.CylinderGeometry(1.05, 1.25, 3.0, 16), white, 8.7);
  add(new THREE.CylinderGeometry(1.4, 1.4, 0.4, 16), RUIN.stoneDk, 10.4);    // 燈室平台
  const lampY = 11.3;
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffcf6b, emissiveIntensity: 1.6, roughness: 0.3 });
  const lamp = add(new THREE.CylinderGeometry(0.95, 0.95, 1.5, 16), lampMat, lampY); // 發光燈室
  lamp.add(new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })));
  add(new THREE.ConeGeometry(1.25, 1.2, 16), red, 12.5);                     // 頂蓋
  // 旋轉光束（水平加成、緩掃海面）：cone 繞 z 轉 90° 指 +X，置於 pivot 繞 Y 掃
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.4, 36, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.rotation.z = Math.PI / 2; beam.position.x = 18;                       // 頂點靠燈室、底朝外海
  const beamPivot = new THREE.Group(); beamPivot.position.y = lampY; beamPivot.add(beam); g.add(beamPivot);
  const lampLight = TIER !== 'low' ? new THREE.PointLight(0xffe1a0, 0, 34, 2) : null; if (lampLight) { lampLight.position.y = lampY; g.add(lampLight); } // 手機（low）僅靠 emissive
  return { group: g, lampMat, beamPivot, lampLight };
}
function buildPartnerWall() {
  const g = new THREE.Group();
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(5.0, 0.5, 1.2), RUIN.stoneDk, 0, 0.25, 0);       // 基座
  add(new THREE.BoxGeometry(4.4, 2.8, 0.5), RUIN.stone, 0, 1.7, 0);          // 牆面
  add(new THREE.BoxGeometry(4.8, 0.4, 0.8), RUIN.stoneDk, 0, 3.2, 0);        // 頂楣
  const emblem = (col, em, x) => { const o = add(new THREE.IcosahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: col, emissive: em, emissiveIntensity: 1.0, roughness: 0.3, metalness: 0.3 }), x, 1.8, 0.32); return o; };
  emblem(0xffd24b, 0xffc24b, -1.1); // OCF 金徽
  emblem(0x9fd8ff, 0x4aa9ff, 1.1);  // CSCS 藍徽
  return { group: g };
}
// 擺放：固定座標、worldOpen 控可見；面朝村心（faceOrigin）
function placeDayStruct(built, data, x, z, labelY, openDist, faceOrigin) {
  // 用「白天」地形高度擺放：這些只在 worldOpen 現身，但建立時可能仍是夜晚（外圍是山牆、海岸點會被算成 +30 高空 → 浮空只剩影子）。
  setTerrainOpenness(1); const y = groundY(x, z); setTerrainOpenness(worldOpen ? 1 : 0);
  const g = built.group;
  g.position.set(x, y, z); g.rotation.y = faceOrigin ? Math.atan2(-x, -z) : 0; g.visible = false; scene.add(g);
  const lab = makeLabel(`${data.emoji} ${data.title}`); lab.o.position.set(0, labelY, 0); g.add(lab.o);
  POIS.push({ data, isRuin: false, pos: new THREE.Vector3(x, y, z), el: lab.el, openDist, dayOnly: true });
  return built;
}
const LESSON_ORDER = ['personal', 'common', 'tools', 'org', 'guide'];
// 守護者紀念碑與 CSCS 夥伴牆：打散到荒野各方位（不再擠在村莊出口）；面朝村心、座標用 STELE_AT/WALL_AT 單一來源（OCF 紀念碑也已移到外圍，見 content.js ocf）
const lessonStele = placeDayStruct(buildLessonStele(),
  { ...MONUMENT, desc: LESSON_ORDER.map((id) => '・' + UI.shardLesson[id]).join('\n') }, // desc＝五則心法（重用既有三語、零新翻譯）
  STELE_AT.x, STELE_AT.z, 7, 5, true);
const lighthouse = placeDayStruct(buildLighthouse(), LIGHTHOUSE, 60, 224, 16, 6.5, false);
const partnerWall = placeDayStruct(buildPartnerWall(), PARTNER_WALL, WALL_AT.x, WALL_AT.z, 4.2, 5, true);
addCircleCol(60, 224, 3, true);                                                          // 燈塔實體（dayOnly）
addBoxCol(WALL_AT.x, WALL_AT.z, 2.5, 0.6, Math.atan2(-WALL_AT.x, -WALL_AT.z), true);      // 夥伴牆實體（dayOnly）
addBoxCol(STELE_AT.x, STELE_AT.z, 1.3, 0.8, Math.atan2(-STELE_AT.x, -STELE_AT.z), true);  // 守護者紀念碑實體（dayOnly）
// 英雄紀念碑：首頁主視覺壁畫 + 傳說（非課程、不計進度）
function buildMonument() {
  const g = new THREE.Group();
  const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const add = (geo, m, x, y, z) => { const o = cast(new THREE.Mesh(geo, m)); o.position.set(x, y, z); g.add(o); return o; };
  add(new THREE.BoxGeometry(5.2, 0.6, 1.6), RUIN.stoneDk, 0, 0.3, 0);           // 基座
  add(new THREE.BoxGeometry(4.6, 0.4, 1.2), RUIN.stone, 0, 0.7, 0);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.5, 4.4, 0.7), RUIN.stone, sx * 2.3, 3.1, 0); // 兩側石柱
  add(new THREE.BoxGeometry(5.4, 0.6, 0.9), RUIN.stoneDk, 0, 5.4, 0);           // 頂楣
  const ped = cast(new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), RUIN.stone)); ped.position.set(0, 6.3, 0); ped.rotation.y = Math.PI / 4; g.add(ped); // 山形頂
  const W = 4.0, H = W / 1.232;
  add(new THREE.BoxGeometry(W + 0.3, H + 0.3, 0.3), RUIN.stoneIn, 0, 3.0, 0);   // 畫框背板（前後壁畫共用的石芯）
  const tex = new THREE.TextureLoader().load('./legend.png?v=71295972'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = (s) => { // s=+1 前面(+z)、-1 背面(-z)：兩面都掛上首頁主視覺壁畫
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ color: 0xfbf7ef }));
    canvas.position.set(0, 3.0, s * 0.18); if (s < 0) canvas.rotation.y = Math.PI; g.add(canvas);
    const mural = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, H * 0.92), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    if (s < 0) { const uv = mural.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); uv.needsUpdate = true; mural.rotation.y = Math.PI; } // 背面左右翻正，避免鏡像
    mural.position.set(0, 3.0, s * 0.2); g.add(mural);
  };
  face(1); face(-1);
  scene.add(g);
  return { group: g };
}
{
  const built = buildMonument(); texturizeStone(built.group);
  const x = 0, z = -18, y = groundY(x, z);                       // 村莊後方中軸、正對入口大門的開闊處
  built.group.position.set(x, y, z); built.group.rotation.y = 0; scene.add(built.group); // 壁畫面向 +z（玩家由大門進入的方向）
  addBoxCol(x, z, 2.7, 0.9, built.group.rotation.y);   // 英雄紀念碑實體（壁畫牆；POI openDist 6 仍可讀）
  const lab = makeLabel(`${LEGEND.emoji} ${LEGEND.title}`); lab.o.position.set(0, 7.4, 0); built.group.add(lab.o);
  POIS.push({ data: LEGEND, isRuin: false, pos: new THREE.Vector3(x, y, z), el: lab.el, openDist: 6 });
}

// ── 村外的「資源寶箱」（非課程；走近開面板 → 連到資源頁）：箱身共用，蓋子上方浮一個發光物件 ──
function buildChest(content, buildTop) {
  const a = content.angle * Math.PI / 180, cx = Math.cos(a) * content.radius, cz = Math.sin(a) * content.radius, cy = groundY(cx, cz);
  const g = new THREE.Group();
  const woodM = mat(0x6b4a2f, { roughness: 0.8 }), bandM = mat(0xb8893a, { metalness: 0.6, roughness: 0.4 });
  const goldM = mat(0xffd24b, { emissive: 0xffcf6b, emissiveIntensity: 0.5, metalness: 0.5, roughness: 0.3 });
  const add = (geo, m, x, y, z, p = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
  add(new THREE.BoxGeometry(2.4, 1.3, 1.6), woodM, 0, 0.65, 0);                       // 箱體
  for (const bx of [-0.85, 0.85]) add(new THREE.BoxGeometry(0.22, 1.4, 1.68), bandM, bx, 0.65, 0); // 直向金屬帶
  add(new THREE.BoxGeometry(2.5, 0.22, 1.68), bandM, 0, 0.25, 0);                     // 橫向金屬帶
  add(new THREE.BoxGeometry(0.42, 0.5, 0.2), bandM, 0, 1.2, 0.82);                    // 鎖扣
  const lid = new THREE.Group(); lid.position.set(0, 1.3, -0.8); g.add(lid);          // 蓋子（以後緣為樞紐掀開）
  add(new THREE.BoxGeometry(2.4, 0.45, 1.6), woodM, 0, 0.22, 0.8, lid);
  add(new THREE.BoxGeometry(2.5, 0.5, 0.22), bandM, 0, 0.22, 1.55, lid);
  lid.rotation.x = -2.0;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.95, 3.6, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.set(0, 2.0, 0); g.add(beam);
  const top = new THREE.Group(); top.position.set(0, 2.5, 0); g.add(top);             // 浮空發光物件（武器／工具包…）
  buildTop(top, add, goldM, woodM);
  g.position.set(cx, cy, cz); g.rotation.y = Math.atan2(-cx, -cz);                    // 正面朝向村莊／玩家
  addBoxCol(cx, cz, 1.2, 0.85, Math.atan2(-cx, -cz));                                  // 寶箱實體（POI openDist 4.5 仍可開）
  scene.add(g);
  const lab = makeLabel(`${content.emoji} ${content.title}`); lab.o.position.set(0, 4.4, 0); g.add(lab.o);
  POIS.push({ data: content, isRuin: false, pos: new THREE.Vector3(cx, cy, cz), el: lab.el, openDist: 4.5 });
  return { top, beam };
}
// 武器寶箱：浮空寶劍（英雄的武器）
const chestObj = buildChest(WEAPON_CHEST, (top, add, goldM, woodM) => {
  add(new THREE.BoxGeometry(0.16, 1.6, 0.05), mat(0xeaf2ff, { emissive: 0x9fd0ff, emissiveIntensity: 0.85, metalness: 0.7, roughness: 0.25 }), 0, 0.9, 0, top);
  add(new THREE.ConeGeometry(0.08, 0.22, 4), mat(0xeaf2ff, { emissive: 0x9fd0ff, emissiveIntensity: 0.85 }), 0, 1.8, 0, top);
  add(new THREE.BoxGeometry(0.72, 0.14, 0.14), goldM, 0, 0.1, 0, top);                // 護手
  add(new THREE.BoxGeometry(0.12, 0.5, 0.12), woodM, 0, -0.18, 0, top);              // 握把
  add(new THREE.SphereGeometry(0.12, 12, 10), goldM, 0, -0.48, 0, top);              // 劍柄圓頭
});
// 工具包寶箱：浮空發光手冊（組織資安升級工具包）
const toolkitObj = buildChest(GUIDE_KIT, (top, add) => {
  const pageMat = mat(0xfbf7ef, { emissive: 0xfff0cf, emissiveIntensity: 0.55, roughness: 0.6 });
  const coverMat = mat(0x8c5bd8, { emissive: 0x5a3bb0, emissiveIntensity: 0.4, roughness: 0.5 });
  const book = new THREE.Group(); book.rotation.x = -0.55; top.add(book);             // 打開的手冊，微微朝玩家攤開
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(0.78, 0.05, 1.0), coverMat, s * 0.4, -0.04, 0, book).rotation.z = s * 0.16; // 封面
    add(new THREE.BoxGeometry(0.7, 0.04, 0.92), pageMat, s * 0.37, 0.0, 0, book).rotation.z = s * 0.16;   // 內頁
  }
  add(new THREE.BoxGeometry(0.1, 0.13, 1.0), coverMat, 0, -0.03, 0, book);            // 書脊
});

// ── 檔案室：村莊邊入口建築 → 走進門淡出傳送到隱藏室內房間 → 靠近文件台開 PDF（新分頁）──
const ARCHIVE = { pos: new THREE.Vector3(-13, 0, 5), roomY: -120 };
// 入口門朝向中央水晶（村心）：門在建築 +x 側，rotation.y 讓 +x 指向村心；
// enter（觸發點）/back（離開落點）沿「指向村心」方向排在門外，與旋轉後的門對齊。
ARCHIVE.face = Math.atan2(ARCHIVE.pos.z, -ARCHIVE.pos.x);
ARCHIVE.dir = new THREE.Vector3(-ARCHIVE.pos.x, 0, -ARCHIVE.pos.z).normalize();
ARCHIVE.enter = ARCHIVE.pos.clone().addScaledVector(ARCHIVE.dir, 2);
ARCHIVE.back = ARCHIVE.pos.clone().addScaledVector(ARCHIVE.dir, 5);
const ARCHIVE_FLOOR = ARCHIVE.roomY + 0.2;
const ARCHIVE_FOV = 86;   // 室內用更廣的視角：手機直式畫面水平 FOV 很窄，廣角才能一進門就看到三份文件並排
let archiveActive = false, archEnterArmed = true, archExitArmed = true;
const archFadeEl = document.getElementById('fade');
const archFade = { on: false, t: 0, dur: 0.7, mid: false, go: null };
const startArchFade = (go) => { archFade.on = true; archFade.t = 0; archFade.mid = false; archFade.go = go; };
function enterArchive() { startArchFade(() => { hero.position.set(0, ARCHIVE_FLOOR, 6); hero.rotation.y = Math.PI; archiveActive = true; archiveRoom.visible = true; archExitArmed = false; hero.visible = false; yaw = 0; pitch = 0.12; camera.fov = ARCHIVE_FOV; camera.updateProjectionMatrix(); if (panelId) hidePanel(); }); } // 從門口(+z)往內看三份文件
function exitArchive() { startArchFade(() => { hero.position.set(ARCHIVE.back.x, 0, ARCHIVE.back.z); hero.rotation.y = Math.PI / 2; archiveActive = false; archiveRoom.visible = false; archEnterArmed = false; hero.visible = true; yaw = Math.PI; pitch = 0.6; camera.fov = 52; camera.updateProjectionMatrix(); if (panelId) hidePanel(); camera.position.set(ARCHIVE.back.x + 6, 4, ARCHIVE.back.z + 4); }); }
// 入口建築（水泥牆 + 木門框 + 屋頂 + 招牌；+x 側留門）
{
  const g = new THREE.Group(); g.position.copy(ARCHIVE.pos); g.rotation.y = ARCHIVE.face; // 門面朝中央水晶
  const wallMat = applyStone(mat(0xffffff));
  const add = (geo, m, x, y, z) => { boxUV(geo); const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(0.6, 4, 6), wallMat, -2.2, 2, 0);
  add(new THREE.BoxGeometry(4.4, 4, 0.6), wallMat, 0, 2, -2.7);
  add(new THREE.BoxGeometry(4.4, 4, 0.6), wallMat, 0, 2, 2.7);
  add(new THREE.BoxGeometry(0.6, 4, 2), wallMat, 2.2, 2, -2);
  add(new THREE.BoxGeometry(0.6, 4, 2), wallMat, 2.2, 2, 2);
  add(new THREE.BoxGeometry(0.6, 1, 2.2), wallMat, 2.2, 3.5, 0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.8, 4), mat(0x9c5b3a)); roof.position.set(0, 5, 0); roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  for (const sz of [-0.95, 0.95]) { const fr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.25), RUIN.woodDk); boxUV(fr.geometry); fr.position.set(2.25, 1.5, sz); fr.castShadow = true; g.add(fr); }
  const lab = makeLabel(UI.labelArchive); lab.o.position.set(2.4, 4.7, 0); g.add(lab.o);
  scene.add(g);
}
addBoxCol(ARCHIVE.pos.x, ARCHIVE.pos.z, 2.0, 2.9, ARCHIVE.face);   // 檔案室實體（門在 +x 側；入口 trigger 半徑 1.7 > 停止距離 → 仍能進入）
// 隱藏室內房間（世界下方，平時 visible=false）
const archiveRoom = new THREE.Group(); archiveRoom.position.set(0, ARCHIVE.roomY, 0); archiveRoom.visible = false; scene.add(archiveRoom);
{
  const g = archiveRoom, wallMat = applyStone(mat(0xffffff)), woodM = RUIN.wood;
  const add = (geo, m, x, y, z) => { boxUV(geo); const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  // 放大的展示廳：22(寬) × 20(深) × 5(高)。三份文件一字排開靠後牆，從前方門口(+z)進入即可一覽
  add(new THREE.BoxGeometry(22, 0.4, 20), wallMat, 0, 0, 0);            // 地板
  add(new THREE.BoxGeometry(22, 0.4, 20), wallMat, 0, 5, 0);            // 天花
  add(new THREE.BoxGeometry(0.4, 5, 20), wallMat, -10.7, 2.5, 0);      // 左牆
  add(new THREE.BoxGeometry(0.4, 5, 20), wallMat, 10.7, 2.5, 0);       // 右牆
  add(new THREE.BoxGeometry(22, 5, 0.4), wallMat, 0, 2.5, -9.7);       // 後牆（文件靠這面）
  add(new THREE.BoxGeometry(8.2, 5, 0.4), wallMat, -6.9, 2.5, 9.7);    // 前牆左段
  add(new THREE.BoxGeometry(8.2, 5, 0.4), wallMat, 6.9, 2.5, 9.7);     // 前牆右段（中間留門）
  add(new THREE.BoxGeometry(5.6, 1.2, 0.4), wallMat, 0, 4.4, 9.7);     // 前牆門楣
  for (const bx of [-9.2, 9.2]) add(new THREE.BoxGeometry(2.4, 4, 0.7), woodM, bx, 2, -9.0); // 兩側書架（靠後牆）
  // 兩盞吊燈把長廳照勻（前、後各一）
  for (const lz of [3, -7]) {
    const lamp = new THREE.PointLight(0xffe6b8, 55, 60, 1.5); lamp.position.set(0, 4.2, lz); g.add(lamp);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff0cf })); bulb.position.set(0, 4.3, lz); g.add(bulb);
  }
  ARCHIVE_DOCS.forEach((d, i) => {
    const dx = (i - 1) * 3.5;                                                // 三份一字排開（間距 3.5），靠後牆、正面朝門口(+z)
    add(new THREE.BoxGeometry(1.9, 1.0, 0.7), woodM, dx, 0.5, -8.7);         // 展示基座
    const cw = 1.6, tilt = -0.12;                                           // 封面（正方形、略後仰、正面朝玩家 +z）
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(cw + 0.16, cw + 0.16), new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 0.6 }));
    frame.position.set(dx, 1.95, -8.56); frame.rotation.x = tilt; g.add(frame);
    const cover = new THREE.Mesh(new THREE.PlaneGeometry(cw, cw), new THREE.MeshBasicMaterial({ map: tex(d.cover, 1, 1, true) }));
    cover.position.set(dx, 1.95, -8.55); cover.rotation.x = tilt; g.add(cover);
    const lab = makeLabel(`${d.emoji} ${d.title}`); lab.o.position.set(dx, 3.15, -8.56); g.add(lab.o);
    POIS.push({ data: d, isRuin: false, area: 'archive', pos: new THREE.Vector3(dx, ARCHIVE.roomY, -6.5), el: lab.el, openDist: 3.6 });
  });
}

// ── 石化村民（遺跡維護者）：大水晶啟動後解除石化、靠近給提醒 ──────
const STONE = new THREE.Color(0x9a958c);
function buildKeeper(r) {
  const g = new THREE.Group();
  const parts = [];
  const part = (geo, aliveHex, x, y, z) => {
    const m = new THREE.MeshStandardMaterial({ color: STONE.clone(), roughness: 0.9, metalness: 0, flatShading: false });
    const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; g.add(mesh);
    parts.push({ m, alive: new THREE.Color(aliveHex) }); return mesh;
  };
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.5, 12), mat(0x8a847a)); ped.position.y = 0.25; ped.castShadow = ped.receiveShadow = true; g.add(ped);
  part(new THREE.CapsuleGeometry(0.42, 0.7, 6, 12), r.color, 0, 1.25, 0);                            // 身體（披風＝主題色）
  part(new THREE.SphereGeometry(0.4, 14, 12), 0xf2c79b, 0, 2.05, 0);                                // 頭
  part(new THREE.SphereGeometry(0.42, 14, 12, 0, TAU, 0, Math.PI * 0.55), 0x5a4a36, 0, 2.12, 0);     // 髮
  part(new THREE.CapsuleGeometry(0.14, 0.45, 5, 10), r.color, -0.5, 1.3, 0.05);
  part(new THREE.CapsuleGeometry(0.14, 0.45, 5, 10), r.color, 0.5, 1.3, 0.05);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0x2a2630)); e.position.set(sx * 0.15, 2.08, 0.36); g.add(e); }
  return { group: g, parts };
}
const keepers = ruinAt.map((r) => {
  const inv = 1 - 8 / r.radius;                 // 從遺跡往村中心退 8
  const x = r.x * inv, z = r.z * inv, y = groundY(x, z);
  const built = buildKeeper(r);
  built.group.position.set(x, y, z); built.group.rotation.y = Math.atan2(-x, -z); scene.add(built.group);
  const el = document.createElement('div'); el.className = 'bubble'; const o = new CSS2DObject(el); o.position.set(0, 3.1, 0); built.group.add(o);
  return { ...built, ruin: r, pos: new THREE.Vector3(x, y, z), el, life: 0, baseY: y, mode: -1, open: false, line: 0 };
});
// 維護者台詞＝劇情開場（keeperLore）＋原本的資安重點（review）；不變動 review 本體
const keeperLines = (k) => [((UI.keeperLore && UI.keeperLore[k.ruin.id]) || k.ruin.tip), ...(k.ruin.review || [])];
// 維護者對話：恢復後靠近先出現小圖示，點圖示展開第一則；展開中再點則輪替到下一則（複習重點）
keepers.forEach((k) => {
  k.el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (k.life <= 0.6) return;                                    // 僅恢復（白天）後可互動
    if (!k.open) k.open = true;                                   // 圖示 → 展開
    else { const ls = keeperLines(k); k.line = (k.line + 1) % ls.length; } // 展開中 → 下一則
    k.mode = -1;                                                  // 強制重繪
  });
});

// ── 環境村民：村裡漫步的普通村民，點一下說一句資安小撇步（沿用泡泡系統；不影響玩法）──
function buildVillager(bodyHex, hairHex) {
  const g = new THREE.Group();
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  for (const sx of [-1, 1]) add(new THREE.CapsuleGeometry(0.12, 0.42, 5, 10), mat(0x4a4a55), sx * 0.16, 0.42, 0); // 腿
  add(new THREE.CapsuleGeometry(0.34, 0.62, 6, 12), mat(bodyHex), 0, 1.05, 0);                                    // 身體
  for (const sx of [-1, 1]) add(new THREE.CapsuleGeometry(0.1, 0.4, 5, 10), mat(bodyHex), sx * 0.44, 1.05, 0);    // 手臂
  add(new THREE.SphereGeometry(0.32, 14, 12), mat(0xf2c79b), 0, 1.78, 0);                                         // 頭
  add(new THREE.SphereGeometry(0.34, 14, 12, 0, TAU, 0, Math.PI * 0.55), mat(hairHex), 0, 1.84, 0);               // 髮
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0x2a2630)); e.position.set(sx * 0.12, 1.8, 0.29); g.add(e); }
  return g;
}
const villagers = [[0xc85a54, 0x4a3a2c], [0x4f7bb0, 0x2a2a30], [0x6aa15a, 0x5a4a36], [0xb98a3e, 0x3a2e22]].map(([bodyHex, hairHex], i) => {
  const a = (i / 4) * TAU + rand(-0.4, 0.4), r = rand(9, 24);
  const x = Math.cos(a) * r, z = Math.sin(a) * r, y = groundY(x, z);
  const g = buildVillager(bodyHex, hairHex); g.position.set(x, y, z); scene.add(g);
  const el = document.createElement('div'); el.className = 'bubble'; const o = new CSS2DObject(el); o.position.set(0, 2.5, 0); g.add(o);
  return { group: g, el, pos: new THREE.Vector3(x, 0, z), target: new THREE.Vector3(x, 0, z), face: a, wait: rand(1, 4), persona: i, line: 0, mode: -1, open: false };
});
villagers.forEach((v, i) => { v.el.addEventListener('click', (e) => { e.stopPropagation(); met.villagers.add(i); if (!v.open) v.open = true; else v.line++; v.mode = -1; }); });

// ── 首頁角色重塑：友善小龍（載白貓）、綠袍法師嚮導、村裡黃貓 ──────
// 低多邊形小貓（可重用：白貓帶紅斗篷、黃貓不帶）
function buildCat(bodyHex, cape) {
  const g = new THREE.Group();
  const body = mat(bodyHex);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  add(new THREE.CapsuleGeometry(0.26, 0.22, 6, 12), body, 0, 0.34, 0);          // 坐姿圓胖身體
  add(new THREE.SphereGeometry(0.27, 14, 12), body, 0, 0.74, 0.05);            // 頭
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 8), body); e.position.set(sx * 0.14, 0.97, 0.02); e.castShadow = true; g.add(e); } // 耳
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.045, 8, 6), mat(0x2a2630), sx * 0.1, 0.77, 0.28); // 眼
  add(new THREE.SphereGeometry(0.04, 8, 6), mat(0xff9aa2), 0, 0.71, 0.31);     // 鼻
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.42, 5, 10), body); tail.position.set(0, 0.4, -0.28); tail.rotation.x = -1.0; tail.castShadow = true; g.add(tail);
  if (cape) { const cp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), new THREE.MeshStandardMaterial({ color: 0xe0392f, side: THREE.DoubleSide, roughness: 0.9, flatShading: false })); cp.position.set(0, 0.52, -0.24); cp.rotation.x = 0.4; g.add(cp); }
  return { group: g, tail };
}
// 友善灰龍：白肚、方塊藍眼、藍角、薄翅、會吐藍火
function buildDragon() {
  const g = new THREE.Group();
  const grey = mat(0x9a96a0), white = mat(0xede9e2), blue = mat(0x4aa3e0);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  const body = add(new THREE.CapsuleGeometry(0.7, 1.1, 6, 12), grey, 0, 0, 0); body.rotation.z = Math.PI / 2;
  const belly = add(new THREE.CapsuleGeometry(0.5, 1.0, 6, 10), white, 0, -0.3, 0.14); belly.rotation.z = Math.PI / 2;
  add(new THREE.BoxGeometry(1.05, 0.95, 0.95), grey, 1.2, 0.32, 0);            // 頭（大一點、明顯）
  add(new THREE.BoxGeometry(0.55, 0.45, 0.58), grey, 1.72, 0.1, 0);            // 吻
  for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(0.09, 0.4, 0.4), white, 1.12, 0.42, sx * 0.3); add(new THREE.BoxGeometry(0.07, 0.2, 0.2), blue, 1.18, 0.42, sx * 0.3); } // 方塊眼
  for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.45, 8), blue); h.position.set(1.0, 0.82, sx * 0.26); h.castShadow = true; g.add(h); } // 角
  const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.7, 8), grey); wingL.scale.set(0.18, 1, 1); wingL.position.set(-0.2, 0.5, 0.2); g.add(wingL);
  const wingR = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.7, 8), grey); wingR.scale.set(0.18, 1, 1); wingR.position.set(-0.2, 0.5, -0.2); g.add(wingR);
  const tail = add(new THREE.ConeGeometry(0.34, 1.3, 10), grey, -1.25, 0, 0); tail.rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) add(new THREE.CapsuleGeometry(0.12, 0.3, 5, 10), grey, 0.25, -0.6, sx * 0.34); // 垂著的小腿
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x5ec8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.3, 8), flameMat); flame.position.set(2.05, 0.05, 0); flame.rotation.z = -Math.PI / 2; g.add(flame);
  return { group: g, wingL, wingR, flame, flameMat };
}
// 綠袍法師：深色臉發光眼、尖兜帽、發光法杖
function buildMage() {
  const g = new THREE.Group();
  const green = mat(0x3c9a5f), greenDk = mat(0x2c7a48), darkF = mat(0x24202a), wood = mat(0x6e5230);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  add(new THREE.ConeGeometry(0.72, 1.7, 12), green, 0, 0.85, 0);               // 長袍
  add(new THREE.SphereGeometry(0.45, 14, 12), green, 0, 1.55, 0);              // 肩
  add(new THREE.SphereGeometry(0.3, 14, 12), darkF, 0, 1.8, 0.07);            // 深色臉
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xa9f0d0, emissive: 0x6fe6b8, emissiveIntensity: 1.4, roughness: 0.4 });
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.05, 8, 6), eyeMat, sx * 0.1, 1.82, 0.31); // 發光眼
  add(new THREE.ConeGeometry(0.44, 0.75, 12), greenDk, 0, 2.1, -0.03);         // 尖兜帽
  add(new THREE.CapsuleGeometry(0.13, 0.5, 5, 10), green, -0.5, 1.3, 0.1);
  add(new THREE.CapsuleGeometry(0.13, 0.5, 5, 10), green, 0.5, 1.3, 0.1);
  const staff = add(new THREE.CylinderGeometry(0.05, 0.06, 2.6, 10), wood, 0.62, 1.35, 0.22);
  const orbMat = new THREE.MeshStandardMaterial({ color: 0x9a6cff, emissive: 0x7a4cff, emissiveIntensity: 1.6, roughness: 0.2 });
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), orbMat); orb.position.set(0.62, 2.75, 0.22); g.add(orb);
  orb.add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshBasicMaterial({ color: 0x9a6cff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })));
  const orbLight = Q.mageNight ? new THREE.PointLight(0x8a5cff, 0, 16, 2) : null; if (orbLight) orb.add(orbLight); // 夜晚發出紫光（手機精簡檔省去這盞動態點光，法杖球本身仍自發光）
  return { group: g, orb, orbMat, orbLight };
}
// 綠袍法師（村中嚮導 NPC）
const mage = (() => {
  const built = buildMage();
  const x = 4.4, z = 15.2, y = groundY(x, z);
  built.group.position.set(x, y, z); built.group.rotation.y = Math.atan2(0 - x, 0 - z); scene.add(built.group); // 面向中央水晶（村心）
  const el = document.createElement('div'); el.className = 'bubble'; const o = new CSS2DObject(el); o.position.set(0, 3.5, 0); built.group.add(o);
  return { ...built, pos: new THREE.Vector3(x, y, z), baseY: y, el, mode: -1 };
})();
const MAGE_TIP = UI.mageTip;
const MAGE_TIP_DONE = UI.mageTipDone;
mage.open = false; // 對話框：靠近先出現小圖示，點圖示才展開（避免每次經過就跳整段文字）
mage.el.addEventListener('click', (e) => { e.stopPropagation(); mage.open = !mage.open; mage.mode = -1; });
// 遊戲製作者 NPC（彩蛋）：遺跡全清＝白天後，於海岸邊現身為抽象漂浮的「創世之核」，靠近可用 Q&A 問製作幕後
function buildCreator() {
  const g = new THREE.Group();
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x4aa9ff, emissiveIntensity: 1.5, roughness: 0.2, metalness: 0.1 });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), coreMat); g.add(core);          // 發光核心
  core.add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12),                                       // 加成光暈
    new THREE.MeshBasicMaterial({ color: 0x6cc4ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })));
  const shardGroup = new THREE.Group(); g.add(shardGroup);                                              // 環繞「程式碎片」
  const sMat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0x3a8fe0, emissiveIntensity: 1.1, roughness: 0.3, metalness: 0.3 });
  const N = TIER === 'low' ? 3 : 5;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), sMat);
    s.position.set(Math.cos(a) * 0.95, Math.sin(a * 1.7) * 0.18, Math.sin(a) * 0.95); shardGroup.add(s);
  }
  return { group: g, core, coreMat, shardGroup };
}
const creator = (() => {
  const x = -7.4, z = 226.5;
  const b = buildCreator(); const g = b.group;
  g.position.set(x, groundY(x, z) + 1.5, z);   // 漂浮離地
  g.visible = false;                           // 只有白天（worldOpen）才現身
  scene.add(g);
  const el = document.createElement('div'); el.className = 'bubble'; const o = new CSS2DObject(el); o.position.set(0, 1.7, 0); g.add(o);
  return { group: g, core: b.core, coreMat: b.coreMat, shardGroup: b.shardGroup, el, pos: new THREE.Vector3(x, 0, z), mode: -1, open: false, topic: null, qline: 0 };
})();
creator.el.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!creator.open) { creator.open = true; creator.mode = -1; return; }   // chip → 展開
  if (e.target.closest('a.qext')) return;                                   // 外連：放行新分頁、不重繪
  if (e.target.closest('[data-egg]')) { if (!egg.active) egg.start(); return; } // 啟動彩蛋小遊戲
  const qb = e.target.closest('[data-q]'); if (qb) { creator.topic = qb.getAttribute('data-q'); creator.qline = 0; creator.mode = -1; return; }
  if (e.target.closest('[data-more]')) { creator.qline++; creator.mode = -1; }
});
// 灰龍（荒野上空慢慢繞圈）＋ 背上白貓
const dragon = (() => {
  const built = buildDragon();
  const cat = buildCat(0xefe9df, true); cat.group.scale.setScalar(0.8); cat.group.position.set(0.05, 0.62, 0); cat.group.rotation.y = Math.PI / 2; built.group.add(cat.group);
  scene.add(built.group);
  return { ...built, ang: 0, fireT: rand(3, 7), fireUntil: 0 };
})();
// 黃貓（村裡漫遊）
const ycat = (() => {
  const built = buildCat(0xf2b23a, false);
  const x = -3, z = 5, y = groundY(x, z);
  built.group.position.set(x, y, z); scene.add(built.group);
  return { ...built, pos: new THREE.Vector3(x, 0, z), target: new THREE.Vector3(x, 0, z), wait: 0, face: 0 };
})();

// ── 角色：信使（人類）──────────────────────────────────────────
const hero = new THREE.Group();
const skin = mat(0xf2c79b), cloth = mat(0xff7a45), pants = mat(0x37445c), hair = mat(0x4a3528), bag = mat(0x6b4a2f), eyeMat = mat(0x2a2630);
const P = (geo, m, x, y, z) => { const p = new THREE.Mesh(geo, m); p.position.set(x, y, z); p.castShadow = true; hero.add(p); return p; };
// 身體 + 信使背包
P(new THREE.CapsuleGeometry(0.55, 0.9, 6, 12), cloth, 0, 1.5, 0);
P(new THREE.BoxGeometry(0.85, 0.95, 0.35), bag, 0, 1.6, -0.5);
// 頭 + 頭髮 + 眼睛
const head = P(new THREE.SphereGeometry(0.5, 16, 14), skin, 0, 2.6, 0);
const H = (geo, m, x, y, z) => { const p = new THREE.Mesh(geo, m); p.position.set(x, y, z); p.castShadow = true; head.add(p); return p; };
H(new THREE.SphereGeometry(0.515, 16, 12, 0, TAU, 0, Math.PI * 0.5), hair, 0, 0.03, 0); // 頭髮（頂部半球）
for (const sx of [-1, 1]) H(new THREE.SphereGeometry(0.075, 10, 8), eyeMat, sx * 0.17, -0.04, 0.45);
// 四肢
const legL = P(new THREE.CapsuleGeometry(0.2, 0.6, 5, 10), pants, -0.26, 0.5, 0);
const legR = P(new THREE.CapsuleGeometry(0.2, 0.6, 5, 10), pants, 0.26, 0.5, 0);
const armL = P(new THREE.CapsuleGeometry(0.17, 0.6, 5, 10), cloth, -0.7, 1.6, 0);
const armR = P(new THREE.CapsuleGeometry(0.17, 0.6, 5, 10), cloth, 0.7, 1.6, 0);
// 二段跳「空中轉一圈」的速度特效：軀幹周圍的環繞弧線殘影（高速旋轉 + 淡入淡出）
const spinFX = new THREE.Group(); spinFX.position.y = 1.4; spinFX.visible = false; hero.add(spinFX);
const spinFXMat = new THREE.MeshBasicMaterial({ color: 0xfff2c4, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
for (let i = 0; i < 3; i++) {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.95 + i * 0.18, 0.05, 10, 24, Math.PI * 0.8), spinFXMat);
  arc.rotation.x = Math.PI / 2; arc.rotation.z = i * 0.7; arc.position.y = (i - 1) * 0.35; spinFX.add(arc);
}
hero.position.set(0, 0, 14);
// 深連結：網址加 #<遺跡id>（如 #personal）即在該遺跡旁出生，方便分享特定課程
const startRuin = ruinAt.find((r) => r.id === decodeURIComponent((location.hash || '').slice(1)).trim());
if (startRuin) hero.position.set(startRuin.x + 5, 0, startRuin.z + 5);
scene.add(hero);

// 主角頭頂對話泡：踩水反應 + 漫步自言自語
const heroBubbleEl = document.createElement('div'); heroBubbleEl.className = 'bubble say';
const heroBubble = new CSS2DObject(heroBubbleEl); heroBubble.position.set(0, 3.6, 0); hero.add(heroBubble);
const WATER_LINES = UI.waterLines;   // 戲水台詞（多語系，見 i18n/ui.js）
const IDLE_LINES = UI.idleLines;     // 漫步自言自語（資安小提醒 + 氛圍穿插）
const pick = (a) => a[(Math.random() * a.length) | 0];
let sayTimer = 0, idleTalkTimer = 12, wasInWater = false;
function heroSay(text, dur = 3) { heroBubbleEl.textContent = text; heroBubbleEl.classList.add('show'); sayTimer = dur; }
// 是否靠近任一可對話 NPC（村民/維護者/法師）——用來暫停主角自言自語，避免多個對話泡同時跳出
function heroNearNPC() {
  const hx = hero.position.x, hz = hero.position.z;
  for (const v of villagers) if (Math.hypot(hx - v.pos.x, hz - v.pos.z) < 7) return true;
  for (const k of keepers) if (Math.hypot(hx - k.pos.x, hz - k.pos.z) < 8) return true;
  if (mage && Math.hypot(hx - mage.pos.x, hz - mage.pos.z) < 8) return true;
  return !!(creator && creator.group.visible && Math.hypot(hx - creator.pos.x, hz - creator.pos.z) < 8);
}

// ── 控制 ────────────────────────────────────────────────────────
const keys = new Set();
addEventListener('keydown', (e) => { if (e.code === 'Space') e.preventDefault(); keys.add(e.code); });
addEventListener('keyup', (e) => { keys.delete(e.code); });
let yaw = Math.PI, pitch = 0.6, dist = 24;
// 開場就把鏡頭擺到跟隨位置，避免從原點 (0,0,0) 起始＝卡在中央水晶光束裡（遺跡全通後光束很亮會洗版）
{ const sy = groundY(hero.position.x, hero.position.z); camera.position.set(hero.position.x + Math.sin(yaw) * Math.cos(pitch) * dist, sy + Math.sin(pitch) * dist + 2, hero.position.z + Math.cos(yaw) * Math.cos(pitch) * dist); }
const moveTarget = new THREE.Vector3(); let hasTarget = false;
const ndc = new THREE.Vector2(); const raycaster = new THREE.Raycaster(); const hitPoint = new THREE.Vector3();
let pDown = false, dragging = false, lastX = 0, lastY = 0, downX = 0, downY = 0;
const dom = renderer.domElement;
dom.addEventListener('pointerdown', (e) => { pDown = true; dragging = false; lastX = downX = e.clientX; lastY = downY = e.clientY; dom.setPointerCapture(e.pointerId); });
dom.addEventListener('pointermove', (e) => {
  if (!pDown) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  if (!dragging && Math.hypot(e.clientX - downX, e.clientY - downY) > 6) dragging = true;
  if (dragging) { yaw -= dx * 0.005; pitch = THREE.MathUtils.clamp(pitch - dy * 0.004, 0.16, 1.2); }
  lastX = e.clientX; lastY = e.clientY;
});
dom.addEventListener('pointerup', (e) => {
  if (pDown && !dragging) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(terrain, false)[0];
    if (hit) {
      hitPoint.copy(hit.point);
      const len = Math.hypot(hitPoint.x, hitPoint.z);
      if (len > worldLim()) hitPoint.multiplyScalar(worldLim() / len);
      moveTarget.copy(hitPoint); hasTarget = true;
    }
  }
  pDown = false; dragging = false;
});
addEventListener('wheel', (e) => { dist = THREE.MathUtils.clamp(dist + e.deltaY * 0.025, 14, 56); }, { passive: true });
// 首次互動解鎖音訊（瀏覽器自動播放限制；iOS 需多種手勢）
['pointerdown', 'touchend', 'click', 'keydown'].forEach((ev) => addEventListener(ev, () => SFX.unlock(), { passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden) SFX.unlock(); });

// 虛擬搖桿（觸控／小螢幕）：輸出方向向量，與鍵盤共用移動邏輯
let joyX = 0, joyZ = 0, joyId = null;
const joyEl = document.getElementById('joystick'), joyKnob = joyEl.querySelector('.knob');
const JOY_R = 42;
function joyMove(e) {
  const r = joyEl.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const len = Math.hypot(dx, dy);
  if (len > JOY_R) { dx *= JOY_R / len; dy *= JOY_R / len; }
  joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  joyX = dx / JOY_R; joyZ = -dy / JOY_R;   // 上推 = 前進
}
joyEl.addEventListener('pointerdown', (e) => { joyId = e.pointerId; joyEl.setPointerCapture(joyId); SFX.unlock(); joyMove(e); e.preventDefault(); });
joyEl.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = (e) => { if (e.pointerId === joyId) { joyId = null; joyX = 0; joyZ = 0; joyKnob.style.transform = 'translate(0,0)'; } };
joyEl.addEventListener('pointerup', joyEnd);
joyEl.addEventListener('pointercancel', joyEnd);

// ── 進度（localStorage）────────────────────────────────────────
const SAVE_KEY = 'ssd-village-v1';
let progress = { discovered: [], completed: [] };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.discovered) progress = s; } catch (e) { /* ignore */ }
if (!Array.isArray(progress.seen)) progress.seen = []; // 小地圖：固定地標/NPC 探索揭示清單（向後相容：舊存檔自動補空陣列，不影響進度/通關條件）
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ } };
const isDisc = (id) => progress.discovered.includes(id);
const isDone = (id) => progress.completed.includes(id);
// 成就足跡：村民/檔案/彩蛋生物等探索事件（當次會話累計；達成的成就 id 才寫入 progress.achievements）
const met = { docs: new Set(), villagers: new Set(), capsule: false, mole: false, moth: false };

// 世界繁榮度（0 破敗 → 1 繁榮）：發現各 0.3、進化各 0.7
let vibrancy = 0, vibrancyTarget = 0, greatGlow = 0;
function computeVibrancy() {
  // 世界亮度為二元：全部遺跡完成前維持夜晚(0)，全部完成才切到白天(1)。
  // 個別遺跡的發現／完成不改變世界亮度（只改變該遺跡自身的水晶／光束）。
  vibrancyTarget = ruinAt.every((r) => isDone(r.id)) ? 1 : 0;
}

// ── HUD ─────────────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const panel = $('#panel'); const pEmoji = panel.querySelector('.emoji'); const pTitle = panel.querySelector('h2');
const pSub = panel.querySelector('.sub'); const pDesc = panel.querySelector('.desc'); const pChips = panel.querySelector('.chips');
const pGo = panel.querySelector('.go'); const pState = panel.querySelector('.state'); const pClose = panel.querySelector('.close'); const pFight = panel.querySelector('.fight'); const pLangNote = panel.querySelector('.langnote');
const badge = $('#badge'); const toastEl = $('#toast'); const logBtn = $('#logbtn'); const logEl = $('#questlog'); const logList = $('#questlog .list');
let panelId = null, pinnedId = null; const suppressed = new Set();

function poiById(id) { return POIS.find((p) => p.data.id === id); }
// 「建議下一站」：依學習層次的推薦順序，指向第一個尚未完成的遺跡（只引導、不鎖定）
const RUIN_ORDER = ['personal', 'common', 'tools', 'org', 'guide'];
function nextRecommendedRuinId() { for (const id of RUIN_ORDER) { if (poiById(id) && !isDone(id)) return id; } return null; }
const guideMark = (() => {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.0, 0), new THREE.MeshStandardMaterial({ color: 0xffd86b, emissive: 0xffc24b, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.2 }));
  g.add(gem);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd86b, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })));
  const lab = makeLabel(UI.labelGuideNext); lab.o.position.set(0, 1.6, 0); g.add(lab.o);
  g.visible = false; scene.add(g);
  return { group: g, gem };
})();
function showPanel(p) {
  const d = p.data; panelId = d.id;
  POIS.forEach((x) => x.el.classList.toggle('is-active', x === p));
  pEmoji.textContent = d.emoji; pTitle.textContent = d.title; pSub.textContent = d.sub;
  pDesc.textContent = d.desc; pGo.href = d.url;
  pChips.innerHTML = ''; d.chips.forEach((c) => { const s = document.createElement('span'); s.className = 'chip'; s.textContent = c; pChips.appendChild(s); });
  const hasBattle = p.isRuin && !!BATTLES[d.id];
  pFight.style.display = (hasBattle && !isDone(d.id)) ? '' : 'none';
  if (!p.isRuin) { pState.textContent = d.stateText || UI.stateVillageQuest; pGo.textContent = d.goText || UI.goLearnHow; }
  else if (hasBattle) { pState.textContent = isDone(d.id) ? UI.statePurified : UI.stateHasMonster; pGo.textContent = UI.goReadBeforeBattle; }
  else { pState.textContent = isDone(d.id) ? UI.stateReadDone : UI.stateNotRead; pGo.textContent = isDone(d.id) ? UI.goReadAgain : UI.goReadCourse; }
  panel.classList.toggle('story', !!d.story); pGo.style.display = d.noLink ? 'none' : ''; // 傳說面板：全文不截斷、隱藏前往鍵
  if (pLangNote) pLangNote.textContent = (p.isRuin && !d.noLink) ? (UI.chapterLangNote || '') : ''; // 外連章節語言提示（en／简体；正體為空）
  panel.classList.add('show');
}
function hidePanel() { panelId = null; panel.classList.remove('show'); POIS.forEach((x) => x.el.classList.remove('is-active')); }
pClose.addEventListener('click', () => { if (panelId) suppressed.add(panelId); pinnedId = null; hidePanel(); });
// 右下角取消鍵（觸控／小螢幕）：等同關閉對話框
const actbtnEl = document.getElementById('actbtn');
actbtnEl.addEventListener('click', () => { if (panelId) suppressed.add(panelId); pinnedId = null; hidePanel(); });
// 手機跳躍鍵：按下時排入一次跳躍（在主迴圈消化）
let jumpPending = false;
const jumpBtn = document.getElementById('jumpbtn');
jumpBtn.addEventListener('pointerdown', (e) => { jumpPending = true; SFX.unlock(); e.preventDefault(); });
pGo.addEventListener('click', () => { const p = poiById(panelId); if (p && p.isRuin && !BATTLES[p.data.id] && !isDone(p.data.id)) { progress.completed.push(p.data.id); save(); SFX.complete(); updateHud(); showPanel(p); computeVibrancy(); assignFireflies(); spawnBurst(p); afterCompleteToast(p); checkAllDone(); } });

// 點亮遺跡外觀（水晶、光束、標籤）
function lightRuin(p) {
  p.el.textContent = `${p.data.emoji} ${p.data.title}`;
  p.crystalMat.color.set(p.data.color); p.crystalMat.emissive.set(p.data.color); p.crystalMat.emissiveIntensity = 1.7;
  p.crystal.scale.setScalar(1.18);
  p.beamMat.color.set(p.data.color); // 光束/光環/地面光環的亮度由主迴圈依 isDisc 控制
  if (p.motes) p.motes.visible = true;
}
// 戰鬥
const battle = new BattleSystem({ scene, camera, hero, ui: UI });
const egg = new EggGame({ ui: UI });   // 彩蛋小遊戲「揮刀求生」：由創世之核對話選單啟動
function startBattle(p) {
  hidePanel(); suppressed.add(p.data.id); pinnedId = null;
  battle.start(p, BATTLES[p.data.id]).then(({ won }) => {
    if (won) {
      if (!isDisc(p.data.id)) progress.discovered.push(p.data.id);
      if (!isDone(p.data.id)) progress.completed.push(p.data.id);
      save(); lightRuin(p); updateHud(); computeVibrancy(); assignFireflies(); spawnBurst(p); afterCompleteToast(p); checkAllDone();
    }
    suppressed.delete(p.data.id);
  });
}
pFight.addEventListener('click', () => { const p = poiById(panelId); if (p && BATTLES[p.data.id]) startBattle(p); });

function discover(p) {
  progress.discovered.push(p.data.id); save(); SFX.discover();
  lightRuin(p);
  toast(UI.toastDiscoverTitle, UI.toastDiscoverSub(p.data.emoji, p.data.title, p.data.sub));
  spawnBurst(p); updateHud(); computeVibrancy();
}
let allDoneShown = false, finaleActive = false, finaleT = 0, finaleShown = false;
function afterCompleteToast(p) {
  const left = ruinAt.length - progress.completed.length;
  const title = p.data.defense ? UI.toastDefense(p.data.defense) : UI.toastPurified;
  if (left > 0) toast(title, UI.toastProgress(p.data.title, left));
}
function showFinaleOverlay() {
  const f = document.getElementById('finale');
  f.querySelector('.badges').innerHTML = ruinAt.map((r) => `<span title="${r.title}">${r.emoji}</span>`).join('');
  // B 英雄守則卷軸（強化）：心法為標題、回家小提醒為內文、附「深入了解」連到真實 SSD 資源頁；ico 顯示心法碎片是否集滿，標頭顯示碎片收集數
  const totalShards = ruinAt.length * SHARD_PER;
  const gotShards = ruinAt.reduce((n, r) => n + ((progress.shards[r.id] || []).length), 0);
  const hdEl = f.querySelector('.scroll-hd'); if (hdEl) hdEl.textContent = `${UI.finaleScrollHd}　${UI.finaleShardHd(gotShards, totalShards)}`;
  f.querySelector('.scroll').innerHTML = ruinAt.map((r) => {
    const lesson = (UI.shardLesson && UI.shardLesson[r.id]) || r.defense || r.title;
    const done = (progress.shards[r.id] || []).length >= SHARD_PER;
    return `<div class="item"><span class="ico">${r.emoji}${done ? ' ✅' : ''}</span><span class="tx"><b>${r.title}・${lesson}</b>${r.tip || ''}<a href="${r.url}" target="_blank" rel="noopener" style="display:inline-block;margin-top:5px;color:#1d6fb8;font-weight:700;text-decoration:none;font-size:11px">${UI.finaleLearnMore}</a></span></div>`;
  }).join('');
  f.classList.add('show');
  // D 通關後信心檢核 + 前後比對
  const cc = f.querySelector('.confcompare'); if (cc) cc.textContent = '';
  if (localStorage.getItem(CONF_PRE) != null && localStorage.getItem(CONF_POST) == null) {
    setTimeout(() => showConfidence('post', renderConfCompare), 800);
  } else {
    renderConfCompare();
  }
}
// 前後測信心檢核（純前端 localStorage；不外傳）
const CONF_PRE = 'ssd-village-conf-pre', CONF_POST = 'ssd-village-conf-post';
const CONF_FACES = ['😟', '😐', '🙂'];
const CONF_LEVELS = UI.confLevels.map((l, i) => ({ e: CONF_FACES[i], l }));
function showConfidence(phase, onDone) {
  const root = document.getElementById('confidence');
  root.querySelector('.cq').textContent = phase === 'pre' ? UI.confQPre : UI.confQPost;
  root.querySelector('.csub').textContent = phase === 'pre' ? UI.confSubPre : UI.confSubPost;
  const opts = root.querySelector('.opts'); opts.innerHTML = '';
  CONF_LEVELS.forEach((lv, i) => {
    const b = document.createElement('button'); b.className = 'opt';
    b.innerHTML = `<span class="e">${lv.e}</span><span class="l">${lv.l}</span>`;
    b.addEventListener('click', () => {
      try { localStorage.setItem(phase === 'pre' ? CONF_PRE : CONF_POST, String(i)); } catch (e) { /* ignore */ }
      root.classList.remove('show'); SFX.unlock(); onDone && onDone();
    });
    opts.appendChild(b);
  });
  root.classList.add('show');
}
function renderConfCompare() {
  const el = document.querySelector('#finale .confcompare'); if (!el) return;
  const pre = localStorage.getItem(CONF_PRE), post = localStorage.getItem(CONF_POST);
  if (pre == null || post == null) { el.textContent = ''; return; }
  const a = +pre, b = +post;
  const msg = b > a ? UI.confUp : b === a ? UI.confSame : UI.confDown;
  el.textContent = UI.confCompare(CONF_FACES[a], CONF_FACES[b], msg);
}
function maybeShowPreConfidence() {
  if (localStorage.getItem(CONF_PRE) != null) return;
  setTimeout(() => showConfidence('pre'), 800);
}
function checkAllDone() {
  if (allDoneShown || !ruinAt.every((r) => isDone(r.id))) return;
  allDoneShown = true;
  setWorldOpen(true);   // 沒有牆的大陸：群山沉降、向海敞開（一次性重算被終局運鏡蓋住）
  SFX.win();
  ringBurst(0, 2.2, 0, 0xfff0c0, 55, 1.7);   // 金色衝擊波
  ringBurst(0, 2.6, 0, 0x9affb0, 82, 2.5);   // 綠色復甦波橫掃世界
  // 先運鏡到中央大水晶看噴發動畫，稍後才彈出完成畫面
  finaleActive = true; finaleT = 0; finaleShown = false; hidePanel();
}
document.getElementById('finale-close').addEventListener('click', () => { document.getElementById('finale').classList.remove('show'); finaleActive = false; });

let toastTimer = 0;
function toast(title, sub) { toastEl.querySelector('.t').textContent = title; toastEl.querySelector('.s').textContent = sub; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3400); }

function updateHud() {
  const d = progress.discovered.filter((id) => ruinAt.some((r) => r.id === id)).length;
  const c = progress.completed.length;
  badge.innerHTML = UI.badge(d, c, ruinAt.length);
  logList.innerHTML = '';
  ruinAt.forEach((r) => {
    const row = document.createElement('div'); row.className = 'q';
    const st = isDone(r.id) ? ['done', UI.stDone] : isDisc(r.id) ? ['disc', UI.stDisc] : ['none', UI.stNone];
    row.innerHTML = `<span class="qi">${isDisc(r.id) ? r.emoji : '❔'}</span><span class="qt">${isDisc(r.id) ? r.title : UI.unknownRuin}<i>${isDisc(r.id) ? r.sub : UI.exploreHint}</i></span><span class="qp ${st[0]}">${st[1]}</span>`;
    if (isDisc(r.id)) { row.style.cursor = 'pointer'; row.addEventListener('click', () => { const p = poiById(r.id); pinnedId = r.id; suppressed.delete(r.id); showPanel(p); logEl.classList.remove('show'); }); }
    logList.appendChild(row);
  });
}
// 線索：在任務面板頂端顯示「最近未完成封印」的方位＋約略步數（開啟面板時即時計算；方位與小地圖一致：北=−z、東=+x）
const questHintEl = document.createElement('div'); questHintEl.className = 'qhint';
questHintEl.style.cssText = 'padding:7px 10px;margin:2px 0 6px;font-size:12px;font-weight:600;line-height:1.5;color:#a85d00;background:rgba(255,170,50,.18);border-radius:8px';
{ const hd = logEl.querySelector('.hd'); if (hd) hd.after(questHintEl); else logEl.prepend(questHintEl); }
function refreshQuestHint() {
  const recId = nextRecommendedRuinId();
  if (!recId) { questHintEl.innerHTML = `🧭 ${UI.questAllDone}`; return; }
  const r = ruinAt.find((x) => x.id === recId);
  const dx = r.x - hero.position.x, dz = r.z - hero.position.z;
  const ang = (Math.atan2(dx, -dz) + TAU) % TAU;
  const dir = UI.compass[Math.round(ang / (Math.PI / 4)) % 8];
  questHintEl.innerHTML = `🧭 ${UI.questDir(dir, Math.max(1, Math.round(Math.hypot(dx, dz) / 1.5)))}`;
}
logBtn.addEventListener('click', () => { const showing = logEl.classList.toggle('show'); if (showing) { refreshQuestHint(); document.getElementById('achpanel')?.classList.remove('show'); } });
// 靜音開關
const soundBtn = document.getElementById('soundbtn');
const refreshSound = () => { soundBtn.textContent = SFX.isMuted() ? '🔇' : '🔊'; soundBtn.setAttribute('aria-pressed', String(SFX.isMuted())); };
soundBtn.addEventListener('click', () => { SFX.unlock(); SFX.toggle(); refreshSound(); });
refreshSound();

// 重置進度：清空 localStorage，所有遺跡回到未發現狀態
function resetRuinVisual(p) {
  p.el.textContent = UI.ruinUnknownLabel; p.el.classList.remove('is-active');
  p.crystalMat.color.set(0x9aa3ad); p.crystalMat.emissive.set(0x2a2f38); p.crystalMat.emissiveIntensity = 0.45;
  p.crystal.scale.setScalar(1.0);
  p.beamMat.color.set(0xbfc6cf); // 光束亮度由主迴圈依 isDisc 自動調回
  if (p.motes) p.motes.visible = false;
}
function resetProgress() {
  if (!window.confirm(UI.resetConfirm)) return;
  progress = { discovered: [], completed: [] }; save();
  try { localStorage.removeItem(CONF_PRE); localStorage.removeItem(CONF_POST); } catch (e) { /* ignore */ }
  const cc = document.querySelector('#finale .confcompare'); if (cc) cc.textContent = '';
  allDoneShown = false; pinnedId = null; suppressed.clear(); hidePanel();
  POIS.forEach((p) => { if (p.isRuin) resetRuinVisual(p); });
  logEl.classList.remove('show'); document.getElementById('finale').classList.remove('show'); finaleActive = false; finaleShown = false; setWorldOpen(false); updateHud(); computeVibrancy(); assignFireflies();
  toast(UI.resetToastTitle, UI.resetToastSub);
}
document.getElementById('resetbtn').addEventListener('click', resetProgress);
// 還原已發現遺跡的外觀
POIS.forEach((p) => { if (p.isRuin && isDisc(p.data.id)) lightRuin(p); });
updateHud(); allDoneShown = ruinAt.every((r) => isDone(r.id)); computeVibrancy(); vibrancy = vibrancyTarget; assignFireflies();
if (allDoneShown) setWorldOpen(true);   // 載入已完成存檔：直接是白天敞開狀態

// 擴散光環（mul=擴張倍率、dur=持續秒數）
const bursts = [];
function ringBurst(x, y, z, color, mul, dur) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.28, 8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = Math.PI / 2; ring.position.set(x, y, z); scene.add(ring);
  bursts.push({ ring, t: 0, mul, dur });
}
function spawnBurst(p) { ringBurst(p.pos.x, p.pos.y + 1.2, p.pos.z, p.data.color, 6, 0.9); }

// ── 綠色膠囊：荒野裡會逃跑的神秘綠光球（純彩蛋，不存檔/不計數/無名牌）。定點抖動懸浮 → 英雄靠近→原地旋轉縮小→消失→他處重生，循環 ──
const CAP_TRIGGER = 8, CAP_SPIN_DUR = 0.7, CAP_HIDE = 0.5;
const capMat = mat(0x9dffb0, { emissive: 0x3bff77, emissiveIntensity: 1.4, roughness: 0.25 }); // 綠 emissive 最亮通道 >bloom 門檻 → 桌機發綠光暈
const capMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 16), capMat);
capMesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), new THREE.MeshBasicMaterial({ color: 0x5bff8a, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }))); // 柔光殼：兩檔位都有綠暈
const capLight = Q.mageNight ? new THREE.PointLight(0x44ff77, 0, 14, 2) : null; if (capLight) capMesh.add(capLight); // 夜間綠點光（桌機限定）
scene.add(capMesh);
const cap = { mesh: capMesh, mat: capMat, light: capLight, state: 'idle', ax: 0, ay: 0, az: 0, t: 0, scale: 0.01, ph: rand(0, TAU) };
function capRespawn() {
  let x = cap.ax, z = cap.az;
  for (let i = 0; i < 40; i++) {
    const a = rand(0, TAU), r = rand(WORLD.villageR + 10, WORLD.maxR - 6);
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    if (terrainHeight(cx, cz) < WORLD.water + 1) continue;                       // 不落在水裡
    if (nearAnyRuin(cx, cz, 12)) continue;                                       // 避開遺跡
    if (Math.hypot(cx - hero.position.x, cz - hero.position.z) < 24) continue;   // 離英雄遠一點，避免一出現就被觸發
    x = cx; z = cz; break;
  }
  cap.ax = x; cap.az = z; cap.ay = groundY(x, z) + 2.2;                          // 懸浮高度
  cap.mesh.position.set(cap.ax, cap.ay, cap.az); cap.mesh.scale.setScalar(0.01); cap.scale = 0.01;
  cap.state = 'idle'; cap.t = 0; cap.ph = rand(0, TAU);
  ringBurst(cap.ax, cap.ay, cap.az, 0x5bff8a, 4, 0.7);                          // 出現的綠色光環
}
capRespawn();

// ── 更多彩蛋生物（純彩蛋，不存檔/不計數/無名牌）。沿用膠囊狀態機 ──
function wildSpot(minHero) {                                       // 挑荒野合法落點（不在水裡、避遺跡、離英雄遠）
  for (let i = 0; i < 40; i++) {
    const a = rand(0, TAU), r = rand(WORLD.villageR + 10, WORLD.maxR - 6);
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    if (terrainHeight(cx, cz) < WORLD.water + 1) continue;
    if (nearAnyRuin(cx, cz, 12)) continue;
    if (Math.hypot(cx - hero.position.x, cz - hero.position.z) < minHero) continue;
    return { x: cx, z: cz };
  }
  return { x: cap.ax, z: cap.az };
}
function glowCritter(coreHex, shellHex, lightHex, radius) {
  const m = mat(coreHex, { emissive: coreHex, emissiveIntensity: 1.4, roughness: 0.3 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 14), m);
  mesh.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 1.85, 14, 10), new THREE.MeshBasicMaterial({ color: shellHex, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })));
  const light = Q.mageNight ? new THREE.PointLight(lightHex, 0, 12, 2) : null; if (light) mesh.add(light);
  scene.add(mesh);
  return { mesh, mat: m, light };
}
// 生物①「膽小地鼠光點」：橘黃光點蹲在地面，英雄靠近就鑽地消失、他處冒出
const MOLE_TRIGGER = 5;
const mole = { ...glowCritter(0xffd27a, 0xffb347, 0xffa12c, 0.4), state: 'idle', ax: 0, az: 0, ay: 0, t: 0, ph: rand(0, TAU) };
function moleRespawn() {
  const s = wildSpot(22); mole.ax = s.x; mole.az = s.z; mole.ay = groundY(s.x, s.z) + 0.45;
  mole.mesh.position.set(mole.ax, mole.ay, mole.az); mole.mesh.scale.setScalar(0.01); mole.state = 'rise'; mole.t = 0; mole.ph = rand(0, TAU);
  ringBurst(mole.ax, mole.ay - 0.3, mole.az, 0xffb347, 3, 0.6);
}
moleRespawn();
// 生物②「好奇光蝶」：青白光點飄浮，玩家在中距離時會好奇地靠近，太近則急閃他處
const MOTH_NOTICE = 15, MOTH_FLEE = 4.5;
const moth = { ...glowCritter(0xbfeaff, 0x8fd6ff, 0x53b8ff, 0.32), state: 'idle', ax: 0, az: 0, ay: 0, t: 0, ph: rand(0, TAU), dx: 0, dz: 0 };
function mothRespawn() {
  const s = wildSpot(26); moth.ax = s.x; moth.az = s.z; moth.ay = groundY(s.x, s.z) + 2.6;
  moth.mesh.position.set(moth.ax, moth.ay, moth.az); moth.mesh.scale.setScalar(0.01); moth.state = 'idle'; moth.t = 0; moth.ph = rand(0, TAU);
  ringBurst(moth.ax, moth.ay, moth.az, 0x8fd6ff, 3, 0.6);
}
mothRespawn();

// ── 知識碎片：每座遺跡周邊散落 3 枚，走近自動拾取；集滿一主題解鎖「心法」（純加分，不 gate 進度，存檔向後相容）──
const SHARD_PER = 3, SHARD_PICK = 2.6;
progress.shards = progress.shards || {};
const kShardGeo = new THREE.OctahedronGeometry(0.34, 0);
const knowledgeShards = [];
ruinAt.forEach((r) => {
  progress.shards[r.id] = progress.shards[r.id] || [];
  const base = r.angle * Math.PI / 180;
  for (let i = 0; i < SHARD_PER; i++) {
    const a = base + (i / SHARD_PER) * TAU, rr = 7 + (i % 2) * 2;
    const x = r.x + Math.cos(a) * rr, z = r.z + Math.sin(a) * rr, y = groundY(x, z) + 1.2;
    const m = mat(r.color, { emissive: r.color, emissiveIntensity: 0.95, roughness: 0.25, metalness: 0.2 });
    const mesh = new THREE.Mesh(kShardGeo, m);
    mesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 10), new THREE.MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })));
    mesh.position.set(x, y, z); mesh.visible = !progress.shards[r.id].includes(i); scene.add(mesh);
    knowledgeShards.push({ mesh, m, id: r.id, idx: i, x, z, y, ph: rand(0, TAU), got: progress.shards[r.id].includes(i) });
  }
});
function collectShard(s) {
  s.got = true; s.mesh.visible = false;
  const arr = progress.shards[s.id]; if (!arr.includes(s.idx)) arr.push(s.idx);
  save(); ringBurst(s.x, s.y, s.z, (ruinAt.find((r) => r.id === s.id) || {}).color || 0xffffff, 3, 0.6);
  const r = ruinAt.find((x) => x.id === s.id) || {};
  if (arr.length >= SHARD_PER) { SFX.complete(); toast(UI.shardComplete(r.title || ''), (UI.shardLesson && UI.shardLesson[s.id]) || ''); }
  else { SFX.collect(); toast(UI.shardGot(arr.length, SHARD_PER), r.title || ''); }
}

// ── 成就系統：偵測解鎖→toast＋音效；面板從右上角「🏅 成就」開啟。存檔擴充 progress.achievements（向後相容）──
progress.achievements = progress.achievements || [];
const ACHIEVEMENTS = [
  { id: 'firstRuin', cond: () => progress.completed.length >= 1 },
  { id: 'explorer', cond: () => ruinAt.every((r) => isDisc(r.id)) },
  { id: 'allRuins', cond: () => ruinAt.every((r) => isDone(r.id)) },
  { id: 'shardMaster', cond: () => ruinAt.every((r) => (progress.shards[r.id] || []).length >= SHARD_PER) },
  { id: 'archivist', cond: () => met.docs.size >= ARCHIVE_DOCS.length },
  { id: 'villageFriend', cond: () => met.villagers.size >= villagers.length },
  { id: 'capsule', cond: () => met.capsule },
  { id: 'critterHunter', cond: () => met.capsule && met.mole && met.moth },
];
const achPanelEl = document.getElementById('achpanel');
const achBtnEl = document.getElementById('achbtn');
const achListEl = achPanelEl ? achPanelEl.querySelector('.alist') : null;
function renderAchPanel() {
  if (!achListEl) return;
  achListEl.innerHTML = ACHIEVEMENTS.map((a) => {
    const got = progress.achievements.includes(a.id);
    const info = (UI.ach && UI.ach[a.id]) || { t: a.id, d: '' };
    return `<div class="ach${got ? '' : ' locked'}"><span class="ai">${got ? '🏅' : '🔒'}</span><span class="at">${info.t}<i>${info.d}</i></span></div>`;
  }).join('');
}
function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (progress.achievements.includes(a.id) || !a.cond()) continue;
    progress.achievements.push(a.id); save();
    const info = (UI.ach && UI.ach[a.id]) || { t: a.id, d: '' };
    toast(UI.achToast(info.t), info.d); SFX.complete(); renderAchPanel();
  }
}
if (achBtnEl) achBtnEl.addEventListener('click', () => { const showing = achPanelEl.classList.toggle('show'); if (showing) { renderAchPanel(); logEl.classList.remove('show'); } });
renderAchPanel();

// ── 分享成果卡片：終局以 canvas 合成一張成果圖，可下載／（行動裝置）系統分享。零外部資產 ──
function buildShareCard() {
  const W = 1080, H = 1080, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const done = progress.completed.filter((id) => ruinAt.some((r) => r.id === id)).length, total = ruinAt.length, allDone = done >= total;
  const gotShards = ruinAt.reduce((n, r) => n + ((progress.shards[r.id] || []).length), 0);
  // 背景＝當下遊戲畫面：先即時渲染一次（確保 WebGL 緩衝有內容），再把畫布以 cover 方式填滿卡片
  let scene3d = false;
  try {
    renderScene();
    const gc = renderer.domElement, gw = gc.width, gh = gc.height;
    if (gw && gh) { const s = Math.max(W / gw, H / gh), dw = gw * s, dh = gh * s; x.drawImage(gc, (W - dw) / 2, (H - dh) / 2, dw, dh); scene3d = true; }
  } catch (e) { /* 擷取失敗就退回純漸層 */ }
  // 暗化覆蓋層：壓暗背景讓文字清楚（保留品牌綠調）；無背景時用原本的綠色漸層
  const g = x.createLinearGradient(0, 0, 0, H);
  if (scene3d) { g.addColorStop(0, 'rgba(8,24,16,.74)'); g.addColorStop(0.46, 'rgba(8,24,16,.32)'); g.addColorStop(1, 'rgba(6,38,30,.82)'); }
  else { g.addColorStop(0, '#15331f'); g.addColorStop(1, '#0c5b4a'); }
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 14; x.shadowOffsetY = 2;
  x.fillStyle = '#ffffff'; x.font = 'bold 66px sans-serif'; x.fillText(UI.shareCardTitle, W / 2, 180);
  x.fillStyle = '#ffe9b8'; x.font = '600 40px sans-serif'; x.fillText(allDone ? UI.shareCardWin : UI.shareCardProgress, W / 2, 270);
  x.font = '108px sans-serif'; x.fillText(ruinAt.map((r) => r.emoji).join('  '), W / 2, 460);
  x.font = '210px sans-serif'; x.fillText(allDone ? '🛡️' : '🧭', W / 2, 720);
  x.fillStyle = '#ffffff'; x.font = '600 46px sans-serif'; x.fillText(UI.shareCardStats(done, total, gotShards, total * SHARD_PER), W / 2, 858);
  x.fillStyle = 'rgba(255,255,255,.9)'; x.font = '600 40px sans-serif'; x.fillText('ssd.ocf.tw/games', W / 2, 985);
  x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
  return cv;
}
function shareResult() {
  buildShareCard().toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], 'ssd-village.png', { type: 'image/png' });
    // 只分享圖片、不帶文字／網址：避免 X／LinkedIn 把網址展開成第二張連結預覽圖（網址已印在圖上）
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file] }).catch((err) => { if (err && err.name !== 'AbortError') downloadBlob(blob); });
    } else downloadBlob(blob);
  }, 'image/png');
}
function downloadBlob(blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ssd-village.png';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
{ const sb = document.getElementById('sharebtn'); if (sb) sb.addEventListener('click', shareResult); const sb2 = document.getElementById('sharebtn2'); if (sb2) sb2.addEventListener('click', shareResult); }

// 塵土：受光的塵色小團塊往外噴、上飄後受重力落下並淡出。
// power≈衝擊力；o 可微調顆數/外擴/上飄/大小/壽命/透明度（走路用很小的揚塵）。
const dustGeo = new THREE.IcosahedronGeometry(0.22, 0);
const dusts = [];
function spawnDust(x, y, z, power, o = {}) {
  const n = o.n ?? (6 + Math.round(power * 5));
  const out = o.out ?? (0.7 + power * 0.7), upMin = o.upMin ?? 1.0, upMax = o.upMax ?? 2.2;
  const sMin = o.sMin ?? 0.4, sMax = o.sMax ?? 0.9, dur = o.dur ?? 0.55, op = o.op ?? 0.7;
  const mat = new THREE.MeshStandardMaterial({ color: 0xcdbfa0, roughness: 1, metalness: 0, transparent: true, opacity: op, flatShading: false });
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand(-0.4, 0.4), sp = out * rand(0.7, 1.3);
    const m = new THREE.Mesh(dustGeo, mat);
    m.position.set(x + Math.cos(a) * 0.3, y + 0.12, z + Math.sin(a) * 0.3);
    m.scale.setScalar(rand(sMin, sMax));
    parts.push({ m, vel: new THREE.Vector3(Math.cos(a) * sp, rand(upMin, upMax), Math.sin(a) * sp) });
    scene.add(m);
  }
  dusts.push({ parts, mat, t: 0, dur, op });
}

// 走路腳印：地面上的小暗痕，沿前進方向、隨時間淡出（有數量上限，超過先回收最舊的）
const printGeo = new THREE.PlaneGeometry(0.32, 0.46);
const prints = [];
function spawnFootprint(x, y, z, ry) {
  const mat = new THREE.MeshBasicMaterial({ color: 0x3a2f26, transparent: true, opacity: 0.3, depthWrite: false });
  const m = new THREE.Mesh(printGeo, mat); m.position.set(x, y + 0.03, z); m.rotation.set(-Math.PI / 2, 0, -ry); m.renderOrder = 1;
  scene.add(m); prints.push({ m, mat, t: 0, dur: 4.5, op: 0.3 });
  if (prints.length > 28) { const old = prints.shift(); scene.remove(old.m); old.mat.dispose(); }
}

// ── 小地圖（世界縮影；隨鏡頭旋轉＝鏡頭正前方在盤頂；盤緣東南西北羅盤）──────────
const mm = $('#minimap canvas'); const mc = mm.getContext('2d'); const MMR = 76;
// 置中映射：世界座標 → 相對盤心(0,0)、夾在半徑內（之後再經 rot() 套用鏡頭旋轉成螢幕座標）
const w2c = (x, z) => { const lim = worldLim(); let mx = (x / lim) * MMR, mz = (z / lim) * MMR; const l = Math.hypot(mx, mz); if (l > MMR) { mx *= MMR / l; mz *= MMR / l; } return [mx, mz]; };
// 要標記的「固定」地標與 NPC（移動生物不列）：非遺跡 POI ＋ 檔案室 ＋ 法師/製作者/守護者；靠近寫入 progress.seen 才顯示
const mapMarks = [
  ...POIS.filter((p) => !p.isRuin && (p.area || 'world') === 'world')
    .map((p) => ({ x: p.pos.x, z: p.pos.z, id: p.data.id, dayOnly: !!p.dayOnly, kind: 'land' })),
  { x: ARCHIVE.pos.x, z: ARCHIVE.pos.z, id: 'archive', dayOnly: false, kind: 'land' },
  { x: 4.4, z: 15.2, id: 'npc-mage', dayOnly: false, kind: 'npc' },
  { x: -7.4, z: 226.5, id: 'npc-creator', dayOnly: true, kind: 'npc' },
  ...ruinAt.map((r) => { const inv = 1 - 8 / r.radius; return { x: r.x * inv, z: r.z * inv, id: 'npc-keeper-' + r.id, dayOnly: false, kind: 'npc' }; }),
];
// 地形縮圖：載入時一次性把 terrainHeight 烤成彩色實地地圖（沙岸/草地/岩石/海＋山形陰影），盤底用它取代純色。
// 夜（群山環抱、無海岸）與日（群山沉降、外緣成海岸線）地形不同、且地圖尺度(worldLim)也不同 → 各烤一張，drawMinimap 依 worldOpen 取用。
// 用色比照地形網格頂點色（cSand/cGrass/cRock，此處為 sRGB 原值，canvas 2D 不需 lin()）；水色比照海面 0x4f9fd0。
const DISC = MMR + 6;                                   // 盤半徑（含外緣）；地形圖與標記同尺度：世界 lim→MMR(76px)，圖covers到 DISC 填滿盤緣
function bakeTerrainMap(openness, lim) {
  const N = TIER === 'low' ? 128 : 176;
  setTerrainOpenness(openness);
  const Hd = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { Hd[j * N + i] = terrainHeight((i / (N - 1) * 2 - 1) * lim, (j / (N - 1) * 2 - 1) * lim); }
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const ctx2 = cv.getContext('2d'); const im = ctx2.createImageData(N, N); const px = im.data; const W = WORLD.water;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, h = Hd[k]; let r, g, b;
    if (h < W) { const dep = Math.min(1, (W - h) / 7); r = 0x4f - dep * 26; g = 0x9f - dep * 44; b = 0xd0 - dep * 28; }   // 海：依深度加深
    else if (h < W + 1.2) { r = 0xcd; g = 0xbb; b = 0x8e; }                                                              // 沙岸（cSand）
    else if (h > 15) { r = 0x9a; g = 0x8e; b = 0x7c; }                                                                   // 岩石／群山（cRock）
    else { const t = Math.sin((i / (N - 1) * 2 - 1) * lim * 0.12) * Math.sin((j / (N - 1) * 2 - 1) * lim * 0.11) * 0.5 + 0.5; r = 0x82 + (0x6f - 0x82) * t; g = 0xbd + (0xae - 0xbd) * t; b = 0x63 + (0x57 - 0x63) * t; } // 草地（cGrass↔cGrass2）
    let sh = ((h - Hd[j * N + Math.max(0, i - 1)]) + (h - Hd[Math.max(0, j - 1) * N + i])) * 0.05;                       // 山形陰影：鄰格高差
    sh = Math.max(-0.22, Math.min(0.22, sh)); if (h >= W) { r *= 1 + sh; g *= 1 + sh; b *= 1 + sh; }                     // 只對陸地打光，海面保持平整
    const o = k * 4; px[o] = Math.max(0, Math.min(255, r)); px[o + 1] = Math.max(0, Math.min(255, g)); px[o + 2] = Math.max(0, Math.min(255, b)); px[o + 3] = 255;
  }
  ctx2.putImageData(im, 0, 0); return cv;
}
const terrainMapNight = bakeTerrainMap(0, WORLD.maxR * DISC / MMR);
const terrainMapDay = bakeTerrainMap(1, DAY_MAXR * DISC / MMR);
setTerrainOpenness(worldOpen ? 1 : 0);                  // 還原 openness（與 shoreTex 烤製相同慣例）
function drawMinimap() {
  mc.clearRect(0, 0, 176, 176);
  mc.save(); mc.beginPath(); mc.arc(88, 88, DISC, 0, TAU); mc.clip();
  mc.fillStyle = worldOpen ? '#4a93c4' : '#33425a'; mc.fillRect(0, 0, 176, 176);   // 海／夜色襯底（圖邊角安全色）
  mc.save(); mc.translate(88, 88); mc.rotate(yaw); mc.imageSmoothingEnabled = true; // 地形實地縮圖隨鏡頭旋轉（與 w2s 標記同尺度）
  mc.drawImage(worldOpen ? terrainMapDay : terrainMapNight, -DISC, -DISC, DISC * 2, DISC * 2);
  mc.restore();
  // 鏡頭旋轉：把置中座標(mx,mz) 轉成螢幕座標。鏡頭正前方(世界 -sin/-cos yaw)恰落在盤頂；文字另畫直立故全程用 rot() 不用 ctx.rotate
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const rot = (mx, mz) => [88 + mx * cy - mz * sy, 88 + mx * sy + mz * cy];
  const w2s = (x, z) => { const [mx, mz] = w2c(x, z); return rot(mx, mz); };
  // 村莊（盤心）
  mc.fillStyle = '#cfc4ab'; mc.beginPath(); mc.arc(88, 88, 9, 0, TAU); mc.fill();
  mc.fillStyle = '#7e5630'; mc.font = '10px sans-serif'; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText(UI.mapVillage, 88, 88);
  // 已揭示的固定地標／NPC（地標琥珀、NPC 柔藍；小於遺跡 6px 以區分）
  for (const m of mapMarks) {
    if (m.dayOnly && !worldOpen) continue;
    if (!progress.seen.includes(m.id)) continue;
    const [x, y] = w2s(m.x, m.z);
    mc.beginPath(); mc.arc(x, y, 3.5, 0, TAU);
    mc.fillStyle = m.kind === 'npc' ? '#8fd0ff' : '#e7c66a'; mc.fill();
    mc.lineWidth = 1; mc.strokeStyle = 'rgba(40,40,46,.65)'; mc.stroke();
  }
  // 遺跡
  ruinAt.forEach((r) => {
    const [x, y] = w2s(r.x, r.z);
    if (!isDisc(r.id)) { mc.strokeStyle = 'rgba(40,50,40,.55)'; mc.setLineDash([3, 3]); mc.beginPath(); mc.arc(x, y, 6, 0, TAU); mc.stroke(); mc.setLineDash([]); mc.fillStyle = 'rgba(40,50,40,.65)'; mc.font = '10px sans-serif'; mc.fillText('?', x, y); }
    else { mc.fillStyle = '#' + r.color.toString(16).padStart(6, '0'); mc.beginPath(); mc.arc(x, y, 6, 0, TAU); mc.fill(); if (isDone(r.id)) { mc.strokeStyle = '#fff'; mc.lineWidth = 2; mc.beginPath(); mc.arc(x, y, 6, 0, TAU); mc.stroke(); } }
  });
  // 建議下一站：脈動金環
  const recId = nextRecommendedRuinId();
  if (recId) { const rr = ruinAt.find((r) => r.id === recId); const [rx, ry] = w2s(rr.x, rr.z); const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.004); mc.strokeStyle = `rgba(255,210,80,${(0.5 + pulse * 0.45).toFixed(2)})`; mc.lineWidth = 2.5; mc.beginPath(); mc.arc(rx, ry, 9 + pulse * 3, 0, TAU); mc.stroke(); }
  // 玩家（位置隨盤旋轉；箭頭朝向＝玩家面向，經 rot 後仍對應鏡頭視角）
  const [hmx, hmz] = w2c(hero.position.x, hero.position.z); const a = hero.rotation.y;
  const tip = rot(hmx + Math.sin(a) * 7, hmz + Math.cos(a) * 7);
  const lf = rot(hmx + Math.sin(a + 2.5) * 5, hmz + Math.cos(a + 2.5) * 5);
  const rt = rot(hmx + Math.sin(a - 2.5) * 5, hmz + Math.cos(a - 2.5) * 5);
  mc.fillStyle = '#ff7a45'; mc.beginPath(); mc.moveTo(tip[0], tip[1]); mc.lineTo(lf[0], lf[1]); mc.lineTo(rt[0], rt[1]); mc.closePath(); mc.fill();
  // 羅盤：北/東/南/西（位置隨盤旋轉、字保持直立；北標金色易定位）。重用 UI.compass[0/2/4/6]，零新字串
  mc.font = 'bold 11px sans-serif'; mc.lineWidth = 3; const crr = MMR - 7;
  for (const [ux, uz, idx] of [[0, -1, 0], [1, 0, 2], [0, 1, 4], [-1, 0, 6]]) {
    const [cx, cz] = rot(ux * crr, uz * crr);
    mc.strokeStyle = 'rgba(20,28,48,.55)'; mc.strokeText(UI.compass[idx], cx, cz);
    mc.fillStyle = idx === 0 ? '#ffd24b' : 'rgba(255,255,255,.95)'; mc.fillText(UI.compass[idx], cx, cz);
  }
  mc.restore();
  mc.strokeStyle = 'rgba(29,36,51,.25)'; mc.lineWidth = 3; mc.beginPath(); mc.arc(88, 88, MMR + 6, 0, TAU); mc.stroke();
}

// ── 主迴圈 ──────────────────────────────────────────────────────
const timer = new THREE.Timer();
const up = new THREE.Vector3(0, 1, 0), fwd = new THREE.Vector3(), right = new THREE.Vector3(), moveDir = new THREE.Vector3();
const camPos = new THREE.Vector3(), lookAt = new THREE.Vector3();
let walkPhase = 0, mmAcc = 0, lastStepFloor = 0, waterAcc = 0;
let jumpVel = 0, jumpOff = 0, jumpHeld = false; // 跳躍：地面高度之上的位移
let doubleJumped = false, spinning = false, spinT = 0, yawBeforeSpin = 0; // 二段跳 + 空中轉一圈
const SPIN_DUR = 0.55;
// 座標框（開發／定位用）：預設隱藏，按 G 切換顯示（輸入框聚焦時不觸發，例如戰鬥密碼題）
const coordsEl = document.getElementById('coords');
let fpsAvg = 60; // 平滑後的 FPS（座標框內顯示，方便量測效能）
// 火把「探照」即時可調參數（座標框開啟時：[ ] 選參數、- = 增減）；調好後把數值告訴我即可固定
const torchTune = { spotInt: 100, spotAng: 0.36, spotPen: 0.5, spotFwd: 25, spotH: 5, spotDist: 200, ptInt: 32, nightBr: 0.55 };
const torchParams = [
  { k: 'spotInt', label: '強度', step: 10, fmt: (v) => v.toFixed(0) },
  { k: 'spotAng', label: '角度', step: 0.02, fmt: (v) => v.toFixed(2) + 'π', max: 0.49 },
  { k: 'spotPen', label: '邊緣', step: 0.05, fmt: (v) => v.toFixed(2), max: 1 },
  { k: 'spotFwd', label: '前距', step: 0.5, fmt: (v) => v.toFixed(1) },
  { k: 'spotH', label: '高度', step: 0.2, fmt: (v) => v.toFixed(1) },
  { k: 'spotDist', label: '距離', step: 2, fmt: (v) => v.toFixed(0) },
  { k: 'ptInt', label: '點光', step: 4, fmt: (v) => v.toFixed(0) },
  { k: 'nightBr', label: '夜亮', step: 0.05, fmt: (v) => v.toFixed(2), max: 1 },
];
let torchSel = 0;
addEventListener('keydown', (e) => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (e.code === 'KeyG') { coordsEl.classList.toggle('show'); return; }
  if (!coordsEl.classList.contains('show')) return;
  if (e.code === 'BracketLeft') torchSel = (torchSel + torchParams.length - 1) % torchParams.length;
  else if (e.code === 'BracketRight') torchSel = (torchSel + 1) % torchParams.length;
  else if (e.code === 'Minus') { const p = torchParams[torchSel]; torchTune[p.k] = Math.max(0, +(torchTune[p.k] - p.step).toFixed(3)); }
  else if (e.code === 'Equal') { const p = torchParams[torchSel]; torchTune[p.k] = +(Math.min(torchTune[p.k] + p.step, p.max ?? Infinity)).toFixed(3); }
});

let started = false;        // 按「開始探險」後才開始模擬與渲染（讀 landing 時不跑 GPU、不發熱）
function animate() {
  if (!started) return;     // landing 仍在最前：完全跳過模擬與渲染（場景被不透明 landing 蓋住，不需畫）
  // 註：不做幀率上限。先前以累積器限到 60fps 會造成幀距不均，讓 CSS2D 地標標籤相對 3D 錨點「游移」抖動；
  //     依顯示器原生更新率渲染最平順。降溫主要靠像素比 3×→2×（填充率減半）＋陰影縮小＋landing 暫停。
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05), t = timer.getElapsed();
  fpsAvg += (1 / Math.max(timer.getDelta(), 1e-4) - fpsAvg) * 0.08; // 原始幀時間估 FPS

  joyEl.classList.toggle('hide', battle.active || finaleActive || egg.active);
  jumpBtn.classList.toggle('hide', battle.active || finaleActive || egg.active || panelId !== null); // 對話框開啟時收起，避免擋到面板的連結
  if (egg.active) { labelRenderer.domElement.style.display = 'none'; egg.update(dt); return; } // 彩蛋小遊戲：凍結 3D 世界，僅跑 2D 覆蓋層（不透明、免 renderScene）
  if (battle.active) { labelRenderer.domElement.style.display = 'none'; gradePass.uniforms.uVibrancy.value = 1; setWorldLight(1); battle.update(dt); renderScene(); return; }
  labelRenderer.domElement.style.display = finaleActive ? 'none' : '';

  camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
  right.crossVectors(fwd, up).normalize();
  let kx = 0, kz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) kz += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) kz -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
  kx += joyX; kz += joyZ;   // 虛擬搖桿
  const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  if (finaleActive || archFade.on) { kx = 0; kz = 0; hasTarget = false; } // 終局運鏡／檔案室轉場時凍結玩家

  moveDir.set(0, 0, 0);
  if (kx || kz) { hasTarget = false; moveDir.addScaledVector(fwd, kz).addScaledVector(right, kx); }
  else if (hasTarget) { moveDir.set(moveTarget.x - hero.position.x, 0, moveTarget.z - hero.position.z); if (moveDir.length() < 0.4) hasTarget = false; }

  let moving = false;
  if (moveDir.lengthSq() > 0.0001) {
    moveDir.normalize();
    // 邊緣減速：接近可走半徑時，向外的位移漸減 → 滑停而非撞隱形牆（保留 maxR 硬夾作安全網）
    let spd = sprint ? 26 : 14;
    const r0 = Math.hypot(hero.position.x, hero.position.z), EDGE = 14, lim = worldLim();
    if (!archiveActive && r0 > lim - EDGE) {
      const outward = (moveDir.x * hero.position.x + moveDir.z * hero.position.z) / (r0 || 1);
      if (outward > 0) spd *= Math.max(0.12, (lim - r0) / EDGE);
    }
    hero.position.addScaledVector(moveDir, spd * dt);
    const len = Math.hypot(hero.position.x, hero.position.z);
    if (!archiveActive && len > worldLim()) hero.position.multiplyScalar(worldLim() / len);
    if (!archiveActive) resolveHeroCollision();   // 剛體碰撞：把玩家推出重疊的實體（撞牆停住、沿牆滑）；檔案室內停用
    const tr = Math.atan2(moveDir.x, moveDir.z);
    if (!spinning) hero.rotation.y += ((((tr - hero.rotation.y) % TAU) + Math.PI * 3) % TAU - Math.PI) * Math.min(1, 12 * dt);
    moving = true;
  }

  // 跳躍：空白鍵或手機跳躍鍵；在地面起跳，空中再按一次＝二段跳並轉一圈；終局運鏡時禁用
  const grounded = jumpOff <= 0;
  const spaceDown = keys.has('Space');
  const launch = (spaceDown && !jumpHeld) || jumpPending;
  if (launch && !finaleActive) {
    if (grounded) { jumpVel = 8; doubleJumped = false; SFX.jump(); }
    else if (!doubleJumped) { jumpVel = 7.2; doubleJumped = true; spinning = true; spinT = 0; yawBeforeSpin = hero.rotation.y; SFX.jump(); }
  }
  jumpHeld = spaceDown; jumpPending = false;
  if (jumpVel !== 0 || jumpOff > 0) { jumpVel -= 23 * dt; jumpOff = Math.max(0, jumpOff + jumpVel * dt); if (jumpOff === 0) { const sp = -jumpVel; jumpVel = 0; doubleJumped = false; spinning = false; spinT = 0; if (sp > 1) spawnDust(hero.position.x, terrainHeight(hero.position.x, hero.position.z), hero.position.z, Math.min(1.4, sp / 8)); } }
  const airborne = jumpOff > 0.05;
  // 空中轉一圈（沿垂直軸 360°，緩入緩出，落地前回正）
  if (spinning) { spinT += dt; const e = Math.min(1, spinT / SPIN_DUR), k = e * e * (3 - 2 * e); hero.rotation.y = yawBeforeSpin + k * TAU; if (e >= 1) { spinning = false; spinT = 0; hero.rotation.y = yawBeforeSpin; } }
  // 速度特效：轉圈時環繞弧線高速旋轉、淡入淡出
  if (spinning) { spinFX.visible = true; spinFX.rotation.y += dt * 26; spinFXMat.opacity = Math.sin(Math.min(1, spinT / SPIN_DUR) * Math.PI) * 0.55; }
  else if (spinFX.visible) { spinFX.rotation.y += dt * 26; spinFXMat.opacity *= 0.82; if (spinFXMat.opacity < 0.02) { spinFX.visible = false; spinFXMat.opacity = 0; } }

  const groundH = terrainHeight(hero.position.x, hero.position.z);
  if (moving) {
    walkPhase += dt * (sprint ? 15 : 10); const s = Math.sin(walkPhase);
    legL.rotation.x = s * 0.6; legR.rotation.x = -s * 0.6; armL.rotation.x = -s * 0.5; armR.rotation.x = s * 0.5;
    hero.position.y = groundH + Math.abs(Math.sin(walkPhase)) * 0.12 + jumpOff;
    const sf = Math.floor(walkPhase / Math.PI);
    if (sf !== lastStepFloor) {
      lastStepFloor = sf;
      if (!airborne) {
        SFX.step();
        const ry = hero.rotation.y, side = (sf % 2 === 0) ? 0.26 : -0.26;
        const fx = hero.position.x + Math.cos(ry) * side, fz = hero.position.z - Math.sin(ry) * side, fy = terrainHeight(fx, fz);
        spawnFootprint(fx, fy, fz, ry);
        spawnDust(fx, fy, fz, 0.2, { n: 3, out: 0.5, upMin: 0.3, upMax: 0.8, sMin: 0.2, sMax: 0.42, dur: 0.45, op: 0.45 });
      }
    }
  } else {
    legL.rotation.x *= 0.8; legR.rotation.x *= 0.8; armL.rotation.x *= 0.8; armR.rotation.x *= 0.8;
    hero.position.y = groundH + jumpOff; head.position.y = 2.6 + Math.sin(t * 1.5) * 0.03;
  }
  if (airborne) { legL.rotation.x = -0.6; legR.rotation.x = -0.9; armL.rotation.x = -1.1; armR.rotation.x = -1.1; } // 滯空收腿擺手

  // 檔案室：淡入淡出轉場 + 走進門/走到出口的觸發
  if (archFade.on) {
    archFade.t += dt; const half = archFade.dur / 2;
    archFadeEl.style.opacity = (archFade.t < half ? archFade.t / half : Math.max(0, 1 - (archFade.t - half) / half)).toFixed(3);
    if (archFade.t >= half && !archFade.mid) { archFade.mid = true; archFade.go(); }
    if (archFade.t >= archFade.dur) { archFade.on = false; archFadeEl.style.opacity = '0'; }
  } else if (!archiveActive) {
    if (Math.hypot(hero.position.x - ARCHIVE.enter.x, hero.position.z - ARCHIVE.enter.z) < 1.7) { if (archEnterArmed) { archEnterArmed = false; enterArchive(); } } else archEnterArmed = true;
  } else {
    // 檔案室內：夾住左右與後方（不會誤穿牆離開），只有從前方門口往外走(+z)才離開——避免左右看文件時不小心碰邊界就出去
    hero.position.x = Math.max(-10, Math.min(10, hero.position.x));
    if (hero.position.z < -8) hero.position.z = -8;     // 後方停在文件前
    if (hero.position.z > 9) { if (archExitArmed) { archExitArmed = false; exitArchive(); } } else archExitArmed = true;
  }
  if (archiveActive) hero.position.y = ARCHIVE_FLOOR + jumpOff; // 室內地板高度（覆蓋地形跟隨）

  // 對話泡：踩水反應 + 漫步自言自語
  const nearNPC = heroNearNPC();   // 靠近可對話 NPC 時，主角先不自言自語（並立即收起正在顯示的台詞）
  if (nearNPC) { if (sayTimer > 0) { sayTimer = 0; heroBubbleEl.classList.remove('show'); } }
  else if (sayTimer > 0) { sayTimer -= dt; if (sayTimer <= 0) heroBubbleEl.classList.remove('show'); }
  const inWater = groundH < WORLD.water + 0.2;
  if (!finaleActive && !archiveActive && !nearNPC) {
    if (inWater && !wasInWater && sayTimer <= 0) heroSay(pick(WATER_LINES), 2.6);
    idleTalkTimer -= dt;
    if (idleTalkTimer <= 0) { idleTalkTimer = rand(16, 30); if (sayTimer <= 0 && !inWater && moving) heroSay(pick(IDLE_LINES), 3); }
  }
  wasInWater = inWater;

  // 鏡頭：檔案室內＝第一人稱（鏡頭在頭部、滑動視角看四周）；室外＝第三人稱（避免穿地）
  if (archiveActive) {
    const ey = hero.position.y + 1.8;
    camera.position.set(hero.position.x, ey, hero.position.z);
    lookAt.set(hero.position.x - Math.sin(yaw) * Math.cos(pitch), ey - Math.sin(pitch), hero.position.z - Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(lookAt);
  } else {
    camPos.set(hero.position.x + Math.sin(yaw) * Math.cos(pitch) * dist, hero.position.y + Math.sin(pitch) * dist + 2, hero.position.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    const camGround = terrainHeight(camPos.x, camPos.z) + 3;
    if (camPos.y < camGround) camPos.y = camGround;
    camera.position.lerp(camPos, 1 - Math.exp(-6 * dt));
    if (camera.position.distanceToSquared(camPos) < 1e-4) camera.position.copy(camPos); // 夠近就吸附＝相機完全停住；否則指數逼近永遠到不了，靜止後相機仍每幀次像素微動 → 水岸線等高對比邊緣持續閃爍（看起來像水面在抖）
    lookAt.set(hero.position.x, hero.position.y + 2.4, hero.position.z); camera.lookAt(lookAt);
  }
  // 終局運鏡：鏡頭飛向村莊中央大水晶，看完噴發動畫後才彈出完成畫面
  if (finaleActive) {
    finaleT += dt;
    camPos.set(9, 13, 24); camera.position.lerp(camPos, 1 - Math.exp(-2.2 * dt));
    lookAt.set(0, 7, 0); camera.lookAt(lookAt);
    if (finaleT > 3.2 && !finaleShown) { finaleShown = true; showFinaleOverlay(); }
  }

  // 太陽跟著角色
  sun.position.set(hero.position.x + 48, hero.position.y + 72, hero.position.z + 32);
  sun.target.position.copy(hero.position); sun.target.updateMatrixWorld();
  // 隨身火把：朝「主角正面」方向（不跟鏡頭轉）；世界越暗越亮（隨 vibrancy 轉弱）；室內檔案室不需要
  const hfx = Math.sin(hero.rotation.y), hfz = Math.cos(hero.rotation.y); // 主角正面方向（+z 面）
  torch.position.set(hero.position.x + hfx * 2, hero.position.y + 2.4, hero.position.z + hfz * 2);
  torch.intensity = archiveActive ? 0 : torchTune.ptInt * (1 - vibrancy) * (0.92 + Math.sin(t * 6.7) * 0.05 + Math.sin(t * 13.3) * 0.03);
  // 火把地面光錐（探照效果，參數可在座標框即時調整）：從頭頂斜射到主角正面的地面；天亮(vibrancy→1)後關閉
  torchGround.angle = torchTune.spotAng * Math.PI; torchGround.penumbra = torchTune.spotPen; torchGround.distance = torchTune.spotDist;
  torchGround.position.set(hero.position.x, hero.position.y + torchTune.spotH, hero.position.z);
  { const gx = hero.position.x + hfx * torchTune.spotFwd, gz = hero.position.z + hfz * torchTune.spotFwd; torchGround.target.position.set(gx, groundY(gx, gz), gz); torchGround.target.updateMatrixWorld(); }
  torchGround.intensity = archiveActive ? 0 : torchTune.spotInt * (1 - vibrancy) * (0.94 + Math.sin(t * 6.7) * 0.04);
  // 螢火蟲：環繞各「已完成」遺跡漂浮閃爍（點綴）；室內關閉
  {
    const ffBright = archiveActive ? 0 : 1;
    for (const f of fireflies) {
      if (!f.on || ffBright <= 0) { if (f.m.opacity) f.m.opacity = 0; continue; }
      const fx = f.cx + f.ox + Math.sin(t * f.sx + f.ph) * f.ax;
      const fz = f.cz + f.oz + Math.cos(t * f.sz + f.ph) * f.az;
      f.s.position.set(fx, f.cy + f.h + Math.sin(t * f.bob + f.ph) * 0.6, fz);
      f.m.opacity = ffBright * (0.18 + 0.82 * (0.5 + 0.5 * Math.sin(t * f.tw + f.ph * 2.3)));
    }
  }

  // POI 鄰近 / 發現 / 面板
  let near = null, nd = Infinity;
  for (const p of POIS) {
    if ((p.area || 'world') !== (archiveActive ? 'archive' : 'world')) continue; // 只判定當前空間的 POI
    if (p.dayOnly && !worldOpen) continue;                                      // 通關白天建物：未開放不觸發面板
    const d = Math.hypot(hero.position.x - p.pos.x, hero.position.z - p.pos.z);
    if (d < p.openDist && d < nd) { nd = d; near = p; }
    if (p.area === 'archive' && d < p.openDist) met.docs.add(p.data.id); // 成就：看過檔案室文件
    if (p.isRuin) {
      const want = (d < p.openDist) ? 1 : 0; p.lift += (want - p.lift) * Math.min(1, 6 * dt);
      const lit = isDisc(p.data.id);
      p.crystal.position.y = 3.4 + Math.sin(t * 1.5 + p.pos.x) * 0.25; p.crystal.rotation.y += dt * (lit ? 1.3 : 0.35);
      // 射向天空的光束：桌機因 bloom 會再加亮，故把基礎不透明度調暗一點避免過曝；手機無 bloom 維持原值
  p.beamMat.opacity = (lit ? (Q.bloom ? 0.26 : 0.42) : (Q.bloom ? 0.10 : 0.12)) + Math.sin(t * 2 + p.pos.z) * (lit ? (Q.bloom ? 0.05 : 0.07) : 0.02);
      if (d < p.discoverDist && !lit) discover(p);
    }
  }
  // 小地圖固定地標/NPC：靠近一次即永久揭示（fog-of-war，存檔保留；dayOnly 僅白天計入）
  for (const m of mapMarks) {
    if (m.dayOnly && !worldOpen) continue;
    if (progress.seen.includes(m.id)) continue;
    if (Math.hypot(hero.position.x - m.x, hero.position.z - m.z) < 16) { progress.seen.push(m.id); save(); }
  }
  if (finaleActive) { if (panelId) hidePanel(); }
  else if (near && !suppressed.has(near.data.id)) { pinnedId = null; if (panelId !== near.data.id) showPanel(near); }
  else if (pinnedId) { if (panelId !== pinnedId) showPanel(poiById(pinnedId)); }
  else if (panelId && !near) hidePanel();
  for (const id of [...suppressed]) { const p = poiById(id); if (!p || Math.hypot(hero.position.x - p.pos.x, hero.position.z - p.pos.z) > p.openDist + 1) suppressed.delete(id); }
  // 對話框開啟時：在搖桿旁顯示取消鍵（觸控／小螢幕）
  actbtnEl.classList.toggle('show', panelId !== null);

  // 撞樹擺動（純視覺，非真實碰撞）：玩家進入樹範圍 → 被推離 + 彈簧回擺數次站直
  {
    const hx = hero.position.x, hz = hero.position.z; let dirty = false;
    for (let i = 0; i < trees.length; i++) {
      const tr = trees[i], sw = treeSway[i];
      if (!finaleActive) {
        const dx = tr.x - hx, dz = tr.z - hz, d2 = dx * dx + dz * dz, br = 0.9 + 0.5 * tr.s;
        if (d2 < br * br) { const inv = 1 / (Math.sqrt(d2) || 1); sw.dx = dx * inv; sw.dz = dz * inv; sw.vel += 14 * dt; }
      }
      if (sw.ang !== 0 || sw.vel !== 0) {
        sw.vel += (-55 * sw.ang - 7 * sw.vel) * dt; sw.ang += sw.vel * dt;
        if (sw.ang > 0.22) { sw.ang = 0.22; if (sw.vel > 0) sw.vel = 0; }
        if (Math.abs(sw.ang) < 1e-3 && Math.abs(sw.vel) < 1e-3) { sw.ang = 0; sw.vel = 0; }
        _tQy.setFromAxisAngle(_tUp, tr.ry || 0);
        _tAx.set(sw.dz, 0, -sw.dx); if (_tAx.lengthSq() < 1e-6) _tAx.set(1, 0, 0); else _tAx.normalize();
        _tQ.setFromAxisAngle(_tAx, sw.ang).multiply(_tQy);
        _tObj.position.set(tr.x, tr.y, tr.z); _tObj.quaternion.copy(_tQ); _tObj.scale.set(tr.s, tr.sy || tr.s, tr.s); _tObj.updateMatrix();
        treeFoliage.setMatrixAt(i, _tObj.matrix); treeTrunk.setMatrixAt(i, _tObj.matrix); dirty = true;
      }
    }
    if (dirty) { treeFoliage.instanceMatrix.needsUpdate = true; treeTrunk.instanceMatrix.needsUpdate = true; }
  }
  // 特效更新
  wellWater.position.y = 1.15 + Math.sin(t * 1.5) * 0.03;
  // 海面完全靜止：移除潮汐升降（不做任何模擬動態）→ 水位固定在 WORLD.water（建立時已設定），岸邊不再隨升降掃動而閃爍。

  // 世界繁榮度：色彩分級 + 天空 + 霧
  vibrancy += (vibrancyTarget - vibrancy) * Math.min(1, 1.5 * dt);
  water.material.color.lerpColors(WATER_NIGHT, WATER_DAY, vibrancy); // 平海面：白天亮藍、夜晚深藍（MeshBasic 不受光，手動調）
  gradePass.uniforms.uVibrancy.value = archiveActive ? 1 : vibrancy; // 檔案室內固定滿色
  gradePass.uniforms.uNightBr.value = torchTune.nightBr;             // 夜晚亮度（座標框可即時調）
  setWorldLight(archiveActive ? 1 : vibrancy); // 夜→日：明暗由燈光表現，火把照到處顯原色
  for (const L of nightGlowMats) L.m.emissiveIntensity = L.base * (1 - vibrancy); // 村莊夜燈：夜晚發光、白天熄滅（避免白天反光發光）
  for (const L of nightHalo) L.m.opacity = L.base * (1 - vibrancy);                 // 夜燈柔光暈：夜晚淡入
  if (Q.richSky) {
    // 天空與星空跟著鏡頭走（永遠以鏡頭為中心）→ 不會因角色遠離原點而被 far plane 切出黑色方塊、星點也不位移
    atmoSky.position.copy(camera.position);
    if (stars) { stars.position.copy(camera.position); stars.material.opacity = (1 - vibrancy) * 0.9; } // 夜晚星點顯現、白天淡出
    // 天空太陽：方位角取自 directional light 水平方向；仰角隨 vibrancy（夜→地平線下＝暗天、日→升起＝藍天），不更動實際打光/陰影
    _skySun.copy(sun.position).sub(hero.position); _skySun.y = 0;
    const az = Math.atan2(_skySun.x, _skySun.z), elev = -0.12 + 0.54 * vibrancy;
    atmoSky.material.uniforms.sunPosition.value.setFromSphericalCoords(1, Math.PI / 2 - elev, az);
    if ('time' in atmoSky.material.uniforms) atmoSky.material.uniforms.time.value = t; // 微雲飄動
  } else {
    skyMat.uniforms.top.value.lerpColors(SKY_TOP_D, SKY_TOP_A, vibrancy);
    skyMat.uniforms.bottom.value.lerpColors(SKY_BOT_D, SKY_BOT_A, vibrancy);
  }
  scene.fog.color.lerpColors(FOG_D, FOG_A, vibrancy);
  // 邊緣迷霧：接近可走邊界時把霧收緊，遠方融進薄霧（遮住硬邊界、營造大地盡頭）
  if (worldOpen) { scene.fog.near = 140; scene.fog.far = 440; } // 白天敞開：開闊海景到遠方海霧，不收緊（沒有牆要遮）
  else { const rr = archiveActive ? 0 : Math.hypot(hero.position.x, hero.position.z), kf = Math.max(0, Math.min(1, (rr - (worldLim() - 45)) / 45)); scene.fog.near = 120 - kf * 40; scene.fog.far = 360 - kf * 150; } // 夜：邊緣收緊迷霧、遮住硬邊界
  // 中央大水晶（全部進化才啟動）
  const allDone = ruinAt.every((r) => isDone(r.id));
  greatGlow += ((allDone ? 1 : 0) - greatGlow) * Math.min(1, 1.0 * dt);
  greatMat.color.lerpColors(GREAT_D, GREAT_A, greatGlow); greatMat.color.multiplyScalar(1 - greatGlow * 0.45); greatMat.emissive.copy(greatMat.color);
// 全過白天時大幅壓低水晶的「基色diffuse＋自發光＋反光＋鏡面高光」避免 bloom 過曝（夜晚 greatGlow≈0 → 完全維持原值：基色滿、自發光0.4、envMap1.0、roughness0.15、metalness0.35）
greatMat.emissiveIntensity = 0.4 + greatGlow * 0.2;     // 白天自發光 0.6
greatMat.envMapIntensity = 1 - greatGlow * 0.85;        // 白天反光 0.15
greatMat.roughness = 0.15 + greatGlow * 0.8;            // 白天 0.95：近霧面，消除日光鏡面高光
greatMat.metalness = 0.35 - greatGlow * 0.35;           // 白天 0：純介電，最低反射
  greatCrystal.rotation.y += dt * (0.2 + greatGlow * 1.0); greatCrystal.position.y = 5.4 + Math.sin(t * 1.2) * 0.3; greatCrystal.scale.setScalar(1 + greatGlow * 0.15);
  greatBeamMat.color.copy(greatMat.color); greatBeamMat.opacity = greatGlow * (0.12 + Math.sin(t * 2.5) * 0.03);
  // 能量碎片：環繞 + 依進化狀態亮起
  shardGroup.rotation.y += dt * 0.4;
  for (const sh of shards) {
    sh.glow += ((isDone(sh.id) ? 1 : 0) - sh.glow) * Math.min(1, 2.5 * dt);
    sh.mat.color.copy(sh.color).multiplyScalar(0.28 + sh.glow * 0.72);
    sh.mat.emissive.copy(sh.color); sh.mat.emissiveIntensity = sh.glow * 0.85; // 調暗：壓在 bloom 門檻下，五顆一致都自發光、不會只有部分有光暈
    sh.mesh.position.y = Math.sin(t * 1.6 + sh.ox) * 0.22; sh.mesh.rotation.y += dt * 1.4; sh.mesh.scale.setScalar(0.55 + sh.glow * 0.55);
  }
  // 石化村民：水晶啟動後解除石化（由灰轉彩、呼吸擺動）；靠近顯示提醒
  for (const k of keepers) {
    k.life += ((allDone ? 1 : 0) - k.life) * Math.min(1, 1.0 * dt);
    for (const pt of k.parts) pt.m.color.lerpColors(STONE, pt.alive, k.life);
    k.group.position.y = k.baseY + (k.life > 0.5 ? Math.sin(t * 1.8 + k.pos.x) * 0.07 : 0);
    const dk = Math.hypot(hero.position.x - k.pos.x, hero.position.z - k.pos.z);
    const near = !battle.active && !finaleActive && dk < 7, restored = k.life > 0.6;
    if (!near || !restored) { k.open = false; k.line = 0; }
    const state = !near ? 0 : (!restored ? 1 : (k.open ? 3 : 2)); // 0隱藏 1石化提示 2小圖示 3展開
    if (state !== k.mode) {
      k.mode = state;
      if (state === 0) k.el.className = 'bubble';
      else if (state === 1) { k.el.className = 'bubble petrified show'; k.el.textContent = UI.keeperPetrified; }
      else if (state === 2) { k.el.className = 'bubble chip clickable show'; k.el.innerHTML = '💬'; }
      else {
        const ls = keeperLines(k);
        k.el.className = 'bubble clickable show';
        k.el.innerHTML = `<b>${UI.keeperHeader(k.ruin.emoji, k.ruin.title)}</b><span>${ls[k.line]}</span>` + (ls.length > 1 ? `<span class="more">${UI.keeperMore(k.line + 1, ls.length)}</span>` : '');
      }
    }
  }
  // 「建議下一站」路標：浮在推薦順序中第一個未完成的遺跡上方
  {
    const recId = (battle.active || finaleActive || archiveActive) ? null : nextRecommendedRuinId();
    guideMark.group.visible = !!recId;
    if (recId) {
      const rp = poiById(recId).pos;
      guideMark.group.position.set(rp.x, rp.y + 10 + Math.sin(t * 1.6) * 0.5, rp.z);
      guideMark.gem.rotation.y += dt * 1.2; guideMark.gem.rotation.x = Math.sin(t * 0.9) * 0.3;
    }
  }
  // OCF 紀念碑：每次進來都未點亮，靠近才點燃（本次遊玩保持點亮）＝給 OCF 添柴火
  {
    const m = ocfMon, dm = Math.hypot(hero.position.x - m.pos.x, hero.position.z - m.pos.z);
    if (!m.ignited && !battle.active && !finaleActive && dm < 11) {
      m.ignited = true;
      SFX.discover();                                                          // 點燃音
      ringBurst(m.pos.x, m.pos.y + 1.3, m.pos.z, OCF_STATUE.color, 7, 1.1);    // 添柴火的光波
    }
    m.lit += ((m.ignited ? 1 : 0) - m.lit) * Math.min(1, 1.6 * dt);
    const L = m.lit, k = 0.28 + L * 0.72;
    m.globeMat.emissiveIntensity = 0.05 + L * 1.15;
    m.globeMat.color.copy(OCF_GOLD).multiplyScalar(k); m.globeMat.emissive.copy(OCF_GOLD).multiplyScalar(k);
    m.ringMat.opacity = 0.12 + L * 0.73;
    m.glowMat.opacity = L * (0.18 + Math.sin(t * 2.5) * 0.05);                  // 光暈/光束/地環點亮後浮現
    m.plaqueMat.emissiveIntensity = L * 0.5;
    m.signMat.color.setScalar(0.45 + L * 0.55);                                // logo 銘牌由暗轉亮
    m.globe.rotation.y += dt * (0.1 + L * 0.6);
    m.globe.position.y = 6.6 + Math.sin(t * 1.5) * 0.12 * L;
  }
  // 資源寶箱：浮空物件緩緩旋轉＋上下漂浮，光束脈動
  chestObj.top.rotation.y += dt * 0.8;
  chestObj.top.position.y = 2.5 + Math.sin(t * 1.6) * 0.12;
  chestObj.beam.material.opacity = 0.12 + Math.sin(t * 2.2) * 0.04;
  toolkitObj.top.rotation.y += dt * 0.6;
  toolkitObj.top.position.y = 2.45 + Math.sin(t * 1.5 + 1) * 0.1;
  toolkitObj.beam.material.opacity = 0.12 + Math.sin(t * 2.0 + 1) * 0.04;
  // 綠袍法師：呼吸擺動 + 法杖球脈動 + 靠近顯示提示
  mage.group.position.y = mage.baseY + Math.sin(t * 1.5) * 0.04;
  mage.orbMat.emissiveIntensity = 1.3 + Math.sin(t * 3) * 0.5;
  if (mage.orbLight) mage.orbLight.intensity = archiveActive ? 0 : (1 - vibrancy) * 48 * (0.85 + Math.sin(t * 2.4) * 0.15); // 手杖球夜晚發紫光、天亮關閉（手機精簡檔無此點光）
  {
    const dm = Math.hypot(hero.position.x - mage.pos.x, hero.position.z - mage.pos.z);
    const near = !battle.active && !finaleActive && dm < 7;
    if (!near) mage.open = false;                   // 離開就收起
    const state = !near ? 0 : (mage.open ? 2 : 1);  // 0隱藏 / 1小圖示 / 2展開
    if (state !== mage.mode) {
      mage.mode = state;
      if (state === 0) mage.el.className = 'bubble';
      else if (state === 1) { mage.el.className = 'bubble chip clickable show'; mage.el.innerHTML = '💬'; }
      else { mage.el.className = 'bubble clickable show'; mage.el.innerHTML = `<b>${UI.mageHeader}</b><span>${allDone ? MAGE_TIP_DONE : MAGE_TIP}</span>`; }
    }
  }
  // 遊戲製作者 NPC：僅白天（worldOpen）現身為漂浮「創世之核」；靠近用 Q&A 問製作幕後
  if (!worldOpen) {
    if (creator.group.visible) creator.group.visible = false;
    if (creator.mode !== 0) { creator.mode = 0; creator.open = false; creator.topic = null; creator.qline = 0; creator.el.className = 'bubble'; }
  } else {
    creator.group.visible = true;
    creator.group.position.y = groundY(creator.pos.x, creator.pos.z) + 1.5 + Math.sin(t * 1.2) * 0.12; // 漂浮起伏
    creator.core.rotation.y = t * 0.4; creator.core.rotation.x = t * 0.15; creator.shardGroup.rotation.y = -t * 0.6; // 自轉
    creator.coreMat.emissiveIntensity = 1.3 + Math.sin(t * 2.0) * 0.35; // 脈動
    const dc = Math.hypot(hero.position.x - creator.pos.x, hero.position.z - creator.pos.z);
    const near = !battle.active && !finaleActive && !archiveActive && dc < 7;
    if (!near) { creator.open = false; creator.topic = null; creator.qline = 0; }
    const state = !near ? 0 : (creator.open ? 2 : 1);
    if (state !== creator.mode) {
      creator.mode = state;
      if (state === 0) creator.el.className = 'bubble';
      else if (state === 1) { creator.el.className = 'bubble chip clickable show'; creator.el.innerHTML = '💬'; }
      else {
        const c = UI.creatorCast;
        const tp = c.topics.find((x) => x.id === creator.topic);
        const text = tp ? tp.a[Math.min(creator.qline, tp.a.length - 1)] : c.greeting;
        const moreBtn = (tp && creator.qline < tp.a.length - 1) ? `<span class="more" data-more>${c.more}</span>` : '';
        const menu = c.topics.map((x) => `<a class="qopt${x.id === creator.topic ? ' on' : ''}" data-q="${x.id}">${x.q}</a>`).join('');
        creator.el.className = 'bubble creatorbox clickable show';
        creator.el.innerHTML = `<b>${c.name}</b><span>${text}</span>${moreBtn}`
          + `<div class="qopts">${menu}<a class="qopt egg" data-egg>${UI.eggGame.launch}</a><a class="qext" href="https://toomore.net/" target="_blank" rel="noopener">${c.site}</a></div>`;
      }
    }
  }
  // 通關後白天世界三建物：僅 worldOpen 現身（紀念碑/燈塔/夥伴牆）
  if (lessonStele.group.visible !== worldOpen) { lessonStele.group.visible = lighthouse.group.visible = partnerWall.group.visible = worldOpen; }
  if (worldOpen) {
    lessonStele.gem.rotation.y = t * 0.5; lessonStele.gemMat.emissiveIntensity = 1.2 + Math.sin(t * 2) * 0.3;
    lighthouse.beamPivot.rotation.y = t * 0.6;                               // 光束緩掃海面
    lighthouse.lampMat.emissiveIntensity = 1.4 + Math.sin(t * 1.6) * 0.35;   // 燈室脈動
    if (lighthouse.lampLight) lighthouse.lampLight.intensity = 1.4 + Math.sin(t * 1.6) * 0.5;
  }
  // 灰龍：荒野上空慢慢繞圈 + 拍翅 + 偶爾吐藍火（背上白貓跟著）
  dragon.ang += dt * 0.12;
  {
    const r = 56 + Math.sin(t * 0.3) * 8, x = Math.cos(dragon.ang) * r, z = Math.sin(dragon.ang) * r;
    dragon.group.position.set(x, terrainHeight(x, z) + 13 + Math.sin(t * 1.4) * 0.5, z);
    dragon.group.rotation.y = -dragon.ang - Math.PI / 2;
    const flap = Math.sin(t * 6) * 0.18;
    dragon.wingL.rotation.set(1.35 + flap, 0, 0);    // 向兩側張開（滑翔感）、輕輕拍動
    dragon.wingR.rotation.set(-(1.35 + flap), 0, 0);
    if ((dragon.fireT -= dt) <= 0) { dragon.fireT = rand(5, 9); dragon.fireUntil = t + 1.0; }
    const firing = t < dragon.fireUntil;
    dragon.flameMat.opacity += ((firing ? 0.8 : 0) - dragon.flameMat.opacity) * Math.min(1, 6 * dt);
    dragon.flame.scale.set(1, 0.7 + (firing ? 0.4 + Math.sin(t * 30) * 0.15 : 0), 1);
  }
  // 黃貓：村裡漫遊（到點待一會兒再選新目標）
  {
    const c = ycat;
    if (c.wait > 0) { c.wait -= dt; c.tail.rotation.z = Math.sin(t * 3) * 0.15; }
    else {
      const dx = c.target.x - c.pos.x, dz = c.target.z - c.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.5) { c.wait = rand(1.5, 4); const a = rand(0, TAU), rr = rand(7, 26); c.target.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); }
      else { const inv = 1 / d; c.pos.x += dx * inv * 2.2 * dt; c.pos.z += dz * inv * 2.2 * dt; c.face += ((Math.atan2(dx, dz) - c.face + Math.PI * 3) % TAU - Math.PI) * Math.min(1, 8 * dt); c.tail.rotation.z = Math.sin(t * 9) * 0.35; }
    }
    const gy = groundY(c.pos.x, c.pos.z);
    c.group.position.set(c.pos.x, gy + Math.abs(Math.sin(t * 9)) * 0.05, c.pos.z);
    c.group.rotation.y = c.face;
  }
  // 綠色膠囊：抖動懸浮／靠近就原地旋轉縮小→消失／他處重生
  {
    const c = cap;
    if (c.state === 'idle') {
      const jx = Math.sin(t * 12 + c.ph) * 0.5 + Math.sin(t * 19) * 0.16;       // 快速左右
      const jy = Math.sin(t * 9 + c.ph * 1.7) * 0.35 + Math.sin(t * 25) * 0.1;  // 快速上下
      const jz = Math.cos(t * 14 + c.ph) * 0.5 + Math.cos(t * 21) * 0.16;       // 快速前後
      c.mesh.position.set(c.ax + jx, c.ay + jy, c.az + jz);
      c.mesh.rotation.y += dt * 1.6;
      if (c.scale < 1) { c.scale = Math.min(1, c.scale + dt * 3); c.mesh.scale.setScalar(c.scale); } // 出現彈大
      const d = Math.hypot(hero.position.x - c.ax, hero.position.z - c.az);
      if (!battle.active && !finaleActive && !archiveActive && d < CAP_TRIGGER) { c.state = 'spin'; c.t = 0; }
    } else if (c.state === 'spin') {
      c.t += dt;
      c.mesh.rotation.y += dt * (10 + c.t * 45);                                 // 原地越轉越快
      c.mesh.position.set(c.ax, c.ay + Math.sin(c.t * 30) * 0.1, c.az);
      const k = Math.min(1, c.t / CAP_SPIN_DUR); c.scale = 1 - k * k; c.mesh.scale.setScalar(Math.max(0.001, c.scale)); // 邊轉邊縮
      if (c.t >= CAP_SPIN_DUR) { ringBurst(c.ax, c.ay, c.az, 0x5bff8a, 5, 0.7); SFX.vanish(); met.capsule = true; c.state = 'gone'; c.t = 0; } // 消失光環＋音效
    } else { // gone：短暫隱藏後他處重生
      c.t += dt; c.mesh.scale.setScalar(0.001);
      if (c.t >= CAP_HIDE) capRespawn();
    }
    const lit = c.state !== 'gone';
    c.mat.emissiveIntensity = (lit ? 1.4 : 0) * (0.85 + Math.sin(t * 4 + c.ph) * 0.15);            // 綠光脈動
    if (c.light) c.light.intensity = (lit ? 1 : 0) * (1 - vibrancy) * 30 * (0.8 + Math.sin(t * 5) * 0.2); // 夜亮日滅
  }
  // 膽小地鼠光點：蹲地→靠近鑽地→他處冒出
  {
    const c = mole, busy = battle.active || finaleActive || archiveActive;
    if (c.state === 'rise') { c.t += dt; const k = Math.min(1, c.t / 0.4); c.mesh.scale.setScalar(k); c.mesh.position.set(c.ax, c.ay - 0.4 * (1 - k), c.az); if (k >= 1) { c.state = 'idle'; c.t = 0; } }
    else if (c.state === 'idle') {
      c.mesh.position.set(c.ax, c.ay + Math.sin(t * 3 + c.ph) * 0.08, c.az); c.mesh.scale.setScalar(1);
      if (!busy && Math.hypot(hero.position.x - c.ax, hero.position.z - c.az) < MOLE_TRIGGER) { c.state = 'dig'; c.t = 0; spawnDust(c.ax, groundY(c.ax, c.az), c.az, 0.6, { n: 9 }); SFX.burrow(); met.mole = true; }
    } else if (c.state === 'dig') { c.t += dt; const k = Math.min(1, c.t / 0.35); c.mesh.position.set(c.ax, c.ay - k * 0.9, c.az); c.mesh.scale.setScalar(Math.max(0.001, 1 - k)); if (k >= 1) { c.state = 'gone'; c.t = 0; } }
    else { c.t += dt; c.mesh.scale.setScalar(0.001); if (c.t >= 0.5) moleRespawn(); }
    const lit = c.state === 'idle' || c.state === 'rise';
    c.mat.emissiveIntensity = (lit ? 1.4 : 0) * (0.85 + Math.sin(t * 5 + c.ph) * 0.15);
    if (c.light) c.light.intensity = (lit ? 1 : 0) * (1 - vibrancy) * 22 * (0.8 + Math.sin(t * 4) * 0.2);
  }
  // 好奇光蝶：飄浮→中距離靠近玩家→太近急閃→他處重生
  {
    const c = moth, busy = battle.active || finaleActive || archiveActive;
    if (c.state === 'idle') {
      const d = Math.hypot(hero.position.x - c.ax, hero.position.z - c.az);
      if (!busy && d < MOTH_NOTICE && d > MOTH_FLEE) { const k = 0.7 * dt; c.ax += (hero.position.x - c.ax) * k; c.az += (hero.position.z - c.az) * k; c.ay = groundY(c.ax, c.az) + 2.6; }
      c.mesh.position.set(c.ax + Math.sin(t * 5 + c.ph) * 0.4, c.ay + Math.sin(t * 7 + c.ph * 1.3) * 0.3, c.az + Math.cos(t * 6 + c.ph) * 0.4);
      if (c.mesh.scale.x < 1) c.mesh.scale.setScalar(Math.min(1, c.mesh.scale.x + dt * 3));
      if (!busy && d < MOTH_FLEE) { c.state = 'flee'; c.t = 0; const a = Math.atan2(c.az - hero.position.z, c.ax - hero.position.x); c.dx = Math.cos(a); c.dz = Math.sin(a); SFX.flutter(); met.moth = true; }
    } else if (c.state === 'flee') {
      c.t += dt; c.ax += c.dx * 14 * dt; c.az += c.dz * 14 * dt; c.ay += 6 * dt; c.mesh.position.set(c.ax, c.ay, c.az);
      const k = Math.min(1, c.t / 0.5); c.mesh.scale.setScalar(Math.max(0.001, 1 - k));
      if (k >= 1) { ringBurst(c.ax, c.ay, c.az, 0x8fd6ff, 4, 0.6); c.state = 'gone'; c.t = 0; }
    } else { c.t += dt; c.mesh.scale.setScalar(0.001); if (c.t >= 0.5) mothRespawn(); }
    const lit = c.state !== 'gone';
    c.mat.emissiveIntensity = (lit ? 1.4 : 0) * (0.85 + Math.sin(t * 4 + c.ph) * 0.15);
    if (c.light) c.light.intensity = (lit ? 1 : 0) * (1 - vibrancy) * 24 * (0.8 + Math.sin(t * 5) * 0.2);
  }
  // 知識碎片：旋轉漂浮＋走近自動拾取
  for (const s of knowledgeShards) {
    if (s.got) continue;
    s.mesh.rotation.y += dt * 1.5; s.mesh.position.y = s.y + Math.sin(t * 1.8 + s.ph) * 0.18;
    s.m.emissiveIntensity = 0.8 + Math.sin(t * 3 + s.ph) * 0.3;
    if (!battle.active && !finaleActive && !archiveActive && Math.hypot(hero.position.x - s.x, hero.position.z - s.z) < SHARD_PICK) collectShard(s);
  }
  // 環境村民：村裡漫步＋靠近點擊出資安撇步泡泡
  for (const v of villagers) {
    if (v.wait > 0) v.wait -= dt;
    else {
      const dx = v.target.x - v.pos.x, dz = v.target.z - v.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.4) { v.wait = rand(2, 6); const a = rand(0, TAU), rr = rand(8, 26); v.target.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); }
      else { const inv = 1 / d; v.pos.x += dx * inv * 1.4 * dt; v.pos.z += dz * inv * 1.4 * dt; v.face += ((Math.atan2(dx, dz) - v.face + Math.PI * 3) % TAU - Math.PI) * Math.min(1, 8 * dt); }
    }
    const gy = groundY(v.pos.x, v.pos.z);
    v.group.position.set(v.pos.x, gy + Math.abs(Math.sin(t * 5 + v.face)) * 0.03, v.pos.z); v.group.rotation.y = v.face;
    const near = !battle.active && !finaleActive && !archiveActive && Math.hypot(hero.position.x - v.pos.x, hero.position.z - v.pos.z) < 6;
    if (!near) v.open = false;
    const state = !near ? 0 : (v.open ? 2 : 1);
    if (state !== v.mode) {
      v.mode = state;
      if (state === 0) v.el.className = 'bubble';
      else if (state === 1) { v.el.className = 'bubble chip clickable show'; v.el.innerHTML = '💬'; }
      else { const cast = UI.villagerCast[v.persona % UI.villagerCast.length], ls = worldOpen ? [UI.villagerHint[v.persona % UI.villagerHint.length]].concat(cast.lines) : cast.lines; v.el.className = 'bubble clickable show'; v.el.innerHTML = `<b>${cast.name}</b><span>${ls[v.line % ls.length]}</span><span class="more">${UI.villagerMore}</span>`; }
    }
  }
  // 沉浸感更新：環境音景＋天氣＋蝴蝶＋魚影＋飛鳥
  if (!archiveActive) SFX.ambient(dt, vibrancy);
  if (weather) {
    if (archiveActive) { weather.rmat.opacity = 0; for (const m of weather.mists) m.m.opacity = 0; }
    else {
      weather.timer -= dt;
      if (weather.timer <= 0) { const raining = weather.target > 0.5; weather.target = raining ? 0 : rand(0.65, 1.0); weather.timer = raining ? rand(45, 95) : rand(16, 32); }
      weather.amt += (weather.target - weather.amt) * Math.min(1, 0.4 * dt);
      const night = 1 - vibrancy, cam = camera.position;
      for (const m of weather.mists) {
        const mx = cam.x + m.ox + Math.sin(t * m.sp + m.ph) * 16, mz = cam.z + m.oz + Math.cos(t * m.sp * 0.8 + m.ph) * 16;
        m.s.position.set(mx, terrainHeight(mx, mz) + m.h, mz);
        m.m.opacity = 0.03 + 0.05 * night + weather.amt * 0.08;
      }
      const rp = weather.rgeo.attributes.position;
      for (let i = 0; i < rp.count; i++) { let y = rp.getY(i) - 62 * dt; if (y < 0) y += 42; rp.setY(i, y); }
      rp.needsUpdate = true;
      weather.rain.position.set(cam.x, cam.y - 20, cam.z);
      weather.rmat.opacity = weather.amt * 0.85;
    }
  }
  for (const b of butterflies) {
    const bx = b.cx + Math.sin(t * b.sp + b.ph) * b.rad, bz = b.cz + Math.cos(t * b.sp * 0.9 + b.ph) * b.rad;
    b.s.position.set(bx, groundY(bx, bz) + b.h + Math.sin(t * 1.5 + b.ph) * 0.4, bz);
    b.s.scale.set(0.18 + Math.abs(Math.sin(t * b.fl + b.ph)) * 0.5, 0.55, 1); // 拍翅：水平縮放
    b.m.opacity = archiveActive ? 0 : vibrancy * 0.9;
  }
  for (const f of fishSchools) {
    const ang = t * f.sp + f.ph, fx = f.cx + Math.cos(ang) * f.rad, fz = f.cz + Math.sin(ang) * f.rad;
    f.mesh.position.set(fx, WORLD.water - f.depth + Math.sin(t * 1.2 + f.ph) * 0.1, fz);
    f.mesh.rotation.y = -ang;
  }
  for (const b of birds) {
    const ang = t * b.sp + b.ph;
    b.s.position.set(Math.cos(ang) * b.r, b.h + Math.sin(t * 0.3 + b.ph) * 3, Math.sin(ang) * b.r);
    b.s.scale.y = b.base * (0.4 + Math.abs(Math.sin(t * b.fl + b.ph)) * 0.3); // 拍翅：垂直壓縮
    b.m.opacity = archiveActive ? 0 : vibrancy * 0.5;
  }
  for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.t += dt; const k = b.t / b.dur; b.ring.scale.setScalar(1 + k * b.mul); b.ring.material.opacity = Math.max(0, 0.85 * (1 - k)); if (k >= 1) { scene.remove(b.ring); b.ring.material.dispose(); b.ring.geometry.dispose(); bursts.splice(i, 1); } }
  // 落地塵土更新
  for (let i = dusts.length - 1; i >= 0; i--) {
    const d = dusts[i]; d.t += dt; const k = d.t / d.dur;
    for (const p of d.parts) { p.vel.y -= 5 * dt; p.m.position.addScaledVector(p.vel, dt); p.m.rotation.x += dt * 2.4; p.m.rotation.y += dt * 1.6; p.m.scale.multiplyScalar(1 + dt * 1.3); }
    d.mat.opacity = d.op * (1 - k);
    if (k >= 1) { for (const p of d.parts) scene.remove(p.m); d.mat.dispose(); dusts.splice(i, 1); }
  }
  // 腳印淡出
  for (let i = prints.length - 1; i >= 0; i--) { const f = prints[i]; f.t += dt; const k = f.t / f.dur; f.mat.opacity = f.op * (1 - k); if (k >= 1) { scene.remove(f.m); f.mat.dispose(); prints.splice(i, 1); } }

  // 座標框（按 G 開啟時才更新）：座標／fps + 火把探照即時調參
  if (coordsEl && coordsEl.classList.contains('show')) {
    const hx = hero.position.x, hz = hero.position.z;
    let deg = Math.atan2(hz, hx) * 180 / Math.PI; if (deg < 0) deg += 360;
    const tuneStr = torchParams.map((p, i) => { const s = `${p.label} ${p.fmt(torchTune[p.k])}`; return i === torchSel ? `<b style="color:#ffd24b">▸${s}</b>` : s; }).join('　');
    coordsEl.innerHTML = `x ${hx.toFixed(1)}　z ${hz.toFixed(1)}　｜　角度 ${deg.toFixed(0)}°　半徑 ${Math.hypot(hx, hz).toFixed(1)}　｜　fps ${Math.round(fpsAvg)}<br>🔧 調參（[ ] 選・ − ＝ 增減）：${tuneStr}`;
  }

  checkAchievements();
  mmAcc += dt; if (mmAcc > 0.08) { mmAcc = 0; drawMinimap(); }
  renderScene(); labelRenderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight); });
// ── 進場 landing（兼作世界生成等待畫面）──────────────────────────
function setupLanding() {
  const root = document.getElementById('landing');
  if (!root) return;
  // 五大主題預告：依推薦學習順序，文字直接取自當前語言的 RUINS（自動多語）
  const topics = root.querySelector('.topics');
  if (topics) topics.innerHTML = RUIN_ORDER.map((id) => {
    const r = (poiById(id) || {}).data; if (!r) return '';
    return `<div class="t"><span class="e">${r.emoji}</span><span class="n">${r.title}</span></div>`;
  }).join('');
  // landing 專用語言切換器（沿用 buildLangSwitcher 邏輯；少於 2 種語言不顯示）
  const langEl = root.querySelector('.landinglang');
  if (langEl && AVAILABLE_LANGS.length >= 2) {
    LANGS.filter((l) => AVAILABLE_LANGS.includes(l.id)).forEach((l) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = l.label;
      if (l.id === LANG) b.classList.add('on');
      b.addEventListener('click', () => { if (l.id === LANG) return; setLang(l.id); location.reload(); });
      langEl.appendChild(b);
    });
  }
  // landing 專用畫質切換器：自動／精簡／精緻（存 localStorage，沿用語言切換器的 reload 模式）
  const qEl = root.querySelector('.landingquality');
  if (qEl) {
    [['auto', UI.qualityAuto], ['low', UI.qualityLow], ['high', UI.qualityHigh]].forEach(([v, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      if (v === qOverride) b.classList.add('on');
      b.addEventListener('click', () => {
        if (v === qOverride) return;
        try { localStorage.setItem(QKEY, v); } catch (e) {}
        location.reload();
      });
      qEl.appendChild(b);
    });
  }
  // 「開始探險」：解鎖音訊 →「載入中」轉圈 → 非阻塞預編譯著色器 → 暖機數幀 → 淡出 landing 平順進場
  // （首幀卡頓主因是第一次 render 同步編譯全部著色器＋上傳貼圖；改用 compileAsync 預編譯，並在 landing 仍蓋著時暖機幾幀，把卡頓藏起來）
  const btn = document.getElementById('startbtn');
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  if (btn) btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    SFX.unlock();
    // 載入中狀態：重新顯示轉圈、按鈕轉文字
    btn.textContent = UI.landingLoading;
    const prep = root.querySelector('.prep'); if (prep) prep.classList.remove('done');
    await frame(); await frame();                              // 先讓「載入中」畫面上屏
    try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); } catch (e) {} // 非阻塞預編譯場景著色器（支援並行編譯時轉圈不卡）
    started = true;                                            // 開始模擬與渲染
    for (let i = 0; i < 3; i++) await frame();                 // 暖機數幀（後製 pass 著色器/貼圖上傳），landing 仍蓋著
    root.classList.add('hide');                                // 平順淡出 → 進入遊戲
    maybeShowPreConfidence();
  });
}
function landingReady() {
  const root = document.getElementById('landing'); if (!root) return;
  const prep = root.querySelector('.prep'); if (prep) prep.classList.add('done');
  const btn = document.getElementById('startbtn');
  if (btn) { btn.disabled = false; btn.textContent = UI.landingStart; }
}
setupLanding();
requestAnimationFrame(() => setTimeout(landingReady, 350));
