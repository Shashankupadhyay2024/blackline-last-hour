/* ============================================================
   CHAPTER 5 — LAST HOUR  (Blackline headquarters)
   APC assault → courtyard turrets → HQ lobby → laser corridor
   → server cores → Maya → the choice → PLAYER 2 CONNECTED.
   ============================================================ */
const H5 = { cores: [], pylons: [] };
function hqH(x, z) {
  const inX = Math.abs(x) - 190, inZ = Math.max(z - 170, -250 - z), d = Math.max(inX, inZ, 0);
  const road = Math.abs(x) < 14 && z > 150 ? 1 : 0;
  if (d <= 0) return 0;
  const hill = smooth(20, 260, d) * (40 + 90 * fbm(x * 0.006, z * 0.006, 4));
  return road ? hill * smooth(14, 40, Math.abs(x)) : hill;
}
const HQC = {};
function hqColor(x, z, h, c) {
  if (!HQC.a) Object.assign(HQC, { a: new THREE.Color(0x2e2c2a), b: new THREE.Color(0x4a3a2e), r: new THREE.Color(0x3a3230), road: new THREE.Color(0x1e1d1c) });
  c.copy(HQC.a).lerp(HQC.b, clamp(h / 30, 0, 1)); c.lerp(HQC.r, fbm(x * 0.03, z * 0.03, 3) * 0.4);
  if (Math.abs(x) < 9 && z > 140) c.copy(HQC.road);
}
function buildHQ() {
  WORLD = 700;
  buildTerrain({ size: 1200, seg: 200, cz: 0, color: hqColor, mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, map: TEX.grain }) });
  floorPlane(-190, -250, 190, 170, 0.02, new THREE.MeshStandardMaterial({ color: 0x5a5a5c, roughness: 0.9, map: TEX.floor }), 8);
  floorPlane(-9, 160, 9, 520, 0.03, M.cityRoad, 8);
  // perimeter wall with the main gate
  const PW = { h: 8, t: 2, mat: M.concrete };
  wall(-180, 160, 180, 160, Object.assign({ doors: [0], dw: 14, dh: 8 }, PW)); wall(-180, -240, 180, -240, PW); wall(-180, 160, -180, -240, PW); wall(180, 160, 180, -240, PW);
  for (const [x, z] of [[-180, 160], [180, 160], [-180, -240], [180, -240], [-24, 160], [24, 160]]) { solid(6, 16, 6, M.wallDark, x, 0, z, { tile: 4 }); const lamp = spriteGlow(TEX.glowRed, 3); lamp.position.set(x, 17, z); scene.add(lamp); }
  H5.towers = [new V3(-24, 16, 160), new V3(24, 16, 160), new V3(-180, 16, 160), new V3(180, 16, 160)];
  // HQ monolith — exterior shell
  const WX = 70, Z0 = -40, Z1 = -200, SH = 38;
  const shell = (a, b, c, d, doors, dw, dh) => wall(a, b, c, d, { h: SH, t: 1.2, mat: M.wallDark, doors: doors || [], dw: dw || 3.2, dh: dh || 3 });
  shell(-WX, Z0, WX, Z0, [0], 6, 5); shell(-WX, Z1, WX, Z1); shell(-WX, Z0, -WX, Z1); shell(WX, Z0, WX, Z1);
  const roof = new THREE.Mesh(B(WX * 2 + 2, 1, Z0 - Z1 + 2), M.wallDark); roof.position.set(0, SH, (Z0 + Z1) / 2); scene.add(roof);
  for (let x = -60; x <= 60; x += 20) { const strip = new THREE.Mesh(B(0.5, SH - 8, 0.2), M.redLamp); strip.position.set(x, SH / 2 + 4, Z0 + 0.7); scene.add(strip); }
  const logo = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 84px Arial'; c.textAlign = 'center'; c.fillText('BLACKLINE', w / 2, 92); c.fillStyle = '#ff2a1a'; c.fillRect(w / 2 - 120, 106, 240, 8); });
  const lg = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), new THREE.MeshBasicMaterial({ map: logo })); lg.position.set(0, 30, Z0 + 0.7); lg.rotation.y = Math.PI; scene.add(lg);
  // interior: floors, ceilings, partitions (ground floor 8m)
  floorPlane(-WX, Z1, WX, Z0, 0.04, M.floor, 4); ceilPlane(-WX, Z1, WX, Z0, 8, M.ceil);
  const IW = { h: 8, mat: M.wall };
  wall(-WX, -70, WX, -70, Object.assign({ doors: [0] }, IW));
  wall(-4, -70, -4, -120, IW); wall(4, -70, 4, -120, IW);
  wall(-WX, -120, WX, -120, Object.assign({ doors: [0] }, IW));
  wall(-WX, -165, WX, -165, Object.assign({ doors: [0], dw: 4, dh: 3.6 }, IW));
  wall(-30, -165, -30, -200, IW); wall(30, -165, 30, -200, IW);
  // lobby
  for (const [x, z] of [[-40, -52], [40, -52], [-40, -62], [40, -62], [-15, -58], [15, -58]]) solid(1.6, 8, 1.6, M.wallDark, x, 0, z, { cover: true, tile: 2 });
  solid(14, 1.1, 2.4, M.desk, 0, 0, -60, { cover: true }); for (const x of [-4, 0, 4]) solid(0.8, 0.5, 0.05, M.screen, x, 1.1, -60.9, { col: false });
  for (const [x, z] of [[-55, -48], [-50, -64], [55, -48], [52, -64], [-25, -66], [25, -66]]) crate(x, 0, z, 1.4, rand(0, 3));
  sign('SECURITY CORRIDOR', 0, 5, -69.7, 0, { w: 3, fg: '#ff4a3a' });
  for (const x of [-50, -25, 0, 25, 50]) for (const z of [-48, -63]) lightPanel(x, 8, z, { i: 1.4 });
  for (const z of [-78, -92, -106, -118]) lightPanel(0, 8, z, { i: 1.2, w: 1, d: 1.6 });
  // server hall
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.35, metalness: 0.6, map: TEX.rack, emissive: 0xff3322, emissiveMap: TEX.rack, emissiveIntensity: 0.8 });
  for (const z of [-128, -158]) for (const [a, b] of [[-66, -48], [-32, -12], [12, 32], [48, 66]]) solid(b - a, 2.6, 1.2, rackMat, (a + b) / 2, 0, z, { cover: true, tile: 2.6 });
  for (const [x, z] of [[-22, -138], [22, -138], [-56, -146], [56, -146], [0, -134]]) solid(3, 1.2, 1.2, M.darkMetal, x, 0, z, { cover: true });
  H5.corePos = [new V3(-40, 0, -144), new V3(0, 0, -152), new V3(40, 0, -144)];
  for (const x of [-55, -30, -5, 20, 45]) for (const z of [-126, -143, -160]) lightPanel(x + 5, 8, z, { i: 1.3, dist: 20 });
  // control room
  solid(56, 1.4, 10, M.wallDark, 0, 0, -195, { tile: 3 });
  for (let i = 0; i < 4; i++) solid(4, 0.35 * (i + 1), 1.2, M.metal, 0, 0, -189 + (3 - i) * 1.2 - 0.6 + 1.8, {});
  const screenT = canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#060206'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ff2a1a'; c.lineWidth = 3; for (let i = 0; i < 18; i++) { c.beginPath(); c.moveTo(0, 20 + i * 12); for (let x = 0; x < w; x += 16) c.lineTo(x, 20 + i * 12 + Math.sin(x * 0.05 + i) * 6); c.stroke(); } c.fillStyle = '#fff'; c.font = 'bold 44px Arial'; c.textAlign = 'center'; c.fillText('BLACKLINE', w / 2, 130); c.font = '22px monospace'; c.fillStyle = '#ff6a58'; c.fillText('CYCLE 7 · T-MINUS 00:59:59', w / 2, 170); });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(26, 7), new THREE.MeshBasicMaterial({ map: screenT })); scr.position.set(0, 4.8, -199.3); scene.add(scr); H5.screenTex = screenT;
  for (const [x, z] of [[-14, -176], [14, -176], [-8, -184], [8, -184], [-20, -186], [20, -186]]) { solid(3.2, 1.1, 1.2, M.desk, x, 0, z, { cover: true }); solid(1.2, 0.5, 0.05, M.screen, x, 1.1, z - 0.6, { col: false }); }
  for (const x of [-20, 0, 20]) for (const z of [-172, -186]) lightPanel(x, 8, z, { i: 1.3, color: 0xffd0d0 });
  Fixtures.add(new V3(0, 4, -196), 0xff3a2a, 2.2, 24, 0);
  // courtyard set dressing
  for (const [x, z, w, d] of [[-120, 60, 24, 14], [120, 60, 24, 14], [-120, -120, 30, 30], [120, -120, 30, 30], [-130, -10, 16, 10], [130, -10, 16, 10]]) solid(w, 7, d, M.wallDark, x, 0, z, { tile: 4, cover: true });
  for (const [x0, z0, x1, z1] of [[-40, 110, -20, 110], [20, 110, 40, 110], [-70, 30, -50, 30], [50, 30, 70, 30], [-20, 0, -8, 0], [8, 0, 20, 0], [-90, 100, -90, 80], [90, 100, 90, 80]]) {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 0.62), g = new THREE.Group();
    for (let row = 0; row < 3; row++) for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; const b = part(g, B(0.6, 0.3, 0.38), M.sand, lerp(x0, x1, t), 0.15 + row * 0.3, lerp(z0, z1, t)); b.rotation.y = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2; }
    scene.add(g); addBoxCollider(new V3(Math.min(x0, x1) - 0.3, 0, Math.min(z0, z1) - 0.3), new V3(Math.max(x0, x1) + 0.3, 0.95, Math.max(z0, z1) + 0.3), null, { cover: true });
  }
  for (const [x, z] of [[-60, 130], [60, 125], [-100, 40], [100, 20], [-40, 60], [40, 70], [0, 90]]) crate(x, 0, z, 1.5, rand(0, 3));
  const floods = [[-150, 130], [150, 130], [-150, -200], [150, -200], [-80, 0], [80, 0], [0, 140]];
  for (const [x, z] of floods) { solid(0.3, 10, 0.3, M.metal, x, 0, z, { col: false }); const h = new THREE.Mesh(B(1.4, 0.6, 0.5), M.lamp); h.position.set(x, 10, z); scene.add(h); Fixtures.add(new V3(x, 9, z), 0xfff0d8, 2.4, 45, 0); }
  // searchlights sweeping the sky
  H5.search = [];
  for (const [x, z] of [[-150, 130], [150, 130], [-150, -200], [150, -200]]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(18, 400, 20, 1, true).translate(0, -200, 0), new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const piv = new THREE.Group(); piv.position.set(x, 12, z); piv.add(cone); cone.rotation.x = Math.PI; scene.add(piv); H5.search.push({ piv, a: rand(0, TAU), s: rand(0.2, 0.4) });
  }
  // nav graph for the interior
  const nodes = [[0, -30], [0, -44], [-30, -50], [30, -50], [-55, -56], [55, -56], [0, -66], [0, -75], [0, -95], [0, -116], [0, -124], [-40, -124], [40, -124], [-60, -136], [60, -136], [-40, -138], [40, -138], [-20, -146], [20, -146], [0, -142], [-60, -154], [60, -154], [-30, -162], [30, -162], [0, -162], [0, -168], [-20, -172], [20, -172], [0, -178], [-24, -182], [24, -182], [-14, -188], [14, -188]];
  buildNav(nodes);
}

/* ---------------- boss ---------------- */
class Boss extends Enemy {
  constructor(x, z) {
    const T = { hp: 2200, speed: 6.2, range: 70, acc: 0.3, dmg: 6, rpm: 560, burst: [5, 9], pause: [0.5, 1.0], mag: 40, reload: 1.5, aim: 0.35, sight: 140, color: 0x5a1414, gear: 0x121212, snd: 'ar', drop: 'ar', scale: 1.0 };
    super('rifle', x, z, { T, hair: new THREE.MeshStandardMaterial({ color: 0x140a06 }), balaclava: false, color: 0x5a1414, gear: 0x121212, group: 'maya', combat: true });
    this.parts.head.children[1].visible = false;
    this.isBoss = true; this.hpMax = this.hp; this.phase = 1; this.dashT = 3; this.nadeT = 8; this.shielded = false; this.defeated = false; this.static = false;
    this.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 14), new THREE.MeshBasicMaterial({ color: 0x57c7ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })); this.shieldMesh.visible = false; scene.add(this.shieldMesh);
    HUD.bossRef = this;
  }
  damage(d, dir, head, src) {
    if (this.defeated) return;
    if (this.shielded) { FX.sparks(this.pos.clone().setY(this.pos.y + 1.2), 4); return; }
    d = Math.min(d, cur === 'golden' ? 450 : 160);
    if (this.hp - d <= this.hpMax * 0.05) { this.hp = this.hpMax * 0.05; this.defeat(); return; }
    super.damage(d, dir, head, src);
    const f = this.hp / this.hpMax;
    if (this.phase === 1 && f < 0.66) this.phaseShift(2);
    else if (this.phase === 2 && f < 0.33) this.phaseShift(3);
  }
  phaseShift(p) {
    this.phase = p; this.shielded = true; this.shieldMesh.visible = true;
    HUD.say(p === 2 ? [['MAYA', 'You were always better at this than me. That\'s why I needed you.', 3.6]] : [['MAYA', 'Seven cycles, Evan! Seven! And you still don\'t see it!', 3.4]]);
    HUD.notify('SHIELD ACTIVE', 'Destroy the shield pylons', 'red');
    const o = { group: 'maya', combat: true, color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true };
    for (const [x, z] of [[-26, -170], [26, -170], [-24, -190], [24, -190]]) addEnemy(pick(['rifle', 'shotgun', 'rifle', 'heavy']), x, z, o);
    H5.pylons = [];
    for (const [x, z] of (p === 2 ? [[-18, -192], [18, -192]] : [[-26, -178], [26, -178], [0, -193]])) {
      const g = new THREE.Group(); part(g, new THREE.CylinderGeometry(0.4, 0.7, 3.4, 10), M.darkMetal, 0, 1.7, 0); const orb = part(g, new THREE.SphereGeometry(0.6, 14, 10), new THREE.MeshBasicMaterial({ color: 0x57c7ff }), 0, 3.8, 0, 0, 0, 0, false);
      g.position.set(x, z < -190 ? 1.4 : 0, z); scene.add(g);
      const py = addTarget({ pos: new V3(x, (z < -190 ? 1.4 : 0) + 3, z), hp: 450, radius: 1, dead: false, mesh: g, orb, explMul: 1.5,
        damage(d) { if (this.dead) return; this.hp -= d; HUD.hit(false, false); if (this.hp <= 0) { this.dead = true; this.orb.visible = false; detonate(this.pos, 4, 30, { src: 'pylon' }); removeCol(this); HUD.feed('✕ PYLON DOWN', 'gold'); } },
        update() { if (!this.dead) this.orb.scale.setScalar(1 + Math.sin(gameTime * 6) * 0.1); }, dispose() { scene.remove(this.mesh); } }, new THREE.Box3(new V3(x - 0.8, z < -190 ? 1.4 : 0, z - 0.8), new V3(x + 0.8, (z < -190 ? 1.4 : 0) + 4.4, z + 0.8)));
      H5.pylons.push(py);
    }
  }
  defeat() {
    this.defeated = true; this.shielded = false; this.shieldMesh.visible = false; this.moveTarget = null; this.noShoot = true; this.showLaser(false);
    for (const e of enemies) if (e !== this && e.alive) e.die(null, false, 'player');
    for (const t of targets) if (t instanceof Turret && !t.dead) t.active = false;
    Mission.flags.bossDown = gameTime;
    HUD.say([['MAYA', '(on her knees) ...Go on, then.', 2.6], ['MAYA', 'I played his villain for seven cycles, Evan. So he would let you live.', 4], ['EVAN', 'I know. I remember the dock.', 2.4], ['MAYA', '...You remember?', 2]]);
  }
  update(dt) {
    if (this.defeated) {
      this.parts.hips.position.y = lerp(this.parts.hips.position.y, 0.45, dt * 3); this.parts.legs.forEach(l => l.rotation.x = -1.4); this.parts.knees.forEach(k => k.rotation.x = 1.9); this.parts.aim.rotation.x = -1.1;
      this.mesh.position.copy(this.pos); this.faceYaw = yawTo(this.pos.x, this.pos.z, player.pos.x, player.pos.z); this.yaw += angDiff(this.yaw, this.faceYaw) * dt * 3; this.mesh.rotation.set(0, this.yaw, 0); return;
    }
    if (this.shielded && H5.pylons.every(p => p.dead)) { this.shielded = false; this.shieldMesh.visible = false; HUD.feed('SHIELD DOWN', 'gold'); }
    super.update(dt);
    this.shieldMesh.position.set(this.pos.x, this.pos.y + 1.1, this.pos.z);
    if (!this.alive) return;
    this.T.rpm = this.phase === 3 ? 760 : 560;
    this.dashT -= dt; this.nadeT -= dt;
    if (this.dashT <= 0 && this.state === 'combat') {
      this.dashT = this.phase === 3 ? rand(1.6, 2.6) : rand(2.6, 4);
      const a = Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z) + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2, r = rand(6, 10);
      const to = new V3(clamp(this.pos.x + Math.sin(a) * r, -27, 27), 0, clamp(this.pos.z + Math.cos(a) * r, -198, -168));
      for (let i = 0; i < 8; i++) FX.add.emit(lerp(this.pos.x, to.x, i / 8), this.pos.y + 1.2, lerp(this.pos.z, to.z, i / 8), 0, 0.5, 0, 0.4, 0.8, 0.1, COL.fire1, COL.fireD, 0.8, 0, 0);
      this.pos.x = to.x; this.pos.z = to.z; AudioSys.ui('whiz');
    }
    if (this.phase >= 2 && this.nadeT <= 0 && this.canSee) {
      this.nadeT = rand(6, 9);
      const o = this.pos.clone().setY(this.pos.y + 1.6), tp = player.pos.clone(), dv = tp.sub(o); const flat = Math.hypot(dv.x, dv.z) || 1;
      projectiles.push(new Projectile('grenade', o, new V3(dv.x / flat * Math.min(18, flat * 0.9), 5, dv.z / flat * Math.min(18, flat * 0.9)), { owner: 'maya' }));
      HUD.hint('GRENADE!', 1.2);
    }
  }
  dispose() { super.dispose(); scene.remove(this.shieldMesh); if (HUD.bossRef === this) HUD.bossRef = null; }
}

/* ---------------- ambient war overhead ---------------- */
function warSky() {
  if (!player.alive || Mission.step >= 7) return;
  const r = Math.random();
  if (r < 0.35) { const z = rand(-400, 400), side = Math.random() < 0.5 ? -1 : 1; bomberLine(new V3(-1200 * side, 260, z), new V3(1200 * side, 260, z + rand(-200, 200)), [0, 1, 2, 3, 4, 5].map(i => new V3((-500 + i * 60) * side, 0, z + rand(-60, 60))).filter(p => Math.abs(p.x) > 210 || p.z > 200 || p.z < -280), { speed: 110, lead: 260 }); }
  else jetPass([], { fromV: new V3(rand(-800, 800), rand(150, 260), -900), toV: new V3(rand(-800, 800), rand(150, 260), 900), speed: 190 });
  after(rand(7, 13), warSky);
}
function flak(dt) {
  if (Math.random() < dt * 1.6) {
    const p = new V3(player.pos.x + rand(-300, 300), rand(140, 320), player.pos.z + rand(-300, 300));
    FX.explosion(p, 3); Lights.flash(p, 3, 0.2, 200);
    if (AudioSys.ctx && Math.random() < 0.5) AudioSys.boom(p, false);
  }
  if (Math.random() < dt * 4) { const t = pick(H5.towers || [new V3()]); Tracers.add(t, t.clone().add(new V3(rand(-120, 120), rand(200, 300), rand(-120, 120))), true); }
}

const LINES5 = {
  intro: [['EVAN', 'Last Hour. Home of the Blackline.', 2.4], ['EVAN', 'The whole world\'s fighting over my head. Good. Nobody\'s watching the front door.', 4.2]],
  gate: [['EVAN', 'Three defense turrets in the courtyard. The APC\'s cannon can handle them.', 3.6]],
  door: [['EVAN', 'The doors are open. The APC won\'t fit — I\'m going in on foot.', 3.4]],
  quiet: [['EVAN', 'Drainage tunnel. Maya always said this place had a back door.', 3.4], ['EVAN', 'Patrols in the courtyard. Stay low, get to the main doors.', 3.2]],
  corridor: [['EVAN', 'Laser grid. Low beams, I jump. High beams, I crouch. Trip one and every gun in here wakes up.', 5]],
  cores: [['MAYA', '(over the PA) Hello, Evan. You\'re early this cycle.', 3.2], ['MAYA', '(PA) Those cores hold seventeen years of your life. Break them and they\'re gone for good.', 4.6], ['EVAN', 'They were gone anyway.', 2]],
  maya: [['MAYA', 'Every time, you walk through that door. Every time, you raise that gun.', 4], ['MAYA', 'And every time, the world burns anyway. Let me reset it, Evan.', 3.6], ['EVAN', 'Not this time.', 1.8]]
};

LEVELS[10] = {
  id: 10, name: 'MISSION 7 — 11:59', chapter: 'CHAPTER 7', title: '11:59', sub: 'BLACKLINE HQ · 23:00 · THE LAST HOUR',
  env: { grade: { lift: [0.01, 0.0, 0.035], gain: [1.05, 0.95, 1.0], sat: 1.05, contrast: 1.12, vig: 0.42, bloom: 1.0, threshold: 1.2 }, clouds: 0.45, cloudCol: 0x5a2230, sky: [0x04050c, 0x3a0c14, 0x1c0c10], stars: true, fog: [0x1c0c10, 120, 1000], sunDir: new V3(-0.3, 0.45, -0.6), sunCol: 0x8aa0ff, sunI: 0.7, sunGlow: 0x5a6aa0, hemi: [0x5a4a70, 0x2a1010, 0.42], amb: [0x303050, 0.38], exposure: 1.4, fixtures: 8, shadowSize: 80, groundCol: 0x201818, vmHemi: 0xd0c8ff, vmI: 0.6 },
  h: hqH, bounds: 700,
  build() { buildHQ(); },
  menuFocus: new V3(0, 0, -60),
  menuCam(t) { const a = t * 1.6; return { pos: new V3(Math.cos(a) * 220, 60, 40 + Math.sin(a) * 200), look: new V3(0, 20, -100) }; },
  radar(c, tr) {
    c.strokeStyle = 'rgba(255,140,120,0.35)'; c.lineWidth = 2;
    for (const [x0, z0, x1, z1] of [[-180, -240, 180, 160], [-70, -200, 70, -40]]) { const p = [tr(x0, z0), tr(x1, z0), tr(x1, z1), tr(x0, z1)]; c.beginPath(); c.moveTo(...p[0]); for (const q of p.slice(1)) c.lineTo(...q); c.closePath(); c.stroke(); }
    c.strokeStyle = 'rgba(200,190,170,0.3)'; c.lineWidth = 5; c.beginPath(); c.moveTo(...tr(0, 520)); c.lineTo(...tr(0, 160)); c.stroke();
  },
  tick(dt, menu) {
    if (H5.search) for (const s of H5.search) { s.a += dt * s.s; s.piv.rotation.set(0.5 + Math.sin(s.a * 1.3) * 0.25, s.a, 0); }
    if (H5.screenTex) H5.screenTex.offset.x = Math.sin(realTime * 0.3) * 0.01;
    if (!menu) flak(dt); else if (Math.random() < dt * 1.2) { const p = new V3(rand(-300, 300), rand(150, 300), rand(-300, 200)); FX.explosion(p, 3); }
  },
  tips: ['The APC autocannon shreds turrets — stay inside until the courtyard is clear.', 'Laser grid: jump the low beams, crouch under the high ones.', 'Maya\'s shield drops when the glowing pylons are destroyed.', 'Grenades and rockets deal bonus damage to the cores.'],
  cpStep: [0, 2, 5, 6],
  reset(cp) {
    const o = { color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true };
    H5.cores = []; H5.pylons = []; H5.gate = []; H5.turrets = []; H5.boss = null; HUD.bossRef = null; Mission.flags.bossDown = 0;
    const quiet = Story.get('approach', 'loud') === 'quiet'; H5.quietStart = quiet && cp === 0; if (quiet) Mission.flags.quiet = true;
    // gate
    if (cp === 0 && !quiet) for (const dx of [-3.5, 3.5]) { const g = new THREE.Group(); part(g, B(7, 7.6, 1.2), M.hazard, 0, 3.8, 0); g.position.set(dx, 0, 160); const p = new Prop('barrier', g, { hp: 700, remove: true }); props.push(p); H5.gate = H5.gate || []; H5.gate.push(p); }
    // turrets
    H5.turrets = [];
    if (cp <= 1 && !quiet) for (const [x, z] of [[-60, 70], [60, 70], [0, 18]]) { const t = new Turret(x, 0, z, { hp: 900, range: 90, dmg: 9, yaw: 0 }); H5.turrets.push(t); }
    // courtyard garrison
    if (cp <= 1 && quiet) {
      for (const [x, z, t] of [[-120, -150, 'rifle'], [-90, -60, 'rifle'], [-60, 30, 'shotgun'], [60, 32, 'rifle'], [-30, -25, 'rifle'], [30, -25, 'rifle'], [100, -100, 'rifle'], [0, 40, 'heavy']]) addEnemy(t, x, z, Object.assign({ group: 'yard', yaw: rand(0, TAU), patrol: [[x, z], [x + rand(-14, 14), z + rand(-14, 14)]] }, o));
    }
    if (cp <= 1 && !quiet) {
      for (const [x, z, t] of [[-30, 120, 'rifle'], [30, 115, 'rifle'], [-65, 32, 'rifle'], [65, 32, 'rifle'], [-15, 5, 'heavy'], [15, 5, 'shotgun'], [-120, 40, 'rifle'], [120, 40, 'rifle'], [-90, 90, 'shotgun'], [90, 90, 'rifle'], [0, 85, 'heavy'], [-40, -25, 'rifle'], [40, -25, 'rifle']]) addEnemy(t, x, z, Object.assign({ group: 'yard', yaw: 0, patrol: [[x, z], [x + rand(-10, 10), z + rand(-10, 10)]] }, o));
      for (const t of H5.towers) addEnemy('sniper', t.x, t.z, Object.assign({ group: 'yard', y: 16, static: true, yaw: 0 }, o));
    }
    // HQ interior
    H5.door = new Door(0, -40, 'x', { w: 6, h: 5, locked: cp < 1 || (cp === 1 && false), label: 'HQ doors', lockedMsg: 'Sealed. Destroy the courtyard turrets.', stayOpen: true });
    if (cp >= 1) H5.door.openNow();
    new Door(0, -70, 'x', { label: 'Corridor' }); new Door(0, -120, 'x', { label: 'Server hall' });
    H5.ctrl = new Door(0, -165, 'x', { w: 4, h: 3.6, locked: cp < 3, label: 'Control room', lockedMsg: 'Locked. Destroy the three cores.' });
    if (cp <= 2) {
      for (const [x, z, t] of [[-40, -55, 'rifle'], [40, -55, 'rifle'], [-20, -64, 'shotgun'], [20, -64, 'shotgun'], [0, -50, 'heavy'], [-55, -60, 'rifle']]) addEnemy(t, x, z, Object.assign({ group: 'lobby', yaw: 0 }, o));
      // laser corridor
      for (const [z, y] of [[-80, 0.45], [-87, 1.5], [-94, 0.4], [-100, 1.45], [-106, 0.45], [-111, 1.5]]) new Tripwire(new V3(-3.8, y, z), new V3(3.8, y, z));
      for (const x of [-3, 3]) new Turret(x, 0, -118.5, { alarmOnly: true, active: false, yaw: 0, hp: 400, range: 50 });
      new SecCam(3.7, 6, -74, Math.PI / 2 + 0.5, { sweep: 0.3, range: 30 });
    }
    // cores
    if (cp <= 2) for (const cpos of H5.corePos) {
      const g = new THREE.Group(); part(g, new THREE.CylinderGeometry(2.2, 2.6, 1, 20), M.darkMetal, 0, 0.5, 0); const col = part(g, new THREE.CylinderGeometry(1.2, 1.2, 6, 20), new THREE.MeshStandardMaterial({ color: 0x200808, emissive: 0xff2a1a, emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.7 }), 0, 4, 0);
      const ring = part(g, new THREE.TorusGeometry(1.8, 0.08, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff4a3a }), 0, 3, 0, 0, 0, 0, false);
      g.position.copy(cpos); scene.add(g);
      const core = addTarget({ pos: cpos.clone().setY(3), hp: 1100, hpMax: 1100, radius: 1.6, dead: false, mesh: g, ring, colM: col, explMul: 2.2,
        damage(d) { if (this.dead) return; this.hp -= d; HUD.hit(false, false); this.colM.material.emissiveIntensity = 0.7 + 0.8 * (1 - this.hp / this.hpMax); if (this.hp <= 0) { this.dead = true; detonate(this.pos, 7, 60, { src: 'core', big: true }); this.mesh.traverse(o => { if (o.isMesh) o.material = M.burnt; }); addFire(this.pos, 1.4, 999); removeCol(this); HUD.feed('✕ CORE DESTROYED', 'gold'); Fixtures.alarm = 3; const left = H5.cores.filter(c => !c.dead).length; if (left) facilityWave5(); } },
        update(dt) { if (!this.dead) this.ring.rotation.z += dt * 2; }, dispose() { scene.remove(this.mesh); } }, new THREE.Box3(new V3(cpos.x - 2.2, 0, cpos.z - 2.2), new V3(cpos.x + 2.2, 7, cpos.z + 2.2)));
      core.col.cover = true; H5.cores.push(core);
      for (const [x, z, t] of [[cpos.x - 8, cpos.z + 6, 'rifle'], [cpos.x + 8, cpos.z - 4, pick(['shotgun', 'heavy'])]]) addEnemy(t, x, z, Object.assign({ group: 'hall', yaw: 0, patrol: [[x, z], [x + rand(-6, 6), z + rand(-6, 6)]] }, o));
    }
    // pickups
    pickups.push(new Pickup('ammo', new V3(-10, 0, -48))); pickups.push(new Pickup('health', new V3(12, 0, -48))); pickups.push(new Pickup('armor', new V3(-60, 0, -130))); pickups.push(new Pickup('ammo', new V3(60, 0, -130))); pickups.push(new Pickup('grenades', new V3(0, 0, -126)));
    pickups.push(new Pickup('health', new V3(-26, 0, -168))); pickups.push(new Pickup('ammo', new V3(26, 0, -168))); pickups.push(new Pickup('jack', new V3(-50, 0, -60)));
    pickups.push(new Pickup('jack', new V3(58, 0, -128))); pickups.push(new Pickup('jack', new V3(-24, 0, -168))); pickups.push(new Pickup('jack', new V3(24, 0, -168)));
    pickups.push(new Pickup('weapon', new V3(-12, 0.3, -30), { weapon: 'sniper' })); pickups.push(new Pickup('weapon', new V3(-62, 0.3, -128), { weapon: 'sniper' }));
    pickups.push(new Pickup('weapon', new V3(-8, 0, -30), { weapon: 'rocket' })); pickups.push(new Pickup('ammo', new V3(8, 0, -30)));
    for (const [x, z] of [[-10, 100], [12, 60], [-80, 20], [80, 40], [-30, -140], [30, -150]]) spawnBarrel(x, z, 0);
    let spawn, vehicle = null;
    if (cp === 0 && quiet) { spawn = [-168, -228, -0.7]; const gr = new THREE.Group(); part(gr, B(3, 2.4, 0.3), M.darkMetal, 0, 1.2, 0); gr.position.set(-170, 0, -238.6); scene.add(gr); actors.push({ update() { }, dispose() { scene.remove(gr); } }); }
    else if (cp === 0) { const apc = new Car('apc', 0, 400, 0); cars.push(apc); vehicle = apc; spawn = [-3, 400, 0]; player.pos.set(0, 0, 400); }
    else if (cp === 1) spawn = [0, -12, 0];
    else if (cp === 2) spawn = [0, -117, 0];
    else spawn = [0, -163, 0];
    if (cp >= 1 && !quiet) { const apc = new Car('apc', 14, -6, 0.3); cars.push(apc); }
    return { spawn, y: 0, loadout: ['pistol', 'shotgun', 'ar', 'rocket'], cur: 'ar', armor: 100, nades: 4, vehicle };
  },
  steps: [
    { id: 'gate', cp: 0, text: 'Assault the compound — breach the main gate', marker: () => new V3(0, 5, 160),
      enter() { after(1.5, () => HUD.say(LINES5.intro)); after(3, () => HUD.hint('Left click fires the APC autocannon · ram or shoot the gate', 6)); after(4, warSky); },
      update() { return (H5.gate || []).some(g => g.dead) || player.pos.z < 150; } },
    { id: 'turrets', text: 'Destroy the courtyard defense turrets', marker: () => { const t = H5.turrets.find(t => !t.dead); return t ? t.pos.clone().setY(4) : null; },
      enter() { HUD.say(LINES5.gate); after(15, () => new Heli(-200, 80, 0, { r: 60 })); after(25, () => new Heli(300, 90, -200, { drop: true, troops: 5, landAt: new V3(40, 0, 40), group: 'yard', enemyOpt: { color: 0x16181b, gear: 0x0b0c0d, visor: true } })); },
      update() { const d = H5.turrets.filter(t => t.dead).length; $('obj-sub').textContent = `${d} / ${H5.turrets.length} turrets destroyed`; return d >= H5.turrets.length; } },
    { id: 'breach', cp: 1, text: 'Breach the HQ — enter on foot', marker: () => new V3(0, 3, -44),
      enter() { H5.door.openNow(); HUD.say(Mission.flags.quiet ? LINES5.quiet : LINES5.door); if (!Mission.flags.w2) { Mission.flags.w2 = true; after(3, warSky); } },
      update() { return player.pos.z < -46 && Math.abs(player.pos.x) < 68 && !player.inVehicle; } },
    { id: 'lobby', text: 'Clear the lobby', marker: () => new V3(0, 3, -68),
      update() { const left = enemies.filter(e => e.group === 'lobby' && e.alive).length; $('obj-sub').textContent = left ? left + ' hostiles remaining' : ''; return left === 0 || player.pos.z < -72; } },
    { id: 'corridor', text: 'Get through the security corridor — avoid the lasers', marker: () => new V3(0, 2, -121),
      enter() { HUD.say(LINES5.corridor); }, update() { return player.pos.z < -121; } },
    { id: 'cores', cp: 2, text: 'Destroy the Blackline cores', marker: () => { const c = H5.cores.find(c => !c.dead); return c ? c.pos.clone().setY(8) : null; },
      enter() { HUD.say(LINES5.cores); },
      update() { const d = H5.cores.filter(c => c.dead).length; $('obj-sub').textContent = `${d} / 3 cores destroyed`; if (d >= 3) { H5.ctrl.unlock(); H5.ctrl.openNow(); return true; } return false; } },
    { id: 'maya', cp: 3, text: 'Confront Maya', marker: () => H5.boss && H5.boss.alive && !H5.boss.defeated ? H5.boss.pos.clone().setY(3) : new V3(0, 2, -168),
      enter() {
        H5.ctrl.unlock(); H5.ctrl.openNow();
        if (!H5.boss || !H5.boss.alive || H5.boss.disposed) { const b = new Boss(0, -192); enemies.push(b); b.pos.y = 1.4; H5.boss = b; }
        after(0.5, () => HUD.say(LINES5.maya)); AudioSys.combatTarget = 1;
      },
      update() {
        // safety net: if Maya is ever missing while undefeated, bring her back
        if (!Mission.flags.bossDown && (!H5.boss || H5.boss.disposed || !H5.boss.alive)) { const b = new Boss(0, -192); enemies.push(b); b.pos.y = 1.4; H5.boss = b; }
        return Mission.flags.bossDown && gameTime - Mission.flags.bossDown > 12;
      } },
    { id: 'choice', text: 'Make your choice', marker: null, silent: true,
      enter() { finalChoice(); }, update() { return false; } }
  ],
  intro: {
    lines: [[0, 'SOMEWHERE ABOVE THE CLOUDS, EVERY AIR FORCE ON EARTH IS AT WAR WITH AN ENEMY THAT HAS NO FLAG.', ''], [4800, 'BELOW, ONE MAN DRIVES TOWARD THE ONLY BUILDING THAT KNOWS WHY.', ''], [9000, 'THE WORLD WAS SUPPOSED TO END AT 11:59 PM.<br>IT IS 11:00.', 'big']],
    dur: 13000,
    fly(eye, look) { return [{ t: 0, pos: new V3(0, 120, -380), look: new V3(0, 20, -100) }, { t: 5, pos: new V3(60, 40, 250), look: new V3(0, 10, 160) }, { t: 7.5, pos: eye.clone().add(new V3(0, 3, 10)), look: eye.clone().add(new V3(0, 0, -30)) }]; }
  },
  afterReset(cp) { if (H5.quietStart) { H5.quietStart = false; Mission.go(2); } },
  complete() { }
};
function facilityWave5() {
  const o = { group: 'hall', combat: true, color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true };
  for (const [x, z] of [[-60, -160], [60, -160], [-60, -124], [60, -124]]) addEnemy(pick(['rifle', 'shotgun', 'heavy']), x, z, o);
  HUD.feed('⚠ REINFORCEMENTS', 'red');
}

/* ---------------- finale ---------------- */
let finalTimers = [];
function finalChoice() {
  storyChoice({ title: 'MAYA REYES', text: 'She kneels between you and the Blackline core. Seven cycles of lies — every one of them told to keep you alive. Or so she says.',
    a: ['TRUST HER', 'Shut the Blackline down together. Remind her, the way she always reminded you.'], b: ['SHOOT HER', 'End it the only way you can be sure. No Maya, no Kade, no more cycles.'] }, k => finale(k));
}
const FINALE = {
  a_killed: [['EVAN', 'Remind me how this ends.', 2.4], ['MAYA', '(quietly) We shut it down. Together. Whatever it takes.', 3.4], ['EVAN', 'Whatever it takes.', 2.2], ['MAYA', '(quietly) Evan... the screen. It\'s still counting.', 3.2], ['MAYA', 'Evan... you\'re not the player.', 3.6]],
  a_spared: [['EVAN', 'Remind me how this ends.', 2.4], ['MAYA', '(quietly) We shut it down. Together. Whatever it takes.', 3.4], ['SILAS', '(in person) Mercy, Mister Cross. I did warn you.', 2.8], ['EVAN', 'MAYA!', 1.4], ['MAYA', '(quietly) Evan... you\'re not the player.', 3.6]],
  b_killed: [['EVAN', 'I\'m sorry, Maya. It has to end with me.', 3], ['MAYA', '(quietly) You always say that.', 2.4], ['EVAN', '(raising the pistol) Not this time.', 2.2], ['MAYA', 'Evan... you\'re not the player.', 3.6]],
  b_spared: [['SILAS', '(PA) Do it, Mister Cross. Cycle eight is ready when you are.', 3.6], ['EVAN', '(raising the pistol) I\'m sorry, Maya.', 2.2], ['MAYA', '(quietly) You always say that.', 2.4], ['MAYA', 'Evan... you\'re not the player.', 3.6]]
};
function finale(choice) {
  showScreen(null); $('hud').classList.remove('hidden'); state = 'play';
  const silas = Story.get('silas', 'killed') === 'spared' ? 'spared' : 'killed', key = choice + '_' + silas, lines = FINALE[key];
  if (choice === 'a') achieve('remind', 'Remind Me', 'You trusted Maya');
  const b = H5.boss; if (b) { b.pos.set(0, 0, -181); b.mesh.position.copy(b.pos); b.yaw = 0; b.faceYaw = 0; }
  const bp = b ? b.pos.clone() : new V3(0, 0, -181);
  HUD.subsQ.length = 0; HUD.subT = 0; Tracers.clear(); FX.clear(); for (const e of enemies) if (e !== b && e.alive) e.die(null, false, 'none'); timers.length = 0;
  const eye = bp.clone().add(new V3(0, 1.1, 5.5)), look = bp.clone().add(new V3(0, 0.7, 0));
  player.pos.set(eye.x, bp.y, eye.z); player.yaw = yawTo(eye.x, eye.z, bp.x, bp.z); player.pitch = -0.1;
  cur = inv.golden ? 'golden' : 'pistol'; if (!inv[cur]) cur = Object.keys(inv)[0]; showVM(cur);
  if (choice === 'a') { for (const c of H5.cores) if (!c.dead) c.damage(9999); detonate(new V3(0, 5, -199), 4, 0, { src: 'screen' }); }
  HUD.say(lines);
  const total = lines.reduce((s, l) => s + l[2] + 0.35, 0) + 1.2, T = ms => finalTimers.push(setTimeout(ms[1], ms[0]));
  Cine.showVM = choice === 'b'; W.adsT = 0.6;
  Cine.play([{ t: 0, pos: eye.clone().add(new V3(1.5, 0.4, 2)), look }, { t: total * 0.45, pos: eye.clone(), look }, { t: total, pos: eye.clone().add(new V3(0, 0, -1.4)), look }], () => { });
  finalTimers.forEach(clearTimeout); finalTimers = [];
  const at = n => lines.slice(0, n).reduce((s, l) => s + l[2] + 0.35, 0) * 1000;
  if (key === 'a_spared') {
    const s = standIn(0, -197, { color: 0x2c2e33, gear: 0x111214, hairCol: 0x8a8884, y: 1.4, yaw: Math.PI, aim: 0.05 });
    T([at(2) + 200, () => { const m = s.m.muzzle.getWorldPosition(new V3()); Tracers.add(m, bp.clone().setY(1.1), true); AudioSys.shot('pistol', m); s.m.flash.visible = true; setTimeout(() => s.m.flash.visible = false, 60); if (b) { b.defeated = false; b.noShoot = true; Enemy.prototype.die.call(b, new V3(0, 0, 1), false, 'none'); } }]);
    T([at(3) + 300, () => { AudioSys.shot(cur === 'golden' ? 'golden' : 'pistol', null); addShake(0.3); s.m.root.rotation.x = -1.4; s.m.root.position.y = 1.5; }]);
  }
  if (choice === 'b') T([total * 1000 - 600, () => { if (b) b.parts.head.rotation.x = -0.3; }]);
  T([total * 1000 + 700, () => { $('fade').style.transition = 'none'; $('fade').classList.add('on'); AudioSys.combatTarget = 0; if (AudioSys.ctx) AudioSys.master.gain.setTargetAtTime(0.0001, AudioSys.ctx.currentTime, 0.05); }]);
  T([total * 1000 + 3000, () => { Cine.showVM = false; finalScreen(key); }]);
}
function finalScreen(key) {
  state = 'end'; if (document.pointerLockElement) document.exitPointerLock();
  $('hud').classList.add('hidden'); showScreen('final'); $('fade').style.transition = ''; $('fade').classList.remove('on');
  if (AudioSys.ctx) AudioSys.master.gain.setTargetAtTime(settings.vol, AudioSys.ctx.currentTime, 0.5);
  const msgs = key[0] === 'a' ? ['BLACKLINE CORE OFFLINE', 'OPERATOR CROSS, E. — NOT RESPONDING', 'ENGAGING CONTINGENCY', 'SEARCHING FOR PLAYER…'] : ['RE-SEEDING TIMELINE', 'ROLLING BACK TO 11:59', 'RESTORING OPERATOR PROFILE: CROSS, E.', 'SEARCHING FOR PLAYER…'];
  $('final-p2').classList.remove('show'); $('credits').classList.remove('show'); $('final-fill').style.width = '0%';
  msgs.forEach((m, i) => finalTimers.push(setTimeout(() => { $('final-msg').textContent = m; $('final-fill').style.width = ((i + 1) * 25) + '%'; AudioSys.ui('click'); }, 800 + i * 1300)));
  finalTimers.push(setTimeout(() => { $('final-msg').textContent = ''; $('final-p2').classList.add('show'); AudioSys.ui('achieve'); Store.del('save'); achieve('ch5', 'Player 2 Connected', 'You finished BLACKLINE: LAST HOUR'); }, 6600));
  const END = {
    a_killed: 'The Blackline went dark. Evan and Maya walked out into a sky with nothing in it.<br>Then, on every screen on Earth at once: 11:59.',
    a_spared: 'Silas Kade died on the control room floor. So did Maya Reyes.<br>At 11:59, the Blackline began looking for someone new.',
    b_killed: 'The clocks rolled back to 11:59.<br>Somewhere in Nevada, a convoy stopped at a checkpoint.',
    b_spared: 'The clocks rolled back to 11:59.<br>Somewhere in Nevada, a client named Silas Kade picked up a phone.'
  };
  finalTimers.push(setTimeout(() => {
    const t = Math.round(gameTime - stats.start);
    $('credits').innerHTML = END[key] + '<br><br>BLACKLINE: LAST HOUR<br>EVAN CROSS · MAYA REYES · SILAS KADE · DR. LENA VOSS · SCOTTY THE FISH (AS HIMSELF)<br>' + stats.kills + ' KILLS · ' + Math.floor(t / 60) + ' MIN THIS CHAPTER<br><button id="btn-final-menu">MAIN MENU</button>';
    $('credits').classList.add('show'); $('btn-final-menu').onclick = () => { finalTimers.forEach(clearTimeout); goMission(1, 'menu'); };
  }, 9500));
}
