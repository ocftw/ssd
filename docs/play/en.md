---
title: Cybersecurity Village · Adventure Game
description: Learn cybersecurity by playing! "Cybersecurity Village" is a fully offline 3D browser adventure: leave the village, find five security ruins, defeat the guardians and relight the defenses. After dawn, a whole daytime world and five side-practice stations turn passwords, phishing URLs, two-factor, backups and deepfakes into reflexes. No install, three languages, all linking back to the full ssd.ocf.tw materials.
share_image: https://ssd.ocf.tw/play/shots/og-play.jpg
hide:
  - navigation
  - toc
social:
  cards: false
---

<div class="play-narrow" hidden></div>

🌐 [正體中文](index.md)　·　[简体中文](zh-hans.md)　·　**English**

# 🎮 Cybersecurity Village · Adventure

![A relit personal-security ruin: an emerald energy crystal floating above the altar, a beam of light rising into the night sky](/play/shots/village-grove.webp){ loading=lazy }

**Learn to protect yourself — by playing.** The village was once guarded by five lines of security defense. Now those defenses have fallen, the world has lost its color and slipped into night. Your quest: leave the village, recover the five "security ruins" scattered across the wilderness, defeat their guardians and relight the defenses one by one, until the village shines again — and every defense maps to a whole set of hands-on security materials on the "Cybersecurity Village" site. And relighting all five defenses isn't the end: the world flips into daytime, and a series of side stations appears outside the village for you to keep practicing.

[▶ Play the game](/games/?utm_source=play&utm_medium=site&utm_campaign=village-game){ .md-button .md-button--primary }
[See how to level up your security](/how-to/){ .md-button }

!!! tip "No install — open and play"
    Play right in your browser: no download, no sign-up. Works on desktop, phone and tablet, and keeps running offline once loaded. The interface supports **正體中文 / 简体中文 / English** and switches automatically to your device language.

!!! success "📣 In-person forum on 7/20 — free, registration open"
    Finished the game and want to talk security with real people and harden your defenses further? The Open Culture Foundation is hosting a free in-person forum in Taipei, **"Civil Society's Digital Front Line: Facing Digital Threats Together"** (held in Chinese), presenting two research reports on the digital security of civil-society groups and bringing together security researchers, practitioners and policy experts to safeguard the digital resilience of civil society.

    - 📅 **Mon 2026/7/20, 14:30–17:10** (check-in from 14:00)
    - 📍 BEONE VISION SPACE (B1, No. 200, Sec. 1, Keelung Rd., Xinyi Dist., Taipei)
    - 💵 **Free entry, registration required**

    [Register now →](https://ocftw.kktix.cc/events/2026digitalfronline?utm_source=play&utm_medium=site&utm_campaign=digitalfron2026){ .md-button .md-button--primary }

## Screenshots

<div class="shots" data-carousel>
  <div class="shots__track">
    <figure><img src="/play/shots/ruin-fortress.webp" alt="Organization-security ruin: a blue defense beam rising from the center of a stone fortress" loading="lazy"><figcaption>Defeat the guardian and the ruin raises a beam of defense</figcaption></figure>
    <figure><img src="/play/shots/gameplay.webp" alt="Actual gameplay: the hero explores with a lantern, a rotating minimap in the bottom-right" loading="lazy"><figcaption>Lantern in hand: the HUD and a minimap that rotates with the camera</figcaption></figure>
    <figure><img src="/play/shots/world-night.webp" alt="The world at night: the five defenses fallen, the land drained of color, faint glimmers of ruins in the distance" loading="lazy"><figcaption>The world at night: defenses fallen, the land colorless</figcaption></figure>
    <figure><img src="/play/shots/ruin-night.webp" alt="A security ruin at night: an energy crystal glowing above the altar, a beam rising into the sky" loading="lazy"><figcaption>A ruin sleeping in the wilderness, waiting to be relit</figcaption></figure>
    <figure><img src="/play/shots/battle-slime.webp" alt="Ruin guardian battle: type a strong password below to repel the guardian" loading="lazy"><figcaption>Guardian battle: answer with what you've learned (typing challenge)</figcaption></figure>
    <figure><img src="/play/shots/battle-ghost.webp" alt="Ruin guardian battle: pick the correct security practice from the options to repel the guardian" loading="lazy"><figcaption>Different ruins, different guardians and questions (multiple choice)</figcaption></figure>
    <figure><img src="/play/shots/questlog.webp" alt="Quest-log panel: an overview of exploration and battle progress across the five ruins" loading="lazy"><figcaption>Quest log: progress across all five ruins at a glance</figcaption></figure>
    <figure><img src="/play/shots/achievements.webp" alt="Achievement badge wall: unlocked and locked exploration achievements" loading="lazy"><figcaption>Achievement wall: your trail of exploring and learning</figcaption></figure>
    <figure><img src="/play/shots/village-grove.webp" alt="A relit personal-security ruin: an emerald energy crystal floating above the altar" loading="lazy"><figcaption>A relit security ruin: the energy crystal</figcaption></figure>
    <figure><img src="/play/shots/village-day.webp" alt="The daytime village after clearing the game: greenery, a market and villagers coming back to life" loading="lazy"><figcaption>With all five defenses repaired, the village sees daylight again</figcaption></figure>
    <figure><img src="/play/shots/finale.webp" alt="Victory screen: the Hero's Code scroll, five ruin badges and collected insight shards" loading="lazy"><figcaption>Victory: the Hero's Code and shareable results</figcaption></figure>
    <figure><img src="/play/shots/minigame.webp" alt="Hidden easter-egg minigame 'Blade Survivor': move to dodge monsters while the blade swings automatically" loading="lazy"><figcaption>Hidden easter-egg minigame "Blade Survivor"</figcaption></figure>
  </div>
  <button class="shots__nav shots__prev" type="button" aria-label="Previous">‹</button>
  <button class="shots__nav shots__next" type="button" aria-label="Next">›</button>
  <div class="shots__dots" aria-hidden="true"></div>
</div>

<script>
(function () {
  var root = document.querySelector('.shots[data-carousel]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  root.classList.add('is-enhanced');
  var track = root.querySelector('.shots__track');
  var slides = Array.prototype.slice.call(track.querySelectorAll('figure'));
  var dotsWrap = root.querySelector('.shots__dots');
  var idx = 0;
  var dots = slides.map(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Slide ' + (i + 1));
    b.addEventListener('click', function () { go(i, true); });
    dotsWrap.appendChild(b);
    return b;
  });
  function setActive(i) { idx = i; dots.forEach(function (d, j) { d.classList.toggle('is-active', j === i); }); }
  function go(i, smooth) {
    i = (i + slides.length) % slides.length;
    var left = track.scrollLeft + slides[i].getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollTo({ left: left, behavior: smooth ? 'smooth' : 'auto' });
    setActive(i);
  }
  root.querySelector('.shots__prev').addEventListener('click', function () { go(idx - 1, true); });
  root.querySelector('.shots__next').addEventListener('click', function () { go(idx + 1, true); });
  var raf;
  track.addEventListener('scroll', function () {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var c = track.scrollLeft + track.clientWidth / 2, best = 0, bd = Infinity;
      slides.forEach(function (s, j) {
        var mid = s.offsetLeft - track.offsetLeft + s.clientWidth / 2, d = Math.abs(mid - c);
        if (d < bd) { bd = d; best = j; }
      });
      setActive(best);
    });
  }, { passive: true });
  setActive(0);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timer = null;
  function play() { if (reduce || timer) return; timer = setInterval(function () { go(idx + 1, true); }, 5000); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  ['mouseenter', 'focusin', 'touchstart', 'pointerdown'].forEach(function (ev) { root.addEventListener(ev, stop, { passive: true }); });
  ['mouseleave', 'focusout'].forEach(function (ev) { root.addEventListener(ev, play); });
  if (!reduce) play();
})();
</script>

## What you'll learn

The game gets you started; the complete, step-by-step material lives on the "Cybersecurity Village" site:

<div class="grid cards" markdown>

-   🏠 **Personal security**

    ---

    Phone and computer protection, account security, safe browsing, encrypted communication, travel abroad.

    [Go to materials →](/personal/)

-   🏢 **Organization security**

    ---

    Work devices, networks, account and permission management, data backups and security policy.

    [Go to materials →](/org/)

-   🚨 **Common security incidents**

    ---

    What to do in the moment during phishing, ransomware, password leaks and account takeovers.

    [Go to materials →](/common/)

-   🛠️ **Recommended security tools**

    ---

    Password managers, authenticators, VPNs and the 3‑2‑1 backup strategy.

    [Go to materials →](/tools/)

-   🧰 **Security upgrade toolkit**

    ---

    Take stock, assess risk, audit devices, use policy templates — and track your security-upgrade progress step by step.

    [Go to materials →](/guide/)

</div>

## 🎡 How much is hidden in the game

This isn't just a single "clear-it-and-done" line. Once you step into the village, you can —

- **🗺️ Trace and relight**: leave the village and recover the **five security ruins** in the wild, each watched by a guardian; answer with what you learned in the lessons to strike back and relight all five defenses.
- **🧠 Situational challenges**: battles aren't only multiple choice — you'll also face **phishing-email spotting**, **real-vs-fake URL busting**, **live password strength** and **deepfake-call verification**, making calls as if it were really happening, with an explanation each time.
- **🌅 Daytime world**: with all five defenses in place, the world flips from night to day — flower fields bloom, rainbows, hot-air balloons and sailboats appear, wildlife awakens, and the village sees daylight again.
- **🎣 Lakeside phishing catch**: stand on the dock and reel in letters one by one, deciding whether each is phishing or legitimate — building your instinct for suspicious mail.
- **💎 Collectibles and achievements**: pick up scattered **sun shards** (each a security tip you can take with you), **snap photos** at scenic spots for your album, and unlock a whole **wall of achievement badges**.
- **📚 Archive room**: browse three real research reports on digital threats and the results of a security-companion program.
- **🕵️ Free exploration**: want to head straight into daytime? Add `?explore=1` to the URL, or tap "☀️ Free-roam in daylight" on the start screen to skip the quests and just play.
- **🗡️ Hidden easter egg**: a standalone 2D minigame, "Blade Survivor," is hidden at the edge of the world, waiting to be found.

### 🛠️ Five side-practice stations after dawn

By day, five little stations appear outside the village, each pulling out one of the most practical security skills to drill on its own — turning good habits into reflexes as you play, each with its own achievement badge:

<div class="grid cards" markdown>

-   🔨 **Password Forge**

    ---

    Type, and the strength-forge glows brighter as you go — hand-forge a passphrase that's long and hard to guess, yet easy to remember.

    [Learn password setup →](/personal/)

-   🔍 **URL Hunter Arena**

    ---

    A row of near-identical URLs, only one is the real official site — understand the "main domain" and you'll spot the impostor.

    [Learn to spot phishing →](/common/)

-   🔐 **Two-Lock Sealing Rite**

    ---

    The core of two-factor and passkeys: pick "two locks of different kinds," and don't let both locks actually be the same kind.

    [Learn account protection →](/personal/)

-   💧 **Backup Spring 3‑2‑1**

    ---

    Line up 3 copies, on 2 kinds of media, with 1 off-site — so even a disaster can't take your important files.

    [Learn backup strategy →](/tools/)

-   🎭 **Deepfake Arena**

    ---

    AI can clone a voice and swap a face. A call urgently asking you to wire money — do as told, or verify first?

    [Learn how to respond →](/common/)

</div>

## How to play

- **Move**: on a computer use `WASD` or the arrow keys; on phone or tablet use the on-screen touch joystick.
- **Explore**: leave the village and follow the minimap (it rotates with the camera) to find the ruins and landmarks scattered around.
- **Clear challenges**: walk up to a ruin and interact with its guardian; use what you learned in the lessons to pass, relighting all five defenses one by one.
- **Complete**: repair all five defenses and the village lights up again — don't forget to share your results.
- **Drill**: after dawn, the five side stations outside the village let you practice passwords, URLs, two-factor, backups and deepfake defense on their own, each earning an achievement badge.
- **Jump straight to daytime**: add `?explore=1` to the URL, or tap "☀️ Free-roam in daylight" on the start screen to skip the quests and explore the daytime world directly.

!!! info "What devices can I play on?"
    This is a 3D game rendered live in your browser, with almost no special requirements:

    - **Browser**: any modern browser with WebGL2 and ES modules: Chrome/Edge 89+, Firefox 108+, Safari 16.4+ (iPhone/iPad need iOS/iPadOS 16.4+). Roughly "a browser updated within the last three years."
    - **Desktop, phone and tablet all work**: desktop uses keyboard + mouse; phone and tablet show a touch joystick automatically.
    - **Network**: only the first load needs a connection (about 4 MB, including the Three.js library and textures); after that it keeps working offline.
    - **Performance**: it runs on ordinary integrated graphics. On older or slower devices, set the quality to "Lite" on the start screen; quality has three levels — Auto / Lite / Rich — and defaults to auto-adjusting per device.
    - **You don't need**: to install, register or log in, and it leaves no personal data on your device.

## Who it's for

- **Civil-society organizations (CSOs) / NGOs**: as an icebreaker for security training, or a "clear-it-at-home" assignment after a workshop.
- **Individuals**: approachable even with no security background — build the basics as you play.
- **Anyone promoting security**: free and openly licensed (CC‑BY 4.0), so use it freely in courses, groups and events.

??? note "🛠️ How this game was built (for those who want to make their own)"
    The whole world is rendered live in the browser with [Three.js](https://threejs.org/) — no game engine, no bundler, no external CDN. If you'd like to build a similar little game, here are the key practices we think are worth sharing:

    - **No build step, just open and run**: load Three.js directly with the browser's native ES modules + an import map (r184, fully self-hosted under `vendor/`). The whole project is one HTML file plus a few `.js` files — no webpack/vite-style bundler needed.
    - **InstancedMesh for lots of vegetation**: thousands of trees, shrubs and rocks would tank performance if each were drawn separately; `InstancedMesh` draws all copies of the same object in "one draw call," which is key to staying smooth.
    - **We took WebGPU seriously**: we also built a [WebGPU trial/eval page](/games/webgpu.html) that picks WebGPU automatically, falls back to WebGL2 if unsupported, and shows the active backend, FPS and draw calls live. The conclusion: the game already keeps draw calls very low via InstancedMesh, so under real load WebGL2 holds a steady full refresh rate; you'd only see WebGPU's edge by pushing stress far beyond what the game needs. Plus WebGL2 is more widely supported on phones and across browsers (especially iOS/Safari), so the shipping game meets the bar on WebGL2 and doesn't require WebGPU.
    - **Terrain by function, not image**: ground relief is computed live by a height function, then painted as sand/grass/rock via vertex colors — saving a heightmap texture.
    - **Soft water edges**: the coast uses a pre-baked "distance from shore" texture to fade the water's transparency, avoiding flicker (z-fighting) where ground meets water.
    - **One parameter drives day and night**: a single "vibrancy" value (0 night → 1 day) drives lighting, color grading, mountain relief, the minimap and the UI palette all at once; change one value and the whole world follows.
    - **Post-processing that ages well**: `EffectComposer` chains Bloom (so crystals and beams glow), color grading and anti-aliasing, toggled automatically by device performance.
    - **Text inside the 3D scene**: ruin nameplates and NPC speech bubbles use `CSS2DRenderer`, putting HTML/CSS to work as labels in the 3D world; the minimap is a separate 2D canvas that rotates with the camera.
    - **Character animation without a skeleton**: the hero's walking, jumping and double-jump spin come from rotating limb joints live in code — no imported skeletal animation files, so it stays small and controllable.
    - **Saves via localStorage**: exploration and battle progress live in the browser locally, still there after you close and reopen — no backend server needed.
    - **Mobile-friendly**: a pixel-ratio clamp plus quality tiers avoid blowing out fill-rate on high-resolution screens.
    - **The easter egg is a standalone 2D minigame**: "Blade Survivor" is a separate 2D canvas, fully decoupled from the 3D main world so neither affects the other's performance.

    The whole game runs offline with no external dependencies and is open-sourced under CC‑BY 4.0. [The source is on GitHub](https://github.com/ocftw/ssd) — take it apart and build your own version.

## About this game

Made by the [Open Culture Foundation (OCF)](https://ocf.tw/), this is a companion experiment for the "Cybersecurity Village" learning site. The whole world is rendered live in the browser with Three.js, runs fully offline with no external dependencies, and is [open-sourced on GitHub](https://github.com/ocftw/ssd) alongside the site.

[▶ Enter the village](/games/?utm_source=play&utm_medium=site&utm_campaign=village-game){ .md-button .md-button--primary }
