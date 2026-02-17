import * as THREE from 'three';
import { createPlant, Habit } from './plant.js';
import { getHabits, addHabit, completeHabit, deleteHabit, getPublicGarden, isLoggedIn, clearAuth, getUserId } from './api.js';
import { showAuthOverlay } from './auth-ui.js';

const canvas = document.getElementById('garden') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x7ec8e3);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x7ec8e3, 0.025);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 10);
camera.lookAt(0, 1, 0);

scene.add(new THREE.HemisphereLight(0xaaddff, 0x556633, 1.2));

const sun = new THREE.DirectionalLight(0xfff0dd, 2.5);
sun.position.set(4, 10, 6);
scene.add(sun);

const backLight = new THREE.DirectionalLight(0x88bbff, 1.0);
backLight.position.set(-6, 8, -4);
scene.add(backLight);

const warmFill = new THREE.PointLight(0xffaa66, 1.2, 20);
warmFill.position.set(4, 3, 4);
scene.add(warmFill);

const coolFill = new THREE.PointLight(0x66aaff, 0.8, 20);
coolFill.position.set(-4, 3, -4);
scene.add(coolFill);

const gardenGlow = new THREE.PointLight(0xa8e6cf, 0.6, 15);
gardenGlow.position.set(0, 1, 0);
scene.add(gardenGlow);

const rimLight = new THREE.SpotLight(0xffeebb, 1.5, 25, Math.PI / 5, 0.4);
rimLight.position.set(-4, 10, 8);
rimLight.target.position.set(0, 0, 0);
scene.add(rimLight);
scene.add(rimLight.target);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(10, 8),
  new THREE.MeshStandardMaterial({ color: 0x3d5a3a, flatShading: true, roughness: 0.85, metalness: 0.02 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.2;
scene.add(ground);

const skyGeo = new THREE.IcosahedronGeometry(40, 2);
const skyMat = new THREE.MeshBasicMaterial({ color: 0x88ccee, side: THREE.BackSide });
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

const sunGeo = new THREE.IcosahedronGeometry(2, 1);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.set(15, 20, -10);
scene.add(sunMesh);

const sunGlowGeo = new THREE.IcosahedronGeometry(3, 1);
const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xfffacc, transparent: true, opacity: 0.3 });
const sunGlowMesh = new THREE.Mesh(sunGlowGeo, sunGlowMat);
sunGlowMesh.position.copy(sunMesh.position);
scene.add(sunGlowMesh);

function createCloud(x: number, y: number, z: number, scale: number): THREE.Group {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.8,
  });
  const blobCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blobCount; i++) {
    const r = 0.8 + Math.random() * 1.0;
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), cloudMat);
    blob.position.set((i - blobCount / 2) * 1.1, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.6);
    blob.scale.set(1.2, 0.45 + Math.random() * 0.25, 0.9);
    group.add(blob);
  }
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  return group;
}

const clouds = [
  createCloud(-12, 4.5, -8, 1.4),
  createCloud(10, 5, -10, 1.6),
  createCloud(20, 4, -6, 1.1),
  createCloud(-18, 5.5, -12, 1.2),
  createCloud(2, 6, -15, 1.5),
  createCloud(-7, 4, -5, 1.0),
  createCloud(15, 4.5, -14, 1.3),
];
clouds.forEach(c => scene.add(c));

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let plants: THREE.Group[] = [];
let habits: Habit[] = [];
let selectedHabitId: string | null = null;
let orbitAngle = 0;
let isPublicView = false;

function layoutPosition(index: number, total: number): THREE.Vector3 {
  if (total <= 1) return new THREE.Vector3(0, 0, 0);
  const radius = 1.5 + total * 0.3;
  const angle = (index / total) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

function rebuildScene(): void {
  plants.forEach(p => scene.remove(p));
  plants = [];
  habits.forEach((habit, i) => {
    const plant = createPlant(habit);
    plant.position.copy(layoutPosition(i, habits.length));
    scene.add(plant);
    plants.push(plant);
  });
  renderHabitList();
}

function renderHabitList(): void {
  const list = document.getElementById('habit-list')!;
  list.innerHTML = '';
  const today = new Date().toISOString().slice(0, 10);
  habits.forEach(habit => {
    const done = habit.lastCompletedDate === today;
    const el = document.createElement('div');
    el.className = 'habit-item' + (done ? ' habit-done' : '');
    el.innerHTML = `<span class="habit-dot" style="background:${done ? '#a8e6cf' : '#555'}"></span><span>${habit.name}</span>`;
    el.addEventListener('click', () => showDetail(habit.id));
    list.appendChild(el);
  });
}

function showDetail(id: string): void {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  selectedHabitId = id;
  document.getElementById('detail-name')!.textContent = habit.name;
  document.getElementById('detail-streak')!.textContent = `Streak: ${habit.streakCount} days`;
  document.getElementById('detail-total')!.textContent = `Total: ${habit.totalCompletions} completions`;
  document.getElementById('detail')!.classList.remove('hidden');

  const btn = document.getElementById('detail-done') as HTMLButtonElement;
  btn.textContent = 'Done today';
  btn.disabled = false;

  // Hide action buttons in public view
  if (isPublicView) {
    btn.style.display = 'none';
    document.getElementById('detail-delete')!.style.display = 'none';
  } else {
    btn.style.display = '';
    document.getElementById('detail-delete')!.style.display = '';
  }
}

async function loadHabits(): Promise<void> {
  habits = await getHabits();
  rebuildScene();
}

async function loadPublicGarden(userId: string): Promise<void> {
  habits = await getPublicGarden(userId);
  rebuildScene();
}

// Detect public garden route: /garden/:userId
const gardenMatch = window.location.pathname.match(/^\/garden\/([^/]+)$/);

if (gardenMatch) {
  // Public view
  isPublicView = true;
  document.getElementById('ui')!.querySelector('h1')!.textContent = 'Shared Garden';
  document.getElementById('add-form')!.style.display = 'none';
  document.getElementById('toolbar')!.style.display = 'none';
  loadPublicGarden(gardenMatch[1]);
} else if (isLoggedIn()) {
  document.getElementById('toolbar')!.style.display = '';
  loadHabits();
} else {
  showAuthOverlay(() => {
    document.getElementById('toolbar')!.style.display = '';
    loadHabits();
  });
}

// Add habit form
document.getElementById('add-form')!.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('habit-input') as HTMLInputElement;
  if (!input.value.trim()) return;
  await addHabit(input.value.trim());
  input.value = '';
  await loadHabits();
});

// Detail panel: complete
document.getElementById('detail-done')!.addEventListener('click', async () => {
  if (!selectedHabitId) return;
  await completeHabit(selectedHabitId);
  await loadHabits();
  showDetail(selectedHabitId);
});

// Detail panel: close
document.getElementById('detail-close')!.addEventListener('click', () => {
  document.getElementById('detail')!.classList.add('hidden');
  selectedHabitId = null;
});

// Detail panel: delete
document.getElementById('detail-delete')!.addEventListener('click', async () => {
  if (!selectedHabitId) return;
  await deleteHabit(selectedHabitId);
  document.getElementById('detail')!.classList.add('hidden');
  selectedHabitId = null;
  await loadHabits();
});

// Share button
document.getElementById('btn-share')?.addEventListener('click', () => {
  const userId = getUserId();
  if (!userId) return;
  const url = `${window.location.origin}/garden/${userId}`;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('btn-share')!;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Share'; }, 2000);
  });
});

// Logout button
document.getElementById('btn-logout')?.addEventListener('click', () => {
  clearAuth();
  window.location.reload();
});

// 3D click to select plant
canvas.addEventListener('click', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(plants, true);
  if (hit.length) {
    let obj: THREE.Object3D = hit[0].object;
    while (obj.parent && !obj.userData.habitId) obj = obj.parent;
    if (obj.userData.habitId) showDetail(obj.userData.habitId);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate(): void {
  requestAnimationFrame(animate);
  orbitAngle += 0.0008;
  camera.position.set(Math.sin(orbitAngle) * 9, 4.5 + Math.sin(orbitAngle * 0.5) * 0.5, Math.cos(orbitAngle) * 9);
  camera.lookAt(0, 1, 0);

  const t = Date.now() * 0.001;
  plants.forEach((p, i) => {
    p.rotation.y = Math.sin(t + i * 1.5) * 0.015;
    p.children.forEach((c, j) => {
      if (j > 0) c.rotation.z += Math.sin(t * 0.8 + j * 0.7) * 0.0003;
    });
  });

  gardenGlow.intensity = 0.3 + Math.sin(t * 0.5) * 0.05;

  clouds.forEach((c, i) => {
    c.position.x += 0.003 * (0.8 + i * 0.1);
    if (c.position.x > 22) c.position.x = -22;
  });

  renderer.render(scene, camera);
}

animate();
