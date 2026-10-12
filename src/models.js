/* ============================================================
   MODELS: procedural low-poly meshes (all original designs)
   ============================================================ */
const M = {};
function initMaterials() {
  const S = (color, r, m, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: r, metalness: m || 0 }, o || {}));
  Object.assign(M, {
    rock: S(0x9a6446, 0.95, 0, { flatShading: true }), rockDark: S(0x6e4632, 0.95, 0, { flatShading: true }),
    asphalt: S(0x3a3634, 0.92, 0, { map: TEX.roadGrain, polygonOffset: true, polygonOffsetFactor: -1 }),
    line: new THREE.MeshBasicMaterial({ color: 0xd9b24a, polygonOffset: true, polygonOffsetFactor: -2 }),
    lineW: new THREE.MeshBasicMaterial({ color: 0xcfc8b8, polygonOffset: true, polygonOffsetFactor: -2 }),
    metal: S(0x40434a, 0.45, 0.7), darkMetal: S(0x1d1f23, 0.5, 0.6), gun: S(0x2a2c31, 0.45, 0.55), polymer: S(0x17181b, 0.8, 0.1),
    tan: S(0x5e4e36, 0.8), olive: S(0x5a5a38, 0.85), canvas: S(0x6d6846, 0.95, 0, { side: THREE.DoubleSide }),
    wood: S(0x6e5436, 0.9), crate: S(0xffffff, 0.9, 0, { map: TEX.crate }), sand: S(0xa88f64, 1), black: S(0x0e0e10, 0.7),
    rubber: S(0x141414, 0.9), glass: S(0x1a2530, 0.1, 0.6, { transparent: true, opacity: 0.75 }),
    barrel: S(0x8a2a1c, 0.6, 0.3), barrelStripe: S(0xd8b12a, 0.6), concrete: S(0x9b958a, 0.95), burnt: S(0x161412, 0.95, 0.2),
    glove: S(0x221e1b, 0.9), sleeve: S(0x3a3628, 0.95), skin: S(0xa77a5a, 0.8), brass: S(0xc9a040, 0.3, 0.9),
    lamp: new THREE.MeshBasicMaterial({ color: 0xfff1c4 }), redLamp: new THREE.MeshBasicMaterial({ color: 0xff2a1a }), redDot: new THREE.MeshBasicMaterial({ color: 0xff2020 }),
    jet: S(0x3a3e45, 0.55, 0.55), gold: S(0xd9a733, 0.25, 1), pole: S(0x5a4632, 0.9), sign: S(0xffffff, 0.6, 0, { map: TEX.sign }), warn: S(0xffffff, 0.7, 0, { map: TEX.warn }),
    medkit: S(0xffffff, 0.6, 0, { map: TEX.medkit }), label: S(0xffffff, 0.7, 0, { map: TEX.label }),
    bottle: S(0x6a3208, 0.12, 0.1, { transparent: true, opacity: 0.88 }), case: S(0xb8bcc2, 0.3, 0.9)
  });
  M.lamp.color.multiplyScalar(4); M.redLamp.color.multiplyScalar(4); M.redDot.color.multiplyScalar(5);
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CYZ = (r, l, s) => new THREE.CylinderGeometry(r, r, l, s || 12).rotateX(Math.PI / 2);
function part(g, geo, mat, x, y, z, rx, ry, rz, shadow) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0);
  if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
  g.add(m); return m;
}
function spriteGlow(tex, size, color) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(color || 0xffffff).multiplyScalar(2.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.scale.set(size, size, 1); return s;
}

/* ---------------- weapons (viewmodel + world) ---------------- */
function buildGun(kind) {
  const g = new THREE.Group(); let muzzle = -0.5, sightY = 0.06, pump = null, mag = null;
  const gm = M.gun, pm = M.polymer, am = M.tan;
  if (kind === 'pistol' || kind === 'golden') {
    const sm = kind === 'golden' ? M.gold : gm;
    part(g, B(0.034, 0.034, 0.17), kind === 'golden' ? M.gold : pm, 0, 0, -0.02);
    part(g, B(0.037, 0.034, 0.19), sm, 0, 0.032, -0.03);
    part(g, B(0.032, 0.11, 0.05), kind === 'golden' ? M.black : pm, 0, -0.06, 0.05, 0.25);
    part(g, B(0.008, 0.012, 0.01), sm, 0, 0.055, -0.115); part(g, B(0.03, 0.012, 0.01), sm, 0, 0.055, 0.055);
    mag = part(g, B(0.026, 0.02, 0.04), sm, 0, -0.12, 0.065, 0.25);
    muzzle = -0.13; sightY = 0.058;
  } else if (kind === 'ar') {
    part(g, B(0.05, 0.07, 0.32), gm, 0, 0, 0);
    part(g, B(0.056, 0.06, 0.26), pm, 0, 0.002, -0.28);
    part(g, CYZ(0.012, 0.2), gm, 0, 0.01, -0.5); part(g, CYZ(0.018, 0.06), gm, 0, 0.01, -0.62);
    mag = part(g, B(0.034, 0.14, 0.07), gm, 0, -0.1, -0.05, 0.22);
    part(g, B(0.034, 0.1, 0.045), pm, 0, -0.08, 0.1, 0.3);
    part(g, B(0.045, 0.07, 0.15), am, 0, -0.012, 0.22);
    part(g, B(0.03, 0.012, 0.34), gm, 0, 0.041, -0.12);
    part(g, B(0.036, 0.034, 0.07), pm, 0, 0.064, -0.02);
    part(g, new THREE.SphereGeometry(0.004, 6, 6), M.redDot, 0, 0.068, -0.02, 0, 0, 0, false);
    muzzle = -0.66; sightY = 0.068;
  } else if (kind === 'smg') {
    part(g, B(0.05, 0.07, 0.24), gm, 0, 0, 0);
    part(g, CYZ(0.022, 0.22), pm, 0, 0.012, -0.23);
    mag = part(g, B(0.03, 0.18, 0.045), gm, 0, -0.12, -0.04);
    part(g, B(0.034, 0.1, 0.045), pm, 0, -0.08, 0.09, 0.3);
    part(g, B(0.02, 0.05, 0.2), gm, 0, -0.005, 0.2);
    part(g, B(0.008, 0.02, 0.01), gm, 0, 0.048, -0.1); part(g, B(0.03, 0.02, 0.01), gm, 0, 0.048, 0.1);
    muzzle = -0.36; sightY = 0.056;
  } else if (kind === 'shotgun') {
    part(g, B(0.055, 0.07, 0.3), gm, 0, 0, 0);
    part(g, CYZ(0.017, 0.55), gm, 0, 0.012, -0.42);
    part(g, CYZ(0.014, 0.45), gm, 0, -0.022, -0.37);
    pump = part(g, B(0.062, 0.05, 0.15), am, 0, -0.022, -0.32);
    part(g, B(0.035, 0.1, 0.05), am, 0, -0.08, 0.12, 0.35);
    part(g, B(0.048, 0.08, 0.16), am, 0, -0.02, 0.23);
    part(g, new THREE.SphereGeometry(0.005, 6, 6), M.brass, 0, 0.034, -0.68, 0, 0, 0, false);
    muzzle = -0.7; sightY = 0.04;
  } else if (kind === 'sniper') {
    part(g, B(0.05, 0.07, 0.34), gm, 0, 0, 0);
    part(g, CYZ(0.014, 0.62), gm, 0, 0.012, -0.5); part(g, B(0.04, 0.03, 0.07), gm, 0, 0.012, -0.84);
    part(g, CYZ(0.024, 0.32, 16), M.black, 0, 0.078, -0.02);
    part(g, CYZ(0.031, 0.06, 16), M.black, 0, 0.078, -0.19); part(g, CYZ(0.029, 0.05, 16), M.black, 0, 0.078, 0.14);
    part(g, B(0.03, 0.03, 0.03), gm, 0, 0.05, 0.06); part(g, B(0.03, 0.03, 0.03), gm, 0, 0.05, -0.1);
    mag = part(g, B(0.03, 0.06, 0.07), gm, 0, -0.06, -0.02);
    part(g, B(0.05, 0.09, 0.18), am, 0, -0.02, 0.24); part(g, B(0.05, 0.12, 0.05), am, 0, -0.08, 0.12, 0.35);
    part(g, CYZ(0.006, 0.05), gm, 0.04, 0.02, 0.1, 0, 0, 1.2);
    muzzle = -0.88; sightY = 0.078;
  } else if (kind === 'rocket') {
    part(g, CYZ(0.06, 0.95, 16), M.olive, 0, 0, -0.12);
    part(g, new THREE.CylinderGeometry(0.075, 0.06, 0.12, 16).rotateX(Math.PI / 2), M.darkMetal, 0, 0, -0.62);
    part(g, new THREE.CylinderGeometry(0.06, 0.08, 0.14, 16).rotateX(Math.PI / 2), M.darkMetal, 0, 0, 0.4);
    part(g, B(0.04, 0.1, 0.05), pm, 0, -0.1, 0.02, 0.2); part(g, B(0.04, 0.1, 0.05), pm, 0, -0.1, -0.25, 0.2);
    part(g, B(0.03, 0.05, 0.1), M.darkMetal, -0.075, 0.05, -0.2);
    part(g, B(0.03, 0.03, 0.01), M.redLamp, -0.075, 0.08, -0.2, 0, 0, 0, false);
    muzzle = -0.7; sightY = 0.09;
  }
  return { g, muzzle, sightY, pump, mag };
}
function addArms(g, grip, fore) {
  part(g, B(0.06, 0.085, 0.1), M.glove, grip[0], grip[1], grip[2], 0.2, 0, 0, false);
  { const a = part(g, B(0.08, 0.08, 0.34), M.sleeve, 0, 0, 0, 0, 0, 0, false); a.geometry.translate(0, 0, 0.17); a.position.set(grip[0] + 0.02, grip[1] - 0.03, grip[2] + 0.04); a.rotation.set(1.05, -0.35, 0); }
  if (fore) {
    part(g, B(0.07, 0.07, 0.1), M.glove, fore[0], fore[1], fore[2], 0, 0, 0.3, false);
    { const a = part(g, B(0.08, 0.08, 0.36), M.sleeve, 0, 0, 0, 0, 0, 0, false); a.geometry.translate(0, 0, 0.18); a.position.set(fore[0] - 0.03, fore[1] - 0.03, fore[2] + 0.03); a.rotation.set(0.95, 0.55, 0); }
  }
}

/* ---------------- soldier ---------------- */
function buildSoldier(type, o) {
  const T = ETYPES[type]; o = o || {};
  const root = new THREE.Group();
  const uni = new THREE.MeshStandardMaterial({ color: o.color || T.color, roughness: 0.92 });
  const gear = new THREE.MeshStandardMaterial({ color: o.gear || T.gear, roughness: 0.85 });
  const hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips);
  const legs = [], knees = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.12, 0, 0); hips.add(leg);
    part(leg, B(0.17, 0.5, 0.19), uni, 0, -0.24, 0);
    const knee = new THREE.Group(); knee.position.y = -0.48; leg.add(knee);
    part(knee, B(0.15, 0.44, 0.17), uni, 0, -0.2, 0);
    part(knee, B(0.16, 0.1, 0.27), M.black, 0, -0.43, -0.04);
    legs.push(leg); knees.push(knee);
  }
  const torso = new THREE.Group(); hips.add(torso);
  part(torso, B(0.44, 0.56, 0.27), uni, 0, 0.3, 0);
  part(torso, B(0.49, 0.38, 0.33), gear, 0, 0.33, 0);
  part(torso, B(0.12, 0.1, 0.06), gear, -0.12, 0.2, -0.18); part(torso, B(0.12, 0.1, 0.06), gear, 0.12, 0.2, -0.18);
  const head = new THREE.Group(); head.position.y = 0.72; torso.add(head);
  part(head, B(0.21, 0.24, 0.23), o.balaclava || T.balaclava ? M.black : M.skin, 0, 0, 0);
  part(head, B(0.27, 0.12, 0.29), gear, 0, 0.12, 0.01);
  if (o.visor) part(head, B(0.22, 0.04, 0.02), M.redLamp, 0, 0.02, -0.12, 0, 0, 0, false);
  else part(head, B(0.2, 0.05, 0.02), M.black, 0, 0.03, -0.12, 0, 0, 0, false);
  if (type === 'heavy') part(head, B(0.23, 0.14, 0.05), M.darkMetal, 0, -0.03, -0.12);
  if (type === 'sniper') part(torso, B(0.56, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 1, flatShading: true }), 0, 0.62, 0.05);
  if (o.hair) { part(head, B(0.23, 0.1, 0.25), o.hair, 0, 0.13, 0.01); part(head, B(0.22, 0.26, 0.08), o.hair, 0, -0.02, 0.12); }
  const aim = new THREE.Group(); aim.position.set(0, 0.46, 0); torso.add(aim);
  if (o.noGun) {
    for (const sx of [-1, 1]) { const arm = new THREE.Group(); arm.position.set(sx * 0.3, 0.52, 0); torso.add(arm); part(arm, B(0.11, 0.55, 0.12), uni, 0, -0.27, 0); part(arm, B(0.09, 0.1, 0.1), M.skin, 0, -0.58, 0); (root.userData.arms = root.userData.arms || []).push(arm); }
    const muzzle = new THREE.Object3D(); aim.add(muzzle); const flash = spriteGlow(TEX.flash, 0.1); flash.visible = false; muzzle.add(flash);
    root.scale.setScalar(o.scale || 1);
    return { root, hips, legs, knees, torso, head, aim, muzzle, flash };
  }
  const gl = type === 'sniper' ? 1.05 : type === 'heavy' ? 0.85 : type === 'shotgun' ? 0.8 : 0.72;
  part(aim, B(type === 'heavy' ? 0.1 : 0.06, type === 'heavy' ? 0.12 : 0.08, gl), M.gun, 0.14, 0, -gl / 2 + 0.08);
  if (type === 'sniper') part(aim, CYZ(0.025, 0.25), M.black, 0.14, 0.07, -0.2);
  if (type === 'heavy') part(aim, B(0.1, 0.12, 0.14), M.olive, 0.14, -0.1, -0.2);
  part(aim, B(0.11, 0.11, 0.42), uni, 0.2, -0.04, -0.12, 0, 0.15, 0);
  part(aim, B(0.11, 0.11, 0.46), uni, -0.06, -0.06, -0.2, 0, -0.5, 0);
  part(aim, B(0.08, 0.08, 0.1), M.glove, 0.08, -0.02, -0.42);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0.14, 0.01, -gl + 0.06); aim.add(muzzle);
  const flash = spriteGlow(TEX.flash, 0.7); flash.visible = false; muzzle.add(flash);
  const s = o.scale || T.scale || 1; root.scale.setScalar(s);
  return { root, hips, legs, knees, torso, head, aim, muzzle, flash };
}

/* ---------------- ground vehicles ---------------- */
function wheel(g, x, y, z, r, w, steer) {
  const sg = new THREE.Group(); sg.position.set(x, y, z); g.add(sg);
  const wm = new THREE.Group(); sg.add(wm);
  part(wm, new THREE.CylinderGeometry(r, r, w, 16).rotateZ(Math.PI / 2), M.rubber, 0, 0, 0);
  part(wm, new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 8).rotateZ(Math.PI / 2), M.metal, 0, 0, 0);
  return { sg, wm, steer: !!steer };
}
function buildCar(kind) {
  const g = new THREE.Group(); const wheels = [];
  if (kind === 'pickup') {
    const pm = new THREE.MeshStandardMaterial({ color: 0x8c3a24, roughness: 0.5, metalness: 0.35 });
    part(g, B(2.0, 0.7, 5.0), pm, 0, 0.95, 0);
    part(g, B(1.92, 0.78, 1.8), pm, 0, 1.68, -0.35);
    part(g, B(1.96, 0.46, 1.3), M.glass, 0, 1.76, -0.35);
    part(g, B(1.8, 0.62, 0.06), M.glass, 0, 1.66, -1.3, -0.45);
    part(g, B(1.96, 0.28, 1.4), pm, 0, 1.38, -1.75);
    part(g, B(0.1, 0.5, 2.3), pm, -0.95, 1.55, 1.3); part(g, B(0.1, 0.5, 2.3), pm, 0.95, 1.55, 1.3); part(g, B(2.0, 0.5, 0.1), pm, 0, 1.55, 2.45);
    part(g, B(2.1, 0.24, 0.22), M.darkMetal, 0, 0.82, -2.55); part(g, B(2.1, 0.24, 0.2), M.darkMetal, 0, 0.82, 2.55);
    part(g, B(0.3, 0.14, 0.05), M.lamp, -0.7, 1.18, -2.47, 0, 0, 0, false); part(g, B(0.3, 0.14, 0.05), M.lamp, 0.7, 1.18, -2.47, 0, 0, 0, false);
    part(g, B(0.2, 0.2, 0.04), M.redLamp, -0.85, 1.35, 2.5, 0, 0, 0, false); part(g, B(0.2, 0.2, 0.04), M.redLamp, 0.85, 1.35, 2.5, 0, 0, 0, false);
    for (const [x, z, s] of [[-1, -1.6, 1], [1, -1.6, 1], [-1, 1.6, 0], [1, 1.6, 0]]) wheels.push(wheel(g, x, 0.45, z, 0.45, 0.34, s));
  } else if (kind === 'jeep') {
    const pm = new THREE.MeshStandardMaterial({ color: 0x6f6344, roughness: 0.8, metalness: 0.15 });
    part(g, B(2.05, 0.85, 4.4), pm, 0, 1.0, 0);
    part(g, B(2.0, 0.3, 1.3), pm, 0, 1.5, -1.5);
    part(g, B(1.9, 0.5, 0.06), M.glass, 0, 1.85, -0.8, -0.2);
    part(g, B(0.06, 0.8, 0.06), M.darkMetal, -0.95, 2.0, 0.6); part(g, B(0.06, 0.8, 0.06), M.darkMetal, 0.95, 2.0, 0.6); part(g, B(1.96, 0.06, 0.06), M.darkMetal, 0, 2.4, 0.6);
    part(g, B(0.1, 0.9, 0.1), M.darkMetal, 0, 1.9, 1.1); part(g, B(0.12, 0.14, 1.1), M.gun, 0, 2.35, 0.7);
    part(g, B(2.1, 0.3, 0.25), M.darkMetal, 0, 0.8, -2.25);
    part(g, new THREE.CylinderGeometry(0.4, 0.4, 0.25, 14).rotateX(Math.PI / 2), M.rubber, 0, 1.2, 2.3);
    part(g, B(0.22, 0.12, 0.05), M.lamp, -0.7, 1.2, -2.21, 0, 0, 0, false); part(g, B(0.22, 0.12, 0.05), M.lamp, 0.7, 1.2, -2.21, 0, 0, 0, false);
    for (const [x, z, s] of [[-1.02, -1.45, 1], [1.02, -1.45, 1], [-1.02, 1.45, 0], [1.02, 1.45, 0]]) wheels.push(wheel(g, x, 0.46, z, 0.46, 0.36, s));
  } else if (kind === 'sedan' || kind === 'suv') {
    const suv = kind === 'suv', pm = new THREE.MeshStandardMaterial({ color: suv ? 0x121418 : pick([0x8a8f96, 0x2b4a7a, 0x7a1f1f, 0xd8d4c8, 0x3c3f45, 0x9a7a2a]), roughness: 0.35, metalness: 0.55 });
    part(g, B(1.9, suv ? 0.85 : 0.65, suv ? 4.8 : 4.5), pm, 0, suv ? 0.95 : 0.8, 0);
    part(g, B(1.8, suv ? 0.75 : 0.6, suv ? 3.0 : 2.3), pm, 0, suv ? 1.75 : 1.4, suv ? 0.3 : 0.1);
    part(g, B(1.84, suv ? 0.5 : 0.42, suv ? 2.8 : 2.1), M.glass, 0, suv ? 1.8 : 1.43, suv ? 0.3 : 0.1);
    part(g, B(0.3, 0.12, 0.05), M.lamp, -0.65, suv ? 1.05 : 0.88, -2.26, 0, 0, 0, false); part(g, B(0.3, 0.12, 0.05), M.lamp, 0.65, suv ? 1.05 : 0.88, -2.26, 0, 0, 0, false);
    part(g, B(0.3, 0.14, 0.04), M.redLamp, -0.7, suv ? 1.1 : 0.92, 2.27, 0, 0, 0, false); part(g, B(0.3, 0.14, 0.04), M.redLamp, 0.7, suv ? 1.1 : 0.92, 2.27, 0, 0, 0, false);
    if (suv) part(g, B(1.7, 0.08, 2.4), M.darkMetal, 0, 2.17, 0.3);
    for (const [x, z, st] of [[-0.95, -1.45, 1], [0.95, -1.45, 1], [-0.95, 1.45, 0], [0.95, 1.45, 0]]) wheels.push(wheel(g, x, 0.42, z, 0.42, 0.3, st));
  } else if (kind === 'apc') {
    const pm = new THREE.MeshStandardMaterial({ color: 0x3e4636, roughness: 0.75, metalness: 0.3 });
    part(g, B(2.8, 1.5, 7.2), pm, 0, 1.55, 0);
    part(g, B(2.5, 0.8, 1.6), pm, 0, 2.2, -3.2, -0.5);
    const tur = new THREE.Group(); tur.position.set(0, 2.45, 0.3); g.add(tur);
    part(tur, new THREE.CylinderGeometry(0.9, 1.0, 0.6, 12), pm, 0, 0.2, 0);
    part(tur, CYZ(0.09, 2.2), M.gun, 0, 0.3, -1.4); part(tur, B(0.5, 0.35, 0.6), pm, 0, 0.3, -0.5);
    g.userData.turret = tur;
    for (let i = 0; i < 4; i++) for (const x of [-1.35, 1.35]) wheels.push(wheel(g, x, 0.6, -2.4 + i * 1.6, 0.6, 0.45, i < 2));
  } else if (kind === 'armored') {
    const pm = new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.55, metalness: 0.55 });
    part(g, B(2.55, 2.0, 5.2), pm, 0, 1.75, 0.8);
    part(g, B(2.45, 1.5, 1.9), pm, 0, 1.55, -2.6);
    part(g, B(2.2, 0.3, 0.06), M.glass, 0, 2.0, -3.56, -0.1);
    part(g, B(2.6, 0.12, 5.3), M.darkMetal, 0, 2.8, 0.8);
    part(g, B(2.6, 0.5, 0.3), M.darkMetal, 0, 0.9, -3.65);
    for (let i = 0; i < 4; i++) part(g, B(0.08, 0.5, 0.08), M.metal, -0.9 + i * 0.6, 1.2, -3.8);
    part(g, B(0.3, 0.12, 0.05), M.lamp, -0.8, 1.35, -3.56, 0, 0, 0, false); part(g, B(0.3, 0.12, 0.05), M.lamp, 0.8, 1.35, -3.56, 0, 0, 0, false);
    part(g, B(0.2, 0.2, 0.04), M.redLamp, 0, 2.9, 0.4, 0, 0, 0, false);
    part(g, B(1.0, 1.6, 0.06), M.darkMetal, -0.55, 1.75, 3.42); part(g, B(1.0, 1.6, 0.06), M.darkMetal, 0.55, 1.75, 3.42);
    for (const [x, z, s] of [[-1.2, -2.6, 1], [1.2, -2.6, 1], [-1.2, 1.2, 0], [1.2, 1.2, 0], [-1.2, 2.5, 0], [1.2, 2.5, 0]]) wheels.push(wheel(g, x, 0.55, z, 0.55, 0.42, s));
  }
  return { group: g, wheels };
}
/* static convoy props */
function buildTruck() {
  const g = new THREE.Group();
  const pm = new THREE.MeshStandardMaterial({ color: 0x55553a, roughness: 0.85, metalness: 0.1 });
  part(g, B(2.4, 1.9, 2.1), pm, 0, 1.75, -2.6);
  part(g, B(2.2, 0.55, 0.06), M.glass, 0, 2.2, -3.66, -0.1);
  part(g, B(2.5, 0.35, 7.4), M.darkMetal, 0, 0.95, 0);
  part(g, B(2.5, 0.6, 5.0), pm, 0, 1.45, 1.1);
  part(g, new THREE.CylinderGeometry(1.25, 1.25, 5.0, 12, 1, true, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), M.canvas, 0, 1.75, 1.1, 0, 0, 0);
  for (const [x, z] of [[-1.15, -2.6], [1.15, -2.6], [-1.15, 1.0], [1.15, 1.0], [-1.15, 2.4], [1.15, 2.4]]) wheel(g, x, 0.55, z, 0.55, 0.4);
  return g;
}
function buildHumvee() {
  const g = new THREE.Group(); const pm = new THREE.MeshStandardMaterial({ color: 0x7a6b48, roughness: 0.85 });
  part(g, B(2.3, 0.9, 4.8), pm, 0, 1.05, 0); part(g, B(2.1, 0.8, 2.6), pm, 0, 1.85, 0.4); part(g, B(2.12, 0.45, 2.0), M.glass, 0, 1.95, 0.3);
  part(g, B(2.3, 0.35, 1.3), pm, 0, 1.55, -1.7);
  for (const [x, z] of [[-1.1, -1.6], [1.1, -1.6], [-1.1, 1.6], [1.1, 1.6]]) wheel(g, x, 0.5, z, 0.5, 0.38);
  return g;
}

/* ---------------- aircraft (face +z) ---------------- */
function extrudeShape(pts, depth) {
  const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }).rotateX(Math.PI / 2);
}
function buildJet() {
  const g = new THREE.Group(); const m = M.jet;
  part(g, new THREE.CylinderGeometry(0.9, 0.75, 12, 12).rotateX(Math.PI / 2), m, 0, 0, 0);
  part(g, new THREE.ConeGeometry(0.9, 4, 12).rotateX(Math.PI / 2), m, 0, 0, 8);
  part(g, extrudeShape([[0, 4], [-6.5, -3.5], [-5.5, -4.5], [5.5, -4.5], [6.5, -3.5]], 0.22), m, 0, 0.1, -0.5);
  part(g, extrudeShape([[0, 0], [-2.8, -2.2], [2.8, -2.2]], 0.15), m, 0, 0.3, -4);
  const fin = extrudeShape([[0, 0], [-3.2, 0], [-4, 3.2], [-2.8, 3.2]], 0.18).rotateZ(Math.PI / 2);
  part(g, fin, m, -0.6, 0.5, -2.5, 0, 0, 0.25); part(g, fin.clone(), m, 0.6, 0.5, -2.5, 0, 0, -0.25);
  part(g, new THREE.SphereGeometry(0.7, 12, 8).scale(0.8, 0.6, 2), new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.05, metalness: 0.9 }), 0, 0.75, 4.2);
  const glow = spriteGlow(TEX.glowOrange, 3.2); glow.position.set(0, 0, -6.6); g.add(glow); g.userData.glow = [glow];
  return g;
}
function buildBomber() {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0x24272c, roughness: 0.6, metalness: 0.4 });
  part(g, extrudeShape([[0, 14], [-34, -6], [-30, -10], [-14, -5], [0, -9], [14, -5], [30, -10], [34, -6]], 1.4), m, 0, 0.7, 0);
  part(g, new THREE.SphereGeometry(3, 16, 10).scale(1.2, 0.6, 3.2), m, 0, 0.8, 1);
  const glows = [];
  for (const x of [-6, -2.5, 2.5, 6]) { const s = spriteGlow(TEX.glowOrange, 3.5); s.position.set(x, 0.4, -6); g.add(s); glows.push(s); }
  g.userData.glow = glows;
  return g;
}
function buildProjMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'rocket') { part(g, CYZ(0.06, 0.7), M.olive, 0, 0, 0, 0, 0, 0, false); part(g, new THREE.ConeGeometry(0.06, 0.2, 8).rotateX(-Math.PI / 2), M.darkMetal, 0, 0, -0.45, 0, 0, 0, false); const s = spriteGlow(TEX.glowOrange, 1.6); s.position.z = 0.4; g.add(s); }
  else if (kind === 'grenade') { part(g, new THREE.SphereGeometry(0.07, 10, 8), M.olive, 0, 0, 0); part(g, B(0.03, 0.05, 0.03), M.metal, 0, 0.07, 0); }
  else if (kind === 'bomb') { part(g, CYZ(0.35, 2.2), M.darkMetal, 0, 0, 0, 0, 0, 0, false); part(g, new THREE.ConeGeometry(0.35, 0.8, 10).rotateX(-Math.PI / 2), M.darkMetal, 0, 0, -1.5, 0, 0, 0, false); part(g, B(0.9, 0.05, 0.4), M.darkMetal, 0, 0, 1.1, 0, 0, 0, false); part(g, B(0.05, 0.9, 0.4), M.darkMetal, 0, 0, 1.1, 0, 0, 0, false); }
  return g;
}

/* ---------------- pickups ---------------- */
function buildPickupMesh(kind, opt) {
  const g = new THREE.Group();
  if (kind === 'weapon') { const w = buildGun(opt.weapon).g; w.rotation.y = Math.PI / 2; w.scale.setScalar(1.3); g.add(w); }
  else if (kind === 'ammo') { part(g, B(0.55, 0.3, 0.3), M.olive, 0, 0.15, 0); part(g, B(0.56, 0.05, 0.31), M.barrelStripe, 0, 0.22, 0); }
  else if (kind === 'health') { part(g, B(0.45, 0.28, 0.3), M.medkit, 0, 0.14, 0); }
  else if (kind === 'armor') { part(g, B(0.5, 0.55, 0.12), M.black, 0, 0.3, 0); part(g, B(0.38, 0.35, 0.14), M.darkMetal, 0, 0.34, 0); }
  else if (kind === 'grenades') { for (let i = 0; i < 3; i++) part(g, new THREE.SphereGeometry(0.08, 10, 8), M.olive, -0.12 + i * 0.12, 0.08, 0); }
  else if (kind === 'jack') {
    part(g, B(0.14, 0.24, 0.14), M.bottle, 0, 0.12, 0);
    part(g, new THREE.CylinderGeometry(0.035, 0.05, 0.08, 10), M.bottle, 0, 0.28, 0);
    part(g, new THREE.CylinderGeometry(0.028, 0.028, 0.08, 10), M.bottle, 0, 0.35, 0);
    part(g, new THREE.CylinderGeometry(0.032, 0.032, 0.035, 10), M.black, 0, 0.405, 0);
    const lab = part(g, new THREE.PlaneGeometry(0.13, 0.13), M.label, 0, 0.13, 0.0715, 0, 0, 0, false);
    const lab2 = lab.clone(); lab2.position.z = -0.0715; lab2.rotation.y = Math.PI; g.add(lab2);
  } else if (kind === 'keycard') {
    const col = { red: 0xd02a20, black: 0x111111, blue: 0x2a6ad0 }[opt.key] || 0xd0a020;
    part(g, B(0.16, 0.01, 0.1), new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.4, emissive: col, emissiveIntensity: 0.3 }), 0, 0.2, 0);
    part(g, B(0.04, 0.012, 0.03), M.gold, -0.04, 0.206, 0.02);
  } else if (kind === 'briefcase') {
    part(g, B(0.52, 0.38, 0.13), M.case, 0, 0.19, 0); part(g, B(0.53, 0.02, 0.135), M.darkMetal, 0, 0.19, 0);
    part(g, B(0.16, 0.03, 0.03), M.black, 0, 0.405, 0); part(g, B(0.02, 0.04, 0.03), M.black, -0.07, 0.39, 0); part(g, B(0.02, 0.04, 0.03), M.black, 0.07, 0.39, 0);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: kind === 'jack' ? 0xffb030 : kind === 'briefcase' ? 0xffffff : 0xffd080, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.position.y = 0.03; g.add(ring); g.userData.ring = ring;
  return g;
}

/* ---------------- helicopters ---------------- */
function buildHeli(kind) {
  const g = new THREE.Group(), drop = kind === 'dropship';
  const pm = new THREE.MeshStandardMaterial({ color: drop ? 0x2a2f33 : 0x1d2126, roughness: 0.55, metalness: 0.45 });
  const k = drop ? 1.5 : 1;
  part(g, new THREE.SphereGeometry(1.6 * k, 16, 12).scale(1, 0.85, 1.9), pm, 0, 0, 0);
  part(g, new THREE.SphereGeometry(1.05 * k, 14, 10).scale(1, 0.8, 1.2), new THREE.MeshStandardMaterial({ color: 0x0c1218, roughness: 0.05, metalness: 0.9 }), 0, 0.25 * k, 1.9 * k);
  part(g, new THREE.CylinderGeometry(0.28 * k, 0.5 * k, 6.5 * k, 8).rotateX(Math.PI / 2), pm, 0, 0.3 * k, -4.6 * k);
  part(g, extrudeShape([[0, 0], [-1.6, 0], [-2.2, 1.8], [-1.2, 1.8]], 0.12).rotateZ(Math.PI / 2), pm, 0.06, 0.4 * k, -7.2 * k);
  for (const x of [-1, 1]) { part(g, B(0.1, 0.1, 3.6 * k), M.darkMetal, x * 1.1 * k, -1.35 * k, 0.2); part(g, B(0.08, 0.7, 0.08), M.darkMetal, x * 1.1 * k, -1.0 * k, 1); part(g, B(0.08, 0.7, 0.08), M.darkMetal, x * 1.1 * k, -1.0 * k, -0.8); }
  if (!drop) { for (const x of [-1, 1]) { part(g, B(1.4, 0.12, 0.5), pm, x * 1.5, -0.3, 0.3); part(g, CYZ(0.18, 1.3), M.olive, x * 2.2, -0.45, 0.4); } part(g, CYZ(0.06, 1.1), M.gun, 0, -1.0, 2.6); }
  else { part(g, B(0.1, 1.2, 1.8), M.black, 1.62 * k, -0.1, 0.4); part(g, B(0.1, 1.2, 1.8), M.black, -1.62 * k, -0.1, 0.4); }
  const rotor = new THREE.Group(); rotor.position.y = 1.55 * k; g.add(rotor);
  part(rotor, new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8), M.darkMetal, 0, -0.2, 0);
  for (let i = 0; i < 4; i++) { const b = part(rotor, B(0.35, 0.05, 6.6 * k), M.black, 0, 0, 0, 0, i * Math.PI / 4 * 2 / 2 * 2, 0); b.geometry.translate(0, 0, 3.3 * k); b.rotation.y = i * Math.PI / 2; }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(6.6 * k, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.18, depthWrite: false }));
  disc.position.y = 1.56 * k; g.add(disc);
  const tr = new THREE.Group(); tr.position.set(0.35, 0.9 * k, -7.4 * k); g.add(tr);
  part(tr, B(0.05, 1.8 * k, 0.18), M.black, 0, 0, 0); part(tr, B(0.05, 0.18, 1.8 * k), M.black, 0, 0, 0);
  const lamp = spriteGlow(TEX.glowRed, 1.2); lamp.position.set(0, -0.9 * k, -1.2); g.add(lamp);
  g.userData = { rotor, tr, lamp, k };
  return g;
}
function buildTurretMesh() {
  const g = new THREE.Group();
  part(g, new THREE.CylinderGeometry(0.7, 0.9, 1.2, 10), M.darkMetal, 0, 0.6, 0);
  const head = new THREE.Group(); head.position.y = 1.45; g.add(head);
  part(head, B(1.1, 0.7, 1.0), M.metal, 0, 0, 0);
  for (const x of [-0.22, 0.22]) part(head, CYZ(0.07, 1.3), M.gun, x, 0, -1.0);
  const eye = part(head, B(0.4, 0.12, 0.04), M.redLamp, 0, 0.18, -0.51, 0, 0, 0, false);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0, -1.7); head.add(muzzle);
  const flash = spriteGlow(TEX.flash, 1.1); flash.visible = false; muzzle.add(flash);
  g.userData = { head, muzzle, flash, eye };
  return g;
}
function buildCameraMesh() {
  const g = new THREE.Group();
  part(g, B(0.12, 0.12, 0.4), M.darkMetal, 0, 0, 0.2);
  const pivot = new THREE.Group(); pivot.position.set(0, -0.12, 0.35); g.add(pivot);
  part(pivot, B(0.26, 0.22, 0.5), new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: 0.5 }), 0, 0, -0.1);
  part(pivot, CYZ(0.08, 0.06, 12), M.black, 0, 0, -0.37);
  const led = part(pivot, new THREE.SphereGeometry(0.03, 8, 6), M.redLamp, 0.08, 0.08, -0.36, 0, 0, 0, false);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(7.5, 16, 20, 1, true).translate(0, -8, 0).rotateX(-Math.PI / 2), coneMat);
  cone.position.z = -0.4; pivot.add(cone);
  g.userData = { pivot, led, cone };
  return g;
}
function buildServerRack() {
  const g = new THREE.Group();
  part(g, B(1.0, 2.4, 1.2), new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.4, metalness: 0.6 }), 0, 1.2, 0);
  part(g, B(0.9, 2.2, 0.02), new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.2, metalness: 0.4, emissive: 0x0c2a44, emissiveIntensity: 0.6, emissiveMap: TEX.rack }), 0, 1.2, 0.61, 0, 0, 0, false);
  part(g, B(0.9, 2.2, 0.02), new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.2, metalness: 0.4, emissive: 0x0c2a44, emissiveIntensity: 0.6, emissiveMap: TEX.rack }), 0, 1.2, -0.61, 0, Math.PI, 0, false);
  return g;
}
function buildFish() {
  const g = new THREE.Group();
  const orange = new THREE.MeshStandardMaterial({ color: 0xff6a0a, roughness: 0.35, emissive: 0xff5a00, emissiveIntensity: 0.35 });
  part(g, new THREE.SphereGeometry(0.12, 14, 10).scale(1.5, 1, 0.7), orange, 0, 0, 0, 0, 0, 0, false);
  part(g, new THREE.ConeGeometry(0.09, 0.14, 4).rotateZ(Math.PI / 2), orange, -0.24, 0, 0, 0, 0, 0, false);
  part(g, B(0.04, 0.1, 0.01), orange, 0.02, 0.1, 0, 0, 0, 0, false);
  const shades = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.05, metalness: 0.9 });
  part(g, B(0.09, 0.045, 0.2), shades, 0.13, 0.04, 0, 0, 0, 0, false);
  part(g, new THREE.TorusGeometry(0.1, 0.012, 6, 18).rotateY(Math.PI / 2), M.gold, 0.02, -0.07, 0, 0.5, 0, 0, false);
  part(g, B(0.05, 0.05, 0.015), M.gold, 0.06, -0.15, 0, 0, 0, 0, false);
  return g;
}
