/* ============================================================
   CHAPTER 4 — THE ISLAND
   Wash ashore unarmed → research compound → memory labs →
   wall of photographs → Cycle Chamber → hold the radio tower
   → steal a gunboat.
   ============================================================ */
const I4 = { comp: { x: 20, z: -10 }, tower: { x: 120, z: -150 }, dock: { x: 400, z: -10 } };
function islandBase(x, z) {
  const r = Math.hypot(x, z * 1.15);
  let h = 30 * (1 - smooth(60, 380, r)) + 6 * (1 - smooth(300, 425, r));
  h += (fbm(x * 0.008 + 3, z * 0.008 - 2, 4) - 0.5) * 24 * (1 - smooth(250, 400, r));
  h += Math.max(0, 44 - Math.hypot(x - I4.tower.x, z - I4.tower.z) * 0.42);
  h -= 9 * smooth(360, 470, r) + 12 * smooth(430, 560, r);
  return h;
}
const I4H = islandBase(I4.comp.x, I4.comp.z);
function beachZ(x) { let best = 300; for (let z = 250; z < 470; z += 1) if (islandBase(x, z) > 1.2) best = z; return best; }
function islandH(x, z) {
  let h = islandBase(x, z);
  const dc = Math.max(Math.abs(x - I4.comp.x) - 58, Math.abs(z - I4.comp.z) - 55, 0);
  if (dc < 30) { const t = smooth(0, 30, dc); h = I4H + (h - I4H) * t; }
  const th = islandBase(I4.tower.x, I4.tower.z), dt = Math.hypot(x - I4.tower.x, z - I4.tower.z);
  if (dt < 26) { const t = smooth(12, 26, dt); h = th + (h - th) * t; }
  // dock flat
  const dd = Math.hypot(x - I4.dock.x + 30, z - I4.dock.z); if (dd < 30) { const t = smooth(10, 30, dd); h = 1.2 + (h - 1.2) * t; }
  return h;
}
function islandPath(x, z) {
  // dirt path: beach → gate, gate → tower, compound → dock
  const segs = [[20, 330, 20, 48], [60, -40, 120, -135], [78, -10, 370, -10]];
  let m = 99; for (const [x0, z0, x1, z1] of segs) { const vx = x1 - x0, vz = z1 - z0, L = vx * vx + vz * vz, t = clamp(((x - x0) * vx + (z - z0) * vz) / L, 0, 1); m = Math.min(m, Math.hypot(x - x0 - vx * t, z - z0 - vz * t)); }
  return m;
}
const ISL = {};
function islandColor(x, z, h, c) {
  if (!ISL.sand) Object.assign(ISL, { sand: new THREE.Color(0xe2cf9a), wet: new THREE.Color(0xa89a70), grass: new THREE.Color(0x4f7a2c), grass2: new THREE.Color(0x6a8f34), rock: new THREE.Color(0x6a655a), dirt: new THREE.Color(0x7a5f3e), deep: new THREE.Color(0x3a5a50) });
  const I = ISL;
  if (h < -0.5) c.copy(I.deep).lerp(I.wet, clamp((h + 6) / 6, 0, 1));
  else if (h < 1.6) c.copy(I.wet).lerp(I.sand, clamp(h / 1.2, 0, 1));
  else { c.copy(I.sand).lerp(I.grass, clamp((h - 1.6) / 2.5, 0, 1)); c.lerp(I.grass2, fbm(x * 0.05, z * 0.05, 3) * 0.6); }
  const s = Math.abs(islandH(x + 2, z) - h) + Math.abs(islandH(x, z + 2) - h); if (h > 2) c.lerp(I.rock, clamp((s - 1.4) / 3, 0, 0.9));
  if (h > 1.5) { const p = islandPath(x, z); c.lerp(I.dirt, (1 - smooth(1.5, 4, p)) * 0.85); }
  if (Math.max(Math.abs(x - I4.comp.x) - 58, Math.abs(z - I4.comp.z) - 55) < 0) c.lerp(I.dirt, 0.55);
}
function palm(x, z, s, rnd) {
  const h = islandH(x, z), g = new THREE.Group(); g.position.set(x, h - 0.2, z);
  const lean = new THREE.Group(); lean.rotation.set(rnd() * 0.3 - 0.15, rnd() * 6, rnd() * 0.35 - 0.05); g.add(lean);
  const H = 7 * s + rnd() * 3;
  for (let i = 0; i < 5; i++) part(lean, new THREE.CylinderGeometry(0.2 - i * 0.02, 0.24 - i * 0.02, H / 5, 7), PALM.trunk, Math.sin(i * 0.4) * 0.3 * i * 0.3, H / 10 + i * H / 5, 0, 0, 0, 0.05 * i);
  const top = new THREE.Group(); top.position.set(0.45, H, 0); lean.add(top);
  for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(PALM.frond, PALM.leaf); f.rotation.set(0.5 + rnd() * 0.3, i * TAU / 8, 0, 'YXZ'); f.castShadow = true; top.add(f); }
  scene.add(g); return g;
}
const PALM = {};
function buildIsland() {
  WORLD = 900;
  PALM.trunk = new THREE.MeshStandardMaterial({ color: 0x7a5f3e, roughness: 1, flatShading: true });
  PALM.leaf = new THREE.MeshStandardMaterial({ color: 0x3f7a2a, roughness: 0.9, side: THREE.DoubleSide, flatShading: true });
  const fr = new THREE.PlaneGeometry(1.1, 5, 1, 4); fr.translate(0, 2.5, 0); const fp = fr.attributes.position; for (let i = 0; i < fp.count; i++) { const y = fp.getY(i); fp.setZ(i, -y * y * 0.06); fp.setX(i, fp.getX(i) * (1 - y / 6)); } fr.rotateX(-Math.PI / 2); fr.computeVertexNormals(); PALM.frond = fr;
  M.water.color.set(0x137a8a); M.water.opacity = 0.82;
  buildTerrain({ size: 1300, seg: 260, color: islandColor });
  buildWater(0, 5000, 0, 0);
  const rnd = mulberry(909);
  // palms near beaches, jungle trees inland
  let n = 0;
  for (let i = 0; i < 2600 && n < 260; i++) {
    const x = (rnd() - 0.5) * 900, z = (rnd() - 0.5) * 820, h = islandH(x, z);
    if (h < 1.4 || islandPath(x, z) < 6 || Math.max(Math.abs(x - I4.comp.x) - 64, Math.abs(z - I4.comp.z) - 62) < 0 || Math.hypot(x - I4.tower.x, z - I4.tower.z) < 24) continue;
    if (h < 9 || rnd() < 0.35) { palm(x, z, 0.8 + rnd() * 0.5, rnd); addBoxCollider(new V3(x - 0.35, h, z - 0.35), new V3(x + 0.35, h + 6, z + 0.35)); n++; }
  }
  // jungle canopy + undergrowth (instanced)
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), ps = new V3(), eu = new THREE.Euler();
  const trunkI = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.55, 1, 7), PALM.trunk, 220), crownI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x2e5a22, roughness: 1, flatShading: true }), 440);
  const bushI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x4a7a2a, roughness: 1, flatShading: true }), 1400);
  let ti = 0, ci = 0, bi = 0;
  for (let i = 0; i < 9000 && (ti < 220 || bi < 1400); i++) {
    const x = (rnd() - 0.5) * 880, z = (rnd() - 0.5) * 800, h = islandH(x, z);
    if (h < 3 || islandPath(x, z) < 4 || Math.max(Math.abs(x - I4.comp.x) - 62, Math.abs(z - I4.comp.z) - 60) < 0 || Math.hypot(x - I4.tower.x, z - I4.tower.z) < 20) continue;
    if (h > 9 && ti < 220 && rnd() < 0.2) {
      const H = 9 + rnd() * 8; ps.set(x, h + H / 2, z); q.identity(); sc.set(1, H, 1); mtx.compose(ps, q, sc); trunkI.setMatrixAt(ti++, mtx);
      for (let k = 0; k < 2; k++) { const s = 3.5 + rnd() * 3; ps.set(x + rnd() * 2 - 1, h + H + k * 1.5 - 1, z + rnd() * 2 - 1); eu.set(0, rnd() * 3, 0); q.setFromEuler(eu); sc.set(s, s * 0.6, s); mtx.compose(ps, q, sc); crownI.setMatrixAt(ci++, mtx); }
      addBoxCollider(new V3(x - 0.5, h, z - 0.5), new V3(x + 0.5, h + H, z + 0.5));
    } else if (bi < 1400) { const s = 0.5 + rnd() * 1.1; ps.set(x, h + s * 0.35, z); eu.set(0, rnd() * 6, 0); q.setFromEuler(eu); sc.set(s * 1.4, s * 0.8, s * 1.4); mtx.compose(ps, q, sc); bushI.setMatrixAt(bi++, mtx); }
  }
  trunkI.count = ti; crownI.count = ci; bushI.count = bi; trunkI.castShadow = crownI.castShadow = bushI.castShadow = true; scene.add(trunkI, crownI, bushI);
  // rocks along shores
  for (let k = 0; k < 40; k++) { const a = rnd() * TAU, r = 330 + rnd() * 70, x = Math.cos(a) * r, z = Math.sin(a) * r / 1.15; if (islandH(x, z) < -1 || Math.hypot(x - 20, z - 345) < 30) continue; addRock(x, z, 1.5 + rnd() * 3, 1 + rnd() * 2, 1.5 + rnd() * 3, rnd() * 6, 700 + k, M.rockDark); }
  buildCompound();
  // radio tower on the hill
  const th = islandH(I4.tower.x, I4.tower.z), tw = new THREE.Group();
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { const leg = part(tw, new THREE.CylinderGeometry(0.12, 0.18, 36, 6), M.metal, dx * (1 - 0.0), 18, dz); leg.rotation.set(-dz * 0.05, 0, dx * 0.05); }
  for (let y = 4; y < 34; y += 5) part(tw, B(4.4 - y * 0.08, 0.12, 0.12), M.metal, 0, y, 2 - y * 0.02), part(tw, B(4.4 - y * 0.08, 0.12, 0.12), M.metal, 0, y, -2 + y * 0.02);
  const beacon = spriteGlow(TEX.glowRed, 3); beacon.position.y = 37; tw.add(beacon); I4.beacon = beacon;
  tw.position.set(I4.tower.x, th, I4.tower.z); scene.add(tw); addBoxCollider(new V3(I4.tower.x - 2.4, th, I4.tower.z - 2.4), new V3(I4.tower.x + 2.4, th + 36, I4.tower.z + 2.4));
  // bunker + sandbags at the tower
  solid(10, 3, 6, M.concrete, I4.tower.x + 9, th, I4.tower.z + 2, { tile: 3, cover: true });
  for (const [x, z] of [[-10, 8], [10, 12], [-12, -8], [4, -14], [14, -6]]) crate(I4.tower.x + x, th, I4.tower.z + z, 1.3, rnd() * 3);
  I4.console = new V3(I4.tower.x + 3.5, th + 1.1, I4.tower.z + 3);
  solid(1.6, 1.1, 0.8, M.desk, I4.console.x, th, I4.console.z + 0.2, { cover: true }); solid(1.2, 0.6, 0.05, M.screen, I4.console.x, th + 1.1, I4.console.z - 0.2, { col: false });
  // dock
  const dh = 1.2; solid(44, 0.5, 6, M.wood, I4.dock.x - 10, dh - 0.4, I4.dock.z, { tile: 2 });
  for (let x = -28; x <= 8; x += 6) for (const dz of [-3, 3]) solid(0.4, 4, 0.4, M.wood, I4.dock.x + x, -3, I4.dock.z + dz, { col: false });
  const boat = new THREE.Group(); part(boat, B(4, 1.6, 14), new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.6, metalness: 0.4 }), 0, 0.3, 0); part(boat, new THREE.ConeGeometry(2.8, 5, 4).rotateX(-Math.PI / 2).rotateZ(Math.PI / 4), new THREE.MeshStandardMaterial({ color: 0x2a2e33 }), 0, 0.4, -9);
  part(boat, B(3, 2, 4), M.darkMetal, 0, 2, 1.5); part(boat, B(2.8, 0.8, 0.1), M.glass, 0, 2.4, -0.55); part(boat, CYZ(0.08, 1.8), M.gun, 0, 2.2, -4);
  boat.position.set(I4.dock.x + 16, 0.2, I4.dock.z + 7); boat.rotation.y = Math.PI / 2; scene.add(boat); I4.boat = boat; I4.boatPos = new V3(I4.dock.x + 7, dh + 0.5, I4.dock.z + 1.5);
  // wrecked patrol boat on the beach (start)
  const wb = new THREE.Group(); part(wb, B(3, 1.4, 10), M.burnt, 0, 0.5, 0); part(wb, B(2.4, 1.6, 3), M.burnt, 0, 1.6, 1);
  const wz = beachZ(46) + 3; wb.position.set(46, islandH(46, wz) - 0.4, wz); I4.wreckZ = wz; wb.rotation.set(0.1, 0.9, 0.25); scene.add(wb); colliderFromObject(wb, 0.1, { cover: true, metal: true });
  // nav for compound interiors
  const C = I4.comp, nodes = [[C.x, C.z + 48], [C.x, C.z + 30], [C.x - 20, C.z + 20], [C.x + 20, C.z + 20], [C.x - 38, C.z + 12], [C.x - 38, C.z + 28], [C.x + 20, C.z + 36], [C.x + 20, C.z + 23], [C.x + 20, C.z + 16], [C.x - 35, C.z - 12], [C.x - 35, C.z - 26], [C.x - 30, C.z - 40], [C.x - 44, C.z - 26], [C.x, C.z - 5], [C.x + 30, C.z - 5], [C.x + 30, C.z - 22], [C.x + 30, C.z - 33], [C.x + 40, C.z - 40], [C.x - 10, C.z - 45]];
  buildNav(nodes.map(([x, z]) => [x, z]));
  for (const n of NAV.nodes) n.y = I4H + 1;
}
/* compound: fence, barracks, Lab A, Lab B (photo wall), Cycle Chamber bunker */
function bldg(x0, z0, x1, z1, h, doors, o) {
  const y = I4H; o = o || {};
  floorPlane(x0, z0, x1, z1, y + 0.02, M.floor, 4);
  const W = (a, b, c, d, dd) => wall(a, b, c, d, { h, y0: y, mat: o.mat || M.wall, doors: dd || [], dw: 2.4, dh: 2.6 });
  W(x0, z0, x1, z0, doors.n); W(x0, z1, x1, z1, doors.s); W(x0, z0, x0, z1, doors.w); W(x1, z0, x1, z1, doors.e);
  const roof = new THREE.Mesh(tiledBoxGeo(x1 - x0 + 1, 0.4, z1 - z0 + 1, 4), M.concrete); roof.position.set((x0 + x1) / 2, y + h + 0.2, (z0 + z1) / 2); roof.castShadow = true; scene.add(roof);
  for (let x = x0 + 4; x < x1 - 2; x += 8) for (let z = z0 + 4; z < z1 - 2; z += 8) lightPanel(x, y + h, z, { i: 1.1, flicker: o.flicker || 0 });
}
function buildCompound() {
  const C = I4.comp, y = I4H;
  // fence
  const fx0 = C.x - 58, fx1 = C.x + 58, fz0 = C.z - 55, fz1 = C.z + 55;
  for (const [a, b, c, d, gap] of [[fx0, fz0, fx1, fz0], [fx0, fz1, C.x - 4, fz1], [C.x + 4, fz1, fx1, fz1], [fx0, fz0, fx0, fz1], [fx1, fz0, fx1, -4 + C.z], [fx1, 4 + C.z, fx1, fz1]]) {
    const L = Math.hypot(c - a, d - b), f = new THREE.Mesh(new THREE.PlaneGeometry(L, 3), new THREE.MeshBasicMaterial({ color: 0xaab0b4, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    f.position.set((a + c) / 2, y + 1.5, (b + d) / 2); if (a === c) f.rotation.y = Math.PI / 2; scene.add(f);
    addBoxCollider(new V3(Math.min(a, c) - 0.1, y, Math.min(b, d) - 0.1), new V3(Math.max(a, c) + 0.1, y + 3, Math.max(b, d) + 0.1));
    for (let t = 0; t <= L; t += 5) solid(0.12, 3.2, 0.12, M.metal, a + (c - a) * t / L, y, b + (d - b) * t / L, { col: false, shadow: false });
  }
  sign('KESTREL ISLAND RESEARCH — RESTRICTED', C.x, y + 3.6, fz1 + 0.3, 0, { w: 5, fg: '#ffffff', bg: '#8a1a14' });
  // barracks
  bldg(C.x - 44, C.z + 6, C.x - 30, C.z + 34, 4, { e: [C.z + 20] }, {});
  for (let z = C.z + 9; z < C.z + 32; z += 4) solid(2, 0.6, 1, M.wood, C.x - 41, y, z, { cover: true });
  // Lab A — memory experiments
  bldg(C.x + 8, C.z + 10, C.x + 34, C.z + 28, 4.4, { s: [C.x + 20] }, {});
  for (let i = 0; i < 3; i++) { const cx = C.x + 13 + i * 7, cz = C.z + 16; solid(1.2, 0.5, 2.2, new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: 0.4 }), cx, y, cz, { cover: true }); solid(1.2, 1.1, 0.3, M.darkMetal, cx, y + 0.5, cz - 1.0, { col: false }); solid(0.9, 0.6, 0.06, M.screen, cx, y + 1.9, cz - 1.6, { col: false }); const hel = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, TAU, 0, Math.PI / 2), M.metal); hel.position.set(cx, y + 1.3, cz - 0.9); scene.add(hel); }
  I4.labATerm = new V3(C.x + 30, y + 1.2, C.z + 12);
  solid(2, 0.9, 1, M.desk, I4.labATerm.x, y, I4.labATerm.z + 0.3, { cover: true }); solid(0.9, 0.55, 0.05, M.screen, I4.labATerm.x, y + 0.9, I4.labATerm.z - 0.1, { col: false });
  // Lab B — the photographs
  bldg(C.x - 48, C.z - 40, C.x - 20, C.z - 18, 4.6, { e: [C.z - 26] }, { flicker: 0.04 });
  buildPhotoWall(C.x - 34, y, C.z - 39.7);
  // Cycle Chamber bunker (half-buried)
  bldg(C.x + 22, C.z - 46, C.x + 44, C.z - 28, 3.6, { n: [], s: [C.x + 30] }, { mat: M.wallDark });
  I4.chamber = new V3(C.x + 33, y + 1.2, C.z - 42);
  const cy = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 3.4, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x57c7ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); cy.position.set(C.x + 38, y + 1.7, C.z - 38); scene.add(cy); I4.cyl = cy;
  solid(1.8, 1, 0.8, M.desk, I4.chamber.x, y, I4.chamber.z + 0.2, { cover: true }); solid(1.2, 0.6, 0.05, M.screen, I4.chamber.x, y + 1, I4.chamber.z - 0.2, { col: false });
  // yard props
  for (const [x, z] of [[C.x - 8, C.z + 24], [C.x + 2, C.z + 4], [C.x - 14, C.z - 6], [C.x + 48, C.z + 10], [C.x + 6, C.z - 26], [C.x - 4, C.z + 40]]) crate(x, y, z, 1.3, rand(0, 3));
  const wt = new THREE.Group(); for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) part(wt, B(0.2, 9, 0.2), M.metal, dx, 4.5, dz); part(wt, new THREE.CylinderGeometry(2.6, 2.6, 4, 16), M.metal, 0, 11, 0); wt.position.set(C.x + 48, y, C.z - 10); scene.add(wt);
}
function photoTex(seed, place, year, kind) {
  return canvasTex(256, 200, (c, w, h) => {
    const r = mulberry(seed);
    const sky = { desert: ['#3b4a6a', '#e0a070'], snow: ['#8aa0b8', '#e8eef2'], jungle: ['#5a8aa0', '#c8d8a0'], city: ['#2a2a38', '#8a5a4a'], sea: ['#4a78a0', '#a8c8d8'] }[kind];
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = kind === 'snow' ? '#dfe6ea' : kind === 'jungle' ? '#2f5a2a' : kind === 'city' ? '#1a1a22' : kind === 'sea' ? '#2a5a7a' : '#a8784a';
    c.beginPath(); c.moveTo(0, h * 0.62); for (let x = 0; x <= w; x += 16) c.lineTo(x, h * (0.5 + r() * 0.15)); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    if (kind === 'city') for (let i = 0; i < 8; i++) { c.fillStyle = '#0e0e14'; const bw = 16 + r() * 20, bh = 40 + r() * 70; c.fillRect(r() * w, h * 0.6 - bh, bw, bh); }
    c.fillStyle = '#0c0a09'; const fx = w * (0.3 + r() * 0.4), fy = h * 0.92;
    c.fillRect(fx - 6, fy - 36, 5, 36); c.fillRect(fx + 1, fy - 36, 5, 36); c.fillRect(fx - 9, fy - 74, 18, 40); c.beginPath(); c.arc(fx, fy - 82, 8, 0, TAU); c.fill(); c.fillRect(fx + 9, fy - 70, 4, 26);
    const id = c.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 24; const sep = 0.2; const gr = (d[i] + d[i + 1] + d[i + 2]) / 3; d[i] = gr * sep + d[i] * (1 - sep) + n + 12; d[i + 1] = gr * sep + d[i + 1] * (1 - sep) + n + 4; d[i + 2] = gr * sep + d[i + 2] * (1 - sep) + n - 8; } c.putImageData(id, 0, 0);
    c.fillStyle = '#ff8a2a'; c.font = 'bold 16px monospace'; c.fillText(year, w - 60, h - 10);
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = '12px monospace'; c.fillText(place, 8, 16);
    c.strokeStyle = '#d02a20'; c.lineWidth = 3; c.beginPath(); c.arc(fx, fy - 82, 13, 0, TAU); c.stroke();
  });
}
function buildPhotoWall(cx, y, z) {
  const items = [['NEVADA, USA', '2009', 'desert'], ['HINDU KUSH', '2010', 'snow'], ['MINDANAO', '2011', 'jungle'], ['ALEPPO', '2012', 'city'], ['GULF OF ADEN', '2013', 'sea'], ['DONBAS', '2014', 'snow'], ['SAHEL', '2015', 'desert'], ['MOSUL', '2016', 'city'], ['SOUTH CHINA SEA', '2017', 'sea'], ['CARACAS', '2018', 'city'], ['TIGRAY', '2019', 'desert'], ['NAGORNO-KARABAKH', '2020', 'snow'], ['KABUL', '2021', 'city'], ['KHARTOUM', '2022', 'desert'], ['SAN MARCOS', '2023', 'city'], ['HWY 7, NEVADA', 'TOMORROW', 'desert']];
  const board = new THREE.Mesh(B(14, 3.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x6a5238, roughness: 1 })); board.position.set(cx, y + 2.1, z + 0.1); scene.add(board);
  items.forEach(([place, year, kind], i) => {
    const col = i % 8, row = Math.floor(i / 8);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.13), new THREE.MeshStandardMaterial({ map: photoTex(300 + i, place, year, kind), roughness: 0.6 }));
    m.position.set(cx - 6.1 + col * 1.74, y + 2.9 - row * 1.5, z + 0.17); m.rotation.z = rand(-0.06, 0.06); scene.add(m);
  });
  const lines = new THREE.BufferGeometry(), pts = [];
  for (let i = 0; i < 15; i++) { const a = [cx - 6.1 + (i % 8) * 1.74, y + 2.9 - Math.floor(i / 8) * 1.5, z + 0.19], b = [cx - 6.1 + ((i + 1) % 8) * 1.74, y + 2.9 - Math.floor((i + 1) / 8) * 1.5, z + 0.19]; pts.push(...a, ...b); }
  lines.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); scene.add(new THREE.LineSegments(lines, new THREE.LineBasicMaterial({ color: 0xd02a20 })));
  I4.wall = new V3(cx, y + 1.3, z + 2.5); I4.wallLook = new V3(cx, y + 2.2, z);
}

function islandTroops(n, at, o) {
  const eo = Object.assign({ group: 'isl', color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true }, o || {});
  new Heli(at.x + rand(-300, 300), 90, at.z - 500, { drop: true, troops: n, landAt: at.clone(), group: eo.group, enemyOpt: eo, types: ['rifle', 'rifle', 'shotgun', 'heavy'] });
}
const LINES4 = {
  intro: [['EVAN', '(coughing) ...Where am I?', 2.4], ['EVAN', 'No gun. No radio. No idea how long I was out.', 3.2]],
  armed: [['EVAN', 'Blackline sentries on a tropical island. Of course.', 3]],
  labA: [['EVAN', 'Memory chairs. They\'ve been doing this to people.', 2.8], ['EVAN', '"Be gentle with him this time." M.R.', 2.8]],
  photos: [['EVAN', 'That\'s me. That\'s... all me.', 2.6], ['EVAN', 'Seventeen years. I remember three.', 3]],
  chamber: [['MAYA', '(recording) If you\'re hearing this, Evan, you found the chamber again. You always do.', 4.6], ['MAYA', '(recording) The Blackline doesn\'t predict the future. It repeats it. And Kade makes you pull the switch.', 5.2], ['MAYA', '(recording) I played his villain so he would let you live. Every cycle. I\'m sorry.', 4.6], ['MAYA', '(recording) Headquarters. The last hour. End it — or end me.', 3.8]],
  sweep: [['SILAS', '(radio) Kestrel team, this is Kade. Cross is alive and on the island. Sweep the compound.', 4.4], ['EVAN', 'You should have checked the water, Kade.', 2.4]],
  tower: [['EVAN', 'The whole world got that message three years ago. Let\'s give them the rest of it.', 4]],
  hold: [['EVAN', 'Upload running. They\'re sending everything they have.', 3], ['SILAS', '(radio) Stop that broadcast, Cross, and I\'ll tell you where she is.', 3.6], ['EVAN', 'I already know where she is.', 2.2]],
  silas: [['SILAS', '(in person) You always find the wall, Mister Cross. And I always paint over it.', 4], ['EVAN', 'Not this time.', 1.6], ['SILAS', '(in person) That\'s what you said last time.', 2.4]],
  taunt1: [['SILAS', '(in person) I made you! Every war you ever won, I wrote first!', 3.6]],
  taunt2: [['SILAS', '(in person) She chose you over the world, you know. Seven times. It disgusted me.', 4.2]],
  down: [['SILAS', '(in person) ...Go on, then. You were always the trigger. Never the hand.', 4]],
  spare: [['EVAN', 'You don\'t get to die tonight, Kade. You get to watch.', 3.2], ['SILAS', '(in person) Mercy. Every cycle. That\'s why you lose.', 3]],
  kill: [['EVAN', 'This is for Glass Harbor.', 2.2], ['SILAS', '(in person) ...So you do remember.', 2.4]],
  boat: [['EVAN', 'Gunboat at the east dock. Time to end the last hour.', 3]]
};
/* ---------- shared island level ---------- */
const ISLAND_BASE = {
  env: { grade: { lift: [0.0, 0.01, 0.015], gain: [1.02, 1.02, 0.98], sat: 1.1, contrast: 1.06, vig: 0.28, bloom: 0.5, threshold: 2.8 }, clouds: 0.7, cloudCol: 0xffffff, sky: [0x2f6fb8, 0x8ec8ea, 0xd0e8ee], fog: [0xc4e0ea, 160, 1150], sunDir: new V3(0.45, 0.72, 0.35), sunCol: 0xfff0d8, sunI: 2.6, sunGlow: 0xfff0c0, hemi: [0xbfe0ff, 0x4a6a30, 0.55], amb: [0x506070, 0.18], exposure: 1.02, fixtures: 6, shadowSize: 80, groundCol: 0x4a6a30, vmHemi: 0xe0f0ff, vmI: 0.9, vmSun: 0xfff0d8, vmSunI: 1.8 },
  h: islandH, waterLevel: 0, bounds: 900,
  blocked(x, z) { if (x > I4.dock.x - 32 && x < I4.dock.x + 12 && z > I4.dock.z - 3.5 && z < I4.dock.z + 3.5) return false; return islandH(x, z) < -1.3; },
  build() { buildIsland(); },
  menuFocus: new V3(20, 0, 100),
  menuCam(t) { const a = t * 1.2; return { pos: new V3(Math.cos(a) * 420, 60, Math.sin(a) * 380), look: new V3(20, 10, -20) }; },
  radar(c, tr, px, pz) {
    c.fillStyle = 'rgba(160,210,140,0.12)'; c.beginPath(); for (let a = 0; a <= TAU + 0.01; a += 0.2) { const [x, y] = tr(Math.cos(a) * 420, Math.sin(a) * 420 / 1.15); a === 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.fill();
    c.strokeStyle = 'rgba(210,180,130,0.35)'; c.lineWidth = 3; for (const [x0, z0, x1, z1] of [[20, 330, 20, 48], [60, -40, 120, -135], [78, -10, 370, -10]]) { c.beginPath(); c.moveTo(...tr(x0, z0)); c.lineTo(...tr(x1, z1)); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 1; const C = I4.comp; const p = [tr(C.x - 58, C.z - 55), tr(C.x + 58, C.z - 55), tr(C.x + 58, C.z + 55), tr(C.x - 58, C.z + 55)]; c.beginPath(); c.moveTo(...p[0]); for (const q of p.slice(1)) c.lineTo(...q); c.closePath(); c.stroke();
  },
  tick(dt) { if (I4.beacon) I4.beacon.visible = Math.sin(realTime * 3) > 0; if (I4.cyl) I4.cyl.rotation.y += dt; }
};
const ISL_O = { color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true };
function islandPickups() {
  const C = I4.comp, y = I4H, T = I4.tower, th = islandH(T.x, T.z);
  pickups.push(new Pickup('weapon', new V3(C.x - 40, y + 0.9, C.z + 30), { weapon: 'ar', table: true }));
  pickups.push(new Pickup('weapon', new V3(C.x - 40, y + 0.9, C.z + 26), { weapon: 'shotgun', table: true }));
  pickups.push(new Pickup('armor', new V3(C.x - 38, y, C.z + 12))); pickups.push(new Pickup('grenades', new V3(C.x - 36, y, C.z + 12)));
  pickups.push(new Pickup('jack', new V3(C.x + 30, y, C.z + 26))); pickups.push(new Pickup('health', new V3(C.x + 24, y, C.z - 32)));
  pickups.push(new Pickup('weapon', new V3(T.x + 9, th + 3.1, T.z + 2), { weapon: 'rocket' })); pickups.push(new Pickup('ammo', new V3(T.x - 6, th, T.z + 6))); pickups.push(new Pickup('ammo', new V3(T.x + 5, th, T.z - 8))); pickups.push(new Pickup('armor', new V3(T.x - 4, th, T.z - 5)));
  pickups.push(new Pickup('weapon', new V3(T.x + 12, th + 3.1, T.z + 4), { weapon: 'sniper' }));
  pickups.push(new Pickup('weapon', new V3(C.x - 40, y + 0.9, C.z + 22), { weapon: 'sniper', table: true }));
  pickups.push(new Pickup('jack', new V3(C.x - 20, y, C.z - 10))); pickups.push(new Pickup('jack', new V3(T.x - 7, th, T.z - 2)));
  for (const [x, z] of [[C.x + 4, C.z + 20], [C.x - 20, C.z - 8], [C.x + 36, C.z + 2]]) spawnBarrel(x, z, y);
}

/* ---------- CHAPTER 5 — THE ISLAND ---------- */
LEVELS[7] = Object.assign({}, ISLAND_BASE, {
  id: 7, name: 'MISSION 5 — THE ISLAND', chapter: 'CHAPTER 5', title: 'THE ISLAND', sub: 'KESTREL ISLAND · SOUTH PACIFIC · 07:20',
  tips: ['Sneak up on an unaware sentry and punch: it is a silent takedown.', 'Deep water is impassable — follow the dirt paths.'],
  cpStep: [0, 2],
  reset(cp) {
    const C = I4.comp, y = I4H, o = ISL_O;
    if (cp === 0) {
      addEnemy('rifle', -30, beachZ(-30) - 12, Object.assign({ group: 'beach', patrol: [[-30, beachZ(-30) - 12], [0, beachZ(0) - 20], [-60, beachZ(-60) - 12]] }, o));
      addEnemy('rifle', 80, beachZ(80) - 16, Object.assign({ group: 'beach', patrol: [[80, beachZ(80) - 16], [60, beachZ(60) - 30], [100, beachZ(100) - 16]] }, o));
      addEnemy('shotgun', 22, 230, Object.assign({ group: 'path', patrol: [[22, 230], [18, 160]] }, o));
      addEnemy('rifle', 16, 140, Object.assign({ group: 'path', patrol: [[16, 140], [26, 90]] }, o));
      const bz = beachZ(44) - 4;
      pickups.push(new Pickup('weapon', new V3(42, islandH(42, bz) + 0.3, bz), { weapon: 'pistol' }));
      pickups.push(new Pickup('weapon', new V3(47, islandH(47, bz - 1) + 0.3, bz - 1), { weapon: 'smg' }));
      pickups.push(new Pickup('ammo', new V3(39, islandH(39, bz - 1), bz - 1)));
      pickups.push(new Pickup('jack', new V3(36, islandH(36, bz - 2), bz - 2)));
      I4.weaponAt = new V3(44, islandH(44, bz) + 1.5, bz);
    }
    for (const [x, z, t] of [[C.x, C.z + 44, 'rifle'], [C.x - 12, C.z + 30, 'rifle'], [C.x + 12, C.z + 2, 'heavy'], [C.x - 30, C.z - 4, 'shotgun'], [C.x + 40, C.z - 20, 'rifle'], [C.x - 36, C.z + 20, 'rifle'], [C.x + 22, C.z + 20, 'rifle'], [C.x - 30, C.z - 30, 'shotgun']]) addEnemy(t, x, z, Object.assign({ group: 'comp', y, patrol: [[x, z], [x + rand(-8, 8), z + rand(-8, 8)]] }, o));
    addEnemy('sniper', C.x + 48, C.z - 10, Object.assign({ group: 'comp', y: y + 13, static: true, yaw: 0 }, o));
    islandPickups();
    new Interact(I4.labATerm, 'Read the experiment log', () => { Mission.flags.labA = true; showLore('LAB A — PROCEDURE LOG', 'PROCEDURE: EPISODIC REVISION (CYCLE 7)\nSUBJECT 0007 responded well. Procedural memory intact.\nFlight, weapons, languages: retained.\nPeople, places, reasons: <b>removed</b>.\n\nHandler note (M.R.): <i>Be gentle with him this time.</i>\nDirector note (S.K.): <i>Gentle is how we got here. Full wipe.</i>'); HUD.say(LINES4.labA); });
    new Interact(I4.wall, 'Examine the photographs', () => photoCine(), { range: 3.5, enabled: () => Mission.cur().id === 'photos' });
    const sp = [[22, beachZ(22) - 6, 0.15], [C.x, C.z + 46, 0]][cp] || [C.x, C.z + 46, 0];
    return { spawn: sp, y: islandH(sp[0], sp[1]), unarmed: cp === 0, loadout: ['pistol', 'smg'], cur: 'smg', armor: 0 };
  },
  steps: [
    { id: 'weapon', cp: 0, text: 'You\'re unarmed — find a weapon near the wrecked boat', marker: () => I4.weaponAt || new V3(44, 3, 330),
      enter() { after(1, () => HUD.say(LINES4.intro)); after(3, () => HUD.hint('Unarmed: LEFT CLICK punches · punch an unaware enemy for a silent takedown', 7)); },
      update() {
        if (!SLOTS.some(s => inv[s])) return false;
        if (applyCarry()) { HUD.notify('YOUR GEAR WASHED ASHORE', 'Every weapon you were carrying is back', 'obj'); showVM(cur); }
        return true;
      } },
    { id: 'compound', text: 'Follow the path inland to the research compound', marker: () => new V3(20, I4H + 3, 45),
      enter() { HUD.say(LINES4.armed); if (Store.get('golden', false)) giveWeapon('golden', true); HUD.slots(); },
      update() { return Math.hypot(player.pos.x - 20, player.pos.z - 45) < 14; } },
    { id: 'labA', cp: 1, text: 'Search Lab A (east building)', marker: () => I4.labATerm.clone().setY(I4H + 2.2), update() { return !!Mission.flags.labA; } },
    { id: 'photos', text: 'Search Lab B (west building)', marker: () => I4.wall.clone().setY(I4H + 2.5), update() { return !!Mission.flags.photosDone && gameTime - Mission.flags.photosDone > 6; } }
  ],
  intro: {
    lines: [[0, 'THE PACIFIC SPITS HIM OUT ON A BEACH THAT ISN\'T ON ANY MAP.', ''], [4200, 'NO WEAPONS. NO COMMUNICATION.', ''], [7400, 'NO IDEA HOW LONG HE HAS BEEN UNCONSCIOUS.', 'small']],
    dur: 10500,
    fly(eye, look) { return [{ t: 0, pos: new V3(20, 3, 440), look: eye.clone() }, { t: 4, pos: eye.clone().add(new V3(3, 2, 8)), look: eye.clone() }, { t: 6, pos: eye.clone(), look: look.clone() }]; }
  },
  complete() {
    achieve('ch4', 'Seventeen Years', 'Chapter 5 complete');
    showEnding({
      lines: [[400, 'Pinned beneath the last photograph is an index card. The handwriting is Maya\'s.'], [3600, '<i>"You always find the wall. Now remember the day before it."</i>'], [7200, '<span class="ev">EVAN</span> The day before...'], [9600, 'The chair in Lab A is still warm. He sits down in it.'], [12600, 'And for the first time in three years, he remembers something.']],
      cardAt: 15500, chapter: 'END OF CHAPTER 5', title: 'THE ISLAND', next: 8, tease: 'NEXT — FLASHBACK: THE LAST GOOD DAY · THREE YEARS AGO'
    });
  }
});

/* ---------- CHAPTER 6 — THE LAST HOUR ---------- */
LEVELS[9] = Object.assign({}, ISLAND_BASE, {
  id: 9, name: 'MISSION 6 — THE LAST HOUR', chapter: 'CHAPTER 6', title: 'THE LAST HOUR', sub: 'KESTREL ISLAND · 16:40 · THE CYCLE CHAMBER',
  env: Object.assign({}, ISLAND_BASE.env, { sunDir: new V3(-0.6, 0.32, 0.4), sunCol: 0xffd2a0, sunI: 2.3, sky: [0x2a5a9a, 0xe0a070, 0xf0c8a0], fog: [0xe8c8a8, 150, 1100], grade: { lift: [0.01, 0.005, 0.0], gain: [1.05, 1.0, 0.94], sat: 1.05, contrast: 1.08, vig: 0.32, bloom: 0.6, threshold: 2.4 } }),
  tips: ['Silas dashes when you hurt him — keep moving and watch for his grenades.', 'Dropships unload troops on the ground; rockets bring them down before they land.', 'Stay within 30 m of the tower or the broadcast stops.'],
  cpStep: [0, 2, 4, 5],
  reset(cp) {
    const C = I4.comp, y = I4H, o = ISL_O;
    if (cp === 0) for (const [x, z, t] of [[C.x + 10, C.z - 20, 'rifle'], [C.x + 40, C.z - 18, 'rifle'], [C.x + 30, C.z - 6, 'shotgun'], [C.x + 14, C.z + 4, 'heavy'], [C.x - 4, C.z - 30, 'rifle']]) addEnemy(t, x, z, Object.assign({ group: 'sweep', y, patrol: [[x, z], [x + rand(-8, 8), z + rand(-8, 8)]] }, o));
    islandPickups();
    new Interact(I4.chamber, 'Access the Cycle Chamber', () => { Mission.flags.chamber = true; showLore('CYCLE CHAMBER — STATUS', 'BLACKLINE IS NOT A PREDICTION ENGINE.\nIT IS A <b>RESET</b>.\n\nCYCLE ............ 7\nTHRESHOLD ........ GLOBAL CONFLICT (IMMINENT)\nACTION ........... ROLL BACK TO 11:59, RE-SEED, REPEAT\nRESET OPERATOR ... <b>CROSS, EVAN</b>\nDIRECTOR ......... <b>KADE, SILAS</b>\n\n>> PLAYING RECORDED MESSAGE (M. REYES)', 16); HUD.say(LINES4.chamber); }, { enabled: () => Mission.cur().id === 'truth' });
    new Interact(I4.console, 'Broadcast the Blackline archive', () => { Mission.flags.upload = true; AudioSys.ui('radio'); }, { range: 3, enabled: () => Mission.cur().id === 'tower' || Mission.cur().id === 'hold' });
    new Interact(I4.boatPos, 'Steal the gunboat', () => { Mission.flags.boat = true; }, { range: 5, enabled: () => Mission.cur().id === 'boat' });
    I4.silas = null;
    const T = I4.tower;
    const sp = [[C.x - 18, C.z - 12, -Math.PI / 2 - 0.6], [T.x - 10, T.z + 14, -0.6], [T.x - 8, T.z + 16, -0.6], [I4.dock.x - 60, I4.dock.z, -Math.PI / 2]][cp];
    return { spawn: sp, y: islandH(sp[0], sp[1]), loadout: ['pistol', 'smg', 'ar'], cur: 'ar', armor: 50 };
  },
  steps: [
    { id: 'truth', cp: 0, text: 'Find the Cycle Chamber (south-east bunker)', marker: () => I4.chamber.clone().setY(I4H + 2.2),
      enter() { after(2, () => HUD.say(LINES4.sweep)); },
      update() { if (Mission.flags.chamber && !Mission.flags.chT) Mission.flags.chT = gameTime; return Mission.flags.chT && gameTime - Mission.flags.chT > 18; } },
    { id: 'tower', text: 'Reach the radio tower on the hill and broadcast the archive', marker: () => I4.console.clone().setY(I4.console.y + 1.5),
      enter() { hideLore(); HUD.say(LINES4.tower); islandTroops(4, new V3(I4.comp.x, I4H, I4.comp.z + 20)); after(8, () => new Heli(I4.tower.x - 200, 80, I4.tower.z - 200, { r: 55 })); },
      update() { return !!Mission.flags.upload; } },
    { id: 'hold', cp: 1, text: 'Hold the radio tower until the broadcast completes', marker: () => I4.console.clone().setY(I4.console.y + 1.5),
      enter() { HUD.say(LINES4.hold); Mission.flags.prog = 0; Mission.flags.nw = 0.1; },
      update(dt) {
        const near = Math.hypot(player.pos.x - I4.tower.x, player.pos.z - I4.tower.z) < 30;
        if (near) Mission.flags.prog = Math.min(1, Mission.flags.prog + dt / 75);
        $('obj-sub').textContent = (near ? 'Broadcasting… ' : 'Out of range! ') + Math.round(Mission.flags.prog * 100) + '%';
        if (Mission.flags.prog >= Mission.flags.nw && Mission.flags.nw < 0.85) {
          const a = rand(0, TAU); islandTroops(Mission.flags.nw > 0.5 ? 6 : 5, new V3(I4.tower.x + Math.cos(a) * 32, 0, I4.tower.z + Math.sin(a) * 32));
          if (Mission.flags.nw > 0.3 && Mission.flags.nw < 0.5) new Heli(I4.tower.x + 200, 80, I4.tower.z + 150, { r: 50 });
          Mission.flags.nw += 0.25;
        }
        return Mission.flags.prog >= 1;
      } },
    { id: 'kade', text: 'Silas Kade has come for you himself', marker: () => I4.silas && !I4.silas.defeated ? I4.silas.pos.clone().setY(I4.silas.pos.y + 3) : null, silent: true,
      enter() { HUD.notify('BROADCAST COMPLETE', 'Every agency on Earth just got the rest of the message', 'obj'); const T = I4.tower; scriptedHeli(new V3(T.x + 260, 90, T.z - 200), new V3(T.x + 30, islandH(T.x + 30, T.z - 24) + 16, T.z - 24), { speed: 40 }); after(7, () => Mission.go(Mission.step + 1)); },
      update() { return false; } },
    { id: 'silas', cp: 2, text: 'Defeat Silas Kade', marker: () => I4.silas && !I4.silas.defeated ? I4.silas.pos.clone().setY(I4.silas.pos.y + 3) : null,
      enter() { spawnSilas(); },
      update() {
        if (!Mission.flags.bossDown && (!I4.silas || I4.silas.disposed || !I4.silas.alive)) spawnSilas();
        if (Mission.flags.bossDown && !Mission.flags.asked && gameTime - Mission.flags.bossDown > 4.5) { Mission.flags.asked = true; silasChoice(); }
        return !!Mission.flags.judged && gameTime - Mission.flags.judged > 6;
      } },
    { id: 'boat', cp: 3, text: 'Steal the gunboat at the east dock', marker: () => I4.boatPos.clone().setY(3),
      enter() { HUD.say(LINES4.boat); islandTroops(4, new V3(I4.dock.x - 60, 0, I4.dock.z + 20)); },
      update() { return !!Mission.flags.boat; } }
  ],
  intro: {
    lines: [[0, 'HE REMEMBERS THE DOCK. THE CHAIR. HER VOICE.', ''], [3800, 'HE REMEMBERS WHO SIGNED THE ORDER.', ''], [7200, 'ONE HOUR UNTIL THE NEXT RESET.', 'big']],
    dur: 10500,
    fly(eye, look) { return [{ t: 0, pos: new V3(I4.comp.x + 40, I4H + 30, I4.comp.z - 60), look: eye.clone() }, { t: 4, pos: eye.clone().add(new V3(4, 3, 6)), look: eye.clone() }, { t: 6, pos: eye.clone(), look: look.clone() }]; }
  },
  complete() {
    storyChoice({ title: 'HOW DOES THE LAST HOUR BEGIN?', text: 'Blackline headquarters sits behind a wall, a gate and three autocannon turrets. Maya once told you every building has a back door.',
      a: ['GO IN LOUD', 'Take the APC straight through the main gate. Turrets, snipers, everything.'], b: ['GO IN QUIET', 'Come in by sea through the drainage tunnel. Fewer guards, no armor.'] }, k => {
      state = 'end'; Story.set('approach', k === 'a' ? 'loud' : 'quiet');
      achieve('hour', 'Judge', 'Chapter 6 complete');
      const spared = Story.get('silas', 'killed') === 'spared';
      showEnding({
        lines: [[400, 'The gunboat cuts east. Behind it, Kestrel Island burns.'], [3200, 'Every intelligence agency on Earth receives a second encrypted message. This time it doesn\'t disappear.'],
          [7000, spared ? 'On the dock, Silas Kade watches him go, wrists zip-tied, smiling like a man who has seen this before.' : 'On the hill, Silas Kade lies where he fell. The radio on his belt keeps asking for orders.'],
          [10600, '<span class="ev">EVAN</span> ' + (k === 'a' ? 'Front door, Maya. The way you hate it.' : 'Back door, Maya. The way you taught me.')], [13400, '<span class="ev">EVAN</span> I\'m coming to end it.']],
        cardAt: 16000, chapter: 'END OF CHAPTER 6', title: 'THE LAST HOUR', next: 10, tease: 'NEXT — CHAPTER 7: 11:59'
      });
    });
  }
});
function spawnSilas() {
  const T = I4.tower, x = T.x + 18, z = T.z - 14;
  const s = new Duelist(x, z, { hp: 1800, y: islandH(x, z), arena: { x: T.x, z: T.z, r: 26 }, taunts: [LINES4.taunt1, LINES4.taunt2], onDefeat: () => HUD.say(LINES4.down) });
  enemies.push(s); I4.silas = s;
  for (let i = 0; i < 3; i++) { const a = rand(0, TAU); addEnemy(pick(['rifle', 'shotgun']), x + Math.cos(a) * 10, z + Math.sin(a) * 10, Object.assign({ group: 'boss', combat: true }, ISL_O)); }
  HUD.say(LINES4.silas); AudioSys.combatTarget = 1;
}
function silasChoice() {
  storyChoice({ title: 'SILAS KADE', text: 'Seventeen years. Seven resets. Every war you fought, he wrote first. He is on his knees in the dirt, and the rifle in your hands is the only thing he ever really built.',
    a: ['SPARE HIM', 'Leave him alive for the world to judge. He has been wrong about you before.'], b: ['EXECUTE HIM', 'End him here. No more cycles for Silas Kade.'] }, k => {
    resumePlay(); Mission.flags.judged = gameTime;
    const s = I4.silas;
    if (k === 'a') { Story.set('silas', 'spared'); achieve('mercy', 'Mercy', 'You spared Silas Kade'); HUD.say(LINES4.spare); if (s) s.hideBar = true; }
    else {
      Story.set('silas', 'killed'); HUD.say(LINES4.kill);
      after(2.6, () => { AudioSys.shot(cur === 'golden' ? 'golden' : 'pistol', null); addShake(0.3); if (s && s.alive) { s.defeated = false; s.noShoot = true; Enemy.prototype.die.call(s, player.pos.clone().sub(s.pos).normalize().negate(), true, 'none'); } });
    }
  });
}
function photoCine() {
  if (Mission.flags.photosDone || Cine.active) return;
  const L = I4.wallLook, st = L.clone().add(new V3(-7, 0.4, 3)), en = L.clone().add(new V3(7, 0.2, 3));
  HUD.say(LINES4.photos);
  Cine.play([{ t: 0, pos: st, look: L.clone().add(new V3(-6, 0.4, 0)) }, { t: 5, pos: L.clone().add(new V3(0, 0.3, 2.2)), look: L.clone() }, { t: 9, pos: en, look: L.clone().add(new V3(6, -0.6, 0)) }, { t: 11, pos: L.clone().add(new V3(0, -0.6, 4)), look: L.clone() }], () => {
    Mission.flags.photosDone = gameTime;
    showLore('PHOTOGRAPHS — 16 FOUND', '2009 · 2010 · 2011 · 2012 · 2013 · 2014 · 2015 · 2016\n2017 · 2018 · 2019 · 2020 · 2021 · 2022 · 2023 · <b>TOMORROW</b>\n\nDifferent countries. Different wars. Same man.\n\n<b>SEVENTEEN YEARS. HE REMEMBERS THREE.</b>', 10);
  });
}
