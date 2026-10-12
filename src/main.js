/* ============================================================
   MAIN: input, game state, menus, intro, ending, main loop
   ============================================================ */
let state = 'loading', timeScale = 1, slowUntil = 0, realTime = 0, locked = false;
const keys = {}; let mouseDX = 0, mouseDY = 0, firePressed = false; const mouseDown = [false, false, false];

function updatePointScale() {
  const s = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  if (FX.add) { FX.add.mat.uniforms.scale.value = s; FX.norm.mat.uniforms.scale.value = s; }
}
function applySettings() {
  const q = QUAL[settings.quality] || QUAL.high;
  renderer.setPixelRatio(q.pr); renderer.setSize(innerWidth, innerHeight);
  if (sun) {
    sun.castShadow = settings.shadows;
    if (sun.shadow.mapSize.x !== q.shadow) { sun.shadow.mapSize.set(q.shadow, q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    scene.traverse(o => { if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true; });
  }
  FX.q = FXQ[settings.effects] || 1;
  Post.on = settings.post && settings.quality !== 'low' && renderer.capabilities.isWebGL2; if (LV) Post.setGrade(LV.env);
  baseFov = settings.fov; camera.fov = baseFov; camera.updateProjectionMatrix(); updatePointScale(); AudioSys.setVol();
}
addEventListener('resize', () => {
  camera.aspect = vmCam.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); vmCam.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); updatePointScale();
});

/* ---------------- input ---------------- */
addEventListener('keydown', e => {
  if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) { keys[e.code] = true; return; }
  keys[e.code] = true;
  if ((state === 'intro' || Cine.skippable) && (e.code === 'Space' || e.code === 'Enter')) { skipIntro(); return; }
  if (state === 'dead' && e.code === 'KeyR') { restartCheckpoint(); return; }
  if (state !== 'play') return;
  if (e.code === 'KeyP') { pause(); return; }
  if (!player.alive || Cine.active) return;
  if (showLore.open && (e.code === 'KeyE' || e.code === 'Escape')) { hideLore(); return; }
  if (player.inJet) return;
  const n = parseInt(e.key); if (n >= 1 && n <= 7 && inv[SLOTS[n - 1]]) switchWeapon(SLOTS[n - 1]);
  if (e.code === 'KeyE' && interactTarget) interactTarget.act();
  if (e.code === 'KeyG') throwGrenade();
  if (e.code === 'KeyT') cycleOptic();
  if (e.code === 'KeyF' && !player.inVehicle) meleeQuick();
  if (e.code === 'KeyV' && player.inVehicle) vcam.mode = 1 - vcam.mode;
  if (e.code === 'KeyQ') cycleWeapon(-1);
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseDown.fill(false); });
addEventListener('mousemove', e => { if (locked) { mouseDX += e.movementX; mouseDY += e.movementY; } });
renderer.domElement.addEventListener('mousedown', e => {
  if (!locked) { if (state === 'play') requestLock(); return; }
  mouseDown[e.button] = true; if (e.button === 0) firePressed = true;
});
addEventListener('mouseup', e => { mouseDown[e.button] = false; });
addEventListener('wheel', e => { if (state === 'play' && locked && !player.inVehicle && !player.inJet) { if (!zoomStep(-Math.sign(e.deltaY))) cycleWeapon(Math.sign(e.deltaY)); } }, { passive: true });
addEventListener('contextmenu', e => e.preventDefault());
function requestLock() {
  try { const p = renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(() => lockFailed()); } catch (err) { lockFailed(); }
}
function lockFailed() { if (state === 'pause') { $('pause-msg').textContent = 'Browser needs a moment — click Resume again.'; } }
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
  if (locked) { $('pause-msg').textContent = ''; if (state === 'pause') { state = 'play'; showScreen(null); } }
  else { mouseDown.fill(false); if (state === 'play' && !Pad.active) pause(); }
});
document.addEventListener('pointerlockerror', lockFailed);

/* ---------------- screens ---------------- */
let settingsReturn = 'menu';
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
}
function updateContinue() { const sv = Store.get('save', null); $('btn-continue').disabled = !sv; $('btn-continue').textContent = sv ? 'CONTINUE — ' + chapterOf(sv.mission || 1).title : 'CONTINUE'; }
function toMenu() {
  state = 'menu'; if (document.pointerLockElement) document.exitPointerLock();
  $('hud').classList.add('hidden'); showScreen('menu'); updateContinue();
  AudioSys.combatTarget = 0; AudioSys.engineStop(); document.body.classList.remove('cine');
  Cine.active = false; timeScale = 1;
}
function pause() {
  if (state !== 'play') return;
  state = 'pause'; showScreen('pause'); $('pause-mission').textContent = LV.name + '  ·  ' + $('obj-text').textContent;
  if (AudioSys.ctx) AudioSys.combatTarget = 0;
}
function resume() { AudioSys.init(); if (Pad.active) { state = 'play'; showScreen(null); } requestLock(); }
function beginPlay() {
  state = 'play'; showScreen(null); $('hud').classList.remove('hidden');
  if (!locked) requestLock();
}
function newGame() { Store.del('carry'); startChapter(1); }
function startChapter(n) {
  if (n !== LV.id) { goMission(n, 'start'); return; }
  AudioSys.init();
  Object.assign(stats, { kills: 0, heads: 0, shots: 0, hits: 0, deaths: 0 });
  stats.start = gameTime;
  Store.set('save', { mission: n, cp: 0, fresh: true });
  resetLevel(0, null);
  requestLock();
  playIntro();
}
function continueGame() {
  AudioSys.init();
  const sv = Store.get('save', null);
  if (sv && (sv.mission || 1) !== LV.id) { goMission(sv.mission, 'cont'); return; }
  if (sv && sv.fresh) { startChapter(LV.id); return; }
  loadCheckpoint(); requestLock(); beginPlay();
}
function restartCheckpoint() {
  AudioSys.init();
  loadCheckpoint(); beginPlay();
}
function showDeath() {
  state = 'dead'; if (document.pointerLockElement) document.exitPointerLock();
  $('death-tip').textContent = showDeath.msg || pick((LV.tips || []).concat(['Health regenerates if you avoid damage for a few seconds.', 'Grenades (G) flush enemies out of cover.']));
  showDeath.msg = null;
  showScreen('death');
}

/* ---------------- intro ---------------- */
let introTimers = [];
function playIntro() {
  const I = LV.intro || { lines: [], dur: 0 };
  state = 'intro'; showScreen(null); $('hud').classList.remove('hidden');
  $('tc-ch').textContent = LV.chapter; $('tc-t').textContent = LV.title; $('tc-s').textContent = LV.sub;
  const intro = $('intro'); intro.classList.remove('hidden', 'out'); $('intro-text').innerHTML = '';
  $('skip').classList.remove('hidden');
  introTimers = I.lines.map(([t, txt, cls]) => setTimeout(() => { $('intro-text').innerHTML = `<div class="il ${cls}">${txt}</div>`; }, t));
  introTimers.push(setTimeout(() => startFlyover(), I.dur || 500));
}
function skipIntro() {
  if (state === 'intro' && !Cine.active) { introTimers.forEach(clearTimeout); startFlyover(true); return; }
  if (Cine.active && Cine.skippable) { Cine.stop(); }
}
function startFlyover() {
  introTimers.forEach(clearTimeout);
  $('intro').classList.add('out'); setTimeout(() => $('intro').classList.add('hidden'), 1200);
  const eye = player.inVehicle ? player.inVehicle.pos.clone().add(new V3(0, 3, 9)) : new V3(player.pos.x, player.pos.y + 1.62, player.pos.z);
  const look = eye.clone().add(new V3(-Math.sin(player.yaw) * 10, 0, -Math.cos(player.yaw) * 10));
  const keysC = LV.intro && LV.intro.fly ? LV.intro.fly(eye, look) : [{ t: 0, pos: eye.clone().add(new V3(0, 8, 14)), look }, { t: 3, pos: eye.clone(), look }];
  Cine.skippable = true;
  state = 'intro';
  $('title-card').classList.remove('hidden'); $('title-card').classList.add('show');
  setTimeout(() => { $('title-card').classList.remove('show'); }, 6500);
  Cine.play(keysC, () => {
    Cine.skippable = false; $('skip').classList.add('hidden'); $('title-card').classList.add('hidden');
    state = 'play'; if (!locked && !Pad.active) pause();
    if (LV.afterIntro) LV.afterIntro();
  });
}

/* ---------------- ending ---------------- */
function missionComplete() {
  state = 'end'; AudioSys.combatTarget = 0; Countdown.stop();
  if (document.pointerLockElement) document.exitPointerLock();
  if (!LV.flashback) storeCarry();
  if (LV.id < LAST_CH) { unlockChapter(LV.id + 1); Store.set('save', { mission: LV.id + 1, cp: 0, fresh: true }); } else Store.del('save');
  $('fade').classList.add('on');
  setTimeout(() => { $('fade').classList.remove('on'); LV.complete(); }, 1600);
}
let endTimers = [];
function showEnding(o) {
  endTimers.forEach(clearTimeout); endTimers = [];
  $('hud').classList.add('hidden'); showScreen('ending');
  $('photo-wrap').classList.remove('show'); $('end-card').classList.remove('show');
  $('photo-wrap').style.display = o.photo ? '' : 'none';
  if (o.photo) { o.photo($('photo')); $('photo-cap').textContent = o.caption || ''; endTimers.push(setTimeout(() => $('photo-wrap').classList.add('show'), 200)); }
  $('end-lines').innerHTML = '';
  o.lines.forEach(([t, txt]) => endTimers.push(setTimeout(() => { const d = document.createElement('div'); d.className = 'el'; d.innerHTML = txt; $('end-lines').appendChild(d); const m = /<span class="(ev|my|si)">(?:EVAN|MAYA|SILAS)<\/span>\s*(.*)$/.exec(txt); if (m) Voice.say({ ev: 'EVAN', my: 'MAYA', si: 'SILAS' }[m[1]], m[2]); }, t)));
  endTimers.push(setTimeout(() => {
    const acc = stats.shots ? Math.round(stats.hits / stats.shots * 100) : 0, t = Math.round(gameTime - stats.start);
    $('end-ch').textContent = o.chapter; $('end-title').textContent = o.title; $('end-tease').textContent = o.tease || '';
    $('end-stats').innerHTML = `<div><b>${stats.kills}</b>kills</div><div><b>${stats.heads}</b>headshots</div><div><b>${acc}%</b>accuracy</div><div><b>${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</b>time</div><div><b>${stats.deaths}</b>deaths</div>`;
    $('btn-e-next').style.display = o.next ? '' : 'none'; $('btn-e-next').textContent = o.next ? 'CONTINUE — ' + chapterOf(o.next).title : '';
    $('btn-e-next').onclick = () => goMission(o.next, 'start');
    $('end-card').classList.add('show');
  }, o.cardAt || 9000));
}
function drawPhoto(cv) {
  const c = cv.getContext('2d'), w = cv.width, h = cv.height, r = mulberry(77);
  const g = c.createLinearGradient(0, 0, 0, h * 0.62); g.addColorStop(0, '#26304e'); g.addColorStop(0.55, '#c86a44'); g.addColorStop(1, '#f1b57e');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const sg = c.createRadialGradient(w * 0.74, h * 0.55, 2, w * 0.74, h * 0.55, w * 0.3); sg.addColorStop(0, 'rgba(255,240,200,1)'); sg.addColorStop(0.08, 'rgba(255,200,130,0.8)'); sg.addColorStop(1, 'rgba(255,150,80,0)'); c.fillStyle = sg; c.fillRect(0, 0, w, h);
  c.fillStyle = '#4a2c30'; c.beginPath(); c.moveTo(0, h * 0.6); for (let x = 0; x <= w; x += 12) c.lineTo(x, h * (0.52 + 0.06 * Math.sin(x * 0.02) + r() * 0.02)); c.lineTo(w, h * 0.62); c.lineTo(0, h * 0.62); c.fill();
  const gg = c.createLinearGradient(0, h * 0.6, 0, h); gg.addColorStop(0, '#7a5238'); gg.addColorStop(1, '#241710'); c.fillStyle = gg; c.fillRect(0, h * 0.6, w, h * 0.4);
  c.fillStyle = '#2c2624'; c.beginPath(); c.moveTo(w * 0.47, h * 0.6); c.lineTo(w * 0.53, h * 0.6); c.lineTo(w * 0.86, h); c.lineTo(w * 0.1, h); c.fill();
  c.fillStyle = '#c9a54a'; for (let i = 0; i < 6; i++) { const t = i / 6, t2 = t + 0.06, y1 = h * (0.6 + 0.4 * t * t), y2 = h * (0.6 + 0.4 * t2 * t2); c.fillRect(w * 0.498 - 2 * t, y1, 3 + 5 * t, y2 - y1); }
  // overturned truck
  c.save(); c.translate(w * 0.66, h * 0.72); c.rotate(-0.12); c.fillStyle = '#141313'; c.fillRect(-70, -34, 150, 50); c.fillRect(-100, -22, 40, 38); c.fillStyle = '#0a0a0a'; for (const x of [-80, -20, 50]) { c.beginPath(); c.arc(x, -40, 11, 0, TAU); c.fill(); } c.restore();
  const fg = c.createRadialGradient(w * 0.68, h * 0.66, 2, w * 0.68, h * 0.66, 60); fg.addColorStop(0, 'rgba(255,200,90,0.9)'); fg.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = fg; c.fillRect(w * 0.5, h * 0.5, w * 0.35, h * 0.3);
  for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(40,34,32,${0.08 + r() * 0.12})`; c.beginPath(); c.arc(w * 0.68 + (r() - 0.3) * 60 + i * 2, h * 0.62 - i * 9, 14 + i * 1.6, 0, TAU); c.fill(); }
  // figure from behind with the case
  c.fillStyle = '#0d0b0a'; const fx = w * 0.4, fy = h * 0.93;
  c.fillRect(fx - 11, fy - 58, 9, 58); c.fillRect(fx + 2, fy - 58, 9, 58); c.fillRect(fx - 16, fy - 118, 32, 64); c.beginPath(); c.arc(fx, fy - 130, 12, 0, TAU); c.fill();
  c.fillRect(fx + 15, fy - 112, 7, 50); c.fillRect(fx - 22, fy - 112, 7, 48); c.fillStyle = '#6f7378'; c.fillRect(fx + 10, fy - 64, 26, 20);
  // grain + vignette
  const id = c.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 30; d[i] += n; d[i + 1] += n; d[i + 2] += n; } c.putImageData(id, 0, 0);
  const vg = c.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
  const tm = new Date(Date.now() + 86400000);
  c.fillStyle = '#ff8a2a'; c.font = 'bold 22px "Courier New",monospace'; c.shadowColor = '#ff5a00'; c.shadowBlur = 6;
  c.fillText(`${String(tm.getMonth() + 1).padStart(2, '0')} ${String(tm.getDate()).padStart(2, '0')} '${String(tm.getFullYear()).slice(2)}  06:14`, w - 250, h - 22); c.shadowBlur = 0;
}

/* ---------------- menu background camera ---------------- */
let menuT = 0;
function menuCamera(dt) {
  menuT += dt * 0.035; const mc = LV.menuCam(menuT);
  camera.position.copy(mc.pos); camera.lookAt(mc.look);
  if (Math.abs(camera.fov - 60) > 0.1) { camera.fov = 60; camera.updateProjectionMatrix(); updatePointScale(); }
}

/* ---------------- settings UI ---------------- */
function buildSettingsUI() {
  const bind = (id, key, conv) => { const el = $(id); el.value = String(settings[key]); if (el.type === 'checkbox') el.checked = !!settings[key]; el.addEventListener('input', () => { settings[key] = el.type === 'checkbox' ? el.checked : conv ? conv(el.value) : el.value; saveSettings(); applySettings(); refreshLabels(); }); };
  bind('set-quality', 'quality'); bind('set-effects', 'effects'); bind('set-shadows', 'shadows'); bind('set-aa', 'aa');
  bind('set-sens', 'sens', parseFloat); bind('set-fov', 'fov', parseFloat); bind('set-vol', 'vol', parseFloat); bind('set-music', 'music', parseFloat); bind('set-invert', 'invertY'); bind('set-post', 'post'); bind('set-padsens', 'padSens', parseFloat); bind('set-assist', 'aimAssist'); bind('set-adstoggle', 'adsToggle'); bind('set-rumble', 'rumble'); bind('set-voices', 'voices'); bind('set-voicevol', 'voiceVol', parseFloat);
  const refreshLabels = () => { $('lbl-sens').textContent = (+settings.sens).toFixed(2); $('lbl-fov').textContent = settings.fov; $('lbl-vol').textContent = Math.round(settings.vol * 100) + '%'; $('lbl-music').textContent = Math.round(settings.music * 100) + '%'; $('lbl-padsens').textContent = (+settings.padSens).toFixed(2); $('lbl-voicevol').textContent = Math.round(settings.voiceVol * 100) + '%'; };
  refreshLabels();
  $('set-fullscreen').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); });
}

/* ---------------- main loop ---------------- */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; realTime += dt;
  if (state === 'play' && !player.alive && player.diedAt !== undefined && realTime - player.diedAt > 1.9) showDeath();
  Pad.poll(dt); padMenus(dt); if (state === 'play' || state === 'intro') padGameplay(dt);
  if (slowUntil && realTime > slowUntil) { timeScale = 1; slowUntil = 0; }
  const gdt = dt * timeScale;
  if (state === 'play' || state === 'intro' || state === 'dead') update(gdt);
  else if (state === 'menu') { menuCamera(dt); FX.update(dt); updateFires(dt); Lights.update(dt); Fixtures.update(dt); updateWater(dt); if (LV.tick) LV.tick(dt, true); }
  sunFollow(state === 'menu' ? LV.menuFocus : (player.inJet && Flight.jet ? Flight.jet.pos : player.pos));
  if (AudioSys.ctx) { AudioSys.listener(camera); AudioSys.musicTick(dt); }
  Post.dmg = player.alive && state !== 'menu' ? clamp((45 - player.hp) / 45, 0, 1) * 0.8 : 0;
  Post.render(state !== 'menu' && vmRoot.visible && !player.inVehicle && !player.inJet);
  mouseDX = mouseDY = 0; firePressed = false;
}
function update(dt) {
  gameTime += dt;
  AudioSys.combatTarget = 0;
  runTimers();
  const playing = state === 'play' && !Cine.active;
  if (playing) {
    if (player.inJet && Flight.jet) { interactTarget = null; }
    else { handleLook(dt); if (player.inVehicle) updatePlayerVehicle(dt); else updatePlayer(dt); updateWeapon(dt); findInteract(); }
  } else if (state === 'dead') { player.vel.y -= 22 * dt; }
  if (Flight.jet) Flight.jet.update(playing ? dt : dt);
  for (const c of cars) c.update(dt);
  for (const e of enemies) e.update(dt);
  enemies = enemies.filter(e => !e.gone);
  for (const a of aircraft) a.update(dt); aircraft = aircraft.filter(a => !a.dead);
  for (const p of projectiles) p.update(dt); projectiles = projectiles.filter(p => !p.dead);
  for (const p of pickups) if (!p.taken) p.update(dt); pickups = pickups.filter(p => !p.taken);
  for (const a of actors) a.update(dt);
  if (actors.some(a => a.gone)) { actors = actors.filter(a => !a.gone); targets = targets.filter(t => !t.gone); fighters = fighters.filter(f => !f.gone); }
  for (const c of civilians) c.update(dt); if (civilians.some(c => c.gone)) civilians = civilians.filter(c => !c.gone);
  updateFires(dt); FX.update(dt); Tracers.update(dt); Debris.update(dt); Lights.update(dt); Fixtures.update(dt); updateWater(dt);
  if (LV.tick) LV.tick(dt, false);
  Mission.update(dt); Countdown.update(dt);
  updateShake(dt);
  if (Cine.active) Cine.update(dt);
  else if (player.inJet && Flight.jet) Flight.jet.camera(dt);
  else if (player.inVehicle) vehicleCamera(dt);
  else fpsCamera(dt);
  updateViewmodel(dt);
  HUD.update(dt);
  if (!player.alive) AudioSys.combatTarget = 0;
}

/* ---------------- boot ---------------- */
const PARAMS = new URLSearchParams(location.search);
function pickLevel() {
  let m = parseInt(PARAMS.get('m'));
  if (!LEVELS[m]) { const sv = Store.get('save', null); m = sv && LEVELS[sv.mission] ? sv.mission : 1; }
  return LEVELS[m];
}
function boot() {
  LV = pickLevel(); Mission.def = LV;
  if (LV.flashback) { document.body.classList.add('flashback'); $('fbtag').textContent = 'FLASHBACK · ' + LV.flashback; }
  $('mission-name').textContent = LV.name;
  const steps = [
    ['Preparing materials', () => { initTextures(); initColors(); initMaterials(); initTextures2(); }],
    ['Building ' + LV.title.toLowerCase(), () => buildWorld()],
    ['Arming hostiles', () => { Post.init(); FX.init(); Tracers.init(); Decals.init(); Debris.init(); Lights.init(); initViewmodels(); HUD.init(); buildSettingsUI(); buildChapterUI(); }],
    ['Fueling the jets', () => { resetLevel(0, null); applySettings(); }]
  ];
  let i = 0;
  const next = () => {
    if (i >= steps.length) {
      $('loading').classList.add('hidden'); requestAnimationFrame(frame);
      if (PARAMS.get('start') || PARAMS.get('cont')) { state = 'begin'; showBegin(PARAMS.get('cont') ? 'cont' : 'start'); }
      else { state = 'menu'; showScreen('menu'); updateContinue(); }
      return;
    }
    $('load-msg').textContent = steps[i][0] + '…'; $('load-fill').style.width = ((i + 1) / steps.length * 100) + '%';
    setTimeout(() => { try { steps[i][1](); } catch (err) { console.error(err); $('load-msg').textContent = 'Error: ' + err.message; throw err; } i++; next(); }, 30);
  };
  next();
}
function showBegin(mode) {
  showScreen('begin'); $('bg-ch').textContent = LV.chapter; $('bg-t').textContent = LV.title; $('bg-s').textContent = LV.sub;
  $('begin').onclick = () => { AudioSys.init(); if (history.replaceState) history.replaceState(null, '', location.href.split('?')[0] + '?m=' + LV.id); if (mode === 'cont') continueGame(); else startChapter(LV.id); };
}
function buildChapterUI() {
  const un = Store.get('unlocked', 1), ach = Store.get('achievements', {});
  $('chapter-list').innerHTML = CHAPTERS.map(c => `<button class="chap${c.fb ? ' fb' : ''}" data-n="${c.n}" ${c.n > un ? 'disabled' : ''}><span class="cn">${c.tag}</span><span class="ct">${c.title}<small>${c.n > un ? 'LOCKED' : c.where}</small></span></button>`).join('');
  for (const b of document.querySelectorAll('.chap')) b.onclick = () => { AudioSys.init(); startChapter(+b.dataset.n); };
  $('ach-list').innerHTML = ACHIEVEMENTS.map(([id, t, d]) => `<div class="ach ${ach[id] ? 'on' : ''}"><b>${ach[id] ? '★' : '☆'}</b><span>${t}<small>${ach[id] ? d : '???'}</small></span></div>`).join('');
}
/* menu wiring */
$('btn-new').onclick = () => { AudioSys.init(); AudioSys.ui('click'); newGame(); };
$('btn-continue').onclick = () => { AudioSys.ui('click'); continueGame(); };
$('btn-chapters').onclick = () => { AudioSys.init(); buildChapterUI(); showScreen('chapters'); };
$('btn-chap-back').onclick = () => showScreen('menu');
$('btn-settings').onclick = () => { AudioSys.init(); settingsReturn = 'menu'; showScreen('settings'); };
$('btn-controls').onclick = () => { AudioSys.init(); settingsReturn = 'menu'; showScreen('controls'); };
$('btn-quit').onclick = () => { showScreen('quit'); try { window.close(); } catch (e) { } };
$('btn-quit-back').onclick = () => showScreen('menu');
$('btn-resume').onclick = () => resume();
$('btn-restart').onclick = () => restartCheckpoint();
$('btn-p-settings').onclick = () => { settingsReturn = 'pause'; showScreen('settings'); };
$('btn-p-controls').onclick = () => { settingsReturn = 'pause'; showScreen('controls'); };
$('btn-p-menu').onclick = () => toMenu();
for (const b of document.querySelectorAll('.btn-back')) b.onclick = () => showScreen(settingsReturn);
$('btn-d-restart').onclick = () => restartCheckpoint();
$('btn-d-menu').onclick = () => toMenu();
$('btn-e-replay').onclick = () => { endTimers.forEach(clearTimeout); startChapter(LV.id); };
$('btn-e-menu').onclick = () => { endTimers.forEach(clearTimeout); resetLevel(0, null); toMenu(); };
for (const b of document.querySelectorAll('button')) b.addEventListener('mouseenter', () => AudioSys.ctx && AudioSys.ui('click'));
window.__BL = {
  get state() { return state; }, player, enemies: () => enemies, cars: () => cars, aircraft: () => aircraft, actors: () => actors, targets: () => targets, fighters: () => fighters, civilians: () => civilians, Mission, inv: () => inv, LV: () => LV, Flight, Countdown,
  play() { state = 'play'; Cine.active = false; document.body.classList.remove('cine'); showScreen(null); $('hud').classList.remove('hidden'); $('intro').classList.add('hidden'); },
  cp(n, sv) { AudioSys.init(); resetLevel(n, sv || null); this.play(); },
  fire() { firePressed = true; mouseDown[0] = true; setTimeout(() => mouseDown[0] = false, 50); },
  enter() { findInteract(); const t = interactTarget; if (t) t.act(); return t && t.label; },
  look(yaw, pitch) { player.yaw = yaw; player.pitch = pitch || 0; },
  keys, mouseDown, give: giveWeapon, stats, castRay, colliders: () => colliders, terrainH, camera, tp(x, z, y) { player.pos.set(x, y !== undefined ? y : groundAt(x, z, 999), z); player.vel.set(0, 0, 0); }, get gameTime() { return gameTime; },
  sim(sec) { const n = Math.round(sec * 30); for (let i = 0; i < n; i++) { realTime += 1 / 30; if (slowUntil && realTime > slowUntil) { timeScale = 1; slowUntil = 0; } Pad.poll(1 / 30); padMenus(1 / 30); if (state === 'play' || state === 'intro') padGameplay(1 / 30); if (state === 'play' || state === 'dead') update(1 / 30 * timeScale); mouseDX = mouseDY = 0; firePressed = false; if (state === 'play' && !player.alive && realTime - player.diedAt > 1.9) showDeath(); } return state; },
  Voice, detonate, addEnemy, audio: () => AudioSys, vm: () => VM, opt: () => W_OPT, goStep(i) { Mission.go(i); }, save() { const st = state; state = 'play'; saveCheckpoint(); state = st; }, die() { hurtPlayer(99999); }, restart() { restartCheckpoint(); }, showDeath() { showDeath(); }, go: goMission, mouse(dx, dy) { mouseDX = dx; mouseDY = dy; }
};
boot();
