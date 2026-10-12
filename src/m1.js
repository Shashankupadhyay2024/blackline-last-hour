/* ============================================================
   CHAPTER 1 — THE CONVOY  (Nevada desert)
   ============================================================ */
const CONVOY = { armZ: -12, t1: 6, t2: 24, hum: 42, barrierZ: -30, pickupZ: -44 };
const rxz = z => roadX(z);

function spawnConvoyProps(wrecked) {
  const mk = (mesh, z, dx, yaw, name) => {
    const x = rxz(z) + dx; mesh.position.set(x, terrainH(x, z), z); mesh.rotation.y = yaw || 0;
    const p = new Prop(name, mesh, { hp: 260, metal: true, shrink: 0.08 }); props.push(p); if (wrecked) p.destroy(); return p;
  };
  CONVOY.truck1 = mk(buildTruck(), CONVOY.t1, 0, 0.02, 'truck');
  CONVOY.truck2 = mk(buildTruck(), CONVOY.t2, 0.4, -0.03, 'truck');
  CONVOY.humvee = mk(buildHumvee(), CONVOY.hum, 7.5, 0.35, 'humvee');
  CONVOY.barriers = [];
  if (!wrecked) {
    for (const dx of [-3.4, 0, 3.4]) {
      const g = new THREE.Group(); part(g, B(3.1, 0.85, 0.6), M.concrete, 0, 0.42, 0); part(g, B(3.1, 0.12, 0.62), M.barrelStripe, 0, 0.7, 0);
      const z = CONVOY.barrierZ, x = rxz(z) + dx; g.position.set(x, terrainH(x, z), z);
      const p = new Prop('barrier', g, { hp: 150, remove: true }); props.push(p); CONVOY.barriers.push(p);
    }
  }
  for (const [dx, z] of [[-7, 10], [-7.6, 11], [8, 20], [9, -20], [-8.5, -24], [7.5, 48]]) spawnBarrel(rxz(z) + dx, z);
}
function spawnCampDynamic() {
  const cx = CAMP.x, cz = CAMP.z;
  for (const [x, z] of [[cx - 5, cz + 6], [cx + 13, cz - 3], [cx - 11, cz - 1]]) spawnBarrel(x, z, CAMP_H);
  pickups.push(new Pickup('weapon', CAMPPTS.table, { weapon: 'ar', table: true }));
  pickups.push(new Pickup('weapon', CAMPPTS.smg, { weapon: 'smg', table: true }));
  pickups.push(new Pickup('jack', CAMPPTS.jack));
  pickups.push(new Pickup('ammo', new V3(cx - 2, CAMP_H, cz - 3.5)));
  pickups.push(new Pickup('armor', new V3(cx - 3.5, CAMP_H, cz - 3.2)));
  pickups.push(new Pickup('grenades', new V3(cx + 1.5, CAMP_H, cz - 3.3)));
  pickups.push(new Pickup('weapon', new V3(cx - 7, CAMP_H + 0.3, cz + 3), { weapon: 'sniper' }));
  pickups.push(new Pickup('jack', new V3(cx + 4, CAMP_H, cz + 3)));
}
function spawnCampEnemies() {
  const cx = CAMP.x, cz = CAMP.z, g = 'camp';
  addEnemy('rifle', cx - 16, cz - 12, { group: g, patrol: [[cx - 16, cz - 12], [cx - 16, cz + 8], [cx + 4, cz + 16], [cx + 16, cz - 16]] });
  addEnemy('rifle', cx - 20, cz - 5, { group: g, yaw: -Math.PI / 2 - 0.4 });
  addEnemy('shotgun', cx + 3, cz + 6, { group: g, patrol: [[cx + 3, cz + 6], [cx - 6, cz + 8], [cx + 6, cz]] });
  addEnemy('sniper', CAMPPTS.tower.x, CAMPPTS.tower.z, { group: g, y: CAMPPTS.tower.y, static: true, yaw: yawTo(CAMPPTS.tower.x, CAMPPTS.tower.z, rxz(60), 60) });
}
function spawnConvoyEnemies() {
  const g = 'convoy';
  addEnemy('rifle', rxz(-2) + 5, -2, { group: g, patrol: [[rxz(-2) + 5, -2], [rxz(34) + 5, 34], [rxz(34) - 5, 34], [rxz(-2) - 5, -2]] });
  addEnemy('rifle', rxz(16) - 5, 16, { group: g, yaw: Math.PI / 2 });
  addEnemy('rifle', rxz(-30) + 11, -27, { group: g, yaw: 0.8, patrol: [[rxz(-30) + 11, -27], [rxz(-38) + 6, -38]] });
  addEnemy('rifle', rxz(-44) - 5, -46, { group: g, yaw: 2.5 });
  addEnemy('shotgun', rxz(2) - 4, 2, { group: g, patrol: [[rxz(2) - 4, 2], [rxz(30) - 4, 30]] });
  addEnemy('shotgun', rxz(32) + 4, 33, { group: g, yaw: -1.2 });
  addEnemy('heavy', rxz(-20) + 2, -21, { group: g, yaw: Math.PI, patrol: [[rxz(-20) + 2, -21], [rxz(-20) - 3, -21]] });
  addEnemy('sniper', MESA1.x, MESA1.z, { group: g, y: MESA1.top, static: true, yaw: -Math.PI / 2 });
  addEnemy('sniper', MESA2.x, MESA2.z, { group: g, y: MESA2.top, static: true, yaw: Math.PI / 2 + 0.6 });
}
function spawnJeep(x, z, side, o) {
  o = o || {};
  const car = new Car(o.kind || 'jeep', x, z, o.yaw || 0); cars.push(car);
  const eo = Object.assign({ group: 'chase', mount: car, combat: true }, o.enemyOpt || {});
  const drv = addEnemy('rifle', x, z, Object.assign({}, eo, { mountOff: [-0.45, 0.35, -0.3], noShoot: true }));
  const gun = addEnemy('rifle', x, z, Object.assign({}, eo, { mountOff: o.kind === 'suv' ? [0.45, 1.3, 0.4] : [0, 0.9, 1.0], hpMul: 0.9 }));
  gun.T = Object.assign({}, ETYPES.rifle, { rpm: 520, burst: [6, 12], dmg: 7, range: 90, acc: 0.26 });
  car.crew = [drv, gun]; car.ai = { type: 'chase', driver: drv, side };
  return car;
}

const LINES1 = {
  intro: [['SILAS', 'Mister Cross. Silas Kade. You don\'t know me. I know your work.', 3.6], ['SILAS', 'One armored truck, one briefcase, two million on delivery. Maya Reyes will be your eyes.', 4.8], ['EVAN', 'Maya\'s in on this?', 1.8],
    ['MAYA', 'Evan. Convoy stopped at the Highway 7 checkpoint. Three trucks, one armored.', 4.2], ['EVAN', 'One last job, Maya.', 2.2], ['MAYA', 'You always say that. Supply camp is east of the road — you are not walking in there with a pistol.', 5], ['MAYA', 'Stay low. Crouch and they will have a harder time spotting you.', 3.6]],
  armed: [['MAYA', 'Better. Now the convoy. Whatever is in that armored truck, somebody paid a lot to bury it.', 4.6], ['MAYA', 'Snipers on the mesas either side of the road. Watch for the red lasers.', 4]],
  strike: [['MAYA', 'Evan — fast movers on radar. No transponders. No flags.', 3.6], ['EVAN', 'Whose are they?', 1.8], ['MAYA', '...Nobody\'s.', 2.4]],
  run: [['MAYA', 'The armored truck is running north! There\'s a pickup past the checkpoint — take it!', 4.2]],
  chase: [['MAYA', 'Stay on it. Do not let that truck reach the pass.', 3.4]],
  jeeps: [['MAYA', 'Two technicals on your six! Shoot the drivers or run them off the road.', 4]],
  bomber: [['MAYA', 'Heavy bomber overhead — Evan, it\'s carpet-bombing the highway!', 3.6], ['EVAN', 'Of course it is.', 1.8]],
  crash: [['MAYA', '...Evan? Tell me you\'re still breathing.', 3], ['EVAN', 'Still breathing. The truck\'s on its side.', 2.6], ['MAYA', 'Hostiles at the wreck. Clear them. Get the case. Do NOT open it.', 3.8]],
  case: [['EVAN', '...Too late.', 2]],
  silas: [['SILAS', 'Mister Cross. That case is my property. Do not open it.', 3.4], ['EVAN', 'Wouldn\'t dream of it.', 1.8]]
};

function airstrike() {
  AudioSys.combatTarget = 1;
  HUD.notify('UNMARKED AIRCRAFT INBOUND', 'Get clear of the convoy', 'red');
  HUD.say(LINES1.strike);
  const tz = 15;
  after(0.8, () => jetPass([{ pos: CONVOY.truck1.pos.clone(), ref: CONVOY.truck1 }, { pos: CONVOY.truck2.pos.clone(), ref: CONVOY.truck2 }], { z: tz, side: 1, alt: 120, fromV: new V3(-900, 120, tz + 30), toV: new V3(900, 100, tz) }));
  after(1.6, () => jetPass([{ pos: CONVOY.humvee.pos.clone(), ref: CONVOY.humvee }, { pos: new V3(rxz(-26) + 9, terrainH(rxz(-26) + 9, -26) + 1, -26), count: 2 }], { fromV: new V3(900, 100, tz - 40), toV: new V3(-900, 90, tz) }));
  after(4.5, () => {
    if (!armored) return;
    armored.ai = { type: 'road', speedFn: truckSpeed }; Mission.flags.truckRunning = true;
    HUD.say(LINES1.run); HUD.notify('THE ARMORED TRUCK IS RUNNING', 'Take the pickup and chase it', 'red');
  });
  scheduleStrafe(11);
  for (const e of enemies) if (e.alive && e.group === 'convoy') { e.lastKnown.copy(player.pos); e.enterCombat(); }
}
function scheduleStrafe(t) {
  after(t, () => {
    const s = Mission.cur(); if (!s || (s.id !== 'strike' && s.id !== 'chase') || !player.alive) return;
    const base = player.inVehicle ? player.inVehicle.pos.clone().add(new V3(player.inVehicle.fwdX * 40, 0, player.inVehicle.fwdZ * 40)) : player.pos.clone();
    const tg = []; for (let i = 0; i < 2; i++) { const a = rand(0, TAU), r = rand(14, 30); const x = base.x + Math.cos(a) * r, z = base.z + Math.sin(a) * r; tg.push({ pos: new V3(x, terrainH(x, z) + 0.5, z), count: 2 }); }
    jetPass(tg, { z: base.z });
    scheduleStrafe(rand(9, 14));
  });
}
function truckSpeed(car) {
  const d = car.pos.distanceTo(player.pos);
  if (Mission.flags.bomberOut) return 13;
  if (car.pos.z < -470) return 0;
  return d > 240 ? 10 : d < 70 ? 25 : 20;
}
function bomberRun() {
  Mission.flags.bomberOut = true;
  HUD.say(LINES1.bomber); HUD.notify('HEAVY BOMBER', 'Get off the highway!', 'red');
  const z0 = player.pos.z + 520, z1 = armored.pos.z - 700;
  const from = new V3(rxz(z0) - 20, 115, z0), to = new V3(rxz(z1) + 10, 115, z1);
  let dropT = 0;
  const b = new Aircraft('bomber', from, to, 95, {
    bank: 0, bomb: (a, dt) => {
      if (!armored) return;
      const tz = a.pos.z - 150;
      if (tz > armored.pos.z + 260 || tz < armored.pos.z - 70) return;
      dropT -= dt; if (dropT > 0) return; dropT = 0.26;
      let tx = rxz(tz) + rand(-4, 4), tzz = tz;
      if (!armored.crashed && Math.abs(tz - armored.pos.z) < 26) { tx = armored.pos.x; tzz = armored.pos.z - armored.speed * 2; }
      projectiles.push(new Projectile('bomb', a.pos.clone().setY(a.pos.y - 3), new V3(), { owner: 'air', target: new V3(tx, terrainH(tx, tzz), tzz), dur: 2.1 }));
    }
  });
  aircraft.push(b);
  after(1.5, () => jetPass([], { fromV: new V3(from.x - 40, 150, from.z + 100), toV: new V3(to.x - 40, 140, to.z) }));
  after(1.9, () => jetPass([], { fromV: new V3(from.x + 40, 150, from.z + 100), toV: new V3(to.x + 40, 140, to.z) }));
  after(13, () => { if (armored && !armored.crashed) truckHit(); });
}
function truckHit() {
  if (!armored || armored.crashed) return;
  detonate(armored.pos.clone().setY(armored.pos.y + 1), 9, 120, { src: 'air', big: true });
  armored.crash(); Mission.flags.crashT = gameTime + 1.5;
  armored.mesh.traverse(o => { if (o.isMesh && o.material !== M.glass && Math.random() < 0.6) o.material = M.burnt; });
  armored.fire = addFire(armored.pos.clone().setY(armored.pos.y + 1.5), 1.6, 400);
  timeScale = 0.3; slowUntil = realTime + 2.2; document.body.classList.add('cine-bars'); setTimeout(() => document.body.classList.remove('cine-bars'), 2600);
  addShake(1);
  after(3, () => { Mission.data.crash = { x: armored.pos.x, z: armored.pos.z, yaw: armored.yaw, dir: armored.spinDir || 1 }; });
}
function roadCrater(x, z, fresh) {
  Decals.scorch(x, z, 5.5);
  if (fresh) addFire(new V3(x, terrainH(x, z) + 0.3, z), 0.9, 25);
  for (let i = 0; i < 3; i++) {
    const a = rand(0, TAU), r = rand(2.5, 4.5), px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
    const m = new THREE.Mesh(B(rand(1.6, 2.8), 0.35, rand(1.2, 2.2)), M.asphalt); m.castShadow = true;
    m.position.set(px, terrainH(px, pz) + 0.35, pz); m.rotation.set(rand(-0.5, 0.5), rand(0, 3), rand(-0.5, 0.5));
    props.push(new Prop('slab', m, { hp: 9999, cover: false }));
  }
}
function crashSite() {
  const c = Mission.data.crash || { x: armored.pos.x, z: armored.pos.z };
  if (!Mission.flags.crashLines) { Mission.flags.crashLines = true; HUD.say(LINES1.crash); HUD.say(LINES1.silas); }
  if (!enemies.some(e => e.group === 'crash')) {
    const o = { group: 'crash', color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true, hpMul: 1.1 };
    const pts = [[14, -26, 'rifle'], [-12, -30, 'rifle'], [6, -40, 'shotgun'], [-4, -48, 'heavy'], [20, -52, 'rifle']];
    for (const [dx, dz, t] of pts) { const z = c.z + dz, x = rxz(z) + dx; addEnemy(t, x, z, Object.assign({ yaw: 0 }, o, { patrol: [[x, z], [x + rand(-6, 6), z + rand(4, 10)]] })); }
    addEnemy('sniper', MESA3.x, MESA3.z, Object.assign({}, o, { y: MESA3.top, static: true, yaw: Math.PI / 2 }));
    HUD.notify('BLACKLINE OPERATIVES', 'Hostiles at the crash site', 'red');
  }
  if (!Mission.flags.case) {
    const bx = armored.pos.x - armored.fwdX * 5, bz = armored.pos.z - armored.fwdZ * 5;
    const p = new Pickup('briefcase', new V3(bx, terrainH(bx, bz) + 0.02, bz)); p.mesh.rotation.set(0, rand(0, 3), 0); pickups.push(p); Mission.flags.case = p;
    pickups.push(new Pickup('health', new V3(bx + 2, terrainH(bx + 2, bz + 1), bz + 1)));
    pickups.push(new Pickup('ammo', new V3(bx - 2, terrainH(bx - 2, bz + 2), bz + 2)));
    pickups.push(new Pickup('jack', new V3(bx + 3, terrainH(bx + 3, bz - 2), bz - 2)));
    pickups.push(new Pickup('weapon', new V3(bx - 3, terrainH(bx - 3, bz - 2) + 0.3, bz - 2), { weapon: 'sniper' }));
    const jx = MESA3.x - 8, jz = MESA3.z + 9; pickups.push(new Pickup('jack', new V3(jx, terrainH(jx, jz), jz)));
    const rx2 = rxz(c.z + 30) - 12; pickups.push(new Pickup('weapon', new V3(rx2, terrainH(rx2, c.z + 30), c.z + 30), { weapon: 'rocket' }));
  }
}

LEVELS[1] = {
  id: 1, mayaRadio: true, name: 'MISSION 1 — THE CONVOY', chapter: 'CHAPTER 1', title: 'THE CONVOY', sub: 'NEVADA DESERT · 18:52 · EVAN CROSS',
  env: { grade: { lift: [0.02, 0.005, 0.0], gain: [0.98, 0.96, 0.94], sat: 1.0, contrast: 1.1, vig: 0.34, bloom: 0.55, threshold: 2.6 }, clouds: 0.35, cloudCol: 0xffd0a8, sky: [0x1b2a55, 0xd4704a, FOG_COL], fog: [FOG_COL, 140, 1050], sunDir: new V3(-0.78, 0.26, 0.42), sunCol: 0xffbe86, sunI: 2.3, hemi: [0xffd4a8, 0x6a4632, 0.4], amb: [0x3a4666, 0.15], exposure: 0.98 },
  h: desertH, onRoad: desertOnRoad, bounds: 520,
  build() { WORLD = 520; buildDesert(); },
  menuFocus: new V3(0, 0, 10),
  menuCam(t) { const cx = rxz(10), r = 70, x = cx + Math.cos(t) * r, z = 10 + Math.sin(t) * r; return { pos: new V3(x, terrainH(x, z) + 14, z), look: new V3(cx, 3, 10) }; },
  radar(c, tr, px, pz) { c.strokeStyle = 'rgba(200,190,170,0.35)'; c.lineWidth = 4; c.beginPath(); for (let z = pz - 120; z <= pz + 120; z += 8) { const [x, y] = tr(roadX(z), z); z === pz - 120 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); },
  tick(dt, menu) { if (campLight) campLight.intensity = 1.4 + Math.random() * 0.5; if (!menu && Math.random() < dt * 20) FX.fire(CAMPPTS.fire, 0.45); },
  tips: ['Snipers telegraph their shots with a red laser. Break line of sight when you see one.', 'Crouching (C) makes you harder to spot and steadies your aim.', 'Explosive barrels chain-react. Use them.', 'Shoot the driver of a technical to stop it cold.', 'The BOTTLE OF JACK halves incoming damage for 15 seconds.'],
  cpStep: [0, 1, 2, 4],
  reset(cp, sv) {
    spawnConvoyProps(cp >= 3);
    spawnCampDynamic();
    if (cp <= 2) {
      armored = new Car('armored', rxz(CONVOY.armZ), CONVOY.armZ, 0); armored.enterable = false; armored.skipCol = false; cars.push(armored);
      pickupCar = new Car('pickup', rxz(CONVOY.pickupZ) - 9, CONVOY.pickupZ, 0.05); cars.push(pickupCar);
    } else {
      const c = Mission.data.crash || { x: rxz(-400), z: -400, yaw: 0.1, dir: 1 }; Mission.data.crash = c; Mission.data.craters = Mission.data.craters || [];
      armored = new Car('armored', c.x, c.z, c.yaw); armored.enterable = false; armored.setCrashed(c.x, c.z, c.yaw, c.dir); cars.push(armored);
      armored.mesh.traverse(o => { if (o.isMesh && o.material !== M.glass) o.material = M.burnt; });
      armored.fire = addFire(armored.pos.clone().setY(armored.pos.y + 1.5), 1.6, 400);
      const pz = c.z + 75; pickupCar = new Car('pickup', rxz(pz) + 2, pz, 0); cars.push(pickupCar);
      for (const [x, z] of Mission.data.craters) roadCrater(x, z, false);
      Mission.flags.bomberOut = true;
    }
    if (!Mission.data.craters) Mission.data.craters = [];
    if (cp === 0) spawnCampEnemies();
    if (cp <= 1) spawnConvoyEnemies();
    let sp;
    if (cp === 0) sp = [175, 150, yawTo(175, 150, CAMP.x, CAMP.z)];
    else if (cp === 1) sp = [CAMP.x - 6, CAMP.z - 8, yawTo(CAMP.x, CAMP.z, rxz(10), 10)];
    else if (cp === 2) sp = [rxz(62) + 9, 62, 0.1];
    else sp = [pickupCar.pos.x - 3, pickupCar.pos.z + 1, 0];
    return { spawn: sp, y: cp === 0 ? terrainH(sp[0], sp[1]) : undefined, loadout: ['pistol'] };
  },
  steps: [
    { id: 'camp', cp: 0, text: 'Steal weapons from the supply camp',
      marker: () => CAMPPTS.table.clone().setY(CAMPPTS.table.y + 1),
      enter() { after(1.5, () => HUD.say(LINES1.intro)); after(3, () => HUD.hint('WASD move · SHIFT sprint · C crouch · E interact · RMB aim', 7)); },
      update() { return !!(inv.ar || inv.smg || inv.shotgun || inv.sniper); } },
    { id: 'convoy', cp: 1, text: 'Ambush the convoy — take down the guards',
      marker: () => new V3(rxz(10), terrainH(rxz(10), 10) + 3, 10),
      enter() { HUD.say(LINES1.armed); },
      update() {
        const dead = enemies.filter(e => e.group === 'convoy' && !e.alive).length;
        const near = armored && player.pos.distanceTo(armored.pos) < 16;
        const total = enemies.filter(e => e.group === 'convoy').length;
        $('obj-sub').textContent = `${dead} / ${Math.min(6, total)} guards down`;
        return dead >= 6 || near || (dead >= 3 && Mission.stepT > 150);
      } },
    { id: 'strike', cp: 2, text: 'Get to the pickup truck past the checkpoint',
      marker: () => pickupCar && !pickupCar.dead ? pickupCar.pos.clone().setY(pickupCar.pos.y + 3) : null,
      enter() { airstrike(); },
      update() { return !!player.inVehicle || (armored && armored.pos.z < -150 && Mission.stepT > 25); } },
    { id: 'chase', text: 'Chase the armored truck',
      marker: () => armored ? armored.pos.clone().setY(armored.pos.y + 4) : null,
      enter() { after(3.5, () => { const pz = player.pos.z; for (const [dz, s] of [[110, -1], [140, 1]]) { const z = Math.min(pz + dz, 490); spawnJeep(rxz(z) + s * 4, z, s); } HUD.say(LINES1.jeeps); }); },
      update(dt) {
        if (armored && !armored.crashed) {
          for (const b of CONVOY.barriers) if (!b.dead && b.pos.distanceTo(armored.pos) < 5) { b.destroy(); AudioSys.ui('crash'); FX.sparks(b.pos, 20); }
          if (!Mission.flags.bomberOut && armored.pos.z < -290 && (armored.pos.distanceTo(player.pos) < 230 || Mission.stepT > 70)) bomberRun();
        }
        return armored && armored.crashedStatic && Mission.flags.crashT && gameTime - Mission.flags.crashT > 2.2;
      } },
    { id: 'crash', cp: 3, text: 'Reach the crashed armored truck',
      marker: () => armored ? armored.pos.clone().setY(armored.pos.y + 4) : null,
      enter() { crashSite(); },
      update() { return armored && player.pos.distanceTo(armored.pos) < 11; } },
    { id: 'case', text: 'Recover the briefcase',
      marker: () => Mission.flags.case ? Mission.flags.case.pos.clone().setY(Mission.flags.case.pos.y + 1) : null,
      enter() { if (enemies.some(e => e.group === 'crash' && e.alive)) HUD.hint('Blackline operatives are still active near the wreck', 4); },
      update() { return !!Mission.flags.gotCase; } }
  ],
  onEnterVehicle() { if (Mission.cur().id === 'chase' && !Mission.flags.chaseLine) { Mission.flags.chaseLine = true; HUD.say(LINES1.chase); } },
  onBomb(p) {
    if (desertOnRoad(p.x, p.z) || Math.abs(p.x - roadX(p.z)) < 9) { roadCrater(p.x, p.z, true); Mission.data.craters.push([Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10]); }
    if (armored && !armored.crashed && armored.pos.distanceTo(p) < 16) truckHit();
  },
  onBriefcase() { Mission.flags.gotCase = true; HUD.say(LINES1.case); },
  intro: {
    lines: [[0, 'THREE YEARS AGO, EVERY MAJOR INTELLIGENCE AGENCY ON EARTH RECEIVED THE SAME ENCRYPTED MESSAGE.', ''], [4200, 'WHEN THE BLACKLINE OPENS,<br>DO NOT TRUST THE SKY.', 'big'], [8600, 'THEN THE MESSAGE DISAPPEARED.', ''], [11800, 'EVAN CROSS · FORMER PILOT · MERCENARY<br>ONE LAST JOB.', 'small']],
    dur: 15000,
    fly(eye, look) {
      const cz = 10, cx = rxz(cz);
      return [
        { t: 0, pos: new V3(cx - 90, terrainH(cx - 90, cz - 140) + 40, cz - 140), look: new V3(cx, 2, cz) },
        { t: 5, pos: new V3(cx + 40, terrainH(cx + 40, cz - 40) + 22, cz - 40), look: new V3(cx, 2, cz + 10) },
        { t: 9, pos: new V3(CAMP.x - 30, CAMP_H + 26, CAMP.z - 30), look: new V3(CAMP.x, CAMP_H + 2, CAMP.z) },
        { t: 12.5, pos: eye.clone().add(new V3(6, 6, 10)), look: look.clone() },
        { t: 14, pos: eye.clone(), look: look.clone() }
      ];
    }
  },
  complete() {
    achieve('ch1', 'Tomorrow\'s Photograph', 'Chapter 1 complete');
    const tm = new Date(Date.now() + 86400000), mm = String(tm.getMonth() + 1).padStart(2, '0'), dd = String(tm.getDate()).padStart(2, '0'), yy = String(tm.getFullYear()).slice(2);
    showEnding({
      photo: drawPhoto, caption: 'E. CROSS — day 0',
      lines: [[600, 'PHOTOGRAPH RECOVERED'], [1700, 'SUBJECT: CROSS, EVAN'], [2700, 'LOCATION: HWY 7, NEVADA — ARMORED TRANSPORT, OVERTURNED'], [3900, `TIMESTAMP: ${mm}/${dd}/${yy} · 06:14`], [5400, '<span class="ev">EVAN</span> That\'s me. That\'s this road. That\'s this wreck.'], [8000, '<span class="ev">EVAN</span> ...It hasn\'t been taken yet.'], [10500, 'The case also holds a set of coordinates — a facility buried beneath the mountains.'], [12800, '<span class="my">MAYA</span> <i>[static]</i> I know where that is. Evan... don\'t look at the sky.'], [16400, '<span class="si">SILAS</span> <i>[radio]</i> Did you open my case, Mister Cross?'], [19300, '<span class="ev">EVAN</span> No.'], [21000, 'It is the first lie he has told in three years. It feels like the first true thing he has done.']],
      cardAt: 24500, chapter: 'END OF CHAPTER 1', title: 'THE CONVOY', next: 2, tease: 'NEXT — FLASHBACK: GLASS HARBOR · SEVENTEEN YEARS AGO'
    });
  }
};
