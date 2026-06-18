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
import { VILLAGE_BOARD, RUINS, OCF_STATUE, LEGEND, ARCHIVE_DOCS, WEAPON_CHEST, GUIDE_KIT } from './content.js';
import { WORLD, terrainHeight, groundY } from './terrain.js';
import { BATTLES } from './battles.js';
import { BattleSystem } from './battle.js';
import { SFX } from './audio.js';

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: false, envMapIntensity: 0.5, ...opts });
const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
// 貼圖載入（CC0 / Poly Haven）：albedo 用 sRGB、法線用線性；可平鋪
const _texL = new THREE.TextureLoader();
const tex = (url, rx = 1, ry = 1, srgb = false) => {
  const t = _texL.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4;
  return t;
};
// 結構石材＝水泥/混凝土貼圖（repeat 1；密度由 boxUV 依各物件大小烘進 UV → 大小物件一致）
const stoneMap = tex('./tex/concrete.webp', 1, 1, true), stoneNor = tex('./tex/concrete_n.webp', 1, 1);
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
const woodMap = tex('./tex/wood.webp', 1, 1, true), woodNor = tex('./tex/wood_n.webp', 1, 1);
const applyWood = (m) => { m.map = woodMap; m.normalMap = woodNor; m.normalScale = new THREE.Vector2(0.5, 0.5); m.color.set(0xc9a877); m.roughness = 0.82; m.needsUpdate = true; return m; };

// ── 渲染器 / 場景 / 鏡頭 ─────────────────────────────────────────
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
const MAX_PR = (() => { const cores = navigator.hardwareConcurrency || 4; if (!matchMedia('(pointer: coarse)').matches) return 3; return cores >= 8 ? 3 : 2; })(); // 裝置感知：桌機/高核心裝置才放寬到 3×
const PR = Math.min(window.devicePixelRatio || 1, MAX_PR);
renderer.setPixelRatio(PR);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
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

// 後製：色彩分級（世界繁榮度 0→1）+ SMAA 反鋸齒
const composer = new EffectComposer(renderer);
composer.setPixelRatio(PR);
composer.addPass(new RenderPass(scene, camera));
const gradePass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uVibrancy: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVibrancy; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      float sat = mix(0.18, 1.0, uVibrancy);
      vec3 tint = mix(vec3(0.60, 0.64, 0.72), vec3(1.0), uVibrancy); // 破敗偏冷灰 → 正常
      float br = mix(0.66, 1.0, uVibrancy);
      gl_FragColor = vec4(mix(vec3(l), c.rgb, sat) * tint * br, c.a); }`,
});
composer.addPass(gradePass);
composer.addPass(new SMAAPass(innerWidth, innerHeight));
composer.addPass(new OutputPass());
composer.setSize(innerWidth, innerHeight);

// ── 天空（顏色隨繁榮度由陰灰漸變到藍天）─────────────────────────
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: { top: { value: new THREE.Color(0x6d7682) }, bottom: { value: new THREE.Color(0x8f8b83) } },
  vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bottom;
    void main(){ float h=clamp(vP.y/560.0*0.5+0.5,0.0,1.0); h=pow(h,0.8); gl_FragColor=vec4(mix(bottom,top,h),1.0); }`,
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(560, 32, 16), skyMat));
// 繁榮度色盤（破敗 D → 繁榮 A）
const SKY_TOP_D = new THREE.Color(0x6d7682), SKY_TOP_A = new THREE.Color(0x4f9fd6);
const SKY_BOT_D = new THREE.Color(0x8f8b83), SKY_BOT_A = new THREE.Color(0xfae7cf);
const FOG_D = new THREE.Color(0x83878d), FOG_A = new THREE.Color(0xcfe4f0);

// ── 環境光（IBL）：用「繁榮天空」產生環境貼圖 → 水面映天、水晶/金屬反光、整體更立體 ──
// 只在載入時產生一次（靜態）；破敗時由 vibrancy 後製一起灰化，視覺一致、每幀零成本。
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
scene.add(new THREE.HemisphereLight(0xdcefff, 0x6b5a44, 0.6));
scene.add(new THREE.AmbientLight(0xffffff, 0.08));
const sun = new THREE.DirectionalLight(0xfff1d8, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 220;
sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun);
scene.add(sun.target);
// 主角隨身火把：照亮周圍一圈暖光（世界越荒蕪越亮、恢復後轉弱），帶輕微火光晃動
const torch = new THREE.PointLight(0xffb061, 0, 24, 2.0);
scene.add(torch);
// 火把投向前方地面的光錐：照亮腳前的路（讓前方地面也亮起來）
const torchGround = new THREE.SpotLight(0xffc079, 0, 32, Math.PI * 0.32, 0.6, 1.5);
scene.add(torchGround); scene.add(torchGround.target);

// 螢火蟲：固定在地圖某一地點的群聚特效（自體發光、漂浮閃爍；世界恢復後轉淡、室內關閉）
const FIREFLY_SPOT = new THREE.Vector3(18, 0, -10); // 群聚地點（可調整：用座標框 G 找位置）
const fireflyTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,242,170,0.9)');
  g.addColorStop(0.6, 'rgba(190,255,150,0.22)'); g.addColorStop(1, 'rgba(190,255,150,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const FIREFLY_BASE_Y = groundY(FIREFLY_SPOT.x, FIREFLY_SPOT.z); // 固定地點，地面高度只算一次
const fireflies = [];
const fireflyGroup = new THREE.Group(); scene.add(fireflyGroup);
for (let i = 0; i < 28; i++) {
  const lead = i < 2; // 前兩隻靠群中心、負責提燈微光
  const m = new THREE.SpriteMaterial({ map: fireflyTex, color: 0xfff0a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(m); s.scale.setScalar(lead ? rand(0.8, 1.1) : rand(0.5, 1.0)); fireflyGroup.add(s);
  fireflies.push({ s, m, ox: rand(-1, 1) * (lead ? 3 : 7), oz: rand(-1, 1) * (lead ? 3 : 7), h: rand(0.8, 3.2),
    sx: rand(0.12, 0.32), sz: rand(0.12, 0.32), ax: rand(1.2, 3.0), az: rand(1.2, 3.0), ph: rand(0, TAU), bob: rand(0.4, 1.0), tw: rand(1.6, 3.0) });
}
// 兩盞「螢火蟲提燈」：在群中心給一點暖綠微光
const fireflyLights = [new THREE.PointLight(0xcfffa0, 0, 9, 1.6), new THREE.PointLight(0xcfffa0, 0, 9, 1.6)];
fireflyLights.forEach((l) => scene.add(l));

// ── 地形 ────────────────────────────────────────────────────────
const segs = 240;
const tGeo = new THREE.PlaneGeometry(WORLD.half * 2, WORLD.half * 2, segs, segs);
tGeo.rotateX(-Math.PI / 2);
const tp = tGeo.attributes.position;
for (let i = 0; i < tp.count; i++) tp.setY(i, terrainHeight(tp.getX(i), tp.getZ(i)));
tGeo.computeVertexNormals();
// 依高度/坡度上色（沙岸 / 草地 / 岩石）
const cSand = lin(0xcdbb8e), cGrass = lin(0x82bd63), cGrass2 = lin(0x6fae57), cRock = lin(0x9a8e7c);
const colors = new Float32Array(tp.count * 3);
const nrm = tGeo.attributes.normal; const cTmp = new THREE.Color();
for (let i = 0; i < tp.count; i++) {
  const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i), slope = 1 - nrm.getY(i);
  let c;
  if (y < WORLD.water + 1.2) c = cSand;
  else if (y > 15 || slope > 0.5) c = cRock;
  else c = cTmp.copy(cGrass).lerp(cGrass2, Math.sin(x * 0.12) * Math.sin(z * 0.11) * 0.5 + 0.5); // 平滑色塊，避免格紋
  colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
}
tGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
// 地形材質：保留 vertexColors 分區，草地區（頂點色 g>r）以 shader 混入草皮細節、雙尺度打散重複；沙/岩不受影響
const grassTex = tex('./tex/grass.webp', 1, 1, true);
const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 1, normalMap: tex('./tex/ground_n.webp', 60, 60), normalScale: new THREE.Vector2(0.5, 0.5) });
terrainMat.onBeforeCompile = (sh) => {
  sh.uniforms.grassMap = { value: grassTex };
  sh.vertexShader = 'varying vec2 vTerUv;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vTerUv = uv;');
  sh.fragmentShader = 'uniform sampler2D grassMap;\nvarying vec2 vTerUv;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  {
    float gm = smoothstep(0.04, 0.16, vColor.g - vColor.r);                 // 只在草地（綠>紅）混入
    vec3 grass = mix(texture2D(grassMap, vTerUv * 36.0).rgb, texture2D(grassMap, vTerUv * 9.0).rgb, 0.5); // 雙尺度打散重複
    float gv = dot(grass, vec3(0.299, 0.587, 0.114));
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.72 + gv * 0.62), gm); // 以草皮明暗調變綠地、保留綠色基調
  }`);
};
const terrain = new THREE.Mesh(tGeo, terrainMat);
terrain.receiveShadow = true;
scene.add(terrain);

// 水面
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD.half * 2, WORLD.half * 2, 40, 40),
  new THREE.MeshStandardMaterial({ color: 0x4fa9d6, transparent: true, opacity: 0.82, roughness: 0.06, metalness: 0.4, envMapIntensity: 1.3 })
);
water.rotation.x = -Math.PI / 2; water.position.y = WORLD.water;
scene.add(water);

// ── 遺跡座標（先算位置，植被才能避開）────────────────────────────
const ruinAt = RUINS.map((r) => {
  const a = r.angle * Math.PI / 180;
  const x = Math.cos(a) * r.radius, z = Math.sin(a) * r.radius;
  return { ...r, x, z, y: groundY(x, z) };
});
// OCF 紀念碑座標（先算好，植被才能避開）
const ocfAt = (() => { const a = OCF_STATUE.angle * Math.PI / 180; const x = Math.cos(a) * OCF_STATUE.radius, z = Math.sin(a) * OCF_STATUE.radius; return { x, z, y: groundY(x, z) }; })();
function nearAnyRuin(x, z, d) {
  if (Math.hypot(x - ocfAt.x, z - ocfAt.z) < d) return true;
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
const trees = scatter(170, WORLD.villageR + 8, WORLD.maxR - 4, WORLD.water + 0.8, true);
const treeFoliage = instance(foliageGeo, mat(0x4e9d54), trees);
const treeTrunk = instance(trunkGeo, mat(0xc9b79c, { map: tex('./tex/bark.webp', 3, 2, true), normalMap: tex('./tex/bark_n.webp', 3, 2), normalScale: new THREE.Vector2(0.8, 0.8) }), trees);
// 撞樹擺動（純視覺）：每棵的傾斜彈簧狀態；玩家走進範圍 → 往遠離方向被推、再回擺站直
const treeSway = trees.map(() => ({ ang: 0, vel: 0, dx: 0, dz: 1 }));
const _tQ = new THREE.Quaternion(), _tQy = new THREE.Quaternion(), _tAx = new THREE.Vector3(), _tUp = new THREE.Vector3(0, 1, 0), _tObj = new THREE.Object3D();
// 岩石：3 種抖動石形 + 每顆隨機旋轉/非等比縮放/色調 → 自然多變（避免千篇一律）
const rockMap = tex('./tex/rock.webp', 1, 1, true), rockNor = tex('./tex/rock_n.webp', 1, 1);
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
  const rockPts = scatter(90, WORLD.villageR + 4, WORLD.maxR + 14, WORLD.water + 0.3, true);
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
const tuftMat = new THREE.MeshStandardMaterial({ map: tex('./tex/grass_blade.webp', 1, 1, true), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, metalness: 0, envMapIntensity: 0.4 });
const tufts = scatter(620, WORLD.villageR + 3, WORLD.maxR - 2, WORLD.water + 0.6, false);
const tuftMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, tufts.length);
const tuftTints = [0x86c45f, 0x6fae57, 0x95cf6c, 0x5f9c49];
{ const col = new THREE.Color(); tufts.forEach((p, i) => { dummy.position.set(p.x, p.y - 0.05, p.z); dummy.rotation.set(0, p.ry, 0); const s = p.s * 0.95; dummy.scale.set(s, s * rand(0.8, 1.25), s); dummy.updateMatrix(); tuftMesh.setMatrixAt(i, dummy.matrix); tuftMesh.setColorAt(i, col.set(tuftTints[(Math.random() * tuftTints.length) | 0])); }); }
tuftMesh.instanceMatrix.needsUpdate = true; if (tuftMesh.instanceColor) tuftMesh.instanceColor.needsUpdate = true; scene.add(tuftMesh);

// ── 村莊 ────────────────────────────────────────────────────────
const village = new THREE.Group();
scene.add(village);
// 廣場石地（雙色 + 中央紋飾 + 通往村口的步道）
const plaza = new THREE.Mesh(new THREE.CylinderGeometry(18, 18.5, 0.4, 48), mat(0xb6aa8e));
plaza.position.y = 0.1; plaza.receiveShadow = true; village.add(plaza); applyStone(plaza.material); boxUV(plaza.geometry);
const plazaIn = new THREE.Mesh(new THREE.CylinderGeometry(14, 14.2, 0.4, 48), mat(0xd6cbb0));
plazaIn.position.y = 0.22; plazaIn.receiveShadow = true; village.add(plazaIn); applyStone(plazaIn.material); boxUV(plazaIn.geometry);
const medallion = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.1, 32), mat(0xa89a7c));
medallion.rotation.x = -Math.PI / 2; medallion.position.y = 0.46; village.add(medallion);
const path = new THREE.Mesh(new THREE.BoxGeometry(3, 0.16, 20), mat(0xc9bb98));
path.position.set(0, 0.47, 11); path.receiveShadow = true; village.add(path);

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

// 低石牆 + 牆上石柱帽 + 村口拱門
const wall = new THREE.Mesh(new THREE.TorusGeometry(20, 0.6, 10, 64), mat(0xb3a88f));
wall.rotation.x = Math.PI / 2; wall.position.y = 0.85; wall.castShadow = true; village.add(wall); applyStone(wall.material); boxUV(wall.geometry);
for (let i = 0; i < 16; i++) { if (i === 4) continue; const a = i / 16 * TAU; const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.9), mat(0xa89a80)); cap.position.set(Math.cos(a) * 20, 1.35, Math.sin(a) * 20); cap.rotation.y = a; cap.castShadow = true; village.add(cap); }
const gate = new THREE.Group();
for (const gx of [-2.8, 2.8]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.4, 0.8), mat(0x8a5e34)); p.position.set(gx, 2.7, 0); p.castShadow = true; gate.add(p); }
const glintel = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.0, 1.0), mat(0x7e5630)); glintel.position.set(0, 5.4, 0); glintel.castShadow = true; gate.add(glintel);
const groof = new THREE.Mesh(new THREE.ConeGeometry(4.7, 1.5, 8), mat(0x9c5b3a)); groof.position.set(0, 6.6, 0); groof.rotation.y = Math.PI / 4; groof.castShadow = true; gate.add(groof);
const banner = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 0.1), mat(0xff7a45, { emissive: 0xff7a45, emissiveIntensity: 0.12 })); banner.position.set(0, 4.4, 0.55); gate.add(banner);
for (const lx of [-2.8, 2.8]) { const lan = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), mat(0xffe6a0, { emissive: 0xffcf6b, emissiveIntensity: 0.9 })); lan.position.set(lx, 4.7, 0.6); gate.add(lan); }
gate.position.set(0, 0, 20); village.add(gate);

// 小屋（石基 + 屋簷 + 煙囪 + 雙窗）
function cottage(color, roofC) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 4.7), mat(0x9a9080)); base.position.y = 0.25; base.castShadow = base.receiveShadow = true; g.add(base);
  const b = new THREE.Mesh(new THREE.BoxGeometry(5, 3.0, 4.5), mat(color)); b.position.y = 2.0; b.castShadow = b.receiveShadow = true; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(4.1, 2.6, 8), mat(roofC)); r.position.y = 4.7; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  const ch = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), mat(0x8a6a55)); ch.position.set(1.4, 5.1, -1.0); ch.castShadow = true; g.add(ch);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.12), mat(0x4a3526)); door.position.set(0, 1.45, 2.27); g.add(door);
  for (const wx of [-1.6, 1.6]) { const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.12), mat(0xffe9a8, { emissive: 0xffcf6b, emissiveIntensity: 0.4 })); win.position.set(wx, 2.3, 2.27); g.add(win); }
  return g;
}
const cottageColors = [[0x8fb98f, 0x55794f], [0xd9a577, 0x9c6b41], [0x8aa6c9, 0x4f6c92], [0xc98f9b, 0x8a5663], [0xcdb87e, 0x8a6e3a]];
// 精簡村莊：只留一間民房，另一間是檔案室（見下方 ARCHIVE）
const houseSpots = [[12, 5]];
houseSpots.forEach((s, i) => { const c = cottage(...cottageColors[i % cottageColors.length]); c.position.set(s[0], 0, s[1]); c.rotation.y = Math.atan2(-s[0], -s[1]); village.add(c); }); // 門（+z 面）朝中央水晶

// 提燈路燈
for (const lp of [[6, -1], [-3, 9], [8, 6], [-7, -2]]) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.6, 10), mat(0x55514a)); pole.position.y = 1.8; pole.castShadow = true; g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), mat(0x55514a)); arm.position.set(0.3, 3.5, 0); g.add(arm);
  const lan = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), mat(0xffe6a0, { emissive: 0xffcf6b, emissiveIntensity: 1.0 })); lan.position.set(0.55, 3.3, 0); g.add(lan);
  g.position.set(lp[0], 0, lp[1]); g.rotation.y = rand(0, TAU); village.add(g);
}

// 綠化：灌木、花、角落樹、旗幟
for (let i = 0; i < 10; i++) { const a = rand(0, TAU), rr = rand(7, 16); const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.6, 1.1), 1), mat(0x6fae57)); bush.position.set(Math.cos(a) * rr, 0.5, Math.sin(a) * rr); bush.scale.y = 0.8; bush.castShadow = true; village.add(bush); }
const flowerC = [0xff6f91, 0xffd166, 0xc792ea, 0xffffff];
for (let i = 0; i < 16; i++) { const a = rand(0, TAU), rr = rand(6, 17); const f = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), mat(flowerC[(Math.random() * flowerC.length) | 0])); f.position.set(Math.cos(a) * rr, 0.5, Math.sin(a) * rr); village.add(f); }
for (const tp of [[-15, -6], [15, -4]]) {
  const tg = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 10), mat(0x7a4a26)); tr.position.y = 1; tr.castShadow = true; tg.add(tr);
  let yy = 2; for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.6 - k * 0.4, 1.6, 12), mat(0x4e9d54)); c.position.y = yy + 0.8; c.castShadow = true; tg.add(c); yy += 1.0; }
  tg.position.set(tp[0], 0, tp[1]); village.add(tg);
}
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

// 村莊中央大水晶（全部遺跡進化後才啟動）
const greatBase = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 1.2, 12), mat(0x9a9080)); greatBase.position.set(0, 0.6, 0); greatBase.castShadow = greatBase.receiveShadow = true; village.add(greatBase); applyStone(greatBase.material); boxUV(greatBase.geometry);
const greatBase2 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 0.8, 12), mat(0xb0a896)); greatBase2.position.set(0, 1.4, 0); greatBase2.castShadow = true; village.add(greatBase2); applyStone(greatBase2.material); boxUV(greatBase2.geometry);
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
  const logoTex = new THREE.TextureLoader().load('./ocf_logo.png'); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.anisotropy = 4;
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
  const lab = makeLabel(`${VILLAGE_BOARD.emoji} 村長告示牌`); lab.o.position.set(0, 5.4, 0); board.add(lab.o);
  POIS.push({ data: VILLAGE_BOARD, isRuin: false, pos: new THREE.Vector3(-9.2, 0, 13.1), el: lab.el, openDist: 4.5 });
}
// 遺跡 POI
ruinAt.forEach((r) => {
  const built = buildRuin(r); texturizeStone(built.group);
  const lab = makeLabel(`❔ 未知遺跡`); lab.o.position.set(0, 9, 0); built.group.add(lab.o);
  POIS.push({ data: r, isRuin: true, pos: new THREE.Vector3(r.x, r.y, r.z), el: lab.el, openDist: 6.5, discoverDist: 8, ...built, lift: 0 });
});
// OCF 紀念碑 POI（非課程：無戰鬥、不計進度、不影響繁榮度與終局）
// 每次遊戲載入都從「未點亮」開始，玩家靠近才點燃（本次遊玩內保持點亮）＝給 OCF 添柴火的儀式感
const ocfMon = (() => {
  const built = buildOcf(); texturizeStone(built.group);
  built.group.position.set(ocfAt.x, ocfAt.y, ocfAt.z);
  built.group.rotation.y = Math.atan2(-ocfAt.x, -ocfAt.z);
  const lab = makeLabel(`${OCF_STATUE.emoji} OCF 紀念碑`); lab.o.position.set(0, 8, 0); built.group.add(lab.o);
  POIS.push({ data: OCF_STATUE, isRuin: false, pos: new THREE.Vector3(ocfAt.x, ocfAt.y, ocfAt.z), el: lab.el, openDist: 6 });
  return { ...built, pos: new THREE.Vector3(ocfAt.x, ocfAt.y, ocfAt.z), el: lab.el, lit: 0, ignited: false };
})();
const OCF_GOLD = new THREE.Color(OCF_STATUE.color);
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
  const tex = new THREE.TextureLoader().load('./legend.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
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
let archiveActive = false, archEnterArmed = true, archExitArmed = true;
const archFadeEl = document.getElementById('fade');
const archFade = { on: false, t: 0, dur: 0.7, mid: false, go: null };
const startArchFade = (go) => { archFade.on = true; archFade.t = 0; archFade.mid = false; archFade.go = go; };
function enterArchive() { startArchFade(() => { hero.position.set(0, ARCHIVE_FLOOR, 2); hero.rotation.y = Math.PI; archiveActive = true; archiveRoom.visible = true; archExitArmed = false; hero.visible = false; yaw = 0; pitch = 0.15; if (panelId) hidePanel(); }); }
function exitArchive() { startArchFade(() => { hero.position.set(ARCHIVE.back.x, 0, ARCHIVE.back.z); hero.rotation.y = Math.PI / 2; archiveActive = false; archiveRoom.visible = false; archEnterArmed = false; hero.visible = true; yaw = Math.PI; pitch = 0.6; if (panelId) hidePanel(); camera.position.set(ARCHIVE.back.x + 6, 4, ARCHIVE.back.z + 4); }); }
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
  const lab = makeLabel('📚 檔案室'); lab.o.position.set(2.4, 4.7, 0); g.add(lab.o);
  scene.add(g);
}
// 隱藏室內房間（世界下方，平時 visible=false）
const archiveRoom = new THREE.Group(); archiveRoom.position.set(0, ARCHIVE.roomY, 0); archiveRoom.visible = false; scene.add(archiveRoom);
{
  const g = archiveRoom, wallMat = applyStone(mat(0xffffff)), woodM = RUIN.wood;
  const add = (geo, m, x, y, z) => { boxUV(geo); const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(15, 0.4, 13), wallMat, 0, 0, 0);            // 地板
  add(new THREE.BoxGeometry(15, 0.4, 13), wallMat, 0, 5, 0);            // 天花
  add(new THREE.BoxGeometry(0.4, 5, 13), wallMat, -7.3, 2.5, 0);        // 左牆
  add(new THREE.BoxGeometry(0.4, 5, 13), wallMat, 7.3, 2.5, 0);         // 右牆
  add(new THREE.BoxGeometry(15, 5, 0.4), wallMat, 0, 2.5, -6.3);        // 後牆
  add(new THREE.BoxGeometry(6, 5, 0.4), wallMat, -4.5, 2.5, 6.3);       // 前牆左段
  add(new THREE.BoxGeometry(6, 5, 0.4), wallMat, 4.5, 2.5, 6.3);        // 前牆右段（中間留門）
  add(new THREE.BoxGeometry(3, 1.2, 0.4), wallMat, 0, 4.4, 6.3);        // 前牆門楣
  for (const bx of [-5.6, 5.6]) add(new THREE.BoxGeometry(2.4, 4, 0.7), woodM, bx, 2, -5.7); // 書架
  const lamp = new THREE.PointLight(0xffe6b8, 55, 38, 1.5); lamp.position.set(0, 4.2, 0); g.add(lamp);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff0cf })); bulb.position.set(0, 4.3, 0); g.add(bulb);
  ARCHIVE_DOCS.forEach((d, i) => {
    const dx = (i - 1) * 4.2;
    add(new THREE.BoxGeometry(1.8, 1.0, 0.7), woodM, dx, 0.5, -5.0);          // 展示基座
    const cw = 1.5, tilt = -0.12;                                            // 封面（正方形、幾乎直立、略後仰、正面朝玩家 +z）
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(cw + 0.16, cw + 0.16), new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 0.6 }));
    frame.position.set(dx, 1.88, -4.86); frame.rotation.x = tilt; g.add(frame);
    const cover = new THREE.Mesh(new THREE.PlaneGeometry(cw, cw), new THREE.MeshBasicMaterial({ map: tex(d.cover, 1, 1, true) }));
    cover.position.set(dx, 1.88, -4.85); cover.rotation.x = tilt; g.add(cover);
    const lab = makeLabel(`${d.emoji} ${d.title}`); lab.o.position.set(dx, 3.0, -4.86); g.add(lab.o);
    POIS.push({ data: d, isRuin: false, area: 'archive', pos: new THREE.Vector3(dx, ARCHIVE.roomY, -3.2), el: lab.el, openDist: 3.4 });
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
  return { ...built, ruin: r, pos: new THREE.Vector3(x, y, z), el, life: 0, baseY: y, mode: -1 };
});

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
  return { group: g, orb, orbMat };
}
// 綠袍法師（村中嚮導 NPC）
const mage = (() => {
  const built = buildMage();
  const x = 4.4, z = 15.2, y = groundY(x, z);
  built.group.position.set(x, y, z); built.group.rotation.y = Math.atan2(0 - x, 0 - z); scene.add(built.group); // 面向中央水晶（村心）
  const el = document.createElement('div'); el.className = 'bubble'; const o = new CSS2DObject(el); o.position.set(0, 3.5, 0); built.group.add(o);
  return { ...built, pos: new THREE.Vector3(x, y, z), baseY: y, el, mode: -1 };
})();
const MAGE_TIP = '走出村莊，找回散落各地的「資安遺跡」並點亮水晶。遇到守關怪物時，用課程裡學到的小知識回擊就行！';
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
const WATER_LINES = ['哇！水好冰～', '我的鞋全濕了…', '撲通！這裡能游泳嗎？', '等等，我不太會游泳啦！', '冷颼颼…該上岸了。'];
const IDLE_LINES = [
  // 資安小提醒
  '可疑連結，絕對不點！',
  '雙重驗證開了，帳號才安心～',
  '密碼別重複用，一站一個才安全。',
  '長密碼短語，又好記又難破解。',
  '備份要 3-2-1：三份、兩種、一份離線。',
  '釣魚信？騙不了我的。',
  '公共 Wi-Fi 還是開個 VPN 比較安心。',
  '手機螢幕鎖，一定要設好。',
  '系統更新跳出來，就乖乖更新吧。',
  '密碼管理器幫我記，我只要記一組。',
  '收到「帳號異常」別緊張，自己開官網確認。',
  '備份碼收好了，換手機也不怕。',
  '中了勒索別付贖金，先靠備份救。',
  '主管突然要我買點數？先打通電話確認。',
  '權限給剛剛好就好，這叫最小權限。',
  'Passkey 聽說又方便又安全，來研究看看。',
  '重要訊息，加密傳才放心。',
  '密碼好像外洩了？先改密碼、再開 MFA。',
  '網址拼錯一個字，可能就是假網站。',
  '離職同事的帳號，記得要收回。',
  '定期看看帳號的登入紀錄。',
  '不明附件先別開，確認寄件人再說。',
  'QR Code 也可能是陷阱，掃之前想一下。',
  '備份做了嗎？我有做喔。',
  // 氛圍穿插
  '今天也要好好保護村子。',
  '前面的遺跡好像在發光？',
  '走走走，去探險！',
  '風好舒服…',
  '不知道村民們什麼時候會醒來。',
];
const pick = (a) => a[(Math.random() * a.length) | 0];
let sayTimer = 0, idleTalkTimer = 3, wasInWater = false;
function heroSay(text, dur = 3) { heroBubbleEl.textContent = text; heroBubbleEl.classList.add('show'); sayTimer = dur; }

// ── 控制 ────────────────────────────────────────────────────────
const keys = new Set();
addEventListener('keydown', (e) => { if (e.code === 'Space') e.preventDefault(); keys.add(e.code); });
addEventListener('keyup', (e) => { keys.delete(e.code); });
let yaw = Math.PI, pitch = 0.6, dist = 30;
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
      if (len > WORLD.maxR) hitPoint.multiplyScalar(WORLD.maxR / len);
      moveTarget.copy(hitPoint); hasTarget = true;
    }
  }
  pDown = false; dragging = false;
});
addEventListener('wheel', (e) => { dist = THREE.MathUtils.clamp(dist + e.deltaY * 0.025, 16, 72); }, { passive: true });
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
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ } };
const isDisc = (id) => progress.discovered.includes(id);
const isDone = (id) => progress.completed.includes(id);

// 世界繁榮度（0 破敗 → 1 繁榮）：發現各 0.3、進化各 0.7
let vibrancy = 0, vibrancyTarget = 0, greatGlow = 0;
function computeVibrancy() {
  let d = 0, c = 0;
  for (const r of ruinAt) { if (isDisc(r.id)) d++; if (isDone(r.id)) c++; }
  vibrancyTarget = (d * 0.3 + c * 0.7) / ruinAt.length;
}

// ── HUD ─────────────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const panel = $('#panel'); const pEmoji = panel.querySelector('.emoji'); const pTitle = panel.querySelector('h2');
const pSub = panel.querySelector('.sub'); const pDesc = panel.querySelector('.desc'); const pChips = panel.querySelector('.chips');
const pGo = panel.querySelector('.go'); const pState = panel.querySelector('.state'); const pClose = panel.querySelector('.close'); const pFight = panel.querySelector('.fight');
const badge = $('#badge'); const toastEl = $('#toast'); const logBtn = $('#logbtn'); const logEl = $('#questlog'); const logList = $('#questlog .list');
let panelId = null, pinnedId = null; const suppressed = new Set();

function poiById(id) { return POIS.find((p) => p.data.id === id); }
function showPanel(p) {
  const d = p.data; panelId = d.id;
  POIS.forEach((x) => x.el.classList.toggle('is-active', x === p));
  pEmoji.textContent = d.emoji; pTitle.textContent = d.title; pSub.textContent = d.sub;
  pDesc.textContent = d.desc; pGo.href = d.url;
  pChips.innerHTML = ''; d.chips.forEach((c) => { const s = document.createElement('span'); s.className = 'chip'; s.textContent = c; pChips.appendChild(s); });
  const hasBattle = p.isRuin && !!BATTLES[d.id];
  pFight.style.display = (hasBattle && !isDone(d.id)) ? '' : 'none';
  if (!p.isRuin) { pState.textContent = d.stateText || '村莊任務'; pGo.textContent = d.goText || '了解怎麼開始 →'; }
  else if (hasBattle) { pState.textContent = isDone(d.id) ? '✅ 已淨化' : '⚔️ 有守關怪物'; pGo.textContent = '先閱讀章節備戰 →'; }
  else { pState.textContent = isDone(d.id) ? '✅ 已閱讀完成' : '尚未閱讀'; pGo.textContent = isDone(d.id) ? '再讀一次 →' : '閱讀此遺跡課程 →'; }
  panel.classList.toggle('story', !!d.story); pGo.style.display = d.noLink ? 'none' : ''; // 傳說面板：全文不截斷、隱藏前往鍵
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
pGo.addEventListener('click', () => { const p = poiById(panelId); if (p && p.isRuin && !BATTLES[p.data.id] && !isDone(p.data.id)) { progress.completed.push(p.data.id); save(); SFX.complete(); updateHud(); showPanel(p); computeVibrancy(); spawnBurst(p); afterCompleteToast(p); checkAllDone(); } });

// 點亮遺跡外觀（水晶、光束、標籤）
function lightRuin(p) {
  p.el.textContent = `${p.data.emoji} ${p.data.title}`;
  p.crystalMat.color.set(p.data.color); p.crystalMat.emissive.set(p.data.color); p.crystalMat.emissiveIntensity = 1.7;
  p.crystal.scale.setScalar(1.18);
  p.beamMat.color.set(p.data.color); // 光束/光環/地面光環的亮度由主迴圈依 isDisc 控制
  if (p.motes) p.motes.visible = true;
}
// 戰鬥
const battle = new BattleSystem({ scene, camera, hero });
function startBattle(p) {
  hidePanel(); suppressed.add(p.data.id); pinnedId = null;
  battle.start(p, BATTLES[p.data.id]).then(({ won }) => {
    if (won) {
      if (!isDisc(p.data.id)) progress.discovered.push(p.data.id);
      if (!isDone(p.data.id)) progress.completed.push(p.data.id);
      save(); lightRuin(p); updateHud(); computeVibrancy(); spawnBurst(p); afterCompleteToast(p); checkAllDone();
    }
    suppressed.delete(p.data.id);
  });
}
pFight.addEventListener('click', () => { const p = poiById(panelId); if (p && BATTLES[p.data.id]) startBattle(p); });

function discover(p) {
  progress.discovered.push(p.data.id); save(); SFX.discover();
  lightRuin(p);
  toast(`🗺️ 發現遺跡`, `${p.data.emoji} ${p.data.title} — ${p.data.sub}`);
  spawnBurst(p); updateHud(); computeVibrancy();
}
let allDoneShown = false, finaleActive = false, finaleT = 0, finaleShown = false;
function afterCompleteToast(p) {
  const left = ruinAt.length - progress.completed.length;
  const title = p.data.defense ? `🛡️ 重建了「${p.data.defense}」` : '🎉 遺跡淨化！';
  if (left > 0) toast(title, `${p.data.title} 已點亮 — 再點亮 ${left} 座，中央大水晶就會甦醒`);
}
function showFinaleOverlay() {
  const f = document.getElementById('finale');
  f.querySelector('.badges').innerHTML = ruinAt.map((r) => `<span title="${r.title}">${r.emoji}</span>`).join('');
  // B 英雄守則卷軸：把每關現成的 tip（回家小提醒）收攏成可截圖的個人行動清單
  f.querySelector('.scroll').innerHTML = ruinAt
    .map((r) => `<div class="item"><span class="ico">${r.emoji}</span><span class="tx"><b>${r.defense || r.title}</b>${r.tip || ''}</span></div>`)
    .join('');
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
const CONF_LEVELS = [{ e: '😟', l: '不太有把握' }, { e: '😐', l: '普通' }, { e: '🙂', l: '蠻有把握' }];
function showConfidence(phase, onDone) {
  const root = document.getElementById('confidence');
  root.querySelector('.cq').textContent = phase === 'pre'
    ? '出發前，你對「保護自己的數位安全」有多少把握？' : '走完這趟旅程，現在你的把握是？';
  root.querySelector('.csub').textContent = phase === 'pre'
    ? '一指選一個就好，通關時會再問一次。' : '和出發前比比看吧。';
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
  const msg = b > a ? '把握度提升了，繼續保持！' : b === a ? '穩穩守住了把握度。' : '別氣餒，回章節再練練就更穩。';
  el.textContent = `把握度：${CONF_FACES[a]} → ${CONF_FACES[b]}　${msg}`;
}
function maybeShowPreConfidence() {
  if (localStorage.getItem(CONF_PRE) != null) return;
  setTimeout(() => showConfidence('pre'), 800);
}
function checkAllDone() {
  if (allDoneShown || !ruinAt.every((r) => isDone(r.id))) return;
  allDoneShown = true;
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
  badge.innerHTML = `🗺️ 發現 <b>${d}/${ruinAt.length}</b> ・ ✅ 閱讀 <b>${c}/${ruinAt.length}</b>`;
  logList.innerHTML = '';
  ruinAt.forEach((r) => {
    const row = document.createElement('div'); row.className = 'q';
    const st = isDone(r.id) ? ['done', '已閱讀'] : isDisc(r.id) ? ['disc', '已發現'] : ['none', '未發現'];
    row.innerHTML = `<span class="qi">${isDisc(r.id) ? r.emoji : '❔'}</span><span class="qt">${isDisc(r.id) ? r.title : '未知遺跡'}<i>${isDisc(r.id) ? r.sub : '到荒野探索找找看'}</i></span><span class="qp ${st[0]}">${st[1]}</span>`;
    if (isDisc(r.id)) { row.style.cursor = 'pointer'; row.addEventListener('click', () => { const p = poiById(r.id); pinnedId = r.id; suppressed.delete(r.id); showPanel(p); logEl.classList.remove('show'); }); }
    logList.appendChild(row);
  });
}
logBtn.addEventListener('click', () => logEl.classList.toggle('show'));
// 靜音開關
const soundBtn = document.getElementById('soundbtn');
const refreshSound = () => { soundBtn.textContent = SFX.isMuted() ? '🔇' : '🔊'; soundBtn.setAttribute('aria-pressed', String(SFX.isMuted())); };
soundBtn.addEventListener('click', () => { SFX.unlock(); SFX.toggle(); refreshSound(); });
refreshSound();

// 重置進度：清空 localStorage，所有遺跡回到未發現狀態
function resetRuinVisual(p) {
  p.el.textContent = '❔ 未知遺跡'; p.el.classList.remove('is-active');
  p.crystalMat.color.set(0x9aa3ad); p.crystalMat.emissive.set(0x2a2f38); p.crystalMat.emissiveIntensity = 0.45;
  p.crystal.scale.setScalar(1.0);
  p.beamMat.color.set(0xbfc6cf); // 光束亮度由主迴圈依 isDisc 自動調回
  if (p.motes) p.motes.visible = false;
}
function resetProgress() {
  if (!window.confirm('確定要重置所有遺跡進度嗎？此動作無法復原。')) return;
  progress = { discovered: [], completed: [] }; save();
  try { localStorage.removeItem(CONF_PRE); localStorage.removeItem(CONF_POST); } catch (e) { /* ignore */ }
  const cc = document.querySelector('#finale .confcompare'); if (cc) cc.textContent = '';
  allDoneShown = false; pinnedId = null; suppressed.clear(); hidePanel();
  POIS.forEach((p) => { if (p.isRuin) resetRuinVisual(p); });
  logEl.classList.remove('show'); document.getElementById('finale').classList.remove('show'); finaleActive = false; finaleShown = false; updateHud(); computeVibrancy();
  toast('🔄 進度已重置', '所有遺跡回到未發現狀態');
}
document.getElementById('resetbtn').addEventListener('click', resetProgress);
// 還原已發現遺跡的外觀
POIS.forEach((p) => { if (p.isRuin && isDisc(p.data.id)) lightRuin(p); });
updateHud(); allDoneShown = ruinAt.every((r) => isDone(r.id)); computeVibrancy(); vibrancy = vibrancyTarget;

// 擴散光環（mul=擴張倍率、dur=持續秒數）
const bursts = [];
function ringBurst(x, y, z, color, mul, dur) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.28, 8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = Math.PI / 2; ring.position.set(x, y, z); scene.add(ring);
  bursts.push({ ring, t: 0, mul, dur });
}
function spawnBurst(p) { ringBurst(p.pos.x, p.pos.y + 1.2, p.pos.z, p.data.color, 6, 0.9); }

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

// ── 小地圖 ──────────────────────────────────────────────────────
const mm = $('#minimap canvas'); const mc = mm.getContext('2d'); const MMR = 76;
const w2m = (x, z) => { let mx = (x / WORLD.maxR) * MMR, mz = (z / WORLD.maxR) * MMR; const l = Math.hypot(mx, mz); if (l > MMR) { mx *= MMR / l; mz *= MMR / l; } return [88 + mx, 88 + mz]; };
function drawMinimap() {
  mc.clearRect(0, 0, 176, 176);
  mc.save(); mc.beginPath(); mc.arc(88, 88, MMR + 6, 0, TAU); mc.clip();
  mc.fillStyle = '#9ccb78'; mc.beginPath(); mc.arc(88, 88, MMR + 6, 0, TAU); mc.fill();
  mc.fillStyle = 'rgba(110,180,90,.6)'; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r = MMR * 0.7; mc.beginPath(); mc.arc(88 + Math.cos(a) * r, 88 + Math.sin(a) * r, 3, 0, TAU); mc.fill(); }
  // 村莊
  const [vx, vy] = w2m(0, 0); mc.fillStyle = '#cfc4ab'; mc.beginPath(); mc.arc(vx, vy, 9, 0, TAU); mc.fill();
  mc.fillStyle = '#7e5630'; mc.font = '10px sans-serif'; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText('村', vx, vy);
  // 遺跡
  ruinAt.forEach((r) => {
    const [x, y] = w2m(r.x, r.z);
    if (!isDisc(r.id)) { mc.strokeStyle = 'rgba(40,50,40,.55)'; mc.setLineDash([3, 3]); mc.beginPath(); mc.arc(x, y, 6, 0, TAU); mc.stroke(); mc.setLineDash([]); mc.fillStyle = 'rgba(40,50,40,.65)'; mc.fillText('?', x, y); }
    else { mc.fillStyle = '#' + r.color.toString(16).padStart(6, '0'); mc.beginPath(); mc.arc(x, y, 6, 0, TAU); mc.fill(); if (isDone(r.id)) { mc.strokeStyle = '#fff'; mc.lineWidth = 2; mc.beginPath(); mc.arc(x, y, 6, 0, TAU); mc.stroke(); } }
  });
  // 玩家
  const [hx, hy] = w2m(hero.position.x, hero.position.z); const a = hero.rotation.y;
  mc.fillStyle = '#ff7a45'; mc.beginPath();
  mc.moveTo(hx + Math.sin(a) * 7, hy + Math.cos(a) * 7);
  mc.lineTo(hx + Math.sin(a + 2.5) * 5, hy + Math.cos(a + 2.5) * 5);
  mc.lineTo(hx + Math.sin(a - 2.5) * 5, hy + Math.cos(a - 2.5) * 5);
  mc.closePath(); mc.fill();
  mc.restore();
  mc.strokeStyle = 'rgba(29,36,51,.25)'; mc.lineWidth = 3; mc.beginPath(); mc.arc(88, 88, MMR + 6, 0, TAU); mc.stroke();
}

// ── 主迴圈 ──────────────────────────────────────────────────────
const timer = new THREE.Timer();
const up = new THREE.Vector3(0, 1, 0), fwd = new THREE.Vector3(), right = new THREE.Vector3(), moveDir = new THREE.Vector3();
const camPos = new THREE.Vector3(), lookAt = new THREE.Vector3();
let walkPhase = 0, mmAcc = 0, lastStepFloor = 0;
let jumpVel = 0, jumpOff = 0, jumpHeld = false; // 跳躍：地面高度之上的位移
let doubleJumped = false, spinning = false, spinT = 0, yawBeforeSpin = 0; // 二段跳 + 空中轉一圈
const SPIN_DUR = 0.55;
// 座標框（開發／定位用）：預設隱藏，按 G 切換顯示（輸入框聚焦時不觸發，例如戰鬥密碼題）
const coordsEl = document.getElementById('coords');
addEventListener('keydown', (e) => { if (e.code === 'KeyG' && document.activeElement?.tagName !== 'INPUT') coordsEl.classList.toggle('show'); });

function animate() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05), t = timer.getElapsed();

  joyEl.classList.toggle('hide', battle.active || finaleActive);
  jumpBtn.classList.toggle('hide', battle.active || finaleActive || panelId !== null); // 對話框開啟時收起，避免擋到面板的連結
  if (battle.active) { labelRenderer.domElement.style.display = 'none'; gradePass.uniforms.uVibrancy.value = 1; battle.update(dt); composer.render(); return; }
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
    hero.position.addScaledVector(moveDir, (sprint ? 26 : 16) * dt);
    const len = Math.hypot(hero.position.x, hero.position.z);
    if (!archiveActive && len > WORLD.maxR) hero.position.multiplyScalar(WORLD.maxR / len);
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
    walkPhase += dt * (sprint ? 18 : 12); const s = Math.sin(walkPhase);
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
    // 牆壁可穿越：第一人稱下走出任一面牆（超出房間範圍）即離開檔案室
    if (Math.abs(hero.position.x) > 7.6 || Math.abs(hero.position.z) > 6.6) { if (archExitArmed) { archExitArmed = false; exitArchive(); } } else archExitArmed = true;
  }
  if (archiveActive) hero.position.y = ARCHIVE_FLOOR + jumpOff; // 室內地板高度（覆蓋地形跟隨）

  // 對話泡：踩水反應 + 漫步自言自語
  if (sayTimer > 0) { sayTimer -= dt; if (sayTimer <= 0) heroBubbleEl.classList.remove('show'); }
  const inWater = groundH < WORLD.water + 0.2;
  if (!finaleActive && !archiveActive) {
    if (inWater && !wasInWater && sayTimer <= 0) heroSay(pick(WATER_LINES), 2.6);
    idleTalkTimer -= dt;
    if (idleTalkTimer <= 0) { idleTalkTimer = rand(4, 8); if (sayTimer <= 0 && !inWater && moving) heroSay(pick(IDLE_LINES), 3); }
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
  // 隨身火把：跟著主角、略偏視線前方；世界越暗越亮（隨 vibrancy 轉弱）；室內檔案室不需要
  torch.position.set(hero.position.x + fwd.x * 2, hero.position.y + 2.4, hero.position.z + fwd.z * 2);
  torch.intensity = archiveActive ? 0 : 52 * (1 - 0.7 * vibrancy) * (0.92 + Math.sin(t * 6.7) * 0.05 + Math.sin(t * 13.3) * 0.03);
  // 火把地面光錐：從頭頂斜射到前方地面，照亮腳前的路
  torchGround.position.set(hero.position.x, hero.position.y + 3.4, hero.position.z);
  { const gx = hero.position.x + fwd.x * 6, gz = hero.position.z + fwd.z * 6; torchGround.target.position.set(gx, groundY(gx, gz), gz); torchGround.target.updateMatrixWorld(); }
  torchGround.intensity = archiveActive ? 0 : 120 * (1 - 0.7 * vibrancy) * (0.94 + Math.sin(t * 6.7) * 0.04);
  // 螢火蟲：固定地點群聚、漂浮閃爍；越暗越亮、室內關閉
  {
    const ffBright = archiveActive ? 0 : (1 - 0.5 * vibrancy);
    for (const f of fireflies) {
      const fx = FIREFLY_SPOT.x + f.ox + Math.sin(t * f.sx + f.ph) * f.ax;
      const fz = FIREFLY_SPOT.z + f.oz + Math.cos(t * f.sz + f.ph) * f.az;
      f.s.position.set(fx, FIREFLY_BASE_Y + f.h + Math.sin(t * f.bob + f.ph) * 0.6, fz);
      f.m.opacity = ffBright * (0.18 + 0.82 * (0.5 + 0.5 * Math.sin(t * f.tw + f.ph * 2.3)));
    }
    fireflyLights[0].position.copy(fireflies[0].s.position); fireflyLights[1].position.copy(fireflies[1].s.position);
    const ffLi = archiveActive ? 0 : 14 * (1 - 0.5 * vibrancy);
    fireflyLights[0].intensity = ffLi * (0.7 + 0.3 * Math.sin(t * 3.1));
    fireflyLights[1].intensity = ffLi * (0.7 + 0.3 * Math.sin(t * 2.3 + 1));
  }

  // POI 鄰近 / 發現 / 面板
  let near = null, nd = Infinity;
  for (const p of POIS) {
    if ((p.area || 'world') !== (archiveActive ? 'archive' : 'world')) continue; // 只判定當前空間的 POI
    const d = Math.hypot(hero.position.x - p.pos.x, hero.position.z - p.pos.z);
    if (d < p.openDist && d < nd) { nd = d; near = p; }
    if (p.isRuin) {
      const want = (d < p.openDist) ? 1 : 0; p.lift += (want - p.lift) * Math.min(1, 6 * dt);
      const lit = isDisc(p.data.id);
      p.crystal.position.y = 3.4 + Math.sin(t * 1.5 + p.pos.x) * 0.25; p.crystal.rotation.y += dt * (lit ? 1.3 : 0.35);
      p.beamMat.opacity = (lit ? 0.42 : 0.12) + Math.sin(t * 2 + p.pos.z) * (lit ? 0.07 : 0.02);
      if (d < p.discoverDist && !lit) discover(p);
    }
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
  // 湖面微幅漣漪：讓環境反射有流動感（局部座標 Z = 世界 Y）
  { const wp = water.geometry.attributes.position; for (let i = 0; i < wp.count; i++) { const x = wp.getX(i), y = wp.getY(i); wp.setZ(i, Math.sin(x * 0.15 + t * 1.3) * 0.12 + Math.sin(y * 0.19 - t * 1.0) * 0.12); } wp.needsUpdate = true; water.geometry.computeVertexNormals(); }

  // 世界繁榮度：色彩分級 + 天空 + 霧
  vibrancy += (vibrancyTarget - vibrancy) * Math.min(1, 1.5 * dt);
  gradePass.uniforms.uVibrancy.value = archiveActive ? 1 : vibrancy; // 檔案室內固定滿色
  skyMat.uniforms.top.value.lerpColors(SKY_TOP_D, SKY_TOP_A, vibrancy);
  skyMat.uniforms.bottom.value.lerpColors(SKY_BOT_D, SKY_BOT_A, vibrancy);
  scene.fog.color.lerpColors(FOG_D, FOG_A, vibrancy);
  // 中央大水晶（全部進化才啟動）
  const allDone = ruinAt.every((r) => isDone(r.id));
  greatGlow += ((allDone ? 1 : 0) - greatGlow) * Math.min(1, 1.0 * dt);
  greatMat.color.lerpColors(GREAT_D, GREAT_A, greatGlow); greatMat.emissive.copy(greatMat.color); greatMat.emissiveIntensity = 0.4 + greatGlow * 2.2;
  greatCrystal.rotation.y += dt * (0.2 + greatGlow * 1.0); greatCrystal.position.y = 5.4 + Math.sin(t * 1.2) * 0.3; greatCrystal.scale.setScalar(1 + greatGlow * 0.15);
  greatBeamMat.color.copy(greatMat.color); greatBeamMat.opacity = greatGlow * (0.12 + Math.sin(t * 2.5) * 0.03);
  // 能量碎片：環繞 + 依進化狀態亮起
  shardGroup.rotation.y += dt * 0.4;
  for (const sh of shards) {
    sh.glow += ((isDone(sh.id) ? 1 : 0) - sh.glow) * Math.min(1, 2.5 * dt);
    sh.mat.color.copy(sh.color).multiplyScalar(0.28 + sh.glow * 0.72);
    sh.mat.emissive.copy(sh.color); sh.mat.emissiveIntensity = sh.glow * 1.5;
    sh.mesh.position.y = Math.sin(t * 1.6 + sh.ox) * 0.22; sh.mesh.rotation.y += dt * 1.4; sh.mesh.scale.setScalar(0.55 + sh.glow * 0.55);
  }
  // 石化村民：水晶啟動後解除石化（由灰轉彩、呼吸擺動）；靠近顯示提醒
  for (const k of keepers) {
    k.life += ((allDone ? 1 : 0) - k.life) * Math.min(1, 1.0 * dt);
    for (const pt of k.parts) pt.m.color.lerpColors(STONE, pt.alive, k.life);
    k.group.position.y = k.baseY + (k.life > 0.5 ? Math.sin(t * 1.8 + k.pos.x) * 0.07 : 0);
    const dk = Math.hypot(hero.position.x - k.pos.x, hero.position.z - k.pos.z);
    const want = battle.active || finaleActive ? 0 : (dk < 7 ? (k.life > 0.6 ? 2 : 1) : 0);
    if (want !== k.mode) {
      k.mode = want;
      if (want === 0) k.el.className = 'bubble';
      else if (want === 1) { k.el.className = 'bubble petrified show'; k.el.textContent = '🗿 一尊石化的村民…'; }
      else { k.el.className = 'bubble show'; k.el.innerHTML = `<b>${k.ruin.emoji} ${k.ruin.title}・維護者</b><span>${k.ruin.tip}</span>`; }
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
  {
    const dm = Math.hypot(hero.position.x - mage.pos.x, hero.position.z - mage.pos.z);
    const want = (battle.active || finaleActive) ? 0 : (dm < 7 ? 1 : 0);
    if (want !== mage.mode) { mage.mode = want; if (want) { mage.el.className = 'bubble show'; mage.el.innerHTML = `<b>🧙 村裡的嚮導</b><span>${MAGE_TIP}</span>`; } else mage.el.className = 'bubble'; }
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

  // 座標框（按 G 開啟時才更新）：顯示主角 x／z 與 極座標（角度°、半徑）
  if (coordsEl && coordsEl.classList.contains('show')) {
    const hx = hero.position.x, hz = hero.position.z;
    let deg = Math.atan2(hz, hx) * 180 / Math.PI; if (deg < 0) deg += 360;
    coordsEl.textContent = `x ${hx.toFixed(1)}　z ${hz.toFixed(1)}　｜　角度 ${deg.toFixed(0)}°　半徑 ${Math.hypot(hx, hz).toFixed(1)}`;
  }

  mmAcc += dt; if (mmAcc > 0.08) { mmAcc = 0; drawMinimap(); }
  composer.render(); labelRenderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight); });
requestAnimationFrame(() => setTimeout(() => { $('#loader').classList.add('hide'); maybeShowPreConfidence(); }, 350));
