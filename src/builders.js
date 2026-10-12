/* ============================================================
   BUILDERS: shared level construction helpers — tiled boxes,
   walls with doorways, light panels, nav graphs, extra textures
   ============================================================ */
function normalTex(w, h, hf, strength, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'), id = ctx.createImageData(w, h), d = id.data;
  const H = new Float32Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) H[y * w + x] = hf(x, y);
  // make it tile: blend edges
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const l = H[y * w + (x - 1 + w) % w], r = H[y * w + (x + 1) % w], u = H[((y - 1 + h) % h) * w + x], dn = H[((y + 1) % h) * w + x];
    let nx = (l - r) * strength, ny = (u - dn) * strength, nz = 1; const L = Math.hypot(nx, ny, nz); const i = (y * w + x) * 4;
    d[i] = (nx / L * 0.5 + 0.5) * 255; d[i + 1] = (ny / L * 0.5 + 0.5) * 255; d[i + 2] = (nz / L * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ctx.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat, repeat); t.anisotropy = 8; return t;
}
function normalFromTex(src, strength) {
  const img = src.image, w = img.width, h = img.height, d = img.getContext('2d').getImageData(0, 0, w, h).data;
  const t = normalTex(w, h, (x, y) => { const i = (y * w + x) * 4; return (d[i] + d[i + 1] + d[i + 2]) / 765 * 6; }, strength);
  t.repeat.copy(src.repeat); return t;
}
function initTextures2() {
  TEX.wall = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#7b7e80'; c.fillRect(0, 0, w, h);
    const id = c.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; } c.putImageData(id, 0, 0);
    c.strokeStyle = 'rgba(30,30,32,0.55)'; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4); c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
    for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(40,36,30,0.12)'; c.fillRect(rand(0, w), h / 2, rand(6, 20), rand(30, 120)); }
    c.fillStyle = 'rgba(20,20,20,0.35)'; for (const [x, y] of [[12, 12], [w - 12, 12], [12, h - 12], [w - 12, h - 12]]) { c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }
  });
  TEX.floor = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#4b4d50'; c.fillRect(0, 0, w, h);
    const id = c.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n; } c.putImageData(id, 0, 0);
    c.strokeStyle = 'rgba(15,15,15,0.5)'; c.lineWidth = 2; c.strokeRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(0,0,0,0.1)'; c.beginPath(); c.ellipse(rand(0, w), rand(0, h), rand(10, 40), rand(6, 20), rand(0, 3), 0, TAU); c.fill(); }
  });
  TEX.hazard = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#e0b421'; c.fillRect(0, 0, w, h); c.fillStyle = '#141414'; for (let i = -4; i < 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 16, 0); c.lineTo(i * 32 + 16 + h, h); c.lineTo(i * 32 + h, h); c.fill(); } });
  TEX.rack = canvasTex(64, 128, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.fillStyle = '#10141a'; for (let y = 2; y < h; y += 12) c.fillRect(2, y, w - 4, 9); for (let y = 5; y < h; y += 12) for (let x = 8; x < w; x += 10) { if (Math.random() < 0.3) { c.fillStyle = pick(['#3aa7ff', '#39ff88', '#3aa7ff', '#ffb02e', '#3aa7ff']); c.fillRect(x, y, 3, 2); } } });
  TEX.window = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#6f7880'; c.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = '#1a2230'; c.fillRect(x * 32 + 4, y * 32 + 6, 24, 20); } });
  TEX.windowE = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { if (Math.random() < 0.35) { c.fillStyle = pick(['#ffcf8a', '#ffe2b0', '#9fd0ff', '#ffb060']); c.fillRect(x * 32 + 4, y * 32 + 6, 24, 20); } } });
  TEX.sidewalk = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#8a8680'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(40,40,40,0.4)'; c.lineWidth = 2; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, h); c.stroke(); c.beginPath(); c.moveTo(0, i * 32); c.lineTo(w, i * 32); c.stroke(); } });
  TEX.cityRoad = canvasTex(256, 256, (c, w, h) => { grainDraw(c, w, h); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#3a3836'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over'; });
  TEX.sand2 = canvasTex(256, 256, grainDraw);
  TEX.panelLight = canvasTex(64, 64, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff'); g.addColorStop(1, '#dfe8ff'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = '#9aa'; c.lineWidth = 4; c.strokeRect(0, 0, w, h); });
  TEX.waterN = canvasTex(256, 256, (c, w, h) => {
    const id = c.createImageData(w, h), d = id.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const f = (a, b) => Math.sin(a * TAU / w * 3 + Math.sin(b * TAU / h * 2) * 1.5) + Math.sin(b * TAU / h * 5 + a * TAU / w) * 0.5;
      const hx = f(x + 1, y) - f(x - 1, y), hy = f(x, y + 1) - f(x, y - 1), i = (y * w + x) * 4;
      d[i] = 128 + hx * 60; d[i + 1] = 128 + hy * 60; d[i + 2] = 255; d[i + 3] = 255;
    }
    c.putImageData(id, 0, 0);
  }, 1);
  TEX.waterN.encoding = THREE.LinearEncoding;
  // detail normal maps derived from procedural height (adds surface relief under lighting)
  TEX.detailN = normalTex(256, 256, (x, y) => fbm(x * 0.06, y * 0.06, 4) * 1.2 + vnoise(x * 0.35, y * 0.35) * 0.25, 2.2, 90);
  TEX.wallN = normalFromTex(TEX.wall, 1.6); TEX.floorN = normalFromTex(TEX.floor, 1.2);
  M.wall = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, map: TEX.wall, normalMap: TEX.wallN });
  M.wallDark = new THREE.MeshStandardMaterial({ color: 0x5a5e66, roughness: 0.85, map: TEX.wall, normalMap: TEX.wallN });
  M.floor = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.15, map: TEX.floor, normalMap: TEX.floorN });
  M.ceil = new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.9, map: TEX.wall });
  M.hazard = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, map: TEX.hazard });
  M.pipe = new THREE.MeshStandardMaterial({ color: 0x5b6168, roughness: 0.4, metalness: 0.7 });
  M.panel = new THREE.MeshBasicMaterial({ color: 0xeaf2ff, map: TEX.panelLight });
  M.panelRed = new THREE.MeshBasicMaterial({ color: 0xff3020 });
  M.glassB = new THREE.MeshStandardMaterial({ color: 0x8ab8d8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false });
  M.desk = new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.6, metalness: 0.3 });
  M.screen = new THREE.MeshBasicMaterial({ color: 0x57c7ff });
  M.building = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.7, metalness: 0.2, map: TEX.window, emissive: 0xffffff, emissiveMap: TEX.windowE, emissiveIntensity: 1.4 });
  M.panel.color.multiplyScalar(2.2); M.panelRed.color.multiplyScalar(3); M.screen.color.multiplyScalar(1.6);
  M.sidewalk = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, map: TEX.sidewalk });
  M.cityRoad = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, map: TEX.cityRoad });
  M.water = new THREE.MeshStandardMaterial({ color: 0x0f3a4a, roughness: 0.08, metalness: 0.1, normalMap: TEX.waterN, normalScale: new THREE.Vector2(0.6, 0.6), transparent: true, opacity: 0.9 });
}

/* box whose UVs tile in world units (tile = metres per texture repeat) */
function tiledBoxGeo(w, h, d, tile) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, t = tile || 4;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
}
/* solid box: rendered + collider. y is the bottom. */
function solid(w, h, d, mat, x, y, z, o) {
  o = o || {};
  const m = new THREE.Mesh(o.tile ? tiledBoxGeo(w, h, d, o.tile) : B(w, h, d), mat);
  m.position.set(x, y + h / 2, z); if (o.ry) m.rotation.y = o.ry;
  m.castShadow = o.shadow !== false; m.receiveShadow = true; scene.add(m);
  if (o.col !== false) { const c = colliderFromObject(m, 0, { cover: !!o.cover, metal: !!o.metal }); if (o.noGround) c.noGround = true; m.userData.col = c; }
  return m;
}
/* axis-aligned wall from (x0,z0) to (x1,z1); doors = centre coords along the wall */
function wall(x0, z0, x1, z1, o) {
  o = o || {};
  const h = o.h || 4.2, t = o.t || 0.4, mat = o.mat || M.wall, y0 = o.y0 || 0, dw = o.dw || 3.2, dh = o.dh || 3.0;
  const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
  const a0 = alongX ? Math.min(x0, x1) : Math.min(z0, z1), a1 = alongX ? Math.max(x0, x1) : Math.max(z0, z1), fixed = alongX ? z0 : x0;
  const doors = (o.doors || []).slice().sort((a, b) => a - b);
  let cur = a0; const segs = [];
  for (const dc of doors) { segs.push([cur, dc - dw / 2]); cur = dc + dw / 2; }
  segs.push([cur, a1]);
  const mk = (s0, s1, yb, hh) => {
    const L = s1 - s0; if (L <= 0.05 || hh <= 0.05) return;
    const c = (s0 + s1) / 2;
    if (alongX) solid(L, hh, t, mat, c, yb, fixed, { tile: 4, shadow: false, noGround: yb > 0.5 });
    else solid(t, hh, L, mat, fixed, yb, c, { tile: 4, shadow: false, noGround: yb > 0.5 });
  };
  for (const [s0, s1] of segs) mk(s0, s1, y0, h);
  for (const dc of doors) mk(dc - dw / 2, dc + dw / 2, y0 + dh, h - dh);
}
function floorPlane(x0, z0, x1, z1, y, mat, tile) {
  const w = x1 - x0, d = z1 - z0, g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / (tile || 4), uv.getY(i) * d / (tile || 4));
  const m = new THREE.Mesh(g, mat); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m); return m;
}
function ceilPlane(x0, z0, x1, z1, y, mat) { const m = floorPlane(x0, z0, x1, z1, y, mat || M.ceil, 4); m.rotation.x = Math.PI; return m; }
/* ceiling light panel + register a dynamic light fixture */
function lightPanel(x, y, z, o) {
  o = o || {};
  const m = new THREE.Mesh(B(o.w || 1.6, 0.08, o.d || 0.5), o.mat || M.panel); m.position.set(x, y - 0.05, z); scene.add(m);
  if (o.light !== false) Fixtures.add(new V3(x, y - 0.5, z), o.color || 0xdfe8ff, o.i || 1.4, o.dist || 16, o.flicker || 0, m);
  return m;
}
function sign(text, x, y, z, ry, o) {
  o = o || {};
  const t = canvasTex(256, 64, (c, w, h) => { c.fillStyle = o.bg || '#1b1e22'; c.fillRect(0, 0, w, h); c.strokeStyle = o.fg || '#e0b421'; c.lineWidth = 4; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = o.fg || '#e0b421'; c.font = 'bold 30px Arial'; c.textAlign = 'center'; c.fillText(text, w / 2, 43); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w || 2.4, (o.w || 2.4) / 4), new THREE.MeshBasicMaterial({ map: t }));
  m.position.set(x, y, z); m.rotation.y = ry || 0; scene.add(m); return m;
}

/* ---------------- navigation graph (for indoor AI) ---------------- */
const NAV = { nodes: [], adj: [] };
function buildNav(points) {
  NAV.nodes = points.map(p => new V3(p[0], 1.0, p[1])); NAV.adj = NAV.nodes.map(() => []);
  for (let i = 0; i < NAV.nodes.length; i++) for (let j = i + 1; j < NAV.nodes.length; j++) {
    const a = NAV.nodes[i], b = NAV.nodes[j], d = a.distanceTo(b); if (d > 48) continue;
    if (navClear(a, b)) { NAV.adj[i].push([j, d]); NAV.adj[j].push([i, d]); }
  }
}
function navClear(a, b) {
  _v5.copy(b).sub(a); const d = _v5.length(); if (d < 0.01) return true; _v5.divideScalar(d);
  const o = _v4.set(a.x, (a.y || 0) > 0.3 ? a.y : 1.0, a.z);
  return !castRay(o, _v5, d, { noEnemies: true, noTerrain: true });
}
function nearestVisibleNode(p) {
  const order = NAV.nodes.map((n, i) => [i, (n.x - p.x) ** 2 + (n.z - p.z) ** 2]).sort((a, b) => a[1] - b[1]);
  const q = new V3(p.x, (p.y || 0) + 1.0, p.z);
  for (let k = 0; k < Math.min(6, order.length); k++) if (navClear(q, NAV.nodes[order[k][0]])) return order[k][0];
  return order.length ? order[0][0] : -1;
}
function navNext(from, to) {
  if (!NAV.nodes.length) return null;
  const f = new V3(from.x, (from.y || 0) + 1.0, from.z), t = new V3(to.x, (from.y || 0) + 1.0, to.z);
  if (navClear(f, t)) return null;
  const s = nearestVisibleNode(from), g = nearestVisibleNode(to); if (s < 0 || g < 0) return null;
  if (s === g) return NAV.nodes[s];
  const dist = NAV.nodes.map(() => Infinity), prev = NAV.nodes.map(() => -1), done = NAV.nodes.map(() => false); dist[s] = 0;
  for (;;) {
    let u = -1, best = Infinity; for (let i = 0; i < dist.length; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u < 0 || u === g) break; done[u] = true;
    for (const [v, w] of NAV.adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  if (!isFinite(dist[g])) return NAV.nodes[s];
  let path = [g]; while (path[0] !== s) path.unshift(prev[path[0]]);
  const first = NAV.nodes[path[0]];
  if (Math.hypot(first.x - from.x, first.z - from.z) > 1.4) return first;
  return NAV.nodes[path[1]] || null;
}
