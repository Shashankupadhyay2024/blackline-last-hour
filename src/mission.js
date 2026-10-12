/* ============================================================
   MISSION FRAMEWORK
   Every chapter registers LEVELS[n] = { env, build, reset, steps,
   cpStep, intro, complete, ... }. The active one is LV.
   ============================================================ */
const LEVELS = {};
const CHAPTERS = [
  { n: 1, tag: '01', title: 'THE CONVOY', where: 'Nevada desert' },
  { n: 2, tag: 'F·I', title: 'GLASS HARBOR', where: 'Flashback · Nevada · 17 years ago', fb: true },
  { n: 3, tag: '02', title: 'BLACKLINE', where: 'Underground facility' },
  { n: 4, tag: 'F·II', title: 'THE SAFEHOUSE', where: 'Flashback · San Marcos · 7 years ago', fb: true },
  { n: 5, tag: '03', title: 'BURN THE CITY', where: 'Coastal city · airport' },
  { n: 6, tag: '04', title: 'THE BETRAYAL', where: 'The sky over San Marcos' },
  { n: 7, tag: '05', title: 'THE ISLAND', where: 'Kestrel Island' },
  { n: 8, tag: 'F·III', title: 'THE LAST GOOD DAY', where: 'Flashback · Kestrel Island · 3 years ago', fb: true },
  { n: 9, tag: '06', title: 'THE LAST HOUR', where: 'Kestrel Island · the Cycle Chamber' },
  { n: 10, tag: '07', title: '11:59', where: 'Blackline headquarters' }
];
const LAST_CH = 10;
function chapterOf(n) { return CHAPTERS.find(c => c.n === n) || CHAPTERS[0]; }
/* saves from the 5-chapter version → 10-chapter numbering */
(function migrateSaves() {
  if (Store.get('ver', 1) >= 2) return;
  const map = { 1: 1, 2: 3, 3: 5, 4: 7, 5: 10 };
  const un = Store.get('unlocked', 1); Store.set('unlocked', map[un] || 1);
  const sv = Store.get('save', null);
  if (sv && sv.mission) {
    let m = map[sv.mission] || 1, cp = sv.cp || 0;
    if (sv.mission === 3 && cp >= 3) { m = 6; cp = 0; sv.fresh = true; }
    if (sv.mission === 4 && cp >= 2) { m = 9; cp = cp - 1; }
    sv.mission = m; sv.cp = cp; Store.set('save', sv);
  }
  Store.set('ver', 2);
})();
let armored = null, pickupCar = null;

const Mission = {
  def: null, step: -1, stepT: 0, cp: 0, data: {}, flags: {}, loudShots: true, ended: false,
  get steps() { return this.def.steps; },
  go(i) {
    this.step = i; this.stepT = 0; const s = this.steps[i]; if (!s) return;
    HUD.objective(s.text); $('obj-sub').textContent = '';
    if (s.enter) s.enter();
    if (s.cp !== undefined) { this.cp = s.cp; saveCheckpoint(); if (i > 0) HUD.feed('✓ CHECKPOINT', 'gold'); }
    if (i > 0 && !s.silent) HUD.notify('NEW OBJECTIVE', s.text, 'obj');
  },
  update(dt) {
    const s = this.steps[this.step]; if (!s) return; this.stepT += dt;
    if (s.update && s.update(dt)) { if (this.step + 1 < this.steps.length) this.go(this.step + 1); else if (!this.ended) { this.ended = true; missionComplete(); } }
  },
  marker() { const s = this.steps[this.step]; return s && s.marker ? s.marker() : null; },
  cur() { return this.steps[this.step] || {}; },
  onKill(e) { if (this.def.onKill) this.def.onKill(e); },
  onAlert(e) { if (!this.flags.firstAlert) { this.flags.firstAlert = true; HUD.feed('⚠ YOU HAVE BEEN SPOTTED', 'red'); } if (this.def.onSpotted) this.def.onSpotted(e); },
  onEnterVehicle(car) { if (this.def.onEnterVehicle) this.def.onEnterVehicle(car); },
  onBomb(p) { if (this.def.onBomb) this.def.onBomb(p); },
  onBriefcase(p) { if (this.def.onBriefcase) this.def.onBriefcase(p); },
  interact() { return this.def.interact ? this.def.interact() : null; }
};

function clearDynamic() {
  enemies.forEach(e => e.dispose()); enemies = [];
  cars.forEach(c => c.dispose()); cars = [];
  props.forEach(p => p.dispose()); props = [];
  pickups.forEach(p => p.dispose()); pickups = [];
  aircraft.forEach(a => a.dispose()); aircraft = [];
  projectiles.forEach(p => p.dispose()); projectiles = [];
  actors.forEach(a => { if (a.dispose) a.dispose(); a.dead = true; a.disposed = true; }); actors = []; targets = []; interactables.forEach(i => i.dead = true); interactables = [];
  civilians.forEach(c => c.dispose()); civilians = []; fighters = [];
  if (Flight.jet) { Flight.jet.dispose(); Flight.jet = null; }
  colliders = colliders.filter(c => !c.car && !c.prop && !c.dyn);
  timers.length = 0; fires.length = 0;
  FX.clear(); Tracers.clear(); Decals.clear(); Debris.clear(); Fixtures.alarm = 0;
  if (player.inVehicle) { player.inVehicle = null; AudioSys.engineStop(); }
  armored = null; pickupCar = null;
  if (LV.clear) LV.clear();
}
function addEnemy(type, x, z, o) { const e = new Enemy(type, x, z, o); enemies.push(e); return e; }

/* ambient / attacking jet flyover shared by several chapters */
function jetPass(targets, opt) {
  opt = opt || {};
  const zc = opt.z !== undefined ? opt.z : player.pos.z, side = opt.side || (Math.random() < 0.5 ? 1 : -1);
  const from = new V3(player.pos.x - 900 * side, opt.alt || 110, zc + rand(-120, 120)), to = new V3(player.pos.x + 900 * side, (opt.alt || 110) - 20, zc + rand(-60, 60));
  if (opt.fromV) { from.copy(opt.fromV); to.copy(opt.toV); }
  const a = new Aircraft(opt.kind || 'jet', from, to, opt.speed || 175, { targets, fireDist: opt.fireDist || 430, bomb: opt.bomb });
  aircraft.push(a); return a;
}
/* a bomber that carpet-bombs a line of points */
function bomberLine(from, to, pts, o) {
  o = o || {}; const q = pts.slice(); let dropT = 0;
  const b = new Aircraft('bomber', from, to, o.speed || 95, {
    bank: 0, bomb: (a, dt) => {
      if (!q.length) return; dropT -= dt; if (dropT > 0) return;
      const nx = q[0], ahead = _v1.copy(nx).sub(a.pos).dot(a.dir);
      if (ahead < (o.lead || 200)) { q.shift(); dropT = o.gap || 0.2; projectiles.push(new Projectile('bomb', a.pos.clone().setY(a.pos.y - 3), new V3(), { owner: 'air', target: new V3(nx.x, terrainH(nx.x, nx.z), nx.z), dur: o.fall || 2.2 })); }
    }
  });
  aircraft.push(b); return b;
}

/* ---------------- reset / checkpoints ---------------- */
function resetLevel(cp, sv) {
  clearDynamic();
  Mission.flags = {}; Mission.ended = false; Mission.data = sv && sv.data ? JSON.parse(JSON.stringify(sv.data)) : {};
  AudioSys.combatTarget = 0;
  introTimers.forEach(clearTimeout); introTimers = []; Cine.active = false; Cine.skippable = false; document.body.classList.remove('cine', 'cine-bars'); $('intro').classList.add('hidden'); timeScale = 1; slowUntil = 0;
  HUD.subsQ.length = 0; HUD.subT = 0; HUD.hintT = 0; $('hint').classList.remove('show'); HUD.bossRef = null; hideLore(); $('subs').classList.remove('show'); $('skip').classList.add('hidden'); $('title-card').classList.add('hidden');
  $('boss').classList.add('hidden'); $('jethud').classList.add('hidden'); $('timer').classList.add('hidden'); $('lore').classList.add('hidden');
  player.inJet = false; document.body.classList.remove('injet');
  player.alive = true; player.vel.set(0, 0, 0); player.pitch = 0; player.deadT = 0; player.jackT = 0; player.onGround = true; player.lastHurt = -99;
  player.keys = new Set(sv && sv.keys ? sv.keys : []);
  $('jackfx').classList.remove('on'); $('jack').classList.add('hidden');
  Countdown.stop(); HUD.bossRef = null; Cine.showVM = false;
  const r = LV.reset(cp, sv) || {};
  coverPoints = coverStatic.concat(genCover(props.filter(p => !p.dead && p.col.cover).map(p => p.col)).concat(genCover(targets.filter(t => t.col && t.col.cover).map(t => t.col))));
  const sp = r.spawn || [0, 0, 0];
  player.pos.set(sp[0], 0, sp[1]); player.pos.y = r.y !== undefined ? r.y : groundAt(sp[0], sp[1], 999); player.yaw = sp[2];
  if (sv && sv.inv) { inv = JSON.parse(JSON.stringify(sv.inv)); cur = sv.cur in inv ? sv.cur : Object.keys(inv)[0]; player.hp = Math.max(70, sv.hp || 100); player.armor = sv.armor || 0; player.nades = sv.nades ?? 2; if (sv.stats) Object.assign(stats, sv.stats); }
  else {
    inv = {};
    if (r.unarmed) { inv.fists = { mag: 0, res: 0 }; cur = 'fists'; }
    else { const lo = r.loadout || ['pistol']; for (const w of lo) giveWeapon(w, true); cur = r.cur || lo[lo.length - 1]; if (Store.get('golden', false)) giveWeapon('golden', true); }
    player.hp = 100; player.armor = r.armor || 0; player.nades = r.nades ?? 2;
    if (!r.unarmed && !LV.flashback) applyCarry();
  }
  if (!inv[cur]) cur = Object.keys(inv)[0];
  W.switchTo = null; W.sw = 0; W.reloading = false; W.adsT = 0; showVM(cur); HUD.slots();
  if (r.vehicle) enterVehicle(r.vehicle);
  Mission.go(LV.cpStep[cp]);
  if (LV.afterReset) LV.afterReset(cp, sv);
}
/* ---------- weapons carry over between chapters ---------- */
function storeCarry() {
  const c = {}; for (const k in inv) if (k !== 'fists' && WDEF[k]) c[k] = { mag: inv[k].mag, res: inv[k].res };
  Store.set('carry', { inv: c, nades: player.nades, cur: cur !== 'fists' ? cur : null });
}
function applyCarry() {
  const c = Store.get('carry', null); if (!c || !c.inv) return false;
  let got = false;
  for (const k in c.inv) { if (!WDEF[k] || k === 'fists') continue; got = true; if (!inv[k]) inv[k] = { mag: c.inv[k].mag, res: c.inv[k].res }; else { inv[k].mag = Math.max(inv[k].mag, c.inv[k].mag); inv[k].res = Math.max(inv[k].res, c.inv[k].res); } }
  if (got && inv.fists) delete inv.fists;
  player.nades = Math.max(player.nades, c.nades || 0);
  if (!inv[cur]) cur = c.cur && inv[c.cur] ? c.cur : Object.keys(inv)[0];
  HUD.slots(); return got;
}
function saveCheckpoint() {
  if (state === 'loading' || state === 'menu' || state === 'end' || state === 'begin') return;
  Store.set('save', { mission: LV.id, cp: Mission.cp, inv, cur, hp: player.hp, armor: player.armor, nades: player.nades, keys: [...player.keys], stats: Object.assign({}, stats), data: Mission.data, when: Date.now() });
  updateContinue();
}
function loadCheckpoint() {
  const sv = Store.get('save', null);
  if (!sv || (sv.mission || 1) !== LV.id || sv.fresh) { resetLevel(0, null); return; }
  resetLevel(sv.cp || 0, sv);
}
function unlockChapter(n) { Store.set('unlocked', Math.max(Store.get('unlocked', 1), n)); }
function goMission(n, mode) {
  const url = location.href.split('?')[0].split('#')[0];
  location.href = url + '?m=' + n + '&' + (mode || 'start') + '=1';
}
function achieve(id, title, sub) {
  const a = Store.get('achievements', {}); if (a[id]) return; a[id] = Date.now(); Store.set('achievements', a);
  const el = $('achieve'); el.innerHTML = `<div class="ac-i">★</div><div><div class="ac-l">ACHIEVEMENT UNLOCKED</div><div class="ac-t">${title}</div>${sub ? `<div class="ac-s">${sub}</div>` : ''}</div>`;
  el.className = 'show'; AudioSys.ui('achieve'); clearTimeout(achieve._t); achieve._t = setTimeout(() => el.className = '', 5200);
}
const ACHIEVEMENTS = [
  ['ch1', 'Tomorrow\'s Photograph', 'Finish Chapter 1'], ['fb1', 'Whatever It Takes', 'Finish Flashback I'], ['ch2', 'Asset Status: Active', 'Finish Chapter 2'], ['fb2', 'The First Time', 'Finish Flashback II'],
  ['ch3', 'Apparently I Remembered', 'Finish Chapter 3'], ['betray', 'Nothing Personal', 'Finish Chapter 4'], ['ch4', 'Seventeen Years', 'Finish Chapter 5'], ['fb3', 'Breadcrumbs', 'Finish Flashback III'],
  ['hour', 'Judge', 'Finish Chapter 6'], ['ch5', 'Player 2 Connected', 'Finish the game'], ['mercy', 'Mercy', 'Spare Silas Kade'], ['remind', 'Remind Me', 'Trust Maya at the very end'],
  ['lit', 'IT\'S LIT.', 'Find the secret of the fish tank'], ['ghost', 'Ghost', 'Finish Chapter 2 without triggering an alarm'], ['ace', 'Ace', 'Shoot down 8 interceptors in Chapter 4']
];
/* lore / terminal popups */
function showLore(title, html, dur) {
  const el = $('lore'); el.innerHTML = `<div class="lo-t">${title}</div><div class="lo-b">${html}</div><div class="lo-h">[E] close</div>`; el.classList.remove('hidden');
  AudioSys.ui('radio'); clearTimeout(showLore._t); showLore._t = setTimeout(() => el.classList.add('hidden'), (dur || 14) * 1000);
  showLore.open = true;
}
function hideLore() { $('lore').classList.add('hidden'); showLore.open = false; }
/* countdown timer HUD */
const Countdown = {
  t: 0, on: false, onEnd: null, label: '',
  start(sec, label, onEnd) { this.t = sec; this.on = true; this.onEnd = onEnd; this.label = label; $('timer').classList.remove('hidden'); },
  stop() { this.on = false; $('timer').classList.add('hidden'); },
  update(dt) {
    if (!this.on) return; this.t -= dt;
    const t = Math.max(0, this.t); $('timer').innerHTML = `<span>${this.label}</span>${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${String(Math.floor(t * 10 % 10))}`;
    $('timer').classList.toggle('crit', t < 15);
    if (this.t <= 0) { this.on = false; const f = this.onEnd; this.onEnd = null; if (f) f(); }
  }
};
