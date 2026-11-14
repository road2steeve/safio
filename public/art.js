// ======== SAFIO – illustrations originales (SVG) et fiches des jeux ========
const AV_COLORS = ["#7c5cff", "#22d3c5", "#3b82f6", "#ff6b6b", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6", "#06b6d4", "#f97316"];

// players : nombre de joueurs conseillé ; mins : durée moyenne ; tags : catégories de l'accueil
// diff : difficulté affichée sur la carte (1 facile, 2 moyen, 3 corsé)
const GAME_META = {
  quiz: { players: "1–16", mins: "10", diff: 2, tags: ["popular", "friends"], c1: "#3b82f6", c2: "#22d3c5" },
  mytho: { players: "2–12", mins: "15", diff: 2, tags: ["popular", "friends"], c1: "#8b5cf6", c2: "#ec4899" },
  bac: { players: "1–16", mins: "15", diff: 1, tags: ["popular", "friends"], c1: "#14b8a6", c2: "#3b82f6" },
  duel: { players: "2–30", mins: "3", diff: 2, tags: ["popular", "quick"], c1: "#f59e0b", c2: "#ef4444" },
  brain: { players: "2–30", mins: "10", diff: 1, tags: ["new", "friends"], c1: "#ec4899", c2: "#f97316" },
  youre: { players: "3–30", mins: "10", diff: 1, tags: ["friends", "quick"], c1: "#f97316", c2: "#f43f5e" },
  closest: { players: "1–30", mins: "8", diff: 2, tags: ["new", "quick"], c1: "#eab308", c2: "#22c55e" },
  torpille: { players: "2–8", mins: "15", diff: 3, tags: ["new"], c1: "#0ea5e9", c2: "#6366f1" },
  blindtest: { players: "2–30", mins: "15", diff: 2, tags: ["new", "popular", "friends"], c1: "#d946ef", c2: "#7c3aed" },
};

const ART = (() => {
  const wrap = (id, inner) => {
    const m = GAME_META[id];
    return `<svg viewBox="0 0 240 150" class="art" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m.c1}"/><stop offset="1" stop-color="${m.c2}"/></linearGradient>
      <radialGradient id="s-${id}" cx=".2" cy=".1" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <rect width="240" height="150" fill="url(#g-${id})"/><rect width="240" height="150" fill="url(#s-${id})"/>
      <g opacity=".14" fill="#fff"><circle cx="210" cy="22" r="40"/><circle cx="18" cy="140" r="34"/></g>
      ${inner}</svg>`;
  };
  return {
    quiz: wrap("quiz", `
      <g transform="translate(120 78)">
        <circle r="38" fill="#fff8d6"/><circle r="38" fill="#ffe066" opacity=".9"/>
        <path d="M-14 30h28v10a6 6 0 0 1-6 6h-16a6 6 0 0 1-6-6z" fill="#1e2a5a"/>
        <path d="M-10 4c0-12 20-12 20 0 0 7-8 8-8 15h-4c0-9 8-10 8-15 0-6-12-6-12 0z" fill="#1e2a5a"/><circle cy="26" r="3" fill="#1e2a5a" transform="translate(0 -2)"/>
      </g>
      <text x="48" y="58" font-size="34" font-weight="800" fill="#fff" transform="rotate(-14 48 58)">?</text>
      <text x="180" y="120" font-size="28" font-weight="800" fill="#fff" opacity=".85" transform="rotate(12 180 120)">?</text>
      <text x="190" y="64" font-size="18" font-weight="800" fill="#fff" opacity=".7">!</text>`),
    mytho: wrap("mytho", `
      <g transform="translate(92 76) rotate(-10)">
        <path d="M-34-30h68v30c0 24-16 38-34 38s-34-14-34-38z" fill="#fff"/>
        <circle cx="-13" cy="-8" r="6" fill="#2b1b5a"/><circle cx="13" cy="-8" r="6" fill="#2b1b5a"/>
        <path d="M-16 12q16 16 32 0" stroke="#2b1b5a" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <g transform="translate(150 70) rotate(12)">
        <path d="M-30-28h60v28c0 22-14 34-30 34s-30-12-30-34z" fill="#ffd1e8"/>
        <path d="M-19-10l10 4M19-10l-10 4" stroke="#2b1b5a" stroke-width="5" stroke-linecap="round"/>
        <path d="M-13 20q13-12 26 0" stroke="#2b1b5a" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <path d="M40 118q10-10 20 0t20 0" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/>`),
    bac: wrap("bac", `
      ${["A", "B", "C"].map((l, i) => `<g transform="translate(${62 + i * 54} ${70 + (i % 2) * 10}) rotate(${[-10, 4, 12][i]})">
        <rect x="-24" y="-24" width="48" height="48" rx="12" fill="#fff"/><rect x="-24" y="16" width="48" height="8" rx="4" fill="#000" opacity=".08"/>
        <text y="12" text-anchor="middle" font-size="32" font-weight="800" fill="${["#0f766e", "#1d4ed8", "#0f766e"][i]}">${l}</text></g>`).join("")}
      <g transform="translate(196 118) rotate(-35)"><rect x="-36" y="-6" width="64" height="12" rx="3" fill="#ffd166"/><path d="M28-6l12 6-12 6z" fill="#f4c095"/><rect x="-42" y="-6" width="8" height="12" rx="2" fill="#ff6b9a"/></g>`),
    duel: wrap("duel", `
      <g opacity=".55" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M22 52h46M14 74h52M26 96h40"/></g>
      <path d="M134 14L84 84h34l-14 54 56-76h-36z" fill="#fff6c2" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="190" cy="50" r="16" fill="none" stroke="#fff" stroke-width="5"/><path d="M190 42v9l6 4" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>`),
    brain: wrap("brain", `
      <g transform="translate(78 64)"><path d="M-40-26h80a12 12 0 0 1 12 12v30a12 12 0 0 1-12 12H-14l-16 14v-14h-10a12 12 0 0 1-12-12v-30a12 12 0 0 1 12-12z" fill="#fff"/>
        <path d="M0 18c-16-10-20-24-10-30 5-3 10 0 10 5 0-5 5-8 10-5 10 6 6 20-10 30z" fill="#ff4d8d"/></g>
      <g transform="translate(166 86)"><path d="M40-26h-80a12 12 0 0 0-12 12v30a12 12 0 0 0 12 12h26l16 14v-14h38a12 12 0 0 0 12-12v-30a12 12 0 0 0-12-12z" fill="#fff"/>
        <path d="M0 18c-16-10-20-24-10-30 5-3 10 0 10 5 0-5 5-8 10-5 10 6 6 20-10 30z" fill="#ff4d8d"/></g>
      <text x="122" y="138" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">=</text>`),
    youre: wrap("youre", `
      ${[[60, 98, "#fde68a"], [120, 104, "#bfdbfe"], [180, 98, "#fbcfe8"]].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><circle r="22" fill="${c}"/><circle cx="-7" cy="-3" r="3" fill="#3b2a1a"/><circle cx="7" cy="-3" r="3" fill="#3b2a1a"/><path d="M-7 8q7 6 14 0" stroke="#3b2a1a" stroke-width="3" fill="none" stroke-linecap="round"/></g>`).join("")}
      <path d="M108 52l6-18 6 12 6-14 6 14 6-12 6 18z" fill="#ffd34d" stroke="#fff" stroke-width="3" stroke-linejoin="round" transform="translate(-6 26)"/>
      <path d="M40 40q20-24 54 4" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="2 10"/>
      <path d="M200 40q-20-24-54 4" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="2 10"/>`),
    closest: wrap("closest", `
      <g transform="translate(110 80)">${[44, 32, 20, 8].map((r, i) => `<circle r="${r}" fill="${i % 2 ? "#fff" : "#ff5c7a"}"/>`).join("")}</g>
      <g transform="translate(112 78) rotate(-35)"><rect x="0" y="-3" width="74" height="6" rx="3" fill="#1e293b"/><path d="M74-10l18 10-18 10z" fill="#ffd166" transform="rotate(180 83 0) translate(-18 0)"/><path d="M-8 0l10-5v10z" fill="#1e293b"/></g>
      <text x="196" y="132" font-size="22" font-weight="800" fill="#fff" text-anchor="middle">≈</text>`),
    torpille: wrap("torpille", `
      <g opacity=".35" stroke="#fff" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${30 + i * 30} 20v116M30 ${20 + i * 19.3}h180"/>`).join("")}</g>
      <g transform="translate(96 92)"><path d="M-46 0h92l-14 18h-64z" fill="#fff"/><rect x="-18" y="-18" width="30" height="18" rx="3" fill="#e0f2fe"/><rect x="2" y="-30" width="6" height="14" fill="#fff"/></g>
      <g transform="translate(182 48)"><circle r="14" fill="#ff5c7a"/><path d="M0-26v-6M0 26v6M-26 0h-6M26 0h6M-18-18l-4-4M18 18l4 4M18-18l4-4M-18 18l-4 4" stroke="#ffd166" stroke-width="4" stroke-linecap="round"/></g>
      <path d="M30 130q15-8 30 0t30 0 30 0 30 0 30 0 30 0" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/>`),
    blindtest: wrap("blindtest", `
      <g transform="translate(86 78)"><circle r="50" fill="#140a2e"/>${[42, 34, 26].map((r) => `<circle r="${r}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="2"/>`).join("")}
        <circle r="15" fill="#ffd34d"/><circle r="3.5" fill="#140a2e"/><path d="M-30-30a42 42 0 0 1 28-12" stroke="#fff" stroke-opacity=".5" stroke-width="4" fill="none" stroke-linecap="round"/></g>
      <g fill="#fff">${[0, 1, 2, 3, 4].map((i) => `<rect x="${150 + i * 14}" y="${118 - [30, 52, 40, 62, 26][i]}" width="9" height="${[30, 52, 40, 62, 26][i]}" rx="4.5" opacity="${0.6 + i * 0.08}"/>`).join("")}</g>
      <g transform="translate(166 34) rotate(12)" fill="#fff"><path d="M0 0v26a7 6 0 1 1-4-5V4l22-5v20a7 6 0 1 1-4-5V3z"/></g>
      <g transform="translate(30 30) rotate(-14)" fill="#ffd34d"><path d="M0 0v18a6 5 0 1 1-4-4V-2l3-1z"/></g>`),
  };
})();

const LOGO_SVG = `<svg viewBox="0 0 64 64" class="logo-mark" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset=".55" stop-color="#3b82f6"/><stop offset="1" stop-color="#22d3c5"/></linearGradient></defs>
  <rect x="4" y="10" width="56" height="44" rx="18" fill="url(#lg)"/><circle cx="21" cy="32" r="6" fill="#fff"/><path d="M17 32h8M21 28v8" stroke="#7c5cff" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="41" cy="28" r="3.4" fill="#ff7a6b"/><circle cx="47" cy="34" r="3.4" fill="#fff"/><circle cx="41" cy="40" r="3.4" fill="#ffd34d"/><circle cx="35" cy="34" r="3.4" fill="#fff" opacity=".7"/></svg>`;
