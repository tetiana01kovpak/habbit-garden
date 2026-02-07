import * as THREE from 'three';

function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++)
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

const PALETTES = [
  { stem: 0x5a9a4a, leaf: 0x88dd88, bloom: 0xff88aa, glow: 0xff88aa, accent: 0xffffff },
  { stem: 0x4a8a5a, leaf: 0x78dd98, bloom: 0xffdd66, glow: 0xffdd66, accent: 0xfffde0 },
  { stem: 0x6a9a4a, leaf: 0xaaee66, bloom: 0xff8855, glow: 0xff8855, accent: 0xffddcc },
  { stem: 0x4a7a7a, leaf: 0x77dddd, bloom: 0xcc77ee, glow: 0xcc77ee, accent: 0xeeccff },
  { stem: 0x5a8a3a, leaf: 0x99cc55, bloom: 0x55bbff, glow: 0x55bbff, accent: 0xccecff },
  { stem: 0x8a7a4a, leaf: 0xddcc66, bloom: 0xff5555, glow: 0xff5555, accent: 0xffcccc },
  { stem: 0x4a7a4a, leaf: 0x88dd88, bloom: 0xffaa44, glow: 0xffaa44, accent: 0xfff0cc },
  { stem: 0x5a8a6a, leaf: 0x99eedd, bloom: 0xff5588, glow: 0xff5588, accent: 0xffddee },
];

const PLANT_TYPES = ['flower', 'tree', 'cactus', 'mushroom', 'crystal'];

const lp = (r, d) => new THREE.IcosahedronGeometry(r, d);

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.7, metalness: 0.05, ...opts });

function addMound(group, growth, rng) {
  const m = new THREE.Mesh(lp(0.45, 1), mat(0x6b5540));
  m.scale.set(1.1, 0.35, 1.1);
  m.position.y = -0.1;
  group.add(m);

  const grass = new THREE.Mesh(lp(0.5, 1), mat(0x4a7a3a, { roughness: 1 }));
  grass.scale.set(1.15, 0.08, 1.15);
  grass.position.y = 0.0;
  group.add(grass);

  const bladeCount = Math.min(growth * 2, 14);
  const grassMat = mat(0x55aa44);
  for (let i = 0; i < bladeCount; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 0.2 + rng() * 0.35;
    const h = 0.08 + rng() * 0.12 + growth * 0.01;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.015, h, 3, 1), grassMat);
    blade.position.set(Math.cos(angle) * dist, h / 2, Math.sin(angle) * dist);
    blade.rotation.set((rng() - 0.5) * 0.4, 0, (rng() - 0.5) * 0.4);
    group.add(blade);
  }
}

function buildFlower(group, growth, streak, pal, rng) {
  const segments = Math.min(growth, 7);
  const segH = 0.28 + rng() * 0.08;
  let y = 0;
  let cx = 0, cz = 0;

  for (let i = 0; i < segments; i++) {
    const t = i / Math.max(segments, 1);
    const r = 0.055 * (1 - t * 0.35);
    const dx = (rng() - 0.5) * 0.06;
    const dz = (rng() - 0.5) * 0.06;
    cx += dx;
    cz += dz;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r, segH, 5, 1), mat(pal.stem));
    seg.position.set(cx, y + segH / 2, cz);
    seg.rotation.set(dz * 2, 0, -dx * 2);
    group.add(seg);

    if (i >= 2 && i % 2 === 0 && growth >= 3) {
      const lSize = 0.1 + rng() * 0.1;
      const leaf = new THREE.Mesh(lp(lSize, 0), mat(pal.leaf));
      const side = rng() > 0.5 ? 1 : -1;
      leaf.position.set(cx + side * 0.22, y + segH * 0.6, cz);
      leaf.scale.set(1.6, 0.5, 0.8);
      leaf.rotation.z = side * 0.6;
      group.add(leaf);
    }
    y += segH;
  }

  if (growth >= 4) {
    const bSize = 0.14 + Math.min(growth - 4, 8) * 0.025;
    const petalCount = growth >= 10 ? 7 : growth >= 7 ? 5 : 3;

    const center = new THREE.Mesh(
      lp(bSize * 0.5, 1),
      mat(pal.accent, { emissive: streak >= 3 ? pal.glow : 0x000000, emissiveIntensity: streak >= 3 ? 0.5 : 0 })
    );
    center.position.set(cx, y + bSize * 0.3, cz);
    group.add(center);

    for (let p = 0; p < petalCount; p++) {
      const angle = (p / petalCount) * Math.PI * 2 + rng() * 0.4;
      const petal = new THREE.Mesh(
        lp(bSize * 0.65, 0),
        mat(pal.bloom, { emissive: streak >= 5 ? pal.glow : 0x000000, emissiveIntensity: streak >= 5 ? 0.4 : 0 })
      );
      const dist = bSize * (1.1 + rng() * 0.3);
      petal.position.set(cx + Math.cos(angle) * dist, y + bSize * 0.15, cz + Math.sin(angle) * dist);
      petal.scale.set(1, 0.45, 0.8);
      petal.rotation.set(0, angle, (rng() - 0.5) * 0.3);
      group.add(petal);
    }
  }
}

function buildTree(group, growth, streak, pal, rng) {
  const trunkH = 0.2 + growth * 0.15;
  const trunkR = 0.07 + growth * 0.005;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 0.6, trunkR, trunkH, 5, 1),
    mat(0x5a4030)
  );
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  const canopyLayers = Math.min(Math.floor(growth / 2), 4);
  let y = trunkH * 0.6;

  for (let i = 0; i < canopyLayers; i++) {
    const layerSize = (0.25 + (canopyLayers - i) * 0.12) * (0.8 + rng() * 0.4);
    const canopy = new THREE.Mesh(
      lp(layerSize, 1),
      mat(pal.leaf, { emissive: streak >= 5 ? pal.glow : 0x000000, emissiveIntensity: streak >= 5 ? 0.2 : 0 })
    );
    canopy.position.set((rng() - 0.5) * 0.1, y + layerSize * 0.6, (rng() - 0.5) * 0.1);
    canopy.scale.set(1.3, 0.8, 1.3);
    group.add(canopy);
    y += layerSize * 0.7;
  }

  if (growth >= 8) {
    for (let f = 0; f < 3; f++) {
      const fruit = new THREE.Mesh(
        lp(0.06 + rng() * 0.03, 0),
        mat(pal.bloom, { emissive: streak >= 7 ? pal.glow : 0x000000, emissiveIntensity: streak >= 7 ? 0.6 : 0 })
      );
      const a = rng() * Math.PI * 2;
      fruit.position.set(Math.cos(a) * 0.25, trunkH * 0.7 + rng() * 0.3, Math.sin(a) * 0.25);
      group.add(fruit);
    }
  }
}

function buildCactus(group, growth, streak, pal, rng) {
  const mainH = 0.3 + growth * 0.18;
  const mainR = 0.1 + growth * 0.008;
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(mainR * 0.85, mainR, mainH, 6, 1),
    mat(pal.leaf, { roughness: 0.5 })
  );
  body.position.y = mainH / 2;
  group.add(body);

  if (growth >= 3) {
    const armCount = Math.min(Math.floor(growth / 3), 3);
    for (let a = 0; a < armCount; a++) {
      const armH = 0.15 + rng() * 0.2;
      const armR = mainR * 0.5;
      const armAngle = (a / armCount) * Math.PI * 2 + rng();
      const armY = mainH * (0.3 + rng() * 0.4);
      const side = rng() > 0.5 ? 1 : -1;

      const horizontal = new THREE.Mesh(
        new THREE.CylinderGeometry(armR * 0.8, armR, mainR * 3, 5, 1),
        mat(pal.leaf, { roughness: 0.5 })
      );
      horizontal.position.set(Math.cos(armAngle) * mainR * 2, armY, Math.sin(armAngle) * mainR * 2);
      horizontal.rotation.z = side * Math.PI / 2.5;
      group.add(horizontal);

      const vert = new THREE.Mesh(
        new THREE.CylinderGeometry(armR * 0.7, armR * 0.9, armH, 5, 1),
        mat(pal.leaf, { roughness: 0.5 })
      );
      vert.position.set(
        Math.cos(armAngle) * mainR * 3.2,
        armY + armH / 2,
        Math.sin(armAngle) * mainR * 3.2
      );
      group.add(vert);
    }
  }

  if (growth >= 6) {
    const flowerSize = 0.08 + Math.min(growth - 6, 6) * 0.015;
    const cFlower = new THREE.Mesh(
      lp(flowerSize, 0),
      mat(pal.bloom, { emissive: streak >= 3 ? pal.glow : 0x000000, emissiveIntensity: streak >= 3 ? 0.6 : 0 })
    );
    cFlower.position.y = mainH + flowerSize;
    group.add(cFlower);
  }
}

function buildMushroom(group, growth, streak, pal, rng) {
  const stemH = 0.15 + growth * 0.1;
  const stemR = 0.04 + growth * 0.005;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(stemR * 0.7, stemR, stemH, 5, 1),
    mat(0xf0e8d8, { roughness: 0.4 })
  );
  stem.position.y = stemH / 2;
  group.add(stem);

  const capR = 0.15 + growth * 0.025;
  const capH = capR * 0.6;
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(capR, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(pal.bloom, {
      emissive: streak >= 3 ? pal.glow : 0x000000,
      emissiveIntensity: streak >= 3 ? 0.4 + Math.min(streak, 10) * 0.04 : 0,
      roughness: 0.3,
    })
  );
  cap.position.y = stemH;
  group.add(cap);

  if (growth >= 3) {
    const spotCount = Math.min(growth, 8);
    for (let s = 0; s < spotCount; s++) {
      const spot = new THREE.Mesh(
        lp(capR * 0.12, 0),
        mat(pal.accent, { roughness: 0.3 })
      );
      const theta = rng() * Math.PI * 0.45;
      const phi = rng() * Math.PI * 2;
      spot.position.set(
        Math.sin(theta) * Math.cos(phi) * capR * 0.95,
        stemH + Math.cos(theta) * capR * 0.95,
        Math.sin(theta) * Math.sin(phi) * capR * 0.95
      );
      spot.scale.set(1, 0.4, 1);
      group.add(spot);
    }
  }

  if (growth >= 6) {
    for (let b = 0; b < 2; b++) {
      const babyH = stemH * 0.4;
      const babyR = capR * 0.4;
      const angle = rng() * Math.PI * 2;
      const dist = 0.25 + rng() * 0.15;

      const babyStem = new THREE.Mesh(
        new THREE.CylinderGeometry(stemR * 0.4, stemR * 0.5, babyH, 4, 1),
        mat(0xf0e8d8, { roughness: 0.4 })
      );
      babyStem.position.set(Math.cos(angle) * dist, babyH / 2, Math.sin(angle) * dist);
      group.add(babyStem);

      const babyCap = new THREE.Mesh(
        new THREE.SphereGeometry(babyR, 5, 3, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(pal.bloom, { emissive: streak >= 5 ? pal.glow : 0x000000, emissiveIntensity: streak >= 5 ? 0.3 : 0, roughness: 0.3 })
      );
      babyCap.position.set(Math.cos(angle) * dist, babyH, Math.sin(angle) * dist);
      group.add(babyCap);
    }
  }
}

function buildCrystal(group, growth, streak, pal, rng) {
  const shardCount = Math.min(1 + growth, 7);
  const baseH = 0.2 + growth * 0.12;

  for (let s = 0; s < shardCount; s++) {
    const h = baseH * (0.4 + rng() * 0.8);
    const r = 0.04 + rng() * 0.05;
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 4 + Math.floor(rng() * 3), 1),
      mat(s === 0 ? pal.bloom : pal.leaf, {
        roughness: 0.15,
        metalness: 0.3,
        emissive: streak >= 2 ? pal.glow : 0x000000,
        emissiveIntensity: streak >= 2 ? 0.3 + Math.min(streak, 10) * 0.06 : 0,
        transparent: true,
        opacity: 0.85,
      })
    );
    const angle = s === 0 ? 0 : (s / (shardCount - 1)) * Math.PI * 2 + rng();
    const dist = s === 0 ? 0 : 0.08 + rng() * 0.15;
    shard.position.set(Math.cos(angle) * dist, h / 2, Math.sin(angle) * dist);
    shard.rotation.set((rng() - 0.5) * 0.3, rng() * Math.PI, (rng() - 0.5) * 0.3);
    group.add(shard);
  }

  if (growth >= 8) {
    const orbR = 0.06 + Math.min(growth - 8, 4) * 0.01;
    const orb = new THREE.Mesh(
      lp(orbR, 1),
      mat(pal.accent, {
        emissive: pal.glow,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.4,
        transparent: true,
        opacity: 0.9,
      })
    );
    orb.position.y = baseH + 0.15;
    group.add(orb);
  }
}

const builders = { flower: buildFlower, tree: buildTree, cactus: buildCactus, mushroom: buildMushroom, crystal: buildCrystal };

export function createPlant(habit) {
  const rng = seededRandom(habit.id);
  const pal = PALETTES[Math.floor(rng() * PALETTES.length)];
  const type = PLANT_TYPES[Math.floor(rng() * PLANT_TYPES.length)];
  const group = new THREE.Group();
  group.userData.habitId = habit.id;

  const growth = Math.min(habit.totalCompletions, 12);
  const streak = habit.streakCount;

  addMound(group, growth, rng);

  if (growth === 0) {
    const seed = new THREE.Mesh(lp(0.08, 0), mat(pal.leaf));
    seed.position.y = 0.08;
    group.add(seed);
    return group;
  }

  builders[type](group, growth, streak, pal, rng);

  const done = habit.lastCompletedDate === new Date().toISOString().slice(0, 10);
  if (!done && habit.totalCompletions > 0) {
    group.traverse(child => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.color.lerp(new THREE.Color(0x555555), 0.35);
        child.material.emissiveIntensity *= 0.3;
      }
    });
  }

  return group;
}
