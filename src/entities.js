/* ============================================================
   ENTITIES: enemies (AI), vehicles, aircraft, projectiles,
   destructible props, pickups, explosions
   ============================================================ */
let enemies = [], cars = [], props = [], pickups = [], aircraft = [], projectiles = [], fires = [], coverPoints = [];
let gameTime = 0;
const timers = [];
function after(t, fn) { timers.push({ t: gameTime + t, fn }); }
function runTimers() { for (let i = timers.length - 1; i >= 0; i--) { if (gameTime >= timers[i].t) { const f = timers[i].fn; timers.splice(i, 1); f(); } } }

const ETYPES = {
  rifle: { hp: 100, speed: 3.8, range: 80, acc: 0.3, dmg: 7, rpm: 460, burst: [3, 6], pause: [0.7, 1.6], mag: 30, reload: 2.2, aim: 0.45, sight: 70, color: 0x6b6446, gear: 0x3d3b2c, snd: 'ar', drop: 'ar', scale: 1 },
  shotgun: { hp: 120, speed: 4.6, range: 20, acc: 0.5, dmg: 5.5, pellets: 6, rpm: 70, burst: [1, 1], pause: [0.9, 1.3], mag: 6, reload: 2.6, aim: 0.35, sight: 55, color: 0x3c3f45, gear: 0x24262a, snd: 'shotgun', drop: 'shotgun', scale: 1 },
  heavy: { hp: 300, speed: 2.5, range: 50, acc: 0.22, dmg: 7, rpm: 720, burst: [9, 18], pause: [1.2, 2], mag: 90, reload: 3.4, aim: 0.6, sight: 60, color: 0x26282c, gear: 0x151618, snd: 'lmg', drop: 'rocket', scale: 1.14, headMul: 1.5, balaclava: true },
  sniper: { hp: 80, speed: 3.0, range: 260, acc: 0.55, dmg: 28, rpm: 40, burst: [1, 1], pause: [2.4, 3.4], mag: 5, reload: 3, aim: 1.7, sight: 210, color: 0x7a6a48, gear: 0x524630, snd: 'sniper', drop: 'sniper', scale: 1, laser: true }
};

/* ---------------- enemies ---------------- */
const _tp = new V3(), _e = new V3(), _d = new V3(), _m = new V3();
function playerTarget(v) {
  if (player.inVehicle) return v.copy(player.inVehicle.pos).setY(player.inVehicle.pos.y + 1.5);
  return v.set(player.pos.x, player.pos.y + player.eye - 0.1, player.pos.z);
}
class Enemy {
  constructor(type, x, z, o) {
    o = o || {};
    this.type = type; this.T = o.T || ETYPES[type]; this.hp = this.T.hp * (o.hpMul || 1); this.alive = true;
    const m = buildSoldier(type, o); this.mesh = m.root; this.parts = m; scene.add(this.mesh);
    this.pos = new V3(x, o.y !== undefined ? o.y : terrainH(x, z), z);
    this.yaw = o.yaw !== undefined ? o.yaw : rand(0, TAU); this.faceYaw = this.yaw;
    this.state = 'patrol'; this.awareness = 0; this.lastKnown = new V3(); this.lastSeen = -99; this.combatStart = -99;
    this.patrol = o.patrol || null; this.pi = 0; this.waitT = rand(1, 3);
    this.group = o.group || 'none'; this.mount = o.mount || null; this.mountOff = o.mountOff || [0, 1, 0]; this.noShoot = !!o.noShoot; this.static = !!o.static;
    this.mag = this.T.mag; this.reloadT = 0; this.fireT = rand(0.4, 1.4); this.burstLeft = 0; this.aimT = 0;
    this.moveTarget = null; this.decideT = 0; this.cover = null; this.crouch = false; this.walkPh = rand(0, 6);
    this.canSee = false; this.dist = 999; this.percT = rand(0, 0.25); this.deadT = 0; this.fallSide = 1; this.flinch = 0; this.lastHurt = -99;
    this.home = this.pos.clone(); this.stuckT = 0; this.lastPos = this.pos.clone(); this.moveSpeed = 0; this.flankSide = Math.random() < 0.5 ? -1 : 1;
    this.spotted = -99; this.fleeT = 0; this.searchT = 0; this.flashT = 0;
    if (this.T.laser) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      this.laser = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
      this.laser.frustumCulled = false; this.laser.visible = false; scene.add(this.laser);
    }
    if (o.combat) { this.lastKnown.copy(player.pos); this.enterCombat(true); }
    this.place();
  }
  headSphere(s) { const k = this.T.scale; s.center.set(this.pos.x, this.pos.y + (this.crouch ? 1.2 : 1.66) * k, this.pos.z); s.radius = 0.19 * k; return s; }
  bodyBox(b) { const k = this.T.scale; b.min.set(this.pos.x - 0.3 * k, this.pos.y, this.pos.z - 0.3 * k); b.max.set(this.pos.x + 0.3 * k, this.pos.y + (this.crouch ? 1.05 : 1.47) * k, this.pos.z + 0.3 * k); return b; }
  eye(v) { return v.set(this.pos.x, this.pos.y + (this.crouch ? 1.18 : 1.6) * this.T.scale, this.pos.z); }
  place() { this.mesh.position.copy(this.pos); this.mesh.rotation.set(0, this.yaw, 0); }
  enterCombat(silent) {
    if (!this.alive) return;
    const was = this.state === 'combat';
    this.state = 'combat'; this.awareness = 1;
    if (!was) {
      if (!silent && !this.isBoss && !this.mount) Voice.bark(this.type === 'shotgun' ? 'flank' : 'contact', this.pos);
      this.combatStart = gameTime; this.decideT = 0; this.aimT = 0;
      for (const e of enemies) if (e !== this && e.alive && e.state !== 'combat' && e.group === this.group && e.pos.distanceTo(this.pos) < 55) { e.lastKnown.copy(this.lastKnown); e.combatStart = gameTime; e.state = 'combat'; e.awareness = 1; e.decideT = rand(0.2, 1); }
      Mission.onAlert && Mission.onAlert(this);
    }
  }
  hear(p, loud) {
    if (!this.alive || this.state === 'combat') return;
    const d = this.pos.distanceTo(p);
    if (d < 32 || (loud && d < 70)) { this.lastKnown.copy(p); this.enterCombat(); }
    else { this.state = 'alert'; this.lastKnown.set(p.x + rand(-8, 8), p.y, p.z + rand(-8, 8)); this.moveTarget = this.lastKnown.clone(); this.awareness = Math.max(this.awareness, 0.55); }
  }
  damage(d, dir, head, src) {
    if (!this.alive) return;
    this.hp -= d; this.flinch = 0.22; this.lastHurt = gameTime;
    if (this.hp > 0 && !this.isBoss && d > 12 && Math.random() < 0.25) Voice.bark('hit', this.pos);
    if (dir) this.fallSide = (dir.x * Math.cos(this.yaw) - dir.z * Math.sin(this.yaw)) > 0 ? -1 : 1;
    if (this.state !== 'combat') { playerTarget(this.lastKnown); this.enterCombat(); }
    else if (src === 'player' && !this.canSee) playerTarget(this.lastKnown);
    if (this.hp <= 0) this.die(dir, head, src);
  }
  die(dir, head, src) {
    if (!this.alive) return;
    if (!this.isBoss) { const ally = enemies.find(e => e !== this && e.alive && !e.isBoss && e.pos.distanceTo(this.pos) < 30); if (ally && Math.random() < 0.7) setTimeout(() => ally.alive && Voice.bark('down', ally.pos), 500); }
    this.alive = false; this.deadT = 0; this.crouch = false;
    if (this.cover) { this.cover.occ = null; this.cover = null; }
    if (this.laser) this.laser.visible = false;
    this.parts.flash.visible = false;
    if (src === 'player' || src === 'explosion' || src === 'vehicle') { stats.kills++; if (head) stats.heads++; HUD.kill(head); }
    if (!this.mount && Math.random() < 0.75) {
      const T = this.T, pp = this.pos.clone(); pp.y = terrainH(pp.x, pp.z) + 0.05; pp.x += rand(-0.6, 0.6);
      if (!inv[T.drop] && Math.random() < 0.8) pickups.push(new Pickup('weapon', pp, { weapon: T.drop }));
      else pickups.push(new Pickup(Math.random() < 0.18 ? 'armor' : Math.random() < 0.15 ? 'grenades' : 'ammo', pp));
    }
    Mission.onKill && Mission.onKill(this);
  }
  perceive(tgt) {
    if (!player.alive) { this.canSee = false; return; }
    const e = this.eye(_e), dx = tgt.x - e.x, dy = tgt.y - e.y, dz = tgt.z - e.z, dist = Math.hypot(dx, dy, dz); this.dist = dist;
    const sight = (this.state === 'combat' ? this.T.sight * 1.6 : Math.min(this.T.sight, 72)) * (player.crouch && !player.inVehicle ? 0.7 : 1); this.sightNow = sight;
    if (dist > sight) { this.canSee = false; return; }
    if (this.state !== 'combat' && !this.mount && dist > 5) {
      const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), dot = (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1);
      if (dot < 0.3) { this.canSee = false; return; }
    }
    _d.set(dx, dy, dz).divideScalar(dist);
    const hit = castRay(e, _d, dist - 0.3, { ignore: this, noEnemies: true, ignoreCar: player.inVehicle, ignoreCar2: this.mount });
    this.canSee = !hit;
    if (this.canSee) { this.lastKnown.copy(tgt); this.lastSeen = gameTime; }
  }
  update(dt) {
    if (!this.alive) { this.animateDeath(dt); return; }
    if (this.mount) {
      const m = this.mount;
      if (m.dead) { this.die(null, false, 'vehicle'); return; }
      const [ox, oy, oz] = this.mountOff, c = Math.cos(m.yaw), s = Math.sin(m.yaw);
      this.pos.set(m.pos.x + ox * c + oz * s, m.pos.y + oy, m.pos.z - ox * s + oz * c);
    }
    const tgt = playerTarget(_tp);
    this.percT -= dt; if (this.percT <= 0) { this.percT = 0.2; this.perceive(tgt); }
    this.flinch = Math.max(0, this.flinch - dt);
    if (this.state !== 'combat') {
      if (this.canSee && player.alive) {
        let rate = this.dist < 9 ? 4 : Math.max(0.25, 1.6 - this.dist / (this.sightNow || 72));
        if (player.crouch && !player.inVehicle) rate *= 0.5; if (player.sprint) rate *= 1.5; if (player.inVehicle) rate *= 2.2; if (this.state === 'search' || this.state === 'alert') rate *= 2.5;
        this.awareness += rate * dt;
        if (this.awareness >= 1) this.enterCombat();
      } else this.awareness = Math.max(this.state === 'patrol' ? 0 : 0.3, this.awareness - dt * 0.07);
    }
    switch (this.state) {
      case 'patrol': this.doPatrol(dt); break;
      case 'alert': if (!this.moveTarget || this.pos.distanceTo(this.lastKnown) < 2) { this.state = 'search'; this.searchT = 14; } break;
      case 'search': this.doSearch(dt); break;
      case 'combat': this.doCombat(dt, tgt); break;
    }
    if (!this.mount) this.move(dt);
    else { this.yaw += angDiff(this.yaw, this.faceYaw) * Math.min(1, dt * 6); }
    this.animate(dt, tgt);
  }
  doPatrol(dt) {
    if (this.moveTarget) return;
    this.waitT -= dt;
    if (this.waitT > 0) { if (Math.random() < dt * 0.4) this.faceYaw = this.yaw + rand(-1.2, 1.2); return; }
    this.waitT = rand(2.5, 5);
    if (this.patrol && this.patrol.length) { this.pi = (this.pi + 1) % this.patrol.length; const [x, z] = this.patrol[this.pi]; this.moveTarget = new V3(x, 0, z); }
  }
  doSearch(dt) {
    this.searchT -= dt;
    if (!this.moveTarget) { const a = rand(0, TAU), r = rand(4, 13); this.moveTarget = new V3(this.lastKnown.x + Math.cos(a) * r, 0, this.lastKnown.z + Math.sin(a) * r); }
    if (this.searchT <= 0) { this.state = 'patrol'; this.awareness = 0.2; this.moveTarget = this.home.clone(); }
  }
  doCombat(dt, tgt) {
    const since = gameTime - this.lastSeen;
    if (!this.mount && !this.static && since > 9 && !this.canSee) { this.state = 'search'; this.searchT = 16; this.moveTarget = this.lastKnown.clone(); if (!this.isBoss) Voice.bark('search', this.pos); this.crouch = false; if (this.cover) { this.cover.occ = null; this.cover = null; } return; }
    const aimAt = this.canSee ? tgt : this.lastKnown;
    this.faceYaw = yawTo(this.pos.x, this.pos.z, aimAt.x, aimAt.z);
    this.decideT -= dt;
    if (this.decideT <= 0 && this.fleeT <= 0) { this.decideT = rand(2.2, 4.5); this.decide(aimAt); }
    this.fleeT = Math.max(0, this.fleeT - dt);
    // peek from cover
    const atCover = this.cover && !this.moveTarget;
    this.crouch = !!(atCover && (this.reloadT > 0 || this.fireT > 0.55));
    if (!this.noShoot) this.shooting(dt, tgt);
    AudioSys.combatTarget = 1;
  }
  decide(tgt) {
    const d = Math.hypot(tgt.x - this.pos.x, tgt.z - this.pos.z);
    if (this.mount) return;
    if (this.static) { if (d < 20) { const a = Math.atan2(this.pos.x - tgt.x, this.pos.z - tgt.z); this.moveTarget = new V3(this.pos.x + Math.sin(a) * 3, 0, this.pos.z + Math.cos(a) * 3); } return; }
    if (this.cover) { this.cover.occ = null; this.cover = null; }
    const t = this.type;
    if (t === 'heavy') {
      if (d > 17) { const k = Math.min(9, d - 15) / d; this.moveTarget = new V3(this.pos.x + (tgt.x - this.pos.x) * k + rand(-3, 3), 0, this.pos.z + (tgt.z - this.pos.z) * k + rand(-3, 3)); }
      else this.moveTarget = null;
    } else if (t === 'shotgun') {
      if (Math.random() < 0.25) this.flankSide *= -1;
      const ang = Math.atan2(this.pos.x - tgt.x, this.pos.z - tgt.z) + rand(0.5, 1.0) * this.flankSide, r = Math.max(5, d * 0.55);
      this.moveTarget = new V3(tgt.x + Math.sin(ang) * r, 0, tgt.z + Math.cos(ang) * r);
    } else if (t === 'rifle') {
      const c = Math.random() < 0.75 ? findCover(this, tgt) : null;
      if (c) { c.occ = this; this.cover = c; this.moveTarget = c.p.clone(); }
      else {
        const a = Math.atan2(tgt.x - this.pos.x, tgt.z - this.pos.z) + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1), r = rand(3, 7), adv = d > 35 ? rand(3, 8) : d < 12 ? -4 : 0;
        const fx = (tgt.x - this.pos.x) / (d || 1), fz = (tgt.z - this.pos.z) / (d || 1);
        this.moveTarget = new V3(this.pos.x + Math.sin(a) * r + fx * adv, 0, this.pos.z + Math.cos(a) * r + fz * adv);
      }
    } else if (t === 'sniper') {
      if (Math.random() < 0.3) { const a = rand(0, TAU); this.moveTarget = new V3(this.pos.x + Math.cos(a) * 2.5, 0, this.pos.z + Math.sin(a) * 2.5); }
    }
  }
  shooting(dt, tgt) {
    const T = this.T;
    if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) this.mag = T.mag; this.aimT = 0; this.showLaser(false); return; }
    this.fireT -= dt;
    if (!this.canSee || !player.alive || this.flinch > 0 || this.fleeT > 0) { this.aimT = Math.max(0, this.aimT - dt * 2); this.showLaser(false); return; }
    if (this.dist > T.range * 1.3) { this.showLaser(false); return; }
    if (this.aimT < T.aim) { this.aimT += dt; this.showLaser(true, tgt); return; }
    this.showLaser(true, tgt);
    if (this.fireT > 0) return;
    if (this.burstLeft <= 0) this.burstLeft = randi(T.burst[0], T.burst[1]);
    this.fireShot(tgt);
    this.burstLeft--; this.mag--;
    if (this.mag <= 0) { this.reloadT = T.reload; this.burstLeft = 0; if (!this.isBoss && Math.random() < 0.6) Voice.bark('reload', this.pos); }
    if (this.burstLeft > 0) this.fireT = 60 / T.rpm;
    else { this.fireT = rand(T.pause[0], T.pause[1]); if (T.laser) this.aimT = 0; }
  }
  showLaser(on, tgt) {
    if (!this.laser) return;
    this.laser.visible = on;
    if (!on) return;
    const m = this.parts.muzzle.getWorldPosition(_m), a = this.laser.geometry.attributes.position;
    const k = Math.min(1, this.aimT / this.T.aim);
    a.setXYZ(0, m.x, m.y, m.z); a.setXYZ(1, lerp(m.x, tgt.x, 0.995), lerp(m.y, tgt.y - 0.35 * (1 - k), 0.995), lerp(m.z, tgt.z, 0.995)); a.needsUpdate = true;
    this.laser.material.opacity = 0.25 + 0.6 * k;
  }
  fireShot(tgt) {
    const T = this.T, m = this.parts.muzzle.getWorldPosition(_m).clone();
    let p = T.acc * clamp(1.15 - this.dist / T.range * 0.8, 0.12, 1);
    if (player.sprint) p *= 0.55; if (player.crouch && !player.inVehicle) p *= 0.8; if (player.inVehicle) p *= 0.8;
    if (gameTime - this.combatStart < 1.2) p *= 0.4;
    if (Mission.easyShots) p *= 0.6;
    const pel = T.pellets || 1;
    let hitAny = false;
    for (let i = 0; i < pel; i++) {
      const hit = Math.random() < p;
      const aim = _v2.copy(tgt);
      if (hit) { aim.x += rand(-0.2, 0.2); aim.y += rand(-0.4, 0.1); aim.z += rand(-0.2, 0.2); hitAny = true; hurtPlayer(T.dmg, this.pos); }
      else { const a = rand(0, TAU), r = rand(0.7, 2.6); aim.x += Math.cos(a) * r; aim.y += rand(-0.8, 1.2); aim.z += Math.sin(a) * r; }
      const dir = _v3.copy(aim).sub(m).normalize();
      let end;
      if (!hit) {
        const h = castRay(m, dir, 300, { ignore: this, noEnemies: true, ignoreCar: this.mount, ignoreCar2: player.inVehicle });
        end = h ? h.point : m.clone().addScaledVector(dir, 300);
        if (h) FX.impact(h.point, h.type === 'terrain' ? 'terrain' : h.type === 'car' ? 'metal' : 'rock', dir);
        if (!player.inVehicle && camera.position.distanceTo(aim) < 3 && Math.random() < 0.5) AudioSys.ui('whiz');
      } else end = aim.clone();
      if (i === 0 || Math.random() < 0.3) Tracers.add(m, end, true);
    }
    this.flashT = 0.06; this.parts.flash.visible = true; this.parts.flash.material.rotation = rand(0, TAU);
    AudioSys.shot(T.snd, m);
    this.spotted = gameTime;
  }
  move(dt) {
    let speed = 0;
    if (this.moveTarget && NAV.nodes.length) {
      this.navT = (this.navT || 0) - dt;
      if (this.navT <= 0 || this.navGoal !== this.moveTarget) { this.navT = 0.7; this.navGoal = this.moveTarget; this.wp = navNext(this.pos, this.moveTarget); }
      if (this.wp && Math.hypot(this.wp.x - this.pos.x, this.wp.z - this.pos.z) < 1.2) { this.wp = null; this.navT = 0; }
    } else this.wp = null;
    if (this.moveTarget) {
      const goal = this.wp || this.moveTarget;
      const dx = goal.x - this.pos.x, dz = goal.z - this.pos.z, dist = Math.hypot(dx, dz);
      if (dist < 0.6 && !this.wp) this.moveTarget = null;
      else {
        speed = this.T.speed * (this.state === 'patrol' ? 0.42 : this.state === 'search' || this.state === 'alert' ? 0.6 : 1) * (this.flinch > 0 ? 0.3 : 1);
        const ox = this.pos.x, oz = this.pos.z; this.pos.x += dx / dist * speed * dt; this.pos.z += dz / dist * speed * dt;
        if (LV.blocked && LV.blocked(this.pos.x, this.pos.z)) { this.pos.x = ox; this.pos.z = oz; this.moveTarget = null; }
        if (this.state !== 'combat' || this.wp) this.faceYaw = Math.atan2(-dx, -dz);
      }
    }
    // separation
    for (const o of enemies) { if (o === this || !o.alive || o.mount) continue; const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d = dx * dx + dz * dz; if (d < 1 && d > 1e-4) { const k = (1 - Math.sqrt(d)) * 0.5 / Math.sqrt(d); this.pos.x += dx * k; this.pos.z += dz * k; } }
    const g = collideCircle(this.pos, 0.4, this.pos.y, this.pos.y + 1.7);
    this.pos.y = g > this.pos.y + 0.5 ? this.pos.y : g;
    if (g < this.pos.y) this.pos.y = Math.max(g, this.pos.y - 9 * dt);
    this.pos.x = clamp(this.pos.x, -WORLD, WORLD); this.pos.z = clamp(this.pos.z, -WORLD, WORLD);
    const moved = Math.hypot(this.pos.x - this.lastPos.x, this.pos.z - this.lastPos.z);
    this.moveSpeed = moved / Math.max(dt, 1e-4);
    if (this.moveTarget && moved < speed * dt * 0.25) { this.stuckT += dt; if (this.stuckT > 0.8) { this.stuckT = 0; const a = rand(0, TAU); this.moveTarget = new V3(this.pos.x + Math.cos(a) * 4, 0, this.pos.z + Math.sin(a) * 4); } }
    else this.stuckT = 0;
    this.lastPos.copy(this.pos);
    this.yaw += angDiff(this.yaw, this.faceYaw) * Math.min(1, dt * 7);
  }
  animate(dt, tgt) {
    const P = this.parts;
    this.mesh.position.copy(this.pos); this.mesh.rotation.set(0, this.yaw, 0);
    const moving = this.moveSpeed > 0.4;
    this.walkPh += dt * (moving ? this.moveSpeed * 2.4 : 0);
    const sw = moving ? Math.sin(this.walkPh) * 0.65 : 0;
    const cr = this.crouch ? 1 : 0;
    P.hips.position.y = lerp(P.hips.position.y, cr ? 0.58 : 0.95 + (moving ? Math.abs(Math.cos(this.walkPh)) * 0.04 : 0), Math.min(1, dt * 10));
    P.legs[0].rotation.x = cr ? -1.25 : sw; P.legs[1].rotation.x = cr ? -0.9 : -sw;
    P.knees[0].rotation.x = cr ? 2.0 : Math.max(0, -Math.sin(this.walkPh)) * 0.9; P.knees[1].rotation.x = cr ? 1.5 : Math.max(0, Math.sin(this.walkPh)) * 0.9;
    P.torso.rotation.x = this.flinch > 0 ? 0.25 : (cr ? -0.15 : 0);
    // aim pitch
    let pitch = 0;
    if (this.state === 'combat') { const e = this.eye(_e); pitch = Math.atan2(tgt.y - e.y, Math.hypot(tgt.x - e.x, tgt.z - e.z)); }
    else pitch = -0.35;
    P.aim.rotation.x = lerp(P.aim.rotation.x, clamp(pitch, -1, 1), Math.min(1, dt * 8));
    if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) P.flash.visible = false; }
  }
  animateDeath(dt) {
    this.deadT += dt;
    const k = Math.min(1, this.deadT / 0.6), e = k * k;
    this.mesh.rotation.set(0, this.yaw, 0);
    this.mesh.rotateX(e * 1.5 * (this.fallSide > 0 ? 1 : 0.9));
    this.mesh.rotateZ(e * 0.3 * this.fallSide);
    if (this.mount) { this.mesh.position.y = lerp(this.mesh.position.y, this.mount.pos.y + 0.8, Math.min(1, dt * 4)); }
    else this.mesh.position.y = this.pos.y - e * 0.08;
    if (this.deadT > 40) { scene.remove(this.mesh); this.gone = true; }
  }
  dispose() { this.alive = false; this.disposed = true; this.gone = true; scene.remove(this.mesh); if (this.laser) scene.remove(this.laser); }
}
function findCover(e, tgt) {
  let best = null, bs = 1e9;
  for (const cp of coverPoints) {
    if (cp.occ && cp.occ !== e && cp.occ.alive) continue;
    if (cp.col && cp.col.dead) continue;
    const d = Math.hypot(cp.p.x - e.pos.x, cp.p.z - e.pos.z); if (d > 24) continue;
    const px = tgt.x - cp.p.x, pz = tgt.z - cp.p.z, dp = Math.hypot(px, pz);
    if (dp < 8 || dp > e.T.range * 1.2) continue;
    const bx = cp.c.x - cp.p.x, bz = cp.c.z - cp.p.z, bl = Math.hypot(bx, bz) || 1;
    if ((bx * px + bz * pz) / (bl * dp) < 0.55) continue;
    const score = d + Math.abs(dp - 22) * 0.4 + Math.random() * 3;
    if (score < bs) { bs = score; best = cp; }
  }
  return best;
}
function alertEnemies(p, radius, loud) { for (const e of enemies) if (e.alive && e.pos.distanceTo(p) < radius) e.hear(p, loud); if (civilians.length) scareCivilians(p, 6); }

/* ---------------- vehicles ---------------- */
const CARSPEC = {
  pickup: { w: 2.1, l: 5.2, h: 2.2, max: 41, acc: 15, hp: 800 },
  jeep: { w: 2.1, l: 4.6, h: 1.45, max: 37, acc: 14, hp: 480 },
  armored: { w: 2.6, l: 7.6, h: 2.9, max: 28, acc: 9, hp: 99999 },
  sedan: { w: 1.9, l: 4.5, h: 1.7, max: 34, acc: 12, hp: 260 },
  suv: { w: 1.95, l: 4.8, h: 2.1, max: 42, acc: 16, hp: 1400 },
  apc: { w: 2.8, l: 7.2, h: 2.6, max: 26, acc: 11, hp: 4200 }
};
class Car {
  constructor(kind, x, z, yaw) {
    const S = CARSPEC[kind]; this.kind = kind; this.w = S.w; this.l = S.l; this.h = S.h; this.maxSpeed = S.max; this.accel = S.acc; this.hpMax = S.hp; this.hp = S.hp;
    this.pos = new V3(x, terrainH(x, z), z); this.yaw = yaw || 0; this.speed = 0; this.steer = 0; this.vy = 0; this.pitch = 0; this.roll = 0;
    const b = buildCar(kind); this.mesh = b.group; this.wheels = b.wheels; scene.add(this.mesh);
    this.col = { box: new THREE.Box3(), ref: this, car: this }; colliders.push(this.col);
    this.ai = null; this.dead = false; this.crashed = false; this.enterable = kind !== 'armored'; this.crew = [];
    this.stuck = 0; this.reverseT = 0; this.fire = null; this.smokeT = 0; this.hitCd = 0;
    this.updateBox(); this.orient(1);
  }
  get fwdX() { return -Math.sin(this.yaw); } get fwdZ() { return -Math.cos(this.yaw); }
  updateBox() {
    const c = Math.abs(Math.cos(this.yaw)), s = Math.abs(Math.sin(this.yaw));
    let w = this.w, h = this.h; if (this.crashed) { w = this.h; h = this.w + 0.3; }
    const hx = (c * w + s * this.l) / 2 * 0.9, hz = (s * w + c * this.l) / 2 * 0.9;
    this.col.box.min.set(this.pos.x - hx, this.pos.y + 0.2, this.pos.z - hz); this.col.box.max.set(this.pos.x + hx, this.pos.y + h, this.pos.z + hz);
  }
  control(dt, thr, steerIn, hand) {
    if (this.dead || this.crashed) { this.speed *= Math.exp(-2 * dt); this.steer = 0; return; }
    if (thr > 0) this.speed += (this.speed < 0 ? 32 : this.accel * (1 - Math.max(0, this.speed) / this.maxSpeed * 0.55)) * dt * thr;
    else if (thr < 0) this.speed -= (this.speed > 0.5 ? 34 : this.accel * 0.55) * dt * (-thr);
    else this.speed *= Math.exp(-0.45 * dt);
    if (hand) this.speed *= Math.exp(-1.6 * dt);
    this.steer += ((hand ? steerIn * 1.3 : steerIn) - this.steer) * (1 - Math.exp(-7 * dt));
  }
  update(dt) {
    if (this.crashed) this.updateCrash(dt);
    if (this.ai && !this.dead && !this.crashed) this.aiDrive(dt);
    else if (!this.driverIsPlayer) this.control(dt, 0, 0, true);
    this.physics(dt);
    this.hitCd = Math.max(0, this.hitCd - dt);
    // damage smoke/fire
    if (!this.dead && this.hp < this.hpMax * 0.45) { this.smokeT -= dt; if (this.smokeT <= 0) { this.smokeT = 0.08; FX.norm.emit(this.pos.x + this.fwdX * this.l * 0.35, this.pos.y + 1.5, this.pos.z + this.fwdZ * this.l * 0.35, rand(-.3, .3), 2, rand(-.3, .3), 2.5, 0.8, 3.5, COL.smoke0, COL.smoke1, 0.5, 0.6, -0.3, 1); if (this.hp < this.hpMax * 0.22) FX.fire(_v1.set(this.pos.x + this.fwdX * this.l * 0.35, this.pos.y + 1.4, this.pos.z + this.fwdZ * this.l * 0.35), 0.6); } }
  }
  physics(dt) {
    if (this.crashedStatic) { this.updateBox(); return; }
    const sf = clamp(Math.abs(this.speed) / 6, 0, 1);
    const turn = this.steer * 0.95 * sf * (1 - clamp(Math.abs(this.speed) / this.maxSpeed, 0, 1) * 0.45) * Math.sign(this.speed || 1);
    if (!this.crashed) this.yaw += turn * dt * (this.kind === 'armored' ? 0.7 : 1);
    const fx = this.fwdX, fz = this.fwdZ;
    const off = !onRoad(this.pos.x, this.pos.z);
    if (off) { this.speed *= Math.exp(-0.28 * dt); if (Math.abs(this.speed) > this.maxSpeed * 0.78) this.speed *= Math.exp(-1.5 * dt); }
    this.speed = clamp(this.speed, -12, this.maxSpeed);
    this.pos.x += fx * this.speed * dt; this.pos.z += fz * this.speed * dt;
    // collisions (two circles front/back)
    if (!this.skipCol) {
      let push = 0; const r = this.w * 0.55;
      for (const k of [0.3, -0.3]) {
        _v1.set(this.pos.x + fx * this.l * k, 0, this.pos.z + fz * this.l * k); const ox = _v1.x, oz = _v1.z;
        for (const c of colliders) {
          if (c.car === this || c.noCol) continue; const b = c.box;
          if (b.max.y < this.pos.y + 0.55 || b.min.y > this.pos.y + 1.8) continue;
          if (_v1.x + r < b.min.x || _v1.x - r > b.max.x || _v1.z + r < b.min.z || _v1.z - r > b.max.z) continue;
          const cx = clamp(_v1.x, b.min.x, b.max.x), cz = clamp(_v1.z, b.min.z, b.max.z), dx = _v1.x - cx, dz = _v1.z - cz, d = Math.hypot(dx, dz);
          if (c.prop && c.prop.kind === 'barrier' && !c.prop.dead && Math.abs(this.speed) > 11) { c.prop.destroy(); this.speed *= 0.75; FX.sparks(_v2.set(cx, this.pos.y + 0.8, cz), 20); if (this.driverIsPlayer) { AudioSys.ui('crash'); addShake(0.4); } continue; }
          if (d < r && d > 1e-4) { _v1.x = cx + dx / d * r; _v1.z = cz + dz / d * r; if (c.car && c.car.ai) c.car.bump(-dx / d, -dz / d, this.speed); }
          else if (d <= 1e-4) { _v1.x -= fx * 0.3; _v1.z -= fz * 0.3; }
        }
        const cx = _v1.x - ox, cz = _v1.z - oz;
        if (cx || cz) { this.pos.x += cx; this.pos.z += cz; const l = Math.hypot(cx, cz); push = Math.max(push, Math.abs((cx * fx + cz * fz) / l)); }
      }
      if (push > 0.3) {
        const imp = Math.abs(this.speed) * push;
        if (imp > 7 && this.hitCd <= 0) { this.hitCd = 0.5; this.damage(imp * 2.2, 'crash'); FX.sparks(_v2.set(this.pos.x + fx * this.l * 0.5, this.pos.y + 1, this.pos.z + fz * this.l * 0.5), 14); if (this.driverIsPlayer) { AudioSys.ui('crash'); addShake(clamp(imp / 40, 0.1, 0.6)); } }
        this.speed *= 1 - 0.85 * push; if (Math.abs(this.speed) < 2 && this.driverIsPlayer) this.speed = -Math.sign(this.speed) * 0.5;
      }
      // run over soldiers
      if (Math.abs(this.speed) > 6) for (const e of enemies) {
        if (!e.alive || e.mount) continue;
        const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z, lz = dx * fx + dz * fz, lx = dx * fz - dz * fx;
        if (Math.abs(lz) < this.l * 0.55 && Math.abs(lx) < this.w * 0.6 && Math.abs(e.pos.y - this.pos.y) < 2) { e.damage(999, _v2.set(fx, 0, fz), false, this.driverIsPlayer ? 'vehicle' : 'crash'); FX.impact(_v3.copy(e.pos).setY(e.pos.y + 1), 'blood', _v2); this.speed *= 0.9; }
      }
      // hit the player on foot
      if (!player.inVehicle && player.alive && Math.abs(this.speed) > 5 && !this.driverIsPlayer) {
        const dx = player.pos.x - this.pos.x, dz = player.pos.z - this.pos.z, lz = dx * fx + dz * fz, lx = dx * fz - dz * fx;
        if (Math.abs(lz) < this.l * 0.55 && Math.abs(lx) < this.w * 0.6 + 0.3 && this.hitCd <= 0) { this.hitCd = 1; hurtPlayer(Math.abs(this.speed) * 2.2, this.pos); player.vel.x += fx * this.speed * 0.6 + (lx > 0 ? -fz : fz) * 6; player.vel.z += fz * this.speed * 0.6; player.vel.y = 5; }
      }
    }
    this.pos.x = clamp(this.pos.x, -WORLD, WORLD); this.pos.z = clamp(this.pos.z, -WORLD, WORLD);
    const g = terrainH(this.pos.x, this.pos.z);
    this.vy -= 24 * dt; this.pos.y += this.vy * dt;
    if (this.pos.y <= g) { if (this.vy < -9 && this.driverIsPlayer) { addShake(0.25); AudioSys.ui('land'); } this.pos.y = g; this.vy = Math.max(0, this.vy); }
    if (this.pos.y > g + 0.05 && this.vy === 0) this.pos.y = g;
    // follow slopes: launch off crests
    const ahead = terrainH(this.pos.x + fx * 2, this.pos.z + fz * 2);
    if (this.pos.y <= g + 0.02 && Math.abs(this.speed) > 20 && ahead < g - 0.6) this.vy = Math.min(8, (g - ahead) * Math.abs(this.speed) * 0.12);
    this.orient(dt);
    this.updateBox();
    // wheels
    for (const w of this.wheels) { w.wm.rotation.x -= this.speed * dt / 0.46; if (w.steer) w.sg.rotation.y = this.steer * 0.45; }
    // dust
    if (Math.abs(this.speed) > 5) { const a = clamp(Math.abs(this.speed) / 25, 0, 1) * (off ? 1 : 0.35); FX.vehicleDust(_v1.set(this.pos.x - fx * this.l * 0.45, this.pos.y, this.pos.z - fz * this.l * 0.45), a); }
  }
  orient(dt) {
    if (this.crashed) { this.mesh.position.copy(this.pos); this.mesh.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ'); return; }
    const fx = this.fwdX, fz = this.fwdZ, rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw), hl = this.l * 0.4, hw = this.w * 0.45;
    const hf = terrainH(this.pos.x + fx * hl, this.pos.z + fz * hl), hb = terrainH(this.pos.x - fx * hl, this.pos.z - fz * hl);
    const hr = terrainH(this.pos.x + rx * hw, this.pos.z + rz * hw), hL = terrainH(this.pos.x - rx * hw, this.pos.z - rz * hw);
    const tp = Math.atan2(hf - hb, hl * 2), tr = Math.atan2(hr - hL, hw * 2);
    const k = Math.min(1, dt * 10); this.pitch += (tp - this.pitch) * k; this.roll += (tr - this.roll) * k;
    this.mesh.position.copy(this.pos); this.mesh.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
  }
  bump(dx, dz, sp) { this.speed *= 0.85; this.yaw += (Math.random() - 0.5) * 0.1; }
  aiDrive(dt) {
    const ai = this.ai;
    if (ai.fn) { ai.fn(this, dt); return; }
    if (ai.type === 'road') {
      const tz = this.pos.z - 26, tx = roadX(tz);
      const st = clamp(angDiff(this.yaw, yawTo(this.pos.x, this.pos.z, tx, tz)) * 2.4, -1, 1);
      const sp = ai.speedFn ? ai.speedFn(this) : ai.speed;
      this.control(dt, this.speed < sp ? 1 : (this.speed > sp + 2 ? -0.5 : 0), st, false);
    } else if (ai.type === 'chase') {
      if (!ai.driver || !ai.driver.alive) { this.ai = null; return; }
      const pc = player.inVehicle, tgt = pc ? pc.pos : player.pos;
      const tvx = pc ? pc.fwdX * pc.speed : player.vel.x, tvz = pc ? pc.fwdZ * pc.speed : player.vel.z;
      const d = Math.hypot(tgt.x - this.pos.x, tgt.z - this.pos.z);
      const px = pc ? -pc.fwdZ : 1, pz = pc ? pc.fwdX : 0;
      const lx = tgt.x + tvx * 0.7 + px * ai.side * 7, lz = tgt.z + tvz * 0.7 + pz * ai.side * 7;
      const st = clamp(angDiff(this.yaw, yawTo(this.pos.x, this.pos.z, lx, lz)) * 2.2, -1, 1);
      const ps = pc ? Math.abs(pc.speed) : 0;
      let want = d > 45 ? this.maxSpeed : d > 18 ? Math.min(this.maxSpeed, ps + 7) : Math.max(0, ps - 1);
      if (this.reverseT > 0) { this.reverseT -= dt; this.control(dt, -1, -st, false); return; }
      if (Math.abs(this.speed) < 1.5 && want > 5) { this.stuck += dt; if (this.stuck > 1.3) { this.stuck = 0; this.reverseT = 1.1; } } else this.stuck = 0;
      this.control(dt, this.speed < want ? 1 : (this.speed > want + 3 ? -0.6 : 0), st, false);
    }
  }
  damage(d, src) {
    if (this.dead || this.kind === 'armored') return;
    this.hp -= d;
    if (this.driverIsPlayer) HUD.vehicleHit();
    if (this.hp <= 0) this.destroy();
  }
  destroy() {
    if (this.dead) return; this.dead = true; this.hp = 0;
    detonate(_v1.set(this.pos.x, this.pos.y + 1, this.pos.z), 8, 90, { src: 'car' });
    this.mesh.traverse(o => { if (o.isMesh && o.material !== M.glass) o.material = M.burnt; });
    this.vy = 6; this.fire = addFire(this.pos.clone().setY(this.pos.y + 1.2), 1.1, 60);
    Debris.burst(this.pos, 8, 1.2);
    if (this.driverIsPlayer) { exitVehicle(true); hurtPlayer(35, this.pos); }
    for (const c of this.crew) if (c.alive) c.die(null, false, 'vehicle');
  }
  crash() {
    if (this.crashed) return;
    this.crashed = true; this.ai = null; this.crashT = 0; this.skipCol = true;
    this.vy = 9; this.spinDir = Math.random() < 0.5 ? -1 : 1;
  }
  updateCrash(dt) {
    if (!this.crashed || this.crashedStatic) return;
    this.crashT += dt;
    const k = Math.min(1, this.crashT / 1.4);
    this.roll = lerp(0, 1.45 * this.spinDir, 1 - Math.pow(1 - k, 3)); this.pitch = 0.12 * k;
    this.yaw += dt * 0.8 * (1 - k) * this.spinDir;
    if (k >= 1 && this.pos.y <= terrainH(this.pos.x, this.pos.z) + 0.05) { this.crashedStatic = true; this.speed = 0; this.pos.y = terrainH(this.pos.x, this.pos.z) + 0.2; this.skipCol = false; this.orient(0); this.updateBox(); }
  }
  setCrashed(x, z, yaw, dir) {
    this.pos.set(x, terrainH(x, z) + 0.2, z); this.yaw = yaw; this.crashed = true; this.crashedStatic = true; this.ai = null;
    this.roll = 1.45 * (dir || 1); this.pitch = 0.12; this.orient(0); this.updateBox();
  }
  dispose() { scene.remove(this.mesh); const i = colliders.indexOf(this.col); if (i >= 0) colliders.splice(i, 1); if (this.fire) this.fire.t = 0; }
}

/* ---------------- fires ---------------- */
function addFire(p, size, dur) { const f = { p: p.clone(), size, t: dur, acc: 0 }; fires.push(f); return f; }
function updateFires(dt) {
  for (let i = fires.length - 1; i >= 0; i--) {
    const f = fires[i]; f.t -= dt; if (f.t <= 0) { fires.splice(i, 1); continue; }
    if (f.p.distanceToSquared(camera.position) > 250 * 250) continue;
    f.acc += dt * 26 * FX.q; while (f.acc > 1) { f.acc--; FX.fire(f.p, f.size); }
  }
}

/* ---------------- props (static destructibles) ---------------- */
class Prop {
  constructor(kind, mesh, o) {
    o = o || {}; this.kind = kind; this.mesh = mesh; scene.add(mesh); this.hp = o.hp || 200; this.dead = false; this.explosive = !!o.explosive;
    this.col = colliderFromObject(mesh, o.shrink || 0, { ref: this, cover: o.cover !== false, metal: !!o.metal }); this.col.prop = this;
    this.pos = new V3(); this.col.box.getCenter(this.pos); const s = new V3(); this.col.box.getSize(s); this.radius = Math.max(s.x, s.z) / 2;
    this.onDestroy = o.onDestroy || null; this.removeOnDestroy = !!o.remove;
  }
  damage(d) { if (this.dead) return; this.hp -= d; if (this.hp <= 0) this.destroy(); }
  destroy() {
    if (this.dead) return; this.dead = true; this.col.dead = true;
    if (this.explosive) { after(0.12, () => detonate(this.pos, 6.5, 130, { src: 'barrel' })); }
    if (this.removeOnDestroy) { scene.remove(this.mesh); const i = colliders.indexOf(this.col); if (i >= 0) colliders.splice(i, 1); Debris.burst(this.pos, 6, 0.8); FX.dust(this.pos, 12, true); }
    else { this.mesh.traverse(o => { if (o.isMesh && o.material !== M.glass) o.material = M.burnt; }); addFire(this.pos.clone().setY(this.col.box.max.y - 0.5), 1.4, 90); Debris.burst(this.pos, 10, 1.3); }
    if (this.onDestroy) this.onDestroy(this);
  }
  dispose() { scene.remove(this.mesh); const i = colliders.indexOf(this.col); if (i >= 0) colliders.splice(i, 1); }
}
function spawnBarrel(x, z, y) {
  const g = new THREE.Group(); part(g, new THREE.CylinderGeometry(0.34, 0.34, 0.95, 14), M.barrel, 0, 0.475, 0); part(g, new THREE.CylinderGeometry(0.345, 0.345, 0.12, 14), M.barrelStripe, 0, 0.6, 0);
  g.position.set(x, y !== undefined ? y : terrainH(x, z), z); g.rotation.y = rand(0, 6);
  props.push(new Prop('barrel', g, { hp: 25, explosive: true, remove: true, cover: false, metal: true }));
}

/* ---------------- pickups ---------------- */
class Pickup {
  constructor(kind, pos, opt) {
    this.kind = kind; this.opt = opt || {}; this.pos = pos.clone(); this.mesh = buildPickupMesh(kind, this.opt); this.mesh.position.copy(pos); scene.add(this.mesh);
    this.t = rand(0, 6); this.needsE = kind === 'weapon' || kind === 'jack' || kind === 'briefcase' || kind === 'keycard'; this.taken = false;
    if (kind === 'weapon' && this.opt.table) this.mesh.children[0].rotation.set(0, Math.PI / 2, Math.PI / 2 * 0);
  }
  label() {
    if (this.kind === 'weapon') return (inv[this.opt.weapon] ? 'Take ammo: ' : 'Pick up ') + WDEF[this.opt.weapon].name;
    if (this.kind === 'jack') return 'Take the BOTTLE OF JACK';
    if (this.kind === 'briefcase') return this.opt.label || 'Recover the briefcase';
    if (this.kind === 'keycard') return 'Take the ' + this.opt.key.toUpperCase() + ' keycard';
    return '';
  }
  update(dt) {
    this.t += dt;
    if (this.kind !== 'briefcase') { this.mesh.rotation.y += dt * 0.9; if (this.kind !== 'weapon' || !this.opt.table) this.mesh.position.y = this.pos.y + 0.12 + Math.sin(this.t * 2.2) * 0.05; }
    if (this.mesh.userData.ring) this.mesh.userData.ring.material.opacity = 0.3 + 0.25 * Math.sin(this.t * 4);
    if (!this.needsE && player.alive && !player.inVehicle && this.pos.distanceTo(player.pos) < 1.6) this.take();
  }
  take() {
    if (this.taken) return;
    const k = this.kind;
    if (k === 'ammo') { let any = false; for (const w in inv) { const d = WDEF[w]; if (inv[w].res < d.maxRes) { inv[w].res = Math.min(d.maxRes, inv[w].res + Math.ceil(d.mag * (w === 'rocket' ? 2 : 1.5))); any = true; } } if (!any) return; HUD.feed('+ AMMO'); }
    else if (k === 'health') { if (player.hp >= 100) return; player.hp = Math.min(100, player.hp + 50); HUD.feed('+ HEALTH'); }
    else if (k === 'armor') { if (player.armor >= 100) return; player.armor = Math.min(100, player.armor + 50); HUD.feed('+ ARMOR'); }
    else if (k === 'grenades') { if (player.nades >= 5) return; player.nades = Math.min(5, player.nades + 2); HUD.feed('+ GRENADES'); }
    else if (k === 'weapon') { giveWeapon(this.opt.weapon); if (this.opt.weapon === 'golden') { Store.set('golden', true); achieve('lit', 'IT\'S LIT.', 'The fish knew. Golden P9 unlocked in every chapter (key 7)'); } }
    else if (k === 'jack') { startJack(); }
    else if (k === 'briefcase') { Mission.onBriefcase && Mission.onBriefcase(this); }
    else if (k === 'keycard') { player.keys.add(this.opt.key); HUD.feed('+ ' + this.opt.key.toUpperCase() + ' KEYCARD', 'gold'); if (LV.onKey) LV.onKey(this.opt.key); }
    this.taken = true; scene.remove(this.mesh); AudioSys.ui('pickup');
  }
  dispose() { scene.remove(this.mesh); }
}

/* ---------------- aircraft ---------------- */
class Aircraft {
  constructor(kind, from, to, speed, opt) {
    this.kind = kind; this.opt = opt || {}; this.mesh = kind === 'bomber' ? buildBomber() : buildJet(); scene.add(this.mesh);
    this.from = from.clone(); this.to = to.clone(); this.dir = to.clone().sub(from); this.len = this.dir.length(); this.dir.normalize();
    this.speed = speed; this.d = 0; this.pos = from.clone(); this.dead = false; this.fired = new Set(); this.dropT = 0;
    this.mesh.position.copy(from); this.mesh.lookAt(to);
    this.bank = this.opt.bank || rand(-0.25, 0.25); this.mesh.rotateZ(this.bank);
    this.snd = AudioSys.loop(kind === 'bomber' ? 'bomber' : 'jet', this.pos);
  }
  update(dt) {
    this.d += this.speed * dt; this.pos.copy(this.from).addScaledVector(this.dir, this.d); this.mesh.position.copy(this.pos);
    for (const s of this.mesh.userData.glow || []) { const k = 0.85 + Math.random() * 0.3; s.scale.set(3.3 * k, 3.3 * k, 1); }
    if (this.snd) this.snd.setPos(this.pos);
    const T = this.opt.targets;
    if (T) T.forEach((t, i) => {
      if (this.fired.has(i)) return;
      const p = t.pos || t, ahead = _v1.copy(p).sub(this.pos).dot(this.dir);
      if (ahead < (this.opt.fireDist || 430) && ahead > 60) {
        this.fired.add(i);
        for (let k = 0; k < (t.count || 2); k++) after(k * 0.18, () => {
          if (this.dead) return;
          const tp = (t.pos || t).clone(); tp.x += rand(-2, 2) * (k ? 1 : 0.3); tp.z += rand(-2, 2) * (k ? 1 : 0.3);
          const o = this.pos.clone().addScaledVector(this.dir, 4); o.y -= 1.5;
          const v = tp.sub(o).normalize().multiplyScalar(150);
          projectiles.push(new Projectile('rocket', o, v, { owner: 'air', max: 190, targetRef: k === 0 ? t.ref : null, r: 8, dmg: 150 }));
        });
      }
    });
    if (this.opt.bomb) this.opt.bomb(this, dt);
    if (this.d > this.len) this.dispose();
  }
  dispose() { if (this.dead) return; this.dead = true; scene.remove(this.mesh); if (this.snd) this.snd.stop(); }
}

/* ---------------- projectiles ---------------- */
class Projectile {
  constructor(kind, pos, vel, o) {
    this.kind = kind; this.pos = pos.clone(); this.vel = vel.clone(); this.o = o || {}; this.age = 0; this.dead = false;
    this.mesh = buildProjMesh(kind); this.mesh.position.copy(pos); scene.add(this.mesh);
    if (kind === 'bomb') { this.start = pos.clone(); this.target = this.o.target.clone(); this.dur = this.o.dur || 2.2; }
    if (kind === 'rocket') { this.mesh.lookAt(_v1.copy(pos).add(vel)); this.mesh.rotateY(Math.PI); }
    this.trailT = 0;
  }
  update(dt) {
    this.age += dt; const k = this.kind;
    if (k === 'bomb') {
      const t = Math.min(1, this.age / this.dur), prev = this.pos.clone();
      this.pos.lerpVectors(this.start, this.target, t); this.pos.y = lerp(this.start.y, this.target.y, t * t);
      this.mesh.position.copy(this.pos); this.mesh.lookAt(_v1.copy(this.pos).multiplyScalar(2).sub(prev)); this.mesh.rotateY(Math.PI);
      if (t >= 1) this.explode();
      return;
    }
    if (k === 'rocket') {
      const sp = this.vel.length(); if (sp < (this.o.max || 120)) this.vel.multiplyScalar(1 + dt * 2.2); this.vel.y -= 1.2 * dt;
      const step = this.vel.length() * dt; _v1.copy(this.vel).normalize();
      const hit = castRay(this.pos, _v1, step + 0.4, { ignoreCar: this.o.ignoreCar });
      if (hit) { this.pos.copy(hit.point); this.hit = hit; this.explode(); return; }
      this.pos.addScaledVector(this.vel, dt); this.mesh.position.copy(this.pos);
      this.trailT -= dt; if (this.trailT <= 0) { this.trailT = 0.016; FX.trail(this.pos); }
      if (this.age > 7) this.explode();
      return;
    }
    if (k === 'grenade') {
      this.vel.y -= 20 * dt;
      const nx = this.pos.x + this.vel.x * dt, ny = this.pos.y + this.vel.y * dt, nz = this.pos.z + this.vel.z * dt;
      let bounced = false;
      for (const c of colliders) {
        const b = c.box; if (nx < b.min.x - 0.07 || nx > b.max.x + 0.07 || ny < b.min.y - 0.07 || ny > b.max.y + 0.07 || nz < b.min.z - 0.07 || nz > b.max.z + 0.07) continue;
        const inX = this.pos.x >= b.min.x - 0.07 && this.pos.x <= b.max.x + 0.07, inY = this.pos.y >= b.min.y - 0.07 && this.pos.y <= b.max.y + 0.07;
        if (!inY) this.vel.y *= -0.35; else if (!inX) this.vel.x *= -0.4; else this.vel.z *= -0.4;
        this.vel.multiplyScalar(0.7); bounced = true; break;
      }
      if (!bounced) this.pos.set(nx, ny, nz);
      const h = terrainH(this.pos.x, this.pos.z) + 0.07;
      if (this.pos.y < h) { this.pos.y = h; if (this.vel.y < -1.5) AudioSys.ui('empty'); this.vel.y = -this.vel.y * 0.3; this.vel.x *= 0.6; this.vel.z *= 0.6; }
      this.mesh.position.copy(this.pos); this.mesh.rotation.x += dt * 8;
      if (Math.floor(this.age * 3) !== Math.floor((this.age - dt) * 3)) for (const e of enemies) if (e.alive && !e.mount && e.pos.distanceTo(this.pos) < 7.5) { const a = Math.atan2(e.pos.x - this.pos.x, e.pos.z - this.pos.z); e.moveTarget = new V3(e.pos.x + Math.sin(a) * 8, 0, e.pos.z + Math.cos(a) * 8); e.fleeT = 1.6; Voice.bark('grenade', e.pos); if (e.state !== 'combat') { e.lastKnown.copy(player.pos); e.enterCombat(); } }
      if (this.age > 2.4) this.explode();
    }
  }
  explode() {
    if (this.dead) return; this.dead = true; scene.remove(this.mesh);
    const k = this.kind, r = k === 'bomb' ? 12 : (this.o.r || (k === 'rocket' ? 6.5 : 7.5)), dmg = k === 'bomb' ? 280 : (this.o.dmg || (k === 'rocket' ? 170 : 160));
    detonate(this.pos, r, dmg, { src: this.o.owner === 'player' ? 'player' : this.o.owner, big: k === 'bomb' || !!this.o.oneShot, oneShot: !!this.o.oneShot });
    const tr = this.o.targetRef; if (tr && !tr.dead && tr.pos && tr.pos.distanceTo(this.pos) < 30) tr.destroy();
    if (k === 'bomb' && Mission.onBomb) Mission.onBomb(this.pos);
  }
  dispose() { this.dead = true; scene.remove(this.mesh); }
}

/* ---------------- explosions ---------------- */
function detonate(p, r, dmg, o) {
  o = o || {}; p = p.clone();
  FX.explosion(p, r); Lights.flash(p, r * 1.8, 0.5, r * 7); AudioSys.boom(p, !!o.big);
  const dc = camera.position.distanceTo(p); addShake(clamp(1.25 - dc / (r * 8), 0, 1) * (o.big ? 1.2 : 0.9));
  const th = terrainH(p.x, p.z); if (p.y - th < 3) Decals.scorch(p.x, p.z, r * 0.5);
  Debris.burst(p, o.big ? 8 : 5, o.big ? 1.3 : 0.8);
  if (player.alive && !player.inVehicle) {
    const d = _v1.set(player.pos.x, player.pos.y + 1, player.pos.z).distanceTo(p);
    if (d < r) { let dm = dmg * Math.pow(1 - d / r, 1.15); if (o.src === 'player') dm *= o.oneShot ? 0.4 : 0.55; hurtPlayer(dm, p); }
  }
  for (const e of enemies) {
    if (!e.alive) continue; const d = _v1.set(e.pos.x, e.pos.y + 1, e.pos.z).distanceTo(p);
    if (d < r * 1.1) { _v2.copy(e.pos).sub(p).normalize(); e.damage(o.oneShot && !e.isBoss ? e.hp + 100 : dmg * Math.pow(1 - d / (r * 1.1), 1.05), _v2, false, o.src === 'player' ? 'player' : 'explosion'); }
    else if (d < r * 2.5 && e.alive) { e.flinch = 0.5; if (!e.mount && !e.static) { const a = Math.atan2(e.pos.x - p.x, e.pos.z - p.z); e.moveTarget = new V3(e.pos.x + Math.sin(a) * 5, 0, e.pos.z + Math.cos(a) * 5); e.fleeT = 1; } }
  }
  for (const c of cars) { if (c.dead) continue; const d = _v1.set(c.pos.x, c.pos.y + 1, c.pos.z).distanceTo(p); if (d < r * 1.4) { c.damage(dmg * 2.2 * (1 - d / (r * 1.4)), 'explosion'); if (c.driverIsPlayer) hurtPlayer(dmg * 0.18 * (1 - d / (r * 1.4)), p); } }
  for (const pr of props) { if (pr.dead) continue; const d = pr.pos.distanceTo(p) - pr.radius; if (d < r) pr.damage(dmg * 2.2 * (1 - Math.max(0, d) / r)); }
  for (const t of targets) { if (t.dead || !t.pos) continue; const d = t.pos.distanceTo(p) - (t.radius || 1); if (d < r) hitTarget(t, dmg * (t.explMul || 1.4) * (1 - Math.max(0, d) / r), 'explosion'); }
  for (const c of civilians) { if (c.alive && c.pos.distanceTo(p) < r) c.kill(_v2.copy(c.pos).sub(p)); }
  scareCivilians(p, 10);
  if (Flight.jet && !Flight.jet.dead && Flight.jet.pos.distanceTo(p) < r * 1.5 && o.src !== 'jet') Flight.jet.hurt(dmg * 0.2, p);
  alertEnemies(p, 160, true);
}
