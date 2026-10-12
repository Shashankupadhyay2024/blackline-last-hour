/* ============================================================
   FLASHBACK III — THE LAST GOOD DAY  (Kestrel Island, three years ago)
   The day before the seventh wipe. Evan and Maya steal the
   transmitter key, send the world the warning (WHEN THE
   BLACKLINE OPENS, DO NOT TRUST THE SKY) and run for the boat.
   Kade is waiting at the dock. Maya makes the deal again, and
   promises to leave Evan a trail.
   ============================================================ */
const F3 = {};
const LF3 = {
  intro: [['MAYA', '(quietly) Morning, Cross.', 1.8], ['EVAN', 'Is it? Feels like the last one.', 2.4], ['MAYA', '(quietly) Tomorrow they put you back in the chair. Cycle seven.', 3.4], ['EVAN', 'Then we make today count.', 2]],
  beach: [['MAYA', 'Do you remember this beach?', 2], ['EVAN', 'No. Should I?', 1.6], ['MAYA', 'You made a toast here. Cycle four. "To whoever we were before."', 4], ['EVAN', 'Sounds like me.', 1.6], ['MAYA', 'It sounds like you every time.', 2.4]],
  plan: [['MAYA', 'The plan. Transmitter key from Lab A. Radio tower. One message to every agency on Earth.', 4.4], ['EVAN', 'And then?', 1.2], ['MAYA', 'And then the gunboat, and the sea, and no more sky.', 3]],
  compound: [['MAYA', 'Kade doubled the guards overnight. He knows something.', 3], ['EVAN', 'He always knows something.', 1.8]],
  key: [['EVAN', 'Got the key.', 1.2], ['MAYA', 'Tower. Go.', 1.2]],
  send: [['EVAN', 'Seventeen years of this, and we get one sentence.', 3], ['MAYA', 'Make it something they\'ll remember the shape of, even if they forget the words.', 3.8], ['EVAN', '(typing) When the Blackline opens...', 2.6], ['MAYA', '...do not trust the sky.', 2.2]],
  hold: [['SILAS', '(radio) Cross. Reyes. Step away from my radio.', 2.6], ['MAYA', 'Too late, Kade. The whole world just heard us.', 2.8], ['SILAS', '(radio) The world hears a lot of things. By morning it will have forgotten. So will he.', 4.4]],
  dock: [['MAYA', 'It\'s out! Dock, now, before they lock down the island!', 3]],
  caught: [['SILAS', '(in person) A riddle, Mister Cross? Seventeen years, and you send the world a riddle.', 4.2], ['EVAN', 'They\'ll work it out.', 1.8],
    ['SILAS', '(in person) They will lose it in a week. You will lose it tonight.', 3.4], ['SILAS', '(in person) Reyes. Same deal as always. You do it, or my people do it rough.', 4],
    ['EVAN', 'Maya, don\'t.', 1.4], ['MAYA', 'Full wipe. I do it myself. Nobody else touches him.', 3.2], ['SILAS', '(in person) Seventh time. You would think it gets easier.', 3],
    ['MAYA', '(quietly) Breadcrumbs, Evan. Photographs. A wall. I\'ll leave you a trail.', 4], ['MAYA', '(quietly) You always find the wall.', 2.2], ['EVAN', 'And if I don\'t?', 1.6],
    ['MAYA', '(quietly) Then I\'ll come find you. A convoy, in the desert. I\'ll be your eyes.', 4.2]]
};
LEVELS[8] = Object.assign({}, ISLAND_BASE, {
  id: 8, flashback: 'THREE YEARS AGO', name: 'FLASHBACK III — THE LAST GOOD DAY', chapter: 'FLASHBACK III', title: 'THE LAST GOOD DAY', sub: 'KESTREL ISLAND · 06:30 · THREE YEARS AGO',
  env: Object.assign({}, ISLAND_BASE.env, { grade: { lift: [0.045, 0.03, 0.0], gain: [1.1, 1.0, 0.84], sat: 0.7, contrast: 1.05, vig: 0.55, bloom: 0.8, threshold: 2.1 }, sunDir: new V3(0.75, 0.22, 0.3), sunCol: 0xffc898, sunI: 2.2, sky: [0x3a5a9a, 0xf0b080, 0xf8d8b0], fog: [0xf0d0b0, 160, 1100] }),
  tips: ['Maya follows you and shoots whatever she can see.', 'Stay quiet in the compound: punch unaware guards for silent takedowns.', 'Stay near the tower while the message transmits.'],
  cpStep: [0, 3, 5],
  reset(cp) {
    const C = I4.comp, y = I4H, o = ISL_O;
    if (cp <= 1) {
      for (const [x, z, t] of [[C.x, C.z + 44, 'rifle'], [C.x - 12, C.z + 30, 'rifle'], [C.x + 12, C.z + 2, 'heavy'], [C.x - 30, C.z - 4, 'shotgun'], [C.x + 40, C.z - 20, 'rifle'], [C.x + 22, C.z + 20, 'rifle'], [C.x + 30, C.z + 4, 'rifle']])
        addEnemy(t, x, z, Object.assign({ group: 'comp', y, patrol: [[x, z], [x + rand(-8, 8), z + rand(-8, 8)]] }, o));
      addEnemy('sniper', C.x + 48, C.z - 10, Object.assign({ group: 'comp', y: y + 13, static: true, yaw: 0 }, o));
    }
    islandPickups();
    new Interact(I4.labATerm, 'Take the transmitter key', () => { Mission.flags.key = gameTime; AudioSys.ui('rack'); }, { enabled: () => Mission.cur().id === 'key' });
    new Interact(I4.console, 'Send the warning', () => { Mission.flags.sent = gameTime; AudioSys.ui('radio'); }, { range: 3, enabled: () => Mission.cur().id === 'tower' });
    const T = I4.tower, D = I4.dock;
    F3.dockAt = new V3(D.x - 40, 0, D.z);
    const sp = [[22, beachZ(22) - 6, 0.15], [C.x + 44, C.z - 26, yawTo(C.x + 44, C.z - 26, T.x, T.z)], [T.x - 8, T.z + 16, -0.6]][cp];
    F3.maya = new Ally(sp[0] + 2.5, sp[1] + 2, { color: 0x4a5a48, gear: 0x2a3228, side: 1, y: islandH(sp[0] + 2.5, sp[1] + 2) });
    return { spawn: sp, y: islandH(sp[0], sp[1]), loadout: ['pistol', 'smg', 'ar'], cur: 'ar', armor: 50, nades: 3 };
  },
  steps: [
    { id: 'beach', cp: 0, text: 'Walk the beach with Maya to the path inland', marker: () => new V3(20, islandH(20, 230) + 2, 230),
      enter() { after(1.5, () => HUD.say(LF3.intro)); after(13, () => HUD.say(LF3.beach)); after(4, () => HUD.hint('Maya fights beside you. She follows you and shoots whatever she can see.', 6)); },
      update() { return Math.hypot(player.pos.x - 20, player.pos.z - 230) < 14; } },
    { id: 'path', text: 'Follow the path to the research compound', marker: () => new V3(20, I4H + 3, 50),
      enter() { HUD.say(LF3.plan); },
      update() { if (!Mission.flags.cmp && Math.hypot(player.pos.x - 20, player.pos.z - 50) < 40) { Mission.flags.cmp = true; HUD.say(LF3.compound); } return Math.hypot(player.pos.x - 20, player.pos.z - 50) < 14 || enemies.some(e => e.alive && e.state === 'combat'); } },
    { id: 'key', text: 'Take the transmitter key from Lab A (east building)', marker: () => I4.labATerm.clone().setY(I4H + 2.2),
      update() { if (Mission.flags.key && !Mission.flags.keySaid) { Mission.flags.keySaid = true; HUD.say(LF3.key); } return Mission.flags.key && gameTime - Mission.flags.key > 1.5; } },
    { id: 'tower', cp: 1, text: 'Get to the radio tower and send the warning', marker: () => I4.console.clone().setY(I4.console.y + 1.5),
      enter() { islandTroops(4, new V3(I4.comp.x + 30, I4H, I4.comp.z - 30)); },
      update() { return !!Mission.flags.sent; } },
    { id: 'hold', text: 'Hold the tower while the warning transmits', marker: () => I4.console.clone().setY(I4.console.y + 1.5),
      enter() {
        HUD.say(LF3.send);
        after(5, () => HUD.notify('WHEN THE BLACKLINE OPENS,', 'DO NOT TRUST THE SKY.', 'obj'));
        after(11, () => HUD.say(LF3.hold));
        if (F3.maya) F3.maya.hold = new V3(I4.tower.x - 6, 0, I4.tower.z + 8);
        Countdown.start(60, 'TRANSMITTING', () => { Mission.flags.done = true; });
        const T = I4.tower;
        islandTroops(5, new V3(T.x - 30, 0, T.z + 20)); after(18, () => new Heli(T.x + 200, 80, T.z + 150, { r: 50 }));
        after(26, () => islandTroops(5, new V3(T.x + 28, 0, T.z - 20))); after(42, () => islandTroops(6, new V3(T.x - 26, 0, T.z - 24)));
      },
      update() { return !!Mission.flags.done; } },
    { id: 'dock', cp: 2, text: 'Run for the gunboat at the east dock', marker: () => F3.dockAt.clone().setY(3),
      enter() {
        Countdown.stop(); if (F3.maya) F3.maya.hold = null; HUD.say(LF3.dock);
        for (const e of enemies) if (e.alive && e.pos.distanceTo(player.pos) > 60) e.dispose();
        for (const [x, z, t] of [[200, -14, 'rifle'], [230, 0, 'rifle'], [260, -20, 'shotgun'], [300, -6, 'heavy'], [320, 10, 'rifle'], [340, -12, 'rifle']]) addEnemy(t, x, z, Object.assign({ group: 'isl', yaw: -Math.PI / 2, patrol: [[x, z], [x + rand(-8, 8), z + rand(-8, 8)]] }, ISL_O));
        after(14, () => islandTroops(4, new V3(I4.dock.x - 120, 0, I4.dock.z + 20)));
      },
      update() {
        const d = Math.hypot(player.pos.x - F3.dockAt.x, player.pos.z - F3.dockAt.z);
        if (d < 22 && !Mission.flags.caught) { Mission.flags.caught = gameTime; f3Caught(); }
        return Mission.flags.caught && gameTime - Mission.flags.caught > Mission.flags.caughtLen;
      } }
  ],
  intro: {
    lines: [[0, 'THREE YEARS AGO.', 'big'], [3200, 'THE DAY BEFORE THE SEVENTH CHAIR.', ''], [6600, 'THE LAST GOOD DAY.', '']],
    dur: 10000,
    fly(eye, look) { return [{ t: 0, pos: new V3(60, 6, 470), look: eye.clone() }, { t: 5, pos: eye.clone().add(new V3(3, 2, 8)), look: eye.clone() }, { t: 7, pos: eye.clone(), look: look.clone() }]; }
  },
  complete() {
    achieve('fb3', 'Breadcrumbs', 'Flashback III complete');
    setTimeout(() => $('fade').classList.remove('on'), 600);
    showEnding({
      lines: [[400, 'The warning reached every intelligence agency on Earth. By morning, every copy had vanished.'], [4000, 'Nobody ever found out who sent it.'],
        [6600, 'That night, Maya Reyes put Evan Cross in the chair for the seventh time.'], [10000, 'Then she walked to Lab B with a box of photographs and a roll of tape.'],
        [13600, '<span class="ev">EVAN</span> <i>(now)</i> ...I sent that message. It was me.']],
      cardAt: 17000, chapter: 'END OF FLASHBACK III', title: 'THE LAST GOOD DAY', next: 9, tease: 'NEXT — CHAPTER 6: THE LAST HOUR'
    });
  }
});
function f3Caught() {
  for (const e of enemies) if (e.alive) e.dispose();
  const D = F3.dockAt, lines = LF3.caught, at = n => lines.slice(0, n).reduce((s, l) => s + l[2] + 0.35, 0);
  const total = at(lines.length) + 1.2; Mission.flags.caughtLen = total + 2.5;
  const kx = D.x - 26, kz = D.z, ky = islandH(kx, kz);
  const s = standIn(kx, kz, { color: 0x2c2e33, gear: 0x111214, hairCol: 0x6a6864, y: ky, yaw: yawTo(kx, kz, player.pos.x, player.pos.z), aim: 0.05 });
  for (const [dx, dz] of [[4, -6], [4, 6], [8, -3], [8, 3], [-2, -9]]) { const x = kx + dx, z = kz + dz; const g = standIn(x, z, Object.assign({ y: islandH(x, z), yaw: yawTo(x, z, player.pos.x, player.pos.z) }, ISL_O)); g.m.aim.rotation.x = -0.05; }
  if (F3.maya) F3.maya.hold = new V3(player.pos.x + 2, 0, player.pos.z + 1.5);
  const eye = new V3(player.pos.x, player.pos.y + 1.62, player.pos.z), kp = new V3(kx, ky + 1.6, kz);
  const mp = () => F3.maya ? F3.maya.pos.clone().setY(F3.maya.pos.y + 1.55) : kp.clone();
  storyBeat([{ t: 0, pos: eye.clone(), look: kp.clone() }, { t: at(5), pos: eye.clone(), look: kp.clone() }, { t: at(7), pos: eye.clone(), look: mp() }, { t: total, pos: eye.clone().lerp(mp(), 0.5), look: mp() }], lines);
  after(total - 0.2, () => { addShake(0.6); AudioSys.ui('crash'); const f = $('fade'); f.style.transition = 'none'; f.classList.add('on'); AudioSys.combatTarget = 0; });
  return s;
}
