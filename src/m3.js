/* ============================================================
   CHAPTER 3 — BURN THE CITY  (city → airport → sky)
   Drive through a city under air attack, detour around a
   collapse, fight through the airport, steal a fighter, dogfight,
   and meet Maya's real agenda at 3,000 feet.
   ============================================================ */
const C3 = { roads: [-360, -270, -180, -90, 0, 90, 180, 270, 360], RW: 9, collapsible: [], hangar: new V3(40, 0, -522) };
function cityH(x, z) { return x > 470 ? -Math.min(25, (x - 470) * 0.6) : 0; }
function cityOnRoad(x, z) {
  if (z < -414) return true;
  for (const r of C3.roads) { if (Math.abs(x - r) < C3.RW) return true; if (Math.abs(z - r) < C3.RW) return true; }
  return false;
}
function buildCity() {
  WORLD = 2800;
  const rnd = mulberry(4242);
  // ground, roads, sidewalks
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 900).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.95, map: TEX.sand2 })); ground.position.set(20, 0, -20); ground.receiveShadow = true; scene.add(ground); TEX.sand2.wrapS = TEX.sand2.wrapT = THREE.RepeatWrapping; TEX.sand2.repeat.set(120, 120);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3b3a30, roughness: 1 })); outer.position.set(-2530, -0.05, 0); scene.add(outer);
  const seabed = new THREE.Mesh(new THREE.PlaneGeometry(4000, 6000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1a2a2a, roughness: 1 })); seabed.position.set(2500, -25, 0); scene.add(seabed);
  buildWater(0, 5000, 2970, 0);
  const rm = M.cityRoad; TEX.cityRoad.wrapS = TEX.cityRoad.wrapT = THREE.RepeatWrapping;
  for (const r of C3.roads) { floorPlane(r - C3.RW, -414, r + C3.RW, 414, 0.02, rm, 8); floorPlane(-414, r - C3.RW, 414, r + C3.RW, 0.025, rm, 8); }
  // lane dashes (instanced)
  const dash = new THREE.InstancedMesh(B(0.25, 0.02, 3), M.line, 2000), mtx = new THREE.Matrix4(); let di = 0;
  for (const r of C3.roads) for (let t = -410; t < 410; t += 10) { if (C3.roads.some(q => Math.abs(t - q) < C3.RW + 1)) continue; if (di < 1998) { mtx.makeTranslation(r, 0.05, t); dash.setMatrixAt(di++, mtx); mtx.makeRotationY(Math.PI / 2).setPosition(t, 0.05, r); dash.setMatrixAt(di++, mtx); } }
  dash.count = di; scene.add(dash);
  // blocks: sidewalk + buildings
  const bmat = M.building;
  for (let i = 0; i < C3.roads.length - 1; i++) for (let j = 0; j < C3.roads.length - 1; j++) {
    const x0 = C3.roads[i] + C3.RW, x1 = C3.roads[i + 1] - C3.RW, z0 = C3.roads[j] + C3.RW, z1 = C3.roads[j + 1] - C3.RW;
    const sw = new THREE.Mesh(tiledBoxGeo(x1 - x0, 0.18, z1 - z0, 3), M.sidewalk); sw.position.set((x0 + x1) / 2, 0.09, (z0 + z1) / 2); sw.receiveShadow = true; scene.add(sw);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, dist = Math.hypot(cx, cz), park = rnd() < 0.1 && dist > 100;
    if (C3.skip && C3.skip(cx, cz)) continue;
    if (park) { for (let k = 0; k < 10; k++) { const tx = x0 + 6 + rnd() * (x1 - x0 - 12), tz = z0 + 6 + rnd() * (z1 - z0 - 12); solid(0.4, 3, 0.4, M.pole, tx, 0, tz, { cover: false }); const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), new THREE.MeshStandardMaterial({ color: 0x2e3a22, flatShading: true })); crown.position.set(tx, 4.5, tz); crown.castShadow = true; scene.add(crown); } continue; }
    const split = rnd() < 0.55 ? 2 : 1, inset = 4;
    for (let a = 0; a < split; a++) for (let b = 0; b < split; b++) {
      const lw = (x1 - x0 - inset * 2) / split, ld = (z1 - z0 - inset * 2) / split;
      const bx = x0 + inset + lw * (a + 0.5), bz = z0 + inset + ld * (b + 0.5), w = lw - 3 - rnd() * 6, d = ld - 3 - rnd() * 6;
      const h = 14 + rnd() * (70 - Math.min(55, dist * 0.12)) + (dist < 200 ? rnd() * 40 : 0);
      const m = solid(w, h, d, bmat, bx, 0.18, bz, { tile: 8, cover: true, shadow: true });
      const roof = new THREE.Mesh(B(w * 0.3, 2.2, d * 0.3), M.darkMetal); roof.position.set(bx + rnd() * 4, h + 1.3, bz); scene.add(roof);
      if (Math.abs(bx) < 60 && bz > -330 && bz < 300) C3.collapsible.push({ mesh: m, col: m.userData.col, x: bx, z: bz, h, w, d, roof, y0: m.position.y, maxY: m.userData.col.box.max.y });
    }
  }
  // streetlights along avenues (instanced poles + light fixtures near the player)
  const poles = [], heads = [];
  for (const r of C3.roads) for (let t = -400; t <= 400; t += 36) { if (C3.roads.some(q => Math.abs(t - q) < 14)) continue; poles.push([r + C3.RW + 1.2, t]); poles.push([r - C3.RW - 1.2, t + 18]); }
  const pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 7, 6), M.metal, poles.length), hm = new THREE.InstancedMesh(B(0.8, 0.2, 0.4), M.lamp, poles.length);
  poles.forEach(([x, z], i) => { mtx.makeTranslation(x, 3.5, z); pm.setMatrixAt(i, mtx); mtx.makeTranslation(x, 7, z); hm.setMatrixAt(i, mtx); Fixtures.add(new V3(x, 6.6, z), 0xffc27a, 1.6, 26, 0); });
  scene.add(pm, hm);
  // airport
  buildAirport(rnd);
  // burning skyline: fires on some rooftops
  C3.roofFires = [];
  for (let k = 0; k < 14; k++) { const b = pick(C3.collapsible.length ? C3.collapsible : []); if (b) C3.roofFires.push(new V3(b.x, b.h + 0.5, b.z)); }
}
function buildAirport(rnd) {
  const tar = new THREE.Mesh(new THREE.PlaneGeometry(900, 360).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5a5a58, roughness: 0.95, map: TEX.floor })); tar.position.set(20, 0.01, -594); scene.add(tar); tar.receiveShadow = true;
  floorPlane(-380, -645, 440, -595, 0.03, M.cityRoad, 10);
  const lm = new THREE.InstancedMesh(B(14, 0.02, 1.2), M.lineW, 60), mtx = new THREE.Matrix4(); let k = 0;
  for (let x = -350; x < 420; x += 28) { mtx.makeTranslation(x, 0.06, -620); lm.setMatrixAt(k++, mtx); }
  for (let i = 0; i < 8; i++) { mtx.makeRotationY(Math.PI / 2).setPosition(-366, 0.06, -640 + i * 5.6); lm.setMatrixAt(k++, mtx); }
  lm.count = k; scene.add(lm);
  // fence with gate at x=0
  for (const [a, b] of [[-420, -12], [12, 460]]) { for (let x = a; x <= b; x += 6) solid(0.12, 3, 0.12, M.metal, x, 0, -414, { col: false, shadow: false }); const f = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 3), new THREE.MeshBasicMaterial({ color: 0x9aa0a6, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })); f.position.set((a + b) / 2, 1.5, -414); scene.add(f); addBoxCollider(new V3(a, 0, -414.2), new V3(b, 3, -413.8)); }
  // hangars (open to the north / runway)
  C3.hangars = [];
  for (const hx of [-180, -80, 40, 160]) {
    const zc = -522, W = 44, D = 36;
    wall(hx - W / 2, zc + D / 2, hx + W / 2, zc + D / 2, { h: 14, mat: M.wallDark, t: 0.6 });
    wall(hx - W / 2, zc - D / 2, hx - W / 2, zc + D / 2, { h: 14, mat: M.wallDark, t: 0.6 }); wall(hx + W / 2, zc - D / 2, hx + W / 2, zc + D / 2, { h: 14, mat: M.wallDark, t: 0.6 });
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, D, 24, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4a4e52, roughness: 0.7, metalness: 0.4, side: THREE.DoubleSide }));
    roof.scale.set(1, 0.45, 1); roof.position.set(hx, 14, zc); scene.add(roof);
    floorPlane(hx - W / 2, zc - D / 2, hx + W / 2, zc + D / 2, 0.04, M.floor, 6);
    for (const dz of [-10, 5]) lightPanel(hx, 13.5, zc + dz, { i: 1.8, dist: 30, w: 4, d: 1 });
    sign('HANGAR ' + (C3.hangars.length + 1), hx, 16.5, zc - D / 2 - 0.2, Math.PI, { w: 6, fg: '#ffffff', bg: '#2a2e33' });
    C3.hangars.push(new V3(hx, 0, zc));
  }
  // terminal + tower
  solid(100, 16, 40, M.building, -290, 0, -450, { tile: 8, cover: true });
  const tw = new THREE.Group(); part(tw, new THREE.CylinderGeometry(3, 4, 40, 12), M.concrete, 0, 20, 0); part(tw, new THREE.CylinderGeometry(7, 5, 6, 12), M.glassB, 0, 43, 0); part(tw, new THREE.CylinderGeometry(7.5, 7.5, 1, 12), M.darkMetal, 0, 46.5, 0);
  tw.position.set(270, 0, -470); scene.add(tw); addBoxCollider(new V3(266, 0, -474), new V3(274, 40, -466));
  // parked airliners (static set dressing)
  for (const [x, z, ry] of [[-300, -540, 0.2], [300, -540, -0.3]]) {
    const g = new THREE.Group(); part(g, new THREE.CylinderGeometry(2.6, 2.6, 36, 14).rotateX(Math.PI / 2), M.concrete, 0, 4, 0); part(g, new THREE.ConeGeometry(2.6, 6, 14).rotateX(Math.PI / 2), M.concrete, 0, 4, 21);
    part(g, B(38, 0.5, 6), M.metal, 0, 3.4, 1); part(g, B(12, 0.4, 3), M.metal, 0, 5, -16); part(g, B(0.4, 7, 4), M.metal, 0, 8, -16);
    g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); colliderFromObject(g.children[0], 0, { cover: true });
  }
  // cover on the apron
  for (let i = 0; i < 18; i++) { const x = -250 + rnd() * 480, z = -430 - rnd() * 70; if (Math.abs(x) < 16) continue; crate(x, 0, z, 1.3, rnd() * 3); }
}

/* ---------------- dynamic population ---------------- */
function laneFn(car, dt) {
  const ai = car.ai;
  const tx = ai.axis === 'z' ? ai.lane : car.pos.x + ai.dir * 30, tz = ai.axis === 'z' ? car.pos.z + ai.dir * 30 : ai.lane;
  const st = clamp(angDiff(car.yaw, yawTo(car.pos.x, car.pos.z, tx, tz)) * 2.5, -1, 1);
  // brake for anything ahead
  let want = ai.speed;
  for (const o of cars) { if (o === car || o.dead) continue; const dx = o.pos.x - car.pos.x, dz = o.pos.z - car.pos.z, ahead = dx * car.fwdX + dz * car.fwdZ, side = Math.abs(dx * car.fwdZ - dz * car.fwdX); if (ahead > 0 && ahead < 14 && side < 2.6) { want = Math.min(want, ahead < 7 ? 0 : 6); } }
  if (!player.inVehicle) { const dx = player.pos.x - car.pos.x, dz = player.pos.z - car.pos.z, ahead = dx * car.fwdX + dz * car.fwdZ, side = Math.abs(dx * car.fwdZ - dz * car.fwdX); if (ahead > 0 && ahead < 12 && side < 2.2) want = 0; }
  car.control(dt, car.speed < want ? 1 : (car.speed > want + 2 ? -0.8 : 0), st, want === 0);
  // recycle far-away traffic ahead of the player
  if (car.pos.distanceTo(player.pos) > 260 || Math.abs(car.pos.x) > 420 || car.pos.z > 420 || car.pos.z < -414) placeTraffic(car);
}
function placeTraffic(car) {
  const p = player.inVehicle ? player.inVehicle.pos : player.pos;
  for (let tries = 0; tries < 12; tries++) {
    const axis = Math.random() < 0.6 ? 'z' : 'x', road = C3.roads.reduce((b, r) => Math.abs(r - (axis === 'z' ? p.x : p.z)) < Math.abs(b - (axis === 'z' ? p.x : p.z)) ? r : b, 0) + (Math.random() < 0.3 ? pick([-90, 90]) : 0);
    const dir = Math.random() < 0.65 ? 1 : -1, lane = road + (axis === 'z' ? (dir > 0 ? 4.5 : -4.5) : (dir > 0 ? -4.5 : 4.5));
    const along = (axis === 'z' ? p.z : p.x) + rand(-220, 220);
    if (Math.abs(along) > 400 || Math.abs(road) > 360) continue;
    const x = axis === 'z' ? lane : along, z = axis === 'z' ? along : lane;
    if (Math.hypot(x - p.x, z - p.z) < 70) continue;
    car.pos.set(x, 0, z); car.yaw = axis === 'z' ? (dir > 0 ? Math.PI : 0) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2); car.speed = 8; car.vy = 0;
    car.ai.axis = axis; car.ai.dir = dir; car.ai.lane = lane; car.updateBox(); return;
  }
}
function spawnTraffic(n) {
  for (let i = 0; i < n; i++) { const c = new Car('sedan', 0, 500, 0); c.ai = { fn: laneFn, speed: rand(10, 16), axis: 'z', dir: 1, lane: 4.5 }; cars.push(c); placeTraffic(c); }
}
function civTarget(p) {
  const bx = C3.roads.reduce((b, r) => Math.abs(r - p.x) < Math.abs(b - p.x) ? r : b, 0), bz = C3.roads.reduce((b, r) => Math.abs(r - p.z) < Math.abs(b - p.z) ? r : b, 0);
  if (Math.abs(p.x - bx) < Math.abs(p.z - bz)) { const side = Math.sign(p.x - bx) || 1; return new V3(bx + side * (C3.RW + 1.8), 0, p.z + rand(-20, 20)); }
  const side = Math.sign(p.z - bz) || 1; return new V3(p.x + rand(-20, 20), 0, bz + side * (C3.RW + 1.8));
}
function spawnCivilians(n) {
  for (let i = 0; i < n; i++) { const c = new Civilian(0, 0); civilians.push(c); placeCiv(c); }
}
function placeCiv(c) {
  const p = player.pos, a = rand(0, TAU), r = rand(40, 110);
  let q = civTarget(new V3(p.x + Math.cos(a) * r, 0, p.z + Math.sin(a) * r));
  if (q.z < -412) q.z = -300;
  c.pos.set(q.x, 0.18, q.z); c.target = null; c.alive = true; c.deadT = 0; c.mesh.rotation.set(0, 0, 0); if (!c.mesh.parent) scene.add(c.mesh);
}
function wreck(x, z, yaw) { const g = buildCar('sedan').group; g.position.set(x, 0, z); g.rotation.set(0, yaw, rand(-0.1, 0.1)); const p = new Prop('wreck', g, { hp: 120, metal: true }); props.push(p); if (Math.random() < 0.5) p.destroy(); return p; }
function mayaPassenger(car) {
  const m = buildSoldier('rifle', { noGun: true, color: 0x6a1a1a, gear: 0x2a1a1a, hair: new THREE.MeshStandardMaterial({ color: 0x1a0e08 }), scale: 0.9 });
  m.root.position.set(0.45, 0.35, -0.2); m.hips.position.y = 0.55; for (const l of m.legs) l.rotation.x = -1.4; for (const k of m.knees) k.rotation.x = 1.4;
  m.head.children[1].visible = false; car.mesh.add(m.root); return m;
}
function collapseAhead(zAhead, blockRoad) {
  const p = player.inVehicle ? player.inVehicle.pos : player.pos;
  const cands = C3.collapsible.filter(b => !b.done && (blockRoad ? b.z < -100 && b.z > -175 : b.z < p.z - 40 && b.z > p.z - zAhead) && Math.abs(b.x) < 60).sort((a, b) => b.z - a.z);
  const b = cands[0]; if (!b) return null;
  b.done = true;
  jetPass([], { fromV: new V3(-600, 160, b.z + 200), toV: new V3(600, 150, b.z - 200) });
  after(2.2, () => {
    for (let i = 0; i < 4; i++) after(i * 0.25, () => detonate(new V3(b.x + rand(-b.w / 3, b.w / 3), rand(4, b.h * 0.6), b.z + rand(-b.d / 3, b.d / 3)), 9, 60, { src: 'air', big: true }));
    new Collapse(b.mesh, b.col, { dur: 5, tilt: new V3(0, 0, (b.x > 0 ? 1 : -1) * 0.18) });
    if (b.roof) scene.remove(b.roof);
    HUD.notify('BUILDING COLLAPSE', blockRoad ? 'The avenue is blocked — detour east' : 'Keep moving!', 'red');
    if (blockRoad) for (let i = 0; i < 11; i++) { const m = new THREE.Mesh(B(i < 6 ? 5 : rand(3, 6), i < 6 ? 2.6 : rand(1.2, 3), i < 6 ? 4 : rand(2, 5)), M.concrete); m.castShadow = true; m.position.set(i < 6 ? -10 + i * 4 : rand(-10, 10), 1, i < 6 ? -121 : -121 + rand(-8, 8)); m.rotation.set(rand(-0.4, 0.4), rand(0, 3), rand(-0.4, 0.4)); props.push(new Prop('rubble', m, { hp: 99999 })); addFire(m.position.clone(), 0.8, 60); }
  });
  return b;
}
const WP3 = [new V3(0, 0, 150), new V3(0, 0, -50), new V3(0, 0, -90), new V3(90, 0, -90), new V3(90, 0, -250), new V3(90, 0, -360), new V3(0, 0, -365), new V3(0, 0, -410)];
function routeMarker() { const i = Mission.flags.wp || 0; const w = WP3[Math.min(i, WP3.length - 1)]; return new V3(w.x, 4, w.z); }
function advanceRoute() {
  const p = player.inVehicle ? player.inVehicle.pos : player.pos; let i = Mission.flags.wp || 0;
  while (i < WP3.length - 1 && Math.hypot(WP3[i].x - p.x, WP3[i].z - p.z) < 28) i++;
  Mission.flags.wp = i;
}
function chaseWave() {
  const s = Mission.cur(); if (!s || !/drive/.test(s.id) || !player.alive) return;
  const live = cars.filter(c => c.ai && c.ai.type === 'chase' && !c.dead).length;
  if (live < 2 && player.inVehicle) {
    const p = player.inVehicle.pos, z = p.z + 80, x = C3.roads.reduce((b, r) => Math.abs(r - p.x) < Math.abs(b - p.x) ? r : b, 0) + 4;
    spawnJeep(x, clamp(z, -400, 400), Math.random() < 0.5 ? -1 : 1, { kind: 'suv', enemyOpt: { color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true } });
    HUD.feed('⚠ PURSUIT VEHICLE', 'red');
  }
  after(rand(14, 20), chaseWave);
}
function ambientRaid() {
  if (Mission.cur().id === 'dogfight' || Mission.cur().id === 'betrayal' || !player.alive) return;
  const p = player.pos, z = p.z + rand(-150, 50);
  if (Math.random() < 0.35) bomberLine(new V3(-900, 190, z), new V3(900, 190, z - 60), [0, 1, 2, 3, 4].map(i => new V3(-200 + i * 70 + rand(-20, 20), 0, z - 20 + rand(-20, 20))).filter(q => q.distanceTo(p) > 25), { lead: 170 });
  else jetPass([{ pos: new V3(p.x + rand(-40, 40), 0.5, p.z - rand(30, 70)), count: 2 }], { alt: 140 });
  after(rand(10, 16), ambientRaid);
}

const LINES3 = {
  intro: [['MAYA', 'Airport\'s north. Twelve kilometres of city between us and it.', 3.4], ['EVAN', 'And every one of them on fire.', 2.6], ['MAYA', 'Just drive. I\'ll shoot.', 2.2]],
  silas: [['SILAS', 'Mister Cross. You\'re in a car with the woman who erased you.', 3.4], ['SILAS', 'Bring her to the airport. I\'ll be in the air. Then you get the truth.', 3.8], ['MAYA', 'Turn him off, Evan.', 1.8], ['EVAN', 'No. I want to hear this.', 2.2]],
  climb: [['MAYA', 'Kade\'s squadron is forming up above the clouds.', 3], ['EVAN', 'He says he\'ll fly with us.', 2.2], ['MAYA', 'Then we\'re already dead.', 2.2]],
  heli: [['MAYA', 'Gunship! Break line of sight — or put something heavy in its rotor.', 3.6]],
  detour: [['MAYA', 'Avenue\'s gone. Right, right — take 90th north!', 3]],
  roadblock: [['MAYA', 'Roadblock ahead. Ram the barriers if you\'re fast enough.', 3.2]],
  gate: [['MAYA', 'I\'ll hold the gate. Hangar three — there\'s a two-seater fueled and ready.', 4], ['EVAN', 'You planned this.', 1.8], ['MAYA', 'I plan everything. Go.', 2.2]],
  jet: [['MAYA', '(climbing into the back seat) You still remember how to fly?', 3.4], ['EVAN', 'Apparently I remembered enough to forget.', 3.2]],
  fighters: [['MAYA', 'Interceptors, six of them. Hold your nose on one to lock — then fire a missile with right click.', 4.6]],
  betray1: [['MAYA', 'Evan... I\'m sorry.', 2.6], ['EVAN', 'Maya? Why is there a gun on the back of my seat?', 3.2], ['MAYA', 'I recruited you. Seventeen years ago.', 3.2], ['MAYA', 'I\'m the one who erased you. Every single time.', 3.4], ['EVAN', 'Why?', 1.4], ['MAYA', 'Because the Blackline needs a pilot. And I need it OPEN.', 3.6], ['MAYA', 'Goodbye, Evan.', 2]]
};

LEVELS[5] = {
  id: 5, name: 'MISSION 3 — BURN THE CITY', chapter: 'CHAPTER 3', title: 'BURN THE CITY', sub: 'SAN MARCOS · COASTAL CITY · 20:41',
  env: { grade: { lift: [0.0, 0.012, 0.03], gain: [1.08, 0.97, 0.9], sat: 1.1, contrast: 1.1, vig: 0.4, bloom: 0.9, threshold: 1.5 }, clouds: 0.55, cloudCol: 0x6a4040, sky: [0x0c0e20, 0x8a3422, 0x3a2830], fog: [0x2c2226, 110, 950], sunDir: new V3(0.55, 0.1, -0.62), sunCol: 0xff8a5a, sunI: 1.3, sunGlow: 0xff6a3a, hemi: [0x8a7aa0, 0x2a2020, 0.5], amb: [0x404060, 0.32], exposure: 1.3, fixtures: 8, shadowSize: 90, groundCol: 0x2a2a2c },
  h: cityH, onRoad: cityOnRoad, waterLevel: 0, bounds: 2800,
  build() { buildCity(); },
  menuFocus: new V3(0, 0, 0),
  menuCam(t) { return { pos: new V3(Math.cos(t * 1.5) * 260, 120, Math.sin(t * 1.5) * 260), look: new V3(0, 20, -40) }; },
  radar(c, tr) { c.strokeStyle = 'rgba(200,190,170,0.28)'; c.lineWidth = 5; for (const r of C3.roads) { let a = tr(r, -414), b = tr(r, 414); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); a = tr(-414, r); b = tr(414, r); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); } const a = tr(-380, -620), b = tr(440, -620); c.lineWidth = 9; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); },
  civTarget,
  tick(dt, menu) {
    if (C3.roofFires) { for (const f of C3.roofFires) if (Math.random() < dt * 14 && (menu || f.distanceTo(camera.position) < 500)) { FX.fire(f, 2.2); } }
    if (menu) return;
    if (player.inJet && Flight.jet) player.pos.copy(Flight.jet.pos);
    for (const c of civilians) if (c.pos.distanceTo(player.pos) > 150 || !c.alive && c.deadT > 8) placeCiv(c);
  },
  tips: ['Shoot out of the SUV window with left click — the camera is your crosshair.', 'Shoot the driver of a pursuit SUV to stop it.', 'Rockets and grenades bring helicopters down fastest.', 'Jet: hold the nose on an interceptor until the box turns red, then right click.'],
  cpStep: [0, 2, 3, 5],
  reset(cp) {
    C3.collapsible.forEach(b => { if (b.done) { b.mesh.position.y = b.y0; b.mesh.rotation.set(0, 0, 0); b.col.box.max.y = b.maxY; if (b.roof) scene.add(b.roof); b.done = false; } });
    let spawn, vehicle = null;
    if (cp <= 1) {
      const sp = cp === 0 ? [4.5, 330, Math.PI * 0] : [94.5, -100, 0];
      const suv = new Car('suv', sp[0], sp[1], 0); suv.yaw = 0; cars.push(suv); pickupCar = suv; mayaPassenger(suv);
      spawn = [sp[0] - 2.5, sp[1], 0]; vehicle = suv; player.pos.set(sp[0], 0, sp[1]);
      spawnTraffic(16); spawnCivilians(26);
      for (let i = 0; i < 12; i++) { const z = rand(-380, 380), x = pick(C3.roads) + pick([-6.5, 6.5]); if (Math.abs(x) < 20 && z > 250) continue; wreck(x, z, rand(0, TAU)); }
      for (const [x, z] of [[-5, 250], [-5, 120], [5, 40], [95, -180], [85, -300]]) wreck(x, z, rand(-0.5, 0.5));
      // roadblock on 90th
      for (const dx of [-5, -1.7, 1.6, 4.9]) { const g = new THREE.Group(); part(g, B(3.1, 0.85, 0.6), M.concrete, 0, 0.42, 0); part(g, B(3.1, 0.12, 0.62), M.barrelStripe, 0, 0.7, 0); g.position.set(90 + dx, 0, -262); props.push(new Prop('barrier', g, { hp: 150, remove: true })); }
      for (const [x, z, t] of [[80, -268, 'rifle'], [101, -266, 'rifle'], [96, -275, 'heavy'], [84, -280, 'shotgun'], [104, -282, 'rifle']]) addEnemy(t, x, z, { group: 'roadblock', yaw: Math.PI, color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true });
      new Turret(90, 0, -290, { yaw: Math.PI, range: 60 });
    }
    if (cp <= 2) {
      // airport garrison
      const o = { group: 'airport', color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true };
      for (const [x, z, t] of [[-20, -440, 'rifle'], [22, -445, 'rifle'], [0, -470, 'heavy'], [-60, -480, 'shotgun'], [60, -485, 'rifle'], [18, -500, 'rifle'], [-100, -500, 'rifle'], [120, -500, 'shotgun'], [40, -548, 'rifle'], [70, -560, 'heavy'], [10, -560, 'rifle']]) addEnemy(t, x, z, Object.assign({ yaw: 0, patrol: [[x, z], [x + rand(-10, 10), z + rand(-10, 10)]] }, o));
      addEnemy('sniper', 270, -470, Object.assign({ y: 46.5, static: true, yaw: Math.PI / 2 + 0.6 }, o));
      for (const dx of [-5, 0, 5]) { const g = new THREE.Group(); part(g, B(4, 1.1, 0.8), M.hazard, 0, 0.55, 0); g.position.set(dx, 0, -414); props.push(new Prop('barrier', g, { hp: 200, remove: true })); }
      for (const [x, z] of [[-40, -455], [52, -460], [-130, -470], [150, -475], [5, -510]]) spawnBarrel(x, z, 0);
      pickups.push(new Pickup('ammo', new V3(-8, 0, -430))); pickups.push(new Pickup('health', new V3(30, 0, -470))); pickups.push(new Pickup('weapon', new V3(-14, 0, -436), { weapon: 'rocket' })); pickups.push(new Pickup('armor', new V3(44, 0, -512))); pickups.push(new Pickup('jack', new V3(-180, 0, -530)));
      pickups.push(new Pickup('jack', new V3(-4, 0, -430))); pickups.push(new Pickup('jack', new V3(34, 0, -470)));
      pickups.push(new Pickup('weapon', new V3(-18, 0.3, -436), { weapon: 'sniper' })); pickups.push(new Pickup('weapon', new V3(48, 0.3, -512), { weapon: 'sniper' }));
      // static fighter in hangar 3 + boarding interaction
      const jm = buildJet(); jm.position.set(C3.hangar.x, 1.6, C3.hangar.z); jm.rotation.y = Math.PI; scene.add(jm); C3.jetMesh = jm;
      C3.jetMesh.userData.col = addBoxCollider(new V3(C3.hangar.x - 6, 0, C3.hangar.z - 8), new V3(C3.hangar.x + 6, 2.6, C3.hangar.z + 6), null, { dyn: true });
      actors.push({ update() { }, dispose() { scene.remove(jm); } });
      new Interact(new V3(C3.hangar.x + 2, 1.5, C3.hangar.z - 8), 'Board the fighter', () => { Mission.flags.board = true; }, { range: 5, enabled: () => Mission.cur().id === 'board' });
    }
    if (cp === 0) spawn = spawn || [4.5, 330, 0];
    else if (cp === 2) spawn = [0, -396, 0];
    else if (cp === 3) spawn = [-300, -620, -Math.PI / 2];
    const r = { spawn, y: 0.2, loadout: ['pistol', 'ar'], cur: 'ar', armor: 50, nades: 3, vehicle };
    return r;
  },
  onSpotted() { },
  steps: [
    { id: 'drive1', cp: 0, text: 'Drive north to the airport — follow the marker', marker: routeMarker,
      enter() {
        Mission.flags.wp = 0; after(1.5, () => HUD.say(LINES3.intro)); after(2.5, () => HUD.hint('Left click shoots from the window · shoot the drivers of pursuit SUVs', 6)); after(30, () => HUD.say(LINES3.silas));
        after(10, chaseWave); after(6, ambientRaid);
        after(22, () => { new Heli(0, 60, 150, { r: 50 }); HUD.say(LINES3.heli); });
        after(4, () => collapseAhead(300, false));
      },
      update() { advanceRoute(); const p = player.inVehicle ? player.inVehicle.pos : player.pos; if (p.z < 60 && !Mission.flags.col2) { Mission.flags.col2 = true; collapseAhead(260, true); } return p.z < -20; } },
    { id: 'detour', text: 'The avenue is blocked — detour east to 90th Avenue', marker: routeMarker, silent: true,
      enter() { Mission.flags.detour = true; HUD.say(LINES3.detour); if (!Mission.flags.col2) { Mission.flags.col2 = true; collapseAhead(300, true); } Mission.flags.wp = 2; },
      update() { advanceRoute(); const p = player.inVehicle ? player.inVehicle.pos : player.pos; return p.x > 70 && p.z < -60; } },
    { id: 'drive2', cp: 1, text: 'Take 90th Avenue north to the airport', marker: routeMarker,
      enter() { Mission.flags.detour = true; if ((Mission.flags.wp || 0) < 3) Mission.flags.wp = 3; after(8, chaseWave); after(5, ambientRaid); after(12, () => { new Heli(90, 60, -300, { r: 45 }); HUD.say(LINES3.heli); }); },
      update() { advanceRoute(); const p = player.inVehicle ? player.inVehicle.pos : player.pos; if (p.z < -200 && !Mission.flags.rb) { Mission.flags.rb = true; HUD.say(LINES3.roadblock); } return p.z < -400 && Math.abs(p.x) < 40; } },
    { id: 'airport', cp: 2, text: 'Fight through the airport to Hangar 3', marker: () => new V3(C3.hangar.x, 3, C3.hangar.z - 22),
      enter() { HUD.say(LINES3.gate); for (const e of enemies) if (e.alive && e.group === 'airport') { e.lastKnown.copy(player.pos); } after(20, () => { new Heli(60, 50, -520, { r: 40 }); }); after(35, () => new Heli(-300, 70, -700, { drop: true, troops: 5, landAt: new V3(-10, 0, -500), group: 'airport', enemyOpt: { color: 0x16181b, gear: 0x0b0c0d, visor: true } })); after(3, ambientRaid); },
      update() { return player.pos.distanceTo(new V3(C3.hangar.x, 0, C3.hangar.z)) < 16; } },
    { id: 'board', text: 'Board the fighter', marker: () => new V3(C3.hangar.x + 2, 3, C3.hangar.z - 8), update() { return !!Mission.flags.board; } },
    { id: 'takeoff', cp: 3, text: 'Take off — throttle up (W), then move the mouse up to lift the nose', marker: null,
      enter() {
        if (C3.jetMesh) { scene.remove(C3.jetMesh); if (C3.jetMesh.userData.col) C3.jetMesh.userData.col.noCol = C3.jetMesh.userData.col.noRay = true; }
        if (player.inVehicle) exitVehicle(true);
        const jet = new PlayerJet(new V3(-340, 1.6, -620), -Math.PI / 2, { rearSeat: true, onCrash: (j) => onJetCrash(j) });
        jet.throttle = 0.3; player.inJet = true; enemies.forEach(e => e.dispose()); enemies = [];
        for (const t of targets) if (t instanceof Heli) t.dispose();
        HUD.say(LINES3.jet); HUD.hint('W throttle · mouse pitch/roll · A/D yaw · SHIFT boost', 8);
      },
      update() { const j = Flight.jet; if (j && !j.onGround && !Mission.flags.climb) { Mission.flags.climb = gameTime; HUD.say(LINES3.climb); } return Mission.flags.climb && gameTime - Mission.flags.climb > 9; } }
  ],
  onEnterVehicle() { },
  intro: {
    lines: [[0, 'THE SURFACE IS WORSE THAN THE MOUNTAIN.', ''], [3500, 'EVERY SCREEN IN SAN MARCOS SHOWS THE SAME MESSAGE:', ''], [7000, 'WHEN THE BLACKLINE OPENS,<br>DO NOT TRUST THE SKY.', 'big']],
    dur: 10500,
    fly(eye, look) { return [{ t: 0, pos: new V3(-160, 140, 420), look: new V3(0, 30, 200) }, { t: 5, pos: new V3(40, 30, 370), look: new V3(0, 5, 320) }, { t: 7, pos: eye.clone().add(new V3(0, 2, 6)), look: eye.clone().add(new V3(0, 0, -30)) }]; }
  },
  complete() {
    achieve('ch3', 'Apparently I Remembered', 'Chapter 3 complete');
    showEnding({
      lines: [[400, 'Wheels up. San Marcos burns beneath the wings.'], [3200, 'Above the clouds, four fighters with no markings slide into formation around them.'], [6600, '<span class="si">SILAS</span> <i>[radio]</i> Welcome back to the sky, Mister Cross. Just like old times.'], [10200, '<span class="ev">EVAN</span> I don\'t remember old times.'], [12600, '<span class="si">SILAS</span> I know. I made sure.']],
      cardAt: 15500, chapter: 'END OF CHAPTER 3', title: 'BURN THE CITY', next: 6, tease: 'NEXT — CHAPTER 4: THE BETRAYAL'
    });
  }
};
function spawnFighters(n, dist) {
  const j = Flight.jet; if (!j) return;
  for (let i = 0; i < n; i++) { const a = rand(-0.7, 0.7), f = new Fighter(j.pos.clone().add(new V3(Math.cos(a) * dist, rand(100, 300), Math.sin(a) * dist - 200)), { speed: rand(150, 175) }); f.dir.copy(j.pos).sub(f.pos).normalize(); }
  HUD.feed('⚠ ' + n + ' BANDITS INBOUND', 'red');
}
function onJetCrash(j) {
  if (Mission.cur().id === 'betrayal') { if (Mission.ended) return; FX.explosion(j ? j.pos : player.pos, 12); addShake(1); Mission.ended = true; if (Flight.jet) { Flight.jet.dead = true; } missionComplete(); return; }
  player.inJet = false; showDeath.msg = 'Your jet went down. Keep your speed up and watch your altitude.'; killPlayer();
}
