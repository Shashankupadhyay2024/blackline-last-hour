/* ============================================================
   BLACKLINE: LAST HOUR — core: helpers, settings, renderer,
   terrain math, collision, raycasting
   ============================================================ */
'use strict';
THREE.ColorManagement.legacyMode = false;
const V3 = THREE.Vector3;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU; return d; }
function yawTo(fx, fz, tx, tz) { return Math.atan2(-(tx - fx), -(tz - fz)); }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const _v1 = new V3(), _v2 = new V3(), _v3 = new V3(), _v4 = new V3(), _v5 = new V3();

/* ---------------- storage & settings ---------------- */
const Store = {
  get(k, d) { try { const v = localStorage.getItem('blackline_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('blackline_' + k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem('blackline_' + k); } catch (e) { } }
};
const settings = Object.assign({ quality: 'high', post: true, shadows: true, effects: 'high', aa: true, adsToggle: false, padSens: 1, aimAssist: true, rumble: true, voices: true, voiceVol: 1, sens: 1, fov: 78, vol: 0.8, music: 0.5, invertY: false }, Store.get('settings', {}));
function saveSettings() { Store.set('settings', settings); }
const QUAL = {
  low: { pr: 0.7, shadow: 1024 },
  medium: { pr: 1, shadow: 2048 },
  high: { pr: Math.min(window.devicePixelRatio || 1, 1.6), shadow: 2048 },
  ultra: { pr: Math.min(window.devicePixelRatio || 1, 2), shadow: 4096 }
};
const FXQ = { low: 0.45, medium: 0.75, high: 1, ultra: 1.25 };

/* ---------------- renderer / scenes ---------------- */
const renderer = new THREE.WebGLRenderer({ antialias: settings.aa, powerPreference: 'high-performance' });
renderer.setPixelRatio((QUAL[settings.quality] || QUAL.high).pr);
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;
$('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(settings.fov, innerWidth / innerHeight, 0.08, 2600);
camera.rotation.order = 'YXZ';
scene.add(camera);
const vmScene = new THREE.Scene();
const vmCam = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.01, 20);

/* ---------------- noise & terrain ---------------- */
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123; return s - Math.floor(s); }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, o) { o = o || 5; let t = 0, a = 1, f = 1, n = 0; for (let i = 0; i < o; i++) { t += vnoise(x * f, z * f) * a; n += a; a *= 0.5; f *= 2.03; } return t / n; }

const ROAD_W = 5.5;
let WORLD = 520;
let LV = null; /* current level definition (see mission.js / m*.js) */
function terrainH(x, z) { return LV.h(x, z); }
function onRoad(x, z) { return LV.onRoad ? LV.onRoad(x, z) : true; }
function roadX(z) { return 38 * Math.sin(z / 190) + 12 * Math.sin(z / 61 + 1.3); }
function baseH(x, z) { return (fbm(x * 0.0035 + 10, z * 0.0035 - 7, 4) - 0.5) * 46; }
const CAMP = { x: 112, z: 78 };
const CAMP_H = baseH(CAMP.x, CAMP.z);
function desertH(x, z) {
  let h = baseH(x, z) + (fbm(x * 0.02 + 50, z * 0.02 + 20, 3) - 0.5) * 6 + Math.sin(x * 0.045 + z * 0.013) * 0.8;
  const r = Math.hypot(x, z * 0.85), m = r - 340;
  if (m > 0) h += Math.min(m * m * 0.0045, 170) * (0.55 + 0.9 * fbm(x * 0.011, z * 0.011, 3));
  const dc = Math.hypot(x - CAMP.x, z - CAMP.z);
  if (dc < 45) { const t = smooth(20, 45, dc); h = CAMP_H + (h - CAMP_H) * t; }
  const rx = roadX(z), d = Math.abs(x - rx);
  if (d < 30) { const rh = baseH(rx, z) * 0.6; const t = smooth(ROAD_W + 1.2, 30, d); h = rh + (h - rh) * t; }
  return h;
}
function desertOnRoad(x, z) { return Math.abs(x - roadX(z)) < ROAD_W + 0.5; }

/* ---------------- colliders ---------------- */
let colliders = [];
function addBoxCollider(min, max, ref, o) {
  const c = Object.assign({ box: new THREE.Box3(min.clone(), max.clone()), ref: ref || null }, o || {});
  colliders.push(c); return c;
}
function colliderFromObject(obj, shrink, o) {
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj);
  if (shrink) { const s = new V3(); b.getSize(s); b.expandByVector(s.multiplyScalar(-shrink * 0.5)); }
  const c = Object.assign({ box: b, ref: obj }, o || {});
  colliders.push(c); return c;
}
/* Resolve a vertical cylinder against colliders. Returns ground height under it. */
function collideCircle(pos, radius, feetY, headY, skipCar) {
  let ground = terrainH(pos.x, pos.z);
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (c.noCol || (skipCar && c.car === skipCar)) continue;
    const b = c.box;
    if (pos.x + radius < b.min.x || pos.x - radius > b.max.x || pos.z + radius < b.min.z || pos.z - radius > b.max.z) continue;
    const inside = pos.x > b.min.x - radius * 0.4 && pos.x < b.max.x + radius * 0.4 && pos.z > b.min.z - radius * 0.4 && pos.z < b.max.z + radius * 0.4;
    if (inside && feetY >= b.max.y - 0.45 && !c.noGround) { if (b.max.y > ground) ground = b.max.y; continue; }
    if (headY < b.min.y || feetY > b.max.y) continue;
    const cx = clamp(pos.x, b.min.x, b.max.x), cz = clamp(pos.z, b.min.z, b.max.z);
    const dx = pos.x - cx, dz = pos.z - cz, d = Math.hypot(dx, dz);
    if (d < radius) {
      if (d < 1e-4) {
        const l = pos.x - b.min.x, r = b.max.x - pos.x, f = pos.z - b.min.z, k = b.max.z - pos.z, m = Math.min(l, r, f, k);
        if (m === l) pos.x = b.min.x - radius; else if (m === r) pos.x = b.max.x + radius; else if (m === f) pos.z = b.min.z - radius; else pos.z = b.max.z + radius;
      } else { pos.x = cx + dx / d * radius; pos.z = cz + dz / d * radius; }
    }
  }
  return ground;
}
function groundAt(x, z, fromY) {
  let g = terrainH(x, z);
  for (const c of colliders) { const b = c.box; if (c.car || c.noCol || c.noGround) continue; if (x > b.min.x && x < b.max.x && z > b.min.z && z < b.max.z && b.max.y <= fromY + 0.5 && b.max.y > g) g = b.max.y; }
  return g;
}

/* ---------------- ray casting (analytic) ---------------- */
const _ray = new THREE.Ray(), _tv = new V3(), _sph = new THREE.Sphere(), _bx = new THREE.Box3();
function marchTerrain(o, d, max) {
  max = Math.min(max, 700);
  let h0 = o.y - terrainH(o.x, o.z);
  if (h0 < 0) return 0;
  let t = 0, step = clamp(h0 * 0.5, 0.4, 6);
  while (t < max) {
    t += step;
    const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
    const h = y - terrainH(x, z);
    if (h < 0) {
      let a = t - step, b = t;
      for (let i = 0; i < 7; i++) { const m = (a + b) * 0.5; const hm = o.y + d.y * m - terrainH(o.x + d.x * m, o.z + d.z * m); if (hm < 0) b = m; else a = m; }
      return b;
    }
    if (d.y > 0.02 && y > 260) return null;
    step = clamp(h * 0.5, 0.4, 7);
  }
  return null;
}
/* opt: ignore (enemy or object), ignoreCar, ignoreCar2, noEnemies, noTerrain */
function castRay(o, d, max, opt) {
  opt = opt || {};
  _ray.origin.copy(o); _ray.direction.copy(d);
  let best = max, res = null;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (c.noRay) continue;
    if (c.car && (c.car === opt.ignoreCar || c.car === opt.ignoreCar2)) continue;
    if (c.ref && c.ref === opt.ignore) continue;
    if (_ray.intersectBox(c.box, _tv)) {
      const dist = _tv.distanceTo(o);
      if (dist < best) { best = dist; res = { type: c.car ? 'car' : 'static', col: c, point: _tv.clone(), dist }; }
    }
  }
  if (!opt.noEnemies) {
    for (const e of enemies) {
      if (!e.alive || e === opt.ignore) continue;
      if (e.pos.distanceToSquared(o) > (best + 3) * (best + 3)) continue;
      e.headSphere(_sph);
      if (_ray.intersectSphere(_sph, _tv)) { const dist = _tv.distanceTo(o); if (dist < best) { best = dist; res = { type: 'enemy', enemy: e, head: true, point: _tv.clone(), dist }; } }
      e.bodyBox(_bx);
      if (_ray.intersectBox(_bx, _tv)) { const dist = _tv.distanceTo(o); if (dist < best - 0.02) { best = dist; res = { type: 'enemy', enemy: e, head: false, point: _tv.clone(), dist }; } }
    }
  }
  if (!opt.noTerrain) {
    const td = marchTerrain(o, d, best);
    if (td !== null && td < best) { best = td; res = { type: 'terrain', point: o.clone().addScaledVector(d, td), dist: td }; }
  }
  return res;
}

/* ---------------- canvas textures ---------------- */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function grainDraw(ctx, w, h) {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = 205 + Math.random() * 50; d[i] = v; d[i + 1] = v * 0.98; d[i + 2] = v * 0.95; }
  ctx.putImageData(id, 0, 0);
  for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(90,60,40,${Math.random() * 0.12})`; ctx.beginPath(); ctx.ellipse(Math.random() * w, Math.random() * h, rand(2, 10), rand(1, 3), rand(0, 3), 0, TAU); ctx.fill(); }
}
function glowTex(inner, outer) {
  return canvasTex(128, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, inner); g.addColorStop(0.25, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
}
const TEX = {};
function initTextures() {
  TEX.grain = canvasTex(256, 256, grainDraw, 160);
  TEX.roadGrain = canvasTex(256, 256, (c, w, h) => { grainDraw(c, w, h); for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(0,0,0,${Math.random() * 0.25})`; c.beginPath(); c.moveTo(Math.random() * w, Math.random() * h); c.lineTo(Math.random() * w, Math.random() * h); c.stroke(); } });
  TEX.roadGrain.wrapS = TEX.roadGrain.wrapT = THREE.RepeatWrapping; TEX.roadGrain.repeat.set(2, 120);
  TEX.flash = canvasTex(128, 128, (c, w, h) => {
    c.translate(w / 2, h / 2);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, w / 2); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.2, 'rgba(255,200,90,0.9)'); g.addColorStop(0.6, 'rgba(255,110,20,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    for (let i = 0; i < 7; i++) { c.rotate(TAU / 7 + Math.random() * 0.3); c.beginPath(); c.moveTo(0, -6); c.lineTo(w * 0.5, 0); c.lineTo(0, 6); c.fill(); }
    c.beginPath(); c.arc(0, 0, w * 0.22, 0, TAU); c.fill();
  });
  TEX.glowOrange = glowTex('rgba(255,240,200,1)', 'rgba(255,140,40,0.55)');
  TEX.glowRed = glowTex('rgba(255,200,200,1)', 'rgba(255,40,30,0.5)');
  TEX.glowGold = glowTex('rgba(255,255,220,1)', 'rgba(255,190,60,0.45)');
  TEX.scorch = canvasTex(128, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(10,8,6,0.95)'); g.addColorStop(0.55, 'rgba(25,18,12,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(w / 2 + rand(-40, 40), h / 2 + rand(-40, 40), rand(2, 8), 0, TAU); c.fill(); }
  });
  TEX.crate = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#6d5a3a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { c.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.1})`; c.fillRect(0, i * 16, w, 2); }
    c.strokeStyle = '#3e3222'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
    c.beginPath(); c.moveTo(6, 6); c.lineTo(w - 6, h - 6); c.stroke();
    c.fillStyle = 'rgba(20,20,20,0.7)'; c.font = 'bold 20px monospace'; c.fillText('BL-7', 38, 70);
  });
  TEX.medkit = canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#e8e4dc'; c.fillRect(0, 0, w, h); c.fillStyle = '#c21d1d'; c.fillRect(24, 10, 16, 44); c.fillRect(10, 24, 44, 16); });
  TEX.label = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#0c0b0a'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#e9e1cc'; c.lineWidth = 5; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = '#e9e1cc'; c.textAlign = 'center';
    c.font = 'bold 30px Georgia,serif'; c.fillText('BLACKJACK', w / 2, 80);
    c.font = 'italic 22px Georgia,serif'; c.fillText('Reserve', w / 2, 112);
    c.font = 'bold 44px Georgia,serif'; c.fillText('No. 13', w / 2, 170);
    c.font = '14px Georgia,serif'; c.fillText('DESERT-AGED · FICTIONAL', w / 2, 214);
  });
  TEX.sign = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#1e5b33'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 5; c.strokeRect(8, 8, w - 16, h - 16);
    c.fillStyle = '#fff'; c.font = 'bold 30px Arial'; c.textAlign = 'center'; c.fillText('HWY 7  NORTH', w / 2, 56); c.font = 'bold 22px Arial'; c.fillText('ASH SPRINGS  64', w / 2, 96);
  });
  TEX.warn = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#d8b12a'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = 'bold 28px Arial'; c.textAlign = 'center';
    c.fillText('RESTRICTED AREA', w / 2, 52); c.font = 'bold 18px Arial'; c.fillText('USE OF DEADLY FORCE AUTHORIZED', w / 2, 92);
  });
}
