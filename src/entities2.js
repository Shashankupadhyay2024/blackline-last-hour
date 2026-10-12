/* ============================================================
   ENTITIES 2: dynamic light fixtures, alarm, helicopters,
   turrets, security cameras, doors, tripwires, civilians,
   building collapses, fighters + player jet (flight model)
   ============================================================ */
let actors = [], targets = [], interactables = [];

/* ---------- nearest-light fixture system (fixed pool, no shader recompiles) ---------- */
const Fixtures = {
  list: [], pool: [], t: 0, alarm: 0, dimmed: new Set(),
  init(n) { for (let i = 0; i < n; i++) { const l = new THREE.PointLight(0xffffff, 0, 16, 2); scene.add(l); this.pool.push({ l, f: null, cur: 0 }); } },
  add(p, color, i, dist, flicker, mesh) { const f = { p, color: new THREE.Color(color), i, dist, flicker: flicker || 0, mesh, on: true }; this.list.push(f); return f; },
  update(dt) {
    if (!this.pool.length) return;
    this.t -= dt; this.alarm = Math.max(0, this.alarm - dt);
    if (this.t <= 0) {
      this.t = 0.2; const cp = camera.position;
      const near = this.list.filter(f => f.on).map(f => [f, f.p.distanceToSquared(cp)]).sort((a, b) => a[1] - b[1]).slice(0, this.pool.length).map(a => a[0]);
      const set = new Set(near);
      for (const s of this.pool) if (s.f && !set.has(s.f)) s.f = null;
      const used = new Set(this.pool.map(s => s.f).filter(Boolean));
      for (const f of near) if (!used.has(f)) { const s = this.pool.find(s => !s.f); if (s) { s.f = f; s.cur = 0; s.l.position.copy(f.p); s.l.distance = f.dist; } }
    }
    const pulse = 0.55 + 0.45 * Math.sin(gameTime * 7);
    for (const s of this.pool) {
      if (!s.f) { s.l.intensity = Math.max(0, s.l.intensity - dt * 4); continue; }
      const f = s.f; let target = f.on ? f.i : 0;
      if (f.flicker && Math.random() < f.flicker) target *= Math.random() * 0.3;
      if (this.alarm > 0) { s.l.color.setRGB(1, 0.12, 0.06); target *= pulse * 1.1; } else s.l.color.copy(f.color);
      s.cur += (target - s.cur) * Math.min(1, dt * 8); s.l.intensity = s.cur;
    }
    if (this.alarm > 0) for (const f of this.list) if (f.mesh) f.mesh.material = pulse > 0.6 ? M.panelRed : M.panel;
    else if (this._wasAlarm) for (const f of this.list) if (f.mesh) f.mesh.material = f.on ? M.panel : M.ceil;
    this._wasAlarm = this.alarm > 0;
  },
  clearAlarm() { this.alarm = 0; }
};

/* ---------- alarm ---------- */
let alarmSnd = null;
function triggerAlarm(p, dur) {
  const first = Fixtures.alarm <= 0;
  Fixtures.alarm = Math.max(Fixtures.alarm, dur || 14);
  for (const e of enemies) if (e.alive && e.state !== 'combat') { e.lastKnown.copy(p || player.pos); e.enterCombat(true); }
  for (const t of targets) if (t.onAlarm) t.onAlarm();
  if (first) { HUD.notify('ALARM RAISED', 'Security is converging on your position', 'red'); sirenSound(dur || 14); if (LV.onAlarm) LV.onAlarm(p); }
}
function sirenSound(dur) {
  if (!AudioSys.ctx) return; const c = AudioSys.ctx, t = c.currentTime;
  const o = c.createOscillator(); o.type = 'sawtooth'; const lfo = c.createOscillator(); lfo.frequency.value = 0.6; const lg = c.createGain(); lg.gain.value = 220;
  lfo.connect(lg); lg.connect(o.frequency); o.frequency.value = 720;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.3); g.gain.setValueAtTime(0.05, t + dur - 1); g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(f); f.connect(g); g.connect(AudioSys.sfx); o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
}

/* ---------- generic hittable helpers ---------- */
function addTarget(t, box) {
  targets.push(t); actors.push(t);
  if (box) { t.col = { box, ref: t, target: t, metal: true, dyn: true }; colliders.push(t.col); }
  return t;
}
function removeCol(t) { if (t.col) { const i = colliders.indexOf(t.col); if (i >= 0) colliders.splice(i, 1); t.col = null; } }
function hitTarget(t, d, src) { if (t && !t.dead && t.damage) t.damage(d, src); }

/* ---------- helicopter ---------- */
class Heli {
  constructor(x, y, z, o) {
    o = o || {}; this.kind = o.drop ? 'dropship' : 'gunship';
    this.mesh = buildHeli(this.kind); scene.add(this.mesh); this.U = this.mesh.userData;
    this.pos = new V3(x, y, z); this.vel = new V3(); this.yaw = o.yaw || 0; this.hp = o.hp || (o.drop ? 1400 : 800); this.hpMax = this.hp; this.dead = false; this.radius = 5;
    this.orbitA = rand(0, TAU); this.orbitR = o.r || rand(38, 55); this.alt = o.alt || rand(24, 34); this.fireT = rand(1, 3); this.rocketT = rand(4, 8); this.burst = 0;
    this.o = o; this.troops = o.troops || 0; this.landAt = o.landAt ? o.landAt.clone() : null; this.phase = 'approach'; this.phaseT = 0;
    this.snd = AudioSys.loop('heli', this.pos); this.fallT = 0; this.spin = 0; this.smokeT = 0;
    addTarget(this, new THREE.Box3());
    this.updateBox();
  }
  updateBox() { if (this.col) { const k = this.U.k * 2.2; this.col.box.min.set(this.pos.x - k, this.pos.y - k * 0.7, this.pos.z - k); this.col.box.max.set(this.pos.x + k, this.pos.y + k * 0.7, this.pos.z + k); } }
  damage(d) {
    if (this.dead) return; this.hp -= d; HUD.hit(false, false);
    if (this.hp <= 0) { this.dead = true; this.falling = true; stats.kills++; HUD.feed('✕ HELICOPTER DOWN', 'gold'); AudioSys.ui('kill'); this.vel.y = 2; detonate(this.pos, 5, 10, { src: 'heli' }); }
  }
  update(dt) {
    const U = this.U;
    U.rotor.rotation.y += dt * 28; U.tr.rotation.x += dt * 40; U.lamp.visible = Math.sin(gameTime * 6) > 0;
    if (this.snd) this.snd.setPos(this.pos);
    if (this.falling) {
      this.fallT += dt; this.vel.y -= 14 * dt; this.pos.addScaledVector(this.vel, dt); this.spin += dt * 5; this.mesh.rotation.set(0.3, this.yaw + this.spin * this.spin * 0.3, 0.4);
      FX.fire(this.pos, 1.3);
      if (this.pos.y <= terrainH(this.pos.x, this.pos.z) + 1 || this.fallT > 8) { detonate(this.pos, 10, 150, { src: 'heli', big: true }); addFire(this.pos.clone(), 1.8, 60); this.dispose(); }
      this.mesh.position.copy(this.pos); this.updateBox(); return;
    }
    if (this.hp < this.hpMax * 0.4) { this.smokeT -= dt; if (this.smokeT <= 0) { this.smokeT = 0.05; FX.norm.emit(this.pos.x, this.pos.y, this.pos.z, rand(-1, 1), 1, rand(-1, 1), 3, 1.2, 5, COL.smoke0, COL.smoke1, 0.6, 0.5, -0.4, 1); } }
    const tgt = playerTarget(_v1).clone();
    let dest;
    if (this.landAt && this.phase !== 'leave') {
      this.phaseT += dt;
      const g = terrainH(this.landAt.x, this.landAt.z);
      if (this.phase === 'approach') { dest = new V3(this.landAt.x, g + 22, this.landAt.z); if (this.pos.distanceTo(dest) < 8) { this.phase = 'descend'; this.phaseT = 0; } }
      else if (this.phase === 'descend') { dest = new V3(this.landAt.x, g + 3.5, this.landAt.z); if (this.pos.y < g + 5) { this.phase = 'unload'; this.phaseT = 0; } }
      else if (this.phase === 'unload') {
        dest = new V3(this.landAt.x, g + 3.5, this.landAt.z);
        if (this.troops > 0 && this.phaseT > 0.8) { this.phaseT = 0.2; this.troops--; const a = rand(0, TAU); const e = addEnemy(pick(this.o.types || ['rifle', 'rifle', 'shotgun']), this.pos.x + Math.cos(a) * 4, this.pos.z + Math.sin(a) * 4, Object.assign({ combat: true, group: this.o.group || 'drop' }, this.o.enemyOpt || {})); if (this.o.onTroop) this.o.onTroop(e); }
        if (this.troops <= 0 && this.phaseT > 1.2) { this.phase = 'leave'; this.leaveDir = rand(0, TAU); }
      }
    } else if (this.phase === 'leave') { dest = this.pos.clone().add(new V3(Math.cos(this.leaveDir) * 60, 20, Math.sin(this.leaveDir) * 60)); if (this.pos.y > 140) { this.dispose(); return; } }
    else {
      this.orbitA += dt * (this.o.orbitSpeed || 0.22);
      dest = new V3(tgt.x + Math.cos(this.orbitA) * this.orbitR, Math.max(terrainH(tgt.x, tgt.z), 0) + this.alt, tgt.z + Math.sin(this.orbitA) * this.orbitR);
    }
    const want = dest.sub(this.pos); const dl = want.length(); if (dl > 0.01) want.multiplyScalar(Math.min(1, dl / 20) * (this.o.speed || 22) / dl);
    this.vel.lerp(want, 1 - Math.exp(-dt * 1.2)); this.pos.addScaledVector(this.vel, dt);
    const gmin = terrainH(this.pos.x, this.pos.z) + 3; if (this.pos.y < gmin) this.pos.y = gmin;
    const faceYaw = this.phase === 'leave' ? Math.atan2(this.vel.x, this.vel.z) : Math.atan2(tgt.x - this.pos.x, tgt.z - this.pos.z);
    this.yaw += angDiff(this.yaw, faceYaw) * Math.min(1, dt * 1.5);
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), fwdV = this.vel.x * fx + this.vel.z * fz, sideV = this.vel.x * fz - this.vel.z * fx;
    this.mesh.position.copy(this.pos); this.mesh.rotation.set(0, this.yaw, 0); this.mesh.rotateX(clamp(fwdV * 0.02, -0.35, 0.35)); this.mesh.rotateZ(clamp(-sideV * 0.02, -0.35, 0.35));
    this.updateBox();
    // weapons (gunship only, not while unloading)
    if (this.kind === 'gunship' && player.alive && this.phase !== 'leave') {
      const d = this.pos.distanceTo(tgt);
      this.fireT -= dt; this.rocketT -= dt;
      if (d < 140 && this.fireT <= 0) {
        const nose = this.pos.clone().add(new V3(fx * 3, -1.2, fz * 3)), dir = tgt.clone().sub(nose).normalize();
        const blocked = castRay(nose, dir, d - 1, { noEnemies: true, ignore: this, ignoreCar: player.inVehicle });
        if (!blocked || blocked.col && blocked.col.target === this) {
          if (this.burst <= 0) this.burst = randi(8, 14);
          this.burst--; this.fireT = this.burst > 0 ? 0.09 : rand(1.4, 2.4);
          const hit = Math.random() < (player.inVehicle ? 0.3 : 0.16) * (d < 60 ? 1.2 : 0.8);
          const end = hit ? tgt.clone().add(new V3(rand(-.3, .3), rand(-.5, .2), rand(-.3, .3))) : tgt.clone().add(new V3(rand(-4, 4), rand(-2, 1), rand(-4, 4)));
          if (hit) hurtPlayer(6, this.pos); else { const h = castRay(nose, end.clone().sub(nose).normalize(), 200, { noEnemies: true }); if (h) FX.impact(h.point, 'terrain'); }
          Tracers.add(nose, end, true); AudioSys.shot('lmg', nose);
        } else this.fireT = 0.5;
      }
      if (d < 180 && this.rocketT <= 0) {
        this.rocketT = rand(6, 10);
        for (let k = 0; k < 2; k++) after(k * 0.3, () => { if (this.dead) return; const o = this.pos.clone().add(new V3(fx * 3, -1, fz * 3)); const tp = playerTarget(new V3()).add(new V3(rand(-5, 5), 0, rand(-5, 5))); projectiles.push(new Projectile('rocket', o, tp.sub(o).normalize().multiplyScalar(80), { owner: 'air', max: 110, r: 6, dmg: 80 })); });
      }
    }
  }
  dispose() { this.dead = true; this.gone = true; scene.remove(this.mesh); if (this.snd) this.snd.stop(); removeCol(this); }
}

/* ---------- auto turret ---------- */
class Turret {
  constructor(x, y, z, o) {
    o = o || {}; this.mesh = buildTurretMesh(); this.mesh.position.set(x, y, z); scene.add(this.mesh); this.U = this.mesh.userData;
    this.pos = new V3(x, y + 1.45, z); this.hp = o.hp || 320; this.dead = false; this.active = o.active !== false; this.radius = 1.2; this.range = o.range || 48;
    this.yaw = o.yaw || 0; this.fireT = 1; this.burst = 0; this.canSee = false; this.percT = 0; this.o = o; this.aimT = 0;
    addTarget(this, new THREE.Box3(new V3(x - 0.9, y, z - 0.9), new V3(x + 0.9, y + 2.1, z + 0.9)));
    this.col.cover = true;
    this.U.eye.material = this.active ? M.redLamp : M.black;
  }
  onAlarm() { if (this.o.alarmOnly) { this.active = true; this.U.eye.material = M.redLamp; } }
  damage(d) { if (this.dead) return; this.hp -= d; HUD.hit(false, false); if (this.hp <= 0) this.destroy(); }
  destroy() { this.dead = true; this.active = false; detonate(this.pos, 4, 40, { src: 'turret' }); this.U.head.rotation.x = 0.5; this.mesh.traverse(o => { if (o.isMesh) o.material = M.burnt; }); addFire(this.pos, 0.6, 30); stats.kills++; HUD.feed('✕ TURRET DESTROYED', 'gold'); if (this.o.onDestroy) this.o.onDestroy(this); }
  update(dt) {
    if (this.dead || !this.active || !player.alive) { if (this.U.flash) this.U.flash.visible = false; return; }
    const tgt = playerTarget(_v2).clone(), d = this.pos.distanceTo(tgt);
    this.percT -= dt;
    if (this.percT <= 0) { this.percT = 0.25; this.canSee = d < this.range && !castRay(this.pos, tgt.clone().sub(this.pos).normalize(), d - 0.5, { noEnemies: true, ignore: this, ignoreCar: player.inVehicle }); }
    const want = Math.atan2(-(tgt.x - this.pos.x), -(tgt.z - this.pos.z));
    if (this.canSee) this.yaw += angDiff(this.yaw, want) * Math.min(1, dt * 3); else this.yaw += dt * 0.4;
    this.U.head.rotation.y = this.yaw; this.U.head.rotation.x = this.canSee ? Math.atan2(tgt.y - this.pos.y, Math.hypot(tgt.x - this.pos.x, tgt.z - this.pos.z)) : 0;
    this.U.flash.visible = false;
    if (!this.canSee || Math.abs(angDiff(this.yaw, want)) > 0.25) { this.aimT = 0; return; }
    this.aimT += dt; if (this.aimT < 0.6) return;
    this.fireT -= dt; if (this.fireT > 0) return;
    if (this.burst <= 0) this.burst = randi(6, 10);
    this.burst--; this.fireT = this.burst > 0 ? 0.1 : rand(0.9, 1.5);
    const m = this.U.muzzle.getWorldPosition(new V3());
    const hit = Math.random() < 0.28 * clamp(1.2 - d / this.range, 0.3, 1) * (player.sprint ? 0.6 : 1);
    const end = hit ? tgt.clone() : tgt.clone().add(new V3(rand(-2, 2), rand(-1, 1), rand(-2, 2)));
    if (hit) hurtPlayer(this.o.dmg || 6, this.pos);
    Tracers.add(m, end, true); AudioSys.shot('lmg', m); this.U.flash.visible = true;
  }
  dispose() { scene.remove(this.mesh); removeCol(this); }
}

/* ---------- security camera ---------- */
class SecCam {
  constructor(x, y, z, yaw, o) {
    o = o || {}; this.mesh = buildCameraMesh(); this.mesh.position.set(x, y, z); this.mesh.rotation.y = yaw; scene.add(this.mesh); this.U = this.mesh.userData;
    this.baseYaw = yaw; this.sweep = o.sweep ?? 0.7; this.t = rand(0, 6); this.susp = 0; this.dead = false; this.hp = 12; this.radius = 0.5; this.range = o.range || 17;
    this.pos = new V3(); this.mesh.updateMatrixWorld(true); this.U.pivot.getWorldPosition(this.pos);
    addTarget(this, new THREE.Box3(this.pos.clone().subScalar(0.3), this.pos.clone().addScalar(0.3)));
    this.col.noFX = false;
  }
  damage(d) { if (this.dead) return; this.hp -= d; if (this.hp <= 0) { this.dead = true; FX.sparks(this.pos, 18); this.U.cone.visible = false; this.U.led.material = M.black; this.U.pivot.rotation.x = 0.7; AudioSys.ui('crash'); HUD.feed('✕ CAMERA DISABLED'); removeCol(this); } }
  update(dt) {
    if (this.dead) return;
    this.t += dt; const alarm = Fixtures.alarm > 0;
    const yawL = Math.sin(this.t * 0.45) * this.sweep; this.U.pivot.rotation.set(0.35, yawL, 0);
    const worldYaw = this.baseYaw + yawL;
    let sees = false;
    if (player.alive && !player.inVehicle) {
      const tgt = playerTarget(_v2), dx = tgt.x - this.pos.x, dy = tgt.y - this.pos.y, dz = tgt.z - this.pos.z, d = Math.hypot(dx, dy, dz);
      if (d < this.range) {
        const fx = -Math.sin(worldYaw), fz = -Math.cos(worldYaw), fy = -Math.sin(0.35), hl = Math.cos(0.35);
        const cosA = (dx * fx * hl + dy * fy + dz * fz * hl) / d;
        if (cosA > Math.cos(0.45)) sees = !castRay(this.pos, _v3.set(dx, dy, dz).divideScalar(d), d - 0.4, { noEnemies: true, ignore: this });
      }
    }
    this.susp = clamp(this.susp + (sees ? dt * (player.crouch ? 0.6 : 1) : -dt * 0.5), 0, 1.2);
    if (this.susp >= 1.2 && !alarm) triggerAlarm(player.pos, 16);
    const k = this.susp / 1.2; this.U.cone.material.color.setRGB(1, 0.82 * (1 - k), 0.23 * (1 - k)); this.U.cone.material.opacity = 0.06 + k * 0.12;
    this.U.led.visible = Math.sin(this.t * (sees ? 20 : 3)) > 0;
  }
  dispose() { scene.remove(this.mesh); removeCol(this); }
}

/* ---------- sliding door ---------- */
class Door {
  constructor(x, z, axis, o) {
    o = o || {}; this.o = o; this.axis = axis; this.w = o.w || 3.2; this.h = o.h || 3.0; this.locked = !!o.locked; this.key = o.key || null; this.open = 0; this.want = 0; this.dead = false;
    this.pos = new V3(x, 1.5, z); this.label = o.label || 'Door';
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); this.mesh = g;
    const mat = o.mat || M.hazard;
    this.p1 = part(g, axis === 'x' ? B(this.w / 2, this.h, 0.25) : B(0.25, this.h, this.w / 2), mat, 0, this.h / 2, 0);
    this.p2 = part(g, axis === 'x' ? B(this.w / 2, this.h, 0.25) : B(0.25, this.h, this.w / 2), mat, 0, this.h / 2, 0);
    this.lamp = part(g, B(0.25, 0.25, 0.3), this.locked ? M.redLamp : M.lamp, axis === 'x' ? this.w / 2 + 0.3 : 0, this.h + 0.3, axis === 'x' ? 0 : this.w / 2 + 0.3, 0, 0, 0, false);
    const half = this.w / 2;
    this.col = { box: axis === 'x' ? new THREE.Box3(new V3(x - half, 0, z - 0.2), new V3(x + half, this.h, z + 0.2)) : new THREE.Box3(new V3(x - 0.2, 0, z - half), new V3(x + 0.2, this.h, z + half)), ref: this, noGround: true, metal: true, dyn: true };
    colliders.push(this.col); actors.push(this); interactables.push(this);
    this.place();
  }
  place() {
    const off = this.w / 4 + this.open * this.w / 2 * 0.95;
    if (this.axis === 'x') { this.p1.position.x = -off; this.p2.position.x = off; } else { this.p1.position.z = -off; this.p2.position.z = off; }
  }
  unlock() { this.locked = false; this.lamp.material = M.lamp; }
  openNow() { this.unlock(); this.want = 1; this.forced = true; }
  update(dt) {
    if (this.forced) this.want = 1;
    else if (!this.locked && this.o.auto !== false) { const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z); let near = d < 4.5; if (!near) for (const e of enemies) if (e.alive && Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) < 3.5) { near = true; break; } this.want = near || this.o.stayOpen && this.open > 0 ? 1 : 0; }
    const prev = this.open; this.open = clamp(this.open + (this.want ? 1 : -1) * dt * (this.o.speed || 1.6), 0, 1);
    if (prev !== this.open) { this.place(); if (prev === 0 || this.open === 0) AudioSys.ui('door'); }
    this.col.noCol = this.col.noRay = this.open > 0.55;
  }
  interLabel() { if (this.locked) return this.key && player.keys.has(this.key) ? 'Unlock ' + this.label + ' (' + this.key.toUpperCase() + ' keycard)' : this.label + ' — locked' + (this.key ? ' (' + this.key.toUpperCase() + ' keycard)' : ''); return null; }
  act() { if (this.locked && this.key && player.keys.has(this.key)) { this.unlock(); this.want = 1; AudioSys.ui('pickup'); HUD.feed('✓ ' + this.label.toUpperCase() + ' UNLOCKED'); if (this.o.onOpen) this.o.onOpen(this); } else if (this.locked) { AudioSys.ui('empty'); HUD.hint(this.o.lockedMsg || 'Locked.', 2.5); } }
  dispose() { scene.remove(this.mesh); const i = colliders.indexOf(this.col); if (i >= 0) colliders.splice(i, 1); }
}
/* generic interactive object: terminal, panel, etc. */
class Interact {
  constructor(pos, label, act, o) { o = o || {}; this.pos = pos.clone(); this._label = label; this.fn = act; this.range = o.range || 2.2; this.once = o.once !== false; this.used = false; this.enabled = o.enabled || (() => true); interactables.push(this); this.dead = false; }
  interLabel() { return this.used && this.once ? null : (this.enabled() ? (typeof this._label === 'function' ? this._label() : this._label) : null); }
  act() { if (this.used && this.once) return; if (!this.enabled()) return; this.used = true; this.fn(this); }
  dispose() { this.dead = true; }
}

/* ---------- laser tripwire ---------- */
class Tripwire {
  constructor(a, b, o) {
    o = o || {}; this.a = a.clone(); this.b = b.clone(); this.on = true; this.o = o; this.dead = false; this.tripped = false;
    const len = a.distanceTo(b), m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 6), new THREE.MeshBasicMaterial({ color: 0xff2010, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize()); scene.add(m); this.mesh = m;
    for (const p of [a, b]) { const e = part(scene, B(0.14, 0.14, 0.14), M.darkMetal, p.x, p.y, p.z, 0, 0, 0, false); (this.ends = this.ends || []).push(e); }
    actors.push(this);
  }
  update(dt) {
    if (!this.on) { this.mesh.visible = false; return; }
    this.mesh.material.opacity = 0.6 + 0.3 * Math.sin(gameTime * 20);
    if (!player.alive) return;
    const feet = player.pos.y, head = player.pos.y + (player.crouch ? 1.2 : 1.8);
    // closest approach between the beam (horizontal) and the player's vertical capsule
    const ab = _v1.copy(this.b).sub(this.a), L = ab.length(); ab.divideScalar(L);
    const t = clamp((player.pos.x - this.a.x) * ab.x + (player.pos.z - this.a.z) * ab.z, 0, L);
    const px = this.a.x + ab.x * t, py = this.a.y + ab.y * t, pz = this.a.z + ab.z * t;
    const hd = Math.hypot(player.pos.x - px, player.pos.z - pz);
    if (hd < 0.35 && py > feet + 0.05 && py < head) {
      if (!this.tripped) { this.tripped = true; setTimeout(() => this.tripped = false, 4000); AudioSys.ui('empty'); triggerAlarm(player.pos, 18); if (this.o.onTrip) this.o.onTrip(this); }
    }
  }
  dispose() { scene.remove(this.mesh); for (const e of this.ends || []) scene.remove(e); }
}

/* ---------- civilians (ambient, flee from danger) ---------- */
let civilians = [];
const CIV_COLS = [0x3a5f8a, 0x8a3a3a, 0x6a6a6a, 0xc8b89a, 0x2e2e2e, 0x5a7a4a, 0x9a6a2a, 0xd0d0d0];
class Civilian {
  constructor(x, z) {
    const m = buildSoldier('rifle', { noGun: true, color: pick(CIV_COLS), gear: pick(CIV_COLS), balaclava: false }); this.parts = m; this.mesh = m.root; scene.add(this.mesh);
    // civilians have bare heads: drop the helmet
    this.pos = new V3(x, terrainH(x, z), z); this.yaw = rand(0, TAU); this.alive = true; this.target = null; this.speed = rand(1.2, 1.8); this.fear = 0; this.ph = rand(0, 6); this.deadT = 0; this.from = new V3();
  }
  scare(p, amt) { if (!this.alive) return; if (this.pos.distanceTo(p) < 45) { this.fear = Math.max(this.fear, amt || 8); this.from.copy(p); this.target = null; } }
  kill(dir) { if (!this.alive) return; this.alive = false; this.fall = dir ? Math.sign(dir.x + dir.z) || 1 : 1; }
  update(dt) {
    if (!this.alive) { this.deadT += dt; const k = Math.min(1, this.deadT / 0.5); this.mesh.rotation.set(k * 1.5, this.yaw, 0); if (this.deadT > 25) { this.gone = true; scene.remove(this.mesh); } return; }
    this.fear = Math.max(0, this.fear - dt);
    let tx, tz, sp;
    if (this.fear > 0) { const a = Math.atan2(this.pos.x - this.from.x, this.pos.z - this.from.z) + Math.sin(this.ph) * 0.4; tx = this.pos.x + Math.sin(a) * 10; tz = this.pos.z + Math.cos(a) * 10; sp = 5.8; }
    else { if (!this.target || Math.hypot(this.target.x - this.pos.x, this.target.z - this.pos.z) < 1) this.target = LV.civTarget ? LV.civTarget(this.pos) : new V3(this.pos.x + rand(-15, 15), 0, this.pos.z + rand(-15, 15)); tx = this.target.x; tz = this.target.z; sp = this.speed; }
    const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz) || 1;
    this.pos.x += dx / d * sp * dt; this.pos.z += dz / d * sp * dt;
    this.pos.y = collideCircle(this.pos, 0.35, this.pos.y, this.pos.y + 1.7);
    this.yaw += angDiff(this.yaw, Math.atan2(-dx, -dz)) * Math.min(1, dt * 8);
    this.ph += dt * sp * 2.2; const sw = Math.sin(this.ph) * (sp > 3 ? 0.9 : 0.5);
    this.parts.legs[0].rotation.x = sw; this.parts.legs[1].rotation.x = -sw; this.parts.knees[0].rotation.x = Math.max(0, -Math.sin(this.ph)); this.parts.knees[1].rotation.x = Math.max(0, Math.sin(this.ph));
    const arms = this.mesh.userData.arms; if (arms) { arms[0].rotation.x = -sw * 0.8 + (this.fear > 0 ? -2.6 : 0); arms[1].rotation.x = sw * 0.8 + (this.fear > 0 ? -2.6 : 0); }
    this.mesh.position.copy(this.pos); this.mesh.rotation.set(0, this.yaw, 0);
    // vehicles run civilians over
    for (const c of cars) { if (Math.abs(c.speed) < 5) continue; const ex = this.pos.x - c.pos.x, ez = this.pos.z - c.pos.z, lz = ex * c.fwdX + ez * c.fwdZ, lx = ex * c.fwdZ - ez * c.fwdX; if (Math.abs(lz) < c.l * 0.55 && Math.abs(lx) < c.w * 0.6) { this.kill(_v3.set(c.fwdX, 0, c.fwdZ)); FX.impact(this.pos.clone().setY(this.pos.y + 1), 'blood'); } }
  }
  dispose() { scene.remove(this.mesh); }
}
function scareCivilians(p, amt) { for (const c of civilians) c.scare(p, amt); }

/* ---------- collapsing structure ---------- */
class Collapse {
  constructor(mesh, col, o) {
    o = o || {}; this.mesh = mesh; this.col = col; this.t = 0; this.dur = o.dur || 5; this.tilt = o.tilt || new V3(rand(-0.25, 0.25), 0, rand(-0.25, 0.25)); this.y0 = mesh.position.y; this.dead = false;
    this.h = col ? col.box.max.y - col.box.min.y : 30; this.base = mesh.position.clone(); this.base.y = col ? col.box.min.y : 0; this.o = o; this.dustT = 0;
    actors.push(this); addShake(0.6); AudioSys.boom(this.base, true);
  }
  update(dt) {
    if (this.done) return;
    this.t += dt; const k = Math.min(1, this.t / this.dur), e = k * k;
    this.mesh.position.y = this.y0 - e * this.h * 0.85; this.mesh.rotation.x = this.tilt.x * e; this.mesh.rotation.z = this.tilt.z * e;
    this.dustT -= dt; if (this.dustT <= 0) { this.dustT = 0.05; const r = this.h * 0.3; FX.dust(_v1.set(this.base.x + rand(-r, r), this.base.y + rand(0, 4), this.base.z + rand(-r, r)), 3, true); }
    if (Math.random() < dt * 2) addShake(0.15);
    if (this.col) { const top = this.base.y + (this.h) * (1 - e * 0.85); this.col.box.max.y = Math.max(this.base.y + 2.5, top); }
    if (k >= 1) { this.done = true; if (this.o.onDone) this.o.onDone(this); }
  }
  dispose() { }
}

/* ---------- homing missile (player jet) ---------- */
class Missile {
  constructor(pos, dir, target, owner) { this.pos = pos.clone(); this.vel = dir.clone().multiplyScalar(220); this.target = target; this.owner = owner; this.t = 0; this.dead = false; this.mesh = buildProjMesh('rocket'); this.mesh.scale.setScalar(2); scene.add(this.mesh); actors.push(this); }
  update(dt) {
    if (this.dead) return; this.t += dt;
    if (this.target && !this.target.dead) { const want = this.target.pos.clone().sub(this.pos).normalize().multiplyScalar(this.vel.length()); this.vel.lerp(want, Math.min(1, dt * 3.2)); }
    this.vel.setLength(Math.min(420, this.vel.length() + dt * 160));
    this.pos.addScaledVector(this.vel, dt); this.mesh.position.copy(this.pos); this.mesh.lookAt(this.pos.clone().sub(this.vel));
    FX.trail(this.pos);
    const tg = this.target;
    if (tg && !tg.dead && tg.pos.distanceTo(this.pos) < 12) { this.explode(); tg.damage(200, 'missile'); return; }
    if (this.t > 7 || this.pos.y < terrainH(this.pos.x, this.pos.z)) this.explode();
  }
  explode() { if (this.dead) return; this.dead = true; this.gone = true; scene.remove(this.mesh); FX.explosion(this.pos, 8); Lights.flash(this.pos, 10, 0.4, 80); AudioSys.boom(this.pos); }
  dispose() { this.dead = true; scene.remove(this.mesh); }
}

/* ---------- enemy fighter (dogfight AI) ---------- */
let fighters = [];
class Fighter {
  constructor(pos, o) {
    o = o || {}; this.pos = pos.clone(); this.dir = new V3(rand(-1, 1), 0, rand(-1, 1)).normalize(); this.speed = o.speed || 160; this.hp = o.hp || 70; this.dead = false; this.radius = 9;
    this.mesh = buildJet(); scene.add(this.mesh); this.fireT = rand(1, 3); this.evadeT = 0; this.evade = new V3(); this.snd = AudioSys.loop('jet', this.pos); this.roll = 0; this.fallT = 0;
    fighters.push(this); actors.push(this);
  }
  damage(d) {
    if (this.dead) return; this.hp -= d; HUD.hit(false, this.hp <= 0);
    if (this.hp <= 0) { this.dead = true; this.falling = true; stats.kills++; HUD.feed('✕ BANDIT SPLASHED', 'gold'); AudioSys.boom(this.pos); FX.explosion(this.pos, 9); Lights.flash(this.pos, 12, 0.5, 120); }
    else if (Math.random() < 0.5) { this.evadeT = rand(1.5, 3); this.evade.set(rand(-1, 1), rand(-0.3, 0.6), rand(-1, 1)).normalize(); }
  }
  update(dt) {
    if (this.snd) this.snd.setPos(this.pos);
    if (this.falling) { this.fallT += dt; this.dir.y -= dt * 0.6; this.dir.normalize(); this.pos.addScaledVector(this.dir, this.speed * dt); this.mesh.position.copy(this.pos); this.mesh.rotateZ(dt * 6); FX.fire(this.pos, 1.4); if (this.pos.y < Math.max(0, terrainH(this.pos.x, this.pos.z)) || this.fallT > 9) { FX.explosion(this.pos, 10); FX.dust(this.pos, 10, true); this.dispose(); } return; }
    const pj = Flight.jet; if (!pj) return;
    let want;
    if (this.evadeT > 0) { this.evadeT -= dt; want = this.evade; }
    else {
      const lead = pj.pos.clone().addScaledVector(pj.fwd, pj.speed * 0.8);
      want = lead.sub(this.pos); const d = want.length(); want.normalize();
      if (d < 140) { this.evadeT = rand(1.5, 2.5); this.evade.copy(this.dir).add(new V3(rand(-1, 1), rand(-0.2, 0.5), rand(-1, 1))).normalize(); }
    }
    const minY = Math.max(0, terrainH(this.pos.x, this.pos.z)) + 60; if (this.pos.y < minY) want.y = Math.max(want.y, 0.5);
    const prev = this.dir.clone();
    this.dir.lerp(want, Math.min(1, dt * 0.9)).normalize();
    const turn = prev.clone().cross(this.dir).y; this.roll = lerp(this.roll, clamp(-turn * 60, -1.2, 1.2), dt * 3);
    this.pos.addScaledVector(this.dir, this.speed * dt);
    this.mesh.position.copy(this.pos); this.mesh.lookAt(this.pos.clone().add(this.dir)); this.mesh.rotateZ(this.roll);
    // guns
    this.fireT -= dt;
    const to = pj.pos.clone().sub(this.pos), dist = to.length(); to.normalize();
    if (this.fireT <= 0 && dist < 750 && to.dot(this.dir) > 0.97) {
      this.fireT = 0.12;
      if (Math.random() < 0.06) { this.fireT = rand(1.2, 2.2); }
      const hit = Math.random() < 0.16;
      const end = pj.pos.clone().add(hit ? new V3() : new V3(rand(-12, 12), rand(-8, 8), rand(-12, 12)));
      Tracers.add(this.pos.clone().addScaledVector(this.dir, 8), end, true); if (hit) pj.hurt(2.2, this.pos);
      if (dist < 300) AudioSys.shot('smg', this.pos);
    }
  }
  dispose() { this.dead = true; this.gone = true; scene.remove(this.mesh); if (this.snd) this.snd.stop(); }
}

/* ---------- player jet (arcade flight model) ---------- */
const Flight = { jet: null };
class PlayerJet {
  constructor(pos, yaw, o) {
    o = o || {}; this.o = o;
    this.mesh = new THREE.Group(); const j = buildJet(); j.rotation.y = Math.PI; this.mesh.add(j); scene.add(this.mesh); this.body = j;
    if (o.rearSeat) { const hd = part(j, new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: 0x2a1a14 }), 0, 1.0, 2.6, 0, 0, 0, false); this.rear = hd; }
    this.pos = pos.clone(); this.q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0, 'YXZ'));
    this.speed = 0; this.throttle = 0.2; this.hp = 100; this.dead = false; this.onGround = true; this.gunT = 0; this.missiles = 16; this.lockT = 0; this.lockTarget = null; this.missileCd = 0;
    this.fwd = new V3(0, 0, -1).applyQuaternion(this.q); this.control = true; this.camQ = this.q.clone(); this.camPos = pos.clone(); this.spin = 0;
    this.snd = AudioSys.loop('jet', this.pos);
    Flight.jet = this;
  }
  hurt(d, from) { if (this.dead || this.o.invuln) return; this.hp -= d; addShake(0.12); AudioSys.ui('hurt'); HUD.damage(d * 2, from); if (this.hp <= 0) this.crash(); }
  crash() { if (this.dead) return; this.dead = true; detonate(this.pos, 10, 0, { src: 'jet', big: true }); scene.remove(this.mesh); if (this.snd) this.snd.stop(); if (this.o.onCrash) this.o.onCrash(this); else { player.alive = true; killPlayer(); } }
  update(dt) {
    if (this.dead) return;
    if (this.o.holdIntro && state !== 'play') { this.mesh.position.copy(this.pos); this.mesh.quaternion.copy(this.q); this.fwd.set(0, 0, -1).applyQuaternion(this.q); return; }
    const k = keys, sens = 0.0016 * settings.sens;
    let pitch = 0, roll = 0, yawI = 0;
    if (this.control) {
      pitch = -mouseDY * sens * (settings.invertY ? -1 : 1) * 1.6; roll = -mouseDX * sens * 2.2;
      if (Pad.connected) { pitch += Pad.ly * 1.5 * dt * (settings.invertY ? -1 : 1) * settings.padSens; roll += -Pad.lx * 2.4 * dt * settings.padSens; if (Pad.held(4)) yawI += 0.5 * dt; if (Pad.held(5)) yawI -= 0.5 * dt; this.throttle = clamp(this.throttle + (Pad.rt - Pad.lt) * dt * 0.6, 0, 1); }
      if (k.KeyA) yawI += 0.5 * dt; if (k.KeyD) yawI -= 0.5 * dt;
      if (k.KeyQ) roll += 1.8 * dt; if (k.KeyE) roll -= 1.8 * dt;
      if (k.KeyW) this.throttle = Math.min(1, this.throttle + dt * 0.5); if (k.KeyS) this.throttle = Math.max(0, this.throttle - dt * 0.5);
    } else if (this.spin) { roll = this.spin * dt; pitch = -0.35 * dt; }
    if (this.onGround) { roll = 0; yawI *= 0.5; if (this.speed < 55) pitch = Math.max(0, pitch) * 0; }
    const boost = (k.ShiftLeft || Pad.held(10)) && this.control ? 90 : 0;
    const target = 40 + this.throttle * 190 + boost;
    this.speed += (target - this.speed) * Math.min(1, dt * (this.onGround ? 0.35 : 0.6));
    this.speed -= this.fwd.y * 30 * dt;
    if (!this.onGround) this.speed = Math.max(this.speed, 55);
    const qd = new THREE.Quaternion();
    qd.setFromAxisAngle(_v1.set(1, 0, 0), pitch); this.q.multiply(qd);
    qd.setFromAxisAngle(_v1.set(0, 0, 1), roll); this.q.multiply(qd);
    qd.setFromAxisAngle(_v1.set(0, 1, 0), yawI); this.q.multiply(qd);
    this.q.normalize();
    this.fwd.set(0, 0, -1).applyQuaternion(this.q);
    this.pos.addScaledVector(this.fwd, this.speed * dt);
    const ground = Math.max(terrainH(this.pos.x, this.pos.z), LV.waterLevel !== undefined ? LV.waterLevel : -1e9);
    if (this.onGround) {
      this.pos.y = ground + 1.6;
      const e = new THREE.Euler().setFromQuaternion(this.q, 'YXZ');
      if (e.x > 0.06 && this.speed > 62) { this.onGround = false; this.airT = 0; HUD.feed('WHEELS UP', 'gold'); }
      else { e.x = Math.max(0, e.x); e.z = 0; this.q.setFromEuler(e); }
    } else { this.airT = (this.airT || 0) + dt; if (this.pos.y < ground + (this.airT < 2 ? 0.5 : 1.5)) { if (this.airT < 2 && this.control) { this.pos.y = ground + 0.5; } else { this.crash(); return; } } }
    this.mesh.position.copy(this.pos); this.mesh.quaternion.copy(this.q);
    for (const s of this.body.userData.glow || []) { const kk = 0.5 + this.throttle + (boost ? 0.6 : 0) + Math.random() * 0.2; s.scale.set(3 * kk, 3 * kk, 1); }
    if (this.snd) this.snd.setPos(this.pos);
    // weapons
    this.gunT -= dt; this.missileCd -= dt;
    if (this.control && !this.onGround) {
      if ((mouseDown[0] || Pad.held(0)) && this.gunT <= 0) { this.gunT = 0.06; this.fireGun(); Pad.rumble(0.15, 0.3, 60); }
      this.updateLock(dt);
      if ((mouseDown[2] || Pad.pressed(1) || firePressed && keys.KeyF) && this.missileCd <= 0 && this.lockTarget && this.lockT >= 1 && this.missiles > 0) {
        this.missileCd = 0.8; this.missiles--; new Missile(this.pos.clone().addScaledVector(this.fwd, 6).add(_v2.set(0, -1.5, 0).applyQuaternion(this.q)), this.fwd, this.lockTarget, 'player'); AudioSys.shot('rocket', null); HUD.feed('FOX 2');
      }
    }
    AudioSys.combatTarget = 1;
  }
  fireGun() {
    const o = this.pos.clone().addScaledVector(this.fwd, 7), spread = 0.012;
    const d = this.fwd.clone().add(new V3(rand(-spread, spread), rand(-spread, spread), rand(-spread, spread))).normalize();
    let best = null, bd = 1400;
    for (const f of fighters) { if (f.dead) continue; const to = f.pos.clone().sub(o), t = to.dot(d); if (t < 0 || t > bd) continue; const miss = to.addScaledVector(d, -t).length(); if (miss < f.radius) { bd = t; best = f; } }
    for (const h of targets) { if (h.dead || !(h instanceof Heli)) continue; const to = h.pos.clone().sub(o), t = to.dot(d); if (t < 0 || t > bd) continue; if (to.addScaledVector(d, -t).length() < 6) { bd = t; best = h; } }
    const end = o.clone().addScaledVector(d, best ? bd : 1400);
    Tracers.add(o, end, false); AudioSys.shot('smg', null); stats.shots++;
    if (best) { best.damage(9, 'gun'); stats.hits++; FX.sparks(end, 4); }
  }
  updateLock(dt) {
    let best = null, ba = 0.94;
    for (const f of fighters) { if (f.dead) continue; const to = f.pos.clone().sub(this.pos), d = to.length(); if (d > 2200) continue; const a = to.normalize().dot(this.fwd); if (a > ba) { ba = a; best = f; } }
    if (best !== this.lockTarget) { this.lockTarget = best; this.lockT = 0; }
    if (best) { const was = this.lockT; this.lockT += dt; if (was < 1 && this.lockT >= 1) AudioSys.ui('head'); else if (this.lockT < 1 && Math.floor(this.lockT * 8) !== Math.floor(was * 8)) AudioSys.ui('click'); }
  }
  camera(dt) {
    const back = new V3(0, 3.6, 17).applyQuaternion(this.q);
    const want = this.pos.clone().add(back);
    this.camPos.lerp(want, 1 - Math.exp(-dt * 9)); this.camQ.slerp(this.q, 1 - Math.exp(-dt * 6));
    camera.position.copy(this.camPos); camera.quaternion.copy(this.camQ);
    camera.rotateX(-0.08); camera.position.x += Shake.x * 2; camera.position.y += Shake.y * 2;
    const fovT = baseFov + (this.speed - 100) * 0.05;
    if (Math.abs(camera.fov - fovT) > 0.1) { camera.fov = lerp(camera.fov, clamp(fovT, 60, 100), dt * 3); camera.updateProjectionMatrix(); updatePointScale(); }
  }
  dispose() { scene.remove(this.mesh); if (this.snd) this.snd.stop(); if (Flight.jet === this) Flight.jet = null; }
}

/* ---------- water surface ---------- */
function buildWater(y, size, cx, cz) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1).rotateX(-Math.PI / 2), M.water);
  m.position.set(cx || 0, y, cz || 0); m.renderOrder = 1; scene.add(m);
  TEX.waterN.repeat.set(size / 40, size / 40);
  return m;
}
function updateWater(dt) { if (TEX.waterN) { TEX.waterN.offset.x += dt * 0.012; TEX.waterN.offset.y += dt * 0.008; } }
