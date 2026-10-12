/* ============================================================
   FLASHBACK II — THE SAFEHOUSE  (San Marcos, seven years ago)
   Kade sends Evan and Maya to bring back Dr. Lena Voss, who ran
   from the program with a drive. She tells them what the
   Blackline really needs: a pilot on the switch. Then Kade's
   cleaners arrive for everyone. The night ends with the first
   time Maya takes Evan's memory: to keep him alive.
   ============================================================ */
const F2S = { gate: new V3(-11, 0, 45), car: new V3(-128, 0, 94.5) };
const CLEAN_O = { color: 0x16181b, gear: 0x0b0c0d, visor: true, balaclava: true };
const GUARD_O = { color: 0x6a5a40, gear: 0x3a3020, balaclava: false };
const LF2 = {
  intro: [['SILAS', '(radio) Overwatch to Cinder team. Doctor Voss walked out of my program with a drive in her pocket.', 4.6], ['SILAS', '(radio) Bring back the drive. The doctor is... optional.', 3.2],
    ['MAYA', '(quietly) There\'s that word again.', 2.2], ['EVAN', 'Ten years and he still hasn\'t learned a new one.', 2.8]],
  walk: [['MAYA', 'Do you ever think about Glass Harbor?', 2.4], ['EVAN', 'Every time I close my eyes.', 2], ['MAYA', 'We put her in that program, Evan. Us.', 2.8], ['EVAN', 'Then tonight we ask her why she ran.', 2.6]],
  guards: [['MAYA', 'Contractors on the gate. She hired protection.', 2.8], ['EVAN', 'From who?', 1.2], ['MAYA', 'From us, apparently.', 1.8]],
  clear: [['MAYA', 'Yard\'s clear. She\'s inside. Let me do the talking. She always liked me better.', 3.8]],
  voss: [['VOSS', 'Sergeant Reyes. Lieutenant Cross. Kade sent his favourites.', 3.4], ['EVAN', 'Doctor. Give us the drive and nobody else gets hurt.', 3],
    ['VOSS', 'Do you know what is on it? Your names. Both of them. Under "reset operator".', 4.2],
    ['VOSS', 'The Blackline can roll the world back. But it needs a hand on the switch. A pilot\'s brain. Yours, Evan.', 5.2],
    ['VOSS', 'Every time it resets, Kade wipes the operator so he never asks why. And tonight he starts with you.', 5],
    ['MAYA', '...Evan. Kade\'s channel just went dark.', 2.6], ['VOSS', 'Of course it did. He did not send you to collect me. He sent you to die with me.', 4.2]],
  cleaners: [['SILAS', '(radio) Nothing personal, kids. Loose ends.', 2.8], ['EVAN', 'Kade sent a cleaner team after his own people.', 2.8], ['VOSS', 'You were never his people. You are his equipment.', 3],
    ['MAYA', 'I\'ve got a car two streets over. Two minutes. Hold this house.', 3.4]],
  mid: [['MAYA', 'Evan! If we get out of this...', 2.2], ['EVAN', 'When.', 1], ['MAYA', 'When we get out of this, we disappear. Both of us. Somewhere without a sky.', 4]],
  heli: [['EVAN', 'Dropship! North side!', 1.8]],
  escape: [['MAYA', 'Car\'s on the next street west. Out the back, Doctor. Stay behind me.', 3.4], ['VOSS', 'Ten years I have been running from that man.', 2.8], ['EVAN', 'Then let\'s make it eleven.', 2]],
  trap: [['SILAS', '(PA) Evening, Reyes. Cross. Doctor.', 2.6], ['SILAS', '(PA) You are out of street. Here is the deal, Sergeant, and it is the only one you get.', 4.4],
    ['SILAS', '(PA) He goes in the chair tonight and wakes up loyal. Or he goes in the ground. Your choice.', 4.8],
    ['VOSS', 'Don\'t you dare give him to that man!', 2.2], ['SILAS', '(PA) Optional, Doctor.', 1.8], ['EVAN', 'VOSS!', 1.2],
    ['MAYA', '(quietly) Evan. Look at me.', 2.2], ['MAYA', '(quietly) I\'m going to take everything from you. And I\'m going to give it back. I promise.', 4.6],
    ['EVAN', 'Maya... what is that? Maya, don\'t...', 2.4], ['MAYA', '(quietly) Remind me, you said. Whatever it takes. Now I remind you.', 4]]
};
function f2Wave(n, near) {
  const pts = [[4, 30], [4, 62], [-30, 4], [-62, 4], [-30, 86], [-62, 86], [-94, 30], [-94, 62]];
  for (let i = 0; i < n; i++) { const [x, z] = near ? pick(pts.filter(p => p[1] > 80 || p[0] > 0)) : pick(pts); addEnemy(pick(['rifle', 'rifle', 'shotgun', 'rifle']), x + rand(-4, 4), z + rand(-4, 4), Object.assign({ group: 'clean', combat: true }, CLEAN_O)); }
  HUD.feed('⚠ CLEANER TEAM INBOUND', 'red');
}
function buildSafehouse() {
  const Y = 0.18;
  // compound wall around the block, gates east (street) and north (back alley)
  const W = { h: 2.7, mat: M.concrete || M.wall, t: 0.5, y0: Y, dw: 6, dh: 9 };
  wall(-79, 11, -11, 11, W); wall(-79, 79, -11, 79, Object.assign({}, W, { doors: [-45] }));
  wall(-79, 11, -79, 79, W); wall(-11, 11, -11, 79, Object.assign({}, W, { doors: [45] }));
  // the house: front room (east) + back room (west)
  const H = { h: 3.4, mat: M.wall, t: 0.35, y0: Y, dw: 2.2, dh: 2.5 };
  wall(-56, 34, -34, 34, H); wall(-56, 54, -34, 54, Object.assign({}, H, { doors: [-50] }));
  wall(-56, 34, -56, 54, H); wall(-34, 34, -34, 54, Object.assign({}, H, { doors: [44] }));
  wall(-45, 34, -45, 54, Object.assign({}, H, { doors: [48], dw: 1.8 }));
  floorPlane(-56, 34, -34, 54, Y + 0.03, M.floor, 3);
  solid(22.6, 0.35, 20.6, M.concrete || M.wall, -45, Y + 3.4, 44, { shadow: true, noGround: true });
  for (const [x, z] of [[-39.5, 40], [-39.5, 49], [-50.5, 39], [-50.5, 49]]) lightPanel(x, Y + 3.35, z, { i: 1.3, dist: 12, color: 0xffd8a8 });
  // furniture / cover
  solid(2.6, 0.9, 1.1, M.wood, -52.5, Y, 44, { cover: true }); solid(1.2, 0.8, 1.2, M.wood, -40, Y, 38, { cover: true }); solid(3, 0.9, 0.9, M.wood, -38, Y, 51.5, { cover: true });
  sign('LENA VOSS — DO NOT DISTURB', -55.7, Y + 2.2, 44, Math.PI / 2, { w: 2.6, fg: '#ffcf9a', bg: '#2a2018' });
  // yard
  const rnd = mulberry(77);
  for (const [x, z] of [[-24, 30], [-26, 58], [-18, 45], [-30, 20], [-64, 26], [-66, 64], [-48, 66], [-36, 70], [-62, 46]]) crate(x, Y, z, 1.2 + rnd() * 0.3, rnd() * 3);
  Fixtures.add(new V3(-14, 3.2, 45), 0xffc27a, 1.6, 20, 0); Fixtures.add(new V3(-45, 3.2, 76), 0xffc27a, 1.4, 18, 0.2); Fixtures.add(new V3(-28, 3.2, 44), 0xffd8a8, 1, 16, 0);
  // Maya's car, one street west
  const car = buildCar('suv').group; car.position.set(F2S.car.x, 0, F2S.car.z); car.rotation.y = Math.PI / 2; scene.add(car); colliderFromObject(car, 0.1, { cover: true, metal: true });
  buildNav([[6, 45], [-5, 45], [-14, 45], [-24, 45], [-30, 44], [-38, 44], [-42, 48], [-48, 48], [-52, 44], [-52, 40], [-40, 40], [-30, 30], [-30, 60], [-20, 25], [-20, 65], [-60, 25], [-60, 65], [-70, 45], [-45, 72], [-45, 86], [-50, 58], [-50, 52], [-65, 58], [-65, 30], [-20, 86], [-70, 86], [-100, 94]]);
}
LEVELS[4] = {
  id: 4, flashback: 'SEVEN YEARS AGO', silasHere: false, name: 'FLASHBACK II — THE SAFEHOUSE', chapter: 'FLASHBACK II', title: 'THE SAFEHOUSE', sub: 'SAN MARCOS · 22:15 · SEVEN YEARS AGO',
  env: { grade: { lift: [0.04, 0.024, 0.0], gain: [1.12, 1.0, 0.84], sat: 0.62, contrast: 1.08, vig: 0.6, bloom: 0.95, threshold: 1.5 }, clouds: 0.5, cloudCol: 0x5a5060, sky: [0x0a0c1a, 0x3a3048, 0x2a2430], fog: [0x262028, 100, 800], sunDir: new V3(-0.4, 0.35, 0.5), sunCol: 0xa8b4d8, sunI: 0.6, sunGlow: 0x8090c0, hemi: [0x6a6a90, 0x201a18, 0.45], amb: [0x404060, 0.32], exposure: 1.35, fixtures: 10, shadowSize: 70, groundCol: 0x2a2a2c },
  h: cityH, onRoad: cityOnRoad, waterLevel: 0, bounds: 2800,
  build() { C3.skip = (cx, cz) => Math.abs(cx + 45) < 5 && Math.abs(cz - 45) < 5; buildCity(); buildSafehouse(); },
  menuFocus: new V3(-45, 0, 45),
  menuCam(t) { const a = t * 1.4; return { pos: new V3(-45 + Math.cos(a) * 70, 34, 45 + Math.sin(a) * 70), look: new V3(-45, 2, 45) }; },
  radar(c, tr) { c.strokeStyle = 'rgba(200,190,170,0.28)'; c.lineWidth = 5; for (const r of C3.roads) { let a = tr(r, -414), b = tr(r, 414); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); a = tr(-414, r); b = tr(414, r); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); } c.strokeStyle = 'rgba(255,207,154,0.5)'; c.lineWidth = 1.5; const p = [tr(-79, 11), tr(-11, 11), tr(-11, 79), tr(-79, 79)]; c.beginPath(); c.moveTo(...p[0]); for (const q of p.slice(1)) c.lineTo(...q); c.closePath(); c.stroke(); },
  civTarget,
  tick(dt, menu) { if (menu) return; for (const c of civilians) if (c.pos.distanceTo(player.pos) > 150 || !c.alive && c.deadT > 8) placeCiv(c); },
  tips: ['Maya follows you and shoots whatever she can see. Let her draw fire.', 'Inside the house, the doorways are the choke points.', 'Grenades clear a doorway in one throw.'],
  cpStep: [0, 3, 4],
  reset(cp) {
    const Y = 0.18;
    F2S.voss = null; F2S.vossStand = null; F2S.heli = null;
    pickups.push(new Pickup('ammo', new V3(-40, Y, 52))); pickups.push(new Pickup('health', new V3(-52, Y, 37))); pickups.push(new Pickup('armor', new V3(-38, Y, 36.5)));
    pickups.push(new Pickup('grenades', new V3(-24, Y, 33))); pickups.push(new Pickup('jack', new V3(-62, Y, 70))); pickups.push(new Pickup('jack', new V3(-70, Y, 20)));
    pickups.push(new Pickup('weapon', new V3(-52.5, Y + 1.2, 44), { weapon: 'sniper', table: true })); pickups.push(new Pickup('weapon', new V3(-20, Y + 0.3, 70), { weapon: 'shotgun' }));
    for (const [x, z] of [[-20, 36], [-70, 54]]) spawnBarrel(x, z, Y);
    if (cp === 0) {
      spawnCivilians(14);
      for (const [x, z, t] of [[-16, 40, 'rifle'], [-16, 50, 'rifle'], [-26, 30, 'shotgun'], [-28, 62, 'rifle'], [-60, 22, 'rifle'], [-66, 60, 'shotgun'], [-36, 44, 'rifle']])
        addEnemy(t, x, z, Object.assign({ group: 'guard', y: Y, yaw: rand(0, TAU), patrol: [[x, z], [x + rand(-5, 5), z + rand(-5, 5)]] }, GUARD_O));
    }
    const sp = [[4.5, -30, Math.PI], [-38, 44, -Math.PI / 2], [-50, 57, Math.PI]][cp] || [4.5, -30, Math.PI];
    F2S.maya = new Ally(sp[0] + 2.5, sp[1] - 2, { color: 0x34343c, gear: 0x1c1c22, side: 1, y: cp ? Y : 0 });
    const vp = new V3(-53.5, Y, 46.5);
    if (cp < 1) F2S.vossStand = standIn(vp.x, vp.z, { color: 0xd8d8d0, gear: 0xa8a8a0, noGun: true, hairCol: 0x8a8a84, y: Y, yaw: yawTo(vp.x, vp.z, -40, 44) });
    else { F2S.voss = new Ally(cp === 1 ? -52 : -48, cp === 1 ? 47 : 58, { name: 'DR. VOSS', noGun: true, color: 0xd8d8d0, gear: 0xa8a8a0, hairCol: 0x8a8a84, side: -1, hitP: 0, y: Y }); F2S.voss.shotT = 1e9; }
    new Interact(vp.clone().setY(Y + 1.3), 'Talk to Doctor Voss', () => { Mission.flags.voss = gameTime; }, { range: 4.2, enabled: () => Mission.cur().id === 'voss' && !Mission.flags.voss });
    return { spawn: sp, loadout: ['pistol', 'smg', 'ar'], cur: 'ar', armor: 50, nades: 3 };
  },
  steps: [
    { id: 'street', cp: 0, text: 'Move up to Doctor Voss\'s safehouse with Maya', marker: () => F2S.gate.clone().setY(2.5),
      enter() { after(1.5, () => HUD.say(LF2.intro)); after(16, () => HUD.say(LF2.walk)); after(4, () => HUD.hint('Maya fights beside you. She follows you and shoots whatever she can see.', 6)); },
      update() { return Math.hypot(player.pos.x - F2S.gate.x, player.pos.z - F2S.gate.z) < 16 || enemies.some(e => e.alive && e.group === 'guard' && e.state === 'combat'); } },
    { id: 'yard', text: 'Deal with Voss\'s hired guards', marker: () => F2S.gate.clone().setY(2.5),
      enter() { HUD.say(LF2.guards); },
      update() { const left = enemies.filter(e => e.alive && e.group === 'guard').length; $('obj-sub').textContent = left ? left + ' guards remaining' : ''; if (!left && !Mission.flags.clr) { Mission.flags.clr = gameTime; HUD.say(LF2.clear); } return Mission.flags.clr && gameTime - Mission.flags.clr > 2; } },
    { id: 'voss', text: 'Find Doctor Voss inside the house', marker: () => new V3(-53.5, 2.6, 46.5),
      enter() { if (F2S.maya) F2S.maya.hold = new V3(-41, 0, 44); },
      update() {
        if (Mission.flags.voss && !Mission.flags.vossSaid) {
          Mission.flags.vossSaid = true; HUD.say(LF2.voss);
          showLore('VOSS — DRIVE INDEX', 'BLACKLINE / OPERATOR PROTOCOL\n\nA reset needs a human hand on the switch:\nhigh-G pilot, trained reflexes, stable under stress.\nOperator: <b>CROSS, EVAN</b>  ·  Handler: <b>REYES, MAYA</b>\n\nAfter each reset the operator\'s episodic memory is <b>revised</b>.\nDirector (S.K.): <i>If the handler objects, revise the handler.</i>', 18);
        }
        return Mission.flags.voss && gameTime - Mission.flags.voss > 31;
      } },
    { id: 'defend', cp: 1, text: 'Kade\'s cleaners are here. Hold the safehouse', marker: () => null,
      enter() {
        hideLore();
        if (F2S.vossStand) { F2S.vossStand.dispose(); F2S.vossStand = null; }
        if (!F2S.voss) { F2S.voss = new Ally(-53.5, 46.5, { name: 'DR. VOSS', noGun: true, color: 0xd8d8d0, gear: 0xa8a8a0, hairCol: 0x8a8a84, side: -1, hitP: 0, y: 0.18 }); F2S.voss.shotT = 1e9; }
        F2S.voss.hold = new V3(-52, 0, 49); if (F2S.maya) F2S.maya.hold = new V3(-37, 0, 46);
        HUD.say(LF2.cleaners); Countdown.start(85, 'MAYA\'S CAR', () => { Mission.flags.held = true; });
        f2Wave(4); after(14, () => f2Wave(5)); after(24, () => HUD.say(LF2.mid)); after(32, () => { HUD.say(LF2.heli); new Heli(-45, 80, 400, { drop: true, troops: 5, landAt: new V3(-45, 0, 95), group: 'clean', enemyOpt: CLEAN_O }); });
        after(48, () => f2Wave(5)); after(64, () => f2Wave(4));
      },
      update() { return !!Mission.flags.held; } },
    { id: 'escort', cp: 2, text: 'Get Doctor Voss to Maya\'s car on the next street west', marker: () => F2S.car.clone().setY(3),
      enter() {
        Countdown.stop(); if (F2S.maya) F2S.maya.hold = null;
        if (!F2S.voss) { F2S.voss = new Ally(player.pos.x - 2, player.pos.z, { name: 'DR. VOSS', noGun: true, color: 0xd8d8d0, gear: 0xa8a8a0, hairCol: 0x8a8a84, side: -1, hitP: 0, y: 0.18 }); F2S.voss.shotT = 1e9; }
        F2S.voss.hold = null;
        for (const e of enemies) if (e.alive && e.pos.distanceTo(player.pos) > 45) e.dispose();
        for (const [x, z, t] of [[-100, 97, 'rifle'], [-112, 85, 'rifle'], [-142, 92, 'shotgun'], [-150, 98, 'heavy'], [-95, 120, 'rifle']]) addEnemy(t, x, z, Object.assign({ group: 'clean', combat: true }, CLEAN_O));
        HUD.say(LF2.escape);
      },
      update() {
        const d = Math.hypot(player.pos.x - F2S.car.x, player.pos.z - F2S.car.z);
        if (d < 15 && !Mission.flags.trap) { Mission.flags.trap = gameTime; f2Trap(); }
        return Mission.flags.trap && gameTime - Mission.flags.trap > Mission.flags.trapLen;
      } }
  ],
  intro: {
    lines: [[0, 'SEVEN YEARS AGO.', 'big'], [3200, 'TEN YEARS AFTER GLASS HARBOR.', ''], [6400, 'THE LAST NIGHT HE REMEMBERED EVERYTHING.', '']],
    dur: 10000,
    fly(eye, look) { return [{ t: 0, pos: new V3(-45, 40, 120), look: new V3(-45, 2, 45) }, { t: 5, pos: eye.clone().add(new V3(-4, 3, -8)), look: eye.clone() }, { t: 7, pos: eye.clone(), look: look.clone() }]; }
  },
  complete() {
    achieve('fb2', 'The First Time', 'Flashback II complete');
    setTimeout(() => $('fade').classList.remove('on'), 600);
    showEnding({
      lines: [[400, 'Lena Voss died on a street in San Marcos with the drive still in her pocket.'], [3800, 'Evan Cross woke up three days later in a white room. He did not remember the street. Or the doctor.'],
        [7600, '<span class="my">MAYA</span> Morning, Lieutenant. Ready to fly?'], [10400, '<span class="ev">EVAN</span> Always. ...Have we met?'], [13200, 'She smiles. She will practice that smile six more times.']],
      cardAt: 16000, chapter: 'END OF FLASHBACK II', title: 'THE SAFEHOUSE', next: 5, tease: 'NEXT — CHAPTER 3: BURN THE CITY'
    });
  }
};
function f2Trap() {
  for (const e of enemies) if (e.alive) e.dispose();
  const car = F2S.car, lines = LF2.trap, at = n => lines.slice(0, n).reduce((s, l) => s + l[2] + 0.35, 0);
  const total = at(lines.length) + 1.5; Mission.flags.trapLen = total + 2.5;
  if (F2S.voss) F2S.voss.hold = new V3(car.x + 6, 0, car.z - 3);
  if (F2S.maya) F2S.maya.hold = new V3(player.pos.x + 1.5, 0, player.pos.z + 1);
  F2S.heli = scriptedHeli(new V3(car.x - 260, 60, car.z + 200), new V3(car.x - 14, 20, car.z + 6), { kind: 'gunship', speed: 45 });
  // spotlight on the street
  const spot = new THREE.SpotLight(0xffffff, 0, 70, 0.32, 0.5, 1.2); scene.add(spot, spot.target); actors.push({ update() { if (F2S.heli) { spot.position.copy(F2S.heli.pos); spot.target.position.set(player.pos.x, 0, player.pos.z); spot.intensity = F2S.heli.arrived ? 5 : 0; } }, dispose() { scene.remove(spot, spot.target); } });
  const eye = new V3(player.pos.x, player.pos.y + 1.62, player.pos.z), carP = new V3(car.x, 1.4, car.z);
  const mayaP = () => F2S.maya ? F2S.maya.pos.clone().setY(F2S.maya.pos.y + 1.55) : carP.clone();
  storyBeat([{ t: 0, pos: eye.clone(), look: carP.clone().add(new V3(-14, 16, 6)) }, { t: at(3), pos: eye.clone(), look: carP.clone().add(new V3(-12, 14, 6)) },
    { t: at(4), pos: eye.clone(), look: F2S.voss ? F2S.voss.pos.clone().setY(1.4) : carP.clone() }, { t: at(6), pos: eye.clone(), look: F2S.voss ? F2S.voss.pos.clone().setY(0.6) : carP.clone() },
    { t: at(7), pos: eye.clone(), look: mayaP() }, { t: total, pos: eye.clone().lerp(mayaP(), 0.55), look: mayaP() }], lines);
  after(at(4) + 0.6, () => {
    const v = F2S.voss; if (!v || !F2S.heli) return;
    for (let i = 0; i < 6; i++) setTimeout(() => { Tracers.add(F2S.heli.pos.clone(), v.pos.clone().add(new V3(rand(-0.3, 0.3), 1.2, rand(-0.3, 0.3))), true); AudioSys.shot('lmg', F2S.heli.pos); }, i * 70);
    setTimeout(() => { FX.impact(v.pos.clone().setY(1.2), 'blood', new V3(1, 0, 0)); v.hold = null; v.moveTarget = null; Enemy.prototype.die.call(v, new V3(1, 0, 0), false, 'none'); }, 380);
  });
  after(at(9) - 0.4, () => { addShake(0.25); AudioSys.ui('click'); });
  after(at(9) + 1.2, () => { const f = $('fade'); f.style.transition = 'opacity 2.6s'; f.classList.add('on'); AudioSys.combatTarget = 0; });
}
