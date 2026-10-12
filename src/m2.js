/* ============================================================
   CHAPTER 2 — BLACKLINE  (underground facility)
   Tunnel → security hub → maintenance tunnels → server hall
   → archive download (defend) → facility attack → escape
   ============================================================ */
const EGG_NAME = 'SCOTTY THE FISH';   // fictional fish; rename freely
const F2 = {};

function buildFacility() {
  WORLD = 300;
  const wallH = 4.4;
  // ---------- floors & ceilings ----------
  floorPlane(-5, -50, 5, 0, 0, M.floor); ceilPlane(-5, -50, 5, 0, 6, M.ceil);
  floorPlane(-18, -80, 18, -50, 0, M.floor); ceilPlane(-18, -80, 18, -50, 5, M.ceil);
  floorPlane(-40, -72, -18, -58, 0, M.floor); ceilPlane(-40, -72, -18, -58, 4.4, M.ceil);
  floorPlane(18, -59, 54, -54, 0, M.floor); ceilPlane(18, -59, 54, -54, 3.6, M.ceil);
  floorPlane(50, -112, 54, -59, 0, M.floor); ceilPlane(50, -112, 54, -59, 3.6, M.ceil);
  floorPlane(36, -88, 50, -84, 0, M.floor); ceilPlane(36, -88, 50, -84, 3.2, M.ceil);
  floorPlane(26, -90, 36, -82, 0, M.floor); ceilPlane(26, -90, 36, -82, 3.2, M.ceil);
  floorPlane(-10, -160, 56, -112, 0, M.floor); ceilPlane(-10, -160, 56, -112, 9, M.ceil);
  floorPlane(16, -168, 24, -160, 0, M.floor); ceilPlane(16, -168, 24, -160, 5, M.ceil);
  // ---------- walls ----------
  const W1 = { h: 6 }, WH = { h: 5 }, WC = { h: 3.6 }, WS = { h: 9 };
  wall(-5, 0, 5, 0, W1); wall(-5, 0, -5, -50, W1); wall(5, 0, 5, -50, W1);
  wall(-18, -50, 18, -50, Object.assign({ doors: [0], dw: 4, dh: 3.4 }, WH));
  wall(-18, -50, -18, -80, Object.assign({ doors: [-65] }, WH)); wall(18, -50, 18, -80, Object.assign({ doors: [-56.5] }, WH));
  wall(-18, -80, 18, -80, Object.assign({ doors: [0] }, WH));
  wall(-40, -58, -18, -58, { h: 4.4 }); wall(-40, -72, -18, -72, { h: 4.4 }); wall(-40, -58, -40, -72, { h: 4.4 });
  // security office (glass)
  wall(8, -70, 18, -70, { h: 3, t: 0.12, mat: M.glassB, doors: [11], dw: 1.6, dh: 2.6 }); wall(8, -70, 8, -80, { h: 3, t: 0.12, mat: M.glassB });
  solid(10.2, 0.4, 0.14, M.desk, 13, 0, -70, { col: false }); solid(0.14, 0.4, 10, M.desk, 8, 0, -75, { col: false });
  // maintenance tunnels
  wall(18, -54, 54, -54, WC); wall(18, -59, 50, -59, WC); wall(54, -54, 54, -112, WC);
  wall(50, -59, 50, -112, Object.assign({ doors: [-86], dw: 4 }, WC));
  wall(36, -84, 50, -84, { h: 3.2 }); wall(36, -88, 50, -88, { h: 3.2 });
  // easter-egg room behind the vent + alcove
  wall(36, -82, 36, -90, { h: 3.2, doors: [-86], dw: 2, dh: 1.25 });
  wall(26, -82, 36, -82, { h: 3.2 }); wall(26, -90, 36, -90, { h: 3.2 });
  wall(28, -82, 28, -90, { h: 3.2, doors: [-86], dw: 1.6, dh: 2.4 }); wall(26, -85, 28, -85, { h: 3.2 }); wall(26, -87, 28, -87, { h: 3.2 }); wall(26, -85, 26, -87, { h: 3.2 });
  // server hall + freight elevator
  wall(-10, -112, 56, -112, Object.assign({ doors: [52], dw: 3.4 }, WS)); wall(-10, -112, -10, -160, WS); wall(56, -112, 56, -160, WS);
  wall(-10, -160, 56, -160, Object.assign({ doors: [20], dw: 4, dh: 3.6 }, WS));
  wall(16, -160, 16, -168, { h: 5 }); wall(24, -160, 24, -168, { h: 5 }); wall(16, -168, 24, -168, { h: 5 });

  // ---------- tunnel props ----------
  const blast = new THREE.Mesh(B(9.6, 5.8, 0.6), M.hazard); blast.position.set(0, 2.9, -0.4); scene.add(blast);
  for (const x of [-1.2, 1.2]) solid(0.12, 0.1, 50, M.metal, x, 0, -25, { col: false, shadow: false });
  for (let z = -2; z > -50; z -= 1.4) solid(2.8, 0.06, 0.25, M.wood, 0, 0, z, { col: false, shadow: false });
  for (const [x, z] of [[-3.6, -12], [-3.4, -13.3], [3.5, -20], [-3.5, -34], [3.6, -42], [3.5, -43.3]]) crate(x, 0, z, 1.2, rand(-0.2, 0.2));
  for (const x of [-4.6, 4.6]) { const p = new THREE.Mesh(CYZ(0.18, 50, 10), M.pipe); p.position.set(x, 4.8, -25); scene.add(p); const p2 = new THREE.Mesh(CYZ(0.1, 50, 8), M.pipe); p2.position.set(x, 5.2, -25); scene.add(p2); }
  const cart = new THREE.Group(); part(cart, B(1.8, 1.0, 2.6), M.darkMetal, 0, 0.8, 0); for (const [x, z] of [[-0.7, -0.9], [0.7, -0.9], [-0.7, 0.9], [0.7, 0.9]]) part(cart, CYZ(0.25, 0.2).rotateY(Math.PI / 2), M.black, x, 0.25, z);
  cart.position.set(0, 0, -30); scene.add(cart); colliderFromObject(cart, 0, { cover: true, metal: true });
  sign('SECTOR A — INTAKE', 0, 5.2, -49.7, 0, { w: 3 });
  for (let z = -6; z > -50; z -= 8) lightPanel(0, 6, z, { i: 1.3, flicker: z === -38 ? 0.08 : 0 });
  // guard post in tunnel
  solid(2.4, 1.0, 0.8, M.desk, -3.8, 0, -46, { cover: true }); solid(0.5, 0.35, 0.05, M.screen, -3.8, 1.0, -46.2, { col: false });
  F2.panelD1 = new V3(2.4, 1.4, -49.4);
  solid(0.5, 0.7, 0.2, M.darkMetal, 2.4, 1.05, -49.6, { col: false }); solid(0.3, 0.2, 0.05, M.screen, 2.4, 1.4, -49.48, { col: false });

  // ---------- hub ----------
  for (const [x, z] of [[-9, -58], [9, -58], [-9, -72], [9, -72]]) solid(1.2, 5, 1.2, M.wallDark, x, 0, z, { cover: true, tile: 2 });
  for (const [x, z, r] of [[-12, -62, 0], [-4, -66, 0], [4, -62, 0]]) { solid(2.4, 0.9, 1.1, M.desk, x, 0, z, { cover: true }); solid(0.7, 0.45, 0.05, M.screen, x, 0.9, z - 0.3, { col: false }); }
  for (let i = 0; i < 6; i++) solid(0.8, 2.1, 0.6, M.metal, -17.3, 0, -68 - i * 0.85, { col: i % 2 === 0 });
  sign('SECTOR B — SECURITY', 0, 4.3, -50.3, Math.PI, { w: 3.2 });
  sign('SECTOR C — SEALED', 0, 4.3, -79.7, 0, { w: 3, fg: '#ff4a3a' });
  sign('MAINTENANCE', 17.7, 4.0, -56.5, -Math.PI / 2, { w: 2.2 }); sign('ARMORY', -17.7, 4.0, -65, Math.PI / 2, { w: 1.8 });
  // office
  solid(2.2, 0.9, 1, M.desk, 14, 0, -76, { cover: true }); solid(0.8, 0.5, 0.05, M.screen, 14, 0.9, -76.4, { col: false });
  F2.officeCard = new V3(15.2, 0.95, -75.8);
  F2.officeTerm = new V3(14, 1.2, -76.6);
  for (const [x, z] of [[-10, -54], [10, -54], [-10, -66], [10, -66], [-10, -76], [0, -60], [0, -72], [13, -75]]) lightPanel(x, 5, z, { i: 1.2 });
  // ---------- armory ----------
  for (let i = 0; i < 4; i++) solid(1.6, 2.2, 0.5, M.darkMetal, -37 + i * 4, 0, -71.4, { cover: false });
  solid(3, 0.9, 1.2, M.desk, -30, 0, -64, { cover: true });
  F2.arm = { sg: new V3(-37, 1.1, -70.8), sn: new V3(-33, 1.1, -70.8), rk: new V3(-29, 1.1, -70.8), jack: new V3(-30.8, 0.9, -64), nade: new V3(-29.2, 0.9, -64), armor: new V3(-38.5, 0, -60) };
  for (const x of [-34, -24]) lightPanel(x, 4.4, -65, { i: 1.2 });
  // ---------- maintenance tunnels ----------
  for (const [x0, z0, x1, z1] of [[18, -54.4, 54, -54.4], [53.6, -54, 53.6, -112]]) { const L = Math.hypot(x1 - x0, z1 - z0), p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, L, 8), M.pipe); p.position.set((x0 + x1) / 2, 3.0, (z0 + z1) / 2); if (z0 === z1) p.rotation.z = Math.PI / 2; else p.rotation.x = Math.PI / 2; scene.add(p); }
  for (const x of [24, 34, 44]) lightPanel(x, 3.6, -56.5, { i: 1.0, flicker: x === 34 ? 0.12 : 0 });
  for (const z of [-66, -78, -92, -104]) lightPanel(52, 3.6, z, { i: 1.0, flicker: z === -92 ? 0.1 : 0 });
  lightPanel(43, 3.2, -86, { i: 0.5, flicker: 0.2 });
  crate(52.6, 0, -95, 1.0); crate(51.2, 0, -80, 1.0, 0.3);
  F2.blackCard = new V3(52.8, 1.02, -95);
  // ---------- server hall ----------
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.35, metalness: 0.6, map: TEX.rack, emissive: 0xffffff, emissiveMap: TEX.rack, emissiveIntensity: 0.7 });
  TEX.rack.wrapS = TEX.rack.wrapT = THREE.RepeatWrapping;
  for (const z of [-120, -128, -144, -152]) for (const [x0, x1] of [[-1, 6], [10, 16], [24, 30], [34, 46]]) solid(x1 - x0, 2.6, 1.2, rackMat, (x0 + x1) / 2, 0, z, { cover: true, tile: 2.6 });
  // core
  const core = new THREE.Group(); core.position.set(20, 0, -136); scene.add(core);
  part(core, new THREE.CylinderGeometry(2.2, 2.6, 1.2, 24), M.darkMetal, 0, 0.6, 0);
  part(core, new THREE.CylinderGeometry(1.2, 1.2, 9, 24), new THREE.MeshStandardMaterial({ color: 0x0a1a24, roughness: 0.2, metalness: 0.8, emissive: 0x1a8fd0, emissiveIntensity: 0.5 }), 0, 4.5, 0);
  F2.rings = [];
  for (let i = 0; i < 4; i++) { const r = part(core, new THREE.TorusGeometry(1.7, 0.07, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x57c7ff }), 0, 2 + i * 1.8, 0, 0, 0, 0, false); F2.rings.push(r); }
  colliderFromObject(core, 0.35, { cover: true, metal: true });
  F2.coreTerm = new V3(20, 1.2, -132.6);
  solid(1.4, 1.1, 0.6, M.desk, 20, 0, -132.8, { col: false }); solid(1.1, 0.6, 0.05, M.screen, 20, 1.1, -133.1, { col: false });
  Fixtures.add(new V3(20, 4, -136), 0x57c7ff, 2.2, 22, 0);
  // raised platform (west) with stairs
  solid(6, 2.2, 26, M.wallDark, -7, 0, -136, { tile: 3 });
  for (let i = 0; i < 5; i++) solid(1.2, 0.44 * (i + 1), 2, M.metal, -3.4 + (4 - i) * 1.2, 0, -126, {});
  F2.plat = new V3(-7, 2.2, -136);
  for (const x of [-4, 10, 24, 38, 50]) for (const z of [-116, -136, -156]) lightPanel(x, 9, z, { i: 1.6, dist: 22 });
  sign('SERVER HALL — ARCHIVE CORE', 20, 6.5, -112.4, Math.PI, { w: 4, fg: '#57c7ff' });
  sign('FREIGHT ELEVATOR', 20, 4.3, -159.6, 0, { w: 3 });
  lightPanel(20, 5, -164, { i: 1.4 });

  // ---------- easter egg room ----------
  lightPanel(32, 3.2, -86, { i: 1.0 }); F2.eggLight = Fixtures.list[Fixtures.list.length - 1];
  const stand = solid(2.2, 0.9, 0.9, M.wood, 31.5, 0, -89.2, {});
  const tank = new THREE.Group(); tank.position.set(31.5, 0.9, -89.2); scene.add(tank);
  part(tank, B(2.0, 1.1, 0.8), new THREE.MeshStandardMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false }), 0, 0.55, 0, 0, 0, 0, false);
  part(tank, B(1.94, 0.9, 0.74), new THREE.MeshBasicMaterial({ color: 0x1a7ab0, transparent: true, opacity: 0.16, depthWrite: false }), 0, 0.48, 0, 0, 0, 0, false);
  part(tank, B(1.94, 0.1, 0.74), new THREE.MeshStandardMaterial({ color: 0xc9b07a, roughness: 1 }), 0, 0.05, 0);
  for (let i = 0; i < 3; i++) part(tank, new THREE.ConeGeometry(0.05, 0.4 + i * 0.1, 5), new THREE.MeshStandardMaterial({ color: 0x2f8a3a }), -0.7 + i * 0.12, 0.3, 0.1 - i * 0.1);
  const tl = new THREE.PointLight(0x57c7ff, 0, 5, 2); // (decorative; tank glow from basic material)
  F2.fish = buildFish(); F2.fish.position.set(31.5, 1.45, -89.2); scene.add(F2.fish);
  F2.tankCol = colliderFromObject(tank, 0, {}); F2.tankCol.noFX = true;
  const plaque = canvasTex(256, 96, (c, w, h) => { c.fillStyle = '#b8922a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6a5010'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = '#231a05'; c.textAlign = 'center'; c.font = 'bold 26px Georgia'; c.fillText(EGG_NAME, w / 2, 42); c.font = 'italic 18px Georgia'; c.fillText('Please do not shoot the glass.', w / 2, 72); });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshStandardMaterial({ map: plaque, roughness: 0.3, metalness: 0.7 })); pl.position.set(31.5, 0.55, -88.73); scene.add(pl);
  F2.eggCenter = new V3(31.5, 1.45, -89.2);
  solid(1.4, 0.1, 1.4, M.floor, 27, 0, -86, { col: false });

  // ---------- nav graph ----------
  const nodes = [[0, -5], [0, -20], [0, -38], [0, -48], [0, -54], [-12, -56], [12, -56], [-13, -69], [0, -68], [5, -76], [11, -71], [13, -76], [-16, -65], [-22, -65], [-32, -66], [16, -56.5], [22, -56.5], [36, -56.5], [52, -56.5], [52, -72], [52, -86], [52, -100], [52, -110], [45, -86], [52, -115],
    [40, -116], [28, -116], [20, -116], [8, -116], [-2, -116], [-8, -124], [8, -124], [20, -124], [32, -124], [48, -124], [52, -124], [-2, -136], [8, -136], [32, -136], [48, -136], [8, -140], [20, -140], [32, -140], [8, -148], [20, -148], [32, -148], [48, -148], [-6, -156], [8, -156], [20, -156], [32, -156], [50, -156], [20, -164], [-7, -130], [-7, -145], [-1, -122]];
  buildNav(nodes);
}

function eggTrigger() {
  if (Mission.flags.eggDone || !F2.fish) return;
  Mission.flags.eggDone = true; Mission.flags.eggT = 0;
  if (F2.tankCol && F2.tankCol.target) F2.tankCol.target.dead = true;
  FX.impact(F2.eggCenter.clone(), 'metal', new V3(0, 1, 0)); FX.sparks(F2.eggCenter.clone(), 16); AudioSys.ui('crash');
  F2.eggLight.on = false; F2.fish.visible = false;
  HUD.notify('IT\'S LIT.', EGG_NAME + ' approves', 'gold');
      if (AudioSys.ctx) { const t = AudioSys.now(); for (let i = 0; i < 16; i++) { AudioSys.osc(AudioSys.sfx, t + 0.6 + i * 0.25, 0.45, 'sine', 55, 32, 1.1, 0.01); if (i % 2) AudioSys.nz(AudioSys.sfx, t + 0.6 + i * 0.25 + 0.125, 0.06, 'highpass', 6000, 1, 0.2); } AudioSys.osc(AudioSys.sfx, t, 1.5, 'sawtooth', 110, 55, 0.12, 0.4); }
      after(2.5, () => { F2.dSecret.openNow(); pickups.push(new Pickup('weapon', new V3(27, 0.4, -86), { weapon: 'golden' })); HUD.hint('The wall panel opened... grab the golden gun', 4); });
}

function spawnFacility(cp) {
  if (F2.fish) F2.fish.visible = true; if (F2.eggLight) F2.eggLight.on = true;
  // THE FISH: shoot (or punch) the tank to wake him up
  if (F2.tankCol) F2.tankCol.target = { dead: false, pos: F2.eggCenter, damage() { if (!this.dead) { this.dead = true; eggTrigger(); } } };
  const g1 = 'tunnel', g2 = 'hub', g3 = 'maint', g4 = 'server';
  // doors
  F2.d1 = new Door(0, -50, 'x', { w: 4, h: 3.4, locked: cp === 0, label: 'Blast door', lockedMsg: 'Sealed. Use the override panel on the right.', stayOpen: true });
  if (cp > 0) F2.d1.openNow();
  F2.dArm = new Door(-18, -65, 'z', { locked: true, key: 'red', label: 'Armory door' });
  F2.dMaint = new Door(18, -56.5, 'z', { locked: cp < 2, key: 'red', label: 'Maintenance door' });
  F2.dSeal = new Door(0, -80, 'x', { locked: true, label: 'Sector C', lockedMsg: 'Sealed — structural collapse beyond.' });
  F2.dServer = new Door(52, -112, 'x', { w: 3.4, label: 'Server hall' });
  F2.dElev = new Door(20, -160, 'x', { w: 4, h: 3.6, locked: cp < 3, label: 'Freight elevator', lockedMsg: 'Elevator locked out.' });
  F2.dSecret = new Door(28, -86, 'z', { w: 1.6, h: 2.4, locked: true, label: 'Wall panel', lockedMsg: '...It is just a wall. Probably.', mat: M.wall, auto: true });
  // vent grate (shoot or punch it)
  const vg = new THREE.Group(); for (let i = 0; i < 6; i++) part(vg, B(0.05, 1.2, 0.05), M.metal, 0, 0.62, -0.9 + i * 0.36); part(vg, B(0.06, 0.06, 2), M.metal, 0, 1.2, 0); part(vg, B(0.06, 0.06, 2), M.metal, 0, 0.05, 0);
  vg.position.set(36, 0, -86); scene.add(vg);
  F2.vent = addTarget({ pos: new V3(36, 0.6, -86), hp: 10, radius: 0.8, dead: false, mesh: vg, explMul: 3,
    damage(d) { if (this.dead) return; this.hp -= d; if (this.hp <= 0) { this.dead = true; scene.remove(this.mesh); removeCol(this); FX.sparks(this.pos, 14); AudioSys.ui('crash'); HUD.hint('A crawlspace... (crouch with C)', 4); } },
    update() { }, dispose() { scene.remove(this.mesh); } }, new THREE.Box3(new V3(35.8, 0, -87), new V3(36.2, 1.25, -85)));
  // security cameras
  new SecCam(4.7, 3.6, -28, Math.PI / 2, { sweep: 0.6 });
  new SecCam(-17.6, 4.2, -52, -Math.PI / 2 - 0.4, { sweep: 0.55 });
  new SecCam(17.6, 4.2, -78, Math.PI / 2 - 0.3, { sweep: 0.5 });
  new SecCam(52, 3.3, -59.5, 0, { sweep: 0.25, range: 22 });
  new SecCam(55.6, 6.5, -114, Math.PI / 2 + 0.6, { sweep: 0.5, range: 22 });
  // terminals
  new Interact(F2.coreTerm, 'Start the archive download', () => { Mission.flags.dl = true; AudioSys.ui('radio'); }, { enabled: () => Mission.cur().id === 'core' });
  new Interact(new V3(-3.8, 1.2, -46.2), 'Read the shift log', () => showLore('SHIFT LOG — INTAKE POST 3', 'Convoy 7 never arrived.\nCommand says the package was <b>recovered in the field</b>.\nNobody recovered anything. I watched the feed.\nThe bombers came from nowhere. Again.\n\n— J. Okafor'));
  new Interact(F2.officeTerm, 'Access the security terminal', () => showLore('PERSONNEL ROSTER — CLEARANCE BLACK', 'OKAFOR, J. ........ INTAKE\nVANCE, R. ......... SECURITY\nREYES, M. ......... <b>HANDLER</b>\nCROSS, E. ......... <b>[RECORD SEALED]</b>\n\nFacility map uploaded: server hall reachable via maintenance.'));
  new Interact(new V3(-30, 1.2, -64.5), 'Read the note', () => showLore('HANDWRITTEN NOTE', 'If you are reading this, the cameras only see what is in front of them.\nShoot them. Or stay out of the yellow.\n\nAnd whoever keeps feeding the fish in the old maintenance room:\nit is NOT funny anymore.'), { enabled: () => true });
  // pickups
  if (cp <= 1) pickups.push(new Pickup('keycard', F2.officeCard, { key: 'red' }));
  pickups.push(new Pickup('weapon', F2.arm.sg, { weapon: 'shotgun' })); pickups.push(new Pickup('weapon', F2.arm.sn, { weapon: 'sniper' })); pickups.push(new Pickup('weapon', F2.arm.rk, { weapon: 'rocket' }));
  pickups.push(new Pickup('jack', F2.arm.jack)); pickups.push(new Pickup('grenades', F2.arm.nade)); pickups.push(new Pickup('armor', F2.arm.armor));
  pickups.push(new Pickup('ammo', new V3(3.5, 0, -44))); pickups.push(new Pickup('health', new V3(-12, 0, -60))); pickups.push(new Pickup('ammo', new V3(44, 0, -57)));
  pickups.push(new Pickup('ammo', new V3(-2, 0, -140))); pickups.push(new Pickup('armor', new V3(48, 0, -140))); pickups.push(new Pickup('health', new V3(8, 0, -156)));
  pickups.push(new Pickup('jack', new V3(44, 0, -59))); pickups.push(new Pickup('jack', new V3(46, 0, -140))); pickups.push(new Pickup('jack', new V3(30, 0, -87.5)));
  pickups.push(new Pickup('weapon', new V3(40, 0.3, -57), { weapon: 'sniper' })); pickups.push(new Pickup('weapon', new V3(-4, 0.3, -138), { weapon: 'sniper' }));
  for (const [x, z] of [[-3.6, -24], [16, -64], [-36, -60], [44, -150], [-4, -150], [30, -118]]) spawnBarrel(x, z, 0);
  // enemies
  if (cp === 0) {
    addEnemy('rifle', 2, -18, { group: g1, patrol: [[2, -18], [-2, -40], [2, -8]] });
    addEnemy('rifle', -3, -44, { group: g1, yaw: Math.PI });
  }
  if (cp <= 1) {
    addEnemy('rifle', -10, -62, { group: g2, patrol: [[-10, -62], [-12, -76], [4, -74]] });
    addEnemy('rifle', 10, -60, { group: g2, patrol: [[10, -60], [4, -54], [14, -64]] });
    addEnemy('shotgun', 0, -70, { group: g2, yaw: Math.PI });
    addEnemy('heavy', -4, -76, { group: g2, yaw: 0 });
    addEnemy('rifle', 13, -74, { group: g2, yaw: 0.5 });
    addEnemy('rifle', -28, -62, { group: 'armory', patrol: [[-28, -62], [-36, -68]] });
    addEnemy('shotgun', -22, -69, { group: 'armory', yaw: -Math.PI / 2 });
  }
  if (cp <= 2) {
    addEnemy('shotgun', 40, -56.5, { group: g3, patrol: [[40, -56.5], [24, -56.5]] });
    addEnemy('rifle', 52, -90, { group: g3, patrol: [[52, -90], [52, -106]] });
    addEnemy('rifle', 52, -70, { group: g3, yaw: 0 });
  }
  if (cp <= 2) {
    addEnemy('sniper', -7, -130, { group: g4, y: 2.2, static: true, yaw: -Math.PI / 2 });
    addEnemy('sniper', -7, -146, { group: g4, y: 2.2, static: true, yaw: -Math.PI / 2 });
    addEnemy('heavy', 20, -148, { group: g4, patrol: [[20, -148], [32, -140], [8, -140]] });
    addEnemy('rifle', 32, -124, { group: g4, patrol: [[32, -124], [48, -124], [48, -148]] });
    addEnemy('rifle', 8, -124, { group: g4, patrol: [[8, -124], [-2, -136], [8, -156]] });
    addEnemy('shotgun', 40, -136, { group: g4, yaw: 0 });
  }
}
function facilityWave(n) {
  const pts = [[52, -115], [48, -156], [-6, -156], [-1, -118]];
  const o = { group: 'wave', combat: true, color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true };
  for (let i = 0; i < n; i++) { const p = pts[(i + (Mission.flags.wave || 0)) % pts.length]; addEnemy(pick(['rifle', 'rifle', 'shotgun', 'heavy']), p[0] + rand(-1, 1), p[1] + rand(-1, 1), o); }
  Mission.flags.wave = (Mission.flags.wave || 0) + 1;
  HUD.feed('⚠ BLACKLINE RESPONSE TEAM', 'red');
}
function facilityCollapse() {
  if (Mission.cur().id !== 'escape' || !player.alive) return;
  const a = rand(0, TAU), r = rand(6, 12), x = clamp(player.pos.x + Math.cos(a) * r, -8, 54), z = player.pos.z + Math.sin(a) * r;
  detonate(new V3(x, rand(0.5, 3), z), 5, 45, { src: 'collapse' });
  Debris.burst(new V3(x, 6, z), 8, 1.6); FX.dust(new V3(x, 0.5, z), 16, true); addShake(0.4);
  if (Math.random() < 0.5) addFire(new V3(x, 0.4, z), 0.9, 40);
  after(rand(2.5, 4.5), facilityCollapse);
}

const LINES2 = {
  intro: [['MAYA', 'Coordinates check out. A mining tunnel that isn\'t on any survey.', 3.6], ['EVAN', 'Blast door\'s shut. There\'s an override panel.', 3], ['MAYA', 'Cameras on every corner. Shoot them or stay out of their sight — if they see you, the whole place wakes up.', 5]],
  hub: [['MAYA', 'Security hub. There should be a keycard in the office — glass room, north-east corner.', 4.2]],
  red: [['MAYA', 'Red card opens maintenance. And the armory, if you want to shop.', 3.6]],
  server: [['MAYA', 'That\'s the archive core. Plug in and pull everything. I\'ll watch the doors on the feed.', 4.2]],
  dl: [['MAYA', 'Download started. They\'ll know. Hold them off.', 3]],
  reveal: [['MAYA', '...Evan. Your name is in the archive.', 3], ['EVAN', 'Everyone\'s name is in an archive.', 2.6], ['MAYA', 'Not like this. "ASSET. STATUS: ACTIVE. MEMORY REVISION SEVEN."', 4.2], ['MAYA', 'You\'re not investigating the Blackline. You\'re part of it.', 3.6],
    ['SILAS', '(radio, cutting in) Mister Cross. Kade. Ask her who signed that file.', 3.6], ['EVAN', 'Kade? How are you on this channel?', 2.4], ['SILAS', 'I own the channel. Her initials are on every page. M.R.', 3.4], ['MAYA', 'Evan, turn him off.', 1.8], ['SILAS', 'Get topside, Mister Cross. And don\'t get in her car.', 3.2]],
  attack: [['MAYA', 'Explosions topside — someone\'s bringing the whole mountain down on you! Freight elevator, SOUTH wall, GO!', 5]],
  lift: [['EVAN', 'Maya... who erased me?', 2.6], ['MAYA', '...Get to the surface. We\'ll talk in the car.', 3]]
};

LEVELS[3] = {
  id: 3, mayaRadio: true, name: 'MISSION 2 — BLACKLINE', chapter: 'CHAPTER 2', title: 'BLACKLINE', sub: 'NORTHERN NEVADA · UNDERGROUND · 02:10',
  env: { grade: { lift: [0.0, 0.01, 0.025], gain: [0.94, 1.0, 1.06], sat: 0.95, contrast: 1.12, vig: 0.45, bloom: 0.9, threshold: 1.3 }, indoor: true, sky: [0, 0, 0], fog: [0x0a0c10, 18, 140], bg: 0x040506, sunCol: 0xffffff, sunI: 0, noShadow: true, hemi: [0x8a98b0, 0x1a1a1a, 0.32], amb: [0x404a5c, 0.28], exposure: 1.15, fixtures: 8, envCol: 0x252a31, groundCol: 0x2a2c30, vmHemi: 0xc8d4ff, vmI: 0.55, vmSun: 0xdfe8ff, vmSunI: 1.1 },
  h: () => 0, bounds: 300,
  build() { buildFacility(); },
  menuFocus: new V3(20, 0, -136),
  menuCam(t) { const r = 18; return { pos: new V3(20 + Math.cos(t * 3) * r, 5, -136 + Math.sin(t * 3) * r), look: new V3(20, 3, -136) }; },
  radar(c, tr) {
    c.fillStyle = 'rgba(160,190,220,0.08)'; c.strokeStyle = 'rgba(160,190,220,0.3)'; c.lineWidth = 1;
    for (const [x0, z0, x1, z1] of [[-5, -50, 5, 0], [-18, -80, 18, -50], [-40, -72, -18, -58], [18, -59, 54, -54], [50, -112, 54, -59], [36, -88, 50, -84], [-10, -160, 56, -112], [16, -168, 24, -160]]) {
      const pts = [tr(x0, z0), tr(x1, z0), tr(x1, z1), tr(x0, z1)]; c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); c.closePath(); c.fill(); c.stroke();
    }
  },
  tick(dt, menu) {
    if (F2.rings) F2.rings.forEach((r, i) => { r.rotation.y += dt * (0.4 + i * 0.2) * (Mission.flags.dl ? 4 : 1); r.position.y = 2 + i * 1.8 + Math.sin(gameTime * 1.3 + i) * 0.15; });
    if (F2.fish && F2.fish.visible) { const t = (menu ? realTime : gameTime); F2.fish.position.x = 31.5 + Math.sin(t * 0.35) * 0.6; F2.fish.position.y = 1.45 + Math.sin(t * 1.1) * 0.08; F2.fish.rotation.y = Math.cos(t * 0.35) > 0 ? 0 : Math.PI; }
    if (menu || !F2.eggCenter || Mission.flags.eggDone) return;
    // THE FISH: watch it for 30 uninterrupted seconds
    const d = camera.position.distanceTo(F2.eggCenter);
    camera.getWorldDirection(_v1); const to = _v2.copy(F2.fish.position).sub(camera.position).normalize();
    if (d < 5 && _v1.dot(to) > 0.965 && player.alive) { Mission.flags.eggT = (Mission.flags.eggT || 0) + dt; } else Mission.flags.eggT = 0;
    if (F2.vent && !F2.vent.dead && !Mission.flags.ventHint && player.pos.distanceTo(_v2.set(36, player.pos.y, -86)) < 6) { Mission.flags.ventHint = true; HUD.hint('That vent grate looks loose... shoot it', 4); }
    if (d < 4.5 && !Mission.flags.fishHint) { Mission.flags.fishHint = true; HUD.hint(EGG_NAME + ' is watching you. Shoot the tank.', 5); }
    if (Mission.flags.eggT >= 30) eggTrigger();
  },

  tips: ['Security cameras sweep a yellow cone. If it turns red you have a second to get out of sight — or shoot the camera.', 'Crouch-walk behind guards and punch? No — but a pistol headshot is silent enough to keep a room calm.', 'The download only progresses while you stay near the terminal.', 'Explosive barrels are scattered through the server hall.'],
  cpStep: [0, 1, 3, 5],
  reset(cp) {
    spawnFacility(cp);
    const spawns = [[0, -4, 0], [0, -48, 0], [52, -108, 0], [20, -130, Math.PI]];
    const lo = cp === 0 ? ['pistol', 'smg'] : ['pistol', 'smg', 'ar'];
    return { spawn: spawns[cp], y: 0, loadout: lo, cur: 'smg', armor: 25, nades: 2 };
  },
  onAlarm() { if (Mission.step < 4) Mission.data.alarmed = true; setTimeout(() => { if (Mission.step < 4 && !Mission.flags.alarmWave) { Mission.flags.alarmWave = true; } }, 0); },
  onKey(k) { if (k === 'red') { HUD.say(LINES2.red); } },
  steps: [
    { id: 'infil', cp: 0, text: 'Infiltrate the facility — override the blast door',
      marker: () => F2.panelD1,
      enter() { after(1, () => HUD.say(LINES2.intro)); after(2, () => HUD.hint('Cameras: stay out of the yellow cone or shoot them · C to crouch', 6)); F2.hackI = new Interact(F2.panelD1, 'Override the blast door', () => { Mission.flags.hack = 0.001; HUD.feed('OVERRIDE STARTED'); AudioSys.ui('radio'); }); },
      update(dt) {
        if (Mission.flags.hack) { Mission.flags.hack += dt / 6; $('obj-sub').textContent = 'Override ' + Math.min(100, Math.round(Mission.flags.hack * 100)) + '%'; if (Mission.flags.hack >= 1) { F2.d1.openNow(); AudioSys.ui('door'); return true; } }
        return false;
      } },
    { id: 'hub', cp: 1, text: 'Find the red keycard in the security office', marker: () => player.keys.has('red') ? null : F2.officeCard.clone().setY(1.5),
      enter() { after(1, () => HUD.say(LINES2.hub)); }, update() { return player.keys.has('red'); } },
    { id: 'maint', text: 'Take the maintenance tunnels to the server hall', marker: () => player.pos.x < 18 ? new V3(18, 1.5, -56.5) : new V3(52, 1.5, -112),
      enter() { F2.dMaint.unlock(); HUD.hint('Optional: the red keycard also opens the ARMORY (west door)', 5); }, update() { return player.pos.z < -114 && player.pos.x > -10 && player.pos.x < 56; } },
    { id: 'core', cp: 2, text: 'Reach the archive core', marker: () => F2.coreTerm, silent: false,
      enter() { HUD.say(LINES2.server); }, update() { return !!Mission.flags.dl; } },
    { id: 'download', text: 'Download the Blackline archive — defend the terminal', marker: () => F2.coreTerm,
      enter() { HUD.say(LINES2.dl); AudioSys.combatTarget = 1; Mission.flags.prog = 0; Mission.flags.nextWave = 0.12; for (const e of enemies) if (e.alive && e.group === 'server') { e.lastKnown.copy(player.pos); e.enterCombat(true); } },
      update(dt) {
        const near = player.pos.distanceTo(F2.coreTerm) < 15;
        if (near) Mission.flags.prog = Math.min(1, Mission.flags.prog + dt / 55);
        $('obj-sub').textContent = near ? `Downloading… ${Math.round(Mission.flags.prog * 100)}%` : `Paused ${Math.round(Mission.flags.prog * 100)}% — stay near the terminal`;
        if (Mission.flags.prog >= Mission.flags.nextWave && Mission.flags.nextWave < 0.9) { facilityWave(Mission.flags.nextWave < 0.3 ? 3 : 4); Mission.flags.nextWave += 0.28; }
        if (Mission.flags.prog >= 1 && !Mission.flags.revealT) {
          Mission.flags.revealT = gameTime; HUD.say(LINES2.reveal);
          showLore('BLACKLINE ARCHIVE — ASSET 0007', 'SUBJECT ......... <b>CROSS, EVAN</b>\nSTATUS .......... <b>ACTIVE</b>\nSERVICE ......... 17 YEARS (VERIFIED)\nMEMORY REVISION . <b>7</b> (last: 3 yrs ago)\nHANDLER ......... REYES, MAYA\n\nNOTE: subject retains procedural skill (flight, weapons).\nEpisodic memory prior to revision 7: <b>NONE</b>.', 16);
        }
        return Mission.flags.revealT && gameTime - Mission.flags.revealT > 13;
      } },
    { id: 'escape', cp: 3, text: 'ESCAPE — reach the freight elevator', marker: () => new V3(20, 1.5, -164),
      enter() {
        hideLore(); F2.dElev.openNow(); Fixtures.alarm = 999; sirenSound(120);
        HUD.say(LINES2.attack); HUD.notify('THE FACILITY IS UNDER ATTACK', 'Reach the freight elevator before it collapses', 'red');
        detonate(new V3(20, 7, -120), 8, 30, { src: 'collapse', big: true }); addShake(1);
        after(1, facilityCollapse);
        const o = { group: 'strike', combat: true, color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true };
        for (const [x, z, t] of [[50, -150, 'rifle'], [44, -118, 'shotgun'], [-4, -154, 'rifle'], [36, -156, 'heavy']]) addEnemy(t, x, z, o);
        Countdown.start(110, 'STRUCTURAL FAILURE', () => { if (!player.alive) return; showDeath.msg = 'The mountain came down. Head for the freight elevator on the south wall.'; hurtPlayer(9999); });
      },
      update() { return player.pos.z < -161 && player.pos.x > 16 && player.pos.x < 24; } }
  ],
  intro: {
    lines: [[0, 'THE COORDINATES LEAD TO A MOUNTAIN IN NORTHERN NEVADA.', ''], [3800, 'NO ROADS. NO RECORDS. NO NAME.', ''], [7200, 'ONLY A WORD, STENCILED ON THE BLAST DOOR:<br>BLACKLINE', 'big']],
    dur: 11000,
    fly(eye, look) { return [{ t: 0, pos: new V3(0, 4.5, -46), look: new V3(0, 2, -4) }, { t: 4, pos: new V3(2, 3, -16), look: new V3(0, 2, -2) }, { t: 6, pos: eye.clone(), look: look.clone() }]; }
  },
  complete() {
    Countdown.stop(); Fixtures.alarm = 0;
    achieve('ch2', 'Asset Status: Active', 'Chapter 2 complete');
    if (!Mission.data.alarmed) achieve('ghost', 'Ghost', 'No alarms before the archive');
    showEnding({
      lines: [[400, '<span class="ev">EVAN</span> The archive says I\'ve been doing this for seventeen years.'], [3400, '<span class="my">MAYA</span> The archive also says the sky is safe.'], [6200, 'The freight elevator surfaces into a burning valley. Maya is waiting in an armored SUV.'], [9400, 'On the horizon, a city is going dark — block by block.'], [12000, '<span class="my">MAYA</span> They\'re not hunting us, Evan. They\'re clearing the board.'], [15200, '<span class="ev">EVAN</span> Kade says you signed my file.'], [17800, '<span class="my">MAYA</span> Kade says a lot of things.'], [20200, '<span class="ev">EVAN</span> That\'s not a no.'], [22400, '<span class="my">MAYA</span> ...No. It isn\'t.'], [24400, 'He gets in the car anyway.']],
      cardAt: 26500, chapter: 'END OF CHAPTER 2', title: 'BLACKLINE', next: 4, tease: 'NEXT — FLASHBACK: THE SAFEHOUSE · SEVEN YEARS AGO'
    });
  }
};
