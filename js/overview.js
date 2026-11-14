/* Overview page and page-wide effects:
   - a custom cursor: dot + trailing ring that wraps buttons and labels media, plus a card spotlight (every tab)
   - water ripples on the hero photo, a layered hero collage that moves with the mouse
   - fade-in on scroll, videos that play only when visible, and the 3D card terminal. */
(function () {
  const D = window.D;
  const ov = document.getElementById('overview');
  if (!ov || !window.IntersectionObserver) return;
  const isOv = () => D.tab === 'overview';
  const now = () => performance.now() / 1000;

  /* intro, headline words, counters */
  function split(el, d0) {
    if (!el || el.dataset.split) return;
    el.dataset.split = '1'; el.classList.remove('rv');
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.append(tok); return; }
          const w = document.createElement('span'); w.className = 'w';
          const sp = document.createElement('span'); sp.textContent = tok; sp.style.setProperty('--i', i++);
          w.append(sp); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el); el.classList.add('split');
    if (d0) el.style.setProperty('--d0', d0 + 'ms');
  }
  const h1 = ov.querySelector('.hero h1'); split(h1, 0);
  const heads = [...ov.querySelectorAll('.sec-h h2, .vband h2, .secure2 h2')];
  heads.forEach((h) => split(h));
  const hio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('go'); hio.unobserve(e.target); } }), { threshold: 0.3 });
  heads.forEach((h) => hio.observe(h));
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now();
    (function step(t) { const k = Math.min(1, (t - t0) / 1400), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = v.toLocaleString() + suf; if (k < 1) requestAnimationFrame(step); })(t0);
  }), { threshold: 0.6 });
  let heroGo = false;
  function startHero() {
    if (heroGo) return; heroGo = true;
    requestAnimationFrame(() => { if (h1) h1.classList.add('go'); });
    ov.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));
  }
  const intro = document.getElementById('intro');
  if (intro) {
    let seenIntro = false;
    try { seenIntro = sessionStorage.getItem('c2d-intro') === '1'; sessionStorage.setItem('c2d-intro', '1'); } catch (e) { /* private window */ }
    if (!isOv() || seenIntro) { intro.remove(); startHero(); }
    else {
      const finish = () => { if (!intro.isConnected || intro.classList.contains('done')) return; intro.classList.add('done'); setTimeout(startHero, 250); setTimeout(() => intro.remove(), 1000); };
      intro.addEventListener('click', finish); setTimeout(finish, 1500);
    }
  } else startHero();

  /* fade in on scroll */
  const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach((el) => rio.observe(el));

  /* videos */
  const vids = [...ov.querySelectorAll('video')];
  const seen = new Set();
  const vio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); syncVideos(); }), { threshold: 0.15 });
  vids.forEach((v) => { v.muted = true; vio.observe(v); });
  function syncVideos() {
    vids.forEach((v) => {
      const want = isOv() && !document.hidden && seen.has(v);
      if (want && v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      if (!want && !v.paused) v.pause();
    });
  }

  /* hero phone */
  const hp = document.getElementById('heroPhone');
  if (hp && D.custPhone) { try { hp.innerHTML = D.custPhone(); } catch (e) { /* phone is decorative */ } }
  const hpScreen = hp && hp.querySelector('.screen');
  if (hpScreen) hpScreen.insertAdjacentHTML('beforeend', '<div class="hp-push"><span class="ic"><svg viewBox="0 0 32 32"><path d="M16 4a3 3 0 0 1 3 3c0 1.3-.8 2.1-1.7 2.7-.7.5-1.3.9-1.3 1.8v1l11.4 7.6c1.6 1.1.8 3.6-1.1 3.6H5.7c-1.9 0-2.7-2.5-1.1-3.6L16 12.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span><b>Your order is ready</b>No. 1042 is on rack B-14. Pay now or book a delivery.</span></div>');

  /* custom cursor */
  (function cursor() {
    if (!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
    const ring = document.createElement('div'); ring.className = 'cur-ring'; ring.setAttribute('aria-hidden', 'true'); ring.innerHTML = '<b></b>';
    const dot = document.createElement('div'); dot.className = 'cur-dot'; dot.setAttribute('aria-hidden', 'true');
    document.body.append(ring, dot); document.documentElement.classList.add('has-cur');
    const lab = ring.firstChild;
    const SNAP = '.btn,.tab,.sw,.vb-btn,.app-nav button';
    const BIG = [['.hero-media', '', 'water'], ['.stage', 'Rotate', 'label'], ['.bt', 'Open', 'label'], ['.tile', 'Open', 'label'], ['.step', 'Watch', 'label'], ['.vband', 'Watch', 'label'], ['.mq-row figure', 'View', 'label']];
    const SPOT = '.step,.route,.bt,.plan,.panel,.tile,.term3,.card';
    let mx = -100, my = -100, rx = -100, ry = -100, rw = 34, rh = 34, rr = 17, tw = 34, th = 34, trr = 17, tx = -100, ty = -100;
    let mode = '', snapEl = null, on = false, down = 0, sc = 1;
    const radius = new WeakMap();
    function setMode(m, text) { if (m !== mode) { if (mode) ring.classList.remove(mode); if (m) ring.classList.add(m); mode = m; } lab.textContent = text || ''; dot.style.opacity = m === 'label' || m === 'snap' || m === 'water' ? '0' : ''; }
    function release() { if (snapEl) { snapEl.style.translate = ''; snapEl = null; } }
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!on) { on = true; rx = tx = mx; ry = ty = my; ring.classList.add('on'); dot.classList.add('on'); }
      const t = e.target;
      const sp = t.closest && t.closest(SPOT);
      if (sp) { const r = sp.getBoundingClientRect(); sp.style.setProperty('--mx', (mx - r.left) + 'px'); sp.style.setProperty('--my', (my - r.top) + 'px'); }
      if (t.closest && t.closest('input,textarea,select')) { release(); setMode('text'); tw = th = 6; trr = 3; tx = mx; ty = my; return; }
      const s = t.closest && t.closest(SNAP);
      if (s && !s.disabled) {
        const r = s.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (snapEl !== s) { release(); snapEl = s; }
        s.style.translate = `${((mx - cx) * 0.16).toFixed(1)}px ${((my - cy) * 0.22).toFixed(1)}px`;
        if (!radius.has(s)) radius.set(s, parseFloat(getComputedStyle(s).borderTopLeftRadius) || 8);
        tw = r.width + 12; th = r.height + 12; trr = radius.get(s) + 6; tx = cx + (mx - cx) * 0.2; ty = cy + (my - cy) * 0.25;
        setMode('snap'); return;
      }
      release();
      for (const [sel, text, m] of BIG) {
        if (t.closest && t.closest(sel)) { tw = th = m === 'water' ? 58 : 84; trr = tw / 2; tx = mx; ty = my; setMode(m, text); return; }
      }
      tw = th = 34; trr = 17; tx = mx; ty = my; setMode('');
    }, { passive: true });
    window.addEventListener('pointerdown', () => { down = 1; });
    window.addEventListener('pointerup', () => { down = 0; });
    document.documentElement.addEventListener('mouseleave', () => { on = false; ring.classList.remove('on'); dot.classList.remove('on'); release(); });
    window.addEventListener('scroll', () => { if (snapEl) { release(); setMode(''); tw = th = 34; trr = 17; tx = mx; ty = my; } }, { passive: true });
    (function loop() {
      requestAnimationFrame(loop);
      if (!on) return;
      const k = mode === 'snap' ? 0.26 : 0.2;
      rx += (tx - rx) * k; ry += (ty - ry) * k; rw += (tw - rw) * 0.22; rh += (th - rh) * 0.22; rr += (trr - rr) * 0.22; sc += ((down ? 0.86 : 1) - sc) * 0.3;
      ring.style.transform = `translate3d(${(rx - rw / 2).toFixed(1)}px,${(ry - rh / 2).toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
      ring.style.width = rw.toFixed(1) + 'px'; ring.style.height = rh.toFixed(1) + 'px'; ring.style.borderRadius = rr.toFixed(1) + 'px';
      dot.style.transform = `translate3d(${mx - 3}px,${my - 3}px,0)`;
    })();
  })();

  /* hero parallax */
  const hero = document.getElementById('hero');
  const layers = [...hero.querySelectorAll('.layer')];
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width - 0.5, my = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach((l) => { const d = +l.dataset.depth || 10; l.style.transform = `translate3d(${(-mx * d).toFixed(1)}px,${(-my * d).toFixed(1)}px,0) rotateY(${(mx * d / 10).toFixed(2)}deg) rotateX(${(-my * d / 14).toFixed(2)}deg)`; });
  }, { passive: true });
  hero.addEventListener('pointerleave', () => layers.forEach((l) => { l.style.transform = ''; }));

  /* ripples */
  const rcv = document.getElementById('ripple');
  const ripple = makeRipple(rcv, window.HERO_IMG || 'assets/images/hero.jpg');
  let heroSeen = true;
  new IntersectionObserver((es) => { heroSeen = es[0].isIntersecting; if (ripple) ripple.wake(); }, { threshold: 0 }).observe(hero);

  function makeRipple(canvas, src) {
    let gl;
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false }); } catch (e) { gl = null; }
    if (!gl) { canvas.style.display = 'none'; return null; }
    const N = 32;
    const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    const FS = `precision highp float;
      varying vec2 v; uniform sampler2D tex; uniform vec2 res; uniform vec2 img; uniform float time; uniform vec4 drops[${N}];
      void main(){
        vec2 px = vec2(v.x, 1.0 - v.y) * res;
        vec2 disp = vec2(0.0); float shade = 0.0;
        for (int i = 0; i < ${N}; i++) {
          vec4 d = drops[i];
          float age = time - d.z;
          if (d.w <= 0.0 || age < 0.0 || age > 3.2) continue;
          vec2 dv = px - d.xy; float dist = length(dv);
          float x = dist - age * 230.0;
          float env = exp(-x * x / 2400.0) * exp(-age * 1.3) * d.w;
          float w = sin(x * 0.1) * env;
          disp += (dist > 0.001 ? dv / dist : vec2(0.0)) * w;
          shade += cos(x * 0.1) * env;
        }
        vec2 uv = vec2(v.x, 1.0 - v.y);
        float ra = res.x / res.y, ia = img.x / img.y;
        if (ra > ia) { float s = ia / ra; uv.y = uv.y * s + (1.0 - s) * 0.5; } else { float s = ra / ia; uv.x = uv.x * s + (1.0 - s) * 0.5; }
        uv += disp * 24.0 / res;
        vec3 c = texture2D(tex, clamp(uv, 0.001, 0.999)).rgb;
        c += shade * 0.07;
        gl_FragColor = vec4(c, 1.0);
      }`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    let prog;
    try { prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); } catch (e) { canvas.style.display = 'none'; return null; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const uRes = U('res'), uImg = U('img'), uTime = U('time'), uDrops = U('drops');
    const drops = new Float32Array(N * 4); let di = 0;
    const tex = gl.createTexture();
    let ready = false, imgW = 16, imgH = 9, raf = 0, lastActive = 0, cw = 1, ch = 1;
    const image = new Image();
    image.onload = () => {
      try {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        imgW = image.naturalWidth; imgH = image.naturalHeight; ready = true; size(); wake();
      } catch (e) { canvas.style.display = 'none'; }
    };
    image.onerror = () => { canvas.style.display = 'none'; };
    image.src = src;
    function size() { const r = canvas.getBoundingClientRect(); if (!r.width) return; const k = Math.min(1.5, window.devicePixelRatio || 1); cw = r.width; ch = r.height; canvas.width = Math.round(cw * k); canvas.height = Math.round(ch * k); gl.viewport(0, 0, canvas.width, canvas.height); }
    window.addEventListener('resize', () => { size(); wake(); });
    function drop(x, y, s) { drops[di * 4] = x; drops[di * 4 + 1] = y; drops[di * 4 + 2] = now(); drops[di * 4 + 3] = s; di = (di + 1) % N; lastActive = now(); wake(); }
    function frame() {
      raf = 0;
      if (!ready || !isOv() || !heroSeen || document.hidden) return;
      gl.uniform2f(uRes, cw, ch); gl.uniform2f(uImg, imgW, imgH); gl.uniform1f(uTime, now()); gl.uniform4fv(uDrops, drops);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (canvas.style.opacity !== '1') canvas.style.opacity = '1';
      if (now() - lastActive < 3.4) raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf) raf = requestAnimationFrame(frame); }
    let lx = -999, ly = -999, lt = 0;
    const box = canvas.parentElement;
    box.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, t = performance.now();
      const dist = Math.hypot(x - lx, y - ly);
      if (dist < 22 && t - lt < 80) return;
      const speed = dist / Math.max(16, t - lt) * 1000;
      drop(x, y, Math.max(0.35, Math.min(1.1, speed / 800))); lx = x; ly = y; lt = t;
    }, { passive: true });
    box.addEventListener('pointerdown', (e) => { const r = canvas.getBoundingClientRect(); drop(e.clientX - r.left, e.clientY - r.top, 1.7); });
    setInterval(() => { if (isOv() && heroSeen && !document.hidden && now() - lastActive > 2.2) drop(cw * (0.2 + Math.random() * 0.6), ch * (0.2 + Math.random() * 0.6), 0.6); }, 2400);
    return { wake, size };
  }

  /* 3d terminal */
  const stage = document.getElementById('stage');
  const scene3d = makeScene(document.getElementById('hero3d'));
  if (scene3d) document.getElementById('fallback3d').style.display = 'none';
  let stageSeen = false;
  new IntersectionObserver((es) => { stageSeen = es[0].isIntersecting; sync3d(); }, { threshold: 0.05 }).observe(stage);

  function makeScene(canvas) {
    const T = window.THREE; if (!T || !canvas) return null;
    let R;
    try { R = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    R.outputEncoding = T.sRGBEncoding;
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 0.25, 10);
    scene.add(new T.HemisphereLight(0xffffff, 0xdfe6f0, 0.9));
    const key = new T.DirectionalLight(0xffffff, 0.85); key.position.set(4, 6, 8); scene.add(key);
    const rim = new T.PointLight(0x2457e6, 0.8, 16); rim.position.set(-4, 2, -1); scene.add(rim);
    const root = new T.Group(); root.position.y = 0.45; scene.add(root);
    const rr = (w, h, r) => { const s = new T.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
    const term = new T.Group(); root.add(term);
    const bodyGeo = new T.ExtrudeGeometry(rr(2.2, 3.6, 0.32), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 5, curveSegments: 18 });
    bodyGeo.center();
    term.add(new T.Mesh(bodyGeo, new T.MeshStandardMaterial({ color: 0x2b3038, metalness: 0.4, roughness: 0.42 })));
    const bezel = new T.Mesh(new T.PlaneGeometry(1.86, 2.28), new T.MeshBasicMaterial({ color: 0x06080b }));
    bezel.position.set(0, 0.5, 0.26); term.add(bezel);
    const sc = document.createElement('canvas'); sc.width = 512; sc.height = 624; const g = sc.getContext('2d');
    const tex = new T.CanvasTexture(sc); tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
    const screen = new T.Mesh(new T.PlaneGeometry(1.76, 2.16), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
    screen.position.set(0, 0.5, 0.265); term.add(screen);
    const keyGeo = new T.CylinderGeometry(0.14, 0.14, 0.06, 28);
    const keyMat = new T.MeshStandardMaterial({ color: 0x1c2027, metalness: 0.3, roughness: 0.6 });
    const okMat = new T.MeshStandardMaterial({ color: 0x22a35a, metalness: 0.2, roughness: 0.5 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const k = new T.Mesh(keyGeo, r === 2 && c === 2 ? okMat : keyMat); k.rotation.x = Math.PI / 2; k.position.set((c - 1) * 0.48, -0.98 - r * 0.28, 0.27); term.add(k);
    }
    const cc = document.createElement('canvas'); cc.width = 512; cc.height = 324; const cg = cc.getContext('2d');
    const grd = cg.createLinearGradient(0, 0, 512, 324); grd.addColorStop(0, '#2457e6'); grd.addColorStop(1, '#13306f');
    cg.fillStyle = grd; cg.fillRect(0, 0, 512, 324);
    const chip = cg.createLinearGradient(50, 110, 130, 170); chip.addColorStop(0, '#ecd38b'); chip.addColorStop(1, '#b8933c');
    cg.fillStyle = chip; cg.fillRect(50, 112, 78, 58);
    cg.strokeStyle = 'rgba(255,255,255,.8)'; cg.lineWidth = 5; cg.lineCap = 'round';
    for (let i = 0; i < 3; i++) { cg.beginPath(); cg.arc(440, 140, 16 + i * 15, -0.8, 0.8); cg.stroke(); }
    cg.fillStyle = 'rgba(255,255,255,.95)'; cg.font = '500 32px monospace'; cg.fillText('**** **** **** 4242', 50, 250);
    cg.fillStyle = 'rgba(255,255,255,.7)'; cg.font = '500 19px sans-serif'; cg.fillText('JORDAN LEE', 50, 290);
    const ctex = new T.CanvasTexture(cc); ctex.encoding = T.sRGBEncoding;
    const card = new T.Mesh(new T.PlaneGeometry(1.7, 1.075), new T.MeshStandardMaterial({ map: ctex, metalness: 0.2, roughness: 0.45, side: T.DoubleSide }));
    root.add(card);
    const rings = [0, 1, 2].map(() => { const m = new T.Mesh(new T.TorusGeometry(0.45, 0.008, 8, 64), new T.MeshBasicMaterial({ color: 0x2457e6, transparent: true, opacity: 0 })); m.position.set(0, 0.45, 0.45); root.add(m); return m; });
    const shc = document.createElement('canvas'); shc.width = shc.height = 128; const sg = shc.getContext('2d');
    const sr = sg.createRadialGradient(64, 64, 0, 64, 64, 64); sr.addColorStop(0, 'rgba(15,27,45,.35)'); sr.addColorStop(1, 'rgba(15,27,45,0)');
    sg.fillStyle = sr; sg.fillRect(0, 0, 128, 128);
    const shadow = new T.Mesh(new T.PlaneGeometry(3.6, 1.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(shc), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, -2.15, 0); root.add(shadow);
    const ROUTES = [['Clover', 'op 7f3a'], ['Ingenico', 'op 91c2'], ['Dejavoo', 'op 4be8']];
    const chipEl = document.getElementById('chipRoute'), refEl = stage.querySelector('.status .ref');
    let lastKey = '';
    function drawScreen(state, route, prog) {
      const keyNow = state + route[0] + (state === 'proc' ? Math.round(prog * 20) : '');
      if (keyNow === lastKey) return; lastKey = keyNow;
      g.fillStyle = '#0f1520'; g.fillRect(0, 0, 512, 624);
      g.fillStyle = '#8a94a3'; g.font = '600 22px sans-serif'; g.fillText(route[0].toUpperCase(), 36, 56);
      g.fillStyle = '#8a94a3'; g.font = '400 22px sans-serif'; g.fillText('Invoice 1042', 36, 96);
      g.fillStyle = '#ffffff'; g.font = '600 84px sans-serif'; g.fillText('$70.00', 32, 210);
      g.fillStyle = '#222a35'; g.fillRect(36, 250, 440, 2);
      if (state === 'tap') {
        g.fillStyle = '#c4cad4'; g.font = '500 30px sans-serif'; g.fillText('Tap, insert or swipe', 36, 320);
        g.strokeStyle = '#5b8cff'; g.lineWidth = 6; g.lineCap = 'round';
        for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(256, 460, 26 + i * 26, -0.9, 0.9); g.stroke(); }
      } else if (state === 'proc') {
        g.fillStyle = '#c4cad4'; g.font = '500 30px sans-serif'; g.fillText('Processing', 36, 320);
        g.fillStyle = '#222a35'; g.fillRect(36, 360, 440, 10); g.fillStyle = '#5b8cff'; g.fillRect(36, 360, 440 * prog, 10);
      } else {
        g.fillStyle = '#22a35a'; g.beginPath(); g.arc(256, 400, 64, 0, 7); g.fill();
        g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(226, 402); g.lineTo(248, 424); g.lineTo(290, 380); g.stroke();
        g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.font = '600 36px sans-serif'; g.fillText('Approved', 256, 520);
        g.fillStyle = '#8a94a3'; g.font = '400 22px sans-serif'; g.fillText('Posted to POS once', 256, 560); g.textAlign = 'left';
        if (chipEl) chipEl.textContent = 'Approved on ' + route[0];
        if (refEl) refEl.textContent = route[1];
      }
      tex.needsUpdate = true;
    }
    const P = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    canvas.parentElement.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); P.x = (e.clientX - r.left) / r.width - 0.5; P.y = (e.clientY - r.top) / r.height - 0.5; });
    canvas.parentElement.addEventListener('pointerleave', () => { P.x = 0; P.y = 0; });
    const CYCLE = 7, ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const far = new T.Vector3(3.2, -1.2, 2.2), near = new T.Vector3(0.05, 0.45, 0.8);
    let raf = 0, running = false, t0 = performance.now(), forced = -1;
    function size() { const r = canvas.getBoundingClientRect(); if (!r.width) return; R.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.position.z = cam.aspect < 0.9 ? 13 : 10; cam.updateProjectionMatrix(); }
    window.addEventListener('resize', size);
    function frame(t) { if (!running) return; raf = requestAnimationFrame(frame); draw((t - t0) / 1000); }
    function draw(t) {
      const ph = (t % CYCLE) / CYCLE, route = ROUTES[forced >= 0 ? forced : Math.floor(t / CYCLE) % 3];
      cur.x += (P.x - cur.x) * 0.06; cur.y += (P.y - cur.y) * 0.06;
      root.rotation.y = -0.38 + cur.x * 0.5; root.rotation.x = 0.04 + cur.y * 0.2;
      term.position.y = Math.sin(t * 0.9) * 0.04;
      let k;
      if (ph < 0.2) k = ease(ph / 0.2); else if (ph < 0.46) k = 1; else if (ph < 0.64) k = 1 - ease((ph - 0.46) / 0.18); else k = 0;
      card.position.copy(far).lerp(near, k);
      card.rotation.set(-0.3 * (1 - k), 0.7 * (1 - k), -0.35 * (1 - k));
      card.visible = k > 0.001;
      const state = ph < 0.2 ? 'tap' : ph < 0.4 ? 'proc' : 'ok';
      drawScreen(state, route, Math.min(1, Math.max(0, (ph - 0.2) / 0.2)));
      rings.forEach((m, i) => { const q = (ph - 0.16) / 0.22 - i * 0.2; const on = q > 0 && q < 1; m.material.opacity = on ? (1 - q) * 0.5 : 0; m.scale.setScalar(on ? 0.7 + q * 1.3 : 0.7); });
      R.render(scene, cam);
    }
    return {
      start() { if (running) return; running = true; size(); t0 = performance.now() - 5000; raf = requestAnimationFrame(frame); },
      stop() { running = false; cancelAnimationFrame(raf); },
      setRoute(i) { forced = i; if (i >= 0) { t0 = performance.now(); lastKey = ''; } },
    };
  }
  function sync3d() { if (!scene3d) return; if (isOv() && stageSeen && !document.hidden) scene3d.start(); else scene3d.stop(); }

  /* scroll */
  const sprog = document.getElementById('sprog'), jr = ov.querySelector('.journey'), jsteps = [...ov.querySelectorAll('.steps4 .step')];
  const jstops = jr ? [...jr.querySelectorAll('.stop')] : [], jlabel = jr && jr.querySelector('.tkt em');
  const vb = ov.querySelector('.vband'), vbv = vb && vb.querySelector('video');
  const LABELS = ['Dropped off', 'In process', 'Ready', 'Delivered'];
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (!isOv()) return;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (sprog) sprog.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      if (jr) {
        const r = jr.parentElement.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight * 0.72 - r.top) / Math.max(1, r.height * 0.85)));
        jr.style.setProperty('--p', p.toFixed(3));
        const n = Math.min(3, Math.floor(p * 3 + 0.02));
        jstops.forEach((st, i) => st.classList.toggle('on', p >= i / 3 - 0.02));
        jsteps.forEach((st, i) => st.classList.toggle('on', i === n && p > 0.02));
        if (jlabel && jlabel.textContent !== LABELS[n]) jlabel.textContent = LABELS[n];
      }
      if (vbv) { const r = vb.getBoundingClientRect(), c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; vbv.style.transform = `translate3d(0,${(c * -70).toFixed(1)}px,0) scale(1.18)`; }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* bento tilt */
  ov.querySelectorAll('.bt').forEach((el) => {
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transform = `perspective(1000px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-3px)`; });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* route hover */
  ov.querySelectorAll('.route[data-route]').forEach((el) => {
    el.addEventListener('pointerenter', () => { ov.querySelectorAll('.route').forEach((x) => x.classList.toggle('active', x === el)); if (scene3d) scene3d.setRoute(+el.dataset.route); });
    el.addEventListener('pointerleave', () => { el.classList.remove('active'); if (scene3d) scene3d.setRoute(-1); });
  });

  /* tab changes */
  function sync() { syncVideos(); sync3d(); onScroll(); if (ripple) { ripple.size(); ripple.wake(); } }
  document.addEventListener('visibilitychange', sync);
  D.onPaint = (() => { let was = null; return () => { const on = isOv(); if (on !== was) { was = on; sync(); } else syncVideos(); }; })();
  sync();
})();
