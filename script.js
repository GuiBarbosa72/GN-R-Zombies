const $ = id => document.getElementById(id);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
} catch (e) {
  $('start').innerHTML = '<h1 class="marker">Ops</h1><p>Seu navegador não conseguiu iniciar o WebGL.</p>';
  throw e;
}

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08060c);
scene.fog = new THREE.Fog(0x08060c, 20, 48);

const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

scene.add(new THREE.AmbientLight(0x7a66a8, 0.9));
const sun = new THREE.DirectionalLight(0xffe2c4, 0.9);
sun.position.set(8, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 50 });
scene.add(sun);

// Palco
const cv = document.createElement('canvas');
cv.width = cv.height = 256;
const g2 = cv.getContext('2d');
g2.fillStyle = '#2a1c18';
g2.fillRect(0, 0, 256, 256);
for (let i = 0; i < 8; i++) {
  g2.fillStyle = i % 2 ? '#33231d' : '#261915';
  g2.fillRect(0, i * 32, 256, 31);
  g2.fillStyle = '#120b0a';
  g2.fillRect(0, i * 32 + 31, 256, 1);
}

const tex = new THREE.CanvasTexture(cv);
tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
tex.repeat.set(5, 5);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const MC = {};
const M = (c, e) => {
  const k = c + '_' + (e || 0);
  return MC[k] || (MC[k] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, emissive: e || 0, emissiveIntensity: e ? 1 : 0 }));
};

for (let i = -20; i <= 20; i += 3) {
  for (const [x, z] of [[i, -21], [i, 21], [-21, i], [21, i]]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2 + ((i * 7) & 1), 1.2), M(0x14101a));
    a.position.set(x, 1, z);
    a.castShadow = true;
    scene.add(a);

    const s = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), M(0x222, 0x110011));
    s.position.set(x, 1, z + (z < 0 ? 0.61 : z > 0 ? -0.61 : 0));
    if (Math.abs(x) === 21) {
      s.position.set(x + (x < 0 ? 0.61 : -0.61), 1, z);
      s.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    } else if (z > 0) {
      s.rotation.y = Math.PI;
    }
    scene.add(s);
  }
}

const beams = [];
[[0xff2e63, -10, -8], [0x4da6ff, 10, -8], [0xffc83d, 0, 10]].forEach(([c, x, z], i) => {
  const sp = new THREE.PointLight(c, 1.4, 26);
  sp.position.set(x, 8, z);
  scene.add(sp);

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3, 14, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  cone.position.set(x, 7, z);
  scene.add(cone);
  beams.push({ sp, cone, x, z, i });
});

// Modelos e Utilitários
const GC = {}, TX = {};
const gk = (k, f) => GC[k] || (GC[k] = f());

function part(geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
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
    c.width = w;
    c.height = h;
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

const HG = () => gk('hd', () => {
  const g = new THREE.SphereGeometry(0.23, 30, 24);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < 0) {
      x *= 1 + y * 1.5;
      z *= 1 + y * 0.5;
    }
    p.setXYZ(i, x, y * 1.12, z);
  }
  g.computeVertexNormals();
  return g;
});

function faceTex(o) {
  return mkTex('f' + o.skin + (o.z || '') + (o.gl || ''), 512, 256, (x, w, h) => {
    x.fillStyle = hx(o.skin);
    x.fillRect(0, 0, w, h);
    const sh = x.createRadialGradient(128, 120, 8, 128, 120, 100);
    sh.addColorStop(0, 'rgba(255,235,215,.2)');
    sh.addColorStop(1, 'rgba(70,25,10,.3)');
    x.fillStyle = sh;
    x.fillRect(0, 0, 256, 256);
    for (const s of [-1, 1]) {
      x.save();
      x.translate(128 + s * 33, 73);
      x.rotate(s * 0.12);
      x.fillStyle = o.z ? '#1d2a1a' : '#3a2414';
      x.fillRect(-16, -3, 32, 5);
      x.restore();
      if (o.z) {
        x.fillStyle = 'rgba(30,20,45,.75)';
        x.beginPath();
        x.ellipse(128 + s * 33, 105, 16, 11, 0, 0, 7);
        x.fill();
      } else if (!o.gl) {
        x.fillStyle = '#f4f0ea';
        x.beginPath();
        x.ellipse(128 + s * 33, 105, 11, 6, 0, 0, 7);
        x.fill();
        x.fillStyle = '#2a1a10';
        x.beginPath();
        x.arc(128 + s * 33, 105, 4.5, 0, 7);
        x.fill();
      }
      x.fillStyle = 'rgba(90,40,25,.22)';
      x.beginPath();
      x.ellipse(128 + s * 12, 150, 8, 5, 0, 0, 7);
      x.fill();
    }
    if (o.z) {
      x.fillStyle = '#1a0505';
      x.beginPath();
      x.ellipse(128, 188, 17, 12, 0, 0, 7);
      x.fill();
      x.fillStyle = '#d8d0b8';
      x.fillRect(116, 178, 24, 4);
      x.fillStyle = '#6a0f0f';
      x.fillRect(112, 198, 32, 5);
    } else {
      x.fillStyle = '#9c4a44';
      x.beginPath();
      x.ellipse(128, 184, 18, 4.5, 0, 0, 7);
      x.fill();
      x.fillStyle = '#b05a52';
      x.beginPath();
      x.ellipse(128, 192, 14, 5, 0, 0, 7);
      x.fill();
    }
    for (let i = 0; i < (o.z ? 150 : 450); i++) {
      x.fillStyle = 'rgba(40,25,15,.22)';
      x.fillRect(128 + (Math.random() - 0.5) * 95, 150 + Math.random() * 62, 1.2, 1.2);
    }
  });
}

const FR = {
  jer(x, w, h, o, bk) {
    x.fillStyle = '#141414';
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#212121';
    for (let i = 0; i < w; i += 5) for (let j = 0; j < h; j += 5) x.fillRect(i, j, 2, 2);
    if (!bk) {
      x.fillStyle = hx(o.skin);
      x.beginPath();
      x.moveTo(w * 0.3, 0);
      x.lineTo(w * 0.7, 0);
      x.lineTo(w * 0.5, h * 0.2);
      x.fill();
      x.strokeStyle = '#8c8c8c';
      x.lineWidth = 8;
      x.stroke();
    }
    x.font = 'bold 150px Impact,Arial Black,sans-serif';
    x.textAlign = 'center';
    x.lineWidth = 10;
    x.strokeStyle = '#8e8e8e';
    x.strokeText('80', w / 2, h * 0.82);
    x.fillStyle = '#f3f3f3';
    x.fillText('80', w / 2, h * 0.82);
  },
  tee(x, w, h, o, bk) {
    x.fillStyle = '#1b1b1b';
    x.fillRect(0, 0, w, h);
    if (!bk) {
      x.fillStyle = '#b3261e';
      x.beginPath();
      x.arc(w / 2, h * 0.5, 62, 0, 7);
      x.fill();
      x.fillStyle = '#f4f4f4';
      x.font = 'bold 96px Arial';
      x.textAlign = 'center';
      x.fillText('★', w / 2, h * 0.5 + 32);
    }
  }
};

function shirtMats(o) {
  const base = M(o.shirt);
  if (!o.fr) return base;
  const mk = bk => new THREE.MeshStandardMaterial({ map: mkTex('fr' + o.fr + o.skin + bk, 256, 256, (x, w, h) => FR[o.fr](x, w, h, o, bk)), roughness: 0.85 });
  return [base, base, base, base, mk(0), mk(1)];
}

function human(o) {
  const g = new THREE.Group();
  const skin = M(o.skin);
  const shirt = M(o.shirt);
  const pants = M(o.pants);
  const boot = M(o.boot || 0x141414);
  const sl = o.sleeve ? shirt : skin;

  const fore = o.tat ? gk('tat' + o.skin, () => new THREE.MeshStandardMaterial({
    roughness: 0.6,
    map: mkTex('tt' + o.skin, 128, 128, (x, w, h) => {
      x.fillStyle = hx(o.skin);
      x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(40,60,50,.8)';
      x.lineWidth = 4;
      for (let i = 0; i < 9; i++) {
        x.beginPath();
        x.arc(14 + i * 13, 30 + (i % 3) * 24, 8 + (i % 4) * 3, 0, 5);
        x.stroke();
      }
      x.fillStyle = 'rgba(40,60,50,.6)';
      x.fillRect(0, 50, w, 14);
    })
  })) : skin;

  const legs = [-1, 1].map(s => {
    const h = new THREE.Group();
    h.position.set(s * 0.19, 0.98, 0);
    h.add(part(CY(0.16, 0.125, 0.5), pants, 0, -0.25, 0));
    const k = new THREE.Group();
    k.position.y = -0.5;
    h.add(k);
    k.add(part(CY(0.125, 0.105, 0.48), pants, 0, -0.24, 0));
    k.add(part(CY(0.125, 0.14, 0.2), boot, 0, -0.38, 0));
    k.add(part(BX(0.21, 0.12, 0.4), boot, 0, -0.54, 0.09));
    k.add(part(BX(0.22, 0.04, 0.42), M(0x0a0a0a), 0, -0.6, 0.09));
    g.add(h);
    h.userData.k = k;
    return h;
  });

  g.add(part(CY(0.3, 0.29, 0.2), pants, 0, 1.02, 0, 1, 1, 0.7));
  const th = o.long ? 0.95 : 0.78;
  const tor = new THREE.Mesh(BX(0.84, th, 0.38), shirtMats(o));
  tor.position.y = o.long ? 1.3 : 1.4;
  tor.castShadow = true;
  tor.userData.t = 1;
  g.add(tor);

  g.add(part(CY(0.3, 0.3, 0.08), M(o.belt || 0x222222), 0, 1.0, 0, 1, 1, 0.66));
  g.add(part(BX(0.12, 0.1, 0.04), M(0xc9a227, 0x1a1400), 0, 1.0, 0.2));
  g.add(part(CY(0.09, 0.1, 0.18), skin, 0, 1.82, 0));

  const arms = [-1, 1].map(s => {
    const a = new THREE.Group();
    a.position.set(s * 0.47, 1.7, 0);
    a.add(part(SP(0.15), sl, 0, 0, 0));
    a.add(part(CY(o.sleeve ? 0.125 : 0.095, o.sleeve ? 0.115 : 0.08, 0.4), sl, 0, -0.2, 0));
    if (o.trim) a.add(part(CY(0.118, 0.118, 0.035), M(o.trim), 0, -0.39, 0));

    const e = new THREE.Group();
    e.position.y = -0.4;
    e.rotation.x = -0.3;
    a.add(e);
    e.add(part(SP(0.08), skin, 0, 0, 0));
    e.add(part(CY(0.075, 0.06, 0.36), fore, 0, -0.18, 0));

    if (o.beads) for (let i = 0; i < 9; i++) {
      const q = (i / 9) * 6.283;
      e.add(part(SP(0.02, 6), M(0x111111), Math.sin(q) * 0.07, -0.31, Math.cos(q) * 0.07));
    }
    if (o.cuff) e.add(part(CY(0.085, 0.085, 0.08), M(o.cuff), 0, -0.29, 0));
    e.add(part(SP(0.075, 10), skin, 0, -0.4, 0.01, 0.9, 1.2, 0.75));

    if (o.rings) {
      const r = part(gk('rg', () => new THREE.TorusGeometry(0.03, 0.009, 6, 10)), SM, s * 0.03, -0.45, 0.03);
      r.rotation.y = 1.4;
      e.add(r);
    }
    g.add(a);
    a.userData.e = e;
    return a;
  });

  const head = new THREE.Group();
  head.position.y = 2.0;
  g.add(head);

  head.add(part(HG(), gk('hm' + o.skin + (o.z || '') + (o.gl || ''), () => new THREE.MeshStandardMaterial({ map: faceTex(o), roughness: 0.6 })), 0, 0.02, 0));
  head.add(part(BX(0.05, 0.1, 0.07), skin, 0, -0.01, 0.225));

  for (const s of [-1, 1]) {
    head.add(part(SP(0.05, 8), skin, s * 0.225, 0, 0, 0.45, 1, 0.8));
    if (o.eye) head.add(part(SP(0.04, 8), M(o.eye, o.eye), s * 0.09, 0.045, 0.205));
  }

  if (o.gl) {
    const lm = gk('lens' + o.gl, () => new THREE.MeshStandardMaterial({ color: o.gl === 'av' ? 0x2a1a14 : 0x050505, roughness: 0.12, metalness: 0.5 }));
    for (const s of [-1, 1]) {
      const l = part(SP(0.075, 12), lm, s * 0.095, 0.045, 0.213, 1, o.gl === 'av' ? 0.9 : 1, 0.2);
      l.rotation.y = s * 0.3;
      head.add(l);
      const f = part(gk('fr', () => new THREE.TorusGeometry(0.076, 0.007, 6, 16)), SM, s * 0.095, 0.045, 0.216, 1, o.gl === 'av' ? 0.9 : 1, 1);
      f.rotation.y = s * 0.3;
      head.add(f);
      head.add(part(BX(0.012, 0.012, 0.2), SM, s * 0.2, 0.05, 0.1));
    }
    head.add(part(BX(0.05, 0.01, 0.012), SM, 0, 0.06, 0.22));
  }

  if (o.hair === 'dread') {
    const c = part(CAP(0.26), M(0x5a3d24), 0, 0.02, -0.02);
    c.rotation.x = -0.45;
    head.add(c);

    const cols = [0x6b4a2b, 0x8a6a3a, 0xa88a50, 0x4a3220, 0x7a5a34];
    const D = (x, z, L, rx, rz) => {
      const d = new THREE.Group();
      d.position.set(x, -0.02, z);
      d.rotation.set(rx, 0, rz);
      const m = part(CY(0.03, 0.017, L, 6), M(cols[(Math.random() * 5) | 0]), 0, -L / 2, 0);
      m.castShadow = false;
      d.add(m);
      head.add(d);
    };

    for (let i = 0; i < 26; i++) {
      const q = Math.PI * (0.62 + (0.76 * i) / 25);
      D(Math.sin(q) * 0.22, Math.cos(q) * 0.22, 0.8 + Math.random() * 0.3, -Math.cos(q) * 0.1, Math.sin(q) * 0.1);
    }
    for (const s of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        D(s * (0.2 + (i % 3) * 0.025), 0.07 + ((i / 3) | 0) * 0.03, 0.85 + Math.random() * 0.15, -0.22, -s * 0.05);
      }
    }

    const bm = gk('bdn', () => new THREE.MeshStandardMaterial({
      roughness: 0.9,
      side: THREE.DoubleSide,
      map: mkTex('pais', 256, 64, (x, w, h) => {
        x.fillStyle = '#9fb7d8';
        x.fillRect(0, 0, w, h);
        for (let i = 0; i < 14; i++) {
          const px = i * 19 + 8, py = 14 + (i % 3) * 14;
          x.fillStyle = '#e8eef8';
          x.beginPath();
          x.ellipse(px, py, 7, 4, i, 0, 7);
          x.fill();
          x.strokeStyle = '#6f8bb5';
          x.lineWidth = 2;
          x.stroke();
        }
      })
    }));

    const bd = new THREE.Mesh(gk('bdg', () => new THREE.CylinderGeometry(0.27, 0.27, 0.13, 22, 1, true)), bm);
    bd.position.set(0, 0.17, -0.01);
    bd.rotation.x = -0.18;
    head.add(bd);
    head.add(part(BX(0.11, 0.1, 0.06), bm, 0.1, 0.15, -0.27));

    const t = part(BX(0.06, 0.26, 0.02), bm, 0.18, 0.02, -0.3);
    t.rotation.z = 0.3;
    head.add(t);
  }

  if (o.hair === 'curly') {
    const hc = M(0x0c0907);
    const c = part(CAP(0.3), hc, 0, 0.04, -0.05);
    c.rotation.x = -0.35;
    head.add(c);

    [[0.2, 9], [0.06, 10], [-0.1, 9], [-0.28, 8], [-0.45, 7]].forEach(([y, n], li) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + li, x = Math.sin(a), z = Math.cos(a);
        if (z > 0.45 && y < 0.15) continue;
        head.add(part(SP(0.14 - li * 0.008, 8), hc, x * (0.3 - li * 0.01), y, z * (0.28 - li * 0.01) - 0.04));
      }
    });

    const gm = M(0x050505);
    head.add(part(CY(0.44, 0.44, 0.035, 24), gm, 0, 0.33, 0));
    head.add(part(CY(0.25, 0.27, 0.46, 20), gm, 0, 0.56, 0));
    head.add(part(CY(0.272, 0.275, 0.09, 20), M(0x8a1c2a), 0, 0.4, 0));
    head.add(part(BX(0.08, 0.07, 0.03), M(0xc9a227, 0x1a1400), 0, 0.4, 0.275));
  }

  if (o.hair === 'rot') {
    const c = part(CAP(0.26), M(0x2a2418), 0, 0.03, -0.05);
    c.rotation.x = -0.8;
    head.add(c);
  }

  g.userData = { legs, arms, head, tor };
  return g;
}

function makeHero(k) {
  const v = k === 'voc';
  const h = human(v ? { skin: 0xe4bfa0, shirt: 0x151515, pants: 0x0e0e10, fr: 'jer', long: 1, sleeve: 1, trim: 0xe8e8e8, hair: 'dread', gl: 'av', tat: 1, beads: 1, rings: 1, belt: 0x3a2a14, boot: 0x1a1410 }
    : { skin: 0xd6ac88, shirt: 0x1b1b1b, pants: 0x22252e, fr: 'tee', hair: 'curly', gl: 'rd', sleeve: 1, belt: 0x888888, boot: 0x0e0e0e, cuff: 0x666666, rings: 1 });
  
  const u = h.userData;
  if (v) {
    h.add(seg([-0.1, 1.8, 0.15], [0, 1.22, 0.2], 0.008, SM), seg([0.1, 1.8, 0.15], [0, 1.22, 0.2], 0.008, SM));
    h.add(part(BX(0.03, 0.13, 0.012), SM, 0, 1.15, 0.2), part(BX(0.08, 0.03, 0.012), SM, 0, 1.18, 0.2));
    
    const mic = new THREE.Group();
    mic.add(part(CY(0.025, 0.025, 1.3, 8), M(0x999999), 0, 0.25, 0), part(SP(0.1), M(0xcccccc, 0x222222), 0, 0.95, 0), part(CY(0.1, 0.12, 0.16, 10), M(0x222222), 0, -0.35, 0));
    mic.position.set(0, -0.38, 0.04);
    u.arms[1].userData.e.add(mic);
    u.arms[1].rotation.x = -0.6;
  } else {
    const gt = new THREE.Group(), red = M(0xb3261e, 0x180402);
    gt.add(part(SP(0.3, 16), red, 0, -0.1, 0, 1.1, 1.1, 0.2), part(SP(0.22, 16), red, 0, 0.25, 0, 1, 1, 0.2), part(BX(0.2, 0.3, 0.02), M(0xf2f2f2), 0.1, -0.05, 0.045), part(BX(0.07, 0.95, 0.05), M(0x3a2414), 0, 0.85, 0), part(BX(0.12, 0.22, 0.04), M(0x222222), 0, 1.4, 0), part(CY(0.025, 0.025, 0.1, 6), M(0xcccccc), 0, -0.2, 0.05));
    gt.position.set(-0.05, 1.15, 0.28);
    gt.rotation.z = -1.05;
    h.add(gt);

    const sp = part(BX(0.07, 0.95, 0.03), M(0x2a1a10), 0.12, 1.45, 0.12);
    sp.rotation.z = 0.12;
    h.add(sp);
    u.arms[1].rotation.x = -0.9;
    u.arms[1].userData.e.attach(gt);
  }
  h.rotation.order = 'YXZ';
  return h;
}

const ZC = [0x6f9a5a, 0x7da06a, 0x5d8e72, 0x88a85c];
const ZS = [0x4a3b56, 0x5c3a3a, 0x35505e, 0x5a5532, 0x3d3d3d];
const ZP = [0x2a2a3a, 0x3a3326, 0x1e2a2e];

function makeZombie(brute) {
  const z = human({ skin: ZC[(Math.random() * 4) | 0], shirt: ZS[(Math.random() * 5) | 0], pants: ZP[(Math.random() * 3) | 0], z: 1, eye: 0xffe14a, hair: Math.random() < 0.5 ? 'rot' : '', sleeve: Math.random() < 0.5, boot: 0x2a2018 });
  const u = z.userData;
  u.arms.forEach(a => {
    a.rotation.x = -1.4;
    a.userData.e.rotation.x = -0.15;
  });

  const red = M(0x6a0f0f), bone = M(0xd8d0b8);
  z.add(part(BX(0.16, 0.1, 0.03), red, 0.1, 1.5, 0.2), part(BX(0.12, 0.14, 0.03), red, -0.12, 1.25, 0.2));
  [1.3, 1.36, 1.42].forEach(y => z.add(part(BX(0.18, 0.022, 0.03), bone, -0.1, y, 0.205)));
  for (let i = 0; i < 4; i++) z.add(part(BX(0.12, 0.14, 0.03), M(0x2a2a2a), -0.24 + i * 0.16, 0.98, 0.2));

  u.head.rotation.z = (Math.random() - 0.5) * 0.5;
  u.head.rotation.x = 0.15;
  z.traverse(m => { if (m.isMesh) m.castShadow = !!m.userData.t; });
  if (brute) z.scale.set(1.65, 1.45, 1.5);
  return z;
}

function mkSlash(color, range, arc, sc) {
  const N = 28, geo = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * 6), idx = [];
  for (let i = 0; i < N; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);

  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.frustumCulled = false;
  m.userData = { N, range, arc, sc, op: sc < 1 ? 1 : 0.75 };
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
  pos.needsUpdate = true;
  m.material.opacity = Math.max(0, 1 - p * p) * op;
}

// Estado do Jogo
let hero, hk, slash, zs = [], ds = [], ps = [], st = 'menu', score = 0, wave = 0, toSpawn = 0, spT = 0, combo = 0, comboT = 0, shake = 0, nextWave = 0, hp = 100, inv = 0, yaw = 0, atkCd = 0, atkT = 0, held = false, pitch = -0.2, cyaw = 0, cpit = -0.2, hFace = 0, spinOff = 0, paused = false, noLock = false, cmb = 0, cmbT = 0, A = null;
const keys = {}, joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 };

const CFG = {
  voc: {
    rate: 0.62, sp: 6.2, dmg: 40, range: 2.7, arc: 2.4, n: 'Vocalista', c: [
      { d: 0.36, cd: 0.36, t: [0.3, 0.55, 0.75], dm: 1, tilt: 0.35, dir: 1, k: 0.9, W: [-1.2, 1.3, -0.6, -0.5, -0.2, -0.05, 0.7], S: [-1.45, -1, -1, 0.4, -0.35, 0.12, -0.6] },
      { d: 0.36, cd: 0.36, t: [0.3, 0.55, 0.75], dm: 1, tilt: -0.35, dir: -1, k: 0.9, W: [-1.3, -1.1, -0.9, 0.3, -0.3, -0.05, -0.7], S: [-1.2, 1.4, -0.6, -0.5, -0.2, 0.1, 0.65] },
      { d: 0.7, cd: 0.8, t: [0.4, 0.6, 0.85], dm: 1.9, vert: 1, aoe: 1, rg: 1.05, dir: 1, k: 2.4, W: [-3, 0.2, -2.8, -0.2, -0.4, -0.25, 0], S: [-1, 0, -1.1, 0, -0.3, 0.4, 0] }
    ]
  },
  gui: {
    rate: 0.3, sp: 6.8, dmg: 25, range: 2.3, arc: 1.7, n: 'Guitarrista', c: [
      { d: 0.22, cd: 0.22, t: [0.25, 0.5, 0.7], dm: 1, tilt: 0.35, dir: 1, k: 0.8, W: [-1, 1.2, -0.9, -0.3, -0.3, 0, 0.6], S: [-1.4, -1, -0.9, 0.3, -0.3, 0.1, -0.55] },
      { d: 0.24, cd: 0.24, t: [0.25, 0.5, 0.7], dm: 1, tilt: -0.9, dir: -1, arc: 1.5, k: 1.4, W: [-0.2, -0.9, -0.9, 0.2, -0.3, 0.05, -0.5], S: [-2.4, 0.6, -1.2, 0, -0.3, -0.05, 0.5] },
      { d: 0.45, cd: 0.55, t: [0.2, 0.7, 0.85], dm: 1.6, aoe: 1, spin: 1, rg: 0.95, dir: -1, k: 1.8, W: [-1.2, 1.4, -1.2, -1.4, -0.3, 0.05, 0], S: [-1.4, 1, -1.4, -1, -0.3, 0.1, 0] }
    ]
  }
};

function burst(p, c, n = 8) {
  for (let i = 0; i < n; i++) {
    const m = part(BX(0.12, 0.12, 0.12), M(c, c), p.x, p.y, p.z);
    m.castShadow = false;
    m.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 5, (Math.random() - 0.5) * 6), l: 0.6 };
    scene.add(m);
    ps.push(m);
  }
}

function banner(t) {
  const b = $('banner');
  b.textContent = t;
  b.style.opacity = 1;
  setTimeout(() => b.style.opacity = 0, 1400);
}

function startWave() {
  wave++;
  toSpawn = 4 + wave * 3;
  spT = 0;
  $('wave').textContent = 'Onda ' + wave;
  banner('Onda ' + wave);
}

function start(k) {
  hk = k;
  if (hero) scene.remove(hero);
  hero = makeHero(k);
  scene.add(hero);

  const c = CFG[k];
  slash = new THREE.Group();
  slash.userData.p = [mkSlash(k === 'voc' ? 0xff2e63 : 0xffc83d, c.range, c.arc, 1), mkSlash(0xffffff, c.range, c.arc, 0.3)];
  slash.add(...slash.userData.p);
  slash.position.y = 1.1;
  slash.rotation.z = 0.35;
  slash.visible = false;
  hero.add(slash);

  zs.forEach(z => { scene.remove(z.g); scene.remove(z.bar); });
  zs = [];
  ds.forEach(z => scene.remove(z.g));
  ds = [];

  score = 0; wave = 0; hp = 100; combo = 0; inv = 0; nextWave = 0; yaw = 0; atkCd = 0; atkT = 0;
  pitch = cpit = -0.2; cyaw = 0; hFace = 0; spinOff = 0; cmb = 0; cmbT = 0; A = null; paused = false;
  $('pause').style.display = 'none';
  $('hname').textContent = c.n;
  $('start').style.display = $('over').style.display = 'none';
  $('hud').style.display = 'block';
  $('atk').style.display = 'block';

  startWave();
  st = 'play';
  document.body.classList.add('play');
  if (!touched) lockMouse();
}

document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => start(b.dataset.h));
$('again').onclick = () => start(hk);

addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = 1;
  if (e.key === 'Escape' && st === 'play' && !paused && noLock) setPause(true);
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = 0);

let touched = false;
addEventListener('mousemove', e => {
  if (touched || st !== 'play' || paused) return;
  const cp = v => Math.max(-0.8, Math.min(0.3, v));
  if (document.pointerLockElement) {
    yaw -= e.movementX * 0.0032;
    pitch = cp(pitch - e.movementY * 0.0028);
  }
});

addEventListener('touchstart', () => { touched = true; }, { passive: true });

function setPause(v) {
  if (st !== 'play' || touched) return;
  paused = v;
  if (v) held = false;
  $('pause').style.display = v ? 'flex' : 'none';
  document.body.classList.toggle('play', !v);
}

function lockMouse() {
  if (noLock || touched) return;
  try {
    const r = $('c').requestPointerLock();
    if (r && r.catch) r.catch(() => { noLock = true; });
  } catch (e) {
    noLock = true;
  }
}

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) setPause(false);
  else if (st === 'play' && !touched) setPause(true);
});
document.addEventListener('pointerlockerror', () => { noLock = true; });

$('resume').onclick = () => { setPause(false); lockMouse(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) setPause(true); });

$('c').addEventListener('mousedown', e => {
  if (touched || st !== 'play' || paused) return;
  if (!document.pointerLockElement) lockMouse();
  held = true;
});
addEventListener('mouseup', () => held = false);

const atk = $('atk');
atk.addEventListener('pointerdown', () => held = true);
['pointerup', 'pointerleave', 'pointercancel'].forEach(n => atk.addEventListener(n, () => held = false));

// Touch Controles
const ring = $('ring'), knob = $('knob');
addEventListener('touchstart', e => {
  if (st !== 'play' || e.target.closest('button')) return;
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth / 2 && joy.id === null) {
      joy.id = t.identifier; joy.ox = t.clientX; joy.oy = t.clientY;
      ring.style.display = 'block';
      ring.style.left = t.clientX - 60 + 'px';
      ring.style.top = t.clientY - 60 + 'px';
    } else if (t.clientX >= innerWidth / 2 && look.id === null) {
      look.id = t.identifier; look.x = t.clientX; look.y = t.clientY;
    }
  }
}, { passive: true });

addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) {
      let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy;
      const l = Math.hypot(dx, dy), m = 50;
      if (l > m) { dx *= m / l; dy *= m / l; }
      joy.x = dx / m; joy.y = dy / m;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
    } else if (t.identifier === look.id) {
      const dx = t.clientX - look.x, dy = t.clientY - look.y;
      yaw -= dx * 0.006;
      pitch = Math.max(-0.8, Math.min(0.3, pitch - dy * 0.005));
      look.x = t.clientX; look.y = t.clientY;
    }
  }
}, { passive: true });

const endT = e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; ring.style.display = 'none'; knob.style.transform = ''; }
    if (t.identifier === look.id) look.id = null;
  }
};
addEventListener('touchend', endT);
addEventListener('touchcancel', endT);

function spawn() {
  const a = Math.random() * Math.PI * 2, r = 24, brute = wave >= 3 && Math.random() < 0.12;
  const g = makeZombie(brute);
  g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  scene.add(g);

  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.14), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.75, depthTest: false }));
  const fgG = new THREE.PlaneGeometry(1, 0.09);
  fgG.translate(0.5, 0, 0);
  const fg = new THREE.Mesh(fgG, new THREE.MeshBasicMaterial({ color: 0x44ff44, depthTest: false }));
  fg.position.set(-0.5, 0, 0.01);

  const bar = new THREE.Group();
  bar.add(bg, fg);
  bg.renderOrder = 10;
  fg.renderOrder = 11;
  bar.visible = false;
  if (brute) bar.scale.setScalar(1.4);
  scene.add(bar);

  zs.push({ g, bar, fg, hp: 100, h: brute ? 3.7 : 2.7, sp: (brute ? 1.5 : 1.7 + Math.random() * 0.7) + wave * 0.1, cd: 0, ph: Math.random() * 9, brute });
}

function kill(z) {
  z.dead = 1; combo++; comboT = 2;
  score += 10 * (1 + ((combo / 5) | 0)) * (z.brute ? 3 : 1);
  shake = 0.2;
  burst({ x: z.g.position.x, y: 1.2, z: z.g.position.z }, 0x5fbf3a, 16);
  scene.remove(z.bar);

  const dx = z.g.position.x - hero.position.x, dz = z.g.position.z - hero.position.z, d = Math.hypot(dx, dz) || 1;
  z.vx = (dx / d) * 3.5;
  z.vz = (dz / d) * 3.5;
  z.t = 0;
  z.bs = z.g.scale.clone();
  z.g.rotation.order = 'YXZ';
  z.g.rotation.z = 0;
  ds.push(z);
}

function updDying(dt) {
  for (let i = ds.length - 1; i >= 0; i--) {
    const z = ds[i], g = z.g, u = g.userData;
    z.t += dt;
    const t = z.t, p = Math.min(1, t / 0.55), e = p * p;
    g.rotation.x = (-Math.PI / 2) * e;
    const k = Math.exp(-t * 5);
    g.position.x += z.vx * k * dt;
    g.position.z += z.vz * k * dt;

    u.arms.forEach((a, j) => {
      a.rotation.x = -1.4 + e * 2.6 + Math.sin(t * 14 + j) * 0.25 * (1 - p);
      a.rotation.z = (j ? 1 : -1) * e * 0.9;
    });
    u.legs[0].rotation.x = e * 0.5;
    u.legs[1].rotation.x = -e * 0.3;
    u.head.rotation.x = 0.15 - e * 0.5;

    if (t > 1.1) {
      const q = Math.min(1, (t - 1.1) / 0.5);
      g.scale.set(z.bs.x * (1 - q), z.bs.y * (1 - q), z.bs.z * (1 - q));
      g.position.y = -q * 0.3;
    }
    if (t >= 1.6) {
      burst({ x: g.position.x, y: 0.3, z: g.position.z }, 0x5fbf3a, 5);
      scene.remove(g);
      ds.splice(i, 1);
    }
  }
}

function attack() {
  const c = CFG[hk];
  cmb = cmbT > 0 ? (cmb + 1) % 3 : 0;
  const s = c.c[cmb];
  cmbT = s.cd + 0.45;
  atkCd = s.cd;
  A = { s, t: 0, hit: 0 };

  const rg = c.range * (s.rg || 1), arc = s.aoe ? 6 : (s.arc || c.arc);
  slash.userData.p.forEach(m => {
    Object.assign(m.userData, { range: rg, arc, dir: s.dir || 1 });
    setSlash(m, 0);
  });
  slash.rotation.set(0, 0, s.vert ? Math.PI / 2 : (s.tilt || 0));
  slash.position.y = s.vert ? 1.9 : 1.1;
  slash.visible = false;
}

function strike(s) {
  const c = CFG[hk], rg = c.range * (s.rg || 1);
  let hit = 0;
  zs.forEach(z => {
    if (z.dead) return;
    const dx = z.g.position.x - hero.position.x, dz = z.g.position.z - hero.position.z, d = Math.hypot(dx, dz) || 0.01;
    if (d > rg + (z.brute ? 0.5 : 0.3)) return;
    if (!s.aoe) {
      let da = Math.atan2(dx, dz) - hFace;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > (s.arc || c.arc) / 2 && d > 0.9) return;
    }
    z.hp -= c.dmg * s.dm;
    hit++;
    z.g.position.x += (dx / d) * s.k;
    z.g.position.z += (dz / d) * s.k;
    burst({ x: z.g.position.x, y: 1.4, z: z.g.position.z }, 0x7dff6b, 6);
    if (z.hp <= 0) kill(z);
  });

  if (s.vert) for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 6.283;
    burst({ x: hero.position.x + Math.sin(hFace) * 1.6 + Math.sin(a) * 1.8, y: 0.2, z: hero.position.z + Math.cos(hFace) * 1.6 + Math.cos(a) * 1.8 }, 0xffc83d, 1);
  }
  if (hit || s.vert) shake = Math.max(shake, s.vert ? 0.5 : 0.15);
}

function hurtHero(d) {
  if (inv > 0) return;
  hp -= d;
  inv = 0.5;
  shake = 0.35;
  burst({ x: hero.position.x, y: 1.5, z: hero.position.z }, 0xff2e63, 6);
  if (hp <= 0) {
    hp = 0;
    st = 'over';
    held = false;
    document.body.classList.remove('play');
    if (document.exitPointerLock) document.exitPointerLock();
    $('atk').style.display = 'none';
    $('final').textContent = 'Pontos: ' + score + '  ·  Onda ' + wave;
    $('over').style.display = 'flex';
  }
}

let last = performance.now(), T = 0;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = paused ? 0 : Math.min(0.05, (now - last) / 1000);
  last = now;
  T += dt;

  beams.forEach(b => {
    const a = T * 0.7 + b.i * 2;
    b.cone.rotation.z = Math.sin(a) * 0.5;
    b.cone.rotation.x = Math.cos(a * 0.8) * 0.4;
    b.sp.intensity = 1.1 + Math.sin(T * 6 + b.i) * 0.4;
  });

  if (st === 'play' && !paused) {
    if (keys.q || keys.arrowleft) yaw += 2.2 * dt;
    if (keys.e || keys.arrowright) yaw -= 2.2 * dt;

    const fvX = Math.sin(yaw), fvZ = Math.cos(yaw);
    const rvX = Math.sin(yaw + Math.PI / 2), rvZ = Math.cos(yaw + Math.PI / 2);

    let f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0) - joy.y;
    let r = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + joy.x;

    const L = Math.hypot(f, r);
    if (L > 1) { f /= L; r /= L; }
    const ml = Math.min(1, L);
    const c = CFG[hk], u = hero.userData;

    const moveX = (fvX * f + rvX * r) * c.sp * dt;
    const moveZ = (fvZ * f + rvZ * r) * c.sp * dt;

    hero.position.x = Math.max(-17, Math.min(17, hero.position.x + moveX));
    hero.position.z = Math.max(-17, Math.min(17, hero.position.z + moveZ));

    const da = Math.atan2(Math.sin(yaw - hFace), Math.cos(yaw - hFace));
    hFace += da * Math.min(1, dt * 18);

    const w = Math.sin(T * 11) * ml * 0.8;
    u.legs[0].rotation.x = w;
    u.legs[1].rotation.x = -w;
    u.legs[0].userData.k.rotation.x = Math.max(0, w) * 1.1;
    u.legs[1].userData.k.rotation.x = Math.max(0, -w) * 1.1;

    if (hk === 'voc') {
      u.arms[0].rotation.x = -w * 0.6;
      u.arms[1].rotation.x = -0.6;
    } else {
      u.arms[0].rotation.x = -0.8;
      u.arms[1].rotation.x = -0.9 + w * 0.2;
    }

    hero.position.y = Math.abs(Math.sin(T * 11)) * 0.06 * ml;
    u.arms[0].rotation.z = u.arms[1].rotation.z = 0;
    u.arms[0].userData.e.rotation.x = u.arms[1].userData.e.rotation.x = -0.3;

    atkCd -= dt;
    cmbT -= dt;
    if ((held || keys[' '] || keys.j) && atkCd <= 0) attack();

    spinOff = 0;
    hero.rotation.x = 0;

    if (A) {
      const s = A.s;
      A.t += dt;
      const p = A.t / s.d, [t1, t2, t3] = s.t, sm = x => x * x * (3 - 2 * x), cl = x => Math.max(0, Math.min(1, x));
      const w = p < t1 ? sm(p / t1) : p < t3 ? 1 : 1 - sm(cl((p - t3) / (1 - t3))), q = sm(cl((p - t1) / (t2 - t1)));
      const I = [u.arms[1].rotation.x, 0, u.arms[0].rotation.x, 0, -0.3, 0, 0];
      const V = I.map((v, k) => v + (s.W[k] + (s.S[k] - s.W[k]) * q - v) * w);

      u.arms[1].rotation.x = V[0];
      u.arms[1].rotation.z = V[1];
      u.arms[0].rotation.x = V[2];
      u.arms[0].rotation.z = V[3];
      u.arms[1].userData.e.rotation.x = V[4];
      hero.rotation.x = V[5];
      spinOff = V[6];

      if (s.spin) spinOff += Math.PI * 2 * (1 - Math.pow(1 - cl((p - t1) / (t2 - t1)), 3));
      hero.position.y += Math.sin(cl((p - t1) / (t3 - t1)) * Math.PI) * (s.vert ? 0.25 : 0.06);

      if (!A.hit && p >= (t1 + t2) / 2) {
        A.hit = 1;
        strike(s);
      }

      const sp = (p - t1) / ((t2 - t1) * 1.6);
      slash.visible = sp >= 0 && sp < 1;
      if (slash.visible) slash.userData.p.forEach(m => setSlash(m, sp));
      if (p >= 1) { A = null; slash.visible = false; }
    }

    hero.rotation.y = hFace + spinOff;
    slash.rotation.y = -spinOff;

    inv -= dt;
    hero.visible = inv <= 0 || (((T * 20) | 0) % 2 === 0);

    comboT -= dt;
    if (comboT <= 0) combo = 0;

    if (toSpawn > 0) {
      spT -= dt;
      if (spT <= 0) {
        spawn();
        toSpawn--;
        spT = Math.max(0.5, 1.4 - wave * 0.07);
      }
    } else if (!zs.length) {
      nextWave += dt;
      if (nextWave > 2) {
        nextWave = 0;
        startWave();
      }
    }

    zs.forEach(z => {
      if (z.dead) return;
      const p = z.g.position, dx = hero.position.x - p.x, dz = hero.position.z - p.z, d = Math.hypot(dx, dz) || 1;
      if (d > 1) {
        p.x += (dx / d) * z.sp * dt;
        p.z += (dz / d) * z.sp * dt;
      }
      z.g.rotation.y = Math.atan2(dx, dz);
      const s = Math.sin(T * 6 + z.ph);
      z.g.userData.legs[0].rotation.x = s * 0.6;
      z.g.userData.legs[1].rotation.x = -s * 0.6;
      z.g.rotation.z = s * 0.05;

      z.cd -= dt;
      if (d < (z.brute ? 1.6 : 1.2) && z.cd <= 0) {
        z.cd = 1;
        hurtHero(z.brute ? 20 : 10);
      }
      z.bar.visible = z.hp < 100;
      z.bar.position.set(p.x, z.h, p.z);
      z.bar.quaternion.copy(cam.quaternion);
      z.fg.scale.x = Math.max(0.001, z.hp / 100);
      z.fg.material.color.setHSL((z.hp / 100) * 0.33, 0.9, 0.5);
    });

    zs = zs.filter(z => !z.dead);
    $('hp').style.width = hp + '%';
    $('hptxt').textContent = Math.ceil(hp) + ' / 100';
    $('score').textContent = score;
    $('combo').textContent = combo >= 3 ? 'Combo x' + (1 + ((combo / 5) | 0)) : '';
  }

  updDying(dt);

  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i], d = p.userData;
    d.v.y -= 14 * dt;
    p.position.addScaledVector(d.v, dt);
    if (p.position.y < 0.06) {
      p.position.y = 0.06;
      d.v.set(0, 0, 0);
    }
    d.l -= dt;
    p.scale.setScalar(Math.max(0.01, d.l / 0.6));
    if (d.l <= 0) {
      scene.remove(p);
      ps.splice(i, 1);
    }
  }

  shake *= 0.88;
  const sx = (Math.random() - 0.5) * shake, sz = (Math.random() - 0.5) * shake;

  if (hero) {
    const h = hero.position;
    const lerpRate = 1 - Math.exp(-dt * 20);

    let dyaw = yaw - cyaw;
    dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
    cyaw += dyaw * lerpRate;
    cpit += (pitch - cpit) * lerpRate;

    const dist = 5.2 + (A ? 0.4 : 0);
    const camX = h.x - Math.sin(cyaw) * Math.cos(cpit) * dist + sx;
    const camY = Math.max(0.6, h.y + 1.6 - Math.sin(cpit) * dist) + sz;
    const camZ = h.z - Math.cos(cyaw) * Math.cos(cpit) * dist;

    cam.position.set(camX, camY, camZ);
    cam.lookAt(h.x, h.y + 1.4, h.z);
  } else {
    cam.position.set(Math.sin(T * 0.2) * 15, 6, Math.cos(T * 0.2) * 15);
    cam.lookAt(0, 1.2, 0);
  }

  renderer.render(scene, cam);
}

requestAnimationFrame(loop);