/* ============================================================
   FX: particles, tracers, decals, debris, dynamic lights, shake
   AUDIO: fully synthesized WebAudio (no asset files needed)
   ============================================================ */
const PV = `attribute float size; attribute vec4 pcolor; varying vec4 vC; uniform float scale;
void main(){ vC=pcolor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*scale/max(0.2,-mv.z); gl_Position=projectionMatrix*mv; }`;
const PF = `varying vec4 vC; void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c)*2.0; if(d>1.0) discard; float a=1.0-d; a=a*a*vC.a; gl_FragColor=linearToOutputTexel(vec4(vC.rgb,a)); }`;

class Particles {
  constructor(max, additive) {
    this.max = max; this.i = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.size = new Float32Array(max);
    this.p = []; for (let i = 0; i < max; i++) this.p.push({ age: 1, life: 1 });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('pcolor', new THREE.BufferAttribute(this.col, 4));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    this.mat = new THREE.ShaderMaterial({ uniforms: { scale: { value: 600 } }, vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.mesh = new THREE.Points(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = additive ? 3 : 2;
    this.g = g; scene.add(this.mesh);
  }
  emit(x, y, z, vx, vy, vz, life, s0, s1, c0, c1, a, drag, grav, mode) {
    const p = this.p[this.i]; this.i = (this.i + 1) % this.max;
    p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.age = 0; p.life = life; p.s0 = s0; p.s1 = s1;
    p.c0 = c0; p.c1 = c1 || c0; p.a = a; p.drag = drag || 0; p.grav = grav || 0; p.mode = mode || 0;
  }
  update(dt) {
    const P = this.pos, C = this.col, S = this.size;
    for (let i = 0; i < this.max; i++) {
      const p = this.p[i];
      if (p.age >= p.life) { S[i] = 0; continue; }
      p.age += dt;
      const t = Math.min(1, p.age / p.life);
      const k = Math.exp(-p.drag * dt);
      p.vx *= k; p.vy = p.vy * k - p.grav * dt; p.vz *= k;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      P[i * 3] = p.x; P[i * 3 + 1] = p.y; P[i * 3 + 2] = p.z;
      S[i] = p.s0 + (p.s1 - p.s0) * t;
      const al = p.mode === 1 ? Math.sin(Math.PI * Math.min(1, t * 1.15)) * p.a : (1 - t) * p.a;
      C[i * 4] = p.c0.r + (p.c1.r - p.c0.r) * t; C[i * 4 + 1] = p.c0.g + (p.c1.g - p.c0.g) * t; C[i * 4 + 2] = p.c0.b + (p.c1.b - p.c0.b) * t; C[i * 4 + 3] = Math.max(0, al);
    }
    this.g.attributes.position.needsUpdate = true; this.g.attributes.pcolor.needsUpdate = true; this.g.attributes.size.needsUpdate = true;
  }
  clear() { for (const p of this.p) p.age = p.life = 1; }
}

const COL = {};
function initColors() {
  const c = h => new THREE.Color(h);
  Object.assign(COL, {
    spark0: c(0xfff2c0), spark1: c(0xff6a10), fire0: c(0xfff4d0), fire1: c(0xff4a0a), fireD: c(0x6a1a04),
    smoke0: c(0x2a2522), smoke1: c(0x7a6e64), smokeL: c(0x9b8f82), dust0: c(0xc9a27a), dust1: c(0xd9bb93),
    blood: c(0x5a0808), blood1: c(0x300404), muzzle: c(0xffc070), trail: c(0xbab0a4), white: c(0xffffff), gold: c(0xffd060)
  });
  COL.fire0.multiplyScalar(2.4); COL.fire1.multiplyScalar(1.7); COL.spark0.multiplyScalar(3.2); COL.spark1.multiplyScalar(2.2);
}

const FX = {
  add: null, norm: null, q: 1,
  init() { this.q = FXQ[settings.effects] || 1; this.add = new Particles(2600, true); this.norm = new Particles(2200, false); },
  n(k) { return Math.max(1, Math.round(k * this.q)); },
  update(dt) { this.add.update(dt); this.norm.update(dt); },
  clear() { this.add.clear(); this.norm.clear(); },
  sparks(p, n, dir, speed) {
    speed = speed || 7;
    for (let i = 0; i < this.n(n); i++) {
      const vx = (dir ? dir.x * speed * 0.6 : 0) + rand(-1, 1) * speed * 0.6, vy = (dir ? dir.y * speed * 0.6 : 0) + rand(0, 1) * speed * 0.7, vz = (dir ? dir.z * speed * 0.6 : 0) + rand(-1, 1) * speed * 0.6;
      this.add.emit(p.x, p.y, p.z, vx, vy, vz, rand(0.15, 0.45), 0.09, 0.02, COL.spark0, COL.spark1, 1, 1, 9);
    }
  },
  dust(p, n, big) {
    for (let i = 0; i < this.n(n); i++) this.norm.emit(p.x + rand(-.2, .2), p.y + rand(0, .2), p.z + rand(-.2, .2), rand(-1, 1), rand(0.5, 2.2), rand(-1, 1), rand(0.6, 1.3) * (big ? 2 : 1), big ? 1.2 : 0.35, big ? 4 : 1.4, COL.dust0, COL.dust1, 0.55, 1.5, -0.3, 1);
  },
  impact(p, kind, dir) {
    if (kind === 'terrain') { this.dust(p, 5); for (let i = 0; i < this.n(4); i++) this.norm.emit(p.x, p.y, p.z, rand(-2, 2), rand(2, 5), rand(-2, 2), 0.6, 0.12, 0.08, COL.dust0, COL.dust0, 0.9, 0.5, 14); }
    else if (kind === 'metal') { this.sparks(p, 8, dir ? _v5.copy(dir).negate() : null, 6); this.norm.emit(p.x, p.y, p.z, 0, 0.6, 0, 0.8, 0.3, 1.2, COL.smoke0, COL.smoke1, 0.35, 1, -0.2, 1); }
    else if (kind === 'blood') { for (let i = 0; i < this.n(7); i++) this.norm.emit(p.x, p.y, p.z, (dir ? dir.x * 2 : 0) + rand(-1.2, 1.2), rand(-0.5, 1.8), (dir ? dir.z * 2 : 0) + rand(-1.2, 1.2), rand(0.3, 0.6), 0.12, 0.3, COL.blood, COL.blood1, 0.85, 1, 8); }
    else { this.dust(p, 4); this.sparks(p, 3, null, 4); }
  },
  muzzleSmoke(p) { this.norm.emit(p.x, p.y, p.z, rand(-.3, .3), rand(.3, .8), rand(-.3, .3), 0.7, 0.15, 0.7, COL.smokeL, COL.smoke1, 0.18, 1.5, -0.2, 1); },
  explosion(p, r) {
    const s = r / 7;
    for (let i = 0; i < this.n(42); i++) {
      const a = rand(0, TAU), e = rand(-0.1, 1.2), sp = rand(2, 13) * s;
      this.add.emit(p.x, p.y + 0.3, p.z, Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp + 2, Math.sin(a) * Math.cos(e) * sp, rand(0.35, 0.9), rand(1.8, 3.6) * s, rand(3.5, 6) * s, COL.fire0, COL.fire1, 1, 3.2, -1.5);
    }
    for (let i = 0; i < this.n(30); i++) {
      const a = rand(0, TAU), sp = rand(1, 7) * s;
      this.norm.emit(p.x + rand(-1, 1) * s, p.y + rand(0, 2) * s, p.z + rand(-1, 1) * s, Math.cos(a) * sp, rand(2, 7) * s, Math.sin(a) * sp, rand(2.2, 4.5), rand(2, 3.5) * s, rand(7, 12) * s, COL.smoke0, COL.smoke1, 0.75, 1.1, -0.6, 1);
    }
    for (let i = 0; i < this.n(26); i++) {
      const a = rand(0, TAU), sp = rand(8, 26) * s;
      this.add.emit(p.x, p.y + 0.4, p.z, Math.cos(a) * sp * 0.6, rand(5, 20) * s, Math.sin(a) * sp * 0.6, rand(0.6, 1.4), 0.25, 0.05, COL.spark0, COL.spark1, 1, 0.6, 18);
    }
    this.dust(p, 14, true);
  },
  fire(p, size) {
    const s = size || 1;
    this.add.emit(p.x + rand(-.5, .5) * s, p.y + rand(0, .3), p.z + rand(-.5, .5) * s, rand(-.3, .3), rand(1.5, 3.5) * s, rand(-.3, .3), rand(0.5, 1.0), 1.2 * s, 0.3 * s, COL.fire0, COL.fire1, 0.9, 0.5, -0.5);
    if (Math.random() < 0.5) this.norm.emit(p.x + rand(-.4, .4) * s, p.y + 1.5 * s, p.z + rand(-.4, .4) * s, rand(-.4, .4), rand(2, 3.5) * s, rand(-.4, .4), rand(2.5, 4.5), 1 * s, 5 * s, COL.smoke0, COL.smoke1, 0.5, 0.6, -0.3, 1);
  },
  trail(p) { this.norm.emit(p.x, p.y, p.z, rand(-.3, .3), rand(-.1, .4), rand(-.3, .3), rand(1.2, 2), 0.35, 1.8, COL.trail, COL.smoke1, 0.45, 1, -0.2, 1); this.add.emit(p.x, p.y, p.z, 0, 0, 0, 0.08, 0.7, 0.2, COL.fire0, COL.fire1, 1, 0, 0); },
  vehicleDust(p, amt) { if (Math.random() < amt) this.norm.emit(p.x + rand(-.5, .5), p.y + 0.3, p.z + rand(-.5, .5), rand(-1, 1), rand(0.4, 1.4), rand(-1, 1), rand(1.2, 2.5), 0.8, 4.5, COL.dust0, COL.dust1, 0.4, 1, -0.2, 1); }
};

/* tracers: moving bright streaks rendered with one LineSegments */
const Tracers = {
  max: 80, list: [], mesh: null,
  init() {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.max * 6); this.col = new Float32Array(this.max * 6);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.mesh.frustumCulled = false; scene.add(this.mesh); this.g = g;
    for (let i = 0; i < this.max; i++) this.list.push({ on: false, a: new V3(), b: new V3(), t: 0, len: 1 });
    this.i = 0;
  },
  add(a, b, enemy) {
    const t = this.list[this.i]; this.i = (this.i + 1) % this.max;
    t.on = true; t.a.copy(a); t.b.copy(b); t.t = 0; t.len = a.distanceTo(b); t.enemy = !!enemy;
  },
  update(dt) {
    const P = this.pos, C = this.col;
    for (let i = 0; i < this.max; i++) {
      const t = this.list[i];
      if (!t.on) { P.fill(0, i * 6, i * 6 + 6); continue; }
      t.t += dt * 520;
      const h = Math.min(t.t, t.len), tail = Math.max(0, h - (t.enemy ? 8 : 11));
      if (tail >= t.len) { t.on = false; continue; }
      _v1.copy(t.b).sub(t.a).divideScalar(t.len || 1);
      P[i * 6] = t.a.x + _v1.x * tail; P[i * 6 + 1] = t.a.y + _v1.y * tail; P[i * 6 + 2] = t.a.z + _v1.z * tail;
      P[i * 6 + 3] = t.a.x + _v1.x * h; P[i * 6 + 4] = t.a.y + _v1.y * h; P[i * 6 + 5] = t.a.z + _v1.z * h;
      const r = t.enemy ? 0.9 : 1, g = t.enemy ? 0.3 : 0.72, b = t.enemy ? 0.08 : 0.32;
      C[i * 6] = r * 0.4; C[i * 6 + 1] = g * 0.4; C[i * 6 + 2] = b * 0.4; C[i * 6 + 3] = r * 3; C[i * 6 + 4] = g * 3; C[i * 6 + 5] = b * 3;
    }
    this.g.attributes.position.needsUpdate = true; this.g.attributes.color.needsUpdate = true;
  },
  clear() { for (const t of this.list) t.on = false; }
};

/* scorch decals */
const Decals = {
  list: [], i: 0,
  init() {
    const mat = new THREE.MeshBasicMaterial({ map: TEX.scorch, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), mat); m.visible = false; m.renderOrder = 1; scene.add(m); this.list.push(m); }
  },
  scorch(x, z, r) {
    const m = this.list[this.i]; this.i = (this.i + 1) % this.list.length;
    m.position.set(x, terrainH(x, z) + 0.12, z); m.scale.set(r, 1, r); m.rotation.y = rand(0, TAU); m.visible = true;
  },
  clear() { for (const m of this.list) m.visible = false; }
};

/* flying debris chunks */
const Debris = {
  list: [], i: 0,
  init() {
    const mats = [new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 1 }), new THREE.MeshStandardMaterial({ color: 0x3b3f44, roughness: 0.6, metalness: 0.5 })];
    for (let i = 0; i < 48; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mats[i % 3]); m.visible = false; m.castShadow = true; scene.add(m); this.list.push({ m, v: new V3(), w: new V3(), t: 0 }); }
  },
  burst(p, n, s) {
    for (let k = 0; k < Math.round(n * FX.q); k++) {
      const d = this.list[this.i]; this.i = (this.i + 1) % this.list.length;
      const sz = rand(0.12, 0.45) * s;
      d.m.scale.set(sz, sz * rand(0.4, 1), sz * rand(0.6, 1.4)); d.m.position.copy(p); d.m.position.y += 0.5; d.m.visible = true;
      const a = rand(0, TAU), sp = rand(4, 14);
      d.v.set(Math.cos(a) * sp, rand(6, 16), Math.sin(a) * sp); d.w.set(rand(-9, 9), rand(-9, 9), rand(-9, 9)); d.t = 0;
    }
  },
  update(dt) {
    for (const d of this.list) {
      if (!d.m.visible) continue;
      d.t += dt; d.v.y -= 22 * dt; d.m.position.addScaledVector(d.v, dt);
      d.m.rotation.x += d.w.x * dt; d.m.rotation.y += d.w.y * dt; d.m.rotation.z += d.w.z * dt;
      const h = terrainH(d.m.position.x, d.m.position.z);
      if (d.m.position.y < h) { d.m.position.y = h; d.v.y *= -0.3; d.v.x *= 0.5; d.v.z *= 0.5; d.w.multiplyScalar(0.5); }
      if (d.t > 6) { const s = Math.max(0, 1 - (d.t - 6)); d.m.scale.multiplyScalar(s > 0 ? 0.96 : 0); if (d.t > 7) d.m.visible = false; }
    }
  },
  clear() { for (const d of this.list) d.m.visible = false; }
};

/* pooled point lights (fixed count so shaders never recompile) */
const Lights = {
  pool: [], i: 0,
  init() {
    for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xff8a3a, 0, 60, 2); scene.add(l); this.pool.push({ l, t: 0, dur: 1, peak: 0 }); }
    this.muzzle = new THREE.PointLight(0xffb060, 0, 14, 2); scene.add(this.muzzle);
  },
  flash(p, intensity, dur, dist) {
    const s = this.pool[this.i]; this.i = (this.i + 1) % this.pool.length;
    s.l.position.copy(p); s.l.position.y += 1.5; s.peak = intensity; s.t = 0; s.dur = dur; s.l.distance = dist || 60;
  },
  update(dt) {
    for (const s of this.pool) { if (s.t < s.dur) { s.t += dt; s.l.intensity = s.peak * Math.pow(1 - Math.min(1, s.t / s.dur), 2); } else s.l.intensity = 0; }
    this.muzzle.intensity = Math.max(0, this.muzzle.intensity - dt * 60);
  }
};

/* screen shake (trauma model) */
const Shake = { trauma: 0, x: 0, y: 0, r: 0, t: 0 };
function addShake(a) { Shake.trauma = Math.min(1, Shake.trauma + a); if (a > 0.04) Pad.rumble(Math.min(1, a * 1.6), Math.min(1, a * 2.2), 90 + a * 400); }
function updateShake(dt) {
  Shake.t += dt; Shake.trauma = Math.max(0, Shake.trauma - dt * 0.9);
  const s = Shake.trauma * Shake.trauma, t = Shake.t * 30;
  Shake.x = s * 0.05 * (vnoise(t, 1) * 2 - 1); Shake.y = s * 0.05 * (vnoise(t, 7) * 2 - 1); Shake.r = s * 0.04 * (vnoise(t, 13) * 2 - 1);
}

/* ============================================================
   AUDIO
   ============================================================ */
const AudioSys = {
  ctx: null, combatLevel: 0, combatTarget: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); Voice.preload(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -12; this.comp.ratio.value = 5; this.comp.connect(c.destination);
    this.master = c.createGain(); this.master.connect(this.comp);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master);
    this.combat = c.createGain(); this.combat.gain.value = 0; this.combat.connect(this.mus);
    this.padBus = c.createGain(); this.padBus.gain.value = 0.9; this.padBus.connect(this.mus);
    const len = c.sampleRate * 2; this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.setVol(); this.startMusic();
  },
  setVol() { if (!this.ctx) return; this.master.gain.value = settings.vol; this.mus.gain.value = settings.music; },
  now() { return this.ctx.currentTime; },
  setP(p, pos) { if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z); },
  out(pos, ref) {
    if (!pos) return this.sfx;
    const p = this.ctx.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = ref || 5; p.rolloffFactor = 1.1; p.maxDistance = 4000;
    this.setP(p, pos); p.connect(this.sfx); return p;
  },
  nz(dest, t, dur, type, freq, q, gain, attack, rate) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = rate || 1;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + (attack || 0.002)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return f;
  },
  osc(dest, t, dur, type, f0, f1, gain, attack) {
    const c = this.ctx, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + (attack || 0.002)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  },
  shot(kind, pos) {
    if (!this.ctx) return;
    const S = { pistol: [.2, 2400, .8, 150], smg: [.14, 2800, .65, 170], ar: [.24, 1900, .95, 110], shotgun: [.45, 1300, 1.3, 70], sniper: [.8, 1500, 1.4, 60], rocket: [.9, 600, 1.1, 50], lmg: [.2, 1700, .9, 95], golden: [.3, 2600, 1, 180] }[kind] || [.2, 2000, .9, 110];
    const t = this.now(), d = this.out(pos, 6);
    this.nz(d, t, S[0], 'lowpass', S[1], 0.8, S[2]);
    this.nz(d, t, 0.045, 'highpass', 3500, 0.6, S[2] * 0.45);
    this.osc(d, t, 0.13, 'sine', S[3] * 2.2, S[3], S[2] * 0.9);
    this.nz(d, t + 0.03, S[0] * 3, 'lowpass', 420, 0.5, S[2] * 0.22, 0.03);
  },
  boom(pos, big) {
    if (!this.ctx) return; const t = this.now(), d = this.out(pos, big ? 30 : 16);
    this.nz(d, t, big ? 3.2 : 2.2, 'lowpass', big ? 520 : 800, 0.7, 2.6, 0.004);
    this.osc(d, t, big ? 1.6 : 1.0, 'sine', 95, 26, 2.2, 0.004);
    this.nz(d, t, 0.3, 'bandpass', 1900, 0.8, 1.0);
    this.nz(d, t + 0.25, 2.5, 'bandpass', 3000, 0.6, 0.12, 0.3);
  },
  ui(kind) {
    if (!this.ctx) return; const t = this.now(), d = this.sfx;
    switch (kind) {
      case 'click': this.osc(d, t, 0.05, 'square', 900, 900, 0.05); break;
      case 'empty': this.nz(d, t, 0.04, 'highpass', 2500, 1, 0.25); break;
      case 'hit': this.osc(d, t, 0.06, 'triangle', 1900, 1500, 0.18); break;
      case 'head': this.osc(d, t, 0.18, 'sine', 2600, 2400, 0.25); this.osc(d, t, 0.2, 'sine', 3900, 3800, 0.1); break;
      case 'kill': this.osc(d, t, 0.12, 'triangle', 700, 350, 0.25); break;
      case 'pickup': this.osc(d, t, 0.08, 'sine', 700, 700, 0.15); this.osc(d, t + 0.07, 0.12, 'sine', 1050, 1050, 0.15); break;
      case 'magout': this.nz(d, t, 0.06, 'bandpass', 1400, 3, 0.5); this.osc(d, t, 0.05, 'square', 300, 200, 0.05); break;
      case 'magin': this.nz(d, t, 0.05, 'bandpass', 2400, 4, 0.6); this.nz(d, t + 0.05, 0.05, 'bandpass', 1800, 4, 0.5); break;
      case 'rack': this.nz(d, t, 0.06, 'bandpass', 1100, 3, 0.6); this.nz(d, t + 0.11, 0.07, 'bandpass', 1700, 3, 0.7); break;
      case 'hurt': this.nz(d, t, 0.15, 'lowpass', 500, 1, 0.5); this.osc(d, t, 0.2, 'sine', 110, 60, 0.4); break;
      case 'radio': this.nz(d, t, 0.12, 'bandpass', 2200, 2, 0.12); this.osc(d, t + 0.1, 0.07, 'sine', 1300, 1300, 0.07); break;
      case 'notify': this.osc(d, t, 0.25, 'sine', 440, 440, 0.1); this.osc(d, t + 0.12, 0.35, 'sine', 660, 660, 0.1); break;
      case 'jack': this.osc(d, t, 1.4, 'sine', 160, 38, 0.8, 0.01); this.nz(d, t, 0.8, 'lowpass', 300, 1, 0.5); this.osc(d, t + 0.1, 0.9, 'sawtooth', 220, 880, 0.05, 0.3); break;
      case 'step': this.nz(d, t, 0.09, 'lowpass', 700, 0.7, 0.12, 0.004, 0.6); break;
      case 'land': this.nz(d, t, 0.18, 'lowpass', 400, 0.7, 0.4); break;
      case 'crash': this.nz(d, t, 0.5, 'lowpass', 1200, 0.6, 0.9); this.nz(d, t, 0.25, 'bandpass', 3000, 2, 0.4); break;
      case 'whiz': this.nz(d, t, 0.12, 'bandpass', 3500, 6, 0.25, 0.02); break;
      case 'door': this.osc(d, t, 0.6, 'sawtooth', 60, 40, 0.12, 0.05); break;
      case 'achieve': [523, 659, 784, 1046].forEach((f, i) => this.osc(d, t + i * 0.09, 0.4, 'triangle', f, f, 0.18)); break;
    }
  },
  loop(kind, pos) {
    if (!this.ctx) return null;
    const c = this.ctx, d = this.out(pos, kind === 'bomber' ? 90 : kind === 'fire' ? 4 : kind === 'heli' ? 30 : 60), g = c.createGain(); g.gain.value = 0; g.connect(d);
    const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter();
    if (kind === 'jet') { f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.4; }
    else if (kind === 'bomber') { f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 1; }
    else if (kind === 'heli') { f.type = 'lowpass'; f.frequency.value = 340; f.Q.value = 1.2; }
    else { f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 0.5; }
    s.connect(f);
    if (kind === 'heli') { const am = c.createGain(); am.gain.value = 0.5; const lfo = c.createOscillator(); lfo.frequency.value = 11; const lg = c.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain); lfo.start(); f.connect(am); am.connect(g); }
    else f.connect(g);
    s.start();
    const target = kind === 'jet' ? 1.3 : kind === 'bomber' ? 2.2 : kind === 'heli' ? 2.4 : 0.3;
    g.gain.linearRampToValueAtTime(target, c.currentTime + 0.4);
    const self = this;
    return {
      setPos(p) { self.setP(d, p); },
      stop() { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.4); s.stop(t + 0.5); }
    };
  },
  engine: null,
  engineStart() {
    if (!this.ctx || this.engine) return; const c = this.ctx;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 45;
    const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = 22.5;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; const g = c.createGain(); g.gain.value = 0.0;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfx); o.start(); o2.start();
    g.gain.linearRampToValueAtTime(0.13, c.currentTime + 0.4);
    this.engine = { o, o2, f, g };
  },
  engineSet(speed, thr) {
    if (!this.engine) return; const e = this.engine, t = this.ctx.currentTime;
    const gear = Math.abs(speed) % 11 / 11; const f = 42 + Math.abs(speed) * 2.2 + gear * 40 + thr * 15;
    e.o.frequency.setTargetAtTime(f, t, 0.05); e.o2.frequency.setTargetAtTime(f / 2, t, 0.05); e.f.frequency.setTargetAtTime(300 + thr * 500 + Math.abs(speed) * 8, t, 0.05);
  },
  engineStop() { if (!this.engine) return; const e = this.engine, t = this.ctx.currentTime; e.g.gain.linearRampToValueAtTime(0, t + 0.3); e.o.stop(t + 0.4); e.o2.stop(t + 0.4); this.engine = null; },
  listener(cam) {
    if (!this.ctx) return; const L = this.ctx.listener;
    cam.getWorldDirection(_v1); const p = cam.position;
    if (L.positionX) { L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z; L.forwardX.value = _v1.x; L.forwardY.value = _v1.y; L.forwardZ.value = _v1.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(p.x, p.y, p.z); L.setOrientation(_v1.x, _v1.y, _v1.z, 0, 1, 0); }
  },
  /* procedural score: dusty pad + combat percussion layer */
  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  startMusic() {
    this.chords = [[50, 57, 62, 65], [46, 53, 58, 62], [53, 60, 65, 69], [48, 55, 60, 64]];
    this.ci = 0; this.nextChord = this.now() + 0.2; this.step = 0; this.nextStep = this.now() + 0.3;
  },
  musicTick(dt) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.combatLevel += (this.combatTarget - this.combatLevel) * Math.min(1, dt * 0.8);
    this.combat.gain.setTargetAtTime(this.combatLevel * 0.9, t, 0.2);
    if (t > this.nextChord - 0.05) {
      const ch = this.chords[this.ci], T = this.nextChord;
      for (let i = 0; i < ch.length; i++) {
        const o = this.ctx.createOscillator(); o.type = i === 0 ? 'triangle' : 'sawtooth'; o.frequency.value = this.midi(ch[i] - (i === 0 ? 12 : 0)); o.detune.value = rand(-9, 9);
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 650; const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, T); g.gain.linearRampToValueAtTime(i === 0 ? 0.07 : 0.028, T + 2.2); g.gain.setValueAtTime(i === 0 ? 0.07 : 0.028, T + 6.5); g.gain.linearRampToValueAtTime(0.0001, T + 9);
        o.connect(f); f.connect(g); g.connect(this.padBus); o.start(T); o.stop(T + 9.1);
      }
      this.nextChord += 8; this.ci = (this.ci + 1) % this.chords.length;
    }
    while (this.nextStep < t + 0.12) {
      const st = this.step % 16, T = this.nextStep, d = this.combat;
      if (this.combatLevel > 0.04) {
        if (st === 0 || st === 7 || st === 10) this.osc(d, T, 0.28, 'sine', 130, 38, 0.9);
        if (st === 4 || st === 12) { this.nz(d, T, 0.16, 'bandpass', 1700, 0.8, 0.35); this.osc(d, T, 0.08, 'triangle', 190, 150, 0.2); }
        if (st % 2 === 0) this.nz(d, T, 0.035, 'highpass', 7000, 0.7, st % 4 === 2 ? 0.13 : 0.07);
        if (st === 0 || st === 3 || st === 8 || st === 11 || st === 14) { const root = this.chords[(this.ci + 3) % 4][0] - 12; this.osc(d, T, 0.2, 'sawtooth', this.midi(root), this.midi(root) * 0.98, 0.12); }
      }
      this.nextStep += 0.125; this.step++;
    }
  }
};
