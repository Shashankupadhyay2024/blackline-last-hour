/* ============================================================
   STORY SYSTEMS: Maya as an AI ally (flashbacks), the Silas Kade
   boss, story choices, friendly helicopters, persistent story
   state (who you spared, how the last mission starts).
   ============================================================ */
const Story = {
  get(k, d) { const s = Store.get('story', {}); return k in s ? s[k] : d; },
  set(k, v) { const s = Store.get('story', {}); s[k] = v; Store.set('story', s); }
};

/* floating name tag (seen through walls so you never lose her) */
function nameTag(text, color) {
  const t = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.font = 'bold 34px Arial'; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,0.75)'; c.strokeText(text, w / 2, 44); c.fillStyle = color || '#8fd0ff'; c.fillText(text, w / 2, 44); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, opacity: 0.85 }));
  s.scale.set(1.3, 0.33, 1); s.renderOrder = 5; return s;
}

/* ---------- AI teammate: follows you, holds positions, shoots ---------- */
const _ae = new V3(), _at = new V3();
class Ally extends Enemy {
  constructor(x, z, o) {
    o = o || {};
    const T = Object.assign({}, ETYPES.rifle, { hp: 1e9, speed: 5.6, color: o.color || 0x3c4634, gear: o.gear || 0x262b20, snd: 'ar' });
    super('rifle', x, z, Object.assign({ T, hair: new THREE.MeshStandardMaterial({ color: o.hairCol || 0x1a0e08 }), balaclava: false, color: T.color, gear: T.gear, group: 'ally' }, o));
    if (this.parts.head.children[1] && !o.helmet) this.parts.head.children[1].visible = false;
    this.isAlly = true; this.state = 'combat'; this.hold = null; this.aimTgt = null; this.scanT = 0; this.shotT = 1; this.burstN = 0; this.goalT = 0;
    this.side = o.side || 1; this.name = o.name || 'MAYA'; this.hitP = o.hitP || 0.4; this.dmgPer = o.dmg || 18;
    this.tag = nameTag(this.name); scene.add(this.tag);
    actors.push(this);
  }
  damage() { }
  die() { }
  followPoint(v) {
    const y = player.yaw, fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y);
    return v.set(player.pos.x + rx * 2.6 * this.side - fx * 2.2, 0, player.pos.z + rz * 2.6 * this.side - fz * 2.2);
  }
  update(dt) {
    if (this.disposed) return;
    if (!this.alive) { this.animateDeath(dt); this.tag.visible = false; return; }
    // pick the closest enemy she can actually see
    this.scanT -= dt;
    if (this.scanT <= 0) {
      this.scanT = 0.35; let best = null, bd = 60; const e = this.eye(_ae).clone();
      for (const en of enemies) {
        if (!en.alive) continue; const d = en.pos.distanceTo(this.pos); if (d >= bd) continue;
        const tp = en.eye(_at), dir = tp.clone().sub(e), L = dir.length(); dir.divideScalar(L);
        if (!castRay(e, dir, L - 0.6, { ignore: this, noEnemies: true })) { bd = d; best = en; }
      }
      this.aimTgt = best;
    }
    if (this.aimTgt && !this.aimTgt.alive) this.aimTgt = null;
    // where to stand
    const goal = this.hold ? this.hold : this.followPoint(_at);
    const dp = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
    if (!this.hold && dp > 34 && !player.inVehicle) { const f = this.followPoint(new V3()); this.pos.set(f.x, groundAt(f.x, f.z, player.pos.y + 2), f.z); this.moveTarget = null; }
    this.goalT -= dt;
    if (this.goalT <= 0) {
      this.goalT = 0.45; const dg = Math.hypot(goal.x - this.pos.x, goal.z - this.pos.z);
      this.moveTarget = dg > (this.hold ? 0.8 : 2.4) ? new V3(goal.x, 0, goal.z) : null;
    }
    this.T.speed = dp > 12 && !this.hold ? 8 : 5.6;
    this.state = 'combat';
    if (this.aimTgt) this.faceYaw = yawTo(this.pos.x, this.pos.z, this.aimTgt.pos.x, this.aimTgt.pos.z);
    else if (this.moveTarget) this.faceYaw = Math.atan2(-(this.moveTarget.x - this.pos.x), -(this.moveTarget.z - this.pos.z));
    else this.faceYaw = player.yaw;
    this.crouch = !!(this.hold && this.aimTgt && this.shotT > 0.5);
    this.move(dt);
    // shoot
    this.shotT -= dt;
    if (this.aimTgt && this.shotT <= 0 && player.alive) {
      if (this.burstN <= 0) this.burstN = randi(3, 5);
      this.fireAt(this.aimTgt); this.burstN--;
      this.shotT = this.burstN > 0 ? 0.12 : rand(0.55, 1.1);
    }
    const aimP = this.aimTgt ? this.aimTgt.eye(_at) : _at.set(this.pos.x - Math.sin(this.yaw) * 10, this.pos.y + 1.4, this.pos.z - Math.cos(this.yaw) * 10);
    this.animate(dt, aimP);
    this.tag.position.set(this.pos.x, this.pos.y + 2.25, this.pos.z);
    this.tag.visible = !Cine.active || !!this.tagInCine;
  }
  fireAt(t) {
    const m = this.parts.muzzle.getWorldPosition(new V3()), tp = t.eye(new V3()); tp.y -= 0.25;
    const hit = Math.random() < this.hitP;
    const end = hit ? tp : tp.clone().add(new V3(rand(-1.5, 1.5), rand(-0.8, 1), rand(-1.5, 1.5)));
    Tracers.add(m, end, false); AudioSys.shot('ar', m);
    this.flashT = 0.06; this.parts.flash.visible = true;
    if (hit) { t.damage(this.dmgPer, end.clone().sub(m).normalize(), Math.random() < 0.12, 'ally'); FX.impact(end, 'blood'); }
  }
  dispose() { super.dispose(); scene.remove(this.tag); }
}

/* ---------- Silas Kade: a fast, mean duelist (no shield) ---------- */
class Duelist extends Enemy {
  constructor(x, z, o) {
    o = o || {};
    const T = { hp: o.hp || 1800, speed: 6, range: 75, acc: 0.3, dmg: 6, rpm: 600, burst: [4, 8], pause: [0.5, 1.0], mag: 30, reload: 1.6, aim: 0.35, sight: 170, color: 0x2c2e33, gear: 0x111214, snd: 'ar', drop: 'ar', scale: 1.04 };
    super('rifle', x, z, { T, hair: new THREE.MeshStandardMaterial({ color: 0x8a8884 }), balaclava: false, color: T.color, gear: T.gear, group: 'boss', combat: true, y: o.y });
    if (this.parts.head.children[1]) this.parts.head.children[1].visible = false;
    this.isBoss = true; this.hpMax = this.hp; this.defeated = false; this.dashT = 3; this.nadeT = 7; this.wave = 0; this.bossName = o.name || 'SILAS KADE';
    this.arena = o.arena || null; this.onDefeat = o.onDefeat; this.taunts = o.taunts || [];
    HUD.bossRef = this;
  }
  damage(d, dir, head, src) {
    if (this.defeated) return;
    d = Math.min(d, cur === 'golden' ? 450 : 180);
    if (this.hp - d <= this.hpMax * 0.05) { this.hp = this.hpMax * 0.05; this.defeat(); return; }
    super.damage(d, dir, head, src);
    const f = this.hp / this.hpMax;
    if (this.wave === 0 && f < 0.66 || this.wave === 1 && f < 0.33) {
      this.wave++; if (this.taunts[this.wave - 1]) HUD.say(this.taunts[this.wave - 1]);
      const o = { group: 'boss', combat: true, color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true };
      for (let i = 0; i < 3; i++) { const a = rand(0, TAU); addEnemy(pick(['rifle', 'shotgun', 'rifle']), this.pos.x + Math.cos(a) * 18, this.pos.z + Math.sin(a) * 18, o); }
      HUD.feed('⚠ KADE CALLED IN HIS GUARD', 'red');
    }
  }
  defeat() {
    this.defeated = true; this.moveTarget = null; this.noShoot = true; this.showLaser(false);
    for (const e of enemies) if (e !== this && e.alive) e.die(null, false, 'player');
    Mission.flags.bossDown = gameTime; if (this.onDefeat) this.onDefeat(this);
  }
  update(dt) {
    if (this.defeated) {
      this.parts.hips.position.y = lerp(this.parts.hips.position.y, 0.45, dt * 3); this.parts.legs.forEach(l => l.rotation.x = -1.4); this.parts.knees.forEach(k => k.rotation.x = 1.9); this.parts.aim.rotation.x = -1.1;
      this.mesh.position.copy(this.pos); this.faceYaw = yawTo(this.pos.x, this.pos.z, player.pos.x, player.pos.z); this.yaw += angDiff(this.yaw, this.faceYaw) * dt * 3; this.mesh.rotation.set(0, this.yaw, 0); return;
    }
    super.update(dt);
    if (!this.alive) return;
    this.dashT -= dt; this.nadeT -= dt;
    if (this.dashT <= 0 && this.state === 'combat') {
      this.dashT = rand(2.2, 3.6);
      const a = Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z) + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2, r = rand(6, 10);
      const to = new V3(this.pos.x + Math.sin(a) * r, 0, this.pos.z + Math.cos(a) * r);
      if (this.arena) { to.x = clamp(to.x, this.arena.x - this.arena.r, this.arena.x + this.arena.r); to.z = clamp(to.z, this.arena.z - this.arena.r, this.arena.z + this.arena.r); }
      if (!LV.blocked || !LV.blocked(to.x, to.z)) {
        for (let i = 0; i < 8; i++) FX.add.emit(lerp(this.pos.x, to.x, i / 8), this.pos.y + 1.2, lerp(this.pos.z, to.z, i / 8), 0, 0.5, 0, 0.4, 0.8, 0.1, COL.fire1, COL.fireD, 0.8, 0, 0);
        this.pos.x = to.x; this.pos.z = to.z; this.pos.y = terrainH(to.x, to.z); AudioSys.ui('whiz');
      }
    }
    if (this.nadeT <= 0 && this.canSee) {
      this.nadeT = rand(7, 10);
      const o = this.pos.clone().setY(this.pos.y + 1.6), dv = player.pos.clone().sub(o), flat = Math.hypot(dv.x, dv.z) || 1;
      projectiles.push(new Projectile('grenade', o, new V3(dv.x / flat * Math.min(18, flat * 0.9), 5, dv.z / flat * Math.min(18, flat * 0.9)), { owner: 'boss' }));
      HUD.hint('GRENADE!', 1.2);
    }
  }
  dispose() { super.dispose(); if (HUD.bossRef === this) HUD.bossRef = null; }
}

/* ---------- a person standing in a scene (cutscenes) ---------- */
function standIn(x, z, o) {
  o = o || {};
  const m = buildSoldier('rifle', Object.assign({ balaclava: false, hair: new THREE.MeshStandardMaterial({ color: o.hairCol || 0x1a0e08 }) }, o));
  if (m.head.children[1] && !o.helmet) m.head.children[1].visible = false;
  m.root.position.set(x, o.y !== undefined ? o.y : terrainH(x, z), z); m.root.rotation.y = o.yaw || 0; scene.add(m.root);
  m.hips.position.y = 0.95; m.aim.rotation.x = o.aim !== undefined ? o.aim : -0.35;
  const a = { m, update() { }, dispose() { scene.remove(m.root); } }; actors.push(a); return a;
}

/* ---------- friendly / scripted helicopter ---------- */
function scriptedHeli(from, to, o) {
  o = o || {};
  const mesh = buildHeli(o.kind || 'dropship'); scene.add(mesh); const U = mesh.userData;
  const h = { pos: from.clone(), to: to.clone(), yaw: 0, arrived: false, snd: AudioSys.loop('heli', from),
    update(dt) {
      U.rotor.rotation.y += dt * 28; if (U.tr) U.tr.rotation.x += dt * 40; if (U.lamp) U.lamp.visible = Math.sin(gameTime * 6) > 0;
      const d = this.to.clone().sub(this.pos), L = d.length();
      if (L > 0.3) { const sp = Math.min(L * 0.6, o.speed || 26); this.pos.addScaledVector(d.normalize(), sp * dt); this.yaw += angDiff(this.yaw, Math.atan2(d.x, d.z)) * Math.min(1, dt * 1.5); }
      else this.arrived = true;
      mesh.position.copy(this.pos); mesh.rotation.set(0, this.yaw, 0); if (this.snd) this.snd.setPos(this.pos);
      if (this.arrived && Math.random() < dt * 8) FX.dust(_v1.set(this.pos.x + rand(-6, 6), terrainH(this.pos.x, this.pos.z), this.pos.z + rand(-6, 6)), 2, true);
    },
    dispose() { scene.remove(mesh); if (this.snd) this.snd.stop(); } };
  actors.push(h); return h;
}

/* ---------- story choice screen ---------- */
function storyChoice(o, cb) {
  state = 'choice'; if (document.pointerLockElement) document.exitPointerLock();
  $('hud').classList.add('hidden'); AudioSys.combatTarget = 0;
  $('choice').querySelector('h2').textContent = o.title; $('choice').querySelector('p').innerHTML = o.text;
  $('ch-a').innerHTML = `<b>${o.a[0]}</b><span>${o.a[1]}</span>`; $('ch-b').innerHTML = `<b>${o.b[0]}</b><span>${o.b[1]}</span>`;
  showScreen('choice');
  const go = k => { AudioSys.ui('click'); $('ch-a').onclick = $('ch-b').onclick = null; cb(k); };
  $('ch-a').onclick = () => go('a'); $('ch-b').onclick = () => go('b');
}
function resumePlay() { state = 'play'; showScreen(null); $('hud').classList.remove('hidden'); if (!locked && !Pad.active) requestLock(); }

/* ---------- a short scripted camera beat with lines ---------- */
function storyBeat(keysC, lines, done) {
  if (lines) HUD.say(lines);
  Cine.skippable = false; Cine.play(keysC, () => { if (done) done(); });
}
