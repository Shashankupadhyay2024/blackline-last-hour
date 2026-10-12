/* ============================================================
   INPUT: gamepad (Xbox / PlayStation / any "standard" pad),
   menu navigation with a controller, rumble, prompt glyphs.
   Standard mapping: 0 A/✕ 1 B/○ 2 X/□ 3 Y/△ 4 LB 5 RB 6 LT 7 RT
   8 View/Share 9 Menu/Options 10 L3 11 R3 12-15 D-pad U D L R
   ============================================================ */
const Pad = {
  connected: false, active: false, lastUse: -99, id: '',
  lx: 0, ly: 0, rx: 0, ry: 0, lt: 0, rt: 0, b: [], p: [], gp: null,
  sprint: false, crouch: false, menuT: 0, navIdx: 0,
  dz(v, d) { d = d || 0.16; const a = Math.abs(v); return a < d ? 0 : Math.sign(v) * (a - d) / (1 - d); },
  held(i) { return !!this.b[i]; },
  pressed(i) { return !!this.b[i] && !this.p[i]; },
  released(i) { return !this.b[i] && !!this.p[i]; },
  poll(dt) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null; for (const g of pads) if (g && g.connected) { gp = g; if (g.mapping === 'standard') break; }
    this.p = this.b.slice();
    if (!gp) { if (this.connected) { this.connected = false; this.onChange(); } this.b = []; this.lx = this.ly = this.rx = this.ry = this.lt = this.rt = 0; return; }
    if (!this.connected) { this.connected = true; this.id = gp.id; this.onChange(); }
    this.gp = gp;
    const ax = gp.axes, bt = gp.buttons;
    const radial = (x, y, d) => { const m = Math.hypot(x, y); if (m < d) return [0, 0]; const k = Math.min(1, (m - d) / (1 - d)) / m; return [x * k, y * k]; };
    [this.lx, this.ly] = radial(ax[0] || 0, ax[1] || 0, 0.17);
    [this.rx, this.ry] = radial(ax[2] || 0, ax[3] || 0, 0.14);
    this.b = bt.map(b => b && (b.pressed || b.value > 0.45));
    this.lt = bt[6] ? bt[6].value : 0; this.rt = bt[7] ? bt[7].value : 0;
    const any = this.b.some(Boolean) || Math.abs(this.lx) + Math.abs(this.ly) + Math.abs(this.rx) + Math.abs(this.ry) > 0.05;
    if (any) { this.lastUse = realTime; if (!this.active) { this.active = true; document.body.classList.add('pad'); } }
  },
  onChange() { HUD && HUD.feed && HUD.feed(this.connected ? '🎮 CONTROLLER CONNECTED' : 'CONTROLLER DISCONNECTED', this.connected ? 'gold' : 'red'); if (!this.connected) { this.active = false; document.body.classList.remove('pad'); } },
  rumble(strong, weak, ms) {
    if (!settings.rumble || !this.gp || !this.active) return;
    const a = this.gp.vibrationActuator; if (!a || !a.playEffect) return;
    try { a.playEffect('dual-rumble', { duration: ms || 120, strongMagnitude: clamp(strong, 0, 1), weakMagnitude: clamp(weak ?? strong, 0, 1) }); } catch (e) { }
  }
};
function keyboardUsed() { if (Pad.active) { Pad.active = false; document.body.classList.remove('pad'); } }
addEventListener('keydown', keyboardUsed); addEventListener('mousedown', keyboardUsed);
addEventListener('gamepadconnected', () => { });

/* ---------- gameplay actions from the pad (edge-triggered) ---------- */
function padGameplay(dt) {
  if (!Pad.connected) return;
  const P = Pad;
  if (P.pressed(9)) { if (state === 'play') { pause(); return; } }
  if (state === 'intro' || Cine.skippable) { if (P.pressed(0) || P.pressed(9)) skipIntro(); return; }
  if (state !== 'play' || !player.alive || Cine.active) return;
  if (showLore.open && (P.pressed(1) || P.pressed(2) || P.pressed(0))) { hideLore(); return; }
  if (player.inJet) return;
  if (player.inVehicle) {
    if (P.pressed(3) || P.pressed(2)) exitVehicle(false);
    if (P.pressed(4)) vcam.mode = 1 - vcam.mode;
    return;
  }
  // on foot
  if (P.pressed(2)) { if (interactTarget) interactTarget.act(); else startReload(); }
  if (P.pressed(3)) cycleWeapon(1);
  if (P.pressed(4)) cycleWeapon(-1);
  if (P.pressed(5)) throwGrenade();
  if (P.pressed(1)) P.crouch = !P.crouch;
  if (P.pressed(10)) { if (W.adsT > 0.5 && opticOf(cur).scope) holdBreathStart(); else P.sprint = !P.sprint; }
  if (P.pressed(11)) meleeQuick();
  if (P.pressed(12)) zoomStep(1); if (P.pressed(13)) zoomStep(-1);
  if (P.pressed(15)) cycleOptic();
  if (P.pressed(14) && inv.golden) switchWeapon('golden');
  if (Math.hypot(P.lx, P.ly) < 0.2 || P.ly > 0.3) P.sprint = false;
  if (P.sprint) P.crouch = false;
}
/* analog look with response curve + aim assist */
function padLook(dt) {
  if (!Pad.connected || (!Pad.rx && !Pad.ry)) return;
  const zoom = curZoom(), sens = settings.padSens * 3.2 / Math.pow(zoom, 0.8);
  const cx = Math.sign(Pad.rx) * Math.pow(Math.abs(Pad.rx), 1.8), cy = Math.sign(Pad.ry) * Math.pow(Math.abs(Pad.ry), 1.8);
  let slow = 1;
  if (settings.aimAssist) { const t = aimTarget(0.09); if (t) slow = W.adsT > 0.5 ? 0.45 : 0.65; }
  player.yaw -= cx * sens * dt * slow; player.pitch -= cy * sens * dt * 0.75 * slow * (settings.invertY ? -1 : 1);
  player.pitch = clamp(player.pitch, -1.52, 1.52);
  W.swayX += (-cx * 0.02 - W.swayX) * 0.1; W.swayY += (cy * 0.02 - W.swayY) * 0.1;
}
/* nearest enemy head within `cone` radians of the crosshair (visible) */
function aimTarget(cone) {
  camera.getWorldDirection(_v1); let best = null, ba = cone;
  for (const e of enemies) {
    if (!e.alive) continue; const d = e.pos.distanceTo(player.pos); if (d > 90) continue;
    e.headSphere(_sph); _v2.copy(_sph.center).setY(_sph.center.y - 0.35).sub(camera.position); const dist = _v2.length(); _v2.divideScalar(dist);
    const a = Math.acos(clamp(_v1.dot(_v2), -1, 1)); if (a < ba && !castRay(camera.position, _v2, dist - 0.5, { noEnemies: true, ignoreCar: player.inVehicle })) { ba = a; best = e; }
  }
  return best;
}
/* snap toward a target when ADS starts (pad only) */
function adsSnap() {
  if (!Pad.active || !settings.aimAssist) return;
  const t = aimTarget(0.16); if (!t) return;
  t.headSphere(_sph); const p = _sph.center.clone(); p.y -= 0.35;
  const dx = p.x - camera.position.x, dy = p.y - camera.position.y, dz = p.z - camera.position.z;
  const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz));
  player.yaw += angDiff(player.yaw, yaw) * 0.6; player.pitch += (pitch - player.pitch) * 0.6;
}

/* ---------- menu navigation ---------- */
function padMenus(dt) {
  if (!Pad.connected) return;
  const scr = [...document.querySelectorAll('.screen')].find(s => !s.classList.contains('hidden'));
  if (!scr || state === 'play') { document.querySelectorAll('.padfocus').forEach(e => e.classList.remove('padfocus')); return; }
  const items = [...scr.querySelectorAll('button, select, input')].filter(e => !e.disabled && e.offsetParent !== null);
  if (scr.id === 'begin') { if (Pad.pressed(0) || Pad.pressed(9)) scr.click(); return; }
  if (!items.length) return;
  if (Pad._scr !== scr) { Pad._scr = scr; Pad.navIdx = 0; }
  Pad.navIdx = clamp(Pad.navIdx, 0, items.length - 1);
  Pad.menuT -= dt;
  const vy = Pad.ly + (Pad.held(13) ? 1 : 0) - (Pad.held(12) ? 1 : 0), vx = Pad.lx + (Pad.held(15) ? 1 : 0) - (Pad.held(14) ? 1 : 0);
  const grid = scr.id === 'chapters' || scr.id === 'choice' || scr.id === 'death' || scr.id === 'ending';
  if (Pad.menuT <= 0 && (Math.abs(vy) > 0.5 || (grid && Math.abs(vx) > 0.5))) {
    const step = Math.abs(vy) > 0.5 ? Math.sign(vy) : Math.sign(vx);
    Pad.navIdx = (Pad.navIdx + step + items.length) % items.length; Pad.menuT = 0.18; AudioSys.ctx && AudioSys.ui('click');
  } else if (Math.abs(vy) < 0.3 && Math.abs(vx) < 0.3) Pad.menuT = 0;
  const el = items[Pad.navIdx];
  document.querySelectorAll('.padfocus').forEach(e => { if (e !== el) e.classList.remove('padfocus'); });
  el.classList.add('padfocus'); if (el.scrollIntoView && Pad._last !== el) { el.scrollIntoView({ block: 'nearest' }); Pad._last = el; }
  // adjust sliders / selects / checkboxes with left-right
  if (!grid && Pad.menuT <= 0 && Math.abs(vx) > 0.5) {
    Pad.menuT = 0.14;
    if (el.type === 'range') { const st = parseFloat(el.step) || 0.05; el.value = clamp(parseFloat(el.value) + Math.sign(vx) * st, parseFloat(el.min), parseFloat(el.max)); el.dispatchEvent(new Event('input')); }
    else if (el.tagName === 'SELECT') { el.selectedIndex = clamp(el.selectedIndex + Math.sign(vx), 0, el.options.length - 1); el.dispatchEvent(new Event('input')); }
  }
  if (Pad.pressed(0)) {
    AudioSys.init();
    if (el.type === 'checkbox') { el.checked = !el.checked; el.dispatchEvent(new Event('input')); }
    else if (el.tagName === 'SELECT') { el.selectedIndex = (el.selectedIndex + 1) % el.options.length; el.dispatchEvent(new Event('input')); }
    else el.click();
  }
  if (Pad.pressed(1) || (Pad.pressed(9) && state === 'pause')) {
    const back = scr.querySelector('.btn-back, #btn-chap-back, #btn-quit-back') || (state === 'pause' ? $('btn-resume') : null);
    if (back && back.offsetParent !== null) back.click();
  }
}
