/* ============================================================
   VOICE: plays the pre-rendered neural-TTS voice pack for story
   dialogue (Maya over the radio gets a radio filter) and
   positional enemy combat barks.
   ============================================================ */
const Voice = {
  buf: {}, pending: {}, cur: null, lastBark: -9, lastKind: {}, dec: false,
  key(t) { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(16); },
  b64(s) { const bin = atob(s), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; },
  decode(id, b64) {
    if (this.buf[id]) return Promise.resolve(this.buf[id]);
    if (this.pending[id]) return this.pending[id];
    if (!AudioSys.ctx || !b64) return Promise.resolve(null);
    return this.pending[id] = AudioSys.ctx.decodeAudioData(this.b64(b64)).then(b => (this.buf[id] = b)).catch(() => null);
  },
  /* warm the cache for the current chapter's lines in the background */
  preload() {
    if (this.dec || !AudioSys.ctx || typeof VOICEPACK === 'undefined') return; this.dec = true;
    const ids = Object.keys(VOICEPACK); let i = 0;
    const step = () => { for (let k = 0; k < 6 && i < ids.length; k++, i++) this.decode(ids[i], VOICEPACK[ids[i]]); if (i < ids.length) setTimeout(step, 30); };
    step();
    for (const kind in BARKPACK) BARKPACK[kind].forEach((b, j) => this.decode('bark_' + kind + j, b));
  },
  radio(who, text) {
    if (/^\((recording|PA|over the PA|static|radio)/i.test(text)) return true;
    if (/^\((in person|quietly|whisper)/i.test(text)) return false;
    if (who === 'SILAS') return !LV.silasHere;
    return who === 'MAYA' && !!LV.mayaRadio;
  },
  /* returns a promise of the clip duration (or 0 if no voice) */
  say(who, text) {
    if (!settings.voices || typeof VOICEPACK === 'undefined' || !AudioSys.ctx) return Promise.resolve(0);
    const id = this.key(text), data = VOICEPACK[id]; if (!data) return Promise.resolve(0);
    return this.decode(id, data).then(b => {
      if (!b) return 0;
      this.stop();
      const c = AudioSys.ctx, src = c.createBufferSource(); src.buffer = b;
      const g = c.createGain(); g.gain.value = 1.35 * settings.voiceVol;
      let node = src;
      if (this.radio(who, text)) {
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 380;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3300;
        const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1700; pk.gain.value = 5;
        const ws = c.createWaveShaper(); const curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); } ws.curve = curve;
        src.connect(hp); hp.connect(pk); pk.connect(ws); ws.connect(lp); node = lp;
        AudioSys.nz(AudioSys.sfx, c.currentTime + b.duration, 0.08, 'bandpass', 2400, 2, 0.1);
      }
      node.connect(g); g.connect(AudioSys.sfx);
      src.start(); this.cur = src;
      // duck the music under dialogue
      const m = AudioSys.mus.gain, t = c.currentTime; m.cancelScheduledValues(t); m.setTargetAtTime(settings.music * 0.35, t, 0.08); m.setTargetAtTime(settings.music, t + b.duration, 0.4);
      src.onended = () => { if (this.cur === src) this.cur = null; };
      return b.duration;
    });
  },
  stop() { if (this.cur) { try { this.cur.stop(); } catch (e) { } this.cur = null; } },
  /* enemy combat shouts, positional, rate limited */
  bark(kind, pos, force) {
    if (!settings.voices || typeof BARKPACK === 'undefined' || !AudioSys.ctx || !BARKPACK[kind]) return;
    const now = gameTime; if (!force && (now - this.lastBark < 1.6 || now - (this.lastKind[kind] || -9) < 5)) return;
    if (pos && pos.distanceTo(camera.position) > 60) return;
    this.lastBark = now; this.lastKind[kind] = now;
    const list = BARKPACK[kind], j = Math.floor(Math.random() * list.length);
    this.decode('bark_' + kind + j, list[j]).then(b => {
      if (!b) return; const c = AudioSys.ctx, src = c.createBufferSource(); src.buffer = b; src.playbackRate.value = rand(0.92, 1.05);
      const g = c.createGain(); g.gain.value = 1.4 * settings.voiceVol; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 160;
      src.connect(hp); hp.connect(g); g.connect(AudioSys.out(pos, 7)); src.start();
    });
  }
};
