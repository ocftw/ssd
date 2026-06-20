// WebGPU 試作（評估用，與正式遊戲 index.html/main.js 完全獨立）
// 用 Three 的 WebGPURenderer＋TSL 渲染「遊戲視覺的代表片段」：大氣天空(SkyMesh)＋程序地形(重用 terrain.js)＋
// 發光「創世之核」＋TSL bloom 後製。自動選 WebGPU；不支援退回 WebGL2。
// 量測：?backend=webgl 強制 fallback；?stress=N（0..8）灌大量「獨立 draw call」壓 CPU/driver——WebGPU 最可能贏的地方。
import * as THREE from 'three';
import { pass, color, uniform } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';
import { WORLD, terrainHeight, setTerrainOpenness } from './terrain.js';

const $ = (id) => document.getElementById(id);
const hud = { backend: $('backend'), fps: $('fps'), framems: $('framems'), draws: $('draws'), tris: $('tris'), objs: $('objs'), stresslv: $('stresslv'), drawmode: $('drawmode'), controls: $('controls') };
function fail(msg) { hud.backend.textContent = msg; hud.backend.className = 'err'; hud.fps.textContent = '—'; }

const params = new URLSearchParams(location.search);
const forceWebGL = params.get('backend') === 'webgl';
const STRESS = Math.max(0, Math.min(8, parseInt(params.get('stress') || '0', 10) || 0));
const INSTANCED = params.get('mode') === 'inst';

// 一鍵切換控制：保留其他參數，只改一項後 reload
function buildControls() {
  const mk = (label, mut, on) => {
    const p = new URLSearchParams(location.search); mut(p);
    const a = document.createElement('a'); a.textContent = label; a.href = '?' + p.toString();
    if (on) a.className = 'on'; hud.controls.appendChild(a);
  };
  mk(forceWebGL ? '▶ 改用 WebGPU(自動)' : '▶ 強制 WebGL', (p) => { forceWebGL ? p.delete('backend') : p.set('backend', 'webgl'); });
  mk(INSTANCED ? '▶ 改用 獨立draw' : '▶ 改用 Instanced', (p) => { INSTANCED ? p.delete('mode') : p.set('mode', 'inst'); });
  [0, 2, 4, 6, 8].forEach((lv) => mk('壓力' + lv, (p) => { lv ? p.set('stress', lv) : p.delete('stress'); }, lv === STRESS));
}
buildControls();
hud.stresslv.textContent = String(STRESS);
hud.drawmode.textContent = INSTANCED ? 'InstancedMesh（每種 1 draw）' : '獨立（每物件 1 draw）';

async function main() {
  const hasGPU = !!navigator.gpu;
  const hasGL2 = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } })();
  if (!hasGL2 && (forceWebGL || !hasGPU)) { fail('此瀏覽器不支援 WebGPU／WebGL2 😢'); return; }

  setTerrainOpenness(1); // 白天／向海敞開

  const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  document.body.appendChild(renderer.domElement);

  try { await renderer.init(); }
  catch (e) { fail('渲染器初始化失敗：' + (e && e.message ? e.message : e)); return; }

  renderer.info.autoReset = false; // 手動每幀 reset，讓 drawCalls/triangles 累計整幀（含後製各 pass）＝真實每幀工作量
  const isGPU = !!(renderer.backend && renderer.backend.isWebGPUBackend);
  hud.backend.textContent = isGPU ? 'WebGPU ✅' : 'WebGL2（fallback）';
  hud.backend.className = isGPU ? 'gpu' : 'gl';

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbcd2e0, 180, 460);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 2000);

  const sunPos = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(62), THREE.MathUtils.degToRad(40));
  const sun = new THREE.DirectionalLight(0xfff2d8, 2.6);
  sun.position.copy(sunPos).multiplyScalar(120); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 1; sun.shadow.camera.far = 400;
  sun.shadow.camera.left = -160; sun.shadow.camera.right = 160; sun.shadow.camera.top = 160; sun.shadow.camera.bottom = -160;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x6f7d5a, 0.7));

  const sky = new SkyMesh();
  sky.scale.setScalar(1200);
  sky.turbidity.value = 6; sky.rayleigh.value = 2.2; sky.mieCoefficient.value = 0.005; sky.mieDirectionalG.value = 0.8;
  sky.sunPosition.value.copy(sunPos).multiplyScalar(450000);
  scene.add(sky);

  // 地形（重用 terrain.js）
  const SEG = 200, SIZE = WORLD.half * 2;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3); const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = terrainHeight(x, z); pos.setY(i, h);
    if (h < WORLD.water + 0.4) tmp.setHex(0xcdb78a); else tmp.setHSL(0.27, 0.42, Math.min(0.46, 0.30 + h * 0.012));
    cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardNodeMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }));
  ground.receiveShadow = true; scene.add(ground);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), new THREE.MeshStandardNodeMaterial({ color: 0x3a6b86, roughness: 0.18, metalness: 0.2, transparent: true, opacity: 0.82 }));
  water.rotation.x = -Math.PI / 2; water.position.y = WORLD.water; scene.add(water);

  const groundY = (x, z) => Math.max(terrainHeight(x, z), WORLD.water + 0.2);
  const rng = (() => { let s = 1337; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();

  // 共用幾何／材質（壓力模式重複使用，讓「draw call 數」而非「記憶體」成為變因）
  const treeTrunkG = new THREE.CylinderGeometry(0.3, 0.42, 2.4, 6), treeLeafG = new THREE.ConeGeometry(1.7, 3.6, 7);
  const rockG = new THREE.IcosahedronGeometry(1.0, 0);
  const trunkM = new THREE.MeshStandardNodeMaterial({ color: 0x6e5230, roughness: 0.9 });
  const leafM = new THREE.MeshStandardNodeMaterial({ color: 0x3f7b3f, roughness: 0.85 });
  const rockM = new THREE.MeshStandardNodeMaterial({ color: 0x8a8f96, roughness: 0.8, flatShading: true });

  // 佈局兩種模式共用同一份（同 rng 順序）→ A/B 公平。
  const TREES = STRESS ? STRESS * 900 : 26;
  const ROCKS = STRESS ? STRESS * 500 : 14;
  const trees = [], rocks = [];
  for (let i = 0; i < TREES; i++) {
    const a = rng() * Math.PI * 2, r = 18 + rng() * 150, x = Math.cos(a) * r, z = Math.sin(a) * r, y = groundY(x, z);
    if (y < WORLD.water + 0.5) continue;
    trees.push({ x, y, z, s: 0.7 + rng() * 0.8 });
  }
  for (let i = 0; i < ROCKS; i++) {
    const a = rng() * Math.PI * 2, r = 14 + rng() * 160, x = Math.cos(a) * r, z = Math.sin(a) * r, y = groundY(x, z);
    rocks.push({ x, y, z, s: 0.5 + rng() * 1.1 });
  }
  const objCount = trees.length * 2 + rocks.length; // 兩模式相同的「圖元數」（樹＝樹幹＋樹冠）
  const dummy = new THREE.Object3D();

  if (INSTANCED) {
    // 同款物件用 InstancedMesh：每種只需「一個」draw call（不論幾千個）——遊戲植被正是這樣做。
    const buildInst = (g, m, list, oy, byScale) => {
      const im = new THREE.InstancedMesh(g, m, list.length); im.castShadow = true; im.frustumCulled = false;
      for (let i = 0; i < list.length; i++) { const o = list[i]; dummy.position.set(o.x, o.y + (byScale ? oy * o.s : oy), o.z); dummy.scale.setScalar(o.s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }
      im.instanceMatrix.needsUpdate = true; scene.add(im);
    };
    buildInst(treeTrunkG, trunkM, trees, 1.2, true);
    buildInst(treeLeafG, leafM, trees, 3.8, true);
    buildInst(rockG, rockM, rocks, 0.3, false);
  } else {
    // 各自獨立的 Mesh＝大量 draw call（CPU/driver 壓力，WebGPU 最可能贏的地方）。
    // 靜態 → matrixAutoUpdate=false；壓力模式關裁切→每幀全送，工作量固定可比較。
    const place = (g, m, x, y, z, s) => { const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); mesh.scale.setScalar(s); mesh.castShadow = true; mesh.updateMatrix(); mesh.matrixAutoUpdate = false; if (STRESS) mesh.frustumCulled = false; scene.add(mesh); };
    for (const o of trees) { place(treeTrunkG, trunkM, o.x, o.y + 1.2 * o.s, o.z, o.s); place(treeLeafG, leafM, o.x, o.y + 3.8 * o.s, o.z, o.s); }
    for (const o of rocks) place(rockG, rockM, o.x, o.y + 0.3, o.z, o.s);
  }

  // 「創世之核」：MeshStandardNodeMaterial＋TSL emissiveNode（脈動）
  const coreGroup = new THREE.Group(); coreGroup.position.set(0, groundY(0, 40) + 6, 40);
  const uGlow = uniform(1.4);
  const coreMat = new THREE.MeshStandardNodeMaterial({ color: 0xbfe6ff, roughness: 0.2, metalness: 0.1 });
  coreMat.emissiveNode = color(0x4aa9ff).mul(uGlow);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 1), coreMat); core.castShadow = true; coreGroup.add(core);
  const shardGroup = new THREE.Group(); coreGroup.add(shardGroup);
  const shardMat = new THREE.MeshStandardNodeMaterial({ color: 0x9fd8ff, roughness: 0.3, metalness: 0.3 }); shardMat.emissiveNode = color(0x3a8fe0).mul(1.0);
  for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2; const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), shardMat); s.position.set(Math.cos(ang) * 4.4, Math.sin(ang * 1.7) * 0.9, Math.sin(ang) * 4.4); shardGroup.add(s); }
  scene.add(coreGroup);

  // TSL bloom 後製
  const post = new THREE.PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode('output');
  post.outputNode = scenePassColor.add(bloom(scenePassColor, 0.85, 0.5, 0.6));

  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  hud.objs.textContent = objCount.toLocaleString();

  // FPS / frame-time 量測
  let last = performance.now(), acc = 0, frames = 0, statAcc = 0;
  async function animate() {
    renderer.info.reset(); // 每幀歸零 → renderAsync 後讀到的是「整幀」累計（含 bloom 各 pass）
    const now = performance.now(); const dt = (now - last) / 1000; last = now; acc += dt; frames++; statAcc += dt;
    if (acc >= 0.25) {
      const fps = frames / acc; hud.fps.textContent = fps.toFixed(0);
      hud.framems.textContent = ' (' + (1000 / fps).toFixed(1) + ' ms)';
      acc = 0; frames = 0;
    }
    const t = now / 1000;
    const camR = 145, camA = t * 0.12;
    camera.position.set(Math.cos(camA) * camR, 78, Math.sin(camA) * camR);
    camera.lookAt(0, 8, 40);
    coreGroup.position.y = groundY(0, 40) + 6 + Math.sin(t * 1.2) * 0.8;
    core.rotation.y = t * 0.5; core.rotation.x = t * 0.2; shardGroup.rotation.y = -t * 0.7;
    uGlow.value = 1.3 + Math.sin(t * 2.0) * 0.5;
    await post.renderAsync();
    if (statAcc >= 0.5) { const r = renderer.info.render; hud.draws.textContent = (r.drawCalls || 0).toLocaleString(); hud.tris.textContent = (r.triangles || 0).toLocaleString(); statAcc = 0; }
  }
  renderer.setAnimationLoop(animate);
}

main().catch((e) => fail('啟動失敗：' + (e && e.message ? e.message : e)));
