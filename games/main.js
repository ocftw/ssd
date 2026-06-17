// 資安防護新手村 · 探險版
// 以村莊為基地，走出村莊尋找散落荒野的「遺跡」（＝資安主題課程）。
// 純前端、自成一體；不讀取也不修改 docs/ 原始文件。進度存於 localStorage。
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { VILLAGE_BOARD, RUINS } from './content.js';
import { WORLD, terrainHeight, groundY } from './terrain.js';
import { BATTLES } from './battles.js';
import { BattleSystem } from './battle.js';
import { SFX } from './audio.js';

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, ...opts });
const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();

// ── 渲染器 / 場景 / 鏡頭 ─────────────────────────────────────────
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

// ── 燈光（太陽會跟著角色移動，保持大世界陰影清晰）─────────────────
scene.add(new THREE.HemisphereLight(0xdcefff, 0x6b5a44, 0.7));
scene.add(new THREE.AmbientLight(0xffffff, 0.16));
const sun = new THREE.DirectionalLight(0xfff1d8, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 220;
sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun);
scene.add(sun.target);

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
const terrain = new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 1 }));
terrain.receiveShadow = true;
scene.add(terrain);

// 水面
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD.half * 2, WORLD.half * 2),
  new THREE.MeshStandardMaterial({ color: 0x4fa9d6, transparent: true, opacity: 0.8, roughness: 0.15, metalness: 0.2 })
);
water.rotation.x = -Math.PI / 2; water.position.y = WORLD.water;
scene.add(water);

// ── 遺跡座標（先算位置，植被才能避開）────────────────────────────
const ruinAt = RUINS.map((r) => {
  const a = r.angle * Math.PI / 180;
  const x = Math.cos(a) * r.radius, z = Math.sin(a) * r.radius;
  return { ...r, x, z, y: groundY(x, z) };
});
function nearAnyRuin(x, z, d) {
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
  const c = new THREE.ConeGeometry(1.7 - k * 0.42, 1.8, 7); c.translate(0, 2.4 + k * 1.0 + 0.9, 0); return c;
}));
const trunkGeo = new THREE.CylinderGeometry(0.3, 0.42, 2.4, 6); trunkGeo.translate(0, 1.2, 0);
const trees = scatter(170, WORLD.villageR + 8, WORLD.maxR - 4, WORLD.water + 0.8, true);
instance(foliageGeo, mat(0x4e9d54), trees);
instance(trunkGeo, mat(0x7a4a26), trees);
// 岩石
const rockGeo = new THREE.DodecahedronGeometry(1, 0);
instance(rockGeo, mat(0x9a9286), scatter(90, WORLD.villageR + 4, WORLD.maxR + 14, WORLD.water + 0.3, true)
  .map((p) => ({ ...p, sy: p.s * rand(0.6, 1.1) })));
// 草叢（不投影，量大）
const tuftGeo = new THREE.ConeGeometry(0.45, 0.9, 4);
const tufts = scatter(620, WORLD.villageR + 3, WORLD.maxR - 2, WORLD.water + 0.6, false);
const tuftMesh = new THREE.InstancedMesh(tuftGeo, mat(0x76b85a), tufts.length);
tufts.forEach((p, i) => { dummy.position.set(p.x, p.y + 0.3, p.z); dummy.rotation.set(0, p.ry, 0); dummy.scale.set(p.s, p.s, p.s); dummy.updateMatrix(); tuftMesh.setMatrixAt(i, dummy.matrix); });
tuftMesh.instanceMatrix.needsUpdate = true; scene.add(tuftMesh);

// ── 村莊 ────────────────────────────────────────────────────────
const village = new THREE.Group();
scene.add(village);
// 廣場石地（雙色 + 中央紋飾 + 通往村口的步道）
const plaza = new THREE.Mesh(new THREE.CylinderGeometry(18, 18.5, 0.4, 48), mat(0xb6aa8e));
plaza.position.y = 0.1; plaza.receiveShadow = true; village.add(plaza);
const plazaIn = new THREE.Mesh(new THREE.CylinderGeometry(14, 14.2, 0.4, 48), mat(0xd6cbb0));
plazaIn.position.y = 0.22; plazaIn.receiveShadow = true; village.add(plazaIn);
const medallion = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.1, 32), mat(0xa89a7c));
medallion.rotation.x = -Math.PI / 2; medallion.position.y = 0.46; village.add(medallion);
const path = new THREE.Mesh(new THREE.BoxGeometry(3, 0.16, 20), mat(0xc9bb98));
path.position.set(0, 0.47, 11); path.receiveShadow = true; village.add(path);

// 中央水井（含屋頂、井圈）
const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 1.2, 12), mat(0xb3a48c));
wellBase.position.set(-5, 0.7, -3); wellBase.castShadow = wellBase.receiveShadow = true; village.add(wellBase);
const wellRim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.18, 6, 16), mat(0x9a8a70));
wellRim.rotation.x = Math.PI / 2; wellRim.position.set(-5, 1.3, -3); village.add(wellRim);
const wellWater = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.2, 16), mat(0x6cc5e0, { roughness: 0.2 }));
wellWater.position.set(-5, 1.15, -3); village.add(wellWater);
const wellRoof = new THREE.Group();
for (const wx of [-1.5, 1.5]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 6), mat(0x7a5230)); p.position.set(wx, 1.3, 0); p.castShadow = true; wellRoof.add(p); }
const wrf = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 4), mat(0x9c5b3a)); wrf.position.y = 3.2; wrf.rotation.y = Math.PI / 4; wrf.castShadow = true; wellRoof.add(wrf);
wellRoof.position.set(-5, 0, -3); village.add(wellRoof);

// 低石牆 + 牆上石柱帽 + 村口拱門
const wall = new THREE.Mesh(new THREE.TorusGeometry(20, 0.6, 6, 64), mat(0xb3a88f));
wall.rotation.x = Math.PI / 2; wall.position.y = 0.85; wall.castShadow = true; village.add(wall);
for (let i = 0; i < 16; i++) { if (i === 4) continue; const a = i / 16 * TAU; const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.9), mat(0xa89a80)); cap.position.set(Math.cos(a) * 20, 1.35, Math.sin(a) * 20); cap.rotation.y = a; cap.castShadow = true; village.add(cap); }
const gate = new THREE.Group();
for (const gx of [-2.8, 2.8]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.4, 0.8), mat(0x8a5e34)); p.position.set(gx, 2.7, 0); p.castShadow = true; gate.add(p); }
const glintel = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.0, 1.0), mat(0x7e5630)); glintel.position.set(0, 5.4, 0); glintel.castShadow = true; gate.add(glintel);
const groof = new THREE.Mesh(new THREE.ConeGeometry(4.7, 1.5, 4), mat(0x9c5b3a)); groof.position.set(0, 6.6, 0); groof.rotation.y = Math.PI / 4; groof.castShadow = true; gate.add(groof);
const banner = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 0.1), mat(0xff7a45, { emissive: 0xff7a45, emissiveIntensity: 0.12 })); banner.position.set(0, 4.4, 0.55); gate.add(banner);
for (const lx of [-2.8, 2.8]) { const lan = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), mat(0xffe6a0, { emissive: 0xffcf6b, emissiveIntensity: 0.9 })); lan.position.set(lx, 4.7, 0.6); gate.add(lan); }
gate.position.set(0, 0, 20); village.add(gate);

// 小屋（石基 + 屋簷 + 煙囪 + 雙窗）
function cottage(color, roofC) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 4.7), mat(0x9a9080)); base.position.y = 0.25; base.castShadow = base.receiveShadow = true; g.add(base);
  const b = new THREE.Mesh(new THREE.BoxGeometry(5, 3.0, 4.5), mat(color)); b.position.y = 2.0; b.castShadow = b.receiveShadow = true; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(4.1, 2.6, 4), mat(roofC)); r.position.y = 4.7; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  const ch = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), mat(0x8a6a55)); ch.position.set(1.4, 5.1, -1.0); ch.castShadow = true; g.add(ch);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.12), mat(0x4a3526)); door.position.set(0, 1.45, 2.27); g.add(door);
  for (const wx of [-1.6, 1.6]) { const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.12), mat(0xffe9a8, { emissive: 0xffcf6b, emissiveIntensity: 0.4 })); win.position.set(wx, 2.3, 2.27); g.add(win); }
  return g;
}
const cottageColors = [[0x8fb98f, 0x55794f], [0xd9a577, 0x9c6b41], [0x8aa6c9, 0x4f6c92], [0xc98f9b, 0x8a5663], [0xcdb87e, 0x8a6e3a]];
const houseSpots = [[11, -8, 0.6], [-12, 5, -0.4], [12, 9, 2.4], [-10, 13, -2.2], [5, 14, 3.0]];
houseSpots.forEach((s, i) => { const c = cottage(...cottageColors[i % cottageColors.length]); c.position.set(s[0], 0, s[1]); c.rotation.y = s[2]; village.add(c); });

// 提燈路燈
for (const lp of [[6, -1], [-3, 9], [8, 6], [-7, -2]]) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.6, 6), mat(0x55514a)); pole.position.y = 1.8; pole.castShadow = true; g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), mat(0x55514a)); arm.position.set(0.3, 3.5, 0); g.add(arm);
  const lan = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), mat(0xffe6a0, { emissive: 0xffcf6b, emissiveIntensity: 1.0 })); lan.position.set(0.55, 3.3, 0); g.add(lan);
  g.position.set(lp[0], 0, lp[1]); g.rotation.y = rand(0, TAU); village.add(g);
}

// 綠化：灌木、花、角落樹、旗幟
for (let i = 0; i < 10; i++) { const a = rand(0, TAU), rr = rand(7, 16); const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.6, 1.1), 0), mat(0x6fae57)); bush.position.set(Math.cos(a) * rr, 0.5, Math.sin(a) * rr); bush.scale.y = 0.8; bush.castShadow = true; village.add(bush); }
const flowerC = [0xff6f91, 0xffd166, 0xc792ea, 0xffffff];
for (let i = 0; i < 16; i++) { const a = rand(0, TAU), rr = rand(6, 17); const f = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), mat(flowerC[(Math.random() * flowerC.length) | 0])); f.position.set(Math.cos(a) * rr, 0.5, Math.sin(a) * rr); village.add(f); }
for (const tp of [[-15, -6], [15, -4]]) {
  const tg = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 6), mat(0x7a4a26)); tr.position.y = 1; tr.castShadow = true; tg.add(tr);
  let yy = 2; for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.6 - k * 0.4, 1.6, 7), mat(0x4e9d54)); c.position.y = yy + 0.8; c.castShadow = true; tg.add(c); yy += 1.0; }
  tg.position.set(tp[0], 0, tp[1]); village.add(tg);
}
for (const fp of [[-8, 2, 0x5b9cff], [9, 1, 0xff7a45]]) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 6), mat(0x6b5a44)); pole.position.set(fp[0], 2.5, fp[1]); pole.castShadow = true; village.add(pole);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.08), mat(fp[2], { emissive: fp[2], emissiveIntensity: 0.12 })); flag.position.set(fp[0] + 0.95, 4.0, fp[1]); village.add(flag);
}

// 村長告示牌（任務起點，造型升級）
const board = new THREE.Group();
const bplat = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.3, 8), mat(0xb8ac90)); bplat.position.y = 0.15; bplat.receiveShadow = true; board.add(bplat);
for (const bx of [-1.4, 1.4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 3.4, 8), mat(0x7a5230)); p.position.set(bx, 1.7, 0); p.castShadow = true; board.add(p); }
const sign = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 0.25), mat(0xe7c884)); sign.position.set(0, 2.9, 0); sign.castShadow = true; board.add(sign);
const frame = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.25, 0.3), mat(0x9c6b41)); frame.position.set(0, 4.05, 0); board.add(frame);
const roofb = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.5, 1.2), mat(0x9c5b3a)); roofb.position.set(0, 4.35, 0); roofb.castShadow = true; board.add(roofb);
board.position.set(0, 0, 7); village.add(board);

// 村莊中央大水晶（全部遺跡進化後才啟動）
const greatBase = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 1.2, 8), mat(0x9a9080)); greatBase.position.set(0, 0.6, 0); greatBase.castShadow = greatBase.receiveShadow = true; village.add(greatBase);
const greatBase2 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 0.8, 8), mat(0xb0a896)); greatBase2.position.set(0, 1.4, 0); greatBase2.castShadow = true; village.add(greatBase2);
const greatMat = new THREE.MeshStandardMaterial({ color: 0x8a93a0, emissive: 0x20242b, emissiveIntensity: 0.4, roughness: 0.15, metalness: 0.35, flatShading: true });
const greatCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), greatMat); greatCrystal.position.set(0, 5.4, 0); greatCrystal.castShadow = true; village.add(greatCrystal);
const greatBeamMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
const greatBeam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 3.0, 90, 18, 1, true), greatBeamMat); greatBeam.position.set(0, 46, 0); village.add(greatBeam);
const GREAT_D = new THREE.Color(0x8a93a0), GREAT_A = new THREE.Color(0xffe6a0);
// 能量碎片：每座遺跡一片，進化後亮起（可見的充能進度）
const shardGroup = new THREE.Group(); shardGroup.position.set(0, 5.4, 0); village.add(shardGroup);
const shards = ruinAt.map((r, i) => {
  const a = i / ruinAt.length * TAU;
  const m = new THREE.MeshStandardMaterial({ color: 0x3a3f48, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.3, metalness: 0.4, flatShading: true });
  const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), m);
  s.position.set(Math.cos(a) * 3.0, 0, Math.sin(a) * 3.0); s.castShadow = true; shardGroup.add(s);
  return { mesh: s, mat: m, id: r.id, color: new THREE.Color(r.color), glow: 0, ox: Math.cos(a) * 3.0 };
});

// ── 遺跡 ────────────────────────────────────────────────────────
// 遺跡共用材質與幾何
const RUIN = { stone: mat(0xb0a896), stoneDk: mat(0x827a6d), stoneIn: mat(0x968d7c), moss: mat(0x6f8f4e), wood: mat(0x8a6a3f), woodDk: mat(0x6e5230), dark: mat(0x2c2a28) };
const beamGeo = new THREE.CylinderGeometry(0.6, 1.5, 46, 12, 1, true);
const rubbleGeo = new THREE.DodecahedronGeometry(0.5, 0);
function buildRuin(r) {
  const g = new THREE.Group();
  g.position.set(r.x, r.y, r.z);
  const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const add = (geo, m, x, y, z, ry) => { const o = cast(new THREE.Mesh(geo, m)); o.position.set(x, y, z); if (ry) o.rotation.y = ry; g.add(o); return o; };

  // 階梯式八角平台
  add(new THREE.CylinderGeometry(6.4, 6.9, 0.6, 8), RUIN.stoneDk, 0, 0.3, 0, Math.PI / 8);
  add(new THREE.CylinderGeometry(5.4, 5.7, 0.5, 8), RUIN.stone, 0, 0.8, 0, Math.PI / 8);
  add(new THREE.CylinderGeometry(4.6, 4.8, 0.3, 8), RUIN.stoneIn, 0, 1.15, 0, Math.PI / 8);
  // 邊緣破損石塊（部分缺角、偶有苔蘚）
  for (let i = 0; i < 8; i++) {
    if (i === 2 || i === 6) continue;
    const a = i / 8 * TAU, hx = i % 3 ? 0.7 : 0.4;
    add(new THREE.BoxGeometry(1.5, hx, 1.1), i % 2 ? RUIN.stone : RUIN.stoneDk, Math.cos(a) * 5.7, 1.1 + hx / 2, Math.sin(a) * 5.7, a);
    if (i % 3 === 0) add(new THREE.IcosahedronGeometry(0.5, 0), RUIN.moss, Math.cos(a) * 5.7, 1.55, Math.sin(a) * 5.7).scale.set(1, 0.4, 1);
  }
  // 散落碎石
  for (let i = 0; i < 7; i++) { const a = rand(0, TAU), rr = rand(6.6, 8.6), s = rand(0.4, 0.9); const o = add(rubbleGeo, i % 2 ? RUIN.stone : RUIN.stoneDk, Math.cos(a) * rr, s * 0.4, Math.sin(a) * rr); o.scale.setScalar(s); o.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); }

  if (r.style === 'grove') { // 森林石拱
    const col = (x, h) => { add(new THREE.CylinderGeometry(0.5, 0.58, h, 8), RUIN.stone, x, 1.3 + h / 2, -2.8); add(new THREE.IcosahedronGeometry(0.42, 0), RUIN.moss, x, 1.3 + h * 0.78, -2.5).scale.set(1, 0.5, 1); };
    col(-2.4, 4.6); col(2.4, 4.6);
    add(new THREE.BoxGeometry(2.5, 0.7, 1.0), RUIN.stoneDk, -1.35, 6.05, -2.8, 0.12);
    add(new THREE.BoxGeometry(2.5, 0.7, 1.0), RUIN.stoneDk, 1.35, 6.05, -2.8, -0.12);
    for (const s of [[-4.2, 1.6, 2.2], [4.2, 1.4, 1.6], [-3.6, -1.2, 1.2]]) add(new THREE.CylinderGeometry(0.42, 0.5, s[2], 7), RUIN.stone, s[0], 1.3 + s[2] / 2, s[1]);
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
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; add(new THREE.CylinderGeometry(0.3, 0.4, rand(1.0, 1.8), 6), RUIN.stone, Math.cos(a) * 4.0, 2.0, Math.sin(a) * 4.0); }
  } else { // market：市集棚架
    const stall = (sx, rot) => {
      const s = new THREE.Group();
      for (const px of [-1.6, 1.6]) for (const pz of [-0.9, 0.9]) { const p = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3, 6), RUIN.wood)); p.position.set(px, 2.6, pz); s.add(p); }
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
  add(new THREE.CylinderGeometry(1.5, 1.75, 0.8, 8), RUIN.stoneDk, 0, 1.55, 0, Math.PI / 8);
  add(new THREE.CylinderGeometry(1.05, 1.3, 0.55, 8), RUIN.stone, 0, 2.05, 0, Math.PI / 8);
  // 浮空水晶 + 光環（光環共用 beamMat → 發現後一起變色變亮）
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, emissive: 0x2a2f38, emissiveIntensity: 0.5, roughness: 0.15, metalness: 0.2, flatShading: true });
  const crystal = cast(new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), crystalMat));
  crystal.position.y = 3.4; g.add(crystal);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xbfc6cf, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.12, 8, 22), beamMat); halo.rotation.x = Math.PI / 2; crystal.add(halo);
  const beam = new THREE.Mesh(beamGeo, beamMat); beam.position.y = 23.5; g.add(beam);
  // 發現後才亮起：地面彩色光環 + 環繞光點
  const aura = new THREE.Mesh(new THREE.RingGeometry(1.8, 3.4, 32), beamMat); aura.rotation.x = -Math.PI / 2; aura.position.y = 1.32; g.add(aura);
  const motes = new THREE.Group(); motes.visible = false;
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; const mote = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), crystalMat); mote.position.set(Math.cos(a) * 1.7, Math.sin(i * 1.3) * 0.4, Math.sin(a) * 1.7); motes.add(mote); }
  crystal.add(motes);
  scene.add(g);
  return { group: g, crystal, crystalMat, beamMat, motes };
}

// ── 興趣點（POI）：村莊告示牌 + 各遺跡 ───────────────────────────
const POIS = [];
function makeLabel(text) { const el = document.createElement('div'); el.className = 'tag'; el.textContent = text; const o = new CSS2DObject(el); return { el, o }; }
// 告示牌 POI
{
  const lab = makeLabel(`${VILLAGE_BOARD.emoji} 村長告示牌`); lab.o.position.set(0, 5.4, 0); board.add(lab.o);
  POIS.push({ data: VILLAGE_BOARD, isRuin: false, pos: new THREE.Vector3(0, 0, 7), el: lab.el, openDist: 9 });
}
// 遺跡 POI
ruinAt.forEach((r) => {
  const built = buildRuin(r);
  const lab = makeLabel(`❔ 未知遺跡`); lab.o.position.set(0, 9, 0); built.group.add(lab.o);
  POIS.push({ data: r, isRuin: true, pos: new THREE.Vector3(r.x, r.y, r.z), el: lab.el, openDist: 13, discoverDist: 8, ...built, lift: 0 });
});

// ── 石化村民（遺跡維護者）：大水晶啟動後解除石化、靠近給提醒 ──────
const STONE = new THREE.Color(0x9a958c);
function buildKeeper(r) {
  const g = new THREE.Group();
  const parts = [];
  const part = (geo, aliveHex, x, y, z) => {
    const m = new THREE.MeshStandardMaterial({ color: STONE.clone(), roughness: 0.9, metalness: 0, flatShading: true });
    const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; g.add(mesh);
    parts.push({ m, alive: new THREE.Color(aliveHex) }); return mesh;
  };
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.5, 8), mat(0x8a847a)); ped.position.y = 0.25; ped.castShadow = ped.receiveShadow = true; g.add(ped);
  part(new THREE.CapsuleGeometry(0.42, 0.7, 4, 8), r.color, 0, 1.25, 0);                            // 身體（披風＝主題色）
  part(new THREE.SphereGeometry(0.4, 14, 12), 0xf2c79b, 0, 2.05, 0);                                // 頭
  part(new THREE.SphereGeometry(0.42, 14, 8, 0, TAU, 0, Math.PI * 0.55), 0x5a4a36, 0, 2.12, 0);     // 髮
  part(new THREE.CapsuleGeometry(0.14, 0.45, 3, 6), r.color, -0.5, 1.3, 0.05);
  part(new THREE.CapsuleGeometry(0.14, 0.45, 3, 6), r.color, 0.5, 1.3, 0.05);
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

// ── 角色：信使（人類）──────────────────────────────────────────
const hero = new THREE.Group();
const skin = mat(0xf2c79b), cloth = mat(0xff7a45), pants = mat(0x37445c), hair = mat(0x4a3528), bag = mat(0x6b4a2f), eyeMat = mat(0x2a2630);
const P = (geo, m, x, y, z) => { const p = new THREE.Mesh(geo, m); p.position.set(x, y, z); p.castShadow = true; hero.add(p); return p; };
// 身體 + 信使背包
P(new THREE.CapsuleGeometry(0.55, 0.9, 4, 10), cloth, 0, 1.5, 0);
P(new THREE.BoxGeometry(0.85, 0.95, 0.35), bag, 0, 1.6, -0.5);
// 頭 + 頭髮 + 眼睛
const head = P(new THREE.SphereGeometry(0.5, 16, 14), skin, 0, 2.6, 0);
const H = (geo, m, x, y, z) => { const p = new THREE.Mesh(geo, m); p.position.set(x, y, z); p.castShadow = true; head.add(p); return p; };
H(new THREE.SphereGeometry(0.515, 16, 10, 0, TAU, 0, Math.PI * 0.5), hair, 0, 0.03, 0); // 頭髮（頂部半球）
for (const sx of [-1, 1]) H(new THREE.SphereGeometry(0.075, 10, 8), eyeMat, sx * 0.17, -0.04, 0.45);
// 四肢
const legL = P(new THREE.CapsuleGeometry(0.2, 0.6, 3, 6), pants, -0.26, 0.5, 0);
const legR = P(new THREE.CapsuleGeometry(0.2, 0.6, 3, 6), pants, 0.26, 0.5, 0);
const armL = P(new THREE.CapsuleGeometry(0.17, 0.6, 3, 6), cloth, -0.7, 1.6, 0);
const armR = P(new THREE.CapsuleGeometry(0.17, 0.6, 3, 6), cloth, 0.7, 1.6, 0);
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
addEventListener('keydown', (e) => { keys.add(e.code); });
addEventListener('keyup', (e) => { keys.delete(e.code); });
let yaw = Math.PI, pitch = 0.6, dist = 30;
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
  if (!p.isRuin) { pState.textContent = '村莊任務'; pGo.textContent = '了解怎麼開始 →'; }
  else if (hasBattle) { pState.textContent = isDone(d.id) ? '✅ 已淨化' : '⚔️ 有守關怪物'; pGo.textContent = '先閱讀章節備戰 →'; }
  else { pState.textContent = isDone(d.id) ? '✅ 已閱讀完成' : '尚未閱讀'; pGo.textContent = isDone(d.id) ? '再讀一次 →' : '閱讀此遺跡課程 →'; }
  panel.classList.add('show');
}
function hidePanel() { panelId = null; panel.classList.remove('show'); POIS.forEach((x) => x.el.classList.remove('is-active')); }
pClose.addEventListener('click', () => { if (panelId) suppressed.add(panelId); pinnedId = null; hidePanel(); });
// 右下角取消鍵（觸控／小螢幕）：等同關閉對話框
const actbtnEl = document.getElementById('actbtn');
actbtnEl.addEventListener('click', () => { if (panelId) suppressed.add(panelId); pinnedId = null; hidePanel(); });
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
  if (left > 0) toast('🎉 遺跡淨化！', `${p.data.title} 已點亮 — 再點亮 ${left} 座，中央大水晶就會甦醒`);
}
function showFinaleOverlay() {
  const f = document.getElementById('finale');
  f.querySelector('.badges').innerHTML = ruinAt.map((r) => `<span title="${r.title}">${r.emoji}</span>`).join('');
  f.classList.add('show');
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

function animate() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05), t = timer.getElapsed();

  joyEl.classList.toggle('hide', battle.active || finaleActive);
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
  if (finaleActive) { kx = 0; kz = 0; hasTarget = false; } // 終局運鏡時凍結玩家

  moveDir.set(0, 0, 0);
  if (kx || kz) { hasTarget = false; moveDir.addScaledVector(fwd, kz).addScaledVector(right, kx); }
  else if (hasTarget) { moveDir.set(moveTarget.x - hero.position.x, 0, moveTarget.z - hero.position.z); if (moveDir.length() < 0.4) hasTarget = false; }

  let moving = false;
  if (moveDir.lengthSq() > 0.0001) {
    moveDir.normalize();
    hero.position.addScaledVector(moveDir, (sprint ? 26 : 16) * dt);
    const len = Math.hypot(hero.position.x, hero.position.z);
    if (len > WORLD.maxR) hero.position.multiplyScalar(WORLD.maxR / len);
    const tr = Math.atan2(moveDir.x, moveDir.z);
    hero.rotation.y += ((((tr - hero.rotation.y) % TAU) + Math.PI * 3) % TAU - Math.PI) * Math.min(1, 12 * dt);
    moving = true;
  }
  const groundH = terrainHeight(hero.position.x, hero.position.z);
  if (moving) {
    walkPhase += dt * (sprint ? 18 : 12); const s = Math.sin(walkPhase);
    legL.rotation.x = s * 0.6; legR.rotation.x = -s * 0.6; armL.rotation.x = -s * 0.5; armR.rotation.x = s * 0.5;
    hero.position.y = groundH + Math.abs(Math.sin(walkPhase)) * 0.12;
    const sf = Math.floor(walkPhase / Math.PI); if (sf !== lastStepFloor) { lastStepFloor = sf; SFX.step(); }
  } else {
    legL.rotation.x *= 0.8; legR.rotation.x *= 0.8; armL.rotation.x *= 0.8; armR.rotation.x *= 0.8;
    hero.position.y = groundH; head.position.y = 2.6 + Math.sin(t * 1.5) * 0.03;
  }

  // 對話泡：踩水反應 + 漫步自言自語
  if (sayTimer > 0) { sayTimer -= dt; if (sayTimer <= 0) heroBubbleEl.classList.remove('show'); }
  const inWater = groundH < WORLD.water + 0.2;
  if (!finaleActive) {
    if (inWater && !wasInWater && sayTimer <= 0) heroSay(pick(WATER_LINES), 2.6);
    idleTalkTimer -= dt;
    if (idleTalkTimer <= 0) { idleTalkTimer = rand(4, 8); if (sayTimer <= 0 && !inWater && moving) heroSay(pick(IDLE_LINES), 3); }
  }
  wasInWater = inWater;

  // 鏡頭跟隨（避免穿地）
  camPos.set(hero.position.x + Math.sin(yaw) * Math.cos(pitch) * dist, hero.position.y + Math.sin(pitch) * dist + 2, hero.position.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  const camGround = terrainHeight(camPos.x, camPos.z) + 3;
  if (camPos.y < camGround) camPos.y = camGround;
  camera.position.lerp(camPos, 1 - Math.exp(-6 * dt));
  lookAt.set(hero.position.x, hero.position.y + 2.4, hero.position.z); camera.lookAt(lookAt);
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

  // POI 鄰近 / 發現 / 面板
  let near = null, nd = Infinity;
  for (const p of POIS) {
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

  // 特效更新
  wellWater.position.y = 1.15 + Math.sin(t * 1.5) * 0.03;

  // 世界繁榮度：色彩分級 + 天空 + 霧
  vibrancy += (vibrancyTarget - vibrancy) * Math.min(1, 1.5 * dt);
  gradePass.uniforms.uVibrancy.value = vibrancy;
  skyMat.uniforms.top.value.lerpColors(SKY_TOP_D, SKY_TOP_A, vibrancy);
  skyMat.uniforms.bottom.value.lerpColors(SKY_BOT_D, SKY_BOT_A, vibrancy);
  scene.fog.color.lerpColors(FOG_D, FOG_A, vibrancy);
  // 中央大水晶（全部進化才啟動）
  const allDone = ruinAt.every((r) => isDone(r.id));
  greatGlow += ((allDone ? 1 : 0) - greatGlow) * Math.min(1, 1.0 * dt);
  greatMat.color.lerpColors(GREAT_D, GREAT_A, greatGlow); greatMat.emissive.copy(greatMat.color); greatMat.emissiveIntensity = 0.4 + greatGlow * 2.2;
  greatCrystal.rotation.y += dt * (0.2 + greatGlow * 1.0); greatCrystal.position.y = 5.4 + Math.sin(t * 1.2) * 0.3; greatCrystal.scale.setScalar(1 + greatGlow * 0.15);
  greatBeamMat.color.copy(greatMat.color); greatBeamMat.opacity = greatGlow * (0.32 + Math.sin(t * 2.5) * 0.06);
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
  for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.t += dt; const k = b.t / b.dur; b.ring.scale.setScalar(1 + k * b.mul); b.ring.material.opacity = Math.max(0, 0.85 * (1 - k)); if (k >= 1) { scene.remove(b.ring); b.ring.material.dispose(); b.ring.geometry.dispose(); bursts.splice(i, 1); } }

  mmAcc += dt; if (mmAcc > 0.08) { mmAcc = 0; drawMinimap(); }
  composer.render(); labelRenderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight); });
requestAnimationFrame(() => setTimeout(() => $('#loader').classList.add('hide'), 350));
