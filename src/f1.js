/* ============================================================
   FLASHBACK I — GLASS HARBOR  (Nevada, seventeen years ago)
   Lieutenant Evan Cross and Sergeant Maya Reyes, on Major
   Silas Kade's orders, raid a desert camp at dawn to "rescue"
   Doctor Lena Voss — the woman who built the Blackline.
   Maya fights beside you.
   ============================================================ */
const FB_GRADE = { lift: [0.045, 0.028, 0.0], gain: [1.1, 1.0, 0.82], sat: 0.6, contrast: 1.05, vig: 0.58, bloom: 0.85, threshold: 2.0 };
const F1 = {};
const LF1 = {
  intro: [['SILAS', '(radio) Overwatch to Glass Harbor. Package is a scientist. Doctor Lena Voss. Alive.', 4.2], ['SILAS', '(radio) Everyone else at that camp is optional.', 2.8], ['MAYA', '(quietly) "Optional." He says it like it\'s a real word.', 3.2], ['EVAN', 'He says everything like that.', 2.2]],
  walk: [['MAYA', 'You\'re walking like a pilot, Cross. Stay low. This isn\'t a runway.', 3.6], ['EVAN', 'Says the woman who got us lost twice on the drive in.', 3], ['MAYA', 'I got us here, didn\'t I? I always get us there.', 3]],
  ridge: [['MAYA', 'Eight tangos. One in the tower. On your mark, Lieutenant.', 3.4], ['EVAN', 'Since when do you wait for my mark?', 2.4], ['MAYA', 'Since you started looking at me like that. Go.', 2.8]],
  clear: [['MAYA', 'Clear! Not bad for a flyboy.', 2.4], ['MAYA', 'The doctor\'s in one of the tents. Go easy, she\'s a civilian.', 3.2]],
  voss: [['EVAN', 'Doctor Voss? We\'re here to take you home.', 2.6], ['VOSS', 'Home. Is that what Kade calls it?', 2.6], ['VOSS', 'Listen to me. What I built here doesn\'t predict wars. It learns to need them.', 4.6], ['VOSS', 'If Kade takes the Blackline, nobody ever gets out. Not me. Not you.', 3.8], ['MAYA', 'Ma\'am, we can talk on the helicopter.', 2.4]],
  hold: [['SILAS', '(radio) Two minutes out. Hold that camp, kids.', 2.8], ['MAYA', 'Contacts west! They want her back.', 2.4]],
  promise: [['MAYA', 'Evan. If this goes bad...', 2], ['EVAN', 'It won\'t.', 1.2], ['MAYA', 'If it does. Promise me something.', 2.2], ['EVAN', 'Anything.', 1.2], ['MAYA', 'If I ever forget you, you remind me. Whatever it takes.', 3.4], ['EVAN', 'And if I forget you?', 1.8], ['MAYA', 'Then I\'ll leave you a trail. Breadcrumbs. You\'re not that hard to lead.', 4]],
  lz: [['SILAS', '(radio) Wheels down on the flats. Bring me the doctor.', 2.8]],
  end: [['SILAS', '(in person) Good work, kids. Doctor Voss belongs to the program now.', 3.6], ['VOSS', 'Program? Kade, you said I would be safe.', 2.8], ['SILAS', '(in person) And you will be, Doctor. Forever.', 2.8], ['MAYA', '(quietly) Evan... what did we just do?', 2.6], ['SILAS', '(in person) You made history, Reyes. Now you get to make it again. And again.', 4]]
};
function f1Wave(n) {
  const cx = CAMP.x, cz = CAMP.z;
  for (let i = 0; i < n; i++) { const a = rand(2.4, 4.0), r = rand(60, 80), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; addEnemy(pick(['rifle', 'rifle', 'shotgun']), x, z, { group: 'wave', combat: true }); }
  HUD.feed('⚠ HOSTILES INBOUND', 'red');
}
LEVELS[2] = {
  id: 2, flashback: 'SEVENTEEN YEARS AGO', name: 'FLASHBACK I — GLASS HARBOR', chapter: 'FLASHBACK I', title: 'GLASS HARBOR', sub: 'NEVADA · 05:40 · SEVENTEEN YEARS AGO',
  env: { grade: FB_GRADE, clouds: 0.4, cloudCol: 0xffc8a0, sky: [0x2a3560, 0xf2a070, 0xe8b48a], fog: [0xe0aa84, 150, 1050], sunDir: new V3(0.82, 0.2, -0.25), sunCol: 0xffc090, sunI: 2.1, hemi: [0xffd8b0, 0x6a4632, 0.42], amb: [0x4a4a66, 0.16], exposure: 1.0 },
  h: desertH, onRoad: desertOnRoad, bounds: 520,
  build() { WORLD = 520; buildDesert(); },
  menuFocus: new V3(CAMP.x, 0, CAMP.z),
  menuCam(t) { const r = 60, x = CAMP.x + Math.cos(t) * r, z = CAMP.z + Math.sin(t) * r; return { pos: new V3(x, terrainH(x, z) + 12, z), look: new V3(CAMP.x, CAMP_H + 3, CAMP.z) }; },
  radar(c, tr, px, pz) { c.strokeStyle = 'rgba(200,190,170,0.35)'; c.lineWidth = 4; c.beginPath(); for (let z = pz - 120; z <= pz + 120; z += 8) { const [x, y] = tr(roadX(z), z); z === pz - 120 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); },
  tick(dt, menu) { if (campLight) campLight.intensity = 1.2 + Math.random() * 0.4; if (!menu && Math.random() < dt * 20) FX.fire(CAMPPTS.fire, 0.45); },
  tips: ['Maya follows you and shoots anything she can see. Let her draw fire.', 'The tower sniper telegraphs with a red laser.', 'Health regenerates if you avoid damage for a few seconds.'],
  cpStep: [0, 3, 4],
  reset(cp) {
    const cx = CAMP.x, cz = CAMP.z;
    F1.ridge = new V3(cx + 26, 0, cz + 26); F1.ridge.y = terrainH(F1.ridge.x, F1.ridge.z);
    F1.lz = new V3(cx + 46, 0, cz - 46); F1.lz.y = terrainH(F1.lz.x, F1.lz.z);
    F1.vossAt = new V3(cx + 6, CAMP_H, cz + 12.6);
    for (const [x, z] of [[cx - 5, cz + 6], [cx + 13, cz - 3], [cx - 11, cz - 1]]) spawnBarrel(x, z, CAMP_H);
    pickups.push(new Pickup('ammo', new V3(cx - 2, CAMP_H, cz - 3.5))); pickups.push(new Pickup('armor', new V3(cx - 3.5, CAMP_H, cz - 3.2))); pickups.push(new Pickup('grenades', new V3(cx + 1.5, CAMP_H, cz - 3.3)));
    pickups.push(new Pickup('jack', CAMPPTS.jack)); pickups.push(new Pickup('weapon', new V3(cx - 7, CAMP_H + 0.3, cz + 3), { weapon: 'sniper' })); pickups.push(new Pickup('health', new V3(cx + 4, CAMP_H, cz - 6)));
    if (cp === 0) {
      spawnCampEnemies();
      for (const [x, z, t] of [[cx - 10, cz + 2, 'rifle'], [cx + 8, cz - 10, 'rifle'], [cx - 4, cz - 9, 'rifle'], [cx + 14, cz + 6, 'shotgun']]) addEnemy(t, x, z, { group: 'camp', yaw: rand(0, TAU), patrol: [[x, z], [x + rand(-6, 6), z + rand(-6, 6)]] });
    }
    F1.maya = new Ally(cx + 34, cz + 36, { color: 0x5a5a3c, gear: 0x3a3a28, side: 1 });
    F1.voss = null; F1.vossStand = null; F1.heli = null;
    if (cp < 1) { F1.vossStand = standIn(F1.vossAt.x, F1.vossAt.z, { color: 0xd8d8d0, gear: 0xa8a8a0, noGun: true, hairCol: 0x6a4a2a, y: CAMP_H, yaw: 0 }); }
    else { F1.voss = new Ally(cx - 6, cz - 2, { name: 'DR. VOSS', noGun: true, color: 0xd8d8d0, gear: 0xa8a8a0, hairCol: 0x6a4a2a, side: -1, hitP: 0 }); F1.voss.shotT = 1e9; }
    if (cp >= 1) F1.maya.pos.set(cx - 12, CAMP_H, cz - 4);
    new Interact(F1.vossAt.clone().setY(CAMP_H + 1.2), 'Talk to Doctor Voss', () => { Mission.flags.voss = gameTime; }, { range: 3.5, enabled: () => Mission.cur().id === 'voss' && !Mission.flags.voss });
    const sp = [[cx + 40, cz + 44, Math.PI * 0.25], [cx - 4, cz - 6, Math.PI / 2], [cx + 4, cz - 10, Math.PI * 0.75]][cp];
    return { spawn: sp, loadout: ['pistol', 'ar'], cur: 'ar', armor: 50, nades: 3 };
  },
  steps: [
    { id: 'ridge', cp: 0, text: 'Follow the ridge to the camp with Maya', marker: () => F1.ridge.clone().setY(F1.ridge.y + 2),
      enter() { after(1.5, () => HUD.say(LF1.intro)); after(15, () => HUD.say(LF1.walk)); after(4, () => HUD.hint('Maya fights beside you. She follows you and shoots whatever she can see.', 6)); },
      update() { return Math.hypot(player.pos.x - F1.ridge.x, player.pos.z - F1.ridge.z) < 9 || enemies.some(e => e.alive && e.state === 'combat'); } },
    { id: 'camp', text: 'Clear the camp', marker: () => new V3(CAMP.x, CAMP_H + 3, CAMP.z),
      enter() { HUD.say(LF1.ridge); },
      update() { const left = enemies.filter(e => e.alive && e.group === 'camp').length; $('obj-sub').textContent = left ? left + ' hostiles remaining' : ''; if (!left && !Mission.flags.clr) { Mission.flags.clr = gameTime; HUD.say(LF1.clear); } return Mission.flags.clr && gameTime - Mission.flags.clr > 2; } },
    { id: 'voss', text: 'Find Doctor Voss in the camp', marker: () => F1.vossAt.clone().setY(CAMP_H + 2.4),
      update() {
        if (Mission.flags.voss && !Mission.flags.vossSaid) { Mission.flags.vossSaid = true; HUD.say(LF1.voss); showLore('LENA VOSS — FIELD NOTES', 'The model does not predict war.\nFeed it one war and it learns to <b>need</b> the next.\n\nWhoever holds it will never let the world end —\nand never let it <b>change</b>.\n\nKade wants a reset button. God help us, I built him one.', 14); }
        return Mission.flags.voss && gameTime - Mission.flags.voss > 17;
      } },
    { id: 'hold', cp: 1, text: 'Hold the camp until Overwatch arrives',
      marker: () => null,
      enter() {
        hideLore();
        if (F1.vossStand) { F1.vossStand.dispose(); F1.vossStand = null; }
        if (!F1.voss) { F1.voss = new Ally(F1.vossAt.x, F1.vossAt.z, { name: 'DR. VOSS', noGun: true, color: 0xd8d8d0, gear: 0xa8a8a0, hairCol: 0x6a4a2a, side: -1, hitP: 0, y: CAMP_H }); F1.voss.shotT = 1e9; }
        F1.voss.hold = new V3(CAMP.x - 9, 0, CAMP.z - 7); F1.maya.hold = new V3(CAMP.x - 13, 0, CAMP.z - 4);
        HUD.say(LF1.hold); Countdown.start(80, 'OVERWATCH', () => { Mission.flags.held = true; });
        f1Wave(4); after(16, () => f1Wave(4)); after(26, () => HUD.say(LF1.promise)); after(34, () => f1Wave(5));
        after(48, () => new Heli(CAMP.x - 300, 80, CAMP.z - 200, { drop: true, troops: 5, landAt: new V3(CAMP.x - 40, 0, CAMP.z + 10), group: 'wave' })); after(60, () => f1Wave(4));
      },
      update() { return !!Mission.flags.held; } },
    { id: 'extract', cp: 2, text: 'Bring Doctor Voss to the helicopter on the flats', marker: () => F1.lz.clone().setY(F1.lz.y + 3),
      enter() {
        Countdown.stop(); if (F1.maya) F1.maya.hold = null; if (F1.voss) F1.voss.hold = null;
        if (!F1.voss) { F1.voss = new Ally(player.pos.x - 2, player.pos.z, { name: 'DR. VOSS', noGun: true, color: 0xd8d8d0, gear: 0xa8a8a0, hairCol: 0x6a4a2a, side: -1, hitP: 0 }); F1.voss.shotT = 1e9; }
        for (const e of enemies) if (e.alive && e.group === 'wave' && e.pos.distanceTo(player.pos) > 40) e.dispose();
        F1.heli = scriptedHeli(new V3(F1.lz.x + 300, 70, F1.lz.z - 300), new V3(F1.lz.x, F1.lz.y + 2.2, F1.lz.z), { speed: 40 });
        HUD.say(LF1.lz);
      },
      update() {
        const d = Math.hypot(player.pos.x - F1.lz.x, player.pos.z - F1.lz.z);
        if (d < 16 && F1.heli && F1.heli.arrived && !Mission.flags.cine) { Mission.flags.cine = gameTime; f1Ending(); }
        return Mission.flags.cine && gameTime - Mission.flags.cine > 19;
      } }
  ],
  intro: {
    lines: [[0, 'SEVENTEEN YEARS AGO.', 'big'], [3200, 'BEFORE THE PHOTOGRAPHS. BEFORE THE RESETS.', ''], [6600, 'BEFORE HE FORGOT HER NAME.', '']],
    dur: 10000,
    fly(eye, look) { return [{ t: 0, pos: new V3(CAMP.x + 120, CAMP_H + 40, CAMP.z + 100), look: new V3(CAMP.x, CAMP_H, CAMP.z) }, { t: 5, pos: eye.clone().add(new V3(6, 3, 8)), look: eye.clone() }, { t: 7, pos: eye.clone(), look: look.clone() }]; }
  },
  complete() {
    achieve('fb1', 'Whatever It Takes', 'Flashback I complete');
    showEnding({
      lines: [[400, 'That morning, the Blackline got its engineer.'], [2800, 'And its first two soldiers.'], [5600, '<span class="my">MAYA</span> Remind me, Cross. Whatever it takes.'], [8800, '<span class="ev">EVAN</span> Whatever it takes.'], [11400, 'Seventeen years later, he won\'t remember saying it.']],
      cardAt: 14000, chapter: 'END OF FLASHBACK I', title: 'GLASS HARBOR', next: 3, tease: 'NEXT — CHAPTER 2: BLACKLINE'
    });
  }
};
function f1Ending() {
  const lz = F1.lz, s = standIn(lz.x + 4, lz.z + 2, { color: 0x4a4a46, gear: 0x2a2a28, hairCol: 0x3a3028, yaw: yawTo(lz.x + 4, lz.z + 2, player.pos.x, player.pos.z) });
  F1.silas = s;
  if (F1.voss) { F1.voss.hold = new V3(lz.x + 2, 0, lz.z + 4); }
  if (F1.maya) { F1.maya.hold = new V3(player.pos.x + 2, 0, player.pos.z + 1); }
  for (const e of enemies) if (e.alive) e.dispose();
  const eye = new V3(player.pos.x, player.pos.y + 1.62, player.pos.z), sp = new V3(lz.x + 4, lz.y + 1.6, lz.z + 2);
  storyBeat([{ t: 0, pos: eye.clone(), look: sp.clone() }, { t: 6, pos: eye.clone().lerp(sp, 0.35).setY(eye.y), look: sp.clone() }, { t: 13, pos: eye.clone().lerp(sp, 0.45).add(new V3(2, 0.4, 0)), look: F1.maya ? F1.maya.pos.clone().setY(F1.maya.pos.y + 1.5) : sp }, { t: 18, pos: eye.clone().add(new V3(0, 6, 0)), look: sp.clone() }], LF1.end);
}
