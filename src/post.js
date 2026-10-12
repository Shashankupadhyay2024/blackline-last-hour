/* ============================================================
   POST: HDR render pipeline — MSAA scene target, bloom (bright
   pass + 3-level gaussian chain), ACES tone mapping, colour
   grading, vignette, chromatic aberration, film grain, scope
   depth-of-field. Falls back to direct rendering on Low.
   ============================================================ */
const Post = {
  on: false, w: 0, h: 0, grade: null, scopeMask: 0, scopeR: 0.3, dmg: 0,
  init() {
    const gl2 = renderer.capabilities.isWebGL2;
    this.fsScene = new THREE.Scene(); this.fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null); this.quad.frustumCulled = false; this.fsScene.add(this.quad);
    const rtOpt = { type: THREE.HalfFloatType, depthBuffer: false };
    this.sceneRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: true, samples: gl2 ? 4 : 0 });
    this.levels = [0, 1, 2].map(() => ({ a: new THREE.WebGLRenderTarget(4, 4, rtOpt), b: new THREE.WebGLRenderTarget(4, 4, rtOpt) }));
    this.streak = { a: new THREE.WebGLRenderTarget(4, 4, rtOpt), b: new THREE.WebGLRenderTarget(4, 4, rtOpt) };
    // procedural lens dirt (smudges + specks), lit up by bloom
    this.dirt = canvasTex(512, 288, (c, w, h) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, w, h); const r = mulberry(55);
      for (let i = 0; i < 38; i++) { const x = r() * w, y = r() * h, s = 10 + r() * 60, g = c.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, `rgba(255,255,255,${0.05 + r() * 0.12})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x - s, y - s, s * 2, s * 2); }
      for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${0.1 + r() * 0.35})`; c.beginPath(); c.arc(r() * w, r() * h, 0.4 + r() * 1.6, 0, TAU); c.fill(); }
      for (let i = 0; i < 6; i++) { c.strokeStyle = `rgba(255,255,255,${0.04 + r() * 0.06})`; c.lineWidth = 6 + r() * 14; c.beginPath(); c.moveTo(r() * w, r() * h); c.bezierCurveTo(r() * w, r() * h, r() * w, r() * h, r() * w, r() * h); c.stroke(); }
    });
    this.dirt.encoding = THREE.LinearEncoding;
    const vs = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
    this.brightM = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, threshold: { value: 1.0 }, knee: { value: 0.6 } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float threshold, knee; varying vec2 vUv;
        void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float l=max(c.r,max(c.g,c.b)); float s=clamp(l-threshold+knee,0.,2.*knee); s=s*s/(4.*knee+1e-4); float w=max(s,l-threshold)/max(l,1e-4); gl_FragColor=vec4(min(c*w,vec3(40.)),1.); }` });
    this.blurM = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
        void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb*0.227027;
          c+=texture2D(tDiffuse,vUv+dir*1.3846).rgb*0.3162162; c+=texture2D(tDiffuse,vUv-dir*1.3846).rgb*0.3162162;
          c+=texture2D(tDiffuse,vUv+dir*3.2308).rgb*0.0702703; c+=texture2D(tDiffuse,vUv-dir*3.2308).rgb*0.0702703;
          gl_FragColor=vec4(c,1.); }` });
    this.finalM = new THREE.ShaderMaterial({
      uniforms: { tScene: { value: null }, tB0: { value: null }, tB1: { value: null }, tB2: { value: null }, tStreak: { value: null }, tDirt: { value: null }, sunUV: { value: new THREE.Vector2(0.5, 0.5) }, sunI: { value: 0 }, sunCol: { value: new THREE.Color(1, 0.8, 0.6) }, shafts: { value: 0.5 }, dirtI: { value: 0.6 }, streakI: { value: 0.35 }, sharp: { value: 0.35 }, bloom: { value: 0.9 }, time: { value: 0 }, res: { value: new THREE.Vector2(1, 1) },
        lift: { value: new THREE.Vector3(0, 0, 0) }, gain: { value: new THREE.Vector3(1, 1, 1) }, sat: { value: 1.08 }, contrast: { value: 1.06 }, vig: { value: 0.32 }, ca: { value: 0.0015 }, grain: { value: 0.035 },
        scope: { value: 0 }, scopeR: { value: 0.3 }, dmg: { value: 0 }, jack: { value: 0 }, fade: { value: 0 } },
      vertexShader: vs, depthTest: false, depthWrite: false, toneMapped: true,
      fragmentShader: `uniform sampler2D tScene,tB0,tB1,tB2,tStreak,tDirt; uniform float bloom,time,sat,contrast,vig,ca,grain,scope,scopeR,dmg,jack,sunI,shafts,dirtI,streakI,sharp; uniform vec3 lift,gain,sunCol; uniform vec2 res,sunUV; varying vec2 vUv;
        float h12(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
        void main(){
          vec2 d=vUv-0.5; float r2=dot(d,d);
          vec2 off=d*ca*(1.+r2*3.);
          vec3 c=vec3(textureLod(tScene,vUv+off,0.).r, textureLod(tScene,vUv,0.).g, textureLod(tScene,vUv-off,0.).b);
          // subtle sharpening (unsharp mask on luminance-safe neighbours)
          vec2 px=1./res;
          vec3 nb=textureLod(tScene,vUv+vec2(px.x,0.),0.).rgb+textureLod(tScene,vUv-vec2(px.x,0.),0.).rgb+textureLod(tScene,vUv+vec2(0.,px.y),0.).rgb+textureLod(tScene,vUv-vec2(0.,px.y),0.).rgb;
          vec3 dlt=(c-nb*0.25)/(1.+nb*0.25); c=max(c+clamp(dlt,-0.06,0.06)*sharp*(1.+nb*0.25),vec3(0.));
          // scope: blur and darken everything outside the lens
          if(scope>0.001){
            vec2 a=vec2(d.x*res.x/res.y,d.y); float rr=length(a); float m=smoothstep(scopeR*0.92,scopeR*1.02,rr)*scope;
            vec3 b=vec3(0.); for(int i=0;i<12;i++){ float an=float(i)*0.5236; b+=textureLod(tScene,vUv+vec2(cos(an),sin(an))*0.012*m,0.).rgb; } c=mix(c,b/12.,m);
          }
          vec3 bl=textureLod(tB0,vUv,0.).rgb*0.55+textureLod(tB1,vUv,0.).rgb*0.3+textureLod(tB2,vUv,0.).rgb*0.25;
          c+=bl*bloom;
          // anamorphic streak on bright lights
          c+=textureLod(tStreak,vUv,0.).rgb*streakI*vec3(0.75,0.85,1.2);
          // lens dirt catches the glow
          vec3 wide=textureLod(tB2,vUv,0.).rgb+textureLod(tB1,vUv,0.).rgb*0.5;
          c+=textureLod(tDirt,vUv,0.).rgb*wide*dirtI;
          // volumetric sun shafts: radial blur of bright sky toward the sun
          if(sunI>0.001){
            vec2 dl=(vUv-sunUV)*(1./32.)*0.92; vec2 uv=vUv; float dec=1.; vec3 acc=vec3(0.);
            for(int i=0;i<32;i++){ uv-=dl; vec3 s=textureLod(tB0,clamp(uv,0.001,0.999),0.).rgb; acc+=s*dec; dec*=0.955; }
            float fall=1.-smoothstep(0.,0.85,length((vUv-sunUV)*vec2(res.x/res.y,1.)));
            c+=acc/32.*sunCol*sunI*shafts*(0.4+fall);
          }
          gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          vec3 g=pow(max(gl_FragColor.rgb,0.),vec3(1./2.2));
          g=g*gain+lift*(1.-g);
          float L=dot(g,vec3(0.2126,0.7152,0.0722));
          g=mix(vec3(L),g,sat-dmg*0.7+jack*0.25);
          g=(g-0.5)*contrast+0.5;
          g=mix(g,g*vec3(1.25,0.55,0.5),dmg*0.5);
          g=mix(g,g*vec3(1.15,0.95,0.7),jack*0.35);
          g*=1.-vig*smoothstep(0.1,0.75,r2*1.8);
          g+=(h12(vUv*res+fract(time)*91.7)-0.5)*grain;
          gl_FragColor=vec4(pow(clamp(g,0.,1.),vec3(2.2)),1.);
          #include <encodings_fragment>
        }` });
    this.copyM = this.blurM;
  },
  setGrade(env) {
    const g = env.grade || {};
    const U = this.finalM.uniforms;
    U.lift.value.set(...(g.lift || [0.0, 0.0, 0.01])); U.gain.value.set(...(g.gain || [1, 1, 1]));
    U.sat.value = g.sat ?? 1.08; U.contrast.value = g.contrast ?? 1.06; U.vig.value = g.vig ?? 0.32; U.bloom.value = g.bloom ?? 0.85;
    this.brightM.uniforms.threshold.value = g.threshold ?? 1.0;
    U.shafts.value = g.shafts ?? 0.5; U.dirtI.value = g.dirt ?? 0.5; U.streakI.value = g.streak ?? 0.3; U.sunCol.value.set(env.sunGlow || env.sunCol || 0xffc890);
  },
  resize() {
    const s = renderer.getDrawingBufferSize(new THREE.Vector2()); this.w = s.x; this.h = s.y;
    this.sceneRT.setSize(s.x, s.y);
    let w = s.x >> 1, h = s.y >> 1;
    this.streak.a.setSize(Math.max(1, s.x >> 2), Math.max(1, s.y >> 3)); this.streak.b.setSize(Math.max(1, s.x >> 2), Math.max(1, s.y >> 3)); this.streak.w = Math.max(1, s.x >> 2);
    for (const l of this.levels) { l.a.setSize(Math.max(1, w), Math.max(1, h)); l.b.setSize(Math.max(1, w), Math.max(1, h)); l.w = Math.max(1, w); l.h = Math.max(1, h); w >>= 1; h >>= 1; }
    this.finalM.uniforms.res.value.set(s.x, s.y);
  },
  pass(mat, target) { this.quad.material = mat; renderer.setRenderTarget(target); renderer.render(this.fsScene, this.fsCam); },
  render(drawVM) {
    if (!this.on) {
      renderer.setRenderTarget(null); renderer.clear(); renderer.render(scene, camera);
      if (drawVM) { renderer.clearDepth(); renderer.render(vmScene, vmCam); }
      return;
    }
    const s = renderer.getDrawingBufferSize(_v1); if (s.x !== this.w || s.y !== this.h) this.resize();
    renderer.setRenderTarget(this.sceneRT); renderer.clear(); renderer.render(scene, camera);
    if (drawVM) { renderer.clearDepth(); renderer.render(vmScene, vmCam); }
    // bloom chain
    this.brightM.uniforms.tDiffuse.value = this.sceneRT.texture; this.pass(this.brightM, this.levels[0].a);
    const B = this.blurM.uniforms;
    for (let i = 0; i < 3; i++) {
      const L = this.levels[i];
      if (i > 0) { B.tDiffuse.value = this.levels[i - 1].a.texture; B.dir.value.set(0, 0); this.pass(this.blurM, L.a); }
      B.tDiffuse.value = L.a.texture; B.dir.value.set(1 / L.w, 0); this.pass(this.blurM, L.b);
      B.tDiffuse.value = L.b.texture; B.dir.value.set(0, 1 / L.h); this.pass(this.blurM, L.a);
    }
    // horizontal streak from the half-res bright pass
    B.tDiffuse.value = this.levels[0].a.texture; B.dir.value.set(0, 0); this.pass(this.blurM, this.streak.a);
    for (const k of [2, 6, 14]) { B.tDiffuse.value = this.streak.a.texture; B.dir.value.set(k / this.streak.w, 0); this.pass(this.blurM, this.streak.b); B.tDiffuse.value = this.streak.b.texture; B.dir.value.set(k * 1.7 / this.streak.w, 0); this.pass(this.blurM, this.streak.a); }
    const U = this.finalM.uniforms;
    // sun position on screen
    _v2.copy(camera.position).addScaledVector(SUN_DIR, 1000).project(camera);
    camera.getWorldDirection(_v3); const facing = _v3.dot(SUN_DIR);
    U.sunUV.value.set(_v2.x * 0.5 + 0.5, _v2.y * 0.5 + 0.5);
    U.sunI.value = LV.env.indoor || facing < 0.05 ? 0 : smooth(0.05, 0.6, facing) * (1 - smooth(0.9, 1.5, Math.max(Math.abs(_v2.x), Math.abs(_v2.y)))) * (this.scopeMask ? 0.3 : 1);
    U.tStreak.value = this.streak.a.texture; U.tDirt.value = this.dirt;
    U.tScene.value = this.sceneRT.texture; U.tB0.value = this.levels[0].a.texture; U.tB1.value = this.levels[1].a.texture; U.tB2.value = this.levels[2].a.texture;
    U.time.value = realTime; U.scope.value = this.scopeMask; U.scopeR.value = this.scopeR;
    U.dmg.value = this.dmg; U.jack.value = player.jackT > 0 ? Math.min(1, player.jackT) : 0;
    U.ca.value = 0.0012 + this.dmg * 0.006 + (player.jackT > 0 ? 0.002 : 0);
    U.grain.value = settings.quality === 'ultra' ? 0.03 : 0.035;
    this.pass(this.finalM, null);
  }
};
