// ======== SAFIO – univers sonore ========
// Tous les sons et musiques sont synthétisés en direct avec la Web Audio API :
// aucun fichier à télécharger, aucune licence tierce, chargement instantané.
// Le son ne démarre qu'après la première interaction (règles d'autoplay iOS / Android).
const Sound = (() => {
  const KEY = "safio-audio";
  const DEF = { music: true, sfx: true, mv: 0.45, sv: 0.8, muted: false };
  let prefs = { ...DEF };
  try { prefs = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {} };

  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  let unlocked = false;
  const listeners = new Set();

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.connect(ctx.destination);
      const comp = ctx.createDynamicsCompressor(); comp.connect(master);
      musicBus = ctx.createGain(); musicBus.connect(comp);
      sfxBus = ctx.createGain(); sfxBus.connect(comp);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      applyVolumes();
      return true;
    } catch { ctx = null; return false; }
  }
  function applyVolumes() {
    if (!ctx) return;
    const now = ctx.currentTime;
    master.gain.setTargetAtTime(prefs.muted ? 0 : 1, now, 0.05);
    musicBus.gain.setTargetAtTime(prefs.music ? prefs.mv * 0.35 : 0, now, 0.15);
    sfxBus.gain.setTargetAtTime(prefs.sfx ? prefs.sv * 0.6 : 0, now, 0.02);
  }

  // Déverrouillage au premier geste de l'utilisateur
  function unlock() {
    if (unlocked) return;
    if (!init()) return;
    ctx.resume().then(() => {
      unlocked = true;
      if (wantedTrack) startTrack(wantedTrack);
    }).catch(() => {});
  }
  ["pointerdown", "keydown", "touchend"].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !unlocked) return;
    if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {});
  });

  // ---------- Briques sonores ----------
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function tone(bus, { f, t = 0, d = 0.15, type = "sine", v = 0.3, to = null, a = 0.005, cut = null }) {
    const t0 = ctx.currentTime + t;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    let node = o;
    if (cut) { const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = cut; o.connect(fl); node = fl; }
    node.connect(g); g.connect(bus);
    o.start(t0); o.stop(t0 + d + 0.05);
  }
  function noise(bus, { t = 0, d = 0.05, v = 0.2, hp = 6000, lp = null }) {
    const t0 = ctx.currentTime + t;
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf; f.type = lp ? "lowpass" : "highpass"; f.frequency.value = lp || hp;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t0); s.stop(t0 + d + 0.02);
  }
  const chord = (bus, notes, opts) => notes.forEach((n, i) => tone(bus, { ...opts, f: hz(n), t: (opts.t || 0) + i * (opts.step || 0) }));

  // ---------- Effets sonores ----------
  const SFX = {
    click: () => { tone(sfxBus, { f: 880, to: 1320, d: 0.06, type: "triangle", v: 0.18 }); },
    pop: () => { tone(sfxBus, { f: 520, to: 980, d: 0.09, type: "sine", v: 0.25 }); },
    join: () => { chord(sfxBus, [72, 76, 79], { d: 0.16, type: "triangle", v: 0.2, step: 0.06 }); },
    leave: () => { chord(sfxBus, [72, 67], { d: 0.16, type: "triangle", v: 0.15, step: 0.07 }); },
    ready: () => { tone(sfxBus, { f: hz(79), d: 0.08, type: "square", v: 0.08, cut: 3000 }); tone(sfxBus, { f: hz(84), t: 0.07, d: 0.14, type: "square", v: 0.08, cut: 3000 }); },
    start: () => {
      noise(sfxBus, { d: 0.35, v: 0.12, lp: 1800 });
      chord(sfxBus, [60, 64, 67, 72], { d: 0.22, type: "sawtooth", v: 0.1, step: 0.07, cut: 2400 });
      tone(sfxBus, { f: hz(84), t: 0.3, d: 0.4, type: "triangle", v: 0.22 });
    },
    tick: () => { tone(sfxBus, { f: 1500, d: 0.035, type: "square", v: 0.06, cut: 4000 }); },
    tickUrgent: () => { tone(sfxBus, { f: 1900, d: 0.05, type: "square", v: 0.1, cut: 5000 }); tone(sfxBus, { f: 950, t: 0.0, d: 0.06, type: "sine", v: 0.12 }); },
    send: () => { tone(sfxBus, { f: 600, to: 1200, d: 0.12, type: "sine", v: 0.2 }); },
    correct: () => { chord(sfxBus, [76, 79, 84], { d: 0.18, type: "triangle", v: 0.24, step: 0.07 }); tone(sfxBus, { f: hz(88), t: 0.2, d: 0.3, type: "sine", v: 0.15 }); },
    wrong: () => { tone(sfxBus, { f: 300, to: 150, d: 0.28, type: "sawtooth", v: 0.12, cut: 1200 }); tone(sfxBus, { f: 220, to: 110, t: 0.08, d: 0.3, type: "square", v: 0.06, cut: 900 }); },
    points: () => { [0, 1, 2, 3].forEach((i) => tone(sfxBus, { f: hz(84 + i * 2), t: i * 0.045, d: 0.08, type: "square", v: 0.06, cut: 5000 })); tone(sfxBus, { f: hz(96), t: 0.2, d: 0.25, type: "sine", v: 0.14 }); },
    rankUp: () => { tone(sfxBus, { f: hz(72), to: hz(84), d: 0.25, type: "triangle", v: 0.2 }); },
    stop: () => { noise(sfxBus, { d: 0.25, v: 0.2, lp: 900 }); tone(sfxBus, { f: 180, to: 60, d: 0.3, type: "sine", v: 0.4 }); tone(sfxBus, { f: hz(81), t: 0.05, d: 0.2, type: "square", v: 0.08, cut: 2500 }); },
    hit: () => { noise(sfxBus, { d: 0.4, v: 0.3, lp: 700 }); tone(sfxBus, { f: 120, to: 40, d: 0.4, type: "sine", v: 0.45 }); },
    splash: () => { noise(sfxBus, { d: 0.3, v: 0.15, hp: 2500 }); },
    victory: () => {
      const seq = [[67, 0], [72, 0.12], [76, 0.24], [79, 0.36], [84, 0.52]];
      seq.forEach(([n, t]) => tone(sfxBus, { f: hz(n), t, d: 0.22, type: "square", v: 0.08, cut: 3500 }));
      chord(sfxBus, [72, 76, 79, 84], { t: 0.52, d: 1.2, type: "triangle", v: 0.12 });
      [0.6, 0.75, 0.9].forEach((t) => noise(sfxBus, { t, d: 0.12, v: 0.05 }));
    },
    end: () => { chord(sfxBus, [67, 64, 60], { d: 0.3, type: "triangle", v: 0.18, step: 0.12 }); chord(sfxBus, [60, 64, 67], { t: 0.4, d: 0.8, type: "sine", v: 0.1 }); },
  };
  const lastPlay = {};
  function play(name) {
    if (!unlocked || !ctx || prefs.muted || !prefs.sfx || !SFX[name]) return;
    const now = performance.now();
    if (now - (lastPlay[name] || 0) < 90) return; // pas de doublon simultané
    lastPlay[name] = now;
    try { SFX[name](); } catch {}
  }

  // ---------- Musiques (boucles générées) ----------
  // Progressions en demi-tons MIDI (accords de 3 notes) ; une mesure par accord.
  const PROG = {
    pop: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
    dream: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],
    drive: [[57, 60, 64], [57, 60, 64], [53, 57, 60], [55, 59, 62]],
  };
  const TRACKS = {
    home: { bpm: 92, prog: PROG.dream, arp: 1, drums: 0, pad: 1 },
    lobby: { bpm: 104, prog: PROG.pop, arp: 1, drums: 1, pad: 1 },
    calm: { bpm: 84, prog: PROG.dream, arp: 0, drums: 0, pad: 1 },
    play: { bpm: 112, prog: PROG.pop, arp: 2, drums: 1, pad: 0 },
    fast: { bpm: 136, prog: PROG.drive, arp: 2, drums: 2, pad: 0 },
  };
  let wantedTrack = null, current = null, timer = null, step = 0, nextT = 0;
  function startTrack(name) {
    if (!ctx || !unlocked) return;
    if (current === name && timer) return;
    stopTimer();
    current = name; step = 0; nextT = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 40);
  }
  function stopTimer() { clearInterval(timer); timer = null; }
  function schedule() {
    const tr = TRACKS[current];
    if (!tr || !ctx) return;
    if (!prefs.music || prefs.muted) { nextT = ctx.currentTime + 0.1; return; }
    const s16 = 60 / tr.bpm / 4;
    while (nextT < ctx.currentTime + 0.15) {
      const t = nextT - ctx.currentTime;
      const bar = Math.floor(step / 16) % tr.prog.length, pos = step % 16;
      const c = tr.prog[bar];
      if (tr.pad && pos === 0) c.forEach((n) => tone(musicBus, { f: hz(n), t, d: s16 * 15, type: "triangle", v: 0.05, a: 0.4, cut: 1400 }));
      if (pos % 8 === 0) tone(musicBus, { f: hz(c[0] - 24), t, d: s16 * (tr.drums ? 3 : 7), type: tr.drums ? "square" : "sine", v: tr.drums ? 0.07 : 0.12, cut: 600 });
      if (tr.drums === 2 && pos % 8 === 6) tone(musicBus, { f: hz(c[0] - 24), t, d: s16 * 1.5, type: "square", v: 0.05, cut: 600 });
      if (tr.arp && pos % (tr.arp === 2 ? 2 : 4) === 0) {
        const n = c[(pos / (tr.arp === 2 ? 2 : 4)) % 3] + 12 + (pos >= 8 && tr.arp === 2 ? 12 : 0);
        tone(musicBus, { f: hz(n), t, d: s16 * 1.6, type: tr.arp === 2 ? "square" : "triangle", v: tr.arp === 2 ? 0.025 : 0.05, cut: 2600 });
      }
      if (tr.drums) {
        if (pos % 4 === 2) noise(musicBus, { t, d: 0.03, v: 0.05 });
        if (pos === 0 || pos === 8 || (tr.drums === 2 && pos === 10)) tone(musicBus, { f: 150, to: 45, t, d: 0.16, type: "sine", v: 0.35 });
        if (tr.drums === 2 && (pos === 4 || pos === 12)) noise(musicBus, { t, d: 0.12, v: 0.09, lp: 2500 });
      }
      nextT += s16; step++;
    }
  }
  function music(name) {
    wantedTrack = name;
    if (!name) { stopTimer(); current = null; return; }
    if (unlocked) startTrack(name);
  }

  // ---------- Réglages ----------
  function set(k, v) {
    prefs[k] = v; save(); applyVolumes();
    if (k === "muted" || k === "music") { if (unlocked && wantedTrack && !timer) startTrack(wantedTrack); }
    listeners.forEach((fn) => fn(prefs));
  }
  return { play, music, set, get prefs() { return { ...prefs }; }, onChange: (fn) => listeners.add(fn), unlock };
})();
