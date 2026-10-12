/* ============================================================
   WORLD: sky, lighting, terrain + shared level-building helpers.
   Each level (m1..m5.js) supplies an `env` block and a build().
   ============================================================ */
let SUN_DIR = new V3(-0.78, 0.26, 0.42).normalize();
let sun, hemi, ambLight, campLight, coverStatic = [], skyMesh = null;
const FOG_COL = 0xd99a6c;
const MESA1 = { x: 0, z: 5 }, MESA2 = { x: 0, z: -60 }, MESA3 = { x: 0, z: -395 };

function skyMaterial(env) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { time: { value: 0 }, clouds: { value: env.clouds ?? 0.6 }, cloudCol: { value: new THREE.Color(env.cloudCol || 0xffffff) }, sunDir: { value: SUN_DIR }, top: { value: new THREE.Color(env.sky[0]) }, mid: { value: new THREE.Color(env.sky[1]) }, bot: { value: new THREE.Color(env.sky[2]) }, sunCol: { value: new THREE.Color(env.sunGlow || 0xffb070) }, stars: { value: env.stars ? 1 : 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vW=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 sunDir,top,mid,bot,sunCol,cloudCol; uniform float stars,time,clouds; varying vec3 vW;
      float n2(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5), b=fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.5), c=fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.5), d=fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.5); return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
      float fb(vec2 p){ float t=0.,a=.5; for(int i=0;i<5;i++){ t+=n2(p)*a; p=p*2.03+vec2(1.7,9.2); a*=.5; } return t; }
      float hs(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){ vec3 d=normalize(vW); float h=d.y;
        vec3 c=mix(bot,mid,smoothstep(-0.02,0.14,h)); c=mix(c,top,smoothstep(0.12,0.65,h));
        float s=max(dot(d,sunDir),0.0);
        c+=sunCol*pow(s,6.0)*0.45 + sunCol*pow(s,64.0)*0.8 + vec3(1.0,0.95,0.85)*smoothstep(0.9994,0.9997,s)*5.0;
        float band=smoothstep(0.02,0.08,h)*(1.0-smoothstep(0.08,0.2,h)); c+=mid*0.22*band*(0.5+0.5*sin(d.x*14.0+d.z*9.0));
        if(clouds>0.001 && h>0.0){ vec2 uv=d.xz/(h+0.12)*1.3+vec2(time*0.006,time*0.002); float cd=smoothstep(0.48,0.78,fb(uv*1.6))*clouds*smoothstep(0.0,0.18,h);
          float lit=0.55+0.45*pow(max(dot(normalize(vec3(d.x,0.3,d.z)),sunDir),0.),3.); vec3 cc=mix(bot*0.9,cloudCol,lit)+sunCol*pow(s,8.)*0.6; c=mix(c,cc,cd*0.85); }
        if(stars>0.5){ vec3 q=floor(d*420.0); float st=step(0.9975,hs(q))*smoothstep(0.05,0.4,h); c+=vec3(st*0.9); }
        c=mix(c,bot*0.85,smoothstep(0.0,-0.25,h));
        gl_FragColor=linearToOutputTexel(vec4(c,1.0)); }`
  });
}
function buildSky(env) {
  if (env.sunDir) SUN_DIR.copy(env.sunDir).normalize();
  const mat = skyMaterial(env);
  if (!env.indoor) { skyMesh = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 16), mat); skyMesh.renderOrder = -10; skyMesh.frustumCulled = false; scene.add(skyMesh); }
  // image-based lighting from the sky (or a dim industrial box indoors)
  try {
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), env.indoor ? new THREE.MeshBasicMaterial({ color: env.envCol || 0x2a3038, side: THREE.BackSide }) : mat));
    const ground = new THREE.Mesh(new THREE.CircleGeometry(39, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: env.groundCol || 0x8a5a3a }));
    ground.position.y = -2; envScene.add(ground);
    if (env.indoor) for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(10, 2), new THREE.MeshBasicMaterial({ color: 0xd8e4ff, side: THREE.DoubleSide })); l.position.set(-25 + i * 10, 18, (i % 2) * 10 - 5); l.rotation.x = Math.PI / 2; envScene.add(l); }
    const pm = new THREE.PMREMGenerator(renderer);
    const envT = pm.fromScene(envScene, 0.04, 0.1, 100).texture;
    scene.environment = envT; vmScene.environment = envT; pm.dispose();
  } catch (e) { console.warn('env map unavailable', e); }
}
function buildLights(env) {
  scene.fog = new THREE.Fog(env.fog[0], env.fog[1], env.fog[2]);
  scene.background = new THREE.Color(env.bg !== undefined ? env.bg : env.fog[0]);
  renderer.toneMappingExposure = env.exposure || 1.08;
  hemi = new THREE.HemisphereLight(env.hemi[0], env.hemi[1], env.hemi[2]); scene.add(hemi);
  ambLight = new THREE.AmbientLight(env.amb[0], env.amb[1]); scene.add(ambLight);
  sun = new THREE.DirectionalLight(env.sunCol, env.sunI);
  sun.castShadow = settings.shadows && !env.noShadow;
  const q = QUAL[settings.quality] || QUAL.high;
  sun.shadow.mapSize.set(q.shadow, q.shadow);
  const ss = env.shadowSize || 75, sc = sun.shadow.camera; sc.left = -ss; sc.right = ss; sc.top = ss; sc.bottom = -ss; sc.near = 1; sc.far = 600;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  scene.add(sun); scene.add(sun.target);
  if (env.fixtures) Fixtures.init(env.fixtures);
  // viewmodel lighting
  vmScene.add(new THREE.HemisphereLight(env.vmHemi || 0xffd8b0, 0x4a3a30, env.vmI || 0.7));
  const vd = new THREE.DirectionalLight(env.vmSun || 0xffc690, env.vmSunI || 1.6); vd.position.set(-1, 0.8, 0.4); vmScene.add(vd);
  vmScene.add(new THREE.AmbientLight(0x404a60, 0.35));
}
function sunFollow(p) {
  sun.position.set(p.x + SUN_DIR.x * 300, p.y + SUN_DIR.y * 300, p.z + SUN_DIR.z * 300);
  sun.target.position.copy(p);
  if (skyMesh) { skyMesh.position.set(camera.position.x, 0, camera.position.z); skyMesh.material.uniforms.time.value = realTime; }
}

/* generic heightfield: opts {size, seg, cx, cz, color(x,z,h,c), mat} */
function buildTerrain(opts) {
  const SIZE = opts.size || 1100, SEG = opts.seg || 275;
  const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); g.rotateX(-Math.PI / 2); g.translate(opts.cx || 0, 0, opts.cz || 0);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = terrainH(x, z); p.setY(i, h);
    opts.color(x, z, h, c);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const mat = opts.mat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, map: TEX.grain });
  if (!mat.normalMap && TEX.detailN) { mat.normalMap = TEX.detailN; mat.normalScale = new THREE.Vector2(0.9, 0.9); }
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true; scene.add(mesh); return mesh;
}
const DESERT_COL = {};
function desertColor(x, z, h, c) {
  if (!DESERT_COL.sand) Object.assign(DESERT_COL, { sand: new THREE.Color(0xc48f5a), sand2: new THREE.Color(0xdcae7a), rock: new THREE.Color(0x8a5238), dirt: new THREE.Color(0x98714c), dark: new THREE.Color(0x7a5a40) });
  const D = DESERT_COL;
  c.copy(D.sand).lerp(D.sand2, fbm(x * 0.03, z * 0.03, 3));
  c.lerp(D.dark, fbm(x * 0.008 + 3, z * 0.008, 3) * 0.35);
  const s = Math.abs(terrainH(x + 2, z) - h) + Math.abs(terrainH(x, z + 2) - h);
  c.lerp(D.rock, clamp((s - 1.1) / 3, 0, 0.9));
  const rd = Math.abs(x - roadX(z)); c.lerp(D.dirt, (1 - smooth(6, 16, rd)) * 0.55);
}

function buildRoad() {
  const pos = [], uv = [], idx = [];
  const Z0 = -540, Z1 = 540, ST = 3; let n = 0;
  for (let z = Z0; z <= Z1; z += ST) {
    const rx = roadX(z), h = terrainH(rx, z) + 0.06;
    pos.push(rx - ROAD_W, h, z, rx + ROAD_W, h, z); uv.push(0, z / 10, 1, z / 10);
    if (n > 0) { const a = (n - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    n++;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const road = new THREE.Mesh(g, M.asphalt); road.receiveShadow = true; scene.add(road);
  // markings
  const lp = [], li = [], wp = [], wi = [];
  const quad = (arr, ia, x0, x1, za, zb) => { const b = arr.length / 3, ha = terrainH(roadX(za), za) + 0.08, hb = terrainH(roadX(zb), zb) + 0.08; const oa = roadX(za), ob = roadX(zb); arr.push(oa + x0, ha, za, oa + x1, ha, za, ob + x0, hb, zb, ob + x1, hb, zb); ia.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); };
  for (let z = Z0; z < Z1; z += 12) quad(lp, li, -0.1, 0.1, z, z + 5);
  for (let z = Z0; z < Z1; z += 3) { quad(wp, wi, -ROAD_W + 0.3, -ROAD_W + 0.45, z, z + 3); quad(wp, wi, ROAD_W - 0.45, ROAD_W - 0.3, z, z + 3); }
  const mk = (p, i, m) => { const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); gg.setIndex(i); gg.computeVertexNormals(); const me = new THREE.Mesh(gg, m); me.receiveShadow = true; scene.add(me); };
  mk(lp, li, M.line); mk(wp, wi, M.lineW);
  // telephone poles
  const poleG = new THREE.CylinderGeometry(0.13, 0.17, 9, 6), barG = B(2.2, 0.14, 0.14);
  const poles = [];
  for (let z = -520; z < 520; z += 46) poles.push(z);
  const pm = new THREE.InstancedMesh(poleG, M.pole, poles.length), bm = new THREE.InstancedMesh(barG, M.pole, poles.length), mtx = new THREE.Matrix4();
  poles.forEach((z, i) => {
    const x = roadX(z) + ROAD_W + 3.2, h = terrainH(x, z);
    mtx.makeTranslation(x, h + 4.5, z); pm.setMatrixAt(i, mtx);
    mtx.makeTranslation(x, h + 8.4, z); bm.setMatrixAt(i, mtx);
    addBoxCollider(new V3(x - 0.2, h, z - 0.2), new V3(x + 0.2, h + 9, z + 0.2));
  });
  pm.castShadow = bm.castShadow = true; scene.add(pm, bm);
  // road signs
  for (const z of [180, -150]) {
    const x = roadX(z) + ROAD_W + 1.8, h = terrainH(x, z), g2 = new THREE.Group();
    part(g2, B(0.12, 3.2, 0.12), M.metal, -1, 1.6, 0); part(g2, B(0.12, 3.2, 0.12), M.metal, 1, 1.6, 0);
    part(g2, B(2.6, 1.3, 0.06), M.sign, 0, 3.1, 0); g2.position.set(x, h, z); g2.rotation.y = z > 0 ? 0 : Math.PI; scene.add(g2);
  }
}

function rockGeo(seed) {
  const r = mulberry(seed), g = new THREE.DodecahedronGeometry(1, 1), p = g.attributes.position;
  const map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3);
    if (!map.has(k)) map.set(k, 0.78 + r() * 0.4);
    const s = map.get(k); p.setXYZ(i, p.getX(i) * s, p.getY(i) * s * 0.85, p.getZ(i) * s);
  }
  g.computeVertexNormals(); return g;
}
function addRock(x, z, sx, sy, sz, rot, seed, mat, cover) {
  const h = terrainH(x, z), m = new THREE.Mesh(rockGeo(seed), mat || M.rock);
  m.scale.set(sx, sy, sz); m.rotation.y = rot; m.position.set(x, h + sy * 0.35, z); m.castShadow = m.receiveShadow = true; scene.add(m);
  if (sx > 0.9) colliderFromObject(m, 0.28, { cover: cover !== false });
  return m;
}
function addMesa(x, z, w, hgt, d, seed) {
  const h = terrainH(x, z) - 3, m = new THREE.Mesh(B(w, hgt + 3, d), M.rockDark);
  m.position.set(x, h + (hgt + 3) / 2, z); m.castShadow = m.receiveShadow = true; scene.add(m);
  colliderFromObject(m, 0, { cover: true });
  const r = mulberry(seed);
  for (let i = 0; i < 6; i++) { const a = r() * TAU; addRock(x + Math.cos(a) * (w * 0.55), z + Math.sin(a) * (d * 0.55), 1.5 + r() * 2.5, 1.2 + r() * 2, 1.5 + r() * 2.5, r() * 3, seed + i, M.rockDark); }
  return h + hgt + 3;
}

function buildRocksAndScatter() {
  const r = mulberry(1337);
  let placed = 0, tries = 0;
  while (placed < 70 && tries < 800) {
    tries++;
    const x = (r() - 0.5) * 820, z = (r() - 0.5) * 900;
    if (Math.abs(x - roadX(z)) < 16) continue;
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < 38) continue;
    if (Math.hypot(x - 175, z - 150) < 10) continue;
    const s = 1.5 + r() * 5;
    addRock(x, z, s * (0.8 + r() * 0.6), s * (0.5 + r() * 0.5), s * (0.8 + r() * 0.6), r() * 6, 100 + placed);
    placed++;
  }
  // hand-placed cover near convoy & crash corridor
  const cov = [[14, 20, 2.2], [-12, -8, 2.6], [16, -22, 1.9], [-15, 36, 2.4], [22, 52, 2.2], [-20, -48, 2.3], [40, 95, 2.6], [58, 60, 2.4], [30, 20, 2], [-26, 12, 2.4],
  [14, -330, 2.4], [-14, -350, 2.6], [18, -372, 2.2], [-18, -410, 2.8], [22, -425, 2.4], [-9, -440, 2]];
  cov.forEach(([ox, z, s], i) => addRock(roadX(z) + ox, z, s * 1.2, s * 0.8, s, i * 1.7, 500 + i));
  // mesas (sniper perches)
  MESA1.x = roadX(MESA1.z) - 68; MESA1.top = addMesa(MESA1.x, MESA1.z, 9, 5.5, 8, 11);
  MESA2.x = roadX(MESA2.z) + 60; MESA2.top = addMesa(MESA2.x, MESA2.z, 8, 5, 9, 22);
  MESA3.x = roadX(MESA3.z) + 48; MESA3.top = addMesa(MESA3.x, MESA3.z, 9, 6, 8, 33);
  // instanced scatter: pebbles, scrub, desert trees
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), ps = new V3(), eu = new THREE.Euler();
  const pebble = new THREE.InstancedMesh(rockGeo(9), M.rock, 700);
  const scrubMat = new THREE.MeshStandardMaterial({ color: 0x6e6a3c, roughness: 1, flatShading: true });
  const scrub = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), scrubMat, 900);
  let pi = 0, si = 0;
  for (let i = 0; i < 2600 && (pi < 700 || si < 900); i++) {
    const x = (r() - 0.5) * 1000, z = (r() - 0.5) * 1000;
    if (Math.abs(x - roadX(z)) < 7) continue;
    const h = terrainH(x, z);
    if (r() < 0.45 && pi < 700) { const s = 0.15 + r() * 0.5; ps.set(x, h + s * 0.2, z); eu.set(0, r() * 6, 0); q.setFromEuler(eu); sc.set(s, s * 0.7, s); mtx.compose(ps, q, sc); pebble.setMatrixAt(pi++, mtx); }
    else if (si < 900) { const s = 0.35 + r() * 0.7; ps.set(x, h + s * 0.3, z); eu.set(0, r() * 6, 0); q.setFromEuler(eu); sc.set(s * 1.3, s * 0.7, s * 1.3); mtx.compose(ps, q, sc); scrub.setMatrixAt(si++, mtx); }
  }
  pebble.count = pi; scrub.count = si; pebble.castShadow = scrub.castShadow = true; pebble.receiveShadow = true; scene.add(pebble, scrub);
  // desert trees (trunk + spiky arms), merged per tree type via instancing
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 1, flatShading: true });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x5f6a36, roughness: 1, flatShading: true });
  const N = 110, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.3, 1, 6), trunkM, N * 3), crown = new THREE.InstancedMesh(new THREE.ConeGeometry(0.55, 1.1, 7), leafM, N * 3);
  let ti = 0, ci = 0;
  for (let k = 0; k < N; k++) {
    let x, z; do { x = (r() - 0.5) * 900; z = (r() - 0.5) * 900; } while (Math.abs(x - roadX(z)) < 12 || Math.hypot(x - CAMP.x, z - CAMP.z) < 30);
    const h = terrainH(x, z), H = 2.2 + r() * 2.5;
    ps.set(x, h + H / 2, z); q.identity(); sc.set(1, H, 1); mtx.compose(ps, q, sc); trunk.setMatrixAt(ti++, mtx);
    ps.set(x, h + H + 0.3, z); sc.set(1, 1, 1); mtx.compose(ps, q, sc); crown.setMatrixAt(ci++, mtx);
    for (let a = 0; a < 2; a++) {
      const ang = r() * TAU, L = 1 + r() * 1.2, tilt = 0.7;
      eu.set(Math.cos(ang) * tilt, 0, Math.sin(ang) * tilt); q.setFromEuler(eu);
      ps.set(x + Math.sin(ang) * 0.35, h + H * 0.65 + L * 0.4, z - Math.cos(ang) * 0.35); sc.set(0.7, L, 0.7); mtx.compose(ps, q, sc); trunk.setMatrixAt(ti++, mtx);
      ps.set(x + Math.sin(ang) * (0.35 + L * 0.5), h + H * 0.65 + L * 0.95, z - Math.cos(ang) * (0.35 + L * 0.5)); q.identity(); sc.set(0.75, 0.75, 0.75); mtx.compose(ps, q, sc); crown.setMatrixAt(ci++, mtx);
    }
    if (Math.hypot(x, z) < 480) addBoxCollider(new V3(x - 0.3, h, z - 0.3), new V3(x + 0.3, h + H, z + 0.3));
  }
  trunk.count = ti; crown.count = ci; trunk.castShadow = crown.castShadow = true; scene.add(trunk, crown);
}

/* ---------------- supply camp ---------------- */
function tent(x, z, rot, L, W) {
  const g = new THREE.Group(), h = CAMP_H;
  const geo = new THREE.CylinderGeometry(W / 2, W / 2, L, 3, 1, true).rotateZ(Math.PI / 2);
  const m = part(g, geo, M.canvas, 0, W * 0.25, 0); m.rotation.x = Math.PI;
  part(g, B(0.08, W * 0.8, 0.08), M.pole, L / 2, W * 0.4, 0); part(g, B(0.08, W * 0.8, 0.08), M.pole, -L / 2, W * 0.4, 0);
  g.position.set(x, h, z); g.rotation.y = rot; scene.add(g);
  colliderFromObject(g, 0.15);
}
function crate(x, y, z, s, rot) {
  const m = new THREE.Mesh(B(s, s, s), M.crate); m.position.set(x, y + s / 2, z); m.rotation.y = rot || 0; m.castShadow = m.receiveShadow = true; scene.add(m);
  colliderFromObject(m, 0.02, { cover: s > 0.9 });
  return m;
}
function sandbags(x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 0.62), g = new THREE.Group();
  for (let row = 0; row < 3; row++) for (let i = 0; i < n - (row % 2); i++) {
    const t = (i + 0.5 + (row % 2) * 0.5) / n;
    const b = part(g, B(0.6, 0.3, 0.38), M.sand, lerp(x0, x1, t), CAMP_H + 0.15 + row * 0.3, lerp(z0, z1, t));
    b.rotation.y = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2 + rand(-0.05, 0.05);
  }
  scene.add(g);
  addBoxCollider(new V3(Math.min(x0, x1) - 0.25, CAMP_H, Math.min(z0, z1) - 0.25), new V3(Math.max(x0, x1) + 0.25, CAMP_H + 0.95, Math.max(z0, z1) + 0.25), null, { cover: true });
}
const CAMPPTS = {};
function buildCamp() {
  const cx = CAMP.x, cz = CAMP.z, h = CAMP_H;
  tent(cx + 6, cz + 9, 0, 5, 3.6); tent(cx - 7, cz + 11, 0.3, 5, 3.6);
  // table with weapons
  const tg = new THREE.Group(); part(tg, B(2.2, 0.08, 0.9), M.wood, 0, 0.85, 0);
  for (const [x, z] of [[-1, -0.38], [1, -0.38], [-1, 0.38], [1, 0.38]]) part(tg, B(0.07, 0.85, 0.07), M.wood, x, 0.425, z);
  tg.position.set(cx, h, cz - 2); scene.add(tg); colliderFromObject(tg, 0.05);
  CAMPPTS.table = new V3(cx, h + 0.9, cz - 2);
  crate(cx - 8, h, cz - 6, 1.2); crate(cx - 9.3, h, cz - 6.1, 1.2, 0.2); crate(cx - 8.6, h + 1.2, cz - 6, 1.1, 0.4); crate(cx + 4, h, cz - 5, 1.0, 0.5);
  crate(cx + 3, h, cz + 3, 0.8); crate(cx - 2.5, h, cz + 5, 1.1, 0.8); crate(cx + 7, h, cz + 9.5, 0.6);
  CAMPPTS.smg = new V3(cx + 4, h + 1.05, cz - 5);
  CAMPPTS.jack = new V3(cx + 7, h + 0.62, cz + 9.5);
  sandbags(cx - 15, cz - 10, cx - 15, cz + 2); sandbags(cx - 15, cz - 10, cx - 7, cz - 13);
  sandbags(cx + 10, cz - 14, cx + 16, cz - 12);
  // watchtower
  const tw = new THREE.Group(), tx = cx + 12, tz = cz - 8;
  for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) part(tw, B(0.15, 4.3, 0.15), M.wood, x, 2.15, z);
  part(tw, B(3.2, 0.18, 3.2), M.wood, 0, 4.2, 0);
  part(tw, B(3.2, 0.9, 0.08), M.wood, 0, 4.75, -1.55); part(tw, B(3.2, 0.9, 0.08), M.wood, 0, 4.75, 1.55); part(tw, B(0.08, 0.9, 3.2), M.wood, -1.55, 4.75, 0);
  part(tw, B(3.4, 0.12, 3.4), M.canvas, 0, 6.3, 0);
  for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) part(tw, B(0.08, 1.9, 0.08), M.wood, x, 5.3, z);
  // stairs of crates on the tower's open side
  tw.position.set(tx, h, tz); scene.add(tw);
  addBoxCollider(new V3(tx - 1.6, h + 4.1, tz - 1.6), new V3(tx + 1.6, h + 4.3, tz + 1.6));
  for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) addBoxCollider(new V3(tx + x - 0.1, h, tz + z - 0.1), new V3(tx + x + 0.1, h + 4.1, tz + z + 0.1));
  for (let i = 0; i < 9; i++) { const sh = 0.46 * (i + 1), st = new THREE.Mesh(B(0.7, sh, 1.2), M.wood); st.position.set(tx + 1.95 + (8 - i) * 0.7, h + sh / 2, tz); st.castShadow = st.receiveShadow = true; scene.add(st); addBoxCollider(new V3(st.position.x - 0.35, h, tz - 0.6), new V3(st.position.x + 0.35, h + sh, tz + 0.6)); }
  CAMPPTS.tower = new V3(tx, h + 4.3, tz);
  // fire barrel, generator, floodlight
  const fb = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.9, 12), M.darkMetal); fb.position.set(cx + 2, h + 0.45, cz + 4); fb.castShadow = true; scene.add(fb);
  addBoxCollider(new V3(cx + 1.7, h, cz + 3.7), new V3(cx + 2.3, h + 0.9, cz + 4.3));
  CAMPPTS.fire = new V3(cx + 2, h + 0.95, cz + 4);
  const gen = new THREE.Group(); part(gen, B(1.6, 1.0, 1.0), M.olive, 0, 0.5, 0); part(gen, CYZ(0.08, 0.4), M.darkMetal, 0.5, 1.1, 0, Math.PI / 2); gen.position.set(cx - 3, h, cz + 13); scene.add(gen); colliderFromObject(gen, 0);
  const fl = new THREE.Group(); part(fl, B(0.12, 5, 0.12), M.metal, 0, 2.5, 0); part(fl, B(0.8, 0.5, 0.3), M.darkMetal, 0, 5, -0.1); part(fl, B(0.7, 0.4, 0.04), M.lamp, 0, 5, -0.27, 0, 0, 0, false);
  fl.position.set(cx + 9, h, cz + 3); fl.rotation.y = 2.4; scene.add(fl);
  // warning sign at camp entrance
  const ws = new THREE.Group(); part(ws, B(0.1, 2, 0.1), M.metal, 0, 1, 0); part(ws, B(1.8, 0.9, 0.05), M.warn, 0, 2.1, 0); ws.position.set(cx - 22, terrainH(cx - 22, cz - 4), cz - 4); ws.rotation.y = -Math.PI / 2 + 0.3; scene.add(ws);
}

/* ---------------- checkpoint booth (static base) ---------------- */
function buildCheckpointBase() {
  const z = -30, x = roadX(z) + 9, h = terrainH(x, z), g = new THREE.Group();
  part(g, B(2.6, 2.6, 2.6), M.concrete, 0, 1.3, 0); part(g, B(2.62, 0.9, 2.62), M.glass, 0, 1.9, 0); part(g, B(3, 0.2, 3), M.darkMetal, 0, 2.7, 0);
  g.position.set(x, h, z); scene.add(g); colliderFromObject(g, 0, { cover: true });
  // floodlights on the checkpoint
  const fl = new THREE.Group(); part(fl, B(0.12, 6, 0.12), M.metal, 0, 3, 0); part(fl, B(0.8, 0.45, 0.3), M.darkMetal, 0, 6, 0); part(fl, B(0.7, 0.38, 0.04), M.lamp, 0, 6, -0.17, 0, 0, 0, false);
  fl.position.set(x - 2, h, z - 4); scene.add(fl);
}

function genCover(cols) {
  const pts = [];
  for (const c of cols) {
    const b = c.box, cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
    if (b.max.y - terrainH(cx, cz) < 0.85) continue;
    const center = new V3(cx, 0, cz), sides = [[b.min.x - 0.8, 'z'], [b.max.x + 0.8, 'z'], [b.min.z - 0.8, 'x'], [b.max.z + 0.8, 'x']];
    for (const [v, ax] of sides) {
      const lo = ax === 'z' ? b.min.z : b.min.x, hi = ax === 'z' ? b.max.z : b.max.x, n = Math.max(1, Math.min(5, Math.floor((hi - lo) / 3)));
      for (let i = 0; i < n; i++) {
        const t = lo + (i + 0.5) * (hi - lo) / n, x = ax === 'z' ? v : t, z = ax === 'z' ? t : v;
        pts.push({ p: new V3(x, terrainH(x, z), z), c: center, occ: null, col: c });
      }
    }
  }
  return pts;
}

function buildWorld() {
  buildSky(LV.env); buildLights(LV.env);
  LV.build();
  coverStatic = genCover(colliders.filter(c => c.cover));
}
function buildDesert() {
  buildTerrain({ size: 1100, seg: 275, color: desertColor }); buildRoad(); buildRocksAndScatter(); buildCamp(); buildCheckpointBase();
  campLight = new THREE.PointLight(0xff9a40, 1.6, 22, 2); campLight.position.set(CAMP.x + 2, CAMP_H + 1.6, CAMP.z + 4); scene.add(campLight);
}
