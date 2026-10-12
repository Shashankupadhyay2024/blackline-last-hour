/* ============================================================
   HUD, subtitles, radar, objective marker, cinematics camera
   ============================================================ */
const HUD = {
  last: {}, feedEls: [], subsQ: [], subT: 0, hintT: 0, alertEls: [], dirEls: [],
  init() {
    this.radar = $('radar').getContext('2d');
    for (let i = 0; i < 16; i++) { const d = document.createElement('div'); d.className = 'alert-ic'; $('alerts').appendChild(d); this.alertEls.push(d); }
  },
  set(id, v) { if (this.last[id] !== v) { this.last[id] = v; $(id).textContent = v; } },
  objective(t) { $('obj-text').textContent = t; $('objective').classList.remove('flash'); void $('objective').offsetWidth; $('objective').classList.add('flash'); },
  notify(title, sub, cls) {
    const n = $('notify'); n.innerHTML = `<div class="n-t">${title}</div>${sub ? `<div class="n-s">${sub}</div>` : ''}`;
    n.className = 'show ' + (cls || ''); clearTimeout(this._nt); this._nt = setTimeout(() => n.className = '', 3200); AudioSys.ui('notify');
  },
  feed(t, cls) {
    const d = document.createElement('div'); d.className = 'feed ' + (cls || ''); d.textContent = t; $('killfeed').prepend(d);
    setTimeout(() => d.classList.add('out'), 2200); setTimeout(() => d.remove(), 2800);
    while ($('killfeed').children.length > 5) $('killfeed').lastChild.remove();
  },
  hint(t, dur) { $('hint').textContent = t; $('hint').classList.add('show'); this.hintT = dur || 4; },
  hit(head, kill) {
    const h = $('hitmarker'); h.className = 'show' + (head ? ' head' : '') + (kill ? ' kill' : '');
    clearTimeout(this._ht); this._ht = setTimeout(() => h.className = '', kill ? 260 : 120);
    AudioSys.ui(head ? 'head' : 'hit');
  },
  kill(head) { this.feed(head ? '✦ HEADSHOT' : '✕ ENEMY DOWN', head ? 'gold' : ''); AudioSys.ui('kill'); },
  damage(d, from) {
    const v = $('dmgvig'); v.style.opacity = clamp(0.35 + d / 40, 0, 0.9); clearTimeout(this._dv); this._dv = setTimeout(() => v.style.opacity = 0, 180);
    if (from) {
      const a = Math.atan2(from.x - player.pos.x, from.z - player.pos.z) - Math.atan2(-Math.sin(player.inVehicle ? player.inVehicle.yaw + vcam.yaw : player.yaw), -Math.cos(player.inVehicle ? player.inVehicle.yaw + vcam.yaw : player.yaw));
      const el = document.createElement('div'); el.className = 'dmgdir'; el.style.transform = `translate(-50%,-50%) rotate(${-a}rad) translateY(-120px)`;
      $('dmgdirs').appendChild(el); setTimeout(() => el.remove(), 900);
    }
  },
  vehicleHit() { const v = $('veh'); v.classList.remove('hitf'); void v.offsetWidth; v.classList.add('hitf'); },
  say(lines) { for (const l of lines) this.subsQ.push(l); },
  slots() {
    $('w-slots').innerHTML = SLOTS.map((s, i) => s === 'golden' && !inv.golden ? '' : `<span class="${inv[s] ? (s === (W.switchTo || cur) ? 'on' : 'own') : ''}${s === 'golden' ? ' gold' : ''}">${i + 1}</span>`).join('');
  },
  update(dt) {
    // vitals
    $('hp-fill').style.width = clamp(player.hp, 0, 100) + '%'; $('ar-fill').style.width = clamp(player.armor, 0, 100) + '%';
    this.set('hp-num', Math.ceil(Math.max(0, player.hp))); this.set('ar-num', Math.ceil(player.armor));
    $('lowhp').style.opacity = player.alive && player.hp < 35 ? (0.35 + 0.25 * Math.sin(gameTime * 6)) * (1 - player.hp / 35) + 0.2 : 0;
    const w = WDEF[cur], st = inv[cur] || { mag: 0, res: 0 };
    this.set('w-name', player.inVehicle && player.inVehicle.kind === 'apc' ? 'APC AUTOCANNON' : w.name); this.set('w-mag', w.melee || (player.inVehicle && player.inVehicle.kind === 'apc') ? '∞' : st.mag); this.set('w-res', w.melee || (player.inVehicle && player.inVehicle.kind === 'apc') ? '' : '/ ' + st.res); this.set('nades', '◆ ' + player.nades);
    $('w-mag').classList.toggle('low', !w.melee && st.mag <= Math.ceil(w.mag * 0.25));
    const car = player.inVehicle;
    $('veh').classList.toggle('hidden', !car);
    if (car) { $('veh-fill').style.width = clamp(car.hp / car.hpMax * 100, 0, 100) + '%'; this.set('veh-spd', Math.round(Math.abs(car.speed) * 3.6) + ' km/h'); }
    // crosshair
    const spread = lerp(w.spread, w.ads, W.adsT) * (player.moving ? (player.sprint ? 2 : 1.4) : 1) * (1 + W.heat * 0.8);
    const gap = 4 + spread * 900 + W.heat * 6;
    const ch = $('crosshair'); ch.style.setProperty('--g', gap.toFixed(1) + 'px');
    ch.classList.toggle('hide', (W.adsT > 0.5 && !car) || !player.alive || Cine.active || player.sprint || !!player.inJet);
    ch.classList.toggle('veh', !!car);
    // jack
    if (player.jackT > 0) $('jack-fill').style.width = (player.jackT / 15 * 100) + '%';
    // prompt
    const pr = $('prompt');
    if (interactTarget && !Cine.active && !player.inVehicle) { pr.innerHTML = `<b>${Pad.active ? (/054c|playstation|dualsense|dualshock/i.test(Pad.id) ? '□' : 'X') : 'E'}</b> ${interactTarget.label}`; pr.classList.remove('hidden'); } else pr.classList.add('hidden');
    // hint
    if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) $('hint').classList.remove('show'); }
    // subtitles
    this.subT -= dt;
    if (this.subT <= 0) {
      if (this.subsQ.length) {
        const [who, text, dur] = this.subsQ.shift();
        $('subs').innerHTML = who ? `<span class="who ${who.toLowerCase()}">${who}</span>${text}` : text; $('subs').classList.add('show');
        this.subT = dur || Math.max(2.6, text.length * 0.065); if (who && who !== 'EVAN' && Voice.radio(who, text)) AudioSys.ui('radio');
        if (who) { const tok = this.subTok = (this.subTok || 0) + 1; Voice.say(who, text).then(d => { if (d && tok === this.subTok) this.subT = Math.max(this.subT, d + 0.35); }); }
      } else { $('subs').classList.remove('show'); this.subT = 0.2; }
    }
    this.updateMarker(); this.updateAlerts(); this.drawRadar(); this.updateJet(); this.updateBoss();
  },
  updateJet() {
    const j = player.inJet && Flight.jet; $('jethud').classList.toggle('hidden', !j);
    document.body.classList.toggle('injet', !!j);
    if (!j) return;
    this.set('jh-spd', Math.round(j.speed * 3.6)); this.set('jh-alt', Math.round(j.pos.y)); this.set('jh-thr', Math.round(j.throttle * 100) + '%'); this.set('jh-msl', j.missiles); this.set('jh-hp', Math.max(0, Math.round(j.hp)) + '%');
    $('jh-lock').textContent = j.lockTarget ? (j.lockT >= 1 ? 'LOCKED — RMB FIRE' : 'LOCKING…') : '';
    // target boxes
    let n = 0; const els = this.boxEls || (this.boxEls = []);
    for (const f of fighters) {
      if (f.dead) continue; _v1.copy(f.pos).project(camera); if (_v1.z > 1 || Math.abs(_v1.x) > 1.05 || Math.abs(_v1.y) > 1.05) continue;
      let el = els[n]; if (!el) { el = document.createElement('div'); el.className = 'tbox'; $('jethud').appendChild(el); els.push(el); }
      el.style.display = 'block'; el.style.left = ((_v1.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - _v1.y) / 2 * innerHeight) + 'px';
      el.className = 'tbox' + (f === j.lockTarget ? (j.lockT >= 1 ? ' locked' : ' locking') : '');
      el.textContent = Math.round(f.pos.distanceTo(j.pos)) + 'm'; n++;
    }
    for (let i = n; i < els.length; i++) els[i].style.display = 'none';
    // pitch ladder / horizon
    const e = new THREE.Euler().setFromQuaternion(j.q, 'YXZ');
    $('jh-horizon').style.transform = `translate(-50%,-50%) rotate(${-e.z}rad) translateY(${e.x * 300}px)`;
  },
  bossRef: null,
  updateBoss() {
    const b = this.bossRef; if (!b) { return; }
    if (this._bn !== b) { this._bn = b; document.querySelector('#boss .bn').textContent = b.bossName || 'MAYA REYES'; }
    $('boss').classList.toggle('hidden', !b.alive || b.hideBar); if (!b.alive) return;
    $('boss-fill').style.width = clamp(b.hp / b.hpMax * 100, 0, 100) + '%'; $('boss').classList.toggle('shield', !!b.shielded);
  },
  updateMarker() {
    const mk = $('marker'), p = Mission.marker && Mission.marker();
    if (!p || Cine.active || !player.alive) { mk.classList.add('hidden'); return; }
    mk.classList.remove('hidden');
    _v1.copy(p).project(camera);
    let x = _v1.x, y = _v1.y; const behind = _v1.z > 1;
    if (behind) { x = -x; y = -y; }
    const off = behind || Math.abs(x) > 0.92 || Math.abs(y) > 0.86;
    if (off) { const m = Math.max(Math.abs(x) / 0.92, Math.abs(y) / 0.86); x /= m; y /= m; if (behind) y = -0.86; }
    mk.style.left = ((x + 1) / 2 * innerWidth) + 'px'; mk.style.top = ((1 - y) / 2 * innerHeight) + 'px';
    mk.classList.toggle('edge', off);
    this.set('mk-dist', Math.round(p.distanceTo(player.pos)) + 'm');
  },
  updateAlerts() {
    let n = 0;
    if (!Cine.active && player.alive) for (const e of enemies) {
      if (n >= this.alertEls.length) break;
      if (!e.alive) continue;
      const fresh = e.state === 'combat' && gameTime - e.combatStart < 1.6;
      const sus = e.state !== 'combat' && e.awareness > 0.04;
      if (!fresh && !sus) continue;
      if (e.pos.distanceTo(player.pos) > 120) continue;
      e.headSphere(_sph); _v1.copy(_sph.center); _v1.y += 0.55; _v1.project(camera);
      if (_v1.z > 1 || Math.abs(_v1.x) > 1 || Math.abs(_v1.y) > 1) continue;
      const el = this.alertEls[n++]; el.style.display = 'block';
      el.style.left = ((_v1.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - _v1.y) / 2 * innerHeight) + 'px';
      el.className = 'alert-ic ' + (fresh ? 'red' : 'yel'); el.textContent = fresh ? '!' : '?';
      el.style.setProperty('--f', fresh ? 1 : clamp(e.awareness, 0, 1));
    }
    for (let i = n; i < this.alertEls.length; i++) this.alertEls[i].style.display = 'none';
  },
  drawRadar() {
    const c = this.radar, S = 170, R = S / 2, sc = R / (player.inJet ? 1400 : 90);
    c.clearRect(0, 0, S, S);
    c.save(); c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.clip();
    c.fillStyle = 'rgba(12,14,18,0.55)'; c.fillRect(0, 0, S, S);
    let yaw = player.inVehicle ? player.inVehicle.yaw + vcam.yaw : player.yaw;
    let px = player.pos.x, pz = player.pos.z;
    const jet = player.inJet && Flight.jet; let sc2 = sc;
    if (jet) { const f = jet.fwd; yaw = Math.atan2(-f.x, -f.z); px = jet.pos.x; pz = jet.pos.z; }
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const tr = (x, z) => { const dx = x - px, dz = z - pz; return [R + (dx * cy - dz * sy) * sc, R - (-dx * sy - dz * cy) * sc]; };
    if (LV.radar) LV.radar(c, tr, px, pz);
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1; c.beginPath(); c.arc(R, R, R * 0.5, 0, TAU); c.stroke();
    for (const car of cars) { if (car.dead || car === player.inVehicle) continue; const [x, y] = tr(car.pos.x, car.pos.z); c.fillStyle = car.ai && car.ai.type === 'chase' ? '#ff5a4a' : '#6fb6ff'; c.fillRect(x - 3, y - 4, 6, 8); }
    for (const e of enemies) {
      if (!e.alive) continue; const d = e.pos.distanceTo(player.pos);
      const vis = e.state === 'combat' || gameTime - e.spotted < 3 || d < 18; if (!vis) continue;
      const [x, y] = tr(e.pos.x, e.pos.z); c.fillStyle = '#ff4a3a'; c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill();
    }
    for (const t of targets) { if (t.dead || !(t instanceof Heli || t instanceof Turret)) continue; const [x, y] = tr(t.pos.x, t.pos.z); c.fillStyle = '#ff4a3a'; c.fillRect(x - 3.5, y - 3.5, 7, 7); }
    for (const f of fighters) { if (f.dead) continue; const [x, y] = tr(f.pos.x, f.pos.z); c.strokeStyle = '#ff4a3a'; c.lineWidth = 2; c.strokeRect(x - 4, y - 4, 8, 8); }
    for (const a of aircraft) { const [x, y] = tr(a.pos.x, a.pos.z); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x - 4, y + 4); c.lineTo(x + 4, y + 4); c.fill(); }
    const m = Mission.marker && Mission.marker();
    if (m) { let [x, y] = tr(m.x, m.z); const dx = x - R, dy = y - R, dl = Math.hypot(dx, dy); if (dl > R - 10) { x = R + dx / dl * (R - 10); y = R + dy / dl * (R - 10); } c.fillStyle = '#ffc24a'; c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillRect(-4, -4, 8, 8); c.restore(); }
    c.restore();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(R, R - 7); c.lineTo(R - 5, R + 5); c.lineTo(R, R + 2); c.lineTo(R + 5, R + 5); c.fill();
    c.strokeStyle = 'rgba(255,200,120,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.stroke();
  }
};

/* ---------------- cinematic camera ---------------- */
const Cine = {
  active: false, keys: null, t: 0, onEnd: null,
  play(keys, onEnd) { this.active = true; this.keys = keys; this.t = 0; this.onEnd = onEnd; document.body.classList.add('cine'); },
  stop() { if (!this.active) return; this.active = false; document.body.classList.remove('cine'); const f = this.onEnd; this.onEnd = null; if (f) f(); },
  update(dt) {
    if (!this.active) return;
    this.t += dt; const K = this.keys, last = K[K.length - 1];
    if (this.t >= last.t) { this.apply(last.pos, last.look); this.stop(); return; }
    let i = 0; while (i < K.length - 2 && this.t > K[i + 1].t) i++;
    const a = K[i], b = K[i + 1], u = smooth(0, 1, (this.t - a.t) / (b.t - a.t));
    this.apply(_v1.lerpVectors(a.pos, b.pos, u), _v2.lerpVectors(a.look, b.look, u));
  },
  apply(p, l) { camera.position.copy(p); camera.position.x += Shake.x * 2; camera.position.y += Shake.y * 2; camera.lookAt(l); if (Math.abs(camera.fov - baseFov) > 0.05) { camera.fov = baseFov; camera.updateProjectionMatrix(); } }
};
