const $ = id => document.getElementById(id);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
} catch (e) {
  $('c').insertAdjacentHTML('afterend', '<p style="color:white;text-align:center;">WebGL não suportado.</p>');
  throw e;
}

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08060c);

const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// Iluminação Geral
const ambLight = new THREE.AmbientLight(0x7a66a8, 0.7);
scene.add(ambLight);

const sun = new THREE.DirectionalLight(0xffe2c4, 0.9);
sun.position.set(8, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 50 });
scene.add(sun);

const MC = {};
const M = (c, e) => {
  const k = c + '_' + (e || 0);
  return MC[k] || (MC[k] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, emissive: e || 0, emissiveIntensity: e ? 1 : 0 }));
};

const GC = {}, TX = {};
const gk = (k, f) => GC[k] || (GC[k] = f());

function part(geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const BX = (w, h, d) => gk('b' + [w, h, d], () => new THREE.BoxGeometry(w, h, d));
const SP = (r, n = 14) => gk('s' + [r, n], () => new THREE.SphereGeometry(r, n, n));
const CY = (a, b, h, n = 12) => gk('c' + [a, b, h, n], () => new THREE.CylinderGeometry(a, b, h, n));
const CAP = r => gk('p' + r, () => new THREE.SphereGeometry(r, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5));
const hx = c => '#' + c.toString(16).padStart(6, '0');
const SM = new THREE.MeshStandardMaterial({ color: 0xd0d4dc, metalness: 0.5, roughness: 0.3 });

function mkTex(k, w, h, f) {
  if (!TX[k]) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    f(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    TX[k] = t;
  }
  return TX[k];
}

function seg(a, b, r, mat) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 5), mat);
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

// -------------------------------------------------------------
// CONSTRUÇÃO DOS CENÁRIOS (CAMARIM E PALCO MELHORADOS)
// -------------------------------------------------------------
const dressingRoomGroup = new THREE.Group();
const stageGroup = new THREE.Group();
scene.add(dressingRoomGroup);
scene.add(stageGroup);

// --- CAMARIM ---
const drFloor = part(BX(12, 0.2, 12), M(0x3a2218), 0, -0.1, 0);
dressingRoomGroup.add(drFloor);

// Paredes do Camarim
const drWallMat = M(0x1f162b);
dressingRoomGroup.add(part(BX(12, 5, 0.2), drWallMat, 0, 2.5, -6));
dressingRoomGroup.add(part(BX(12, 5, 0.2), drWallMat, 0, 2.5, 6));
dressingRoomGroup.add(part(BX(0.2, 5, 12), drWallMat, -6, 2.5, 0));
dressingRoomGroup.add(part(BX(0.2, 5, 8), drWallMat, 6, 2.5, -2));

// Armário de Roupas
const wardrobe = new THREE.Group();
wardrobe.position.set(-4.5, 0, -5.2);
wardrobe.add(part(BX(2.2, 4, 1.2), M(0x2d1b10), 0, 2, 0));
wardrobe.add(part(BX(0.9, 3.6, 0.05), M(0x120a06), -0.5, 2, 0.6));
wardrobe.add(part(BX(0.9, 3.6, 0.05), M(0x120a06), 0.5, 2, 0.6));
wardrobe.add(part(SP(0.08), M(0xffc83d), -0.1, 2, 0.65));
wardrobe.add(part(SP(0.08), M(0xffc83d), 0.1, 2, 0.65));
dressingRoomGroup.add(wardrobe);

// Espelho de Camarim com Luzes
const mirrorGroup = new THREE.Group();
mirrorGroup.position.set(0, 2.2, -5.8);
mirrorGroup.add(part(BX(3, 2, 0.1), M(0x1a1a1a)));
mirrorGroup.add(part(BX(2.6, 1.6, 0.02), M(0xaaccee, 0x223344), 0, 0, 0.05));
for (let lx = -1.3; lx <= 1.3; lx += 0.65) {
  mirrorGroup.add(part(SP(0.08), M(0xfffae0, 0xffea88), lx, 0.9, 0.08));
  mirrorGroup.add(part(SP(0.08), M(0xfffae0, 0xffea88), lx, -0.9, 0.08));
}
dressingRoomGroup.add(mirrorGroup);

// Sofá do Camarim
const sofa = new THREE.Group();
sofa.position.set(4, 0, 0);
sofa.rotation.y = -Math.PI / 2;
sofa.add(part(BX(3, 0.6, 1.2), M(0x6b1827), 0, 0.3, 0));
sofa.add(part(BX(3, 1.2, 0.3), M(0x52121e), 0, 0.9, -0.45));
sofa.add(part(BX(0.4, 0.9, 1.2), M(0x52121e), -1.4, 0.6, 0));
sofa.add(part(BX(0.4, 0.9, 1.2), M(0x52121e), 1.4, 0.6, 0));
dressingRoomGroup.add(sofa);

// Porta para o Palco
const doorGroup = new THREE.Group();
doorGroup.position.set(6, 0, 3.5);
doorGroup.add(part(BX(0.2, 3.8, 2), M(0x4a3222), 0, 1.9, 0));
doorGroup.add(part(SP(0.1), M(0xffc83d), -0.15, 1.9, 0.7));
doorGroup.add(part(BX(0.05, 0.4, 1.2), M(0xff2e63, 0xff2e63), -0.15, 3.2, 0));
dressingRoomGroup.add(doorGroup);

const drLight = new THREE.PointLight(0xffddaa, 1.2, 15);
drLight.position.set(0, 4, 0);
dressingRoomGroup.add(drLight);

// --- PALCO PRINCIPAL ---
stageGroup.position.set(0, 0, -60);

const cv = document.createElement('canvas');
cv.width = cv.height = 256;
const g2 = cv.getContext('2d');
g2.fillStyle = '#2a1c18'; g2.fillRect(0, 0, 256, 256);
for (let i = 0; i < 8; i++) {
  g2.fillStyle = i % 2 ? '#33231d' : '#261915'; g2.fillRect(0, i * 32, 256, 31);
  g2.fillStyle = '#120b0a'; g2.fillRect(0, i * 32 + 31, 256, 1);
}
const tex = new THREE.CanvasTexture(cv);
tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 6);

const stageFloor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
stageFloor.rotation.x = -Math.PI / 2;
stageFloor.receiveShadow = true;
stageGroup.add(stageFloor);

// Caixas de Som e Iluminação no Palco
for (let i = -22; i <= 22; i += 3.5) {
  for (const [x, z] of [[i, -24], [i, 24], [-24, i], [24, i]]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.5 + ((i * 7) & 1), 1.4), M(0x14101a));
    a.position.set(x, 1.25, z);
    a.castShadow = true;
    stageGroup.add(a);
  }
}

const beams = [];
[[0xff2e63, -12, -10], [0x4da6ff, 12, -10], [0xffc83d, 0, 12]].forEach(([c, x, z], i) => {
  const sp = new THREE.PointLight(c, 1.5, 30);
  sp.position.set(x, 9, z);
  stageGroup.add(sp);

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 16, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  cone.position.set(x, 8, z);
  stageGroup.add(cone);
  beams.push({ sp, cone, x, z, i });
});

// -------------------------------------------------------------
// MODELOS DE PERSONAGENS E MODELAGEM
// -------------------------------------------------------------
const HG = () => gk('hd', () => {
  const g = new THREE.SphereGeometry(0.23, 30, 24);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < 0) { x *= 1 + y * 1.5; z *= 1 + y * 0.5; }
    p.setXYZ(i, x, y * 1.12, z);
  }
  g.computeVertexNormals();
  return g;
});

function faceTex(o) {
  return mkTex('f' + o.skin + (o.z || '') + (o.gl || ''), 512, 256, (x, w, h) => {
    x.fillStyle = hx(o.skin); x.fillRect(0, 0, w, h);
    for (const s of [-1, 1]) {
      x.fillStyle = o.z ? '#1d2a1a' : '#3a2414'; x.fillRect(128 + s * 33 - 16, 70, 32, 5);
      if (o.z) {
        x.fillStyle = 'rgba(30,20,45,.75)'; x.beginPath(); x.ellipse(128 + s * 33, 105, 16, 11, 0, 0, 7); x.fill();
      } else if (!o.gl) {
        x.fillStyle = '#f4f0ea'; x.beginPath(); x.ellipse(128 + s * 33, 105, 11, 6, 0, 0, 7); x.fill();
        x.fillStyle = '#2a1a10'; x.beginPath(); x.arc(128 + s * 33, 105, 4.5, 0, 7); x.fill();
      }
    }
    if (o.z) {
      x.fillStyle = '#1a0505'; x.beginPath(); x.ellipse(128, 188, 17, 12, 0, 0, 7); x.fill();
      x.fillStyle = '#d8d0b8'; x.fillRect(116, 178, 24, 4);
    } else {
      x.fillStyle = '#9c4a44'; x.beginPath(); x.ellipse(128, 184, 18, 4.5, 0, 0, 7); x.fill();
    }
  });
}

const FR = {
  jer(x, w, h) {
    x.fillStyle = '#141414'; x.fillRect(0, 0, w, h);
    x.font = 'bold 150px Impact'; x.textAlign = 'center'; x.fillStyle = '#f3f3f3'; x.fillText('80', w / 2, h * 0.82);
  },
  tee(x, w, h) {
    x.fillStyle = '#1b1b1b'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#b3261e'; x.beginPath(); x.arc(w / 2, h * 0.5, 62, 0, 7); x.fill();
  },
  casual(x, w, h) {
    x.fillStyle = '#2b3a4a'; x.fillRect(0, 0, w, h);
  }
};

function shirtMats(o) {
  const base = M(o.shirt);
  if (!o.fr) return base;
  const mk = () => new THREE.MeshStandardMaterial({ map: mkTex('fr' + o.fr, 256, 256, (x, w, h) => FR[o.fr](x, w, h)), roughness: 0.85 });
  return [base, base, base, base, mk(), mk()];
}

function human(o) {
  const g = new THREE.Group();
  const skin = M(o.skin), shirt = M(o.shirt), pants = M(o.pants), boot = M(o.boot || 0x141414);
  const sl = o.sleeve ? shirt : skin;

  const legs = [-1, 1].map(s => {
    const h = new THREE.Group();
    h.position.set(s * 0.19, 0.98, 0);
    h.add(part(CY(0.16, 0.125, 0.5), pants, 0, -0.25, 0));
    const k = new THREE.Group(); k.position.y = -0.5; h.add(k);
    k.add(part(CY(0.125, 0.105, 0.48), pants, 0, -0.24, 0));
    k.add(part(BX(0.21, 0.12, 0.4), boot, 0, -0.54, 0.09));
    g.add(h); h.userData.k = k; return h;
  });

  g.add(part(CY(0.3, 0.29, 0.2), pants, 0, 1.02, 0, 1, 1, 0.7));
  const tor = new THREE.Mesh(BX(0.84, o.long ? 0.95 : 0.78, 0.38), shirtMats(o));
  tor.position.y = o.long ? 1.3 : 1.4; tor.castShadow = true; g.add(tor);

  const arms = [-1, 1].map(s => {
    const a = new THREE.Group(); a.position.set(s * 0.47, 1.7, 0);
    a.add(part(SP(0.15), sl, 0, 0, 0));
    a.add(part(CY(0.1, 0.08, 0.4), sl, 0, -0.2, 0));
    const e = new THREE.Group(); e.position.y = -0.4; e.rotation.x = -0.3; a.add(e);
    e.add(part(CY(0.075, 0.06, 0.36), skin, 0, -0.18, 0));
    g.add(a); a.userData.e = e; return a;
  });

  const head = new THREE.Group(); head.position.y = 2.0; g.add(head);
  head.add(part(HG(), new THREE.MeshStandardMaterial({ map: faceTex(o), roughness: 0.6 }), 0, 0.02, 0));

  if (o.hair === 'dread') {
    const c = part(CAP(0.26), M(0x5a3d24), 0, 0.02, -0.02); c.rotation.x = -0.45; head.add(c);
  } else if (o.hair === 'curly') {
    const c = part(CAP(0.3), M(0x0c0907), 0, 0.04, -0.05); c.rotation.x = -0.35; head.add(c);
    const gm = M(0x050505);
    head.add(part(CY(0.44, 0.44, 0.035, 24), gm, 0, 0.33, 0));
    head.add(part(CY(0.25, 0.27, 0.46, 20), gm, 0, 0.56, 0));
  }

  g.userData = { legs, arms, head, tor };
  return g;
}

function makeHero(k) {
  if (k === 'casual') {
    return human({ skin: 0xe4bfa0, shirt: 0x2b3a4a, pants: 0x1f1f25, fr: 'casual', sleeve: 1 });
  }
  const v = k === 'voc';
  const h = human(v ? { skin: 0xe4bfa0, shirt: 0x151515, pants: 0x0e0e10, fr: 'jer', long: 1, sleeve: 1, hair: 'dread', gl: 'av' }
    : { skin: 0xd6ac88, shirt: 0x1b1b1b, pants: 0x22252e, fr: 'tee', hair: 'curly', gl: 'rd', sleeve: 1 });
  
  const u = h.userData;
  if (v) {
    const mic = new THREE.Group();
    mic.add(part(CY(0.025, 0.025, 1.3, 8), M(0x999999), 0, 0.25, 0), part(SP(0.1), M(0xcccccc, 0x222222), 0, 0.95, 0));
    mic.position.set(0, -0.38, 0.04);
    u.arms[1].userData.e.add(mic);
  } else {
    const gt = new THREE.Group(), red = M(0xb3261e, 0x180402);
    gt.add(part(SP(0.3, 16), red, 0, -0.1, 0, 1.1, 1.1, 0.2), part(BX(0.07, 0.95, 0.05), M(0x3a2414), 0, 0.85, 0));
    gt.position.set(-0.05, 1.15, 0.28); gt.rotation.z = -1.05;
    u.arms[1].userData.e.add(gt);
  }
  h.rotation.order = 'YXZ';
  return h;
}

function makeZombie(brute) {
  const z = human({ skin: 0x6f9a5a, shirt: 0x4a3b56, pants: 0x2a2a3a, z: 1, eye: 0xffe14a });
  if (brute) z.scale.set(1.65, 1.45, 1.5);
  return z;
}

function mkSlash(color, range, arc, sc) {
  const N = 28, geo = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * 6), idx = [];
  for (let i = 0; i < N; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.frustumCulled = false; m.userData = { N, range, arc, sc, op: sc < 1 ? 1 : 0.75 };
  return m;
}

function setSlash(m, p) {
  const { N, range, arc, sc, op, dir = 1 } = m.userData;
  const pos = m.geometry.attributes.position;
  const head = 1 - Math.pow(1 - p, 3), tl = Math.max(0, (p - 0.2) / 0.8), tail = tl * tl;
  const ah = arc / 2 - arc * head, at = arc / 2 - arc * tail, th = (range - 0.6) * 0.55 * sc;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = (at + (ah - at) * t) * dir, w = Math.pow(Math.sin(Math.PI * t), 0.8) * th, R = range, r = R - w;
    pos.setXYZ(i * 2, Math.sin(a) * R, 0, Math.cos(a) * R);
    pos.setXYZ(i * 2 + 1, Math.sin(a) * r, 0, Math.cos(a) * r);
  }
  pos.needsUpdate = true; m.material.opacity = Math.max(0, 1 - p * p) * op;
}

// -------------------------------------------------------------
// ESTADO DO JOGO E MUDANÇA DE SESSÃO
// -------------------------------------------------------------
let hero, hk = 'casual', slash, zs = [], ds = [], ps = [];
let currentLocation = 'dressing_room';
let score = 0, wave = 0, toSpawn = 0, spT = 0, combo = 0, comboT = 0, shake = 0, nextWave = 0, hp = 100, inv = 0;
let yaw = 0, atkCd = 0, held = false, pitch = -0.2, cyaw = 0, cpit = -0.2, hFace = 0, spinOff = 0, paused = false, noLock = false, cmb = 0, cmbT = 0, A = null;
const keys = {}, joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 };

const CFG = {
  casual: { sp: 5.0, range: 1.5, arc: 1.2, n: 'À paisana' },
  voc: { rate: 0.62, sp: 6.2, dmg: 40, range: 2.7, arc: 2.4, n: 'Vocalista', c: [{ d: 0.36, cd: 0.36, t: [0.3, 0.55, 0.75], dm: 1, tilt: 0.35, dir: 1, k: 0.9, W: [-1.2, 1.3, -0.6, -0.5, -0.2, -0.05, 0.7], S: [-1.45, -1, -1, 0.4, -0.35, 0.12, -0.6] }] },
  gui: { rate: 0.3, sp: 6.8, dmg: 25, range: 2.3, arc: 1.7, n: 'Guitarrista', c: [{ d: 0.22, cd: 0.22, t: [0.25, 0.5, 0.7], dm: 1, tilt: 0.35, dir: 1, k: 0.8, W: [-1, 1.2, -0.9, -0.3, -0.3, 0, 0.6], S: [-1.4, -1, -0.9, 0.3, -0.3, 0.1, -0.55] }] }
};

function setHeroOutfit(k) {
  hk = k;
  const oldPos = hero ? hero.position.clone() : new THREE.Vector3(0, 0, 0);
  if (hero) scene.remove(hero);
  hero = makeHero(k);
  hero.position.copy(oldPos);
  scene.add(hero);

  if (k !== 'casual') {
    const c = CFG[k];
    slash = new THREE.Group();
    slash.userData.p = [mkSlash(k === 'voc' ? 0xff2e63 : 0xffc83d, c.range, c.arc, 1), mkSlash(0xffffff, c.range, c.arc, 0.3)];
    slash.add(...slash.userData.p); slash.position.y = 1.1; slash.visible = false;
    hero.add(slash);
    $('atk').style.display = 'block';
  }
  $('hname').textContent = CFG[k].n;
}

function initGame() {
  currentLocation = 'dressing_room';
  setHeroOutfit('casual');
  hero.position.set(0, 0, 2);
  $('wave').textContent = 'Camarim';
  $('wardrobe-modal').style.display = 'none';
  $('over').style.display = 'none';
  $('atk').style.display = 'none';
}

function enterStage() {
  currentLocation = 'stage';
  hero.position.set(0, 0, 0);
  stageGroup.position.set(0, 0, 0);
  dressingRoomGroup.position.set(0, -100, 0);
  wave = 0; score = 0; hp = 100;
  startWave();
}

function startWave() {
  wave++; toSpawn = 4 + wave * 3; spT = 0;
  $('wave').textContent = 'Onda ' + wave;
  const b = $('banner'); b.textContent = 'Onda ' + wave; b.style.opacity = 1;
  setTimeout(() => b.style.opacity = 0, 1400);
}

// -------------------------------------------------------------
// CONTROLES E INTERAÇÃO
// -------------------------------------------------------------
document.querySelectorAll('.card[data-h]').forEach(btn => {
  btn.onclick = () => {
    setHeroOutfit(btn.getAttribute('data-h'));
    $('wardrobe-modal').style.display = 'none';
  };
});

$('again').onclick = () => {
  stageGroup.position.set(0, 0, -60);
  dressingRoomGroup.position.set(0, 0, 0);
  zs.forEach(z => scene.remove(z.g)); zs = [];
  initGame();
};

function handleInteraction() {
  if (currentLocation === 'dressing_room') {
    const p = hero.position;
    if (Math.hypot(p.x - (-4.5), p.z - (-4.5)) < 2.2) {
      $('wardrobe-modal').style.display = 'flex';
    }
    else if (Math.hypot(p.x - 5.5, p.z - 3.5) < 2.0) {
      if (hk === 'casual') {
        const b = $('banner'); b.textContent = 'Vista-se primeiro no armário!'; b.style.opacity = 1;
        setTimeout(() => b.style.opacity = 0, 1500);
      } else {
        enterStage();
      }
    }
  }
}

addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = 1;
  if (e.key.toLowerCase() === 'e') handleInteraction();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = 0);
$('use-btn').onclick = handleInteraction;

addEventListener('mousemove', e => {
  if (document.pointerLockElement) {
    yaw -= e.movementX * 0.0032;
    pitch = Math.max(-0.8, Math.min(0.3, pitch - e.movementY * 0.0028));
  }
});

$('c').onclick = () => {
  if (!$('wardrobe-modal').style.display || $('wardrobe-modal').style.display === 'none') {
    $('c').requestPointerLock();
  }
};

// -------------------------------------------------------------
// LOOP PRINCIPAL
// -------------------------------------------------------------
function burst(p, c, n = 8) {
  for (let i = 0; i < n; i++) {
    const m = part(BX(0.12, 0.12, 0.12), M(c, c), p.x, p.y, p.z);
    m.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 5, (Math.random() - 0.5) * 6), l: 0.6 };
    scene.add(m); ps.push(m);
  }
}

function spawn() {
  const a = Math.random() * Math.PI * 2, r = 22, brute = wave >= 3 && Math.random() < 0.12;
  const g = makeZombie(brute);
  g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  scene.add(g);
  zs.push({ g, hp: 100, sp: (brute ? 1.5 : 1.7) + wave * 0.1, cd: 0, brute });
}

let last = performance.now(), T = 0;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; T += dt;

  if (hero) {
    let f = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
    let r = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const L = Math.hypot(f, r); if (L > 1) { f /= L; r /= L; }
    const c = CFG[hk];

    const fvX = Math.sin(yaw), fvZ = Math.cos(yaw);
    const rvX = Math.sin(yaw + Math.PI / 2), rvZ = Math.cos(yaw + Math.PI / 2);

    hero.position.x += (fvX * f + rvX * r) * c.sp * dt;
    hero.position.z += (fvZ * f + rvZ * r) * c.sp * dt;

    if (currentLocation === 'dressing_room') {
      hero.position.x = Math.max(-5.2, Math.min(5.2, hero.position.x));
      hero.position.z = Math.max(-5.2, Math.min(5.2, hero.position.z));
      
      const p = hero.position;
      const nearWardrobe = Math.hypot(p.x - (-4.5), p.z - (-4.5)) < 2.2;
      const nearDoor = Math.hypot(p.x - 5.5, p.z - 3.5) < 2.0;

      if (nearWardrobe) {
        $('prompt').style.display = 'block';
        $('prompt').textContent = 'Pressione E para trocar de roupa';
        $('use-btn').style.display = 'block';
      } else if (nearDoor) {
        $('prompt').style.display = 'block';
        $('prompt').textContent = 'Pressione E para ir ao Palco';
        $('use-btn').style.display = 'block';
      } else {
        $('prompt').style.display = 'none';
        $('use-btn').style.display = 'none';
      }
    } else {
      hero.position.x = Math.max(-20, Math.min(20, hero.position.x));
      hero.position.z = Math.max(-20, Math.min(20, hero.position.z));
      $('prompt').style.display = 'none';
      $('use-btn').style.display = 'none';
    }

    const da = Math.atan2(Math.sin(yaw - hFace), Math.cos(yaw - hFace));
    hFace += da * Math.min(1, dt * 18);
    hero.rotation.y = hFace;

    if (currentLocation === 'stage') {
      if (toSpawn > 0) {
        spT -= dt;
        if (spT <= 0) { spawn(); toSpawn--; spT = 1.2; }
      } else if (!zs.length) {
        nextWave += dt;
        if (nextWave > 2) { nextWave = 0; startWave(); }
      }

      zs.forEach(z => {
        const p = z.g.position, dx = hero.position.x - p.x, dz = hero.position.z - p.z, d = Math.hypot(dx, dz) || 1;
        if (d > 1) { p.x += (dx / d) * z.sp * dt; p.z += (dz / d) * z.sp * dt; }
        z.g.rotation.y = Math.atan2(dx, dz);
        z.cd -= dt;
        if (d < 1.4 && z.cd <= 0) {
          z.cd = 1; hp -= 15;
          if (hp <= 0) {
            $('final').textContent = 'Você caiu no palco! Pontos: ' + score;
            $('over').style.display = 'flex';
          }
        }
      });

      $('hp').style.width = hp + '%';
      $('hptxt').textContent = Math.ceil(hp) + ' / 100';
      $('score').textContent = score;
    }

    const dist = 4.8;
    cam.position.set(
      hero.position.x - Math.sin(yaw) * Math.cos(pitch) * dist,
      hero.position.y + 1.6 - Math.sin(pitch) * dist,
      hero.position.z - Math.cos(yaw) * Math.cos(pitch) * dist
    );
    cam.lookAt(hero.position.x, hero.position.y + 1.2, hero.position.z);
  }

  renderer.render(scene, cam);
}

initGame();
requestAnimationFrame(loop);
