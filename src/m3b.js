/* ============================================================
   CHAPTER 4 — THE BETRAYAL  (the sky over San Marcos)
   Fly on Silas Kade's wing through his beacons, splash the
   interceptors, stop the bombers over the hospital district —
   then find out whose side everyone is on.
   ============================================================ */
const B6 = { rings: [], wing: null };

/* Silas's fighter: flies off your right wing, helps a little, then doesn't */
function makeWingman(j) {
  const g = new THREE.Group(), jm = buildJet(); jm.rotation.y = Math.PI; g.add(jm); scene.add(g);
  const w = { mesh: g, pos: j.pos.clone().add(new V3(40, 5, 40)), q: j.q.clone(), mode: 'form', gunT: 2, snd: AudioSys.loop('jet', j.pos),
    update(dt) {
      const pj = Flight.jet; if (!pj) return;
      const off = this.mode === 'form' ? new V3(30, 3, 24) : this.mode === 'six' ? new V3(0, 6, 240) : new V3(-120, 40, -300);
      const want = pj.pos.clone().add(off.applyQuaternion(pj.q));
      this.pos.lerp(want, 1 - Math.exp(-dt * (this.mode === 'six' ? 0.7 : 1.6))); this.q.slerp(pj.q, 1 - Math.exp(-dt * 2));
      g.position.copy(this.pos); g.quaternion.copy(this.q); if (this.snd) this.snd.setPos(this.pos);
      for (const s of jm.userData.glow || []) s.scale.set(4, 4, 1);
      // he does shoot at the bandits (he needs you alive... for now)
      this.gunT -= dt;
      if (this.mode === 'form' && this.gunT <= 0) {
        this.gunT = rand(1.6, 3); const f = fighters.find(f => !f.dead && f.pos.distanceTo(this.pos) < 900 && !(f instanceof Bomber));
        if (f) { for (let i = 0; i < 5; i++) Tracers.add(this.pos.clone(), f.pos.clone().add(new V3(rand(-8, 8), rand(-5, 5), rand(-8, 8))), true); if (Math.random() < 0.35) f.damage(30); }
      }
    },
    dispose() { scene.remove(g); if (this.snd) this.snd.stop(); } };
  actors.push(w); return w;
}

/* heavy bombers circling the city — tail gunners shoot back */
class Bomber {
  constructor(a, o) {
    o = o || {}; this.a = a; this.r = o.r || 650; this.alt = o.alt || 200; this.speed = o.speed || 75; this.hp = o.hp || 320; this.radius = 18; this.dead = false;
    this.mesh = buildBomber(); this.mesh.scale.setScalar(0.85); scene.add(this.mesh);
    this.pos = new V3(Math.cos(a) * this.r, this.alt, Math.sin(a) * this.r); this.dir = new V3(-Math.sin(a), 0, Math.cos(a));
    this.snd = AudioSys.loop('jet', this.pos); this.gunT = rand(1, 3); this.bombT = rand(2, 5); this.fallT = 0;
    fighters.push(this); actors.push(this);
  }
  damage(d) {
    if (this.dead) return; this.hp -= d; HUD.hit(false, this.hp <= 0);
    if (this.hp <= 0) { this.dead = true; this.falling = true; stats.kills++; HUD.feed('✕ BOMBER DOWN', 'gold'); AudioSys.boom(this.pos, true); FX.explosion(this.pos, 14); Lights.flash(this.pos, 16, 0.6, 160); }
  }
  update(dt) {
    if (this.snd) this.snd.setPos(this.pos);
    if (this.falling) { this.fallT += dt; this.dir.y -= dt * 0.35; this.dir.normalize(); this.pos.addScaledVector(this.dir, this.speed * dt); this.mesh.position.copy(this.pos); this.mesh.rotateZ(dt * 1.5); FX.fire(this.pos, 2); if (this.pos.y < 2 || this.fallT > 12) { FX.explosion(this.pos, 16); this.dispose(); } return; }
    this.a += dt * this.speed / this.r;
    const p = new V3(Math.cos(this.a) * this.r, this.alt + Math.sin(this.a * 3) * 8, Math.sin(this.a) * this.r);
    this.dir.copy(p).sub(this.pos).normalize(); this.pos.copy(p);
    this.mesh.position.copy(p); this.mesh.lookAt(p.clone().add(this.dir)); this.mesh.rotateZ(-0.22);
    for (const s of this.mesh.userData.glow || []) s.scale.set(4, 4, 1);
    const pj = Flight.jet; if (!pj) return;
    this.gunT -= dt;
    const d = pj.pos.distanceTo(this.pos);
    if (this.gunT <= 0 && d < 600) {
      this.gunT = 0.14; if (Math.random() < 0.08) this.gunT = rand(1, 2);
      const hit = Math.random() < 0.12, end = pj.pos.clone().add(hit ? new V3() : new V3(rand(-14, 14), rand(-8, 8), rand(-14, 14)));
      Tracers.add(this.pos.clone().addScaledVector(this.dir, -14), end, true); if (hit) pj.hurt(1.6, this.pos);
    }
    this.bombT -= dt;
    if (this.bombT <= 0) { this.bombT = rand(3, 6); const tx = this.pos.x * 0.3, tz = this.pos.z * 0.3; projectiles.push(new Projectile('bomb', this.pos.clone().setY(this.pos.y - 3), new V3(), { owner: 'air', target: new V3(tx, 0, tz), dur: 3.4 })); }
  }
  dispose() { this.dead = true; this.gone = true; scene.remove(this.mesh); if (this.snd) this.snd.stop(); }
}

function makeRings(j) {
  for (const r of B6.rings) scene.remove(r.mesh);
  B6.rings = [];
  const f = new V3(-Math.sin(j.yaw0), 0, -Math.cos(j.yaw0)), rt = new V3(f.z * -1, 0, f.x);
  for (let i = 0; i < 6; i++) {
    const p = j.pos.clone().addScaledVector(f, 520 * (i + 1)).addScaledVector(rt, Math.sin(i * 1.3) * 160); p.y = 200 + Math.sin(i * 2.1) * 50;
    const m = new THREE.Mesh(new THREE.TorusGeometry(20, 1.1, 8, 40), new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.85 }));
    m.position.copy(p); m.lookAt(p.clone().add(f)); scene.add(m);
    const halo = spriteGlow(TEX.glowOrange, 12); halo.position.copy(p); halo.material.opacity = 0.3; scene.add(halo);
    B6.rings.push({ pos: p, mesh: m, halo, done: false });
  }
  actors.push({ update() { }, dispose() { for (const r of B6.rings) { scene.remove(r.mesh); scene.remove(r.halo); } B6.rings = []; } });
}

const LINES6 = {
  intro: [['SILAS', 'Overwatch on your wing, Mister Cross. Just like old times.', 3.4], ['EVAN', 'You keep saying that.', 1.8], ['SILAS', 'Fly through my beacons. Stay tight. I\'d hate to lose you twice.', 3.8], ['MAYA', '(quietly) Whatever he says, Evan, don\'t let him get behind you.', 3.6]],
  ring: [['SILAS', 'Still got the hands. They never take the hands.', 2.8]],
  fighters: [['SILAS', 'Bandits — six, unmarked. Same as Nevada.', 2.8], ['EVAN', 'Yours, Kade?', 1.4], ['SILAS', 'Everybody\'s, eventually. Hold your nose on one until it locks, then right click.', 4.2]],
  bombers: [['MAYA', 'Evan — three heavy bombers turning onto the hospital district!', 3.4], ['SILAS', 'Leave them. They\'re in the prediction.', 2.6], ['EVAN', 'Then the prediction\'s wrong.', 2.2]],
  bombersDone: [['SILAS', 'Every cycle you do this. Every cycle you save the wrong people.', 3.8]],
  betray: [['MAYA', 'Evan... I\'m sorry.', 2.6], ['EVAN', 'Maya? Why is there a gun on the back of my seat?', 3.2], ['MAYA', 'I recruited you. Seventeen years ago.', 3.2], ['MAYA', 'I\'m the one who erased you. Every single time.', 3.4], ['EVAN', 'Why?', 1.4],
    ['SILAS', 'Because I asked her to. Tell him the rest, Reyes.', 3.2], ['MAYA', 'Because the Blackline needs a pilot. And I need it open.', 3.6], ['SILAS', 'Good. Now step out of the aircraft.', 2.6], ['MAYA', '(quietly) Find the island. Don\'t trust the sky.', 3], ['SILAS', 'Nothing personal, Mister Cross. Seventh time I\'ve done this.', 3.6]]
};

LEVELS[6] = {
  id: 6, name: 'MISSION 4 — THE BETRAYAL', chapter: 'CHAPTER 4', title: 'THE BETRAYAL', sub: 'ABOVE SAN MARCOS · 21:06 · 3,000 FEET',
  env: Object.assign({}, LEVELS[5].env, { fog: [0x2c2226, 220, 1600] }),
  h: cityH, onRoad: cityOnRoad, waterLevel: 0, bounds: 2800,
  build() { buildCity(); },
  menuFocus: new V3(0, 0, 0),
  menuCam(t) { return { pos: new V3(Math.cos(t * 1.5) * 420, 260, Math.sin(t * 1.5) * 420), look: new V3(0, 60, -40) }; },
  radar: LEVELS[5].radar,
  tick(dt, menu) {
    if (C3.roofFires) { for (const f of C3.roofFires) if (Math.random() < dt * 10) FX.fire(f, 2.2); }
    if (menu) return;
    if (player.inJet && Flight.jet) player.pos.copy(Flight.jet.pos);
    if (Math.random() < dt * 0.9 && Flight.jet) { const p = Flight.jet.pos.clone().add(new V3(rand(-500, 500), rand(-120, 120), rand(-500, 500))); if (p.y > 60) { FX.explosion(p, 4); Lights.flash(p, 4, 0.2, 200); } }
  },
  tips: ['Hold your nose on a target until the box turns red, then right click for a missile.', 'Bombers are slow but tough — two missiles, or one missile and a long burst of cannon.', 'Keep your speed up and your altitude above 60 m.'],
  cpStep: [0, 2, 3],
  reset(cp) {
    C3.collapsible.forEach(b => { if (b.done) { b.mesh.position.y = b.y0; b.mesh.rotation.set(0, 0, 0); b.col.box.max.y = b.maxY; if (b.roof) scene.add(b.roof); b.done = false; } });
    const start = [new V3(-1300, 220, 500), new V3(-200, 240, -300), new V3(-900, 230, 0)][cp] || new V3(-1300, 220, 500), yaw = cp === 0 ? -1.1 : -Math.PI / 2;
    const jet = new PlayerJet(start, yaw, { rearSeat: true, holdIntro: true, onCrash: (j) => onJetCrash6(j) });
    jet.onGround = false; jet.airT = 5; jet.speed = 150; jet.throttle = 0.6; jet.yaw0 = yaw;
    player.inJet = true; player.pos.copy(start);
    B6.wing = makeWingman(jet);
    if (cp === 0) makeRings(jet);
    return { spawn: [start.x, start.z, 0], y: start.y, loadout: ['pistol', 'ar'], cur: 'ar', armor: 50, nades: 3 };
  },
  steps: [
    { id: 'formup', cp: 0, text: 'Form up on Silas — fly through the beacons', marker: () => { const r = B6.rings.find(r => !r.done); return r ? r.pos : null; },
      enter() { after(2, () => HUD.say(LINES6.intro)); after(3, () => HUD.hint('W throttle · mouse pitch/roll · A/D yaw · SHIFT boost', 7)); },
      update() {
        const j = Flight.jet; if (!j) return false;
        const r = B6.rings.find(r => !r.done);
        if (r && j.pos.distanceTo(r.pos) < 30) { r.done = true; r.mesh.material.color.set(0x57ff8a); r.mesh.material.opacity = 0.3; AudioSys.ui('head'); HUD.feed('✓ BEACON', 'gold'); if (B6.rings.filter(q => q.done).length === 3) HUD.say(LINES6.ring); }
        // missed one by a lot? skip it so nobody gets stuck circling
        if (r && !r.done) { const to = r.pos.clone().sub(j.pos); if (to.dot(j.fwd) < -400) { r.done = true; r.mesh.visible = false; } }
        $('obj-sub').textContent = `${B6.rings.filter(q => q.done).length} / ${B6.rings.length} beacons`;
        return B6.rings.length && B6.rings.every(q => q.done);
      } },
    { id: 'dogfight', text: 'Splash the interceptors', marker: null,
      enter() { HUD.say(LINES6.fighters); Mission.flags.kills0 = stats.kills; spawnFighters(3, 1800); Mission.flags.fw = 1; },
      update() {
        const k = stats.kills - Mission.flags.kills0; $('obj-sub').textContent = `${Math.min(k, 6)} / 6 splashed · missiles ${Flight.jet ? Flight.jet.missiles : 0}`;
        if (k >= 2 && Mission.flags.fw === 1) { Mission.flags.fw = 2; spawnFighters(3, 1700); }
        if (k >= 8) achieve('ace', 'Ace', 'Eight interceptors down');
        if (fighters.filter(f => !f.dead).length === 0 && k < 6) spawnFighters(2, 1500);
        return k >= 6;
      } },
    { id: 'bombers', cp: 1, text: 'Stop the bombers before they level the hospital district', marker: () => { const b = fighters.find(f => f instanceof Bomber && !f.dead); return b ? b.pos : null; },
      enter() {
        for (const f of fighters) if (!(f instanceof Bomber) && !f.dead) f.dispose();
        HUD.say(LINES6.bombers); if (Flight.jet) Flight.jet.missiles = Math.max(Flight.jet.missiles, 10);
        for (let i = 0; i < 3; i++) new Bomber(i * TAU / 3, { r: 600 + i * 40, alt: 190 + i * 25 });
        after(6, () => spawnFighters(2, 1600));
      },
      update() {
        const left = fighters.filter(f => f instanceof Bomber && !f.dead).length; $('obj-sub').textContent = `${3 - left} / 3 bombers down`;
        if (left === 0 && !Mission.flags.bDone) { Mission.flags.bDone = gameTime; HUD.say(LINES6.bombersDone); }
        return Mission.flags.bDone && gameTime - Mission.flags.bDone > 5;
      } },
    { id: 'betrayal', cp: 2, text: '...', marker: null, silent: true,
      enter() {
        const j = Flight.jet; if (!j) return; j.o.invuln = true; for (const f of fighters) f.dispose();
        B6.wing && (B6.wing.mode = 'six');
        HUD.say(LINES6.betray);
        after(26, () => { const jj = Flight.jet; if (!jj) return; if (jj.rear) jj.rear.visible = false; AudioSys.shot('pistol', null); Debris.burst(jj.pos.clone().add(new V3(0, 3, 0)), 4, 1); addShake(0.4); HUD.notify('REAR SEAT EJECTED', 'She\'s gone.', 'red'); });
        after(31, () => {
          const jj = Flight.jet, w = B6.wing; if (!jj || !w) return;
          HUD.notify('MISSILE LOCK', 'Kade is on your six', 'red'); AudioSys.ui('head');
          const proxy = { get pos() { return Flight.jet ? Flight.jet.pos : new V3(); }, dead: false, damage() { betrayalHit(); } };
          new Missile(w.pos.clone(), w.q ? new V3(0, 0, -1).applyQuaternion(w.q) : jj.fwd.clone(), proxy, 'silas');
          after(6, () => betrayalHit());
        });
      },
      update() { const j = Flight.jet; if (j && !j.control) { j.hp = Math.max(1, j.hp - 0.05); if (Math.random() < 0.3) FX.fire(j.pos, 1.2); } return false; } }
  ],
  intro: {
    lines: [[0, 'SAN MARCOS IS BURNING.', ''], [3000, 'ABOVE THE SMOKE, A MAN EVAN DOES NOT REMEMBER<br>FLIES ON HIS WING AS IF HE ALWAYS HAS.', ''], [7600, 'HE HAS.', 'big']],
    dur: 10500,
    fly(eye, look) { const j = Flight.jet; const p = j ? j.pos.clone() : eye; return [{ t: 0, pos: p.clone().add(new V3(-60, 20, 80)), look: p.clone() }, { t: 4, pos: p.clone().add(new V3(20, 8, 40)), look: p.clone() }, { t: 6, pos: p.clone().add(new V3(0, 3.6, 17)), look: p.clone().add(new V3(0, 2, -40)) }]; }
  },
  complete() {
    achieve('betray', 'Nothing Personal', 'Chapter 4 complete');
    showEnding({
      lines: [[400, 'The fighter hits the Pacific at four hundred knots.'], [3200, 'A parachute drifts east. A second jet circles once, then turns for home.'], [6600, '<span class="ev">EVAN</span> <i>(underwater, in the dark)</i> She recruited me. She erased me.'], [10000, '<span class="my">MAYA</span> <i>[static]</i> ...the island, Evan. Find the island.'], [13200, 'Everything goes black.']],
      cardAt: 15500, chapter: 'END OF CHAPTER 4', title: 'THE BETRAYAL', next: 7, tease: 'NEXT — CHAPTER 5: THE ISLAND'
    });
  }
};
function betrayalHit() {
  if (Mission.flags.hit) return; Mission.flags.hit = true;
  const jj = Flight.jet; if (!jj) return;
  FX.explosion(jj.pos, 10); AudioSys.boom(jj.pos, true); addShake(1); jj.control = false; jj.spin = 2.2; jj.throttle = 0.4; jj.o.invuln = false;
  if (B6.wing) B6.wing.mode = 'leave';
  HUD.say([['EVAN', 'Mayday, mayday — going down —', 2]]);
  after(7, () => { if (!Mission.ended) onJetCrash6(Flight.jet); });
}
function onJetCrash6(j) {
  if (Mission.cur().id === 'betrayal') { if (Mission.ended) return; FX.explosion(j ? j.pos : player.pos, 12); addShake(1); Mission.ended = true; if (Flight.jet) Flight.jet.dead = true; missionComplete(); return; }
  player.inJet = false; showDeath.msg = 'Your jet went down. Keep your speed up and watch your altitude.'; killPlayer();
}
