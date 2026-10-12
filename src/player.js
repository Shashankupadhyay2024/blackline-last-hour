/* ============================================================
   PLAYER: movement, weapons, viewmodel, vehicles, power-ups
   ============================================================ */
const WDEF = {
  pistol: { slot: 1, name: 'P9 VIPER', dmg: 30, rpm: 420, auto: false, mag: 12, res: 48, maxRes: 120, reload: 1.25, spread: 0.014, ads: 0.004, recoil: 0.022, kick: 0.05, range: 160, pellets: 1, zoom: 1.15, snd: 'pistol', hip: [0.16, -0.17, -0.5], adsP: [0, 0, -0.38], grip: [0, -0.07, 0.07], fore: [-0.03, -0.1, 0.03] },
  smg: { slot: 2, name: 'VX-45 HORNET', dmg: 20, rpm: 880, auto: true, mag: 35, res: 105, maxRes: 280, reload: 1.7, spread: 0.032, ads: 0.012, recoil: 0.011, kick: 0.028, range: 130, pellets: 1, zoom: 1.25, snd: 'smg', hip: [0.18, -0.19, -0.46], adsP: [0, 0, -0.33], grip: [0, -0.08, 0.09], fore: [0, -0.12, -0.04] },
  ar: { slot: 3, name: 'KR-7 CARBINE', dmg: 27, rpm: 640, auto: true, mag: 30, res: 90, maxRes: 300, reload: 2.0, spread: 0.022, ads: 0.005, recoil: 0.014, kick: 0.04, range: 280, pellets: 1, zoom: 1.45, snd: 'ar', hip: [0.2, -0.2, -0.44], adsP: [0, 0, -0.32], grip: [0, -0.08, 0.1], fore: [0, -0.05, -0.3] },
  shotgun: { slot: 4, name: 'M12 BRUTE', dmg: 15, rpm: 78, auto: false, mag: 7, res: 21, maxRes: 56, reload: 2.4, spread: 0.085, ads: 0.065, recoil: 0.05, kick: 0.09, range: 60, pellets: 9, zoom: 1.15, snd: 'shotgun', hip: [0.2, -0.2, -0.44], adsP: [0, 0, -0.34], grip: [0, -0.08, 0.12], fore: [0, -0.06, -0.32] },
  sniper: { slot: 5, name: 'LR-50 LONGSHOT', dmg: 130, rpm: 48, auto: false, mag: 5, res: 15, maxRes: 40, reload: 2.7, spread: 0.06, ads: 0.0003, recoil: 0.07, kick: 0.12, range: 900, pellets: 1, zoom: 5.5, scope: true, snd: 'sniper', hip: [0.2, -0.2, -0.44], adsP: [0, 0, -0.3], grip: [0, -0.08, 0.12], fore: [0, -0.04, -0.3] },
  golden: { slot: 7, name: 'GOLDEN P9 "IT\'S LIT"', dmg: 999, rpm: 480, auto: true, mag: 16, res: 96, maxRes: 240, reload: 0.8, spread: 0.002, ads: 0, recoil: 0.015, kick: 0.05, range: 500, pellets: 1, zoom: 1.2, snd: 'golden', hip: [0.16, -0.17, -0.5], adsP: [0, 0, -0.38], grip: [0, -0.07, 0.07], fore: [-0.03, -0.1, 0.03] },
  fists: { slot: 0, name: 'FISTS', dmg: 45, rpm: 110, auto: false, mag: 0, res: 0, maxRes: 0, reload: 1, spread: 0, ads: 0, recoil: 0, kick: 0.2, range: 2.4, pellets: 1, zoom: 1, melee: true, snd: 'pistol', hip: [0.02, -0.12, -0.3], adsP: [0.02, -0.12, -0.3], grip: [0.16, -0.12, 0.05], fore: [-0.16, -0.12, 0.05] },
  rocket: { slot: 6, name: 'HX-3 HAMMER', dmg: 0, rpm: 40, auto: false, mag: 1, res: 3, maxRes: 8, reload: 2.6, spread: 0.004, ads: 0.002, recoil: 0.09, kick: 0.16, range: 700, pellets: 1, zoom: 1.3, rocket: true, snd: 'rocket', hip: [0.24, -0.16, -0.32], adsP: [0.06, -0.02, -0.26], grip: [0, -0.12, 0.02], fore: [0, -0.1, -0.25] }
};
/* ---------------- optics ---------------- */
const OPTICS = {
  iron: { name: 'IRON SIGHTS' }, reddot: { name: 'RED DOT', zoom: 1.35, overlay: 'dot' }, holo: { name: 'HOLO SIGHT', zoom: 1.5, overlay: 'holo' },
  acog: { name: '3x SCOPE', zoom: 3, scope: true, reticle: 'acog', r: 0.3, sway: 0.0012 },
  sniper: { name: 'SNIPER SCOPE', zooms: [4, 6, 8, 10], scope: true, reticle: 'mil', r: 0.37, sway: 0.0035 }
};
const WOPT = { pistol: ['iron'], smg: ['reddot'], ar: ['acog', 'holo'], shotgun: ['iron'], sniper: ['sniper'], golden: ['iron'], fists: ['iron'], rocket: ['iron'] };
var W_OPT = { idx: {}, zi: { sniper: 1 }, breath: 1, holding: false, swayT: 0, sx: 0, sy: 0 };
function opticOf(k) { const l = WOPT[k] || ['iron']; return OPTICS[l[W_OPT.idx[k] || 0] || l[0]]; }
function curZoom() { const o = opticOf(cur), w = WDEF[cur]; return o.zooms ? o.zooms[W_OPT.zi[cur] ?? 1] : (o.zoom || w.zoom || 1); }
function zoomStep(d) { const o = opticOf(cur); if (!o.zooms || W.adsT < 0.5) return false; const i = clamp((W_OPT.zi[cur] ?? 1) + d, 0, o.zooms.length - 1); if (i !== W_OPT.zi[cur]) { W_OPT.zi[cur] = i; AudioSys.ui('click'); } return true; }
function cycleOptic() { const l = WOPT[cur] || []; if (l.length < 2) return; W_OPT.idx[cur] = ((W_OPT.idx[cur] || 0) + 1) % l.length; applyOpticVM(); AudioSys.ui('rack'); HUD.feed('OPTIC: ' + opticOf(cur).name, 'gold'); }
function applyOpticVM() { const b = VM.ar; if (b && b.acog) { const sc = !!opticOf('ar').scope; b.acog.visible = sc; b.holo.forEach(m => m.visible = !sc); } }
function holdBreathStart() { }
function meleeQuick() { if (gameTime < W.nextFire || cur === 'fists') { if (cur === 'fists') fireWeapon(); return; } meleeAttack(WDEF.fists); W.nextFire = gameTime + 0.5; }
const SLOTS = ['pistol', 'smg', 'ar', 'shotgun', 'sniper', 'rocket', 'golden'];
const player = { keys: new Set(), pos: new V3(), vel: new V3(), yaw: 0, pitch: 0, onGround: true, hp: 100, armor: 0, alive: true, crouch: false, sprint: false, eye: 1.62, inVehicle: null, lastHurt: -99, jackT: 0, nades: 2, stepD: 0, deadT: 0, moving: false };
let inv = {}, cur = 'pistol';
const W = { sw: 0, switchTo: null, reloading: false, reloadT: 0, nextFire: 0, adsT: 0, kickZ: 0, kickR: 0, heat: 0, pumpT: 0, swayX: 0, swayY: 0, bobT: 0, flashT: 0, casing: [] };
const stats = { kills: 0, heads: 0, shots: 0, hits: 0, deaths: 0, start: 0 };
const VM = {}; let vmRoot;
let baseFov = settings.fov;

function initViewmodels() {
  vmRoot = new THREE.Group(); vmScene.add(vmRoot);
  for (const k of SLOTS.concat(['fists'])) {
    const b = k === 'fists' ? { g: new THREE.Group(), muzzle: -0.3, sightY: 0.05 } : buildGun(k), d = WDEF[k];
    if (k === 'fists') { for (const sx of [-1, 1]) { part(b.g, B(0.09, 0.09, 0.1), M.glove, sx * 0.16, -0.1, 0.02, 0, 0, 0, false); part(b.g, B(0.1, 0.1, 0.45), M.sleeve, sx * 0.2, -0.16, 0.28, 0.3, sx * 0.2, 0, false); } b.fist = true; d.grip = null; }
    if (d.grip) addArms(b.g, d.grip, d.fore);
    const flash = new THREE.Group();
    const fm = new THREE.MeshBasicMaterial({ map: TEX.flash, color: new THREE.Color(3, 2.6, 2.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), fm); flash.add(p1);
    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.34), fm); p2.rotation.x = Math.PI / 2; p2.position.z = -0.12; flash.add(p2);
    const p3 = p2.clone(); p3.rotation.set(Math.PI / 2, 0, Math.PI / 2); flash.add(p3);
    flash.position.set(0, 0.012, b.muzzle - 0.05); flash.visible = false; b.g.add(flash);
    b.flash = flash; b.g.visible = false; vmRoot.add(b.g);
    b.muzzleObj = new THREE.Object3D(); b.muzzleObj.position.set(0, 0.01, b.muzzle); b.g.add(b.muzzleObj);
    if (k === 'ar') {
      b.holo = b.g.children.filter(m => m.isMesh && Math.abs(m.position.y - 0.064) < 0.006 && Math.abs(m.position.z + 0.02) < 0.01);
      const ac = new THREE.Group(); ac.position.set(0, 0.075, -0.03); b.g.add(ac); b.acog = ac; ac.visible = false;
      part(ac, CYZ(0.021, 0.13, 14), M.black, 0, 0, 0, 0, 0, 0, false); part(ac, CYZ(0.026, 0.035, 14), M.black, 0, 0, -0.075, 0, 0, 0, false); part(ac, CYZ(0.023, 0.03, 14), M.black, 0, 0, 0.065, 0, 0, 0, false);
      part(ac, B(0.024, 0.02, 0.06), M.gun, 0, -0.02, 0, 0, 0, 0, false);
      part(ac, new THREE.CircleGeometry(0.02, 14), new THREE.MeshStandardMaterial({ color: 0x3050a0, roughness: 0.05, metalness: 0.9 }), 0, 0, -0.093, 0, Math.PI, 0, false);
    }
    VM[k] = b;
  }
  // shell casings
  const cg = CYZ(0.006, 0.025, 6);
  for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(cg, M.brass); m.visible = false; vmScene.add(m); W.casing.push({ m, v: new V3(), t: 0 }); }
}
function showVM(k) { for (const s in VM) VM[s].g.visible = s === k; }

function giveWeapon(k, silent) {
  const d = WDEF[k];
  if (!inv[k]) { inv[k] = { mag: d.mag, res: d.res }; if (!silent) { HUD.feed('NEW WEAPON: ' + d.name); switchWeapon(k); } }
  else { inv[k].res = Math.min(d.maxRes, inv[k].res + d.mag * 2); if (!silent) HUD.feed('+ ' + d.name + ' AMMO'); }
  HUD.slots();
}
function switchWeapon(k) {
  if (!inv[k] || (k === cur && !W.switchTo)) return;
  W.switchTo = k; W.reloading = false;
}
function cycleWeapon(dir) {
  const owned = SLOTS.filter(s => inv[s]); if (owned.length < 2) return;
  let i = owned.indexOf(W.switchTo || cur); i = (i + dir + owned.length) % owned.length; switchWeapon(owned[i]);
}
function startReload() {
  const w = WDEF[cur], st = inv[cur];
  if (w.melee || W.reloading || st.mag >= w.mag || st.res <= 0 || W.switchTo) return;
  W.reloading = true; W.reloadT = 0; W.rs = 0; AudioSys.ui('magout');
}

/* ---------------- movement ---------------- */
function handleLook(dt) {
  if (player.inVehicle || !player.alive) return;
  const zoom = lerp(1, curZoom(), W.adsT);
  const s = 0.0022 * settings.sens / Math.pow(zoom, 0.85);
  padLook(dt || 1 / 60);
  player.yaw -= mouseDX * s; player.pitch -= mouseDY * s * (settings.invertY ? -1 : 1);
  player.pitch = clamp(player.pitch, -1.52, 1.52);
  W.swayX += (-mouseDX * 0.00045 - W.swayX) * 0.2; W.swayY += (mouseDY * 0.00045 - W.swayY) * 0.2;
}
function updatePlayer(dt) {
  if (!player.alive || player.inVehicle) return;
  const k = keys;
  let f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0) - Pad.ly, s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + Pad.lx;
  const fm = Math.hypot(f, s); if (fm > 1) { f /= fm; s /= fm; }
  player.crouch = !!(k.KeyC || k.ControlLeft || Pad.crouch);
  player.sprint = !!(k.ShiftLeft || k.ShiftRight || Pad.sprint) && f > 0.3 && !player.crouch && W.adsT < 0.3 && !mouseDown[0] && Pad.rt < 0.5;
  let speed = player.crouch ? 2.6 : player.sprint ? 8.6 : 5.2;
  speed *= lerp(1, 0.6, W.adsT); if (player.jackT > 0) speed *= 1.35;
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
  let wx = fx * f + rx * s, wz = fz * f + rz * s; const wl = Math.hypot(wx, wz); if (wl > 1) { wx /= wl; wz /= wl; }
  const acc = player.onGround ? 12 : 2.5, kk = 1 - Math.exp(-acc * dt);
  player.vel.x += (wx * speed - player.vel.x) * kk; player.vel.z += (wz * speed - player.vel.z) * kk;
  if ((k.Space || Pad.held(0)) && player.onGround && !player.crouch) { player.vel.y = 7.2; player.onGround = false; }
  player.vel.y -= 22 * dt;
  const px0 = player.pos.x, pz0 = player.pos.z;
  player.pos.addScaledVector(player.vel, dt);
  if (LV.blocked && LV.blocked(player.pos.x, player.pos.z)) { player.pos.x = px0; player.pos.z = pz0; player.vel.x *= -0.2; player.vel.z *= -0.2; }
  player.pos.x = clamp(player.pos.x, -WORLD, WORLD); player.pos.z = clamp(player.pos.z, -WORLD, WORLD);
  const g = collideCircle(player.pos, 0.4, player.pos.y, player.pos.y + (player.crouch ? 1.2 : 1.8));
  const wasGround = player.onGround;
  if (player.pos.y <= g || (wasGround && player.vel.y <= 0 && player.pos.y - g < 0.45)) {
    if (!wasGround && player.vel.y < -9) { AudioSys.ui('land'); addShake(0.12); if (player.vel.y < -16) hurtPlayer((-player.vel.y - 16) * 6); }
    player.pos.y = g; player.vel.y = Math.max(0, player.vel.y); player.onGround = true;
  } else player.onGround = false;
  const hs = Math.hypot(player.vel.x, player.vel.z); player.moving = hs > 0.5 && player.onGround;
  player.eye = lerp(player.eye, player.crouch ? 1.05 : 1.62, 1 - Math.exp(-12 * dt));
  if (player.moving) { player.stepD += hs * dt; const stride = player.sprint ? 2.6 : 2.0; if (player.stepD > stride) { player.stepD = 0; if (!player.crouch) AudioSys.ui('step'); } W.bobT += dt * hs * 1.35; }
  // regen
  if (gameTime - player.lastHurt > 4.5 && player.hp < 100) player.hp = Math.min(100, player.hp + 14 * dt);
  if (player.jackT > 0) { player.jackT -= dt; if (player.jackT <= 0) endJack(); }
}
function fpsCamera(dt) {
  if (!player.alive) {
    player.deadT += dt; const k = Math.min(1, player.deadT / 0.8);
    camera.position.set(player.pos.x, player.pos.y + lerp(player.eye, 0.3, k * k), player.pos.z);
    camera.rotation.set(player.pitch * (1 - k) - 0.2 * k, player.yaw, k * 0.9);
    return;
  }
  const bob = player.moving ? Math.sin(W.bobT * 2) * 0.035 * (1 - W.adsT * 0.8) : 0;
  camera.position.set(player.pos.x + Shake.x, player.pos.y + player.eye + bob + Shake.y, player.pos.z);
  const o = opticOf(cur), scoped = o.scope && W.adsT > 0.9;
  W_OPT.swayT += 1 / 60;
  const hold = scoped && (keys.ShiftLeft || keys.ShiftRight || Pad.held(10)) && W_OPT.breath > 0;
  if (hold) W_OPT.breath = Math.max(0, W_OPT.breath - 0.28 / 60); else W_OPT.breath = Math.min(1, W_OPT.breath + 0.18 / 60);
  if (hold && !W_OPT.holding) AudioSys.ui('radio'); W_OPT.holding = hold;
  const amp = scoped ? (o.sway || 0) * (hold ? 0.1 : W_OPT.breath <= 0 ? 2.2 : 1) * (player.crouch ? 0.55 : 1) * (player.moving ? 2 : 1) : 0;
  W_OPT.sx = lerp(W_OPT.sx, Math.sin(W_OPT.swayT * 0.9) * amp + Math.sin(W_OPT.swayT * 2.3) * amp * 0.3, 0.1);
  W_OPT.sy = lerp(W_OPT.sy, Math.sin(W_OPT.swayT * 1.4 + 1) * amp * 0.8, 0.1);
  camera.rotation.set(player.pitch + Shake.y * 0.6 + W_OPT.sy, player.yaw + Shake.x * 0.6 + W_OPT.sx, Shake.r + (player.moving ? Math.sin(W.bobT) * 0.004 : 0));
  const fovT = baseFov / lerp(1, curZoom(), W.adsT) + (player.sprint ? 5 : 0) + (player.jackT > 0 ? 6 : 0);
  if (Math.abs(camera.fov - fovT) > 0.01) { camera.fov = lerp(camera.fov, fovT, 1 - Math.exp(-14 * dt)); camera.updateProjectionMatrix(); updatePointScale(); }
}

/* ---------------- weapons ---------------- */
const _fo = new V3(), _fd = new V3(), _fr = new V3(), _fu = new V3();
function updateWeapon(dt) {
  if (!player.alive) return;
  const w = WDEF[cur], st = inv[cur];
  if (W.switchTo) { W.sw = Math.min(1, W.sw + dt / 0.16); if (W.sw >= 1) { cur = W.switchTo; W.switchTo = null; showVM(cur); W.reloading = false; AudioSys.ui('rack'); HUD.slots(); } }
  else W.sw = Math.max(0, W.sw - dt / 0.2);
  const adsRaw = mouseDown[2] || Pad.lt > 0.35;
  if (settings.adsToggle) { if (adsRaw && !W.adsPrev) W.adsLatch = !W.adsLatch; } else W.adsLatch = adsRaw;
  W.adsPrev = adsRaw; if (settings.adsToggle && player.sprint) W.adsLatch = false;
  const wantAds = W.adsLatch && !W.reloading && !player.sprint && !W.switchTo && !player.inVehicle && !w.melee;
  const prevAds = W.adsT;
  W.adsT = clamp(W.adsT + (wantAds ? 1 : -1) * dt / (opticOf(cur).scope ? 0.26 : 0.17), 0, 1);
  if (prevAds === 0 && W.adsT > 0 && Pad.lt > 0.35) adsSnap();
  if (W.reloading) {
    const rate = player.jackT > 0 ? 1.45 : 1; W.reloadT += dt * rate;
    const f = W.reloadT / w.reload;
    if (W.rs === 0 && f > 0.55) { W.rs = 1; AudioSys.ui('magin'); }
    if (W.reloadT >= w.reload) { const need = w.mag - st.mag, take = Math.min(need, st.res); st.mag += take; st.res -= take; W.reloading = false; AudioSys.ui('rack'); }
  }
  W.heat = Math.max(0, W.heat - dt * 2.5);
  W.kickZ *= Math.exp(-dt * 14); W.kickR *= Math.exp(-dt * 12);
  if (W.pumpT > 0) W.pumpT = Math.max(0, W.pumpT - dt);
  const padTrig = player.inVehicle ? Pad.held(5) : Pad.rt > 0.5, padTrigP = padTrig && !W.rtPrev; W.rtPrev = padTrig;
  if (!W.switchTo && W.sw < 0.3 && !W.reloading && (w.auto ? (mouseDown[0] || padTrig) : (firePressed || padTrigP))) fireWeapon();
  if (keys.KeyR && !W.reloading && !w.melee) startReload();
}
function fireWeapon() {
  const w = WDEF[cur], st = inv[cur];
  if (gameTime < W.nextFire) return;
  if (player.sprint) { player.sprint = false; }
  if (w.melee) { meleeAttack(w); return; }
  if (player.inVehicle && player.inVehicle.kind === 'apc') { camera.getWorldDirection(_fd); apcFire(player.inVehicle); return; }
  if (st.mag <= 0) { AudioSys.ui('empty'); W.nextFire = gameTime + 0.25; if (st.res > 0) startReload(); return; }
  st.mag--; stats.shots++;
  W.nextFire = gameTime + 60 / w.rpm / (player.jackT > 0 ? 1.25 : 1);
  const car = player.inVehicle;
  camera.getWorldDirection(_fd);
  let origin;
  if (car) {
    const aim = castRay(camera.position, _fd, w.range, { ignoreCar: car });
    const ap = aim ? aim.point : camera.position.clone().addScaledVector(_fd, w.range);
    origin = _fo.set(car.pos.x, car.pos.y + 2.1, car.pos.z);
    _fd.copy(ap).sub(origin).normalize();
  } else origin = _fo.copy(camera.position);
  _fr.crossVectors(_fd, _v1.set(0, 1, 0)).normalize(); _fu.crossVectors(_fr, _fd).normalize();
  const moving = player.moving ? (player.sprint ? 2 : 1.4) : 1;
  const spread = lerp(w.spread, w.ads, W.adsT) * moving * (player.crouch ? 0.75 : 1) * (1 + W.heat * 0.8) * (player.onGround || car ? 1 : 2);
  // muzzle position in world
  const mw = car ? origin.clone() : camera.localToWorld(VM[cur].muzzleObj.getWorldPosition(new V3()));
  if (w.rocket) {
    const d = _v2.copy(_fd).addScaledVector(_fr, rand(-1, 1) * spread).addScaledVector(_fu, rand(-1, 1) * spread).normalize();
    projectiles.push(new Projectile('rocket', origin.clone().addScaledVector(d, car ? 3 : 1.0), d.clone().multiplyScalar(45), { owner: 'player', max: 130, ignoreCar: car, r: 12, dmg: 240, oneShot: true }));
    FX.muzzleSmoke(mw); for (let i = 0; i < 6; i++) FX.muzzleSmoke(_v3.copy(mw).addScaledVector(d, -1.2));
  } else {
    let hitSomething = false, headshot = false, killed = false;
    for (let i = 0; i < w.pellets; i++) {
      const g1 = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5, g2 = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const d = _v2.copy(_fd).addScaledVector(_fr, g1 * spread).addScaledVector(_fu, g2 * spread).normalize();
      const h = castRay(origin, d, w.range, { ignoreCar: car });
      const end = h ? h.point : origin.clone().addScaledVector(d, w.range);
      if (i === 0 || w.pellets > 1 && i % 3 === 0) Tracers.add(mw, end, false);
      if (!h) continue;
      if (h.type === 'enemy') {
        const e = h.enemy; let dm = w.dmg * (player.jackT > 0 ? 1.15 : 1);
        if (h.dist > w.range * 0.45) dm *= lerp(1, 0.55, (h.dist - w.range * 0.45) / (w.range * 0.55));
        if (h.head) dm *= (cur === 'sniper' ? 3 : 2.2) / (e.T.headMul ? 1.4 : 1);
        if (h.head && !e.isBoss) dm = Math.max(dm, e.hp + 100);
        const was = e.alive; e.damage(dm, d, h.head, 'player'); FX.impact(h.point, 'blood', d);
        hitSomething = true; if (h.head) headshot = true; if (was && !e.alive) killed = true;
      } else if (h.type === 'car') { h.col.car.damage(w.dmg * 0.6, 'bullet'); FX.impact(h.point, 'metal', d); }
      else if (h.type === 'static') {
        if (h.col.target) { hitTarget(h.col.target, w.dmg * (h.col.target.bulletMul || 1), 'bullet'); hitSomething = true; }
        if (h.col.prop) h.col.prop.damage(w.dmg);
        if (!h.col.noFX) FX.impact(h.point, h.col.metal || h.col.prop ? 'metal' : 'rock', d);
      }
      else FX.impact(h.point, 'terrain', d);
    }
    if (hitSomething) { stats.hits++; HUD.hit(headshot, killed); }
  }
  // feedback
  const rec = w.recoil * lerp(1, 0.6, W.adsT) * (player.jackT > 0 ? 0.65 : 1) * (player.crouch ? 0.8 : 1);
  if (!car) { player.pitch += rec; player.yaw += rand(-0.5, 0.5) * rec * 0.6; }
  W.kickZ += w.kick; W.kickR += w.kick * 1.4; W.heat = Math.min(1, W.heat + 0.18);
  if (cur === 'shotgun' || cur === 'sniper') W.pumpT = 0.55;
  VM[cur].flash.visible = true; VM[cur].flash.rotation.z = rand(0, TAU); VM[cur].flash.scale.setScalar(rand(0.8, 1.3)); W.flashT = 0.045;
  Lights.muzzle.position.copy(mw); Lights.muzzle.intensity = w.rocket ? 5 : 3;
  AudioSys.shot(w.snd, null);
  addShake(w.kick * 0.5);
  if (!w.rocket && cur !== 'shotgun') ejectCasing();
  if (Mission.loudShots !== false) alertEnemies(player.pos, cur === 'pistol' ? 55 : 95, false);
  if (st.mag === 0 && st.res > 0) after(0.2, () => { if (inv[cur] === st) startReload(); });
}
function meleeAttack(w) {
  W.nextFire = gameTime + 60 / w.rpm; W.kickZ -= 0.12; W.punch = (W.punch || 0) + 1; AudioSys.ui('whiz');
  camera.getWorldDirection(_fd);
  const h = castRay(camera.position, _fd, w.range, {});
  if (h && h.type === 'enemy') { const e = h.enemy; const sneak = e.state !== 'combat'; e.damage(sneak ? 999 : w.dmg * (player.jackT > 0 ? 1.5 : 1), _fd, false, 'player'); FX.impact(h.point, 'blood', _fd); HUD.hit(false, !e.alive); stats.hits++; AudioSys.ui('land'); addShake(0.1); if (sneak && !e.alive) HUD.feed('✦ SILENT TAKEDOWN', 'gold'); }
  else if (h && h.type === 'static') { if (h.col.target) hitTarget(h.col.target, w.dmg, 'melee'); AudioSys.ui('land'); }
  stats.shots++;
}
let _optKey = '';
function updateOpticHUD(o, scoped) {
  const show = scoped && !player.inVehicle && !player.inJet && player.alive;
  Post.scopeMask = show ? 1 : 0; Post.scopeR = o.r || 0.35;
  const key = show ? o.reticle : '';
  if (key !== _optKey) {
    _optKey = key; const sc = $('scope');
    sc.classList.toggle('hidden', !show);
    if (show) { sc.style.setProperty('--r', (o.r * 100) + 'vh'); $('reticle').innerHTML = RETICLES[o.reticle]; }
  }
  if (show) {
    const z = curZoom(); HUD.set('scope-zoom', z.toFixed(1) + 'x');
    $('scope-breath').style.width = (W_OPT.breath * 100) + '%'; $('scope-breath').parentNode.classList.toggle('on', W_OPT.holding || W_OPT.breath < 1);
    $('scope-hint').textContent = (o.zooms ? (Pad.active ? 'D-PAD ↑↓ ZOOM · ' : 'WHEEL ZOOM · ') : '') + (Pad.active ? 'HOLD L3 STEADY' : 'HOLD SHIFT STEADY');
    $('reticle').style.transform = `translate(-50%,-50%) translate(${-W_OPT.sx * 900}px,${W_OPT.sy * 900}px)`;
  }
  const dot = $('optic-dot'), dshow = !show && o.overlay && W.adsT > 0.8 && !player.inVehicle && player.alive && !Cine.active;
  dot.className = dshow ? o.overlay : 'hidden';
  if (VM.ar && VM.ar.holo) { const sc = !!opticOf('ar').scope; VM.ar.holo.forEach(m => m.visible = !sc && !(dshow && cur === 'ar')); if (VM.ar.acog) VM.ar.acog.visible = !!sc; }
}
const RETICLES = {
  mil: '<circle r="99" fill="none" stroke="#000" stroke-width="2"/><line x1="-100" y1="0" x2="-6" y2="0" stroke="#000" stroke-width="0.7"/><line x1="6" y1="0" x2="100" y2="0" stroke="#000" stroke-width="0.7"/><line x1="0" y1="-100" x2="0" y2="-6" stroke="#000" stroke-width="0.7"/><line x1="0" y1="6" x2="0" y2="100" stroke="#000" stroke-width="0.7"/>' +
    '<line x1="-100" y1="0" x2="-45" y2="0" stroke="#000" stroke-width="3"/><line x1="45" y1="0" x2="100" y2="0" stroke="#000" stroke-width="3"/><line x1="0" y1="45" x2="0" y2="100" stroke="#000" stroke-width="3"/>' +
    [-4, -3, -2, -1, 1, 2, 3, 4].map(i => `<circle cx="${i * 10}" cy="0" r="1.1" fill="#000"/><circle cx="0" cy="${i * 10}" r="1.1" fill="#000"/>`).join('') + '<circle r="0.9" fill="#ff2a1a"/>',
  acog: '<circle r="99" fill="none" stroke="#000" stroke-width="2"/><path d="M-9 8 L0 -2 L9 8" fill="none" stroke="#ff3a22" stroke-width="1.6"/><circle cx="0" cy="-2" r="0.9" fill="#ff3a22"/><line x1="0" y1="12" x2="0" y2="60" stroke="#111" stroke-width="0.8"/>' +
    [20, 28, 36, 44].map((y, i) => `<line x1="${-6 + i}" y1="${y}" x2="${6 - i}" y2="${y}" stroke="#111" stroke-width="0.7"/>`).join('') + '<line x1="-100" y1="0" x2="-60" y2="0" stroke="#111" stroke-width="1"/><line x1="60" y1="0" x2="100" y2="0" stroke="#111" stroke-width="1"/>'
};
function ejectCasing() {
  const c = W.casing.find(c => !c.m.visible) || W.casing[0];
  c.m.visible = true; c.t = 0;
  c.m.position.set(vmRoot.position.x + 0.03, vmRoot.position.y + 0.03, vmRoot.position.z - 0.02);
  c.v.set(rand(0.9, 1.4), rand(0.8, 1.3), rand(-0.1, 0.2));
}
function apcFire(car) {
  W.nextFire = gameTime + 0.14;
  const aim = castRay(camera.position, _fd, 400, { ignoreCar: car });
  const ap = aim ? aim.point : camera.position.clone().addScaledVector(_fd, 400);
  const tur = car.mesh.userData.turret, o = tur ? tur.getWorldPosition(new V3()).add(new V3(0, 0.3, 0)) : car.pos.clone().setY(car.pos.y + 3);
  const d = ap.clone().sub(o).normalize();
  const h = castRay(o, d, 400, { ignoreCar: car });
  const end = h ? h.point : o.clone().addScaledVector(d, 400);
  Tracers.add(o, end, false); AudioSys.shot('sniper', null); addShake(0.05); stats.shots++;
  if (h) { FX.explosion(end, 1.6); if (h.type === 'enemy') { h.enemy.damage(70, d, h.head, 'player'); stats.hits++; HUD.hit(h.head, !h.enemy.alive); } else if (h.type === 'static' && h.col.target) { hitTarget(h.col.target, 45, 'cannon'); } else if (h.type === 'car') h.col.car.damage(80); else if (h.type === 'static' && h.col.prop) h.col.prop.damage(60);
    for (const e of enemies) if (e.alive && e !== (h.enemy) && e.pos.distanceTo(end) < 2.5) e.damage(35, d, false, 'player'); }
}
function throwGrenade() {
  if (player.nades <= 0 || player.inVehicle || !player.alive) return;
  player.nades--;
  camera.getWorldDirection(_v1);
  const p = camera.position.clone().addScaledVector(_v1, 0.6);
  const v = _v1.clone().multiplyScalar(19).add(_v2.set(0, 4, 0)).add(player.vel);
  projectiles.push(new Projectile('grenade', p, v, { owner: 'player', r: 10.5, dmg: 200, oneShot: true }));
  AudioSys.ui('rack'); HUD.feed('GRENADE OUT');
}
function updateViewmodel(dt) {
  const w = WDEF[cur], b = VM[cur];
  const opt = opticOf(cur), scoped = opt.scope && W.adsT > 0.92;
  updateOpticHUD(opt, scoped);
  vmRoot.visible = !player.inVehicle && !player.inJet && player.alive && !scoped && (!Cine.active || Cine.showVM);
  $('scope').classList.toggle('hidden', !(scoped && !player.inVehicle));
  const hip = w.hip, ad = w.adsP, a = W.adsT;
  let x = lerp(hip[0], ad[0], a), y = lerp(hip[1], -b.sightY + ad[1], a), z = lerp(hip[2], ad[2], a);
  let rx = 0, ry = 0, rz = 0;
  const bobA = player.moving ? (1 - a * 0.85) : 0;
  x += Math.sin(W.bobT) * 0.012 * bobA; y += Math.abs(Math.cos(W.bobT)) * 0.012 * bobA;
  x += W.swayX * (1 - a * 0.7); y += W.swayY * (1 - a * 0.7); rz += W.swayX * 2;
  z += W.kickZ * 0.6; rx += W.kickR * 0.5;
  if (player.sprint) { rx -= 0.25; ry += 0.55; x += 0.02; y -= 0.04; }
  if (W.reloading) { const t = W.reloadT / w.reload, s = Math.sin(Math.PI * clamp(t, 0, 1)); rx -= 0.55 * s; rz += 0.35 * s; y -= 0.08 * s; if (b.mag) b.mag.position.y = (b.mag.userData.y0 ?? (b.mag.userData.y0 = b.mag.position.y)) - 0.18 * Math.sin(Math.PI * clamp(t * 1.6, 0, 1)); }
  else if (b.mag && b.mag.userData.y0 !== undefined) b.mag.position.y = b.mag.userData.y0;
  if (W.pumpT > 0) { const t = 1 - W.pumpT / 0.55, s = Math.sin(Math.PI * clamp(t * 1.4 - 0.2, 0, 1)); if (b.pump) b.pump.position.z = -0.32 + 0.1 * s; rz += 0.12 * s; }
  y -= W.sw * 0.35; rx -= W.sw * 0.9;
  if (player.jackT > 0) { x += Math.sin(gameTime * 1.7) * 0.004; rz += Math.sin(gameTime * 1.3) * 0.03; }
  const k = 1 - Math.exp(-dt * 20);
  vmRoot.position.x = lerp(vmRoot.position.x, x, k); vmRoot.position.y = lerp(vmRoot.position.y, y, k); vmRoot.position.z = lerp(vmRoot.position.z, z, 1 - Math.exp(-dt * 30));
  vmRoot.rotation.x = lerp(vmRoot.rotation.x, rx, k); vmRoot.rotation.y = lerp(vmRoot.rotation.y, ry, k); vmRoot.rotation.z = lerp(vmRoot.rotation.z, rz, k);
  if (W.flashT > 0) { W.flashT -= dt; if (W.flashT <= 0) b.flash.visible = false; }
  for (const c of W.casing) { if (!c.m.visible) continue; c.t += dt; c.v.y -= 6 * dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += dt * 20; c.m.rotation.y += dt * 13; if (c.t > 0.7) c.m.visible = false; }
  const vf = 56 - a * 6; if (Math.abs(vmCam.fov - vf) > 0.05) { vmCam.fov = vf; vmCam.updateProjectionMatrix(); }
}

/* ---------------- damage / death ---------------- */
function hurtPlayer(d, from) {
  if (!player.alive || state !== 'play') return;
  if (player.jackT > 0) d *= 0.5;
  if (player.armor > 0) { const a = Math.min(player.armor, d * 0.6); player.armor -= a; d -= a; }
  player.hp -= d; player.lastHurt = gameTime;
  HUD.damage(d, from); AudioSys.ui('hurt'); addShake(clamp(0.08 + d * 0.012, 0, 0.5));
  if (player.hp <= 0) killPlayer();
}
function killPlayer() {
  player.hp = 0; player.alive = false; player.deadT = 0; stats.deaths++;
  if (player.inVehicle) exitVehicle(true);
  vmRoot.visible = false; AudioSys.combatTarget = 0;
  timeScale = 0.4; slowUntil = realTime + 1.4;
  player.diedAt = realTime;
}

/* ---------------- vehicles ---------------- */
const vcam = { yaw: 0, pitch: -0.14, idle: 0, mode: 0 };
function enterVehicle(car) {
  if (!car || car.dead || !car.enterable) return;
  player.inVehicle = car; car.driverIsPlayer = true; car.ai = null;
  vcam.yaw = 0; vcam.pitch = -0.14; W.adsT = 0; W.reloading = false;
  AudioSys.engineStart(); HUD.hint('W/S drive · A/D steer · SPACE handbrake · LMB shoot · V camera · E exit', 6);
  Mission.onEnterVehicle && Mission.onEnterVehicle(car);
}
function exitVehicle(force) {
  const car = player.inVehicle; if (!car) return;
  if (!force && Math.abs(car.speed) > 8) { HUD.hint('Slow down to get out', 2); return; }
  car.driverIsPlayer = false; player.inVehicle = null;
  const rx = Math.cos(car.yaw), rz = -Math.sin(car.yaw);
  player.pos.set(car.pos.x - rx * (car.w / 2 + 0.9), car.pos.y, car.pos.z - rz * (car.w / 2 + 0.9));
  player.pos.y = collideCircle(player.pos, 0.4, car.pos.y + 0.5, car.pos.y + 2);
  player.vel.set(car.fwdX * car.speed * 0.5, 2, car.fwdZ * car.speed * 0.5);
  player.yaw = car.yaw + vcam.yaw; player.pitch = 0; player.onGround = false;
  AudioSys.engineStop();
}
function updatePlayerVehicle(dt) {
  const car = player.inVehicle; if (!car) return;
  const k = keys;
  const thr = clamp((k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0) + Pad.rt - Pad.lt, -1, 1), st = clamp((k.KeyA ? 1 : 0) - (k.KeyD ? 1 : 0) - Pad.lx, -1, 1);
  car.control(dt, thr, st, !!k.Space || Pad.held(0));
  AudioSys.engineSet(car.speed, Math.abs(thr));
  player.pos.copy(car.pos);
  if (player.jackT > 0) { player.jackT -= dt; if (player.jackT <= 0) endJack(); }
  if (gameTime - player.lastHurt > 4.5 && player.hp < 100) player.hp = Math.min(100, player.hp + 14 * dt);
}
function vehicleCamera(dt) {
  const car = player.inVehicle;
  vcam.yaw -= mouseDX * 0.0024 * settings.sens + Pad.rx * 2.6 * dt * settings.padSens; vcam.pitch = clamp(vcam.pitch - (mouseDY * 0.0024 * settings.sens + Pad.ry * 1.6 * dt * settings.padSens) * (settings.invertY ? -1 : 1), -0.7, 0.4);
  if (mouseDX || mouseDY || Pad.rx || Pad.ry) vcam.idle = 0; else vcam.idle += dt;
  if (vcam.idle > 1.8 && !mouseDown[0] && Math.abs(car.speed) > 3) { vcam.yaw += angDiff(vcam.yaw, 0) * (1 - Math.exp(-dt * 2)); vcam.pitch = lerp(vcam.pitch, -0.14, 1 - Math.exp(-dt * 2)); }
  const dist = vcam.mode ? 5.2 : 9.5, y = car.yaw + vcam.yaw, p = vcam.pitch;
  const fx = -Math.sin(y) * Math.cos(p), fy = Math.sin(p), fz = -Math.cos(y) * Math.cos(p);
  let cx = car.pos.x - fx * dist, cy = car.pos.y + (vcam.mode ? 2.4 : 3.1) - fy * dist, cz = car.pos.z - fz * dist;
  const gh = terrainH(cx, cz) + 0.8; if (cy < gh) cy = gh;
  const k = 1 - Math.exp(-dt * 14);
  camera.position.x = lerp(camera.position.x, cx, k) + Shake.x; camera.position.y = lerp(camera.position.y, cy, k) + Shake.y; camera.position.z = lerp(camera.position.z, cz, k);
  camera.rotation.set(p + Shake.y * 0.5, y + Shake.x * 0.5, Shake.r);
  const fovT = baseFov + clamp(Math.abs(car.speed) / car.maxSpeed, 0, 1) * 10;
  if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov = lerp(camera.fov, fovT, 1 - Math.exp(-4 * dt)); camera.updateProjectionMatrix(); updatePointScale(); }
}

/* ---------------- BOTTLE OF JACK power-up ---------------- */
function startJack() {
  player.jackT = 15; AudioSys.ui('jack');
  $('jackfx').classList.add('on'); $('jack').classList.remove('hidden');
  HUD.notify('JACK MODE', 'Faster · tougher · meaner — 15 seconds');
  player.hp = Math.min(100, player.hp + 25);
}
function endJack() { player.jackT = 0; $('jackfx').classList.remove('on'); $('jack').classList.add('hidden'); HUD.feed('JACK MODE ENDED'); }

/* ---------------- interaction ---------------- */
let interactTarget = null;
function findInteract() {
  interactTarget = null;
  if (!player.alive || Cine.active) return;
  if (player.inVehicle) { interactTarget = { label: 'Exit vehicle', act: () => exitVehicle(false) }; return; }
  let best = 2.6;
  camera.getWorldDirection(_v1);
  for (const p of pickups) {
    if (!p.needsE || p.taken) continue;
    const d = p.pos.distanceTo(player.pos); if (d < best) { best = d; interactTarget = { label: p.label(), act: () => p.take() }; }
  }
  for (const c of cars) {
    if (!c.enterable || c.dead || c.crashed || (c.ai && c.ai.driver && c.ai.driver.alive)) continue;
    const d = Math.hypot(c.pos.x - player.pos.x, c.pos.z - player.pos.z) - c.w * 0.6;
    if (d < best + 0.4) { best = d; interactTarget = { label: 'Drive the ' + ({ pickup: 'pickup truck', jeep: 'technical', sedan: 'car', suv: 'armored SUV', apc: 'APC' }[c.kind] || 'vehicle'), act: () => enterVehicle(c) }; }
  }
  for (const it of interactables) {
    if (it.dead) continue; const lbl = it.interLabel(); if (!lbl) continue;
    const d = Math.hypot(it.pos.x - player.pos.x, it.pos.z - player.pos.z), dy = Math.abs(it.pos.y - (player.pos.y + 1));
    if (d < (it.range || 2.6) && dy < 2.2 && (!interactTarget || d < best + 0.6)) { best = Math.min(best, d); interactTarget = { label: lbl, act: () => it.act() }; }
  }
  if (Mission.interact) { const m = Mission.interact(); if (m) interactTarget = m; }
}
